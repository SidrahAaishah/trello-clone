import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  MeasuringStrategy,
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

// Only re-measure before drag starts — not continuously.
// MeasuringStrategy.Always was causing reflows on every frame → flicker.
const measuring = {
  droppable: { strategy: MeasuringStrategy.BeforeDragging },
};

export function BoardCanvas({ boardId, lists }: Props) {
  const qc = useQueryClient();
  const moveCard = useMoveCard(boardId);
  const reorderList = useReorderList(boardId);
  const filter = useUI((s) => s.filter);

  // ── Sensors ────────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 10 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ── Local optimistic list state ────────────────────────────────────────────
  // localLists drives rendering. It only changes:
  //   1. When NOT dragging and the server state changes.
  //   2. When a card crosses a LIST BOUNDARY during drag.
  // Within-list card reordering is handled by dnd-kit's SortableContext
  // transforms — no React state needed for that, which eliminates the flicker.
  const [localLists, setLocalLists] = useState<ListWithCards[]>(lists);
  const [activeItem, setActiveItem] = useState<DragItem | null>(null);

  const isDraggingRef = useRef(false);

  // Tracks which list the dragged card is currently in.
  // Used to detect cross-list moves (the only time we update state in onDragOver).
  const activeCardCurrentListRef = useRef<string | null>(null);

  // Sync from server whenever not dragging
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalLists(lists);
    }
  }, [lists]);

  // ── Filtered cards ─────────────────────────────────────────────────────────
  const visibleCardsByList = useMemo(() => {
    return localLists.reduce<Record<string, CardSummary[]>>((acc, l) => {
      acc[l.id] = l.cards.filter((c) => cardMatchesFilter(c, filter));
      return acc;
    }, {});
  }, [localLists, filter]);

  // ── Collision detection ────────────────────────────────────────────────────
  const collisionDetection = useCallback(
    (args: Parameters<typeof pointerWithin>[0]) => {
      const hits = pointerWithin(args);
      return hits.length > 0 ? hits : rectIntersection(args);
    },
    [],
  );

  // ── Drag start ─────────────────────────────────────────────────────────────
  const onDragStart = useCallback((e: DragStartEvent) => {
    isDraggingRef.current = true;
    const data = e.active.data.current;
    if (!data) return;
    if (data.type === 'card') {
      // Record the starting list so we can detect cross-list moves
      activeCardCurrentListRef.current = data.listId as string ?? null;
      const l = lists.find((l) => l.cards.some((c) => c.id === data.cardId));
      const card = l?.cards.find((c) => c.id === data.cardId);
      if (card) setActiveItem({ type: 'card', card });
    } else if (data.type === 'list') {
      const list = lists.find((l) => l.id === data.listId);
      if (list) setActiveItem({ type: 'list', list });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Drag over ──────────────────────────────────────────────────────────────
  // KEY INSIGHTS:
  // 1. We ONLY update React state when the card crosses a LIST boundary.
  //    Within-list reordering is pure CSS transforms (zero React renders).
  // 2. We use IDENTITY-PRESERVING updates: only the source and target list
  //    objects get new references. All other lists keep their exact same
  //    object reference → React.memo on ListColumn skips their re-render.
  // 3. We insert the card NEAR the over-item (not always at end) to avoid
  //    the visual "teleport to bottom then jump to cursor" flicker.
  const onDragOver = useCallback((e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;
    if (!activeData || activeData.type !== 'card') return;

    const cardId = active.id as string;

    // Resolve which list the pointer is over
    let targetListId: string | null = null;
    if (overData?.type === 'card') {
      targetListId = overData.listId as string;
    } else if (overData?.type === 'list-drop' || overData?.type === 'list') {
      targetListId = (overData.listId ?? over.id) as string;
    }
    if (!targetListId) return;

    // Skip if card is already in that list — no state update needed
    if (activeCardCurrentListRef.current === targetListId) return;

    // Card has crossed into a new list — update state once
    activeCardCurrentListRef.current = targetListId;

    // Snapshot over-card id so the setter closure captures it correctly
    const overCardId = overData?.type === 'card' ? (over.id as string) : null;
    const _targetListId = targetListId; // capture for closure

    setLocalLists((prev) => {
      // Find the card without spreading every list (preserves references)
      let movedCard: CardSummary | undefined;
      let sourceListId: string | null = null;
      for (const l of prev) {
        const idx = l.cards.findIndex((c) => c.id === cardId);
        if (idx !== -1) {
          movedCard = l.cards[idx]!;
          sourceListId = l.id;
          break;
        }
      }
      if (!movedCard || !sourceListId) return prev;

      // Identity-preserving map: only source and target get new objects.
      // Every other list returns the SAME reference → React.memo skips them.
      return prev.map((l) => {
        if (l.id === sourceListId) {
          // Remove card from source
          return { ...l, cards: l.cards.filter((c) => c.id !== cardId) };
        }
        if (l.id === _targetListId) {
          // Insert card near the over-item (avoids "teleport to bottom" flicker).
          // SortableContext will then use CSS transforms for fine positioning.
          const newCards = l.cards.filter((c) => c.id !== cardId); // defensive dedup
          if (overCardId) {
            const overIdx = newCards.findIndex((c) => c.id === overCardId);
            if (overIdx !== -1) {
              newCards.splice(overIdx, 0, movedCard!);
            } else {
              newCards.push(movedCard!);
            }
          } else {
            newCards.push(movedCard!);
          }
          return { ...l, cards: newCards };
        }
        return l; // ← same reference; React.memo ListColumn won't re-render
      });
    });
  }, []); // Empty deps — never recreated, no cascade possible

  // ── Drag end ───────────────────────────────────────────────────────────────
  const onDragEnd = useCallback(
    async (e: DragEndEvent) => {
      isDraggingRef.current = false;
      activeCardCurrentListRef.current = null;
      setActiveItem(null);

      const { active, over } = e;
      if (!over) {
        // Drag cancelled — revert
        setLocalLists(lists);
        return;
      }

      const activeData = active.data.current;
      const overData = over.data.current;
      if (!activeData) return;

      // List reorder
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
          setLocalLists(lists);
        }
        return;
      }

      // Card move
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

        // Use original `lists` for position maths (server truth)
        const list = lists.find((l) => l.id === targetListId);
        if (!list) return;
        const siblings = list.cards.filter((c) => c.id !== cardId);
        const position = positionAtIndex(siblings, targetIndex);

        try {
          await moveCard.mutateAsync({ cardId, input: { listId: targetListId, position } });
        } catch (err) {
          qc.invalidateQueries({ queryKey: boardListsKey(boardId) });
          setLocalLists(lists);
          toast.error((err as Error).message);
        }
      }
    },
    [lists, moveCard, reorderList, boardId, qc],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={measuring}
      autoScroll={{ threshold: { x: 0.15, y: 0.15 }, acceleration: 12, interval: 5 }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex-grow kanban-canvas overflow-x-auto p-4 flex items-start gap-3">
        <SortableContext
          items={localLists.map((l) => l.id)}
          strategy={horizontalListSortingStrategy}
        >
          {localLists.map((l) => (
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

      <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
        {activeItem?.type === 'card' ? (
          <div className="shadow-xl opacity-95">
            <CardTile card={activeItem.card} onClick={(_id) => {}} />
          </div>
        ) : activeItem?.type === 'list' ? (
          <div className="w-[272px] bg-[#EBECF0] rounded-lg p-3 shadow-xl opacity-90">
            <div className="text-sm font-bold text-on-surface">{activeItem.list.title}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function ListDroppable({ listId, children }: { listId: string; children: React.ReactNode }) {
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
      case 'any':        return true;
      case 'none':       if (c.dueAt) return false; break;
      case 'overdue':    if (state !== 'overdue') return false; break;
      case 'today':      if (state !== 'today') return false; break;
      case 'week':       if (state !== 'soon' && state !== 'upcoming') return false; break;
      case 'complete':   if (!c.dueComplete) return false; break;
      case 'incomplete': if (c.dueComplete) return false; break;
    }
  }
  return true;
}
