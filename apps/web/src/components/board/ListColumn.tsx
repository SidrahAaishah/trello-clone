import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import type { CardSummary, List } from '@trello-clone/shared';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import toast from 'react-hot-toast';

import { CardTile } from './CardTile';
import { QuickAddCard } from './QuickAddCard';
import { Icon } from '@/components/common/Icon';
import {
  useCreateCard,
  useUpdateList,
} from '@/hooks/useBoard';
import { useUI } from '@/stores/ui';
import { positionAfter, POSITION_STEP } from '@/utils/positions';

export interface ListWithCards extends List {
  cards: CardSummary[];
}

interface Props {
  boardId: string;
  list: ListWithCards;
  visibleCards: CardSummary[];
}

function ListColumnInner({ boardId, list, visibleCards }: Props) {
  const openCard = useUI((s) => s.openCard);
  // Stable callback — same reference across renders so CardTile.memo can skip re-renders.
  const handleCardClick = useCallback((cardId: string) => openCard(cardId), [openCard]);
  const createCard = useCreateCard(boardId);
  const updateList = useUpdateList(boardId);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(list.title);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setTitle(list.title), [list.title]);

  const sortable = useSortable({
    id: list.id,
    data: { type: 'list', listId: list.id },
  });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    touchAction: 'none' as const,
  };

  const commitTitle = async () => {
    const t = title.trim();
    setEditing(false);
    if (!t || t === list.title) {
      setTitle(list.title);
      return;
    }
    try {
      await updateList.mutateAsync({ listId: list.id, input: { title: t } });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleAdd = async (cardTitle: string) => {
    const last = list.cards[list.cards.length - 1];
    const position = last ? positionAfter(last.position) : POSITION_STEP;
    try {
      await createCard.mutateAsync({
        listId: list.id,
        input: { title: cardTitle, position },
      });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={clsx(
        'w-[272px] flex-shrink-0 bg-[#EBECF0] rounded-lg flex flex-col max-h-[calc(100vh-9rem)]',
        isDragging && 'opacity-50',
      )}
    >
      <div
        className="px-3 pt-3 pb-2 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        {editing ? (
          <textarea
            ref={inputRef}
            autoFocus
            rows={1}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitTitle();
              }
              if (e.key === 'Escape') {
                setTitle(list.title);
                setEditing(false);
              }
            }}
            className="flex-1 bg-white rounded px-2 py-1 text-sm font-bold text-on-surface outline-none ring-2 ring-primary resize-none"
          />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            className="flex-1 text-left text-sm font-bold text-on-surface px-1 py-0.5 rounded hover:bg-surface-container-high"
          >
            {list.title}
          </button>
        )}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="text-on-surface-variant hover:bg-surface-container-high p-1 rounded"
              aria-label="List actions"
            >
              <Icon name="more_horiz" size={18} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={6}
              className="bg-white rounded-md shadow-popover p-1 min-w-44 z-50"
            >
              <DropdownMenu.Item
                className="px-3 py-1.5 rounded text-sm hover:bg-surface-container-low cursor-pointer outline-none"
                onSelect={() => setEditing(true)}
              >
                Rename list
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="px-3 py-1.5 rounded text-sm hover:bg-surface-container-low cursor-pointer outline-none text-danger"
                onSelect={async () => {
                  try {
                    await updateList.mutateAsync({
                      listId: list.id,
                      input: { archivedAt: new Date().toISOString() },
                    });
                    toast.success('List archived');
                  } catch (err) {
                    toast.error((err as Error).message);
                  }
                }}
              >
                Archive list
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <div className="px-2 pb-1 space-y-2 overflow-y-auto list-scroll">
        <SortableContext items={visibleCards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {visibleCards.map((card) => (
            <CardTile key={card.id} card={card} onClick={handleCardClick} />
          ))}
        </SortableContext>
      </div>

      <QuickAddCard onAdd={handleAdd} />
    </section>
  );
}

// Memoized: only re-renders when boardId, list, or visibleCards reference changes.
// BoardCanvas's identity-preserving onDragOver ensures only the two affected lists
// (source + target) get new object references — all other columns stay frozen.
export const ListColumn = memo(ListColumnInner);
