import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { TemplateSummary } from '@trello-clone/shared';
import { Icon } from '@/components/common/Icon';
import { useInstantiateTemplate } from '@/hooks/useTemplates';

interface Props {
  template: TemplateSummary | null;
  onClose: () => void;
}

/**
 * Shown after a user clicks "Use" on any template card. Single configurable
 * knob (Include sample cards, default on); title pre-fills with the template
 * name so power users can just hit Enter. On success we navigate the user
 * straight to the new board — consistent with the blank-board flow.
 */
export function CreateFromTemplateDialog({ template, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [includeCards, setIncludeCards] = useState(true);
  const instantiate = useInstantiateTemplate();
  const nav = useNavigate();

  const open = template !== null;

  // Pre-fill the title whenever a template is selected. Reset on close so
  // reopening the dialog with a different template doesn't show stale input.
  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setIncludeCards(true);
    }
  }, [template]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template || !title.trim()) return;
    try {
      const board = await instantiate.mutateAsync({
        templateId: template.id,
        input: { title: title.trim(), includeCards },
      });
      toast.success('Board created from template');
      onClose();
      nav(`/boards/${board.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // Same cover resolution logic as TemplateCard: image > CSS gradient > flat
  // board background colour. Gradient is a raw CSS linear-gradient string so
  // Tailwind's JIT never gets in the way.
  const coverStyle: React.CSSProperties = template?.coverImageUrl
    ? {
        backgroundImage: `url(${template.coverImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : template?.coverGradient
      ? { backgroundImage: template.coverGradient }
      : template
        ? { backgroundColor: template.boardBackground.value }
        : {};

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[440px] max-w-[92vw] bg-white rounded-lg shadow-popover p-5">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-base font-semibold text-on-surface">
              Create board from template
            </Dialog.Title>
            <Dialog.Close className="text-on-surface-variant hover:text-on-surface">
              <Icon name="close" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Pick a title and whether to include sample cards, then create a
            new board from the selected template.
          </Dialog.Description>

          {template && (
            <>
              <div
                className="mx-auto rounded-md mb-4 flex items-end p-3 relative overflow-hidden"
                style={{
                  height: 120,
                  width: '100%',
                  ...coverStyle,
                }}
              >
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10">
                  <div className="text-[11px] uppercase font-bold tracking-wide text-white/90 mb-0.5">
                    {template.category}
                  </div>
                  <div className="text-white font-semibold drop-shadow">
                    {template.title}
                  </div>
                </div>
              </div>

              <p className="text-xs text-on-surface-variant mb-4 line-clamp-3">
                {template.description}
              </p>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Board title <span className="text-danger">*</span>
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-outline rounded px-2 py-1.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="e.g. Q3 Launch Plan"
                    maxLength={80}
                  />
                  {!title.trim() && (
                    <p className="text-xs text-on-surface-variant mt-1">
                      Your board needs a title.
                    </p>
                  )}
                </div>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeCards}
                    onChange={(e) => setIncludeCards(e.target.checked)}
                    className="mt-0.5 accent-primary h-4 w-4"
                  />
                  <span className="flex flex-col">
                    <span className="text-sm text-on-surface font-medium">
                      Include sample cards
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      Pre-fill lists with example cards, checklists, and
                      labels. Uncheck to keep only the list structure.
                    </span>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!title.trim() || instantiate.isPending}
                  className="w-full bg-primary text-white font-semibold py-2 rounded-sm disabled:bg-primary/50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                >
                  {instantiate.isPending ? 'Creating…' : 'Create board'}
                </button>
              </form>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
