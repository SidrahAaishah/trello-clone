import { z } from 'zod';
import { memberSchema } from './member.js';

export const commentSchema = z.object({
  id: z.string(),
  cardId: z.string(),
  authorId: z.string(),
  author: memberSchema.optional(),
  body: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Comment = z.infer<typeof commentSchema>;

export const createCommentSchema = z.object({
  body: z.string().min(1).max(5000),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const updateCommentSchema = z.object({
  body: z.string().min(1).max(5000),
});
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
