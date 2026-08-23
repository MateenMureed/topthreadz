import { create } from 'zustand';

type AuthView = 'login' | 'signup';

interface AuthModalState {
  isOpen: boolean;
  view: AuthView;
  redirectTo?: string;
  openModal: (view?: AuthView, redirectTo?: string) => void;
  closeModal: () => void;
  switchView: (view: AuthView) => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  view: 'login',
  redirectTo: undefined,
  openModal: (view = 'login', redirectTo) => set({ isOpen: true, view, redirectTo }),
  closeModal: () => set({ isOpen: false }),
  switchView: (view) => set({ view }),
}));
