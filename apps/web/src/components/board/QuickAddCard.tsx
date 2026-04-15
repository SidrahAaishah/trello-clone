import { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/common/Icon';

interface Props {
  onAdd: (title: string) => Promise<unknown> | void;
  placeholder?: string;
}

export function QuickAddCard({ onAdd, placeholder = 'Enter a title for this card…' }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  const submit = async () => {
    const t = title.trim();
    if (!t) return;
    await onAdd(t);
    setTitle('');
    // keep open for adding many cards in a row
    textareaRef.current?.focus();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="m-2 flex items-center gap-2 p-2 text-on-surface-variant hover:bg-surface-container-high rounded-md transition-colors text-sm font-medium"
      >
        <Icon name="add" size={16} />
        <span>Add a card</span>
      </button>
    );
  }

  return (
    <div className="p-2 space-y-2">
      <textarea
        ref={textareaRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
          if (e.key === 'Escape') {
            setOpen(false);
            setTitle('');
          }
        }}
        rows={3}
        className="w-full bg-white rounded-md p-2 text-sm text-on-surface shadow-card outline-none focus:ring-2 focus:ring-primary resize-none"
        placeholder={placeholder}
      />
      <div className="flex items-center gap-2">
        <button
          onClick={submit}
          disabled={!title.trim()}
          className="bg-primary text-white font-semibold text-sm px-3 py-1.5 rounded-sm disabled:bg-primary/50 hover:bg-primary/90"
        >
          Add card
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setTitle('');
          }}
          className="p-1 text-on-surface-variant hover:text-on-surface"
        >
          <Icon name="close" />
        </button>
      </div>
    </div>
  );
}
