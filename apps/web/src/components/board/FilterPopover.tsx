import * as Popover from '@radix-ui/react-popover';
import { DUE_FILTER_OPTIONS } from '@trello-clone/shared';
import clsx from 'clsx';

import { Icon } from '@/components/common/Icon';
import { Avatar } from '@/components/common/Avatar';
import { LabelChip } from '@/components/common/LabelChip';
import { useBoardLabels, useBoard } from '@/hooks/useBoard';
import { useUI } from '@/stores/ui';

interface Props {
  boardId: string;
  children: React.ReactNode;
}

const dueLabels: Record<string, string> = {
  any: 'Any due state',
  none: 'No dates',
  overdue: 'Overdue',
  today: 'Due today',
  week: 'Due in the next week',
  complete: 'Marked complete',
  incomplete: 'Not complete',
};

export function FilterPopover({ boardId, children }: Props) {
  const { data: labels = [] } = useBoardLabels(boardId);
  const { data: board } = useBoard(boardId);
  const members = board?.members ?? [];
  const filter = useUI((s) => s.filter);
  const setFilter = useUI((s) => s.setFilter);
  const clearFilter = useUI((s) => s.clearFilter);

  return (
    <Popover.Root>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="bg-white rounded-md shadow-popover w-[320px] p-4 z-50 text-on-surface"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Filter</div>
            <button
              onClick={clearFilter}
              className="text-xs text-primary hover:underline"
            >
              Clear
            </button>
          </div>

          <label className="block text-[11px] font-bold uppercase tracking-wide text-on-surface-variant mb-1">
            Keyword
          </label>
          <input
            value={filter.query}
            onChange={(e) => setFilter({ query: e.target.value })}
            placeholder="Search cards by title…"
            className="w-full border border-outline rounded px-2 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <div className="mt-4">
            <div className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant mb-1">
              Labels
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {labels.map((l) => {
                const active = filter.labelIds.includes(l.id);
                return (
                  <button
                    key={l.id}
                    onClick={() =>
                      setFilter({
                        labelIds: active
                          ? filter.labelIds.filter((x) => x !== l.id)
                          : [...filter.labelIds, l.id],
                      })
                    }
                    className={clsx(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm',
                      active ? 'bg-surface-container-low' : 'hover:bg-surface-container-low',
                    )}
                  >
                    <LabelChip label={l} expanded />
                    <span className="flex-1 text-left text-xs text-on-surface-variant truncate">
                      {l.name || 'Unnamed'}
                    </span>
                    {active && <Icon name="check" size={16} className="text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant mb-1">
              Members
            </div>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const active = filter.memberIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() =>
                      setFilter({
                        memberIds: active
                          ? filter.memberIds.filter((x) => x !== m.id)
                          : [...filter.memberIds, m.id],
                      })
                    }
                    className={clsx(
                      'rounded-full transition-[box-shadow]',
                      active ? 'ring-2 ring-primary ring-offset-2' : '',
                    )}
                    title={m.displayName}
                  >
                    <Avatar member={m} size={28} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant mb-1">
              Due date
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setFilter({ due: null })}
                className={clsx(
                  'text-xs px-2 py-1.5 rounded text-left',
                  filter.due === null ? 'bg-primary text-white' : 'hover:bg-surface-container-low',
                )}
              >
                Any
              </button>
              {DUE_FILTER_OPTIONS.filter((d) => d !== 'any').map((d) => (
                <button
                  key={d}
                  onClick={() => setFilter({ due: d })}
                  className={clsx(
                    'text-xs px-2 py-1.5 rounded text-left',
                    filter.due === d ? 'bg-primary text-white' : 'hover:bg-surface-container-low',
                  )}
                >
                  {dueLabels[d]}
                </button>
              ))}
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
