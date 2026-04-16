import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';
import type { CardSummary, List } from '@trello-clone/shared';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { ListColumn, type ListWithCards } from './ListColumn';
import { AddListColumn } from './AddListColumn';
import { CardTile } from './CardTile';
import { useMoveCard, useReorderList, boardListsKey } from '@/hooks/useBoard';
import { useUI } from '@/stores/ui';
import { positionAtIndex } from '@/utils/positions';
import { dueState } from '@/utils/due';

interface Props {
  boardId: string;
  lists: ListWithCards[];
}

type DragItem =
  | { type: 'card'; card: CardSummary }
  | { type: 'list'; list: List };

export function BoardCanvas({ boardId, lists }: Props) {
  const qc = useQueryClient();
  const moveCard = useMoveCard(boardId);
  const reorderList = useReorderList(boardId);
  const filter = useUI((s) => s.filter);

  const sensors = useSensors(
    // Desktop / mouse: small distance threshold to distinguish click from drag
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    // Mobile / touch: require a 250 ms long-press so normal scrolling still works
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [activeItem, setActiveItem] = useState<DragItem | null>(null);

  const visibleCardsByList = useMemo(() => {
    return lists.reduce<Record<string, CardSummary[]>>((acc, l) => {
      acc[l.id] = l.cards.filter((c) => cardMatchesFilter(c, filter));
      return acc;
    }, {});
  }, [lists, filter]);

  const onDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current;
    if (!data) return;
    if (data.type === 'card') {
      const l = lists.find((l) => l.cards.some((c) => c.id === data.cardId));
      const card = l?.cards.find((c) => c.id === data.cardId);
      if (card) setActiveItem({ type: 'card', card });
    } else if (data.type === 'list') {
      const list = lists.find((l) => l.id === data.listId);
      if (list) setActiveItem({ type: 'list', list });
    }
  };

  const onDragOver = (e: DragOverEvent) => {
    // dnd-kit visual reordering is handled via SortableContexts; no-op here.
    void e;
  };

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = e;
    if (!over) return;
    const activeData = active.data.current;
    const overData = over.data.current;
    if (!activeData) return;

    if (activeData.type === 'list' && overData?.type === 'list') {
      if (active.id === over.id) return;
      const ordered = lists.map((l) => l.id);
      const from = ordered.indexOf(active.id as string);
      const to = ordered.indexOf(over.id as string);
      if (from === -1 || to === -1) return;
      const next = arrayMove(lists, from, to);
      const position = positionAtIndex(
        next.filter((l) => l.id !== (active.id as string)),
        to,
      );
      try {
        await reorderList.mutateAsync({ listId: active.id as string, position });
      } catch (err) {
        toast.error((err as Error).message);
      }
      return;
    }

    if (activeData.type === 'card') {
      const cardId = active.id as string;
      let targetListId: string | null = null;
      let targetIndex = 0;

      if (overData?.type === 'card') {
        targetListId = overData.listId;
        const list = lists.find((l) => l.id === targetListId);
        targetIndex = list
          ? list.cards.filter((c) => c.id !== cardId).findIndex((c) => c.id === over.id)
          : 0;
        if (targetIndex === -1) targetIndex = list?.cards.length ?? 0;
      } else if (overData?.type === 'list-drop' || overData?.type === 'list') {
        targetListId = (overData.listId ?? (over.id as string)) as string;
        const list = lists.find((l) => l.id === targetListId);
        targetIndex = list ? list.cards.filter((c) => c.id !== cardId).length : 0;
      }
      if (!targetListId) return;

      const list = lists.find((l) => l.id === targetListId);
      if (!list) return;
      const siblings = list.cards.filter((c) => c.id !== cardId);
      const position = positionAtIndex(siblings, targetIndex);

      try {
        await moveCard.mutateAsync({ cardId, input: { listId: targetListId, position } });
      } catch (err) {
        qc.invalidateQueries({ queryKey: boardListsKey(boardId) });
        toast.error((err as Error).message);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex-grow kanban-canvas overflow-x-auto p-4 flex items-start gap-3">
        <SortableContext items={lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
          {lists.map((l) => (
            <ListDroppable key={l.id} listId={l.id}>
              <ListColumn
                boardId={boardId}
                list={l}
                visibleCards={visibleCardsByList[l.id] ?? []}
              />
            </ListDroppable>
          ))}
        </SortableContext>
        <AddListColumn boardId={boardId} />
      </div>
      <DragOverlay>
        {activeItem?.type === 'card' ? (
          <div className="rotate-2">
            <CardTile card={activeItem.card} onClick={() => {}} />
          </div>
        ) : activeItem?.type === 'list' ? (
          <div className="w-[272px] bg-[#EBECF0] rounded-lg p-3 shadow-card-lift rotate-2 opacity-90">
            <div className="text-sm font-bold text-on-surface">{activeItem.list.title}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function ListDroppable({
  listId,
  children,
}: {
  listId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id: `list-drop-${listId}`,
    data: { type: 'list-drop', listId },
  });
  return <div ref={setNodeRef}>{children}</div>;
}

function cardMatchesFilter(
  c: CardSummary,
  filter: ReturnType<typeof useUI.getState>['filter'],
): boolean {
  if (filter.query) {
    if (!c.title.toLowerCase().includes(filter.query.toLowerCase())) return false;
  }
  if (filter.labelIds.length) {
    const ids = new Set(c.labels.map((l) => l.id));
    if (!filter.labelIds.some((id) => ids.has(id))) return false;
  }
  if (filter.memberIds.length) {
    const ids = new Set(c.members.map((m) => m.id));
    if (!filter.memberIds.some((id) => ids.has(id))) return false;
  }
  if (filter.due) {
    const state = dueState(c.dueAt, c.dueComplete);
    switch (filter.due) {
      case 'any':
        return true;
      case 'none':
        if (c.dueAt) return false;
        break;
      case 'overdue':
        if (state !== 'overdue') return false;
        break;
      case 'today':
        if (state !== 'today') return false;
        break;
      case 'week':
        if (state !== 'soon' && state !== 'upcoming') return false;
        break;
      case 'complete':
        if (!c.dueComplete) return false;
        break;
      case 'incomplete':
        if (c.dueComplete) return false;
        break;
    }
  }
  return true;
}
