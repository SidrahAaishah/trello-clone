import clsx from 'clsx';
import type { TemplateCategory } from '@trello-clone/shared';
import { TEMPLATE_CATEGORIES } from '@trello-clone/shared';

type Filter = TemplateCategory | 'all';

interface Props {
  value: Filter;
  onChange: (v: Filter) => void;
}

const CATEGORY_LABELS: Record<Filter, string> = {
  all: 'All',
  business: 'Business',
  design: 'Design',
  education: 'Education',
  marketing: 'Marketing',
  engineering: 'Engineering',
  sales: 'Sales',
};

/**
 * Horizontal filter strip for the templates gallery. "All" is the default
 * and shows the full listing — every other tab narrows the grid to that
 * category via the API `?category=` query.
 */
export function CategoryTabs({ value, onChange }: Props) {
  const tabs: Filter[] = ['all', ...TEMPLATE_CATEGORIES];

  return (
    <div className="border-b border-outline">
      <div className="flex gap-1 overflow-x-auto -mb-px">
        {tabs.map((tab) => {
          const active = tab === value;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChange(tab)}
              className={clsx(
                'px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant',
              )}
            >
              {CATEGORY_LABELS[tab]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
