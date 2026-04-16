import { useMemo, useState } from 'react';
import type { TemplateCategory, TemplateSummary } from '@trello-clone/shared';
import { useTemplates } from '@/hooks/useTemplates';
import { Icon } from '@/components/common/Icon';
import { CategoryTabs } from '@/components/templates/CategoryTabs';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { CreateFromTemplateDialog } from '@/components/templates/CreateFromTemplateDialog';
import { SortMenu, type TemplateSort } from '@/components/templates/SortMenu';

type Filter = TemplateCategory | 'all';

export default function TemplatesPage() {
  const [category, setCategory] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<TemplateSort>('alphabetical');
  const [picked, setPicked] = useState<TemplateSummary | null>(null);

  // Only pass the category filter to the API when it's not "all" — server
  // returns the full listing otherwise, sorted most-popular-first.
  const { data: templates = [], isLoading } = useTemplates(
    category === 'all' ? {} : { category },
  );

  // Client-side text filter — cheap and instant, avoids a round trip.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q),
    );
  }, [templates, search]);

  // Apply the chosen sort on top of the filtered list. "Popular" leaves the
  // server-supplied order intact (featured + most-popular-first); the other
  // modes produce a flat, deterministic ordering regardless of featured-ness.
  const sorted = useMemo(() => {
    const arr = filtered.slice();
    switch (sort) {
      case 'newest':
        arr.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case 'alphabetical':
        arr.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'popular':
      default:
        // Server already returns by isMostPopular → isFeatured → useCount → title.
        break;
    }
    return arr;
  }, [filtered, sort]);

  // Only carve out hero/side tiles when sort === 'popular'. Any other sort
  // mode collapses to a single flat grid so the chosen order is honoured.
  const { hero, sides, rest } = useMemo(() => {
    if (sort !== 'popular') {
      return { hero: null, sides: [], rest: sorted };
    }
    const featured = sorted.filter((t) => t.isFeatured);
    const others = sorted.filter((t) => !t.isFeatured);

    const mostPopular = featured.find((t) => t.isMostPopular);
    const h = mostPopular ?? featured[0] ?? null;
    const sidePool = featured.filter((t) => t.id !== h?.id);
    const s = sidePool.slice(0, 2);
    const remaining = [...sidePool.slice(2), ...others];
    return { hero: h, sides: s, rest: remaining };
  }, [sorted, sort]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-on-surface">Templates</h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
            Get started faster with a board layout curated for common
            workflows. Pick a template, tweak the title, and you're ready to
            go.
          </p>
        </header>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <CategoryTabs value={category} onChange={setCategory} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Icon
              name="search"
              size={18}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates"
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-outline rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <SortMenu value={sort} onChange={setSort} />
        </div>

        {isLoading ? (
          <div className="text-on-surface-variant text-sm">Loading templates…</div>
        ) : sorted.length === 0 ? (
          <EmptyState category={category} query={search} />
        ) : (
          <div className="space-y-8">
            {hero && (
              <section>
                <h2 className="text-sm font-semibold text-on-surface mb-3">
                  Featured
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[140px]">
                  <TemplateCard
                    template={hero}
                    variant="hero"
                    onUse={setPicked}
                  />
                  {sides.map((t) => (
                    <div key={t.id} className="md:col-span-2">
                      <TemplateCard template={t} variant="side" onUse={setPicked} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {rest.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-on-surface mb-3">
                  {sort === 'newest'
                    ? 'Newest first'
                    : sort === 'alphabetical'
                      ? 'A → Z'
                      : 'All templates'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {rest.map((t) => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      variant="grid"
                      onUse={setPicked}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <CreateFromTemplateDialog
        template={picked}
        onClose={() => setPicked(null)}
      />
    </div>
  );
}

function EmptyState({ category, query }: { category: Filter; query: string }) {
  const reason = query.trim()
    ? `No templates match "${query.trim()}"`
    : category === 'all'
      ? 'No templates available yet'
      : `No templates in ${category}`;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-surface-container rounded-lg mb-4 flex items-center justify-center">
        <Icon name="dashboard_customize" size={28} className="text-primary" />
      </div>
      <h2 className="text-base font-semibold text-on-surface mb-1">{reason}</h2>
      <p className="text-sm text-on-surface-variant max-w-sm">
        Try another category or clear your search to see everything.
      </p>
    </div>
  );
}
