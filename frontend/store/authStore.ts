import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user, token) => {
        localStorage.setItem('accessToken', token);
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, isAuthenticated: false });
      },
    }),
    { name: 'auth-storage', partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }) }
  )
);
