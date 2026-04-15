import * as Popover from '@radix-ui/react-popover';
import clsx from 'clsx';
import type { Member } from '@trello-clone/shared';
import { Avatar } from '@/components/common/Avatar';
import { Icon } from '@/components/common/Icon';
import { useCardMemberToggle } from '@/hooks/useCard';

interface Props {
  boardId: string;
  cardId: string;
  selected: Member[];
  candidates: Member[];
  children: React.ReactNode;
}

export function MemberPicker({ boardId, cardId, selected, candidates, children }: Props) {
  const toggle = useCardMemberToggle(boardId, cardId);
  const selectedIds = new Set(selected.map((m) => m.id));

  return (
    <Popover.Root>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          className="bg-white rounded-md shadow-popover w-72 p-3 z-[80]"
        >
          <div className="text-sm font-semibold text-on-surface mb-2">Members</div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {candidates.map((m) => {
              const active = selectedIds.has(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => toggle.mutate({ userId: m.id, add: !active })}
                  className={clsx(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded text-left',
                    active ? 'bg-surface-container-low' : 'hover:bg-surface-container-low',
                  )}
                >
                  <Avatar member={m} size={24} />
                  <span className="flex-1 text-sm">{m.displayName}</span>
                  {active && <Icon name="check" size={16} className="text-primary" />}
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
