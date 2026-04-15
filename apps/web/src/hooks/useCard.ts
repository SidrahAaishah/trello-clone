import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CardDetail,
  Comment,
  CreateChecklistInput,
  CreateChecklistItemInput,
  CreateCommentInput,
  Checklist,
  ChecklistItem,
  UpdateChecklistItemInput,
  UpdateCommentInput,
} from '@trello-clone/shared';
import { api } from '@/lib/api';
import { boardLabelsKey, boardListsKey } from './useBoard';

export const cardKey = (cardId: string) => ['card', cardId] as const;

export function useCardDetail(cardId: string | null) {
  return useQuery({
    queryKey: cardKey(cardId ?? ''),
    queryFn: async () => {
      const { data } = await api.get<{ card: CardDetail }>(`/cards/${cardId}`);
      return data.card;
    },
    enabled: !!cardId,
  });
}

export function useCardLabelToggle(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ labelId, add }: { labelId: string; add: boolean }) => {
      if (add) await api.post(`/cards/${cardId}/labels/${labelId}`);
      else await api.delete(`/cards/${cardId}/labels/${labelId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cardKey(cardId) });
      qc.invalidateQueries({ queryKey: boardListsKey(boardId) });
      qc.invalidateQueries({ queryKey: boardLabelsKey(boardId) });
    },
  });
}

export function useCardMemberToggle(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, add }: { userId: string; add: boolean }) => {
      if (add) await api.post(`/cards/${cardId}/members/${userId}`);
      else await api.delete(`/cards/${cardId}/members/${userId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cardKey(cardId) });
      qc.invalidateQueries({ queryKey: boardListsKey(boardId) });
    },
  });
}

export function useAddChecklist(cardId: string, boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateChecklistInput) => {
      const { data } = await api.post<{ checklist: Checklist }>(
        `/cards/${cardId}/checklists`,
        input,
      );
      return data.checklist;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cardKey(cardId) });
      qc.invalidateQueries({ queryKey: boardListsKey(boardId) });
    },
  });
}

export function useDeleteChecklist(cardId: string, boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (checklistId: string) => {
      await api.delete(`/checklists/${checklistId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cardKey(cardId) });
      qc.invalidateQueries({ queryKey: boardListsKey(boardId) });
    },
  });
}

export function useAddChecklistItem(
  cardId: string,
  checklistId: string,
  boardId: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateChecklistItemInput) => {
      const { data } = await api.post<{ item: ChecklistItem }>(
        `/checklists/${checklistId}/items`,
        input,
      );
      return data.item;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cardKey(cardId) });
      qc.invalidateQueries({ queryKey: boardListsKey(boardId) });
    },
  });
}

export function useUpdateChecklistItem(
  cardId: string,
  boardId: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemId,
      input,
    }: {
      itemId: string;
      input: UpdateChecklistItemInput;
    }) => {
      const { data } = await api.patch<{ item: ChecklistItem }>(
        `/checklist-items/${itemId}`,
        input,
      );
      return data.item;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cardKey(cardId) });
      qc.invalidateQueries({ queryKey: boardListsKey(boardId) });
    },
  });
}

export function useDeleteChecklistItem(cardId: string, boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`/checklist-items/${itemId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cardKey(cardId) });
      qc.invalidateQueries({ queryKey: boardListsKey(boardId) });
    },
  });
}

export function useAddComment(cardId: string, boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCommentInput) => {
      const { data } = await api.post<{ comment: Comment }>(
        `/cards/${cardId}/comments`,
        input,
      );
      return data.comment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cardKey(cardId) });
      qc.invalidateQueries({ queryKey: boardListsKey(boardId) });
    },
  });
}

export function useUpdateComment(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      commentId,
      input,
    }: {
      commentId: string;
      input: UpdateCommentInput;
    }) => {
      const { data } = await api.patch<{ comment: Comment }>(
        `/comments/${commentId}`,
        input,
      );
      return data.comment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cardKey(cardId) });
    },
  });
}

export function useDeleteComment(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/comments/${commentId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cardKey(cardId) });
    },
  });
}
