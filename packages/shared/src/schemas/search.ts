import { z } from 'zod';
import { DUE_FILTER_OPTIONS } from '../enums.js';
import { labelSchema } from './label.js';
import { memberSchema } from './member.js';

export const dueFilterSchema = z.enum(DUE_FILTER_OPTIONS);

export const searchQuerySchema = z.object({
  q: z.string().optional(),
  boardId: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  memberIds: z.array(z.string()).optional(),
  due: dueFilterSchema.optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;

export const cardSearchHitSchema = z.object({
  id: z.string(),
  title: z.string(),
  boardId: z.string(),
  boardTitle: z.string(),
  listId: z.string(),
  listTitle: z.string(),
  dueAt: z.string().datetime().nullable(),
  dueComplete: z.boolean(),
  labels: z.array(labelSchema),
  members: z.array(memberSchema),
});
export type CardSearchHit = z.infer<typeof cardSearchHitSchema>;

export const searchResultSchema = z.object({
  cards: z.array(cardSearchHitSchema),
});
export type SearchResult = z.infer<typeof searchResultSchema>;
