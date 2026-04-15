import clsx from 'clsx';

interface Props {
  name: string;
  className?: string;
  size?: number;
}

export function Icon({ name, className, size }: Props) {
  return (
    <span
      className={clsx('material-symbols-outlined leading-none', className)}
      style={size ? { fontSize: `${size}px` } : undefined}
      aria-hidden
    >
      {name}
    </span>
  );
}
