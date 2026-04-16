import type {
  Template as PTemplate,
  TemplateList as PTemplateList,
  TemplateCard as PTemplateCard,
  TemplateLabel as PTemplateLabel,
  TemplateChecklist as PTemplateChecklist,
  TemplateChecklistItem as PTemplateChecklistItem,
  TemplateCardLabel as PTemplateCardLabel,
} from '@prisma/client';
import type {
  TemplateSummary,
  TemplateDetail,
  TemplateList,
  TemplateCard,
  TemplateLabel,
  TemplateChecklist,
  TemplateChecklistItem,
  TemplateCategory,
  LabelColor,
} from '@trello-clone/shared';

export const mapTemplateSummary = (t: PTemplate): TemplateSummary => ({
  id: t.id,
  title: t.title,
  description: t.description,
  category: t.category as TemplateCategory,
  coverImageUrl: t.coverImageUrl,
  coverGradient: t.coverGradient,
  isFeatured: t.isFeatured,
  isMostPopular: t.isMostPopular,
  useCount: t.useCount,
  boardBackground: {
    type: t.boardBackgroundType as 'color' | 'image' | 'gradient',
    value: t.boardBackgroundValue,
  },
  createdAt: t.createdAt.toISOString(),
  updatedAt: t.updatedAt.toISOString(),
});

export const mapTemplateLabel = (l: PTemplateLabel): TemplateLabel => ({
  id: l.id,
  templateId: l.templateId,
  name: l.name,
  color: l.color as LabelColor,
});

export const mapTemplateChecklistItem = (
  i: PTemplateChecklistItem,
): TemplateChecklistItem => ({
  id: i.id,
  checklistId: i.checklistId,
  text: i.text,
  done: i.done,
  position: i.position,
});

export const mapTemplateChecklist = (
  c: PTemplateChecklist & { items: PTemplateChecklistItem[] },
): TemplateChecklist => ({
  id: c.id,
  cardId: c.cardId,
  title: c.title,
  position: c.position,
  items: c.items
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(mapTemplateChecklistItem),
});

export type TemplateCardWithRelations = PTemplateCard & {
  labels: PTemplateCardLabel[];
  checklists: (PTemplateChecklist & { items: PTemplateChecklistItem[] })[];
};

export const mapTemplateCard = (c: TemplateCardWithRelations): TemplateCard => ({
  id: c.id,
  listId: c.listId,
  title: c.title,
  description: c.description,
  position: c.position,
  cover:
    c.coverType && c.coverValue
      ? { type: c.coverType as 'color' | 'image', value: c.coverValue }
      : null,
  labelIds: c.labels.map((l) => l.labelId),
  checklists: c.checklists
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(mapTemplateChecklist),
});

export type TemplateListWithRelations = PTemplateList & {
  cards: TemplateCardWithRelations[];
};

export const mapTemplateList = (l: TemplateListWithRelations): TemplateList => ({
  id: l.id,
  templateId: l.templateId,
  title: l.title,
  position: l.position,
  cards: l.cards
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(mapTemplateCard),
});

export type TemplateWithRelations = PTemplate & {
  lists: TemplateListWithRelations[];
  labels: PTemplateLabel[];
};

export const mapTemplateDetail = (t: TemplateWithRelations): TemplateDetail => ({
  ...mapTemplateSummary(t),
  lists: t.lists
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(mapTemplateList),
  labels: t.labels.map(mapTemplateLabel),
});
