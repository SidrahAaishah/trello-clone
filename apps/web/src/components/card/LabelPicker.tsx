import * as Popover from '@radix-ui/react-popover';
import { useState } from 'react';
import clsx from 'clsx';
import { LABEL_COLORS, LABEL_COLOR_HEX, type Label, type LabelColor } from '@trello-clone/shared';
import { Icon } from '@/components/common/Icon';
import { useBoardLabels } from '@/hooks/useBoard';
import { useCreateLabel, useDeleteLabel, useUpdateLabel } from '@/hooks/useLabels';
import { useCardLabelToggle } from '@/hooks/useCard';

interface Props {
  boardId: string;
  cardId: string;
  selected: Label[];
  children: React.ReactNode;
}

export function LabelPicker({ boardId, cardId, selected, children }: Props) {
  const { data: labels = [] } = useBoardLabels(boardId);
  const toggle = useCardLabelToggle(boardId, cardId);
  const create = useCreateLabel(boardId);
  const update = useUpdateLabel(boardId);
  const remove = useDeleteLabel(boardId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState<LabelColor>('green');

  const selectedIds = new Set(selected.map((l) => l.id));

  const beginEdit = (l: Label) => {
    setEditingId(l.id);
    setEditName(l.name);
    setEditColor(l.color);
  };

  return (
    <Popover.Root
      onOpenChange={(v) => {
        if (!v) setEditingId(null);
      }}
    >
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          className="bg-white rounded-md shadow-popover w-80 p-4 z-[80]"
        >
          {editingId ? (
            <EditLabelPanel
              name={editName}
              color={editColor}
              onName={setEditName}
              onColor={setEditColor}
              onCancel={() => setEditingId(null)}
              onSave={async () => {
                await update.mutateAsync({
                  labelId: editingId,
                  input: { name: editName, color: editColor },
                });
                setEditingId(null);
              }}
              onDelete={async () => {
                await remove.mutateAsync(editingId);
                setEditingId(null);
              }}
            />
          ) : (
            <>
              <div className="text-sm font-semibold text-on-surface mb-2">Labels</div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {labels.map((l) => {
                  const active = selectedIds.has(l.id);
                  return (
                    <div
                      key={l.id}
                      className={clsx(
                        'flex items-center gap-2 rounded',
                        active ? 'bg-surface-container-low' : 'hover:bg-surface-container-low',
                      )}
                    >
                      <button
                        onClick={() => toggle.mutate({ labelId: l.id, add: !active })}
                        className="flex-1 flex items-center gap-2 px-2 py-1.5 text-left"
                      >
                        <span
                          className="h-6 rounded flex-1 flex items-center px-2 text-[11px] font-semibold text-white"
                          style={{ backgroundColor: LABEL_COLOR_HEX[l.color] }}
                        >
                          {l.name || '\u00A0'}
                        </span>
                        {active && <Icon name="check" size={16} className="text-primary" />}
                      </button>
                      <button
                        onClick={() => beginEdit(l)}
                        className="p-1 text-on-surface-variant hover:text-on-surface"
                        aria-label="Edit label"
                      >
                        <Icon name="edit" size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={async () => {
                  const label = await create.mutateAsync({ name: '', color: 'green' });
                  beginEdit(label);
                }}
                className="mt-3 w-full text-sm font-semibold text-primary hover:bg-surface-container-low rounded px-2 py-1.5"
              >
                Create a new label
              </button>
            </>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function EditLabelPanel({
  name,
  color,
  onName,
  onColor,
  onCancel,
  onSave,
  onDelete,
}: {
  name: string;
  color: LabelColor;
  onName: (s: string) => void;
  onColor: (c: LabelColor) => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button onClick={onCancel} className="text-on-surface-variant">
          <Icon name="arrow_back" size={18} />
        </button>
        <div className="text-sm font-semibold">Edit label</div>
        <div />
      </div>
      <label className="block text-[11px] font-bold uppercase tracking-wide text-on-surface-variant mb-1">
        Title
      </label>
      <input
        value={name}
        onChange={(e) => onName(e.target.value)}
        placeholder="Label name (optional)"
        maxLength={60}
        className="w-full border border-outline rounded px-2 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <div className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant mt-3 mb-1">
        Color
      </div>
      <div className="grid grid-cols-5 gap-2">
        {LABEL_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onColor(c)}
            className={clsx(
              'h-8 rounded ring-offset-2',
              color === c && 'ring-2 ring-primary',
            )}
            style={{ backgroundColor: LABEL_COLOR_HEX[c] }}
          />
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={onSave}
          className="bg-primary text-white font-semibold text-sm px-3 py-1.5 rounded-sm hover:bg-primary/90"
        >
          Save
        </button>
        <button
          onClick={onDelete}
          className="text-danger font-semibold text-sm px-3 py-1.5 rounded-sm hover:bg-danger/10"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
