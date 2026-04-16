import { POSITION_STEP, positionBetween, positionAfter, positionBefore } from '@trello-clone/shared';

export { POSITION_STEP, positionBetween, positionAfter, positionBefore };

// Given an array of items with `position`, compute the position to insert at index.
export function positionAtIndex<T extends { position: number }>(
  siblings: T[],
  index: number,
): number {
  const sorted = [...siblings].sort((a, b) => a.position - b.position);
  const clamped = Math.max(0, Math.min(index, sorted.length));
  if (sorted.length === 0) return POSITION_STEP;
  if (clamped === 0) return positionBefore(sorted[0]!.position);
  if (clamped >= sorted.length) return positionAfter(sorted[sorted.length - 1]!.position);
  return positionBetween(sorted[clamped - 1]!.position, sorted[clamped]!.position);
}