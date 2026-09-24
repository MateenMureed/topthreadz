'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  FiHome,
  FiPackage,
  FiPlus,
  FiShoppingCart,
  FiClock,
  FiUsers,
  FiCreditCard,
  FiSettings,
  FiPhone,
  FiTruck,
  FiLayers,
  FiEye,
  FiStar,
  FiShield,
  FiFileText,
  FiChevronDown,
  FiChevronUp,
  FiLogOut,
  FiX,
  FiShoppingBag,
  FiExternalLink,
  FiShare2,
} from 'react-icons/fi';
import { SettingsSection } from './types';

interface AdminSidebarProps {
  pendingOrdersCount?: number;
  lowStockCount?: number;
  onLogout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const navLinkBase =
  'flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-left text-[13px] font-medium transition-all active:scale-[0.98]';
const navLinkActive = 'bg-[#E8F0FE] text-[#1A73E8] font-semibold dark:bg-[#1A365D] dark:text-[#90CDF4]';
const navLinkIdle = 'text-black/75 dark:text-white/75 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]';

const groupHeaderBase =
  'flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-black/45 dark:text-white/45 hover:text-black hover:bg-black/[0.04] dark:hover:bg-white/[0.06] dark:hover:text-white transition-colors';
const subLinkBase =
  'flex w-full items-center gap-2.5 rounded-xl px-3 py-1.5 text-left text-[12.5px] font-medium transition-all active:scale-[0.98]';
const subLinkActive = 'bg-[#E8F0FE] text-[#1A73E8] font-semibold dark:bg-[#1A365D] dark:text-[#90CDF4]';
const subLinkIdle = 'text-black/70 dark:text-white/70 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]';

const settingsItems: { path: string; section: SettingsSection; label: string; icon: React.ElementType }[] = [
  { path: '/admin/settings/store', section: 'store', label: 'Store Profile', icon: FiPhone },
  { path: '/admin/settings/shipping', section: 'shipping', label: 'Delivery & Fees', icon: FiTruck },
  { path: '/admin/settings/appearance', section: 'appearance', label: 'Homepage Layout', icon: FiLayers },
  { path: '/admin/homepage', section: 'banner', label: 'Homepage Editor', icon: FiEye },
  { path: '/admin/settings/branding', section: 'branding', label: 'Logos & Brand', icon: FiStar },
  { path: '/admin/settings/categories', section: 'categories', label: 'Categories', icon: FiPackage },
  { path: '/admin/settings/accounts', section: 'accounts', label: 'Admin Accounts', icon: FiShield },
  { path: '/admin/settings/policies', section: 'policies', label: 'Legal Policies', icon: FiFileText },
];

function ChevronIcon({ open }: { open: boolean }) {
  return open ? <FiChevronUp className="w-3.5 h-3.5" /> : <FiChevronDown className="w-3.5 h-3.5" />;
}

function useActiveRoute() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isProductsRoute = pathname?.startsWith('/admin/products') ?? false;
  const isCreateRoute = pathname === '/admin/products/new';
  const isOrdersRoute = pathname?.startsWith('/admin/orders') ?? false;
  const isPendingView = isOrdersRoute && searchParams.get('view') === 'pending';
  const isSettingsRoute = pathname?.startsWith('/admin/settings') ?? false;
  const settingsSection = pathname?.startsWith('/admin/settings/') ? (pathname.split('/')[3] as SettingsSection) : null;
  const isHomepageRoute = pathname?.startsWith('/admin/homepage') ?? false;
  const isUsersRoute = pathname?.startsWith('/admin/customers') ?? false;
  const isPaymentsRoute = pathname?.startsWith('/admin/payments') ?? false;
  const isSocialRoute = pathname?.startsWith('/admin/social') ?? false;
  return {
    isProductsRoute,
    isCreateRoute,
    isOrdersRoute,
    isPendingView,
    isSettingsRoute,
    settingsSection,
    isHomepageRoute,
    isUsersRoute,
    isPaymentsRoute,
    isSocialRoute,
    pathname,
  };
}

export function AdminSidebar({
  pendingOrdersCount = 0,
  lowStockCount = 0,
  onLogout,
  mobileOpen = false,
  onMobileClose,
}: AdminSidebarProps) {
  const router = useRouter();
  const { isProductsRoute, isCreateRoute, isOrdersRoute, isPendingView, isSettingsRoute, settingsSection, isHomepageRoute, isUsersRoute, isPaymentsRoute, isSocialRoute } = useActiveRoute();

  // Accordion groups — collapsed until the user clicks them
  const [productsOpen, setProductsOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [operationsOpen, setOperationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Auto-open the group that owns the current route (never auto-close)
  useEffect(() => {
    if (isProductsRoute) setProductsOpen(true);
    if (isOrdersRoute) setOrdersOpen(true);
    if (isUsersRoute || isPaymentsRoute) setOperationsOpen(true);
    if (isSettingsRoute) setSettingsOpen(true);
  }, [isProductsRoute, isOrdersRoute, isUsersRoute, isPaymentsRoute, isSettingsRoute]);

  const go = (path: string) => {
    router.push(path);
    onMobileClose?.();
  };

  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div className="px-3 py-2.5 mb-1.5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Navigation</p>
          <p className="text-sm font-bold tracking-tight text-[#111827] dark:text-white">Workspace Console</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg text-black/50 dark:text-white/50 hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
            aria-label="Close navigation"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>

      <nav className="space-y-1.5">
        {/* ── TOP ESSENTIALS ── */}
        <div className="space-y-0.5">
          <button onClick={() => go('/admin')} className={`${navLinkBase} ${!isProductsRoute && !isOrdersRoute && !isSettingsRoute && !isHomepageRoute && !isUsersRoute && !isPaymentsRoute && !isSocialRoute ? navLinkActive : navLinkIdle}`}>
            <FiHome className="w-4 h-4 shrink-0" />
            <span>Overview</span>
          </button>
          <button onClick={() => go('/admin/homepage')} className={`${navLinkBase} ${isHomepageRoute ? navLinkActive : navLinkIdle}`}>
            <FiLayers className="w-4 h-4 shrink-0" />
            <span>Homepage</span>
          </button>
          {/* Social Publishing */}
          <button onClick={() => go('/admin/social')} className={`${navLinkBase} ${isSocialRoute ? navLinkActive : navLinkIdle}`}>
            <span className={`flex h-4 w-4 items-center justify-center shrink-0 rounded bg-gradient-to-br from-[#1877F2] to-[#E1306C] text-white ${isSocialRoute ? 'opacity-100' : 'opacity-70'}`}>
              <FiShare2 className="w-2.5 h-2.5" />
            </span>
            <span>Social Publishing</span>
          </button>
        </div>

        {/* ── CATALOG (accordion) ── */}
        <div>
          <button onClick={() => setProductsOpen((prev) => !prev)} className={groupHeaderBase}>
            <span className="flex items-center gap-2">
              <FiPackage className="w-3.5 h-3.5" />
              <span>Catalog</span>
            </span>
            <ChevronIcon open={productsOpen} />
          </button>
          {productsOpen && (
            <div className="space-y-0.5 mt-0.5">
              <button
                onClick={() => go('/admin/products')}
                className={`${subLinkBase} justify-between ${isProductsRoute && !isCreateRoute ? subLinkActive : subLinkIdle}`}
              >
                <span className="flex items-center gap-2.5">
                  <FiPackage className="w-3.5 h-3.5 opacity-70" />
                  <span>View Products</span>
                </span>
                {lowStockCount > 0 && (
                  <span className="text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full">
                    {lowStockCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => go('/admin/products/new')}
                className={`${subLinkBase} ${isCreateRoute ? subLinkActive : subLinkIdle}`}
              >
                <FiPlus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-blue-600 dark:text-blue-400">Add New Product</span>
              </button>
            </div>
          )}
        </div>

        {/* ── ORDERS (accordion) ── */}
        <div>
          <button onClick={() => setOrdersOpen((prev) => !prev)} className={groupHeaderBase}>
            <span className="flex items-center gap-2">
              <FiShoppingCart className="w-3.5 h-3.5" />
              <span>Orders</span>
            </span>
            <ChevronIcon open={ordersOpen} />
          </button>
          {ordersOpen && (
            <div className="space-y-0.5 mt-0.5">
              <button
                onClick={() => go('/admin/orders')}
                className={`${subLinkBase} ${isOrdersRoute && !isPendingView ? subLinkActive : subLinkIdle}`}
              >
                <FiShoppingCart className="w-3.5 h-3.5 opacity-70" />
                <span>All Orders</span>
              </button>
              <button
                onClick={() => go('/admin/orders?view=pending')}
                className={`${subLinkIdle} ${subLinkBase} justify-between`}
              >
                <span className="flex items-center gap-2.5">
                  <FiClock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pending Orders</span>
                </span>
                {pendingOrdersCount > 0 && (
                  <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                    {pendingOrdersCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── OPERATIONS (accordion) ── */}
        <div>
          <button onClick={() => setOperationsOpen((prev) => !prev)} className={groupHeaderBase}>
            <span className="flex items-center gap-2">
              <FiUsers className="w-3.5 h-3.5" />
              <span>Operations</span>
            </span>
            <ChevronIcon open={operationsOpen} />
          </button>
          {operationsOpen && (
            <div className="space-y-0.5 mt-0.5">
              <button onClick={() => go('/admin/customers')} className={`${subLinkBase} ${isUsersRoute ? subLinkActive : subLinkIdle}`}>
                <FiUsers className="w-3.5 h-3.5 opacity-70" />
                <span>Customers</span>
              </button>
              <button onClick={() => go('/admin/payments')} className={`${subLinkBase} ${isPaymentsRoute ? subLinkActive : subLinkIdle}`}>
                <FiCreditCard className="w-3.5 h-3.5 opacity-70" />
                <span>Payments</span>
              </button>
            </div>
          )}
        </div>

        {/* ── SETTINGS (accordion) ── */}
        <div>
          <button onClick={() => setSettingsOpen((prev) => !prev)} className={groupHeaderBase}>
            <span className="flex items-center gap-2">
              <FiSettings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </span>
            <ChevronIcon open={settingsOpen} />
          </button>
          {settingsOpen && (
            <div className="space-y-0.5 mt-0.5">
              {settingsItems.map((item) => {
                const isSelected = isSettingsRoute && settingsSection === item.section;
                return (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    className={`${subLinkBase} ${isSelected ? subLinkActive : subLinkIdle}`}
                  >
                    <item.icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#1A73E8] dark:text-[#90CDF4]' : 'opacity-60'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Footer Go to Store & Sign Out */}
      <div className="mt-3 border-t border-black/[0.06] dark:border-white/[0.08] pt-2.5 space-y-1">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex h-[34px] items-center justify-between px-3 rounded-xl text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all text-xs font-semibold active:scale-[0.98]"
        >
          <span className="flex items-center gap-2">
            <FiShoppingBag className="w-4 h-4 text-[#1A73E8] dark:text-[#90CDF4]" />
            <span>Go to Store</span>
          </span>
          <FiExternalLink className="w-3.5 h-3.5 opacity-50" />
        </a>
        <button
          onClick={() => { onLogout(); onMobileClose?.(); }}
          className="w-full flex h-[34px] items-center justify-center gap-2 rounded-xl text-black/60 dark:text-white/60 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all text-xs font-semibold active:scale-[0.98]"
        >
          <FiLogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      )}

      {/* Mobile slide-in drawer / Desktop sticky sidebar — same nav content */}
      <aside
        className={`fixed inset-y-0 left-0 z-[60] w-[270px] max-w-[85vw] overflow-y-auto apple-card bg-white dark:bg-[#16191F] border-r border-black/[0.06] dark:border-white/[0.08] p-3 shadow-lg transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto lg:w-auto lg:max-w-none lg:shadow-xs lg:border lg:border-black/[0.06] dark:lg:border-white/[0.08] lg:rounded-2xl lg:h-fit lg:sticky lg:top-20 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
