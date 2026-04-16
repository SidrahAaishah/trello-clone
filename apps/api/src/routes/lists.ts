import { Router, Request, Response } from 'express';
import {
  createListSchema,
  updateListSchema,
  reorderListSchema,
} from '@trello-clone/shared';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import { mapList } from '../services/mappers.js';
import { mapCardSummary } from '../services/mappers.js';
import { cardSummaryInclude } from '../services/includes.js';
import {
  nextListPosition,
  rebalanceBoardLists,
} from '../services/position.js';
import { needsRebalance } from '@trello-clone/shared';
import { logActivity } from '../services/activity.js';

const router = Router({ mergeParams: true });

// GET /boards/:boardId/lists — include cards by default for the board page.
router.get('/', async (req: Request<any>, res: Response) => {
  const boardId = req.params.boardId!;
  const lists = await prisma.list.findMany({
    where: { boardId, archivedAt: null },
    orderBy: { position: 'asc' },
    include: {
      cards: {
        where: { archivedAt: null },
        orderBy: { position: 'asc' },
        include: cardSummaryInclude,
      },
    },
  });
  res.json({
    lists: lists.map((l) => ({
      ...mapList(l),
      cards: l.cards.map(mapCardSummary),
    })),
  });
});

router.post('/', async (req: Request<any>, res: Response) => {
  const boardId = req.params.boardId!;
  const input = createListSchema.parse(req.body);

  const list = await prisma.$transaction(async (tx) => {
    const position = input.position ?? (await nextListPosition(tx, boardId));
    const l = await tx.list.create({
      data: { boardId, title: input.title, position },
    });
    await logActivity(tx, {
      boardId,
      actorId: req.userId,
      listId: l.id,
      type: 'list.created',
      payload: { title: l.title },
    });
    return l;
  });

  res.status(201).json({ list: mapList(list) });
});

router.patch('/:listId', async (req: Request<any>, res: Response) => {
  const input = updateListSchema.parse(req.body);
  const existing = await prisma.list.findFirst({
    where: { id: req.params.listId, boardId: req.params.boardId },
  });
  if (!existing) throw notFound('List');

  const list = await prisma.$transaction(async (tx) => {
    const updated = await tx.list.update({
      where: { id: existing.id },
      data: {
        title: input.title ?? undefined,
        archivedAt:
          input.archivedAt === undefined
            ? undefined
            : input.archivedAt
              ? new Date(input.archivedAt)
              : null,
      },
    });
    if (input.archivedAt) {
      await logActivity(tx, {
        boardId: existing.boardId,
        actorId: req.userId,
        listId: existing.id,
        type: 'list.archived',
        payload: { title: existing.title },
      });
    }
    return updated;
  });

  res.json({ list: mapList(list) });
});

// Reorder list: target is a float position. Caller computes prev/next average.
router.patch('/:listId/position', async (req: Request<any>, res: Response) => {
  const { position } = reorderListSchema.parse(req.body);
  const existing = await prisma.list.findFirst({
    where: { id: req.params.listId, boardId: req.params.boardId },
  });
  if (!existing) throw notFound('List');

  const list = await prisma.$transaction(async (tx) => {
    const updated = await tx.list.update({
      where: { id: existing.id },
      data: { position },
    });
    // If caller-supplied position collides with a neighbour, rebalance.
    const neighbours = await tx.list.findMany({
      where: { boardId: existing.boardId, archivedAt: null, NOT: { id: existing.id } },
      select: { position: true },
      orderBy: { position: 'asc' },
    });
    const tooTight = neighbours.some((n) => Math.abs(n.position - position) < 0.0001 || needsRebalance(n.position, position));
    if (tooTight) await rebalanceBoardLists(tx, existing.boardId);
    return updated;
  });

  res.json({ list: mapList(list) });
});

export default router;