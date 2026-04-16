import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import clsx from 'clsx';
import { Icon } from '@/components/common/Icon';

export type TemplateSort = 'popular' | 'newest' | 'alphabetical';

interface Props {
  value: TemplateSort;
  onChange: (v: TemplateSort) => void;
}

const OPTIONS: { value: TemplateSort; label: string; hint: string }[] = [
  { value: 'popular', label: 'Most popular', hint: 'Featured first, then by use count' },
  { value: 'newest', label: 'Newest', hint: 'Most recently added' },
  { value: 'alphabetical', label: 'Alphabetical', hint: 'Title A → Z' },
];

/**
 * Small Radix dropdown matching the existing list-menu styling. Picking a
 * non-"popular" sort collapses the featured hero row into a flat grid so
 * the chosen order is respected end-to-end.
 */
export function SortMenu({ value, onChange }: Props) {
  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0]!;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface-container text-on-surface hover:bg-surface-container-high text-sm"
        >
          <Icon name="sort" size={16} />
          <span>
            Sort: <span className="font-medium">{current.label}</span>
          </span>
          <Icon name="expand_more" size={16} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="bg-white rounded-md shadow-popover p-1 min-w-52 z-50"
        >
          {OPTIONS.map((opt) => {
            const active = opt.value === value;
            return (
              <DropdownMenu.Item
                key={opt.value}
                onSelect={() => onChange(opt.value)}
                className={clsx(
                  'flex items-start gap-2 px-3 py-2 rounded text-sm cursor-pointer outline-none',
                  active
                    ? 'bg-blue-50 text-primary'
                    : 'hover:bg-surface-container-low text-on-surface',
                )}
              >
                <Icon
                  name={active ? 'check' : 'radio_button_unchecked'}
                  size={16}
                  className={clsx(
                    'mt-0.5 flex-shrink-0',
                    active ? 'text-primary' : 'text-on-surface-variant/50',
                  )}
                />
                <span className="flex flex-col">
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-xs text-on-surface-variant">
                    {opt.hint}
                  </span>
                </span>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
