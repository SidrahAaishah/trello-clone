import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import type { CardSummary } from '@trello-clone/shared';
import { LabelChip } from '@/components/common/LabelChip';
import { Avatar, AvatarStack } from '@/components/common/Avatar';
import { Icon } from '@/components/common/Icon';
import { dueBadgeClasses, dueState, formatDueShort } from '@/utils/due';

interface Props {
  card: CardSummary;
  onClick: () => void;
}

export function CardTile({ card, onClick }: Props) {
  const sortable = useSortable({
    id: card.id,
    data: { type: 'card', cardId: card.id, listId: card.listId },
  });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const due = dueState(card.dueAt, card.dueComplete);
  const hasCover = !!card.cover;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Don't open the modal during a drag gesture.
        if (isDragging) return;
        e.stopPropagation();
        onClick();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={clsx(
        'bg-white rounded-md shadow-card hover:shadow-card-lift hover:bg-slate-50 transition-all cursor-pointer overflow-hidden group',
        isDragging && 'opacity-40 ring-2 ring-primary',
      )}
    >
      {hasCover && card.cover?.type === 'color' && (
        <div className="h-8" style={{ backgroundColor: card.cover.value }} />
      )}
      {hasCover && card.cover?.type === 'image' && (
        <div
          className="h-24 bg-cover bg-center"
          style={{ backgroundImage: `url(${card.cover.value})` }}
        />
      )}

      <div className="px-3 pt-2 pb-2">
        {card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {card.labels.map((l) => (
              <LabelChip key={l.id} label={l} />
            ))}
          </div>
        )}

        <div className="flex gap-2 items-start">
          <h3
            className={clsx(
              'text-sm text-on-surface flex-1',
              card.dueComplete && 'line-through opacity-70',
            )}
          >
            {card.title}
          </h3>
        </div>

        {(due || card.checklistSummary.total > 0 || card.commentCount > 0 || card.members.length > 0) && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 flex-wrap">
              {due && card.dueAt && (
                <div
                  className={clsx(
                    'flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[11px] font-bold',
                    dueBadgeClasses[due],
                  )}
                >
                  <Icon
                    name={due === 'complete' ? 'done' : 'schedule'}
                    size={14}
                  />
                  <span>{formatDueShort(card.dueAt)}</span>
                </div>
              )}
              {card.commentCount > 0 && (
                <span className="flex items-center gap-1 text-on-surface-variant text-[11px]">
                  <Icon name="chat_bubble_outline" size={14} />
                  {card.commentCount}
                </span>
              )}
              {card.checklistSummary.total > 0 && (
                <span
                  className={clsx(
                    'flex items-center gap-1 text-[11px]',
                    card.checklistSummary.done === card.checklistSummary.total
                      ? 'text-[#61BD4F] font-semibold'
                      : 'text-on-surface-variant',
                  )}
                >
                  <Icon name="check_box" size={14} />
                  {card.checklistSummary.done}/{card.checklistSummary.total}
                </span>
              )}
            </div>
            {card.members.length > 0 && (
              card.members.length === 1 ? (
                <Avatar member={card.members[0]!} size={24} />
              ) : (
                <AvatarStack members={card.members} size={22} max={3} ring="ring-2 ring-white" />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
