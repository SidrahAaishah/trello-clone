import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { mapLabel, mapMember } from '../services/mappers.js';

const router = Router();

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};
const endOfWeek = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(23, 59, 59, 999);
  return d;
};

router.get('/', async (req, res) => {
  const q = (req.query.q as string | undefined)?.trim();
  const boardId = req.query.boardId as string | undefined;
  const labelIds = ([] as string[]).concat((req.query.labelId as string | string[]) ?? []);
  const memberIds = ([] as string[]).concat((req.query.memberId as string | string[]) ?? []);
  const due = req.query.due as string | undefined;
  const limit = Math.min(Number(req.query.limit ?? 30), 100);

  const where: Prisma.CardWhereInput = {
    archivedAt: null,
    board: { archivedAt: null },
  };
  if (boardId) where.boardId = boardId;
  if (q) where.title = { contains: q, mode: 'insensitive' };
  if (labelIds.length) where.labels = { some: { labelId: { in: labelIds } } };
  if (memberIds.length) where.members = { some: { userId: { in: memberIds } } };

  if (due === 'none') where.dueAt = null;
  else if (due === 'overdue') where.AND = [{ dueAt: { lt: new Date() } }, { dueComplete: false }];
  else if (due === 'today')
    where.AND = [{ dueAt: { gte: startOfToday(), lte: endOfToday() } }];
  else if (due === 'week') where.dueAt = { lte: endOfWeek(), gte: new Date() };
  else if (due === 'complete') where.dueComplete = true;
  else if (due === 'incomplete') where.dueComplete = false;

  const cards = await prisma.card.findMany({
    where,
    take: limit,
    orderBy: [{ updatedAt: 'desc' }],
    include: {
      board: true,
      list: true,
      labels: { include: { label: true } },
      members: { include: { user: true } },
    },
  });

  res.json({
    cards: cards.map((c) => ({
      id: c.id,
      title: c.title,
      boardId: c.boardId,
      boardTitle: c.board.title,
      listId: c.listId,
      listTitle: c.list.title,
      dueAt: c.dueAt?.toISOString() ?? null,
      dueComplete: c.dueComplete,
      labels: c.labels.map((l) => mapLabel(l.label)),
      members: c.members.map((m) => mapMember(m.user)),
    })),
  });
});

export default router;
