import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Board,
  CreateBoardInput,
  UpdateBoardInput,
} from '@trello-clone/shared';
import { api } from '@/lib/api';

export const boardsKey = ['boards'] as const;

export function useBoards() {
  return useQuery({
    queryKey: boardsKey,
    queryFn: async () => {
      const { data } = await api.get<{ boards: Board[] }>('/boards');
      return data.boards;
    },
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBoardInput) => {
      const { data } = await api.post<{ board: Board }>('/boards', input);
      return data.board;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardsKey });
    },
  });
}

export function useUpdateBoard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateBoardInput) => {
      const { data } = await api.patch<{ board: Board }>(`/boards/${boardId}`, input);
      return data.board;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardsKey });
      qc.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}

export function useDeleteBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (boardId: string) => {
      await api.delete(`/boards/${boardId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardsKey });
    },
  });
}
