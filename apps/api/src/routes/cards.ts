import { Router } from 'express';
import {
  createCardSchema,
  updateCardSchema,
  moveCardSchema,
} from '@trello-clone/shared';
import { prisma } from '../lib/prisma.js';
import { notFound, badRequest } from '../lib/errors.js';
import { mapCardSummary, mapCardDetail } from '../services/mappers.js';
import { cardSummaryInclude, cardDetailInclude } from '../services/includes.js';
import {
  nextCardPosition,
  rebalanceListCards,
} from '../services/position.js';
import { needsRebalance } from '@trello-clone/shared';
import { logActivity } from '../services/activity.js';

const router = Router({ mergeParams: true });

// Create a card inside a list.
// POST /lists/:listId/cards
router.post('/lists/:listId/cards', async (req, res) => {
  const input = createCardSchema.parse(req.body);
  const list = await prisma.list.findUnique({ where: { id: req.params.listId } });
  if (!list) throw notFound('List');

  const card = await prisma.$transaction(async (tx) => {
    const position = input.position ?? (await nextCardPosition(tx, list.id));
    const c = await tx.card.create({
      data: {
        boardId: list.boardId,
        listId: list.id,
        title: input.title,
        position,
      },
      include: cardSummaryInclude,
    });
    await logActivity(tx, {
      boardId: list.boardId,
      actorId: req.userId,
      cardId: c.id,
      listId: list.id,
      type: 'card.created',
      payload: { title: c.title, listTitle: list.title },
    });
    return c;
  });

  res.status(201).json({ card: mapCardSummary(card) });
});

// Full card detail.
router.get('/cards/:cardId', async (req, res) => {
  const card = await prisma.card.findUnique({
    where: { id: req.params.cardId },
    include: cardDetailInclude,
  });
  if (!card) throw notFound('Card');
  res.json({ card: mapCardDetail(card) });
});

router.patch('/cards/:cardId', async (req, res) => {
  const input = updateCardSchema.parse(req.body);
  const existing = await prisma.card.findUnique({ where: { id: req.params.cardId } });
  if (!existing) throw notFound('Card');

  const card = await prisma.$transaction(async (tx) => {
    const updated = await tx.card.update({
      where: { id: existing.id },
      data: {
        title: input.title ?? undefined,
        description: input.description ?? undefined,
        dueAt:
          input.dueAt === undefined
            ? undefined
            : input.dueAt
              ? new Date(input.dueAt)
              : null,
        dueComplete: input.dueComplete ?? undefined,
        coverType:
          input.cover === undefined ? undefined : input.cover === null ? null : input.cover.type,
        coverValue:
          input.cover === undefined ? undefined : input.cover === null ? null : input.cover.value,
        archivedAt:
          input.archivedAt === undefined
            ? undefined
            : input.archivedAt
              ? new Date(input.archivedAt)
              : null,
      },
      include: cardDetailInclude,
    });

    if (input.title && input.title !== existing.title) {
      await logActivity(tx, {
        boardId: existing.boardId,
        actorId: req.userId,
        cardId: existing.id,
        type: 'card.renamed',
        payload: { from: existing.title, to: input.title },
      });
    }
    if (input.archivedAt === null && existing.archivedAt) {
      await logActivity(tx, {
        boardId: existing.boardId,
        actorId: req.userId,
        cardId: existing.id,
        type: 'card.unarchived',
        payload: { title: existing.title },
      });
    }
    if (input.archivedAt && !existing.archivedAt) {
      await logActivity(tx, {
        boardId: existing.boardId,
        actorId: req.userId,
        cardId: existing.id,
        type: 'card.archived',
        payload: { title: existing.title },
      });
    }
    return updated;
  });

  res.json({ card: mapCardDetail(card) });
});

// Move a card — either reorder within the same list or move to another list.
router.patch('/cards/:cardId/move', async (req, res) => {
  const { listId, position } = moveCardSchema.parse(req.body);
  const existing = await prisma.card.findUnique({ where: { id: req.params.cardId } });
  if (!existing) throw notFound('Card');
  const targetList = await prisma.list.findUnique({ where: { id: listId } });
  if (!targetList) throw notFound('Target list');
  if (targetList.boardId !== existing.boardId) throw badRequest('Cross-board moves are not supported');

  const card = await prisma.$transaction(async (tx) => {
    const prevListId = existing.listId;
    const updated = await tx.card.update({
      where: { id: existing.id },
      data: { listId, position },
      include: cardSummaryInclude,
    });

    // Rebalance affected lists when neighbours collapse.
    const neighbours = await tx.card.findMany({
      where: { listId, archivedAt: null, NOT: { id: existing.id } },
      select: { position: true },
      orderBy: { position: 'asc' },
    });
    const collision = neighbours.some((n) => needsRebalance(n.position, position));
    if (collision) await rebalanceListCards(tx, listId);

    if (prevListId !== listId) {
      const prevList = await tx.list.findUnique({ where: { id: prevListId } });
      await logActivity(tx, {
        boardId: existing.boardId,
        actorId: req.userId,
        cardId: existing.id,
        listId,
        type: 'card.moved',
        payload: {
          title: existing.title,
          fromListId: prevListId,
          fromListTitle: prevList?.title,
          toListId: listId,
          toListTitle: targetList.title,
        },
      });
    }
    return updated;
  });

  res.json({ card: mapCardSummary(card) });
});

router.delete('/cards/:cardId', async (req, res) => {
  const existing = await prisma.card.findUnique({ where: { id: req.params.cardId } });
  if (!existing) throw notFound('Card');
  await prisma.card.delete({ where: { id: existing.id } });
  res.status(204).end();
});

// Labels on card
router.post('/cards/:cardId/labels/:labelId', async (req, res) => {
  const card = await prisma.card.findUnique({ where: { id: req.params.cardId } });
  if (!card) throw notFound('Card');
  const label = await prisma.label.findUnique({ where: { id: req.params.labelId } });
  if (!label) throw notFound('Label');

  await prisma.$transaction(async (tx) => {
    await tx.cardLabel.upsert({
      where: { cardId_labelId: { cardId: card.id, labelId: label.id } },
      update: {},
      create: { cardId: card.id, labelId: label.id },
    });
    await logActivity(tx, {
      boardId: card.boardId,
      actorId: req.userId,
      cardId: card.id,
      type: 'label.added',
      payload: { labelName: label.name, color: label.color },
    });
  });

  const fresh = await prisma.card.findUnique({
    where: { id: card.id },
    include: cardSummaryInclude,
  });
  res.json({ card: mapCardSummary(fresh!) });
});

router.delete('/cards/:cardId/labels/:labelId', async (req, res) => {
  const card = await prisma.card.findUnique({ where: { id: req.params.cardId } });
  if (!card) throw notFound('Card');
  const label = await prisma.label.findUnique({ where: { id: req.params.labelId } });
  if (!label) throw notFound('Label');

  await prisma.$transaction(async (tx) => {
    await tx.cardLabel.deleteMany({ where: { cardId: card.id, labelId: label.id } });
    await logActivity(tx, {
      boardId: card.boardId,
      actorId: req.userId,
      cardId: card.id,
      type: 'label.removed',
      payload: { labelName: label.name, color: label.color },
    });
  });

  const fresh = await prisma.card.findUnique({
    where: { id: card.id },
    include: cardSummaryInclude,
  });
  res.json({ card: mapCardSummary(fresh!) });
});

// Members on card
router.post('/cards/:cardId/members/:userId', async (req, res) => {
  const card = await prisma.card.findUnique({ where: { id: req.params.cardId } });
  if (!card) throw notFound('Card');
  const user = await prisma.user.findUnique({ where: { id: req.params.userId } });
  if (!user) throw notFound('User');

  await prisma.$transaction(async (tx) => {
    await tx.cardMember.upsert({
      where: { cardId_userId: { cardId: card.id, userId: user.id } },
      update: {},
      create: { cardId: card.id, userId: user.id },
    });
    await logActivity(tx, {
      boardId: card.boardId,
      actorId: req.userId,
      cardId: card.id,
      type: 'member.added',
      payload: { memberName: user.displayName },
    });
  });

  const fresh = await prisma.card.findUnique({
    where: { id: card.id },
    include: cardSummaryInclude,
  });
  res.json({ card: mapCardSummary(fresh!) });
});

router.delete('/cards/:cardId/members/:userId', async (req, res) => {
  const card = await prisma.card.findUnique({ where: { id: req.params.cardId } });
  if (!card) throw notFound('Card');
  const user = await prisma.user.findUnique({ where: { id: req.params.userId } });
  if (!user) throw notFound('User');

  await prisma.$transaction(async (tx) => {
    await tx.cardMember.deleteMany({ where: { cardId: card.id, userId: user.id } });
    await logActivity(tx, {
      boardId: card.boardId,
      actorId: req.userId,
      cardId: card.id,
      type: 'member.removed',
      payload: { memberName: user.displayName },
    });
  });

  const fresh = await prisma.card.findUnique({
    where: { id: card.id },
    include: cardSummaryInclude,
  });
  res.json({ card: mapCardSummary(fresh!) });
});

export default router;
