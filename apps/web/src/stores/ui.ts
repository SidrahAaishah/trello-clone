import { create } from 'zustand';
import type { DueFilter } from '@trello-clone/shared';

interface UIState {
  openCardId: string | null;
  openCard: (id: string | null) => void;

  createBoardOpen: boolean;
  setCreateBoardOpen: (v: boolean) => void;

  archivedDrawerOpen: boolean;
  setArchivedDrawerOpen: (v: boolean) => void;

  mobileNavOpen: boolean;
  setMobileNavOpen: (v: boolean) => void;

  filter: {
    query: string;
    labelIds: string[];
    memberIds: string[];
    due: DueFilter | null;
  };
  setFilter: (patch: Partial<UIState['filter']>) => void;
  clearFilter: () => void;
}

export const useUI = create<UIState>((set) => ({
  openCardId: null,
  openCard: (id) => set({ openCardId: id }),

  createBoardOpen: false,
  setCreateBoardOpen: (v) => set({ createBoardOpen: v }),

  archivedDrawerOpen: false,
  setArchivedDrawerOpen: (v) => set({ archivedDrawerOpen: v }),

  mobileNavOpen: false,
  setMobileNavOpen: (v) => set({ mobileNavOpen: v }),

  filter: { query: '', labelIds: [], memberIds: [], due: null },
  setFilter: (patch) =>
    set((s) => ({ filter: { ...s.filter, ...patch } })),
  clearFilter: () =>
    set({ filter: { query: '', labelIds: [], memberIds: [], due: null } }),
}));
