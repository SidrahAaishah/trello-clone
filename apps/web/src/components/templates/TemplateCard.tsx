import type { TemplateSummary } from '@trello-clone/shared';
import { Icon } from '@/components/common/Icon';

interface Props {
  template: TemplateSummary;
  onUse: (t: TemplateSummary) => void;
  variant?: 'grid' | 'hero' | 'side';
}

/**
 * Renders a template tile. Three variants share a visual language:
 *  - `hero`  — wide featured card (top-left of the gallery)
 *  - `side`  — tall featured card (top-right column)
 *  - `grid`  — small gallery card
 *
 * Cover art: prefers coverImageUrl (Unsplash), falls back to coverGradient,
 * and finally to a flat board-background color so we never render an empty
 * surface. All three variants route through a single click handler so the
 * caller can pop the create dialog with the chosen template.
 */
export function TemplateCard({ template, onUse, variant = 'grid' }: Props) {
  // Cover resolution priority: explicit image URL → CSS linear-gradient
  // stored on the template → fall back to the board's background color so
  // we always render something meaningful.
  const coverStyle: React.CSSProperties = template.coverImageUrl
    ? {
        backgroundImage: `url(${template.coverImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : template.coverGradient
      ? { backgroundImage: template.coverGradient }
      : { backgroundColor: template.boardBackground.value };

  if (variant === 'hero') {
    return (
      <button
        type="button"
        onClick={() => onUse(template)}
        className="group relative col-span-2 row-span-2 rounded-lg overflow-hidden text-left shadow-card hover:shadow-card-lift transition-shadow min-h-[280px]"
        style={coverStyle}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        {template.isMostPopular && (
          <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/90 text-primary text-xs font-semibold px-2 py-1 shadow">
            <Icon name="trending_up" size={14} />
            Most popular
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <h3 className="text-xl font-bold drop-shadow mb-1">{template.title}</h3>
          <p className="text-sm text-white/90 line-clamp-2 max-w-md">
            {template.description}
          </p>
          <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white/90 group-hover:text-white">
            Use this template
            <Icon name="arrow_forward" size={14} />
          </div>
        </div>
      </button>
    );
  }

  if (variant === 'side') {
    return (
      <button
        type="button"
        onClick={() => onUse(template)}
        className="group relative rounded-lg overflow-hidden text-left shadow-card hover:shadow-card-lift transition-shadow min-h-[130px]"
        style={coverStyle}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
          <h3 className="text-sm font-bold drop-shadow line-clamp-1">{template.title}</h3>
          <p className="text-xs text-white/85 line-clamp-1 mt-0.5">
            {template.description}
          </p>
        </div>
      </button>
    );
  }

  // Grid variant — compact tile used in the main gallery.
  return (
    <button
      type="button"
      onClick={() => onUse(template)}
      className="group flex flex-col bg-white rounded-md overflow-hidden shadow-card hover:shadow-card-lift transition-shadow text-left h-full"
    >
      <div className="h-24 w-full" style={coverStyle} />
      <div className="flex-1 p-3">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wide text-on-surface-variant">
          <span>{template.category}</span>
          {template.isFeatured && (
            <span className="inline-flex items-center text-primary">
              · Featured
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-on-surface mt-0.5 line-clamp-1">
          {template.title}
        </h3>
        <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
          {template.description}
        </p>
      </div>
      <div className="px-3 pb-3 flex items-center justify-between text-xs text-on-surface-variant">
        <span className="inline-flex items-center gap-1">
          <Icon name="groups" size={14} />
          {template.useCount} uses
        </span>
        <span className="text-primary font-semibold group-hover:underline">
          Use
        </span>
      </div>
    </button>
  );
}
