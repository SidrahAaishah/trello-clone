import { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/common/Icon';
import { useCreateList } from '@/hooks/useBoard';
import toast from 'react-hot-toast';

interface Props {
  boardId: string;
}

export function AddListColumn({ boardId }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const createList = useCreateList(boardId);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    try {
      await createList.mutateAsync({ title: t });
      setTitle('');
      inputRef.current?.focus();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <section className="w-[272px] flex-shrink-0 bg-white/20 rounded-lg self-start">
      {open ? (
        <form onSubmit={submit} className="p-2 space-y-2">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false);
                setTitle('');
              }
            }}
            placeholder="Enter list title…"
            className="w-full bg-white rounded px-2 py-1.5 text-sm font-medium text-on-surface outline-none ring-2 ring-primary"
            maxLength={120}
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!title.trim() || createList.isPending}
              className="bg-primary text-white font-semibold text-sm px-3 py-1.5 rounded-sm disabled:bg-primary/50 hover:bg-primary/90"
            >
              Add list
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setTitle('');
              }}
              className="p-1 text-white/80 hover:text-white"
            >
              <Icon name="close" />
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-2 p-3 text-white hover:bg-white/10 rounded-lg text-sm font-bold"
        >
          <Icon name="add" size={18} />
          <span>Add another list</span>
        </button>
      )}
    </section>
  );
}
