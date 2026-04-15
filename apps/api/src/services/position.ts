import type { Prisma, PrismaClient } from '@prisma/client';
import {
  POSITION_STEP,
  needsRebalance,
  positionAfter,
  positionBetween,
} from '@trello-clone/shared';

type Tx = PrismaClient | Prisma.TransactionClient;

// When gap between neighbours collapses, rebalance all positions in the list.
export async function rebalanceListCards(tx: Tx, listId: string) {
  const cards = await tx.card.findMany({
    where: { listId, archivedAt: null },
    orderBy: { position: 'asc' },
    select: { id: true },
  });
  await Promise.all(
    cards.map((c, idx) =>
      tx.card.update({
        where: { id: c.id },
        data: { position: (idx + 1) * POSITION_STEP },
      }),
    ),
  );
}

export async function rebalanceBoardLists(tx: Tx, boardId: string) {
  const lists = await tx.list.findMany({
    where: { boardId, archivedAt: null },
    orderBy: { position: 'asc' },
    select: { id: true },
  });
  await Promise.all(
    lists.map((l, idx) =>
      tx.list.update({
        where: { id: l.id },
        data: { position: (idx + 1) * POSITION_STEP },
      }),
    ),
  );
}

export async function nextListPosition(tx: Tx, boardId: string): Promise<number> {
  const last = await tx.list.findFirst({
    where: { boardId, archivedAt: null },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  return last ? positionAfter(last.position) : POSITION_STEP;
}

export async function nextCardPosition(tx: Tx, listId: string): Promise<number> {
  const last = await tx.card.findFirst({
    where: { listId, archivedAt: null },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  return last ? positionAfter(last.position) : POSITION_STEP;
}

// Resolve a requested target position for a move within a list: we splice the
// card at `toIndex` (0-based) among siblings (excluding the moving card).
export async function resolveCardMovePosition(
  tx: Tx,
  listId: string,
  excludeCardId: string | null,
  toIndex: number,
): Promise<{ position: number; needsRebalance: boolean }> {
  const siblings = await tx.card.findMany({
    where: {
      listId,
      archivedAt: null,
      ...(excludeCardId ? { NOT: { id: excludeCardId } } : {}),
    },
    orderBy: { position: 'asc' },
    select: { id: true, position: true },
  });
  const clamped = Math.max(0, Math.min(toIndex, siblings.length));
  const prev = clamped === 0 ? null : siblings[clamped - 1];
  const next = clamped >= siblings.length ? null : siblings[clamped];

  let position: number;
  if (!prev && !next) position = POSITION_STEP;
  else if (!prev && next) position = next.position - POSITION_STEP;
  else if (prev && !next) position = prev.position + POSITION_STEP;
  else position = positionBetween(prev!.position, next!.position);

  const rebalance = prev && next ? needsRebalance(prev.position, next.position) : false;
  return { position, needsRebalance: rebalance };
}
