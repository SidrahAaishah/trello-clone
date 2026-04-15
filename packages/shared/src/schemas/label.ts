import { z } from 'zod';
import { LABEL_COLORS } from '../enums.js';

export const labelColorSchema = z.enum(LABEL_COLORS);

export const labelSchema = z.object({
  id: z.string(),
  boardId: z.string(),
  name: z.string(),
  color: labelColorSchema,
  createdAt: z.string().datetime(),
});
export type Label = z.infer<typeof labelSchema>;

export const createLabelSchema = z.object({
  name: z.string().max(60).default(''),
  color: labelColorSchema,
});
export type CreateLabelInput = z.infer<typeof createLabelSchema>;

export const updateLabelSchema = z.object({
  name: z.string().max(60).optional(),
  color: labelColorSchema.optional(),
});
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
