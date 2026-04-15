import { z } from 'zod';

export const checklistItemSchema = z.object({
  id: z.string(),
  checklistId: z.string(),
  text: z.string(),
  done: z.boolean(),
  position: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ChecklistItem = z.infer<typeof checklistItemSchema>;

export const checklistSchema = z.object({
  id: z.string(),
  cardId: z.string(),
  title: z.string(),
  position: z.number(),
  items: z.array(checklistItemSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Checklist = z.infer<typeof checklistSchema>;

export const createChecklistSchema = z.object({
  title: z.string().min(1).max(120),
});
export type CreateChecklistInput = z.infer<typeof createChecklistSchema>;

export const updateChecklistSchema = z.object({
  title: z.string().min(1).max(120).optional(),
});
export type UpdateChecklistInput = z.infer<typeof updateChecklistSchema>;

export const createChecklistItemSchema = z.object({
  text: z.string().min(1).max(500),
});
export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;

export const updateChecklistItemSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  done: z.boolean().optional(),
  position: z.number().optional(),
});
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
