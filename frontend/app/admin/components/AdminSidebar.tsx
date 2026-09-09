'use client';

import React, { useState } from 'react';
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
  FiCheckCircle,
} from 'react-icons/fi';
import { AdminTab, SettingsSection } from './types';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  activeSettingsSection: SettingsSection;
  setActiveSettingsSection: (section: SettingsSection) => void;
  onOpenProductCreate: () => void;
  onViewProducts?: () => void;
  productViewMode?: 'list' | 'create';
  onSelectOrdersView: (view: 'all' | 'pending') => void;
  pendingOrdersCount?: number;
  lowStockCount?: number;
  onLogout: () => void;
}

export function AdminSidebar({
  activeTab,
  setActiveTab,
  activeSettingsSection,
  setActiveSettingsSection,
  onOpenProductCreate,
  onViewProducts,
  productViewMode = 'list',
  onSelectOrdersView,
  pendingOrdersCount = 0,
  lowStockCount = 0,
  onLogout,
}: AdminSidebarProps) {
  // Accordion dropdown states
  const [productsOpen, setProductsOpen] = useState(true);
  const [ordersOpen, setOrdersOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(activeTab === 'settings');

  const handleProductsViewAll = () => {
    setActiveTab('products');
    onViewProducts?.();
  };

  const handleProductCreate = () => {
    setActiveTab('products');
    onOpenProductCreate();
  };

  const handleOrdersAll = () => {
    setActiveTab('orders');
    onSelectOrdersView('all');
  };

  const handleOrdersPending = () => {
    setActiveTab('orders');
    onSelectOrdersView('pending');
  };

  const handleSettingsSelect = (section: SettingsSection) => {
    setActiveTab('settings');
    setActiveSettingsSection(section);
  };

  return (
    <aside className="hidden h-fit rounded-2xl apple-card bg-white dark:bg-[#16191F] border border-black/[0.06] dark:border-white/[0.08] p-3 shadow-xs lg:sticky lg:top-20 lg:block text-[#1F2937] dark:text-[#F3F4F6]">
      {/* Brand Header */}
      <div className="px-3 py-2.5 mb-2 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Navigation</p>
          <p className="text-sm font-bold tracking-tight text-[#111827] dark:text-white">Workspace Console</p>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
      </div>

      <nav className="space-y-4">
        {/* ==================== 1. TOP ESSENTIALS ==================== */}
        <div className="space-y-1">
          {/* Overview / Home */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-all active:scale-[0.98] ${
              activeTab === 'dashboard'
                ? 'bg-[#E8F0FE] text-[#1A73E8] font-semibold dark:bg-[#1A365D] dark:text-[#90CDF4]'
                : 'text-black/75 dark:text-white/75 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
            }`}
          >
            <FiHome className="w-4 h-4 shrink-0" />
            <span>Overview</span>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-black/[0.06] dark:border-white/[0.08]" />

        {/* ==================== 2. PRODUCTS DROPDOWN ==================== */}
        <div className="space-y-1">
          <button
            onClick={() => setProductsOpen((prev) => !prev)}
            className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-black/45 dark:text-white/45 hover:text-black dark:hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <FiPackage className="w-3.5 h-3.5" />
              <span>Catalog</span>
            </span>
            {productsOpen ? <FiChevronUp className="w-3.5 h-3.5" /> : <FiChevronDown className="w-3.5 h-3.5" />}
          </button>

          {productsOpen && (
            <div className="space-y-0.5 pl-1.5">
              {/* View Products */}
              <button
                onClick={handleProductsViewAll}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-all active:scale-[0.98] ${
                  activeTab === 'products' && productViewMode !== 'create'
                    ? 'bg-[#E8F0FE] text-[#1A73E8] font-semibold dark:bg-[#1A365D] dark:text-[#90CDF4]'
                    : 'text-black/75 dark:text-white/75 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FiPackage className="w-3.5 h-3.5 opacity-70" />
                  <span>View Products</span>
                </div>
                {lowStockCount > 0 && (
                  <span className="text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full">
                    {lowStockCount}
                  </span>
                )}
              </button>

              {/* Add Product */}
              <button
                onClick={handleProductCreate}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-all active:scale-[0.98] ${
                  activeTab === 'products' && productViewMode === 'create'
                    ? 'bg-[#E8F0FE] text-[#1A73E8] font-semibold dark:bg-[#1A365D] dark:text-[#90CDF4]'
                    : 'text-black/75 dark:text-white/75 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <FiPlus className={`w-3.5 h-3.5 ${activeTab === 'products' && productViewMode === 'create' ? 'text-[#1A73E8] dark:text-[#90CDF4]' : 'text-blue-600 dark:text-blue-400'}`} />
                <span className={activeTab === 'products' && productViewMode === 'create' ? 'font-semibold text-[#1A73E8] dark:text-[#90CDF4]' : 'font-semibold text-blue-600 dark:text-blue-400'}>Add New Product</span>
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-black/[0.06] dark:border-white/[0.08]" />

        {/* ==================== 3. ORDERS DROPDOWN ==================== */}
        <div className="space-y-1">
          <button
            onClick={() => setOrdersOpen((prev) => !prev)}
            className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-black/45 dark:text-white/45 hover:text-black dark:hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <FiShoppingCart className="w-3.5 h-3.5" />
              <span>Fulfillment</span>
            </span>
            {ordersOpen ? <FiChevronUp className="w-3.5 h-3.5" /> : <FiChevronDown className="w-3.5 h-3.5" />}
          </button>

          {ordersOpen && (
            <div className="space-y-0.5 pl-1.5">
              {/* All Orders */}
              <button
                onClick={handleOrdersAll}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-all active:scale-[0.98] ${
                  activeTab === 'orders'
                    ? 'bg-[#E8F0FE] text-[#1A73E8] font-semibold dark:bg-[#1A365D] dark:text-[#90CDF4]'
                    : 'text-black/75 dark:text-white/75 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                }`}
              >
                <FiShoppingCart className="w-3.5 h-3.5 opacity-70" />
                <span>All Orders</span>
              </button>

              {/* Pending Orders */}
              <button
                onClick={handleOrdersPending}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] font-medium text-black/75 dark:text-white/75 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-2.5">
                  <FiClock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pending Orders</span>
                </div>
                {pendingOrdersCount > 0 && (
                  <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                    {pendingOrdersCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-black/[0.06] dark:border-white/[0.08]" />

        {/* ==================== 4. CUSTOMERS & PAYMENTS ==================== */}
        <div className="space-y-1">
          <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-black/45 dark:text-white/45">
            Operations
          </p>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-all active:scale-[0.98] ${
              activeTab === 'users'
                ? 'bg-[#E8F0FE] text-[#1A73E8] font-semibold dark:bg-[#1A365D] dark:text-[#90CDF4]'
                : 'text-black/75 dark:text-white/75 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
            }`}
          >
            <FiUsers className="w-4 h-4 shrink-0" />
            <span>Customers</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-all active:scale-[0.98] ${
              activeTab === 'payments'
                ? 'bg-[#E8F0FE] text-[#1A73E8] font-semibold dark:bg-[#1A365D] dark:text-[#90CDF4]'
                : 'text-black/75 dark:text-white/75 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
            }`}
          >
            <FiCreditCard className="w-4 h-4 shrink-0" />
            <span>Payments</span>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-black/[0.06] dark:border-white/[0.08]" />

        {/* ==================== 5. SETTINGS DROPDOWN ==================== */}
        <div className="space-y-1">
          <button
            onClick={() => setSettingsOpen((prev) => !prev)}
            className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-black/45 dark:text-white/45 hover:text-black dark:hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <FiSettings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </span>
            {settingsOpen ? <FiChevronUp className="w-3.5 h-3.5" /> : <FiChevronDown className="w-3.5 h-3.5" />}
          </button>

          {settingsOpen && (
            <div className="space-y-0.5 pl-1.5">
              {[
                { id: 'store', label: 'Store Profile', icon: FiPhone },
                { id: 'shipping', label: 'Delivery & Fees', icon: FiTruck },
                { id: 'appearance', label: 'Homepage Layout', icon: FiLayers },
                { id: 'banner', label: 'Hero Banner', icon: FiEye },
                { id: 'branding', label: 'Logos & Brand', icon: FiStar },
                { id: 'categories', label: 'Categories', icon: FiPackage },
                { id: 'accounts', label: 'Admin Accounts', icon: FiShield },
                { id: 'policies', label: 'Legal Policies', icon: FiFileText },
              ].map((item) => {
                const isSelected = activeTab === 'settings' && activeSettingsSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSettingsSelect(item.id as SettingsSection)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-1.5 text-left text-[12.5px] font-medium transition-all active:scale-[0.98] ${
                      isSelected
                        ? 'bg-[#E8F0FE] text-[#1A73E8] font-semibold dark:bg-[#1A365D] dark:text-[#90CDF4]'
                        : 'text-black/70 dark:text-white/70 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                    }`}
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

      {/* Footer Sign Out */}
      <div className="mt-5 border-t border-black/[0.06] dark:border-white/[0.08] pt-3">
        <button
          onClick={onLogout}
          className="w-full flex h-[36px] items-center justify-center gap-2 rounded-xl text-black/60 dark:text-white/60 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all text-xs font-semibold active:scale-[0.98]"
        >
          <FiLogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
