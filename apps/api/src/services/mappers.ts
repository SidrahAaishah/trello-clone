import type {
  Board as PBoard,
  List as PList,
  Card as PCard,
  Label as PLabel,
  User as PUser,
  Checklist as PChecklist,
  ChecklistItem as PChecklistItem,
  Comment as PComment,
  Activity as PActivity,
} from '@prisma/client';
import type {
  Board,
  List,
  CardSummary,
  CardDetail,
  Label,
  Member,
  Checklist,
  ChecklistItem,
  Comment,
  Activity,
  LabelColor,
  ActivityType,
} from '@trello-clone/shared';

export const mapMember = (u: PUser): Member => ({
  id: u.id,
  displayName: u.displayName,
  initials: u.initials,
  avatarUrl: u.avatarUrl,
  color: u.color,
});

export const mapBoard = (b: PBoard): Board => ({
  id: b.id,
  title: b.title,
  background: { type: b.backgroundType as 'color' | 'image', value: b.backgroundValue },
  ownerId: b.ownerId,
  starred: b.starred,
  archivedAt: b.archivedAt?.toISOString() ?? null,
  createdAt: b.createdAt.toISOString(),
  updatedAt: b.updatedAt.toISOString(),
});

export const mapList = (l: PList): List => ({
  id: l.id,
  boardId: l.boardId,
  title: l.title,
  position: l.position,
  archivedAt: l.archivedAt?.toISOString() ?? null,
  createdAt: l.createdAt.toISOString(),
  updatedAt: l.updatedAt.toISOString(),
});

export const mapLabel = (l: PLabel): Label => ({
  id: l.id,
  boardId: l.boardId,
  name: l.name,
  color: l.color as LabelColor,
  createdAt: l.createdAt.toISOString(),
});

export const mapChecklistItem = (i: PChecklistItem): ChecklistItem => ({
  id: i.id,
  checklistId: i.checklistId,
  text: i.text,
  done: i.done,
  position: i.position,
  createdAt: i.createdAt.toISOString(),
  updatedAt: i.updatedAt.toISOString(),
});

export const mapChecklist = (
  c: PChecklist & { items: PChecklistItem[] },
): Checklist => ({
  id: c.id,
  cardId: c.cardId,
  title: c.title,
  position: c.position,
  items: c.items.map(mapChecklistItem),
  createdAt: c.createdAt.toISOString(),
  updatedAt: c.updatedAt.toISOString(),
});

export const mapComment = (
  c: PComment & { author?: PUser | null },
): Comment => ({
  id: c.id,
  cardId: c.cardId,
  authorId: c.authorId,
  author: c.author ? mapMember(c.author) : undefined,
  body: c.body,
  createdAt: c.createdAt.toISOString(),
  updatedAt: c.updatedAt.toISOString(),
});

export type CardWithRelations = PCard & {
  labels: { label: PLabel }[];
  members: { user: PUser }[];
  checklists: (PChecklist & { items: PChecklistItem[] })[];
  _count?: { comments: number };
  comments?: (PComment & { author: PUser | null })[];
};

export const mapCardSummary = (c: CardWithRelations): CardSummary => {
  const items = c.checklists.flatMap((cl) => cl.items);
  return {
    id: c.id,
    boardId: c.boardId,
    listId: c.listId,
    title: c.title,
    position: c.position,
    dueAt: c.dueAt?.toISOString() ?? null,
    dueComplete: c.dueComplete,
    cover:
      c.coverType && c.coverValue
        ? { type: c.coverType as 'color' | 'image', value: c.coverValue }
        : null,
    labels: c.labels.map((cl) => mapLabel(cl.label)),
    members: c.members.map((cm) => mapMember(cm.user)),
    checklistSummary: {
      total: items.length,
      done: items.filter((i) => i.done).length,
    },
    commentCount: c._count?.comments ?? 0,
    archivedAt: c.archivedAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
};

export const mapCardDetail = (c: CardWithRelations): CardDetail => ({
  ...mapCardSummary(c),
  description: c.description,
  checklists: c.checklists
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(mapChecklist),
  comments: (c.comments ?? [])
    .slice()
    .sort((a, b) => +b.createdAt - +a.createdAt)
    .map((cm) => mapComment(cm)),
});

export const mapActivity = (
  a: PActivity & { actor?: PUser | null },
): Activity => ({
  id: a.id,
  boardId: a.boardId,
  cardId: a.cardId,
  listId: a.listId,
  actorId: a.actorId,
  actor: a.actor ? mapMember(a.actor) : undefined,
  type: a.type as ActivityType,
  payload: (a.payload as Record<string, unknown>) ?? {},
  createdAt: a.createdAt.toISOString(),
});
