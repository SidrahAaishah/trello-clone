import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Comment } from '@trello-clone/shared';
import { Avatar } from '@/components/common/Avatar';
import { useAddComment, useDeleteComment, useUpdateComment } from '@/hooks/useCard';
import { useMe } from '@/hooks/useUsers';

interface Props {
  cardId: string;
  boardId: string;
  comments: Comment[];
}

export function CommentList({ cardId, boardId, comments }: Props) {
  const addComment = useAddComment(cardId, boardId);
  const { data: me } = useMe();
  const [body, setBody] = useState('');

  const submit = async () => {
    const t = body.trim();
    if (!t) return;
    await addComment.mutateAsync({ body: t });
    setBody('');
  };

  return (
    <section>
      <div className="flex items-start gap-3 mb-4">
        {me && <Avatar member={me} size={32} />}
        <div className="flex-1">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a comment…"
            rows={2}
            className="w-full border border-outline rounded px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none bg-white"
          />
          {body.trim().length > 0 && (
            <div className="mt-2 flex gap-2">
              <button
                onClick={submit}
                className="bg-primary text-white font-semibold text-sm px-3 py-1.5 rounded-sm hover:bg-primary/90"
              >
                Save
              </button>
              <button
                onClick={() => setBody('')}
                className="text-sm text-on-surface-variant"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
      <ul className="space-y-4">
        {comments.map((c) => (
          <CommentItem key={c.id} comment={c} cardId={cardId} />
        ))}
      </ul>
    </section>
  );
}

function CommentItem({ comment, cardId }: { comment: Comment; cardId: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(comment.body);
  const update = useUpdateComment(cardId);
  const remove = useDeleteComment(cardId);

  return (
    <li className="flex items-start gap-3">
      {comment.author && <Avatar member={comment.author} size={32} />}
      <div className="flex-1">
        <div className="text-sm">
          <span className="font-semibold text-on-surface">
            {comment.author?.displayName ?? 'Someone'}
          </span>
          <span className="ml-2 text-xs text-on-surface-variant">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
        {editing ? (
          <div className="mt-1">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={2}
              className="w-full border border-outline rounded px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <div className="mt-1 flex gap-2">
              <button
                onClick={async () => {
                  await update.mutateAsync({
                    commentId: comment.id,
                    input: { body: value },
                  });
                  setEditing(false);
                }}
                className="bg-primary text-white font-semibold text-sm px-3 py-1.5 rounded-sm"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setValue(comment.body);
                }}
                className="text-sm text-on-surface-variant"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-1 bg-white border border-outline rounded-md px-3 py-2 text-sm text-on-surface whitespace-pre-wrap break-words">
              {comment.body}
            </div>
            <div className="mt-1 text-xs flex gap-3">
              <button
                onClick={() => setEditing(true)}
                className="text-on-surface-variant hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => remove.mutate(comment.id)}
                className="text-on-surface-variant hover:underline"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </li>
  );
}
