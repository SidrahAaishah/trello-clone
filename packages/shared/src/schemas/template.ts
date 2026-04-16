import { z } from 'zod';
import { backgroundSchema } from './common.js';
import { labelColorSchema } from './label.js';
import { TEMPLATE_CATEGORIES } from '../enums.js';

export const templateCategorySchema = z.enum(TEMPLATE_CATEGORIES);

export const templateChecklistItemSchema = z.object({
  id: z.string(),
  checklistId: z.string(),
  text: z.string(),
  done: z.boolean(),
  position: z.number(),
});
export type TemplateChecklistItem = z.infer<typeof templateChecklistItemSchema>;

export const templateChecklistSchema = z.object({
  id: z.string(),
  cardId: z.string(),
  title: z.string(),
  position: z.number(),
  items: z.array(templateChecklistItemSchema),
});
export type TemplateChecklist = z.infer<typeof templateChecklistSchema>;

export const templateLabelSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  name: z.string(),
  color: labelColorSchema,
});
export type TemplateLabel = z.infer<typeof templateLabelSchema>;

export const templateCardSchema = z.object({
  id: z.string(),
  listId: z.string(),
  title: z.string(),
  description: z.string(),
  position: z.number(),
  cover: z
    .object({
      type: z.enum(['color', 'image']),
      value: z.string().min(1),
    })
    .nullable(),
  labelIds: z.array(z.string()),
  checklists: z.array(templateChecklistSchema),
});
export type TemplateCard = z.infer<typeof templateCardSchema>;

export const templateListSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  title: z.string(),
  position: z.number(),
  cards: z.array(templateCardSchema),
});
export type TemplateList = z.infer<typeof templateListSchema>;

export const templateSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: templateCategorySchema,
  coverImageUrl: z.string().nullable(),
  coverGradient: z.string().nullable(),
  isFeatured: z.boolean(),
  isMostPopular: z.boolean(),
  useCount: z.number(),
  boardBackground: backgroundSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type TemplateSummary = z.infer<typeof templateSummarySchema>;

export const templateDetailSchema = templateSummarySchema.extend({
  lists: z.array(templateListSchema),
  labels: z.array(templateLabelSchema),
});
export type TemplateDetail = z.infer<typeof templateDetailSchema>;

export const listTemplatesQuerySchema = z.object({
  category: templateCategorySchema.optional(),
  featured: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
    .optional(),
});
export type ListTemplatesQuery = z.infer<typeof listTemplatesQuerySchema>;

export const instantiateTemplateInputSchema = z.object({
  title: z.string().min(1).max(80),
  includeCards: z.boolean().default(true),
});
export type InstantiateTemplateInput = z.infer<typeof instantiateTemplateInputSchema>;
