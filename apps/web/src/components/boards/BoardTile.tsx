import { Link } from 'react-router-dom';
import clsx from 'clsx';
import type { Board } from '@trello-clone/shared';
import { Icon } from '@/components/common/Icon';
import { useUpdateBoard } from '@/hooks/useBoards';

interface Props {
  board: Board;
}

export function BoardTile({ board }: Props) {
  const update = useUpdateBoard(board.id);
  const bgStyle =
    board.background.type === 'color'
      ? { backgroundColor: board.background.value }
      : {
          backgroundImage: `url(${board.background.value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };

  return (
    <Link
      to={`/boards/${board.id}`}
      className="group relative block rounded-md overflow-hidden shadow-card hover:shadow-card-lift transition-shadow"
      style={{ width: 200, height: 96, ...bgStyle }}
    >
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      <div className="relative z-10 p-2 flex flex-col justify-between h-full text-white">
        <span className="text-sm font-semibold line-clamp-2 drop-shadow">{board.title}</span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            update.mutate({ starred: !board.starred });
          }}
          className="self-end opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          aria-label={board.starred ? 'Unstar board' : 'Star board'}
        >
          <Icon
            name="star"
            size={18}
            className={clsx(
              'drop-shadow',
              board.starred && 'text-yellow-300',
            )}
          />
        </button>
        {board.starred && (
          <span className="absolute top-2 right-2 text-yellow-300">
            <Icon name="star" size={18} />
          </span>
        )}
      </div>
    </Link>
  );
}

export function BoardAddTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center rounded-md bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors text-sm font-medium"
      style={{ width: 200, height: 96 }}
    >
      Create new board
    </button>
  );
}
