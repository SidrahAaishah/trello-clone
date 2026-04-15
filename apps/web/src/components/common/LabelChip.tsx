import clsx from 'clsx';
import { LABEL_COLOR_HEX, type Label } from '@trello-clone/shared';

interface Props {
  label: Pick<Label, 'color' | 'name'>;
  expanded?: boolean;
  onClick?: () => void;
  className?: string;
}

export function LabelChip({ label, expanded = false, onClick, className }: Props) {
  if (!expanded) {
    return (
      <span
        className={clsx('h-2 w-10 rounded-full block', className)}
        style={{ backgroundColor: LABEL_COLOR_HEX[label.color] }}
        title={label.name || label.color}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex items-center h-6 px-2 rounded-sm text-[11px] font-semibold text-white shadow-card',
        className,
      )}
      style={{ backgroundColor: LABEL_COLOR_HEX[label.color] }}
    >
      {label.name || '\u00A0'}
    </button>
  );
}
