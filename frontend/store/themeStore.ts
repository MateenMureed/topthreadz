import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  theme: ThemeMode;
  mounted: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

function applyThemeClass(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }
}

function persistTheme(theme: ThemeMode) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('topthreadz_theme', theme);
  } catch {}
  try {
    document.cookie = `topthreadz_theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}
}

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const fromStorage = localStorage.getItem('topthreadz_theme');
    if (fromStorage === 'dark' || fromStorage === 'light') {
      return fromStorage;
    }
  } catch {}

  try {
    const match = document.cookie.match(/(?:^|;\s*)topthreadz_theme=([^;]*)/);
    if (match && (match[1] === 'dark' || match[1] === 'light')) {
      return match[1] as ThemeMode;
    }
  } catch {}

  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {}

  return 'light';
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  mounted: false,
  setTheme: (theme: ThemeMode) => {
    applyThemeClass(theme);
    persistTheme(theme);
    set({ theme, mounted: true });
  },
  toggleTheme: () => {
    const current = get().theme;
    const nextTheme: ThemeMode = current === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },
  initTheme: () => {
    const activeTheme = getStoredTheme();
    applyThemeClass(activeTheme);
    set({ theme: activeTheme, mounted: true });
  },
}));
