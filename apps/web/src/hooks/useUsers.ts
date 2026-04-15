import { useQuery } from '@tanstack/react-query';
import type { Member } from '@trello-clone/shared';
import { api } from '@/lib/api';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get<{ users: Member[] }>('/users');
      return data.users;
    },
  });
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get<{ user: Member }>('/users/me');
      return data.user;
    },
  });
}
