import type { Prisma, PrismaClient } from '@prisma/client';
import type { ActivityType } from '@trello-clone/shared';

type Tx = PrismaClient | Prisma.TransactionClient;

export async function logActivity(
  tx: Tx,
  opts: {
    boardId: string;
    actorId: string;
    type: ActivityType;
    cardId?: string | null;
    listId?: string | null;
    payload?: Record<string, unknown>;
  },
) {
  await tx.activity.create({
    data: {
      boardId: opts.boardId,
      actorId: opts.actorId,
      cardId: opts.cardId ?? null,
      listId: opts.listId ?? null,
      type: opts.type,
      payload: (opts.payload ?? {}) as Prisma.InputJsonValue,
    },
  });
}
