import { z } from 'zod';
import { labelSchema } from './label.js';
import { memberSchema } from './member.js';
import { checklistSchema } from './checklist.js';
import { commentSchema } from './comment.js';

export const cardCoverSchema = z
  .object({
    type: z.enum(['color', 'image']),
    value: z.string().min(1),
  })
  .nullable();
export type CardCover = z.infer<typeof cardCoverSchema>;

export const cardSummarySchema = z.object({
  id: z.string(),
  listId: z.string(),
  boardId: z.string(),
  title: z.string(),
  position: z.number(),
  dueAt: z.string().datetime().nullable(),
  dueComplete: z.boolean(),
  cover: cardCoverSchema,
  labels: z.array(labelSchema),
  members: z.array(memberSchema),
  checklistSummary: z.object({
    total: z.number(),
    done: z.number(),
  }),
  commentCount: z.number(),
  archivedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type CardSummary = z.infer<typeof cardSummarySchema>;

export const cardDetailSchema = cardSummarySchema.extend({
  description: z.string(),
  checklists: z.array(checklistSchema),
  comments: z.array(commentSchema),
});
export type CardDetail = z.infer<typeof cardDetailSchema>;

export const createCardSchema = z.object({
  title: z.string().min(1).max(500),
  position: z.number().optional(),
});
export type CreateCardInput = z.infer<typeof createCardSchema>;

export const updateCardSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(20000).optional(),
  dueAt: z.string().datetime().nullable().optional(),
  dueComplete: z.boolean().optional(),
  cover: cardCoverSchema.optional(),
  archivedAt: z.string().datetime().nullable().optional(),
});
export type UpdateCardInput = z.infer<typeof updateCardSchema>;

export const moveCardSchema = z.object({
  listId: z.string(),
  position: z.number(),
});
export type MoveCardInput = z.infer<typeof moveCardSchema>;
