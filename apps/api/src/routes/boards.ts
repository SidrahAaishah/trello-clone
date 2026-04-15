import { Router } from 'express';
import {
  createBoardSchema,
  updateBoardSchema,
  LABEL_COLORS,
  BOARD_BG_PRESETS,
  POSITION_STEP,
} from '@trello-clone/shared';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import { mapBoard, mapList, mapMember, mapCardSummary } from '../services/mappers.js';
import { cardSummaryInclude } from '../services/includes.js';
import { logActivity } from '../services/activity.js';

const router = Router();

// List all boards (owned or member-of).
router.get('/', async (req, res) => {
  const boards = await prisma.board.findMany({
    where: {
      OR: [
        { ownerId: req.userId },
        { members: { some: { userId: req.userId } } },
      ],
    },
    orderBy: [{ starred: 'desc' }, { updatedAt: 'desc' }],
  });
  res.json({ boards: boards.map(mapBoard) });
});

router.post('/', async (req, res) => {
  const input = createBoardSchema.parse(req.body);
  const bg = input.background ?? { type: 'color', value: BOARD_BG_PRESETS[0] };

  const board = await prisma.$transaction(async (tx) => {
    const b = await tx.board.create({
      data: {
        title: input.title,
        ownerId: req.userId,
        backgroundType: bg.type,
        backgroundValue: bg.value,
        members: { create: { userId: req.userId, role: 'owner' } },
        // Seed a board with 3 starter lists so it's usable immediately.
        lists: {
          create: ['To Do', 'In Progress', 'Done'].map((t, i) => ({
            title: t,
            position: (i + 1) * POSITION_STEP,
          })),
        },
        labels: {
          create: LABEL_COLORS.map((c) => ({ color: c, name: '' })),
        },
      },
    });
    await logActivity(tx, {
      boardId: b.id,
      actorId: req.userId,
      type: 'board.created',
      payload: { title: b.title },
    });
    return b;
  });

  res.status(201).json({ board: mapBoard(board) });
});

// Full board payload used by the board page: board + lists + members.
router.get('/:id', async (req, res) => {
  const board = await prisma.board.findFirst({
    where: { id: req.params.id },
    include: {
      members: { include: { user: true } },
      lists: {
        where: { archivedAt: null },
        orderBy: { position: 'asc' },
      },
    },
  });
  if (!board) throw notFound('Board');
  res.json({
    board: mapBoard(board),
    lists: board.lists.map(mapList),
    members: board.members.map((m) => mapMember(m.user)),
  });
});

router.patch('/:id', async (req, res) => {
  const input = updateBoardSchema.parse(req.body);
  const existing = await prisma.board.findFirst({ where: { id: req.params.id } });
  if (!existing) throw notFound('Board');

  const board = await prisma.board.update({
    where: { id: existing.id },
    data: {
      title: input.title ?? undefined,
      starred: input.starred ?? undefined,
      archivedAt:
        input.archivedAt === undefined ? undefined : input.archivedAt ? new Date(input.archivedAt) : null,
      backgroundType: input.background?.type,
      backgroundValue: input.background?.value,
    },
  });
  res.json({ board: mapBoard(board) });
});

// Archived lists + cards on a board — used by the Archived drawer.
router.get('/:id/archived', async (req, res) => {
  const board = await prisma.board.findFirst({ where: { id: req.params.id } });
  if (!board) throw notFound('Board');

  const [archivedLists, archivedCards] = await Promise.all([
    prisma.list.findMany({
      where: { boardId: board.id, archivedAt: { not: null } },
      orderBy: { archivedAt: 'desc' },
    }),
    prisma.card.findMany({
      where: { boardId: board.id, archivedAt: { not: null } },
      orderBy: { archivedAt: 'desc' },
      include: cardSummaryInclude,
    }),
  ]);

  res.json({
    lists: archivedLists.map(mapList),
    cards: archivedCards.map(mapCardSummary),
  });
});

router.delete('/:id', async (req, res) => {
  const existing = await prisma.board.findFirst({ where: { id: req.params.id } });
  if (!existing) throw notFound('Board');
  await prisma.board.delete({ where: { id: existing.id } });
  res.status(204).end();
});

export default router;
