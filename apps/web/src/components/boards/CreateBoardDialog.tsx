import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { BOARD_BG_PRESETS } from '@trello-clone/shared';
import { useUI } from '@/stores/ui';
import { useCreateBoard } from '@/hooks/useBoards';
import { Icon } from '@/components/common/Icon';
import toast from 'react-hot-toast';

export function CreateBoardDialog() {
  const open = useUI((s) => s.createBoardOpen);
  const setOpen = useUI((s) => s.setCreateBoardOpen);
  const [title, setTitle] = useState('');
  const [bg, setBg] = useState<string>(BOARD_BG_PRESETS[0]);
  const createBoard = useCreateBoard();
  const nav = useNavigate();

  const reset = () => {
    setTitle('');
    setBg(BOARD_BG_PRESETS[0]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const board = await createBoard.mutateAsync({
        title: title.trim(),
        background: { type: 'color', value: bg },
      });
      toast.success('Board created');
      setOpen(false);
      reset();
      nav(`/boards/${board.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[420px] max-w-[92vw] bg-white rounded-lg shadow-popover p-5">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-base font-semibold text-on-surface">
              Create board
            </Dialog.Title>
            <Dialog.Close className="text-on-surface-variant hover:text-on-surface">
              <Icon name="close" />
            </Dialog.Close>
          </div>

          <div
            className="mx-auto rounded-md mb-4 flex items-end p-3"
            style={{
              backgroundColor: bg,
              height: 120,
              width: '90%',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
            }}
          >
            <div className="space-y-1">
              <div className="w-24 h-2 rounded bg-white/80" />
              <div className="w-16 h-2 rounded bg-white/60" />
              <div className="w-20 h-2 rounded bg-white/60" />
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Board title <span className="text-danger">*</span>
              </label>
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-outline rounded px-2 py-1.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="e.g. Product Launch Q3"
                maxLength={80}
              />
              {!title.trim() && (
                <p className="text-xs text-on-surface-variant mt-1">
                  Your board needs a title.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Background</label>
              <div className="flex flex-wrap gap-2">
                {BOARD_BG_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBg(c)}
                    className={clsx(
                      'w-10 h-8 rounded ring-offset-2 transition-[box-shadow]',
                      bg === c ? 'ring-2 ring-primary' : 'hover:opacity-90',
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Background ${c}`}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!title.trim() || createBoard.isPending}
              className="w-full bg-primary text-white font-semibold py-2 rounded-sm disabled:bg-primary/50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {createBoard.isPending ? 'Creating…' : 'Create'}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
