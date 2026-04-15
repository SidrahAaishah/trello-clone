import * as Popover from '@radix-ui/react-popover';
import { format } from 'date-fns';
import { useState } from 'react';

interface Props {
  value: string | null;
  complete: boolean;
  onChange: (iso: string | null) => void;
  onComplete: (done: boolean) => void;
  children: React.ReactNode;
}

// A pragmatic date + time input. Not a full calendar — this keeps the bundle light.
export function DueDatePicker({ value, complete, onChange, onComplete, children }: Props) {
  const [local, setLocal] = useState<string>(
    value ? format(new Date(value), "yyyy-MM-dd'T'HH:mm") : '',
  );

  return (
    <Popover.Root>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          className="bg-white rounded-md shadow-popover w-72 p-4 z-[80]"
        >
          <div className="text-sm font-semibold text-on-surface mb-2">Due date</div>
          <input
            type="datetime-local"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            className="w-full border border-outline rounded px-2 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={complete}
              onChange={(e) => onComplete(e.target.checked)}
            />
            Mark complete
          </label>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                if (!local) return;
                onChange(new Date(local).toISOString());
              }}
              className="bg-primary text-white font-semibold text-sm px-3 py-1.5 rounded-sm hover:bg-primary/90"
              disabled={!local}
            >
              Save
            </button>
            <button
              onClick={() => {
                setLocal('');
                onChange(null);
              }}
              className="text-danger font-semibold text-sm px-3 py-1.5 rounded-sm hover:bg-danger/10"
            >
              Remove
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
