import { useEffect } from 'react';
import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { BoardHeader } from '@/components/board/BoardHeader';
import { BoardCanvas } from '@/components/board/BoardCanvas';
import { CardDetailModal } from '@/components/card/CardDetailModal';
import { ArchivedItemsDrawer } from '@/components/board/ArchivedItemsDrawer';
import { useBoard, useBoardLists } from '@/hooks/useBoard';
import { useUI } from '@/stores/ui';
import { AxiosError } from 'axios';

export default function BoardPage() {
  const { boardId = '' } = useParams<{ boardId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const openCard = useUI((s) => s.openCard);
  const openCardId = useUI((s) => s.openCardId);

  const board = useBoard(boardId);
  const lists = useBoardLists(boardId);

  const cardParam = searchParams.get('card');

  // URL → state: react only to URL changes (not to openCardId changes).
  useEffect(() => {
    if (cardParam) openCard(cardParam);
    else openCard(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardParam]);

  // state → URL: react only to openCardId changes (not to URL changes).
  useEffect(() => {
    if (openCardId && openCardId !== cardParam) {
      const next = new URLSearchParams(searchParams);
      next.set('card', openCardId);
      setSearchParams(next, { replace: true });
    } else if (!openCardId && cardParam) {
      const next = new URLSearchParams(searchParams);
      next.delete('card');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCardId]);

  // Clean up when navigating away
  useEffect(() => {
    return () => {
      openCard(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  if (board.isLoading || lists.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-primary/10">
        <div className="text-on-surface-variant text-sm">Loading board…</div>
      </div>
    );
  }

  if (board.error) {
    const status = (board.error as AxiosError)?.response?.status;
    if (status === 404) return <Navigate to="/404" replace />;
    return (
      <div className="flex-1 flex items-center justify-center bg-primary/10">
        <div className="text-danger text-sm">Failed to load board.</div>
      </div>
    );
  }

  if (!board.data) return null;

  const { board: b, members } = board.data;
  const bg = b.background;

  const style: React.CSSProperties =
    bg?.type === 'color'
      ? { backgroundColor: bg.value }
      : bg?.type === 'image'
        ? { backgroundImage: `url(${bg.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { backgroundColor: '#0079BF' };

  return (
    <div className="flex-1 flex flex-col min-h-0" style={style}>
      <BoardHeader board={b} members={members} />
      <BoardCanvas boardId={boardId} lists={lists.data ?? []} />
      <CardDetailModal boardId={boardId} />
      <ArchivedItemsDrawer boardId={boardId} />
    </div>
  );
}
