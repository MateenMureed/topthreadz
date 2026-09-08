import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  theme: ThemeMode;
  mounted: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  mounted: false,
  setTheme: (theme: ThemeMode) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
      try {
        localStorage.setItem('topthreadz_theme', theme);
      } catch {}
    }
    set({ theme });
  },
  toggleTheme: () => {
    const current = get().theme;
    const nextTheme: ThemeMode = current === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },
  initTheme: () => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const isDark = root.classList.contains('dark');
      set({ theme: isDark ? 'dark' : 'light', mounted: true });
    }
  },
}));
