import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { CardSearchHit } from '@trello-clone/shared';
import { Icon } from '@/components/common/Icon';
import { LabelChip } from '@/components/common/LabelChip';
import { AvatarStack } from '@/components/common/Avatar';
import { useSearch } from '@/hooks/useSearch';
import { dueBadgeClasses, dueState, formatDueShort } from '@/utils/due';
import clsx from 'clsx';

export default function SearchResultsPage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';

  const { data: cards = [], isLoading } = useSearch({ q, limit: 60, enabled: !!q });

  const grouped = useMemo(() => {
    const map = new Map<string, { boardTitle: string; cards: CardSearchHit[] }>();
    for (const c of cards) {
      const entry = map.get(c.boardId) ?? { boardTitle: c.boardTitle, cards: [] };
      entry.cards.push(c);
      map.set(c.boardId, entry);
    }
    return Array.from(map.entries()).map(([boardId, v]) => ({ boardId, ...v }));
  }, [cards]);

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
          <Icon name="search" /> Search
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          {q ? (
            <>
              Results for <span className="font-semibold text-on-surface">“{q}”</span>
            </>
          ) : (
            'Type a query in the top bar to search cards across all your boards.'
          )}
        </p>

        {q && (
          <div className="mt-6">
            {isLoading ? (
              <div className="text-on-surface-variant text-sm">Searching…</div>
            ) : grouped.length === 0 ? (
              <EmptyResults query={q} />
            ) : (
              <div className="space-y-8">
                {grouped.map((g) => (
                  <section key={g.boardId}>
                    <div className="flex items-center gap-2 mb-3">
                      <Link
                        to={`/boards/${g.boardId}`}
                        className="text-sm font-semibold text-on-surface hover:underline"
                      >
                        {g.boardTitle}
                      </Link>
                      <span className="text-xs text-on-surface-variant">
                        {g.cards.length} {g.cards.length === 1 ? 'card' : 'cards'}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {g.cards.map((c) => (
                        <SearchHitRow key={c.id} hit={c} />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchHitRow({ hit }: { hit: CardSearchHit }) {
  const due = dueState(hit.dueAt, hit.dueComplete);
  return (
    <li>
      <Link
        to={`/boards/${hit.boardId}?card=${hit.id}`}
        className="block bg-white rounded-md border border-outline px-4 py-3 hover:border-primary hover:shadow-card transition-all"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-on-surface-variant">
              in <span className="font-medium">{hit.listTitle}</span>
            </div>
            <div className="text-sm font-semibold text-on-surface mt-0.5 truncate">
              {hit.title}
            </div>
            {hit.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {hit.labels.map((l) => (
                  <LabelChip key={l.id} label={l} expanded />
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {hit.dueAt && due && (
              <span
                className={clsx(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-semibold',
                  dueBadgeClasses[due],
                )}
              >
                <Icon name="schedule" size={12} /> {formatDueShort(hit.dueAt)}
              </span>
            )}
            {hit.members.length > 0 && <AvatarStack members={hit.members} size={24} max={3} />}
          </div>
        </div>
      </Link>
    </li>
  );
}

function EmptyResults({ query }: { query: string }) {
  return (
    <div className="py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-container mx-auto flex items-center justify-center mb-3">
        <Icon name="search_off" size={28} className="text-on-surface-variant" />
      </div>
      <div className="text-sm font-semibold text-on-surface">No matches for “{query}”</div>
      <div className="text-xs text-on-surface-variant mt-1">
        Try a different keyword or check the filters in the top bar.
      </div>
    </div>
  );
}
