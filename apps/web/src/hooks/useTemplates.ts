import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Board,
  InstantiateTemplateInput,
  TemplateCategory,
  TemplateDetail,
  TemplateSummary,
} from '@trello-clone/shared';
import { api } from '@/lib/api';
import { boardsKey } from './useBoards';

export interface TemplatesFilters {
  category?: TemplateCategory;
  featured?: boolean;
}

export const templatesKey = (filters: TemplatesFilters = {}) =>
  ['templates', filters] as const;
export const templateDetailKey = (id: string) => ['template', id] as const;

/**
 * Gallery listing. The server already sorts most-popular/featured first; we
 * keep the filter object in the query key so switching categories produces
 * an instant re-render from the cache when revisited.
 */
export function useTemplates(filters: TemplatesFilters = {}) {
  return useQuery({
    queryKey: templatesKey(filters),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.category) params.category = filters.category;
      if (filters.featured !== undefined) params.featured = String(filters.featured);

      const { data } = await api.get<{ templates: TemplateSummary[] }>('/templates', {
        params,
      });
      return data.templates;
    },
  });
}

/**
 * Single-template detail (lists + cards + labels). Optional — used when we
 * want to show a richer preview inside the create dialog.
 */
export function useTemplate(id: string | null) {
  return useQuery({
    queryKey: templateDetailKey(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<{ template: TemplateDetail }>(
        `/templates/${id}`,
      );
      return data.template;
    },
  });
}

/**
 * Create a board from a template. On success the boards list is invalidated
 * so the side nav / home grid immediately reflect the new board, and the
 * mutation returns the fresh Board for the caller to navigate into.
 */
export function useInstantiateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      templateId,
      input,
    }: {
      templateId: string;
      input: InstantiateTemplateInput;
    }) => {
      const { data } = await api.post<{ board: Board }>(
        `/templates/${templateId}/instantiate`,
        input,
      );
      return data.board;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardsKey });
      qc.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}
