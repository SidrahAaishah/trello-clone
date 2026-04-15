import * as Dialog from '@radix-ui/react-dialog';
import { forwardRef, useEffect, useState } from 'react';
import clsx from 'clsx';
import type { CardDetail, Member } from '@trello-clone/shared';
import { Icon } from '@/components/common/Icon';
import { LabelChip } from '@/components/common/LabelChip';
import { Avatar } from '@/components/common/Avatar';
import { LabelPicker } from './LabelPicker';
import { MemberPicker } from './MemberPicker';
import { DueDatePicker } from './DueDatePicker';
import { CoverPicker } from './CoverPicker';
import { Checklist } from './Checklist';
import { CommentList } from './CommentList';
import { useUI } from '@/stores/ui';
import { useCardDetail, useAddChecklist } from '@/hooks/useCard';
import { useDeleteCard, useUpdateCard, useBoard, useBoardLists } from '@/hooks/useBoard';
import { useUsers } from '@/hooks/useUsers';
import { dueBadgeClasses, dueState, formatDueLong } from '@/utils/due';
import toast from 'react-hot-toast';

export function CardDetailModal({ boardId }: { boardId: string }) {
  const openCardId = useUI((s) => s.openCardId);
  const closeCard = useUI((s) => s.openCard);
  const { data: card, isLoading } = useCardDetail(openCardId);
  const { data: boardData } = useBoard(boardId);
  const { data: boardLists = [] } = useBoardLists(boardId);
  const { data: users = [] } = useUsers();
  const candidates: Member[] = boardData?.members ?? users;

  const updateCard = useUpdateCard(boardId);
  const deleteCard = useDeleteCard(boardId);
  const addChecklist = useAddChecklist(card?.id ?? '', boardId);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDesc(card.description);
    }
  }, [card?.id, card?.title, card?.description]);

  const close = () => closeCard(null);

  if (!openCardId) return null;

  return (
    <Dialog.Root open={!!openCardId} onOpenChange={(v) => !v && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
        <Dialog.Content
          className={clsx(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70]',
            'w-[768px] max-w-[94vw] max-h-[90vh] bg-surface rounded-lg shadow-popover overflow-hidden flex flex-col',
          )}
        >
          {isLoading || !card ? (
            <div className="p-10 text-on-surface-variant">Loading card…</div>
          ) : (
            <ModalBody
              card={card}
              boardId={boardId}
              candidates={candidates}
              listTitle={boardLists.find((l) => l.id === card.listId)?.title ?? ''}
              title={title}
              desc={desc}
              editingTitle={editingTitle}
              editingDesc={editingDesc}
              onTitle={setTitle}
              onDesc={setDesc}
              onEditingTitle={setEditingTitle}
              onEditingDesc={setEditingDesc}
              onSaveTitle={async () => {
                const t = title.trim();
                setEditingTitle(false);
                if (!t || t === card.title) {
                  setTitle(card.title);
                  return;
                }
                try {
                  await updateCard.mutateAsync({ cardId: card.id, input: { title: t } });
                } catch (err) {
                  toast.error((err as Error).message);
                }
              }}
              onSaveDesc={async () => {
                setEditingDesc(false);
                if (desc === card.description) return;
                try {
                  await updateCard.mutateAsync({ cardId: card.id, input: { description: desc } });
                } catch (err) {
                  toast.error((err as Error).message);
                }
              }}
              onClose={close}
              onArchive={async () => {
                try {
                  await updateCard.mutateAsync({
                    cardId: card.id,
                    input: { archivedAt: new Date().toISOString() },
                  });
                  toast.success('Card archived');
                  close();
                } catch (err) {
                  toast.error((err as Error).message);
                }
              }}
              onDelete={async () => {
                if (!window.confirm('Delete this card permanently?')) return;
                try {
                  await deleteCard.mutateAsync(card.id);
                  toast.success('Card deleted');
                  close();
                } catch (err) {
                  toast.error((err as Error).message);
                }
              }}
              onCover={async (cover) => {
                try {
                  await updateCard.mutateAsync({ cardId: card.id, input: { cover } });
                } catch (err) {
                  toast.error((err as Error).message);
                }
              }}
              onDue={async (dueAt) => {
                try {
                  await updateCard.mutateAsync({ cardId: card.id, input: { dueAt } });
                } catch (err) {
                  toast.error((err as Error).message);
                }
              }}
              onComplete={async (done) => {
                try {
                  await updateCard.mutateAsync({
                    cardId: card.id,
                    input: { dueComplete: done },
                  });
                } catch (err) {
                  toast.error((err as Error).message);
                }
              }}
              onAddChecklist={async () => {
                try {
                  await addChecklist.mutateAsync({ title: 'Checklist' });
                } catch (err) {
                  toast.error((err as Error).message);
                }
              }}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface BodyProps {
  card: CardDetail;
  boardId: string;
  candidates: Member[];
  listTitle: string;
  title: string;
  desc: string;
  editingTitle: boolean;
  editingDesc: boolean;
  onTitle: (s: string) => void;
  onDesc: (s: string) => void;
  onEditingTitle: (v: boolean) => void;
  onEditingDesc: (v: boolean) => void;
  onSaveTitle: () => void;
  onSaveDesc: () => void;
  onClose: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onCover: (cover: CardDetail['cover']) => void;
  onDue: (iso: string | null) => void;
  onComplete: (done: boolean) => void;
  onAddChecklist: () => void;
}

function ModalBody(props: BodyProps) {
  const { card, boardId, candidates } = props;
  const due = dueState(card.dueAt, card.dueComplete);

  return (
    <>
      {card.cover?.type === 'color' && (
        <div className="h-24 flex-shrink-0" style={{ backgroundColor: card.cover.value }} />
      )}
      {card.cover?.type === 'image' && (
        <div
          className="h-32 flex-shrink-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${card.cover.value})` }}
        />
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <header className="flex items-start gap-3">
            <Icon name="description" size={24} className="text-on-surface-variant mt-0.5" />
            <div className="flex-1 min-w-0">
              {props.editingTitle ? (
                <textarea
                  autoFocus
                  rows={1}
                  value={props.title}
                  onChange={(e) => props.onTitle(e.target.value)}
                  onBlur={props.onSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      props.onSaveTitle();
                    }
                  }}
                  className="w-full text-xl font-bold text-on-surface bg-white rounded px-2 py-1 outline-none ring-2 ring-primary resize-none"
                />
              ) : (
                <h1
                  className="text-xl font-bold text-on-surface px-2 py-1 rounded hover:bg-surface-container cursor-text"
                  onClick={() => props.onEditingTitle(true)}
                >
                  {card.title}
                </h1>
              )}
              <div className="text-xs text-on-surface-variant px-2 mt-1">
                in list <span className="underline">{props.listTitle || '—'}</span>
              </div>
            </div>
            <button
              onClick={props.onClose}
              className="p-1 rounded hover:bg-surface-container-high"
              aria-label="Close"
            >
              <Icon name="close" />
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6 mt-4">
            <div>
              {/* Badges row */}
              {(card.members.length > 0 || card.labels.length > 0 || card.dueAt) && (
                <div className="flex flex-wrap gap-4 mb-4">
                  {card.members.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant mb-1">
                        Members
                      </div>
                      <div className="flex -space-x-2">
                        {card.members.map((m) => (
                          <Avatar key={m.id} member={m} size={28} ring="ring-2 ring-surface" />
                        ))}
                      </div>
                    </div>
                  )}
                  {card.labels.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant mb-1">
                        Labels
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {card.labels.map((l) => (
                          <LabelChip key={l.id} label={l} expanded />
                        ))}
                      </div>
                    </div>
                  )}
                  {card.dueAt && due && (
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant mb-1">
                        Due date
                      </div>
                      <button
                        onClick={() => props.onComplete(!card.dueComplete)}
                        className={clsx(
                          'inline-flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-semibold',
                          dueBadgeClasses[due],
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={card.dueComplete}
                          readOnly
                          className="pointer-events-none"
                        />
                        {formatDueLong(card.dueAt)}
                        {card.dueComplete && ' · complete'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <section className="mb-6">
                <div className="flex items-center gap-2 font-semibold text-on-surface text-sm mb-2">
                  <Icon name="subject" size={18} /> Description
                </div>
                {props.editingDesc ? (
                  <div>
                    <textarea
                      autoFocus
                      rows={6}
                      value={props.desc}
                      onChange={(e) => props.onDesc(e.target.value)}
                      className="w-full border border-outline rounded-md px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={props.onSaveDesc}
                        className="bg-primary text-white font-semibold text-sm px-3 py-1.5 rounded-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          props.onDesc(card.description);
                          props.onEditingDesc(false);
                        }}
                        className="text-sm text-on-surface-variant"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => props.onEditingDesc(true)}
                    className="w-full min-h-[72px] text-left bg-surface-container rounded-md px-3 py-2 text-sm text-on-surface hover:bg-surface-container-high"
                  >
                    {card.description || (
                      <span className="text-on-surface-variant">Add a more detailed description…</span>
                    )}
                  </button>
                )}
              </section>

              {card.checklists.map((cl) => (
                <Checklist key={cl.id} checklist={cl} cardId={card.id} boardId={boardId} />
              ))}

              <section>
                <div className="flex items-center gap-2 font-semibold text-on-surface text-sm mb-3">
                  <Icon name="chat" size={18} /> Activity & comments
                </div>
                <CommentList cardId={card.id} boardId={boardId} comments={card.comments} />
              </section>
            </div>

            {/* Actions sidebar */}
            <aside className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant mb-1">
                Add to card
              </div>
              <MemberPicker
                boardId={boardId}
                cardId={card.id}
                selected={card.members}
                candidates={candidates}
              >
                <SideButton icon="person_add" label="Members" />
              </MemberPicker>
              <LabelPicker boardId={boardId} cardId={card.id} selected={card.labels}>
                <SideButton icon="sell" label="Labels" />
              </LabelPicker>
              <button
                onClick={props.onAddChecklist}
                className="w-full flex items-center gap-2 text-sm text-on-surface bg-surface-container hover:bg-surface-container-high rounded-sm px-2 py-1.5"
              >
                <Icon name="check_box" size={18} /> Checklist
              </button>
              <DueDatePicker
                value={card.dueAt}
                complete={card.dueComplete}
                onChange={props.onDue}
                onComplete={props.onComplete}
              >
                <SideButton icon="schedule" label="Due date" />
              </DueDatePicker>
              <CoverPicker value={card.cover} onChange={props.onCover}>
                <SideButton icon="image" label="Cover" />
              </CoverPicker>

              <div className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant mt-4 mb-1">
                Actions
              </div>
              <button
                onClick={props.onArchive}
                className="w-full flex items-center gap-2 text-sm text-on-surface bg-surface-container hover:bg-surface-container-high rounded-sm px-2 py-1.5"
              >
                <Icon name="archive" size={18} /> Archive
              </button>
              <button
                onClick={props.onDelete}
                className="w-full flex items-center gap-2 text-sm text-danger bg-surface-container hover:bg-danger/10 rounded-sm px-2 py-1.5"
              >
                <Icon name="delete" size={18} /> Delete
              </button>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

type SideButtonProps = {
  icon: string;
  label: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const SideButton = forwardRef<HTMLButtonElement, SideButtonProps>(
  ({ icon, label, ...rest }, ref) => (
    <button
      ref={ref}
      {...rest}
      className="w-full flex items-center gap-2 text-sm text-on-surface bg-surface-container hover:bg-surface-container-high rounded-sm px-2 py-1.5"
    >
      <Icon name={icon} size={18} /> {label}
    </button>
  ),
);
SideButton.displayName = 'SideButton';
