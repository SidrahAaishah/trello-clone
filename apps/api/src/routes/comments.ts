import { Router } from 'express';
import {
  createCommentSchema,
  updateCommentSchema,
} from '@trello-clone/shared';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import { mapComment } from '../services/mappers.js';
import { logActivity } from '../services/activity.js';

const router = Router();

router.get('/cards/:cardId/comments', async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { cardId: req.params.cardId },
    orderBy: { createdAt: 'desc' },
    include: { author: true },
  });
  res.json({ comments: comments.map(mapComment) });
});

router.post('/cards/:cardId/comments', async (req, res) => {
  const input = createCommentSchema.parse(req.body);
  const card = await prisma.card.findUnique({ where: { id: req.params.cardId } });
  if (!card) throw notFound('Card');

  const comment = await prisma.$transaction(async (tx) => {
    const c = await tx.comment.create({
      data: {
        cardId: card.id,
        authorId: req.userId,
        body: input.body,
      },
      include: { author: true },
    });
    await logActivity(tx, {
      boardId: card.boardId,
      actorId: req.userId,
      cardId: card.id,
      type: 'comment.created',
      payload: { preview: input.body.slice(0, 140) },
    });
    return c;
  });

  res.status(201).json({ comment: mapComment(comment) });
});

router.patch('/comments/:commentId', async (req, res) => {
  const input = updateCommentSchema.parse(req.body);
  const existing = await prisma.comment.findUnique({
    where: { id: req.params.commentId },
  });
  if (!existing) throw notFound('Comment');
  const comment = await prisma.comment.update({
    where: { id: existing.id },
    data: { body: input.body },
    include: { author: true },
  });
  res.json({ comment: mapComment(comment) });
});

router.delete('/comments/:commentId', async (req, res) => {
  const existing = await prisma.comment.findUnique({
    where: { id: req.params.commentId },
  });
  if (!existing) throw notFound('Comment');
  await prisma.comment.delete({ where: { id: existing.id } });
  res.status(204).end();
});

export default router;
