import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateLabelInput, Label, UpdateLabelInput } from '@trello-clone/shared';
import { api } from '@/lib/api';
import { boardLabelsKey, boardListsKey } from './useBoard';

export function useCreateLabel(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLabelInput) => {
      const { data } = await api.post<{ label: Label }>(
        `/boards/${boardId}/labels`,
        input,
      );
      return data.label;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardLabelsKey(boardId) });
    },
  });
}

export function useUpdateLabel(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      labelId,
      input,
    }: {
      labelId: string;
      input: UpdateLabelInput;
    }) => {
      const { data } = await api.patch<{ label: Label }>(
        `/boards/${boardId}/labels/${labelId}`,
        input,
      );
      return data.label;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardLabelsKey(boardId) });
      qc.invalidateQueries({ queryKey: boardListsKey(boardId) });
    },
  });
}

export function useDeleteLabel(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (labelId: string) => {
      await api.delete(`/boards/${boardId}/labels/${labelId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardLabelsKey(boardId) });
      qc.invalidateQueries({ queryKey: boardListsKey(boardId) });
    },
  });
}
