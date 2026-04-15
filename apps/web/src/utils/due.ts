import {
  format,
  isBefore,
  isSameDay,
  isThisYear,
  isWithinInterval,
  startOfDay,
  endOfDay,
  addDays,
} from 'date-fns';

export type DueState = 'overdue' | 'today' | 'soon' | 'complete' | 'upcoming';

export function dueState(dueAt: string | null, complete: boolean): DueState | null {
  if (!dueAt) return null;
  if (complete) return 'complete';
  const d = new Date(dueAt);
  const now = new Date();
  if (isBefore(d, now) && !isSameDay(d, now)) return 'overdue';
  if (isSameDay(d, now)) return 'today';
  if (isWithinInterval(d, { start: startOfDay(now), end: endOfDay(addDays(now, 1)) })) return 'soon';
  return 'upcoming';
}

export function formatDueShort(dueAt: string): string {
  const d = new Date(dueAt);
  return isThisYear(d) ? format(d, 'MMM d') : format(d, 'MMM d, yyyy');
}

export function formatDueLong(dueAt: string): string {
  const d = new Date(dueAt);
  return format(d, "MMM d 'at' h:mm a");
}

export const dueBadgeClasses: Record<DueState, string> = {
  overdue: 'bg-[#EB5A46] text-white',
  today: 'bg-[#F2D600] text-on-surface',
  soon: 'bg-[#FFAB4A] text-on-surface',
  complete: 'bg-[#61BD4F] text-white',
  upcoming: 'bg-surface-container-high text-on-surface',
};
