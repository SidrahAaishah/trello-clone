import { Router } from 'express';
import {
  createLabelSchema,
  updateLabelSchema,
} from '@trello-clone/shared';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import { mapLabel } from '../services/mappers.js';

const router = Router({ mergeParams: true });

// GET /boards/:boardId/labels
router.get('/', async (req, res) => {
  const labels = await prisma.label.findMany({
    where: { boardId: req.params.boardId },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ labels: labels.map(mapLabel) });
});

router.post('/', async (req, res) => {
  const input = createLabelSchema.parse(req.body);
  const label = await prisma.label.create({
    data: { boardId: req.params.boardId!, name: input.name, color: input.color },
  });
  res.status(201).json({ label: mapLabel(label) });
});

router.patch('/:labelId', async (req, res) => {
  const input = updateLabelSchema.parse(req.body);
  const existing = await prisma.label.findFirst({
    where: { id: req.params.labelId, boardId: req.params.boardId },
  });
  if (!existing) throw notFound('Label');
  const label = await prisma.label.update({
    where: { id: existing.id },
    data: { name: input.name ?? undefined, color: input.color ?? undefined },
  });
  res.json({ label: mapLabel(label) });
});

router.delete('/:labelId', async (req, res) => {
  const existing = await prisma.label.findFirst({
    where: { id: req.params.labelId, boardId: req.params.boardId },
  });
  if (!existing) throw notFound('Label');
  await prisma.label.delete({ where: { id: existing.id } });
  res.status(204).end();
});

export default router;
