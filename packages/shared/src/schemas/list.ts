import { z } from 'zod';

export const listSchema = z.object({
  id: z.string(),
  boardId: z.string(),
  title: z.string(),
  position: z.number(),
  archivedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type List = z.infer<typeof listSchema>;

export const createListSchema = z.object({
  title: z.string().min(1).max(120),
  position: z.number().optional(),
});
export type CreateListInput = z.infer<typeof createListSchema>;

export const updateListSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  archivedAt: z.string().datetime().nullable().optional(),
});
export type UpdateListInput = z.infer<typeof updateListSchema>;

export const reorderListSchema = z.object({
  position: z.number(),
});
export type ReorderListInput = z.infer<typeof reorderListSchema>;
