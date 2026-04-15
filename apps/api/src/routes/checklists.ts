import { Router } from 'express';
import {
  createChecklistSchema,
  updateChecklistSchema,
  createChecklistItemSchema,
  updateChecklistItemSchema,
  POSITION_STEP,
  positionAfter,
} from '@trello-clone/shared';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import { mapChecklist, mapChecklistItem } from '../services/mappers.js';
import { logActivity } from '../services/activity.js';

const router = Router();

// Create checklist on card.
router.post('/cards/:cardId/checklists', async (req, res) => {
  const input = createChecklistSchema.parse(req.body);
  const card = await prisma.card.findUnique({ where: { id: req.params.cardId } });
  if (!card) throw notFound('Card');

  const last = await prisma.checklist.findFirst({
    where: { cardId: card.id },
    orderBy: { position: 'desc' },
  });
  const position = last ? positionAfter(last.position) : POSITION_STEP;

  const checklist = await prisma.$transaction(async (tx) => {
    const cl = await tx.checklist.create({
      data: { cardId: card.id, title: input.title, position },
      include: { items: true },
    });
    await logActivity(tx, {
      boardId: card.boardId,
      actorId: req.userId,
      cardId: card.id,
      type: 'checklist.added',
      payload: { title: cl.title },
    });
    return cl;
  });

  res.status(201).json({ checklist: mapChecklist(checklist) });
});

router.patch('/checklists/:checklistId', async (req, res) => {
  const input = updateChecklistSchema.parse(req.body);
  const existing = await prisma.checklist.findUnique({
    where: { id: req.params.checklistId },
  });
  if (!existing) throw notFound('Checklist');
  const checklist = await prisma.checklist.update({
    where: { id: existing.id },
    data: { title: input.title ?? undefined },
    include: { items: true },
  });
  res.json({ checklist: mapChecklist(checklist) });
});

router.delete('/checklists/:checklistId', async (req, res) => {
  const existing = await prisma.checklist.findUnique({
    where: { id: req.params.checklistId },
  });
  if (!existing) throw notFound('Checklist');
  await prisma.checklist.delete({ where: { id: existing.id } });
  res.status(204).end();
});

// Items
router.post('/checklists/:checklistId/items', async (req, res) => {
  const input = createChecklistItemSchema.parse(req.body);
  const checklist = await prisma.checklist.findUnique({
    where: { id: req.params.checklistId },
  });
  if (!checklist) throw notFound('Checklist');

  const last = await prisma.checklistItem.findFirst({
    where: { checklistId: checklist.id },
    orderBy: { position: 'desc' },
  });
  const position = last ? positionAfter(last.position) : POSITION_STEP;

  const item = await prisma.checklistItem.create({
    data: {
      checklistId: checklist.id,
      text: input.text,
      position,
    },
  });
  res.status(201).json({ item: mapChecklistItem(item) });
});

router.patch('/checklist-items/:itemId', async (req, res) => {
  const input = updateChecklistItemSchema.parse(req.body);
  const existing = await prisma.checklistItem.findUnique({
    where: { id: req.params.itemId },
  });
  if (!existing) throw notFound('Checklist item');
  const item = await prisma.checklistItem.update({
    where: { id: existing.id },
    data: {
      text: input.text ?? undefined,
      done: input.done ?? undefined,
      position: input.position ?? undefined,
    },
  });
  res.json({ item: mapChecklistItem(item) });
});

router.delete('/checklist-items/:itemId', async (req, res) => {
  const existing = await prisma.checklistItem.findUnique({
    where: { id: req.params.itemId },
  });
  if (!existing) throw notFound('Checklist item');
  await prisma.checklistItem.delete({ where: { id: existing.id } });
  res.status(204).end();
});

export default router;
