'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();

    // Re-verify after a brief tick in case hydration briefly touched html classes
    const timer = setTimeout(() => {
      initTheme();
    }, 50);

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'topthreadz_theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
        initTheme();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', onStorage);
    };
  }, [initTheme]);

  return <>{children}</>;
}
