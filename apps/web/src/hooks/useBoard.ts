import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Board,
  CardSummary,
  CreateCardInput,
  CreateListInput,
  Label,
  List,
  Member,
  MoveCardInput,
  UpdateCardInput,
  UpdateListInput,
} from '@trello-clone/shared';
import { api } from '@/lib/api';

type ListWithCards = List & { cards: CardSummary[] };

export const boardKey = (boardId: string) => ['board', boardId] as const;
export const boardListsKey = (boardId: string) => ['board', boardId, 'lists'] as const;
export const boardLabelsKey = (boardId: string) => ['board', boardId, 'labels'] as const;
export const boardActivitiesKey = (boardId: string) => ['board', boardId, 'activities'] as const;

export function useBoard(boardId: string) {
  return useQuery({
    queryKey: boardKey(boardId),
    queryFn: async () => {
      const { data } = await api.get<{
        board: Board;
        lists: List[];
        members: Member[];
      }>(`/boards/${boardId}`);
      return data;
    },
    enabled: !!boardId,
  });
}

export function useBoardLists(boardId: string) {
  return useQuery({
    queryKey: boardListsKey(boardId),
    queryFn: async () => {
      const { data } = await api.get<{ lists: ListWithCards[] }>(
        `/boards/${boardId}/lists`,
      );
      return data.lists;
    },
    enabled: !!boardId,
  });
}

export function useBoardLabels(boardId: string) {
  return useQuery({
    queryKey: boardLabelsKey(boardId),
    queryFn: async () => {
      const { data } = await api.get<{ labels: Label[] }>(
        `/boards/${boardId}/labels`,
      );
      return data.labels;
    },
    enabled: !!boardId,
  });
}

export function useCreateList(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateListInput) => {
      const { data } = await api.post<{ list: List }>(
        `/boards/${boardId}/lists`,
        input,
      );
      return data.list;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardListsKey(boardId) });
    },
  });
}

export function useUpdateList(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listId,
      input,
    }: {
      listId: string;
      input: UpdateListInput;
    }) => {
      const { data } = await api.patch<{ list: List }>(
        `/boards/${boardId}/lists/${listId}`,
        input,
      );
      return data.list;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardListsKey(boardId) });
    },
  });
}

export function useReorderList(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ listId, position }: { listId: string; position: number }) => {
      const { data } = await api.patch<{ list: List }>(
        `/boards/${boardId}/lists/${listId}/position`,
        { position },
      );
      return data.list;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardListsKey(boardId) });
    },
  });
}

export function useCreateCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listId,
      input,
    }: {
      listId: string;
      input: CreateCardInput;
    }) => {
      const { data } = await api.post<{ card: CardSummary }>(
        `/lists/${listId}/cards`,
        input,
      );
      return data.card;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardListsKey(boardId) });
    },
  });
}

export function useMoveCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, input }: { cardId: string; input: MoveCardInput }) => {
      const { data } = await api.patch<{ card: CardSummary }>(
        `/cards/${cardId}/move`,
        input,
      );
      return data.card;
    },
    onMutate: async ({ cardId, input }) => {
      await qc.cancelQueries({ queryKey: boardListsKey(boardId) });
      const prev = qc.getQueryData<ListWithCards[]>(boardListsKey(boardId));
      if (!prev) return { prev };

      const updated = prev.map((l) => ({ ...l, cards: [...l.cards] }));
      let moving: CardSummary | undefined;
      for (const l of updated) {
        const idx = l.cards.findIndex((c) => c.id === cardId);
        if (idx >= 0) {
          moving = l.cards.splice(idx, 1)[0];
          break;
        }
      }
      if (!moving) return { prev };
      moving = { ...moving, listId: input.listId, position: input.position };
      const target = updated.find((l) => l.id === input.listId);
      if (target) {
        target.cards.push(moving);
        target.cards.sort((a, b) => a.position - b.position);
      }
      qc.setQueryData(boardListsKey(boardId), updated);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(boardListsKey(boardId), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: boardListsKey(boardId) });
      qc.invalidateQueries({ queryKey: boardActivitiesKey(boardId) });
    },
  });
}

export function useUpdateCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cardId,
      input,
    }: {
      cardId: string;
      input: UpdateCardInput;
    }) => {
      const { data } = await api.patch(`/cards/${cardId}`, input);
      return data.card;
    },
    onSuccess: (_card, { cardId }) => {
      qc.invalidateQueries({ queryKey: boardListsKey(boardId) });
      qc.invalidateQueries({ queryKey: ['card', cardId] });
    },
  });
}

export function useDeleteCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cardId: string) => {
      await api.delete(`/cards/${cardId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardListsKey(boardId) });
    },
  });
}
