'use client';

/**
 * SettingsPage â€” /admin/settings (+ /admin/settings/[section])
 * Store & System settings: categories, branding/logos, admin accounts,
 * hero banner, homepage appearance, store contact & delivery fees, and
 * customer-care policies. Composes the dedicated manager components.
 * An optional `initialSection` (from the [section] route) scrolls the
 * page to the matching section.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import toast from 'react-hot-toast';
import CategoriesManager from '../components/CategoriesManager';
import LogoManager from '../components/LogoManager';
import AdminAccountsManager from '../components/AdminAccountsManager';
import type { SettingsSection } from '../components/types';

export default function SettingsPage({ initialSection }: { initialSection?: SettingsSection | null }) {
  const queryClient = useQueryClient();
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => api.get('/settings/store').then((res) => res.data?.data),
  });

  const [form, setForm] = useState({
    whatsappNumber: '',
    phoneNumber: '',
    email: '',
    operatingDays: '',
    address: '',
    standardDeliveryFee: '250',
    freeDeliveryThreshold: '10000',
    privacyPolicy: '',
    termsOfService: '',
    deliveryPolicy: '',
    exchangeReturnPolicy: '',
    homepageHeading: '',
    homepageSubheading: '',
    homepageGridCols: '4',
  });

  useEffect(() => {
    if (settingsData) {
      setForm({
        whatsappNumber: settingsData.whatsappNumber || '923009070520',
        phoneNumber: settingsData.phoneNumber || '+92 300 1234567',
        email: settingsData.email || 'support@topthreadz.pk',
        operatingDays: settingsData.operatingDays || 'Store: Mon – Fri: 9:00 AM – 12:00 Midnight | Online Shopping: 24/7',
        address: settingsData.address || 'topthreadz, R28V+R3W, Street 2, DHA Phase 5 Zamzama Commercial Area Defence V Karachi, 75600, Pakistan',
        standardDeliveryFee: String(settingsData.standardDeliveryFee ?? 250),
        freeDeliveryThreshold: String(settingsData.freeDeliveryThreshold ?? 10000),
        privacyPolicy: settingsData.privacyPolicy || '',
        termsOfService: settingsData.termsOfService || '',
        deliveryPolicy: settingsData.deliveryPolicy || '',
        exchangeReturnPolicy: settingsData.exchangeReturnPolicy || '',
        homepageHeading: settingsData.homepageHeading || 'Shop Our Collection',
        homepageSubheading: settingsData.homepageSubheading || 'PREMIUM WASH & WEAR • SHOP OUR COLLECTION',
        homepageGridCols: String(settingsData.homepageGridCols || 4),
      });
    }
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: (data: typeof form) => api.put('/settings/store', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-settings'] });
      toast.success('Store contact details and policies saved successfully!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save store settings.';
      if (err?.response?.status === 401) {
        toast.error('Session expired or unauthorized. Please log out and log back in to Admin.');
      } else {
        toast.error(msg);
      }
    },
  });

  // Deep-link support: /admin/settings/[section] scrolls to the section.
  useEffect(() => {
    if (!initialSection) return;
    const target = document.getElementById(initialSection);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [initialSection, isLoading]);

  if (isLoading) {
    return <div className="p-8 text-center text-surface-500">Loading store settings...</div>;
  }

  return (
    <div className="space-y-8">
      <div id="categories"><CategoriesManager /></div>
      {/* Store Branding â€” Logo */}
      <div id="branding"><LogoManager /></div>
      {/* Admin Accounts */}
      <div id="accounts"><AdminAccountsManager /></div>
      {/* Homepage Editor shortcut — hero banner & all section images live in /admin/homepage */}
      <div id="banner" className="rounded-2xl border border-surface-300 bg-white p-5 shadow-soft">
        <h2 className="text-xl font-bold text-surface-950 mb-1">Homepage Editor</h2>
        <p className="text-xs text-surface-500 mb-4">
          Hero banner, category cards, collection banners &amp; showcase cards — images, text and links are all managed in the dedicated Homepage editor.
        </p>
        <Link href="/admin/homepage" className="admin-btn-primary inline-flex items-center gap-2">
          Open Homepage Editor
        </Link>
      </div>

      {/* Homepage Appearance */}
      <div id="appearance" className="rounded-2xl border border-surface-300 bg-white p-5 shadow-soft">
        <h2 className="text-xl font-bold text-surface-950 mb-1">Homepage Appearance</h2>
        <p className="text-xs text-surface-500 mb-5">
          Customize the heading, subtitle, and product grid layout shown on the homepage.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-1.5">
              Section Heading
            </label>
            <input
              type="text"
              value={form.homepageHeading}
              onChange={(e) => setForm({ ...form, homepageHeading: e.target.value })}
              placeholder="e.g. Shop Our Collection, Azaadi Sale, Summer Deals"
              className="w-full rounded-xl border border-surface-300 px-3.5 py-2.5 text-sm font-medium focus:border-black outline-none"
            />
            <p className="text-[11px] text-surface-400 mt-1">Main heading displayed above the product grid on the homepage.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-1.5">
              Section Subtitle
            </label>
            <input
              type="text"
              value={form.homepageSubheading}
              onChange={(e) => setForm({ ...form, homepageSubheading: e.target.value })}
              placeholder="e.g. PREMIUM WASH & WEAR • SHOP OUR COLLECTION"
              className="w-full rounded-xl border border-surface-300 px-3.5 py-2.5 text-sm font-medium focus:border-black outline-none"
            />
            <p className="text-[11px] text-surface-400 mt-1">Small-caps subtitle line shown above the heading.</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-2">
              Product Grid Columns (Desktop)
            </label>
            <div className="inline-flex items-center gap-2 rounded-full border border-surface-300 bg-surface-50 p-1">
              {(['2', '3', '4'] as const).map((cols) => (
                <button
                  key={cols}
                  type="button"
                  onClick={() => setForm({ ...form, homepageGridCols: cols })}
                  className={`h-9 w-14 rounded-full text-sm font-bold transition-all ${form.homepageGridCols === cols
                      ? 'bg-surface-950 text-white shadow-md'
                      : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                    }`}
                >
                  {cols}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-surface-400 mt-1.5">Number of product columns on the homepage grid (desktop). Mobile always uses 2 columns.</p>
          </div>
        </div>
      </div>

      {/* Store Contact & Policy Settings */}
      <div id="store" className="rounded-2xl border border-surface-300 bg-white p-5 shadow-soft">
        <h2 className="text-xl font-bold text-surface-950 mb-1">Store Contact Information &amp; Policies</h2>
        <p className="text-xs text-surface-500 mb-6">
          These details are included in the website Footer, floating WhatsApp chat button, and customer policy pages.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(form);
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-1.5">
                WhatsApp Number
              </label>
              <input
                type="text"
                value={form.whatsappNumber}
                onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                placeholder="e.g. 923009070520"
                className="w-full rounded-xl border border-surface-300 px-3.5 py-2.5 text-sm font-medium focus:border-black outline-none"
              />
              <p className="text-[11px] text-surface-400 mt-1">Used for floating WhatsApp button and Need Help footer column.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                placeholder="e.g. +92 300 1234567"
                className="w-full rounded-xl border border-surface-300 px-3.5 py-2.5 text-sm font-medium focus:border-black outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-1.5">
                Support Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. support@topthreadz.pk"
                className="w-full rounded-xl border border-surface-300 px-3.5 py-2.5 text-sm font-medium focus:border-black outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-1.5">
                Operating Days &amp; Hours
              </label>
              <input
                type="text"
                value={form.operatingDays}
                onChange={(e) => setForm({ ...form, operatingDays: e.target.value })}
                placeholder="e.g. Mon – Fri: 9:00 AM – 12:00 Midnight | Online: 24/7"
                className="w-full rounded-xl border border-surface-300 px-3.5 py-2.5 text-sm font-medium focus:border-black outline-none"
              />
            </div>

            <div id="shipping">
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-1.5">
                Standard Delivery Fee (PKR)
              </label>
              <input
                type="number"
                min="0"
                value={form.standardDeliveryFee}
                onChange={(e) => setForm({ ...form, standardDeliveryFee: e.target.value })}
                placeholder="e.g. 250"
                className="w-full rounded-xl border border-surface-300 px-3.5 py-2.5 text-sm font-medium focus:border-black outline-none"
              />
              <p className="text-[11px] text-surface-400 mt-1">Standard shipping charge applied when cart total is below 10k.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-1.5">
                Free Delivery Threshold (PKR)
              </label>
              <input
                type="number"
                min="0"
                value={form.freeDeliveryThreshold}
                onChange={(e) => setForm({ ...form, freeDeliveryThreshold: e.target.value })}
                placeholder="e.g. 10000"
                className="w-full rounded-xl border border-surface-300 px-3.5 py-2.5 text-sm font-medium focus:border-black outline-none"
              />
              <p className="text-[11px] text-surface-400 mt-1">Orders at or above this amount automatically receive FREE delivery (Default: 10,000 PKR).</p>
            </div>




            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-1.5">
                Primary Store &amp; Outlet Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="topthreadz, R28V+R3W, Street 2, DHA Phase 5 Zamzama Commercial Area Defence V Karachi, 75600, Pakistan"
                className="w-full rounded-xl border border-surface-300 px-3.5 py-2.5 text-sm font-medium focus:border-black outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-surface-200">
            <div id="policies">
              <h3 className="text-lg font-bold text-surface-950 mb-1">Customer Care Policies</h3>
              <p className="text-xs text-surface-500 mb-4">
                Enter custom policy text overrides or leave blank to use standard default guidelines.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-1">
                  Privacy Policy Content
                </label>
                <textarea
                  rows={3}
                  value={form.privacyPolicy}
                  onChange={(e) => setForm({ ...form, privacyPolicy: e.target.value })}
                  placeholder="Custom privacy policy text..."
                  className="w-full rounded-xl border border-surface-300 p-3 text-sm focus:border-black outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-1">
                  Terms of Service Content
                </label>
                <textarea
                  rows={3}
                  value={form.termsOfService}
                  onChange={(e) => setForm({ ...form, termsOfService: e.target.value })}
                  placeholder="Custom terms of service text..."
                  className="w-full rounded-xl border border-surface-300 p-3 text-sm focus:border-black outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-1">
                  Delivery Policy Content
                </label>
                <textarea
                  rows={3}
                  value={form.deliveryPolicy}
                  onChange={(e) => setForm({ ...form, deliveryPolicy: e.target.value })}
                  placeholder="Custom delivery policy text..."
                  className="w-full rounded-xl border border-surface-300 p-3 text-sm focus:border-black outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-1">
                  Exchange &amp; Return Policy Content
                </label>
                <textarea
                  rows={3}
                  value={form.exchangeReturnPolicy}
                  onChange={(e) => setForm({ ...form, exchangeReturnPolicy: e.target.value })}
                  placeholder="Custom exchange and return policy text..."
                  className="w-full rounded-xl border border-surface-300 p-3 text-sm focus:border-black outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="btn-primary !px-6 !py-3 text-sm font-bold uppercase tracking-wider"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
