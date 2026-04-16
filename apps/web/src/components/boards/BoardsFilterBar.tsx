import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import clsx from 'clsx';
import { Icon } from '@/components/common/Icon';

export type BoardView = 'all' | 'starred' | 'recent';
export type BoardBgFilter = 'all' | 'color' | 'image' | 'gradient';
export type BoardSort = 'recent' | 'oldest' | 'alphabetical' | 'reverse';

export interface BoardFilters {
  search: string;
  view: BoardView;
  bg: BoardBgFilter;
  sort: BoardSort;
}

interface Props {
  value: BoardFilters;
  onChange: (next: BoardFilters) => void;
  totalCount: number;
  visibleCount: number;
}

const VIEW_OPTIONS: { value: BoardView; label: string; hint: string }[] = [
  { value: 'all', label: 'All boards', hint: 'Everything you own or join' },
  { value: 'starred', label: 'Starred only', hint: 'Boards you\u2019ve starred' },
  { value: 'recent', label: 'Recent', hint: 'Most recently updated' },
];

const BG_OPTIONS: { value: BoardBgFilter; label: string }[] = [
  { value: 'all', label: 'All backgrounds' },
  { value: 'color', label: 'Solid color' },
  { value: 'image', label: 'Photo' },
  { value: 'gradient', label: 'Gradient' },
];

const SORT_OPTIONS: { value: BoardSort; label: string; hint: string }[] = [
  { value: 'recent', label: 'Most recent', hint: 'Updated most recently first' },
  { value: 'oldest', label: 'Oldest', hint: 'Updated least recently first' },
  { value: 'alphabetical', label: 'A \u2192 Z', hint: 'Title alphabetical' },
  { value: 'reverse', label: 'Z \u2192 A', hint: 'Title reverse alphabetical' },
];

export function BoardsFilterBar({ value, onChange, totalCount, visibleCount }: Props) {
  const set = <K extends keyof BoardFilters>(k: K, v: BoardFilters[K]) =>
    onChange({ ...value, [k]: v });

  const activeChips: { label: string; onClear: () => void }[] = [];
  if (value.view !== 'all') {
    activeChips.push({
      label: VIEW_OPTIONS.find((o) => o.value === value.view)!.label,
      onClear: () => set('view', 'all'),
    });
  }
  if (value.bg !== 'all') {
    activeChips.push({
      label: BG_OPTIONS.find((o) => o.value === value.bg)!.label,
      onClear: () => set('bg', 'all'),
    });
  }
  if (value.search.trim()) {
    activeChips.push({
      label: `"${value.search.trim()}"`,
      onClear: () => set('search', ''),
    });
  }

  const clearAll = () =>
    onChange({ search: '', view: 'all', bg: 'all', sort: 'recent' });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Icon
            name="search"
            size={18}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="text"
            value={value.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Search boards"
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-outline rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>

        <FilterDropdown
          icon="visibility"
          label="Show"
          options={VIEW_OPTIONS}
          value={value.view}
          onChange={(v) => set('view', v)}
        />

        <FilterDropdown
          icon="palette"
          label="Background"
          options={BG_OPTIONS.map((o) => ({ ...o, hint: '' }))}
          value={value.bg}
          onChange={(v) => set('bg', v)}
        />

        <FilterDropdown
          icon="sort"
          label="Sort"
          options={SORT_OPTIONS}
          value={value.sort}
          onChange={(v) => set('sort', v)}
        />
      </div>

      <div className="flex items-center flex-wrap gap-2 text-xs text-on-surface-variant">
        <span>
          Showing <span className="font-semibold text-on-surface">{visibleCount}</span> of{' '}
          {totalCount}
        </span>
        {activeChips.length > 0 && (
          <>
            <span className="text-on-surface-variant/60">{'\u2022'}</span>
            {activeChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.onClear}
                className="inline-flex items-center gap-1 bg-blue-50 text-primary px-2 py-0.5 rounded-full hover:bg-blue-100"
              >
                {chip.label}
                <Icon name="close" size={12} />
              </button>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="text-on-surface-variant hover:text-on-surface underline underline-offset-2"
            >
              Clear all
            </button>
          </>
        )}
      </div>
    </div>
  );
}

interface FilterDropdownProps<T extends string> {
  icon: string;
  label: string;
  options: { value: T; label: string; hint?: string }[];
  value: T;
  onChange: (v: T) => void;
}

function FilterDropdown<T extends string>({
  icon,
  label,
  options,
  value,
  onChange,
}: FilterDropdownProps<T>) {
  const current = options.find((o) => o.value === value) ?? options[0]!;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface-container text-on-surface hover:bg-surface-container-high text-sm"
        >
          <Icon name={icon} size={16} />
          <span className="text-on-surface-variant">{label}:</span>
          <span className="font-medium">{current.label}</span>
          <Icon name="expand_more" size={16} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="bg-white rounded-md shadow-popover p-1 min-w-52 z-50"
        >
          {options.map((opt) => {
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
                  {opt.hint && (
                    <span className="text-xs text-on-surface-variant">{opt.hint}</span>
                  )}
                </span>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
