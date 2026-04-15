import { z } from 'zod';
import { backgroundSchema } from './common.js';

export const boardSchema = z.object({
  id: z.string(),
  title: z.string(),
  background: backgroundSchema,
  ownerId: z.string(),
  starred: z.boolean(),
  archivedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Board = z.infer<typeof boardSchema>;

export const createBoardSchema = z.object({
  title: z.string().min(1).max(80),
  background: backgroundSchema.optional(),
});
export type CreateBoardInput = z.infer<typeof createBoardSchema>;

export const updateBoardSchema = z.object({
  title: z.string().min(1).max(80).optional(),
  background: backgroundSchema.optional(),
  starred: z.boolean().optional(),
  archivedAt: z.string().datetime().nullable().optional(),
});
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
