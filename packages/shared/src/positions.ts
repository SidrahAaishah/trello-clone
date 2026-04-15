// Fractional positioning helpers shared between web and api.
// Positions are doubles. We place a new item between two neighbours
// using (prev + next) / 2. First item uses STEP, appended items use last + STEP.
// When gap gets too small the server rebalances the affected list.

export const POSITION_STEP = 65536;
export const MIN_POSITION_GAP = 0.0001;

export function positionBefore(first: number): number {
  return first - POSITION_STEP;
}

export function positionAfter(last: number): number {
  return last + POSITION_STEP;
}

export function positionBetween(a: number, b: number): number {
  return (a + b) / 2;
}

export function needsRebalance(a: number, b: number): boolean {
  return Math.abs(b - a) < MIN_POSITION_GAP;
}
