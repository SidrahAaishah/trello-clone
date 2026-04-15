import { useState } from 'react';
import clsx from 'clsx';
import type { Board, Member } from '@trello-clone/shared';
import { Icon } from '@/components/common/Icon';
import { AvatarStack } from '@/components/common/Avatar';
import { FilterPopover } from './FilterPopover';
import { useUpdateBoard } from '@/hooks/useBoards';
import { useUI } from '@/stores/ui';
import toast from 'react-hot-toast';

interface Props {
  board: Board;
  members: Member[];
}

export function BoardHeader({ board, members }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(board.title);
  const update = useUpdateBoard(board.id);
  const filter = useUI((s) => s.filter);
  const activeFilters =
    (filter.query ? 1 : 0) +
    filter.labelIds.length +
    filter.memberIds.length +
    (filter.due ? 1 : 0);

  const save = async () => {
    const t = title.trim();
    setEditing(false);
    if (!t || t === board.title) {
      setTitle(board.title);
      return;
    }
    try {
      await update.mutateAsync({ title: t });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="h-12 glass-header flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-2">
        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') {
                setTitle(board.title);
                setEditing(false);
              }
            }}
            className="bg-white text-on-surface font-bold text-lg px-2 py-1 rounded outline-none ring-2 ring-white"
            maxLength={80}
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-white font-bold text-lg px-2 py-1 rounded hover:bg-white/20"
          >
            {board.title}
          </button>
        )}
        <button
          onClick={() => update.mutate({ starred: !board.starred })}
          className={clsx(
            'p-1 rounded hover:bg-white/20',
            board.starred ? 'text-yellow-300' : 'text-white/80 hover:text-white',
          )}
          aria-label="Toggle star"
        >
          <Icon name="star" size={18} />
        </button>
        <div className="h-4 w-px bg-white/20 mx-1" />
        <span className="flex items-center gap-1 text-white text-xs font-medium px-2 py-1 rounded bg-white/10">
          <Icon name="group" size={14} />
          Workspace visible
        </span>
        <div className="h-4 w-px bg-white/20 mx-1" />
        <AvatarStack members={members} size={28} max={4} ring="ring-2 ring-[#0079BF]" />
      </div>

      <div className="flex items-center gap-2">
        <FilterPopover boardId={board.id}>
          <button
            className={clsx(
              'flex items-center gap-1 text-white text-sm font-medium px-3 py-1.5 rounded hover:bg-white/20',
              activeFilters > 0 && 'bg-white/30',
            )}
          >
            <Icon name="filter_list" size={18} />
            <span>Filters</span>
            {activeFilters > 0 && (
              <span className="ml-1 text-[11px] bg-white text-primary font-bold rounded-full px-1.5 py-0.5">
                {activeFilters}
              </span>
            )}
          </button>
        </FilterPopover>
        <button
          onClick={() => useUI.getState().setArchivedDrawerOpen(true)}
          className="flex items-center gap-1 text-white text-sm font-medium px-3 py-1.5 rounded hover:bg-white/20"
          title="View archived items"
        >
          <Icon name="archive" size={18} />
          <span>Archived</span>
        </button>
        <button className="bg-white text-primary font-semibold text-sm px-3 py-1.5 rounded-sm hover:bg-white/90 flex items-center gap-1">
          <Icon name="person_add" size={18} />
          <span>Share</span>
        </button>
        <button className="text-white/80 hover:text-white p-1 rounded hover:bg-white/20" aria-label="More">
          <Icon name="more_horiz" />
        </button>
      </div>
    </div>
  );
}
