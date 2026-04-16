import { BoardTile, BoardAddTile } from '@/components/boards/BoardTile';
import { useBoards } from '@/hooks/useBoards';
import { useUI } from '@/stores/ui';

export default function BoardsHome() {
  const { data: boards = [], isLoading } = useBoards();
  const setCreateOpen = useUI((s) => s.setCreateBoardOpen);
  const starred = boards.filter((b) => b.starred);
  const recent = boards.filter((b) => !b.starred);

  return (
    <div className="h-full overflow-y-auto px-4 sm:px-8 py-6">
      {isLoading ? (
        <div className="text-on-surface-variant">Loading boards…</div>
      ) : boards.length === 0 ? (
        <EmptyState onCreate={() => setCreateOpen(true)} />
      ) : (
        <div className="space-y-10 max-w-6xl">
          {starred.length > 0 && (
            <Section title="Starred boards">
              {starred.map((b) => (
                <BoardTile key={b.id} board={b} />
              ))}
            </Section>
          )}

          <Section title="Your boards">
            {recent.map((b) => (
              <BoardTile key={b.id} board={b} />
            ))}
            <BoardAddTile onClick={() => setCreateOpen(true)} />
          </Section>
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
