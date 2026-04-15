import * as Popover from '@radix-ui/react-popover';
import clsx from 'clsx';
import { BOARD_BG_PRESETS, type CardCover } from '@trello-clone/shared';

interface Props {
  value: CardCover;
  onChange: (cover: CardCover) => void;
  children: React.ReactNode;
}

export function CoverPicker({ value, onChange, children }: Props) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          className="bg-white rounded-md shadow-popover w-64 p-3 z-[80]"
        >
          <div className="text-sm font-semibold text-on-surface mb-2">Cover</div>
          <div className="grid grid-cols-3 gap-2">
            {BOARD_BG_PRESETS.map((c) => {
              const selected = value?.type === 'color' && value.value === c;
              return (
                <button
                  key={c}
                  onClick={() => onChange({ type: 'color', value: c })}
                  className={clsx(
                    'h-10 rounded transition-[box-shadow]',
                    selected && 'ring-2 ring-primary ring-offset-2',
                  )}
                  style={{ backgroundColor: c }}
                />
              );
            })}
          </div>
          <button
            onClick={() => onChange(null)}
            className="mt-3 w-full text-sm text-danger font-semibold rounded px-2 py-1.5 hover:bg-danger/10"
          >
            Remove cover
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
