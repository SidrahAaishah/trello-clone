import { z } from 'zod';

export const idSchema = z.string().min(1);
export const isoDateSchema = z.string().datetime();

export const errorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ApiError = z.infer<typeof errorSchema>;

export const backgroundSchema = z.object({
  type: z.enum(['color', 'image']),
  value: z.string().min(1),
});
export type Background = z.infer<typeof backgroundSchema>;
