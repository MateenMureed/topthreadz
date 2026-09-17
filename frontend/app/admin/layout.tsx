'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import './admin.css';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { useHydration } from '@/hooks/useHydration';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import ThemeToggle from '@/components/ThemeToggle';
import { AdminSidebar } from './components/AdminSidebar';
import {
  FiSettings,
  FiDownload,
  FiMenu,
  FiExternalLink,
  FiShoppingBag,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

/**
 * AdminLayout — the shared admin shell.
 * Contains ONLY layout-level concerns: auth guard, header, sidebar,
 * mobile drawer, inactivity timeout, and the page outlet (children).
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydration();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  // ── AUTH GUARD ──
  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace('/admin-login');
    }
  }, [hydrated, isAuthenticated, router]);

  // ── AUTO LOGOUT (60 min inactivity) ──
  const lastActivityRef = useRef<number>(Date.now());
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach((event) => window.addEventListener(event, resetActivity, { passive: true }));
    const interval = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current > 60 * 60 * 1000) {
        logout();
        window.location.href = '/admin-login';
      }
    }, 60 * 1000);
    return () => {
      events.forEach((event) => window.removeEventListener(event, resetActivity));
      window.clearInterval(interval);
    };
  }, [logout, resetActivity]);

  const handleLogout = useCallback(() => {
    logout();
    router.replace('/admin-login');
  }, [logout, router]);

  // ── LIVE BADGE COUNTS (sidebar pending orders + low stock) ──
  const { data: dash } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get('/admin/dashboard').then((r) => r.data),
    enabled: hydrated && isAuthenticated,
    refetchInterval: 60_000,
  });
  const pendingOrdersCount = dash?.data?.pendingOrders || 0;
  const lowStockCount = dash?.data?.lowStockProducts?.length || 0;

  // ── PAGE TITLE (derived from route) ──
  const pageTitle =
    pathname === '/admin' || pathname === '/admin/dashboard'
      ? 'Executive Overview'
      : pathname === '/admin/products/new'
        ? 'Add New Product'
        : pathname?.startsWith('/admin/products')
          ? 'Catalog & Inventory'
          : pathname?.startsWith('/admin/orders')
            ? 'Orders & Fulfillment'
            : pathname?.startsWith('/admin/customers')
              ? 'Customer Profiles'
              : pathname?.startsWith('/admin/payments')
                ? 'Payment Verifications'
                : pathname?.startsWith('/admin/settings')
                  ? 'Store & System Settings'
                  : pathname?.startsWith('/admin/homepage')
                    ? 'Homepage Editor'
                    : 'Admin';

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0D1015] flex items-center justify-center">
        <div className="w-full max-w-md p-8 text-center">
          <div className="h-12 w-12 rounded-full border-[3px] border-black/10 dark:border-white/10 border-t-[#1A73E8] animate-spin mx-auto" />
          <p className="mt-4 text-sm font-semibold text-black/60 dark:text-white/60">Verifying admin session…</p>
        </div>
      </div>
    );
  }

  return (
    <div data-admin-root="true" className="min-h-screen bg-[#F5F5F7] dark:bg-[#0D1015] text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors duration-200">
      {/* ── TOP APPLE TRANSLUCENT HEADER BAR ── */}
      <header className="sticky top-0 z-40 apple-glass px-4 py-3 sm:px-6 transition-all duration-200">
        <div className="mx-auto max-w-[1440px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile hamburger — opens the shared sidebar drawer */}
            <button
              onClick={() => setSidebarMobileOpen(true)}
              className="lg:hidden apple-btn-secondary !h-9 !w-9 !px-0 shrink-0"
              aria-label="Open navigation"
            >
              <FiMenu className="w-4 h-4 mx-auto" />
            </button>
            <Link href="/" className="flex items-center gap-2.5 group min-w-0">
              <span className="font-display font-black text-base sm:text-lg tracking-tight text-[#0F172A] dark:text-white truncate">
                TOP THREADZ
              </span>
              <span className="shrink-0 rounded-full bg-black/90 dark:bg-white text-white dark:text-black text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-widest shadow-xs">
                Admin
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Go to Store Button */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="apple-btn-secondary !h-9 !px-3 !text-xs font-semibold inline-flex items-center gap-1.5 !bg-black/[0.04] dark:!bg-white/[0.08] hover:!bg-black/[0.08] dark:hover:!bg-white/[0.14] !text-[#0F172A] dark:!text-white transition-all active:scale-95"
              title="Open storefront in a new tab"
            >
              <FiShoppingBag className="w-3.5 h-3.5 text-[#1A73E8] dark:text-[#90CDF4]" />
              <span className="hidden xs:inline sm:inline">Go to Store</span>
              <FiExternalLink className="w-3 h-3 opacity-60" />
            </Link>

            <span className="hidden md:block text-xs font-semibold text-black/60 dark:text-white/60">
              {(user as any)?.name || 'Admin'} ({(user as any)?.role || 'ADMIN'})
            </span>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="apple-btn-secondary !h-9 !px-3 !text-xs font-semibold hover:!text-red-600"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Page title bar */}
        <div className="mx-auto max-w-[1440px] mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white mt-0.5">
            {pageTitle}
          </h1>
          <div className="flex items-center gap-2">
            <button
              className="apple-btn-secondary !h-9 !text-xs"
              onClick={() => {
                api
                  .get('/admin/dashboard')
                  .then(() => toast('Data refreshed'))
                  .catch(() => toast('Could not refresh data'));
              }}
              title="Refresh data"
            >
              <FiDownload className="w-3.5 h-3.5" /> Refresh
            </button>
            <Link
              href="/admin/settings"
              className={`apple-btn-secondary !h-9 !text-xs ${pathname?.startsWith('/admin/settings') ? '!bg-black !text-white dark:!bg-white dark:!text-black' : ''}`}
            >
              <FiSettings className="w-3.5 h-3.5" /> Settings
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-3 py-5 sm:px-5 lg:grid-cols-[260px_1fr]">
        {/* ── SHARED SIDEBAR — desktop sticky + mobile drawer ── */}
        <AdminSidebar
          pendingOrdersCount={pendingOrdersCount}
          lowStockCount={lowStockCount}
          onLogout={handleLogout}
          mobileOpen={sidebarMobileOpen}
          onMobileClose={() => setSidebarMobileOpen(false)}
        />

        {/* ── PAGE CONTENT OUTLET ── */}
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
