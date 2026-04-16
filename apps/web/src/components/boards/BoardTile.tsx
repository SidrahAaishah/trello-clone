import { useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Dialog from '@radix-ui/react-dialog';
import toast from 'react-hot-toast';
import type { Board } from '@trello-clone/shared';
import { Icon } from '@/components/common/Icon';
import { useUpdateBoard, useDeleteBoard } from '@/hooks/useBoards';

interface Props {
  board: Board;
}

export function BoardTile({ board }: Props) {
  const update = useUpdateBoard(board.id);
  const deleteBoard = useDeleteBoard();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const bgStyle: React.CSSProperties =
    board.background.type === 'color'
      ? { backgroundColor: board.background.value }
      : board.background.type === 'gradient'
        ? { backgroundImage: board.background.value }
        : {
            backgroundImage: `url(${board.background.value})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          };

  const handleDelete = async () => {
    try {
      await deleteBoard.mutateAsync(board.id);
      toast.success('Board deleted');
      setConfirmOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <>
      <Link
        to={`/boards/${board.id}`}
        className="group relative block rounded-md overflow-hidden shadow-card hover:shadow-card-lift transition-shadow w-full sm:w-[200px] h-24"
        style={bgStyle}
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        <div className="relative z-10 p-2 flex flex-col justify-between h-full text-white">
          <span className="text-sm font-semibold line-clamp-2 drop-shadow pr-6">
            {board.title}
          </span>
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
              className={clsx('drop-shadow', board.starred && 'text-yellow-300')}
            />
          </button>
          {board.starred && (
            <span className="absolute top-2 right-2 text-yellow-300">
              <Icon name="star" size={18} />
            </span>
          )}
        </div>

        {/* More menu — top-right corner, hidden unless hovered */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="absolute top-1 right-1 z-20 p-1 rounded bg-black/30 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-black/50 transition-opacity"
              aria-label="Board actions"
            >
              <Icon name="more_horiz" size={16} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={4}
              className="bg-white rounded-md shadow-popover p-1 min-w-40 z-50"
            >
              <DropdownMenu.Item
                className="px-3 py-1.5 rounded text-sm hover:bg-surface-container-low cursor-pointer outline-none flex items-center gap-2 text-danger"
                onSelect={(e) => {
                  e.preventDefault();
                  setConfirmOpen(true);
                }}
              >
                <Icon name="delete" size={16} />
                Delete board
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </Link>

      <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[400px] max-w-[92vw] bg-white rounded-lg shadow-popover p-5">
            <Dialog.Title className="text-base font-semibold text-on-surface mb-2">
              Delete this board?
            </Dialog.Title>
            <Dialog.Description className="text-sm text-on-surface-variant mb-5">
              <strong className="text-on-surface">{board.title}</strong> and all of its lists,
              cards, checklists, and activity will be permanently removed. This action cannot be
              undone.
            </Dialog.Description>
            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm font-medium rounded-sm text-on-surface hover:bg-surface-container-low"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="button"
                disabled={deleteBoard.isPending}
                onClick={handleDelete}
                className="px-3 py-1.5 text-sm font-semibold rounded-sm bg-danger text-white hover:bg-danger/90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleteBoard.isPending ? 'Deleting…' : 'Delete board'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

export function BoardAddTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center rounded-md bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors text-sm font-medium w-full sm:w-[200px] h-24"
    >
      Create new board
    </button>
  );
}
