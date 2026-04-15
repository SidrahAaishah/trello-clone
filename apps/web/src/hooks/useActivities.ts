import { useQuery } from '@tanstack/react-query';
import type { Activity } from '@trello-clone/shared';
import { api } from '@/lib/api';
import { boardActivitiesKey } from './useBoard';

export function useActivities(boardId: string, limit = 50) {
  return useQuery({
    queryKey: [...boardActivitiesKey(boardId), limit],
    queryFn: async () => {
      const { data } = await api.get<{ activities: Activity[] }>(
        `/boards/${boardId}/activities?limit=${limit}`,
      );
      return data.activities;
    },
    enabled: !!boardId,
  });
}
