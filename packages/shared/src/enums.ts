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

// Curated Unsplash photos offered as board backgrounds in the Create Board
// dialog. Kept small/optimized (w=1600) so they load fast on the board page.
export const BOARD_BG_IMAGES = [
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=80&auto=format&fit=crop',
] as const;

export const ACTIVITY_TYPES = [
  'board.created',
  'board.createdFromTemplate',
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

export const TEMPLATE_CATEGORIES = [
  'business',
  'design',
  'education',
  'marketing',
  'engineering',
  'sales',
] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

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
