import { create } from 'zustand';

type UiState = {
  /** 모바일 전용 전체화면 등에서 활용 */
  isNavOpen: boolean;
  setNavOpen: (open: boolean) => void;
  toggleNav: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  isNavOpen: false,
  setNavOpen: (open) => set({ isNavOpen: open }),
  toggleNav: () => set((state) => ({ isNavOpen: !state.isNavOpen })),
}));
