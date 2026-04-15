import { useQuery } from '@tanstack/react-query';
import type { CardSearchHit, DueFilter } from '@trello-clone/shared';
import { api } from '@/lib/api';

export interface SearchParams {
  q?: string;
  boardId?: string;
  labelIds?: string[];
  memberIds?: string[];
  due?: DueFilter;
  limit?: number;
  enabled?: boolean;
}

export function useSearch({
  q,
  boardId,
  labelIds,
  memberIds,
  due,
  limit = 30,
  enabled = true,
}: SearchParams) {
  return useQuery({
    queryKey: ['search', { q, boardId, labelIds, memberIds, due, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (boardId) params.set('boardId', boardId);
      if (due) params.set('due', due);
      if (limit) params.set('limit', String(limit));
      labelIds?.forEach((id) => params.append('labelId', id));
      memberIds?.forEach((id) => params.append('memberId', id));
      const { data } = await api.get<{ cards: CardSearchHit[] }>(
        `/search?${params.toString()}`,
      );
      return data.cards;
    },
    enabled: enabled && (!!q || !!boardId || !!due || !!labelIds?.length || !!memberIds?.length),
  });
}
