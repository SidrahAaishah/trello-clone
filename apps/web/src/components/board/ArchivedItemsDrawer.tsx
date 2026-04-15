import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import clsx from 'clsx';
import type { CardSummary, List } from '@trello-clone/shared';
import { Icon } from '@/components/common/Icon';
import { LabelChip } from '@/components/common/LabelChip';
import { useUI } from '@/stores/ui';
import {
  useArchivedItems,
  useRestoreCard,
  useRestoreList,
  useDeleteCardPermanent,
} from '@/hooks/useArchived';
import toast from 'react-hot-toast';

interface Props {
  boardId: string;
}

type Tab = 'cards' | 'lists';

export function ArchivedItemsDrawer({ boardId }: Props) {
  const open = useUI((s) => s.archivedDrawerOpen);
  const setOpen = useUI((s) => s.setArchivedDrawerOpen);
  const [tab, setTab] = useState<Tab>('cards');
  const [query, setQuery] = useState('');

  const { data, isLoading } = useArchivedItems(boardId, open);
  const restoreCard = useRestoreCard(boardId);
  const restoreList = useRestoreList(boardId);
  const deleteCard = useDeleteCardPermanent(boardId);

  const cards = (data?.cards ?? []).filter((c) =>
    query ? c.title.toLowerCase().includes(query.toLowerCase()) : true,
  );
  const lists = (data?.lists ?? []).filter((l) =>
    query ? l.title.toLowerCase().includes(query.toLowerCase()) : true,
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
        <Dialog.Content
          className={clsx(
            'fixed top-0 right-0 z-[70] h-full w-[380px] max-w-[94vw]',
            'bg-surface shadow-popover flex flex-col',
          )}
        >
          <header className="h-12 flex items-center justify-between px-4 border-b border-outline">
            <Dialog.Title className="font-semibold text-on-surface text-sm">
              Archived items
            </Dialog.Title>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-surface-container-high"
              aria-label="Close"
            >
              <Icon name="close" />
            </button>
          </header>

          <div className="px-4 pt-3 pb-2 border-b border-outline space-y-2">
            <div className="flex gap-1">
              <TabButton active={tab === 'cards'} onClick={() => setTab('cards')}>
                Cards
                {data && (
                  <span className="ml-1 text-[10px] font-bold text-on-surface-variant">
                    ({data.cards.length})
                  </span>
                )}
              </TabButton>
              <TabButton active={tab === 'lists'} onClick={() => setTab('lists')}>
                Lists
                {data && (
                  <span className="ml-1 text-[10px] font-bold text-on-surface-variant">
                    ({data.lists.length})
                  </span>
                )}
              </TabButton>
            </div>
            <div className="relative">
              <Icon
                name="search"
                size={16}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search archived ${tab}…`}
                className="w-full bg-surface-container rounded-sm pl-7 pr-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {isLoading ? (
              <div className="text-center text-on-surface-variant text-sm py-8">
                Loading…
              </div>
            ) : tab === 'cards' ? (
              cards.length === 0 ? (
                <EmptyState kind="cards" />
              ) : (
                <ul className="space-y-2">
                  {cards.map((c) => (
                    <CardRow
                      key={c.id}
                      card={c}
                      onRestore={async () => {
                        try {
                          await restoreCard.mutateAsync(c.id);
                          toast.success('Card sent to board');
                        } catch (err) {
                          toast.error((err as Error).message);
                        }
                      }}
                      onDelete={async () => {
                        if (!window.confirm(`Delete "${c.title}" permanently?`)) return;
                        try {
                          await deleteCard.mutateAsync(c.id);
                          toast.success('Card deleted');
                        } catch (err) {
                          toast.error((err as Error).message);
                        }
                      }}
                    />
                  ))}
                </ul>
              )
            ) : lists.length === 0 ? (
              <EmptyState kind="lists" />
            ) : (
              <ul className="space-y-2">
                {lists.map((l) => (
                  <ListRow
                    key={l.id}
                    list={l}
                    onRestore={async () => {
                      try {
                        await restoreList.mutateAsync(l.id);
                        toast.success('List sent to board');
                      } catch (err) {
                        toast.error((err as Error).message);
                      }
                    }}
                  />
                ))}
              </ul>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-3 py-1.5 text-xs font-semibold rounded-sm',
        active
          ? 'bg-primary text-white'
          : 'bg-surface-container text-on-surface hover:bg-surface-container-high',
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ kind }: { kind: Tab }) {
  return (
    <div className="text-center text-on-surface-variant text-sm py-8">
      <Icon name="archive" size={32} className="mx-auto mb-2 opacity-50" />
      No archived {kind}.
    </div>
  );
}

function CardRow({
  card,
  onRestore,
  onDelete,
}: {
  card: CardSummary;
  onRestore: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="bg-surface rounded-sm shadow-card p-2 space-y-1.5">
      {card.cover?.type === 'color' && (
        <div
          className="h-6 rounded-sm"
          style={{ backgroundColor: card.cover.value }}
        />
      )}
      {card.cover?.type === 'image' && (
        <div
          className="h-10 rounded-sm bg-cover bg-center"
          style={{ backgroundImage: `url(${card.cover.value})` }}
        />
      )}
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {card.labels.map((l) => (
            <LabelChip key={l.id} label={l} />
          ))}
        </div>
      )}
      <div className="text-sm text-on-surface">{card.title}</div>
      <div className="flex gap-2 text-xs">
        <button
          onClick={onRestore}
          className="text-primary hover:underline font-semibold"
        >
          Send to board
        </button>
        <span className="text-on-surface-variant">·</span>
        <button
          onClick={onDelete}
          className="text-danger hover:underline font-semibold"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function ListRow({ list, onRestore }: { list: List; onRestore: () => void }) {
  return (
    <li className="bg-surface-container rounded-sm p-2 space-y-1.5">
      <div className="text-sm font-semibold text-on-surface">{list.title}</div>
      <button
        onClick={onRestore}
        className="text-xs text-primary hover:underline font-semibold"
      >
        Send to board
      </button>
    </li>
  );
}
