'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { FiSun, FiMoon } from 'react-icons/fi';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme, initTheme, mounted } = useThemeStore();

  // On first client render: read the class applied by the anti-flash inline script
  // and sync the Zustand store state with it.
  useEffect(() => {
    initTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) {
    // Static placeholder — same size, invisible — avoids layout shift
    return (
      <span
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-surface-300 flex items-center justify-center opacity-0 pointer-events-none ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      className={`
        w-9 h-9 sm:w-10 sm:h-10 rounded-full
        border border-surface-300 dark:border-[#2D3340]
        text-surface-700 dark:text-[#94A3B8]
        hover:bg-surface-100 dark:hover:bg-[#1E2228]
        transition-all duration-200
        flex items-center justify-center
        ${className}
      `}
    >
      {theme === 'dark' ? (
        <FiSun className="w-4 h-4" />
      ) : (
        <FiMoon className="w-4 h-4" />
      )}
    </button>
  );
}
