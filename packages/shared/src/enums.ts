export const LABEL_COLORS = [
  'green',
  'yellow',
  'orange',
  'red',
  'purple',
  'blue',
  'sky',
  'lime',
  'pink',
  'black',
] as const;
export type LabelColor = (typeof LABEL_COLORS)[number];

export const LABEL_COLOR_HEX: Record<LabelColor, string> = {
  green: '#61BD4F',
  yellow: '#F2D600',
  orange: '#FF9F1A',
  red: '#EB5A46',
  purple: '#C377E0',
  blue: '#0079BF',
  sky: '#00C2E0',
  lime: '#51E898',
  pink: '#FF78CB',
  black: '#344563',
};

export const BOARD_BG_PRESETS = [
  '#0079BF',
  '#D29034',
  '#519839',
  '#B04632',
  '#89609E',
  '#CD5A91',
  '#4BBF6B',
  '#00AECC',
  '#838C91',
] as const;

export const ACTIVITY_TYPES = [
  'board.created',
  'list.created',
  'list.archived',
  'card.created',
  'card.moved',
  'card.archived',
  'card.unarchived',
  'card.renamed',
  'label.added',
  'label.removed',
  'member.added',
  'member.removed',
  'checklist.added',
  'comment.created',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const DUE_FILTER_OPTIONS = [
  'any',
  'none',
  'overdue',
  'today',
  'week',
  'complete',
  'incomplete',
] as const;
export type DueFilter = (typeof DUE_FILTER_OPTIONS)[number];
