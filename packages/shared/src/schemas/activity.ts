import { z } from 'zod';
import { ACTIVITY_TYPES } from '../enums.js';
import { memberSchema } from './member.js';

export const activityTypeSchema = z.enum(ACTIVITY_TYPES);

export const activitySchema = z.object({
  id: z.string(),
  boardId: z.string(),
  cardId: z.string().nullable(),
  listId: z.string().nullable(),
  actorId: z.string(),
  actor: memberSchema.optional(),
  type: activityTypeSchema,
  payload: z.record(z.unknown()),
  createdAt: z.string().datetime(),
});
export type Activity = z.infer<typeof activitySchema>;
