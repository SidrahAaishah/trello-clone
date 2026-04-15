import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CardSummary, List } from '@trello-clone/shared';
import { api } from '@/lib/api';
import { boardListsKey } from './useBoard';

export const archivedKey = (boardId: string) => ['board', boardId, 'archived'] as const;

export interface ArchivedItems {
  lists: List[];
  cards: CardSummary[];
}

export function useArchivedItems(boardId: string, enabled = true) {
  return useQuery({
    queryKey: archivedKey(boardId),
    queryFn: async () => {
      const { data } = await api.get<ArchivedItems>(`/boards/${boardId}/archived`);
      return data;
    },
    enabled: !!boardId && enabled,
  });
}

export function useRestoreCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cardId: string) => {
      const { data } = await api.patch(`/cards/${cardId}`, { archivedAt: null });
      return data.card;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: archivedKey(boardId) });
      qc.invalidateQueries({ queryKey: boardListsKey(boardId) });
    },
  });
}

export function useDeleteCardPermanent(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cardId: string) => {
      await api.delete(`/cards/${cardId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: archivedKey(boardId) });
      qc.invalidateQueries({ queryKey: boardListsKey(boardId) });
    },
  });
}

export function useRestoreList(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (listId: string) => {
      const { data } = await api.patch(`/boards/${boardId}/lists/${listId}`, {
        archivedAt: null,
      });
      return data.list;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: archivedKey(boardId) });
      qc.invalidateQueries({ queryKey: boardListsKey(boardId) });
    },
  });
}
