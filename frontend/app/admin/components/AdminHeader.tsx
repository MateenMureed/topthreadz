'use client';

import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { FiEye, FiExternalLink, FiLogOut } from 'react-icons/fi';

interface AdminHeaderProps {
  user: any;
  onLogout: () => void;
}

export function AdminHeader({ user, onLogout }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 apple-glass px-4 py-3 sm:px-6 transition-all duration-200">
      <div className="mx-auto max-w-[1440px] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 group min-w-0">
            <span className="font-display font-black text-base sm:text-lg tracking-tight text-[#0F172A] dark:text-white truncate">
              TOP THREADZ
            </span>
            <span className="shrink-0 rounded-full bg-black/90 dark:bg-white text-white dark:text-black text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-widest shadow-xs">
              Admin
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle className="!w-9 !h-9 !rounded-xl" />

          <Link
            href="/"
            target="_blank"
            className="apple-btn-secondary !h-9 !px-3 sm:!px-4 !text-xs"
            aria-label="View storefront"
          >
            <FiEye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View Storefront</span>
            <FiExternalLink className="w-3 h-3 opacity-60 hidden sm:inline" />
          </Link>

          <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-black/10 dark:border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0F172A] to-[#334155] dark:from-[#3B82F6] dark:to-[#60A5FA] text-white flex items-center justify-center text-xs font-bold shadow-xs">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-[#1D1D1F] dark:text-white leading-tight">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[10.5px] text-black/50 dark:text-white/50 font-medium">
                {user?.email || 'admin@topthreadz.pk'}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="apple-btn-secondary !h-9 !px-3 sm:!px-4 !text-xs !text-red-600 dark:!text-red-400 hover:!bg-red-50 dark:hover:!bg-red-950/40"
            title="Sign out of Admin"
            aria-label="Logout"
          >
            <FiLogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
