import type { Prisma } from '@prisma/client';

export const cardSummaryInclude = {
  labels: { include: { label: true } },
  members: { include: { user: true } },
  checklists: { include: { items: true } },
  _count: { select: { comments: true } },
} satisfies Prisma.CardInclude;

export const cardDetailInclude = {
  labels: { include: { label: true } },
  members: { include: { user: true } },
  checklists: { include: { items: true } },
  comments: { include: { author: true } },
  _count: { select: { comments: true } },
} satisfies Prisma.CardInclude;
