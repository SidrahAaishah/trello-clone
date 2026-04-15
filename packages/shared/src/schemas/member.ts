import { z } from 'zod';

export const memberSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  initials: z.string(),
  avatarUrl: z.string().nullable(),
  color: z.string(),
});
export type Member = z.infer<typeof memberSchema>;
