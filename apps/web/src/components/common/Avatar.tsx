import clsx from 'clsx';
import type { Member } from '@trello-clone/shared';

interface Props {
  member: Pick<Member, 'displayName' | 'initials' | 'avatarUrl' | 'color'>;
  size?: number;
  className?: string;
  ring?: string;
}

export function Avatar({ member, size = 28, className, ring }: Props) {
  const dim = `${size}px`;
  if (member.avatarUrl) {
    return (
      <img
        src={member.avatarUrl}
        alt={member.displayName}
        className={clsx('rounded-full object-cover', className, ring)}
        style={{ width: dim, height: dim }}
      />
    );
  }
  return (
    <div
      className={clsx(
        'rounded-full inline-flex items-center justify-center text-white font-semibold',
        className,
        ring,
      )}
      style={{
        width: dim,
        height: dim,
        backgroundColor: member.color,
        fontSize: size <= 24 ? 10 : size <= 32 ? 12 : 14,
      }}
      title={member.displayName}
    >
      {member.initials}
    </div>
  );
}

interface StackProps {
  members: Member[];
  size?: number;
  max?: number;
  ring?: string;
}

export function AvatarStack({ members, size = 28, max = 4, ring }: StackProps) {
  const shown = members.slice(0, max);
  const remaining = members.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map((m) => (
        <Avatar key={m.id} member={m} size={size} ring={ring ?? 'ring-2 ring-white/30'} />
      ))}
      {remaining > 0 && (
        <div
          className={clsx(
            'rounded-full bg-surface-container-high text-on-surface flex items-center justify-center text-[10px] font-bold',
            ring ?? 'ring-2 ring-white/30',
          )}
          style={{ width: size, height: size }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
