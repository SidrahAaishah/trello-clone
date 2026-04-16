import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BoardTile, BoardAddTile } from '@/components/boards/BoardTile';
import {
  BoardsFilterBar,
  type BoardFilters,
  type BoardView,
} from '@/components/boards/BoardsFilterBar';
import { useBoards } from '@/hooks/useBoards';
import { useUI } from '@/stores/ui';

const DEFAULT_FILTERS: BoardFilters = {
  search: '',
  view: 'all',
  bg: 'all',
  sort: 'recent',
};

const VALID_VIEWS: BoardView[] = ['all', 'starred', 'recent'];

export default function BoardsHome() {
  const { data: boards = [], isLoading } = useBoards();
  const setCreateOpen = useUI((s) => s.setCreateBoardOpen);
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<BoardFilters>(DEFAULT_FILTERS);

  // Pull the Starred / Recent view out of the URL when the user lands via
  // the top nav links (?view=starred / ?view=recent). Later changes to the
  // filter dropdowns stay local — we don't mirror them back to the URL.
  useEffect(() => {
    const v = searchParams.get('view');
    if (v && (VALID_VIEWS as string[]).includes(v)) {
      setFilters((f) => ({ ...f, view: v as BoardView }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('view')]);

  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    let arr = boards.slice();
    if (filters.view === 'starred') arr = arr.filter((b) => b.starred);
    if (filters.bg !== 'all') arr = arr.filter((b) => b.background.type === filters.bg);
    if (q) arr = arr.filter((b) => b.title.toLowerCase().includes(q));

    switch (filters.sort) {
      case 'alphabetical':
        arr.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'reverse':
        arr.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'oldest':
        arr.sort(
          (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
        );
        break;
      case 'recent':
      default:
        // Server already returns starred-first, updatedAt-desc. Keep starred
        // first for the "All" view, but when the user is in the Recent view
        // we respect pure recency (ignore starred weighting).
        if (filters.view === 'recent') {
          arr.sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          );
        }
        break;
    }
    return arr;
  }, [boards, filters]);

  const viewTitle =
    filters.view === 'starred'
      ? 'Starred boards'
      : filters.view === 'recent'
        ? 'Recently updated'
        : 'Your boards';

  const showStarredSection =
    filters.view === 'all' &&
    filters.sort === 'recent' &&
    filters.bg === 'all' &&
    !filters.search.trim();

  const starred = visible.filter((b) => b.starred);
  const rest = visible.filter((b) => !b.starred);

  return (
    <div className="h-full overflow-y-auto px-4 sm:px-8 py-6">
      {isLoading ? (
        <div className="text-on-surface-variant">Loading boards…</div>
      ) : boards.length === 0 ? (
        <EmptyState onCreate={() => setCreateOpen(true)} />
      ) : (
        <div className="space-y-6 max-w-6xl">
          <BoardsFilterBar
            value={filters}
            onChange={setFilters}
            totalCount={boards.length}
            visibleCount={visible.length}
          />

          {visible.length === 0 ? (
            <NoResults
              hasSearch={!!filters.search.trim()}
              onClear={() => setFilters(DEFAULT_FILTERS)}
            />
          ) : showStarredSection ? (
            <div className="space-y-10">
              {starred.length > 0 && (
                <Section title="Starred boards">
                  {starred.map((b) => (
                    <BoardTile key={b.id} board={b} />
                  ))}
                </Section>
              )}
              <Section title="Your boards">
                {rest.map((b) => (
                  <BoardTile key={b.id} board={b} />
                ))}
                <BoardAddTile onClick={() => setCreateOpen(true)} />
              </Section>
            </div>
          ) : (
            <Section title={viewTitle}>
              {visible.map((b) => (
                <BoardTile key={b.id} board={b} />
              ))}
              {filters.view === 'all' && (
                <BoardAddTile onClick={() => setCreateOpen(true)} />
              )}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-on-surface mb-3">{title}</h2>
      {/* Responsive grid: 2 columns on mobile, auto-fill with 200px min on larger screens */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4">{children}</div>
    </section>
  );
}

function NoResults({ hasSearch, onClear }: { hasSearch: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-surface-container rounded-lg mb-4 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-3xl">filter_alt_off</span>
      </div>
      <h2 className="text-base font-semibold text-on-surface mb-1">
        {hasSearch ? 'No boards match your search' : 'No boards match these filters'}
      </h2>
      <p className="text-sm text-on-surface-variant max-w-sm mb-4">
        Try loosening a filter or clearing them all.
      </p>
      <button
        onClick={onClear}
        className="text-sm font-medium text-primary hover:underline"
      >
        Clear all filters
      </button>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6 sm:p-10">
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-surface-container rounded-lg mb-6 flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl sm:text-5xl text-primary">dashboard</span>
      </div>
      <h1 className="text-lg sm:text-xl font-bold text-on-surface mb-2">Welcome to your workspace</h1>
      <p className="text-sm text-on-surface-variant mb-6 max-w-md">
        Create your first board to start tracking tasks. Boards hold lists, lists hold cards,
        cards hold the work.
      </p>
      <button
        onClick={onCreate}
        className="bg-primary text-white font-semibold px-5 py-2 rounded-sm hover:bg-primary/90"
      >
        Create your first board
      </button>
    </div>
  );
}
