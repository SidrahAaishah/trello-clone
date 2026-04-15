import { useState } from 'react';
import clsx from 'clsx';
import type { Checklist as TChecklist } from '@trello-clone/shared';
import { Icon } from '@/components/common/Icon';
import {
  useAddChecklistItem,
  useDeleteChecklist,
  useDeleteChecklistItem,
  useUpdateChecklistItem,
} from '@/hooks/useCard';

interface Props {
  checklist: TChecklist;
  cardId: string;
  boardId: string;
}

export function Checklist({ checklist, cardId, boardId }: Props) {
  const addItem = useAddChecklistItem(cardId, checklist.id, boardId);
  const updateItem = useUpdateChecklistItem(cardId, boardId);
  const deleteItem = useDeleteChecklistItem(cardId, boardId);
  const deleteChecklist = useDeleteChecklist(cardId, boardId);
  const [addOpen, setAddOpen] = useState(false);
  const [newText, setNewText] = useState('');

  const total = checklist.items.length;
  const done = checklist.items.filter((i) => i.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const submit = async () => {
    const t = newText.trim();
    if (!t) return;
    await addItem.mutateAsync({ text: t });
    setNewText('');
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-on-surface font-semibold text-sm">
          <Icon name="check_box" size={18} />
          {checklist.title}
        </div>
        <button
          onClick={() => deleteChecklist.mutate(checklist.id)}
          className="text-xs text-on-surface-variant hover:text-on-surface px-2 py-1 rounded hover:bg-surface-container-low"
        >
          Delete
        </button>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-on-surface-variant w-8">{pct}%</span>
        <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
          <div
            className={clsx('h-full transition-all', pct === 100 ? 'bg-[#61BD4F]' : 'bg-primary')}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ul className="space-y-1">
        {[...checklist.items]
          .sort((a, b) => a.position - b.position)
          .map((it) => (
            <li key={it.id} className="flex items-start gap-2 group rounded hover:bg-surface-container-low px-1 py-0.5">
              <input
                type="checkbox"
                checked={it.done}
                onChange={(e) =>
                  updateItem.mutate({
                    itemId: it.id,
                    input: { done: e.target.checked },
                  })
                }
                className="mt-1"
              />
              <span
                className={clsx(
                  'flex-1 text-sm text-on-surface break-words',
                  it.done && 'line-through opacity-60',
                )}
              >
                {it.text}
              </span>
              <button
                onClick={() => deleteItem.mutate(it.id)}
                className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-danger"
                aria-label="Delete item"
              >
                <Icon name="delete" size={16} />
              </button>
            </li>
          ))}
      </ul>

      {addOpen ? (
        <div className="mt-2 pl-6 space-y-2">
          <textarea
            autoFocus
            rows={2}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Add an item…"
            className="w-full border border-outline rounded px-2 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
              if (e.key === 'Escape') {
                setAddOpen(false);
                setNewText('');
              }
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={!newText.trim()}
              className="bg-primary text-white font-semibold text-sm px-3 py-1.5 rounded-sm disabled:bg-primary/50"
            >
              Add
            </button>
            <button
              onClick={() => {
                setAddOpen(false);
                setNewText('');
              }}
              className="text-sm text-on-surface-variant"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddOpen(true)}
          className="mt-2 ml-6 text-sm text-on-surface-variant hover:text-on-surface bg-surface-container hover:bg-surface-container-high px-2 py-1 rounded"
        >
          Add an item
        </button>
      )}
    </section>
  );
}
