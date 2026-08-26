'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { useHydration } from '@/hooks/useHydration';
import api from '@/services/api';
import { productService } from '@/services/product.service';
import { FormattedProductDescription } from '@/app/products/[id]/page';
import {
  FiUsers,
  FiPackage,
  FiShoppingCart,
  FiDollarSign,
  FiClock,
  FiCheck,
  FiX,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiEye,
  FiUpload,
  FiSearch,
  FiTrendingUp,
  FiAlertTriangle,
  FiArrowUp,
  FiArrowDown,
  FiStar,
  FiInfo,
  FiBarChart2,
  FiSettings,
  FiTruck,
  FiTag,
  FiDownload,
  FiLogOut,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

function resolveImageUrl(url: string) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${BACKEND_BASE_URL}${url}`;
  return `${BACKEND_BASE_URL}/${url}`;
}

async function compressImageFile(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.82): Promise<File> {
  if (file.size < 350 * 1024) return file;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

function AdminImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveImageUrl(src);

  if (!resolved || failed) {
    return (
      <div className={`${className} flex items-center justify-center bg-surface-100 text-[10px] text-surface-400`}>
        No image
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}

interface ProductFormState {
  name: string;
  description: string;
  subcategory: string;
  brand: string;
  slug: string;
  price: string;
  sku: string;
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PREORDER';
  lowStockThreshold: string;
  discount: string;
  stock: string;
  sizesText: string;
  colorsText: string;
  tagsText: string;
  collection: string;
  careInstructions: string;
  featured: boolean;
  trending: boolean;
  productStatus: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
  images: string[];
}

const emptyProductForm: ProductFormState = {
  name: '',
  description: '',
  subcategory: 'Traditional',
  brand: '',
  slug: '',
  price: '',
  sku: '',
  stockStatus: 'IN_STOCK',
  lowStockThreshold: '5',
  discount: '0',
  stock: '0',
  sizesText: '',
  colorsText: '',
  tagsText: '',
  collection: '',
  careInstructions: '',
  featured: false,
  trending: false,
  productStatus: 'DRAFT',
  images: [],
};

const BRAND_OPTIONS = ['J.', 'Gul Ahmed', 'Alkaram Studio', 'Sapphire', 'Khaadi', 'Nishat Linen', 'Bonanza Satrangi', 'Sana Safinaz', 'Limelight', 'Ethnic'];

const COLOR_PRESET_OPTIONS = [
  'Black',
  'White',
  'Off White',
  'Navy Blue',
  'Royal Blue',
  'Sky Blue',
  'Grey',
  'Charcoal',
  'Brown',
  'Olive',
  'Beige',
  'Maroon',
  'Bottle Green',
  'Cream',
];

const FIXED_SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL', '4.5m', '7 meter'];

interface ImageMeta {
  url: string;
  publicId?: string;
  alt: string;
  isPrimary: boolean;
}

type AdminTab = 'dashboard' | 'products' | 'orders' | 'users' | 'payments' | 'settings';

type OrderStatusFilter = 'ALL' | 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
type PaymentStatusFilter = 'ALL' | 'PENDING' | 'VERIFIED' | 'FAILED' | 'REFUNDED';

const ORDER_STATUS_OPTIONS: Array<{ value: Exclude<OrderStatusFilter, 'ALL'>; label: string }> = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Confirmed (Paid)' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

function formatPkr(value?: number) {
  return `PKR ${(value || 0).toLocaleString()}`;
}

function statusBadgeClass(status?: string) {
  if (status === 'DELIVERED') return 'badge-success';
  if (status === 'PAID') return 'badge-info';
  if (status === 'SHIPPED') return 'badge-warning';
  if (status === 'CANCELLED') return 'badge-error';
  return 'badge-warning';
}

function splitCsv(text: string) {
  return text.split(',').map(v => v.trim()).filter(Boolean);
}

const productStatusBadgeClass = (status?: string) => {
  if (status === 'PUBLISHED') return 'badge-success';
  if (status === 'HIDDEN') return 'badge-error';
  return 'badge-warning';
};

const paymentStatusBadgeClass = (status?: string) => {
  if (status === 'VERIFIED') return 'badge-success';
  if (status === 'FAILED') return 'badge-error';
  return 'badge-warning';
};

export default function AdminPage() {
  const router = useRouter();
  const hydrated = useHydration();
  const { user, isAuthenticated, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch { /* ignore */ }
    logout();
    toast.success('Signed out of Admin Panel');
    router.push('/login');
  };

  // Admin Auto Inactivity Logout Timeout (15 Minutes)
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') return;

    const INACTIVITY_LIMIT_MS = 15 * 60 * 1000;
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        logout();
        toast.error('Session expired due to 15 minutes of inactivity. Please log in again.', {
          duration: 6000,
          id: 'admin-timeout-toast',
        });
        router.push('/login');
      }, INACTIVITY_LIMIT_MS);
    };

    resetTimer();

    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    activityEvents.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));

    return () => {
      if (timer) clearTimeout(timer);
      activityEvents.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [isAuthenticated, user?.role, logout, router]);

  if (!hydrated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="h-8 w-48 mx-auto bg-surface-200 rounded-full animate-pulse" />
        <div className="h-4 w-64 mx-auto bg-surface-100 rounded-full animate-pulse mt-4" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-surface-500">Admin access required</p>
      </div>
    );
  }

  const tabs = [
    { key: 'dashboard', label: 'Home', icon: FiBarChart2 },
    { key: 'orders', label: 'Orders', icon: FiShoppingCart },
    { key: 'products', label: 'Products', icon: FiPackage },
    { key: 'users', label: 'Customers', icon: FiUsers },
    { key: 'payments', label: 'Payments', icon: FiClock },
    { key: 'settings', label: 'Settings', icon: FiSettings },
  ] as const;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f6f6f4]">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-5 px-3 py-4 lg:grid-cols-[240px_1fr] lg:px-5 lg:py-5">
        <aside className="hidden h-fit rounded-2xl border border-surface-300 bg-white p-3 shadow-soft lg:sticky lg:top-24 lg:block">
          <div className="px-3 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-surface-500">Top Threadz</p>
            <h1 className="mt-1 text-xl font-bold text-surface-950">Commerce Admin</h1>
          </div>
          <nav className="mt-2 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  activeTab === tab.key ? 'bg-surface-900 text-white' : 'text-surface-600 hover:bg-surface-100 hover:text-surface-950'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="mt-4 rounded-xl border border-surface-200 bg-surface-50 p-3 text-xs text-surface-600">
            <p className="font-semibold text-surface-900">Store setup</p>
            <p className="mt-1 mb-3">Catalog, orders, payments, customers, and settings are managed here.</p>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-50 text-red-700 border border-red-200 px-3 py-2 text-xs font-bold hover:bg-red-100 transition-colors"
            >
              <FiLogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="mb-4 rounded-2xl border border-surface-300 bg-white p-3 shadow-soft lg:p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-surface-500">Admin workspace</p>
                <h1 className="text-2xl font-bold text-surface-950">Operations Command Center</h1>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <button className="btn-secondary !rounded-lg !px-3 !py-2 text-xs" onClick={() => toast.success('Export tools are ready for order and catalog reports.')}>
                  <FiDownload className="mr-1 inline" /> Export
                </button>
                <button
                  className={`btn-secondary !rounded-lg !px-3 !py-2 text-xs ${activeTab === 'settings' ? '!bg-surface-900 !text-white' : ''}`}
                  onClick={() => setActiveTab('settings')}
                >
                  <FiSettings className="mr-1 inline" /> Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors flex items-center gap-1"
                  aria-label="Logout"
                >
                  <FiLogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
            <div className="mt-3 flex gap-1 overflow-x-auto rounded-xl bg-surface-50 p-1 lg:hidden">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                    activeTab === tab.key ? 'bg-white text-surface-950 shadow-sm' : 'text-surface-500 hover:text-surface-800'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'dashboard' && <DashboardTab onNavigate={setActiveTab} />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'users' && <ShopifyCustomersTab />}
          {activeTab === 'payments' && <ShopifyPaymentsTab />}
          {activeTab === 'settings' && <StoreSettingsTab />}
        </main>
      </div>
    </div>
  );
}

function HeroBannerManager() {
  const [currentBanner, setCurrentBanner] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/settings/hero-banner')
      .then(res => {
        const data = res.data?.data;
        if (data?.url) setCurrentBanner(data.url);
      })
      .catch(() => { /* ignore */ });
  }, []);

  const handleUpload = async () => {
    let file = fileRef.current?.files?.[0];
    const url = directUrl.trim();

    if (!file && !url) {
      toast.error('Please select an image file or enter an image URL');
      return;
    }

    setUploading(true);
    try {
      if (file) {
        file = await compressImageFile(file, 1920, 1080, 0.85);
      }
      const formData = new FormData();
      if (file) formData.append('image', file);
      if (url) formData.append('url', url);

      let bannerUrl = '';

      try {
        const res = await api.post('/settings/hero-banner', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        bannerUrl = res.data?.data?.url || '';
      } catch (apiErr: any) {
        if (url) {
          bannerUrl = url;
        } else {
          throw apiErr;
        }
      }

      if (bannerUrl) {
        setCurrentBanner(bannerUrl);
        setDirectUrl('');
        if (typeof window !== 'undefined') {
          localStorage.setItem('topthreadz_hero_banner', bannerUrl);
        }
        toast.success('Hero banner updated successfully!');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update hero banner');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleClear = async () => {
    try {
      await api.delete('/settings/hero-banner');
    } catch { /* ignore */ }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('topthreadz_hero_banner');
    }
    setCurrentBanner('');
    setDirectUrl('');
    toast.success('Hero banner removed');
  };

  return (
    <div className="rounded-2xl border border-surface-300 bg-white p-5 shadow-soft space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-surface-950">Homepage Hero Banner</h3>
          <p className="text-xs text-surface-500">Upload an image file to Cloudinary or paste a direct image URL for your Homepage hero section.</p>
        </div>
        {currentBanner && (
          <button onClick={handleClear} className="btn-secondary !py-1.5 !px-3 text-xs text-red-600 border-red-200 hover:bg-red-50">
            Remove Banner
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-surface-700 block mb-1">Option 1: Upload Image File (Cloudinary)</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="input-field w-full file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface-900 file:text-white"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-surface-700 block mb-1">Option 2: Direct Image URL</label>
          <input
            type="url"
            placeholder="Paste image URL (e.g. https://...)"
            value={directUrl}
            onChange={(e) => setDirectUrl(e.target.value)}
            className="input-field w-full"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleUpload} disabled={uploading} className="btn-primary !py-2.5 !px-6 text-xs disabled:opacity-60">
          {uploading ? 'Updating Banner…' : 'Save Hero Banner'}
        </button>
      </div>

      {currentBanner && (
        <div className="rounded-xl border border-surface-200 bg-surface-50 p-3">
          <p className="text-xs font-semibold text-surface-600 mb-2">Active Hero Preview:</p>
          <div className="relative h-44 w-full overflow-hidden rounded-lg border border-surface-300 bg-black">
            <img src={currentBanner} alt="Hero Banner Preview" className="h-full w-full object-cover" />
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardTab({ onNavigate }: { onNavigate: (tab: AdminTab) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data),
  });

  const stats = data?.data;

  if (isLoading) return <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{Array(6).fill(0).map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}</div>;

  const cards = [
    { label: 'Total Revenue', value: formatPkr(stats?.totalRevenue), icon: FiDollarSign, color: 'bg-accent-50 text-accent-600' },
    { label: 'Today Revenue', value: formatPkr(stats?.dailyRevenue), icon: FiTrendingUp, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Weekly Revenue', value: formatPkr(stats?.weeklyRevenue), icon: FiTrendingUp, color: 'bg-teal-50 text-teal-600' },
    { label: 'Monthly Revenue', value: formatPkr(stats?.monthlyRevenue), icon: FiTrendingUp, color: 'bg-cyan-50 text-cyan-600' },
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: FiShoppingCart, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: FiUsers, color: 'bg-purple-50 text-purple-600' },
    { label: 'Products', value: stats?.totalProducts || 0, icon: FiPackage, color: 'bg-brand-50 text-brand-600' },
    { label: 'Pending Orders', value: stats?.pendingOrders || 0, icon: FiClock, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Pending Payments', value: stats?.pendingPayments || 0, icon: FiClock, color: 'bg-red-50 text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-surface-300 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-surface-500">Today&apos;s overview</p>
            <h2 className="mt-1 text-2xl font-bold text-surface-950">Run the store from one place</h2>
            <p className="mt-2 max-w-2xl text-sm text-surface-600">
              Monitor revenue, fulfill pending orders, manage products, review payment exceptions, and watch catalog health.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <button className="rounded-xl border border-surface-200 bg-surface-50 px-3 py-3 text-xs font-semibold hover:bg-white" onClick={() => onNavigate('orders')}>
              <FiTruck className="mx-auto mb-1 h-4 w-4" /> Fulfill
            </button>
            <button className="rounded-xl border border-surface-200 bg-surface-50 px-3 py-3 text-xs font-semibold hover:bg-white" onClick={() => onNavigate('products')}>
              <FiTag className="mx-auto mb-1 h-4 w-4" /> Catalog
            </button>
            <button className="rounded-xl border border-surface-200 bg-surface-50 px-3 py-3 text-xs font-semibold hover:bg-white" onClick={() => onNavigate('payments')}>
              <FiClock className="mx-auto mb-1 h-4 w-4" /> Payments
            </button>
          </div>
        </div>
      </div>

      <HeroBannerManager />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="rounded-2xl border border-surface-300 bg-white p-5 shadow-soft">
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm text-surface-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <p className="font-semibold mb-3">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary !py-2 !px-3 text-xs" onClick={() => onNavigate('products')}>Add Product</button>
          <button className="btn-secondary !py-2 !px-3 text-xs" onClick={() => onNavigate('orders')}>Manage Orders</button>
          <button className="btn-secondary !py-2 !px-3 text-xs" onClick={() => onNavigate('users')}>Manage Users</button>
          <button className="btn-secondary !py-2 !px-3 text-xs" onClick={() => onNavigate('payments')}>Verify Payments</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="font-semibold mb-3">Top Selling Products</p>
          <div className="space-y-2 text-sm">
            {(stats?.topProducts || []).length === 0 && <p className="text-surface-500">No sales data yet.</p>}
            {(stats?.topProducts || []).map((item: any) => (
              <div key={item.productId} className="flex items-center justify-between gap-2">
                <p className="text-surface-700 line-clamp-1">{item.name}</p>
                <span className="badge badge-info">{item.soldQty} sold</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <p className="font-semibold mb-3">Top Categories</p>
          <div className="space-y-2 text-sm">
            {(stats?.topCategories || []).length === 0 && <p className="text-surface-500">No category trends yet.</p>}
            {(stats?.topCategories || []).map((item: any) => (
              <div key={item.category} className="flex items-center justify-between gap-2">
                <p className="text-surface-700">{item.category}</p>
                <span className="badge badge-info">{item.soldQty} sold</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <FiAlertTriangle className="w-4 h-4 text-amber-600" />
            <p className="font-semibold">Low Stock Alerts</p>
          </div>
          <div className="space-y-2 text-sm">
            {(stats?.lowStockProducts || []).length === 0 && <p className="text-surface-500">No low stock warnings.</p>}
            {(stats?.lowStockProducts || []).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between gap-2">
                <p className="text-surface-700 line-clamp-1">{item.name}</p>
                <span className="badge badge-warning">{item.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-4">
        <p className="font-semibold mb-3">Recent Activity</p>
        <div className="space-y-2 text-sm">
          {(stats?.recentActivity || []).length === 0 && <p className="text-surface-500">No recent activity.</p>}
          {(stats?.recentActivity || []).map((activity: any) => (
            <div key={activity.id} className="flex items-center justify-between gap-2">
              <p className="text-surface-700">{activity.label}</p>
              <span className="text-xs text-surface-500">{new Date(activity.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrdersTab() {
  const [orderView, setOrderView] = useState<'all' | 'pending'>('pending');
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const effectiveStatus = orderView === 'pending' ? 'PENDING' : statusFilter;

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (effectiveStatus !== 'ALL') params.set('status', effectiveStatus);
    if (paymentFilter !== 'ALL') params.set('paymentStatus', paymentFilter);
    if (search.trim()) params.set('search', search.trim());
    return params.toString();
  }, [effectiveStatus, paymentFilter, search]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders', queryParams],
    queryFn: () => api.get(`/admin/orders${queryParams ? `?${queryParams}` : ''}`).then(r => r.data),
  });
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      toast.success('Order status updated');
    },
  });

  if (isLoading) return <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>;

  const orders = data?.data?.orders || [];
  const total = data?.data?.pagination?.total || orders.length;
  const paidCount = orders.filter((order: any) => order.status === 'PAID').length;
  const pendingCount = orders.filter((order: any) => order.status === 'PENDING').length;
  const fulfillableCount = orders.filter((order: any) => ['PAID', 'PENDING'].includes(order.status)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-950">Orders</h2>
          <p className="text-sm text-surface-500">Track payment, fulfillment, customer, and delivery status.</p>
        </div>
        <button className="btn-secondary !rounded-lg !px-3 !py-2 text-xs" onClick={() => toast.success('Order export report queued.')}>
          <FiDownload className="mr-1 inline" /> Export orders
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total orders', value: total, icon: FiShoppingCart },
          { label: 'Pending', value: pendingCount, icon: FiClock },
          { label: 'Paid', value: paidCount, icon: FiCheck },
          { label: 'Needs action', value: fulfillableCount, icon: FiTruck },
        ].map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-surface-300 bg-white p-4 shadow-soft">
            <metric.icon className="mb-3 h-4 w-4 text-surface-500" />
            <p className="text-2xl font-bold text-surface-950">{metric.value}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-surface-500">{metric.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-surface-300 bg-white p-3 shadow-soft">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setOrderView('pending')}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${orderView === 'pending' ? 'bg-surface-900 text-white' : 'bg-surface-100 text-surface-700 hover:bg-surface-200'}`}
          >
            Unfulfilled
          </button>
          <button
            onClick={() => setOrderView('all')}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${orderView === 'all' ? 'bg-surface-900 text-white' : 'bg-surface-100 text-surface-700 hover:bg-surface-200'}`}
          >
            All
          </button>
          <span className="ml-auto text-xs text-surface-500">{total} order(s)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="relative md:col-span-2">
            <FiSearch className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="input-field !pl-9"
              placeholder="Search by order #, customer, email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatusFilter)}
            className="input-field"
            disabled={orderView === 'pending'}
          >
            <option value="ALL">All Statuses</option>
            {ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PaymentStatusFilter)}
            className="input-field"
          >
            <option value="ALL">All Payments</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {orders.length === 0 && (
        <div className="rounded-2xl border border-surface-300 bg-white p-8 text-center text-surface-500 shadow-soft">No orders found for current filters.</div>
      )}

      {orders.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-surface-300 bg-white shadow-soft">
          <div className="hidden grid-cols-[1.1fr_1fr_0.8fr_0.8fr_0.6fr] gap-3 border-b border-surface-200 bg-surface-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-surface-500 lg:grid">
            <span>Order</span>
            <span>Customer</span>
            <span>Status</span>
            <span>Total</span>
            <span className="text-right">Action</span>
          </div>
          {orders.map((order: any) => (
            <div key={order.id} className="grid grid-cols-1 gap-3 border-b border-surface-100 px-4 py-4 last:border-b-0 lg:grid-cols-[1.1fr_1fr_0.8fr_0.8fr_0.6fr] lg:items-center">
              <div>
                <p className="font-semibold text-surface-950">{order.orderNumber}</p>
                <p className="text-xs text-surface-500">{new Date(order.createdAt).toLocaleString()}</p>
                <p className="mt-1 text-xs text-surface-500">{(order.items || []).length} item(s)</p>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-surface-800">{order.user?.name || 'Customer'}</p>
                <p className="truncate text-xs text-surface-500">{order.user?.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`badge ${statusBadgeClass(order.status)}`}>{order.status}</span>
                <span className={`badge ${paymentStatusBadgeClass(order.payment?.status)}`}>{order.payment?.status || 'UNPAID'}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-surface-950">{formatPkr(order.total)}</p>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus.mutate({ id: order.id, status: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-surface-300 bg-white px-2 py-1.5 text-xs"
                >
                  {ORDER_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="text-right">
                <button onClick={() => setSelectedOrder(order)} className="btn-secondary !rounded-lg !px-3 !py-2 text-xs">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-[70] bg-black/45 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-bold">Order Details • {selectedOrder.orderNumber}</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-lg hover:bg-surface-100">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
              <div className="rounded-xl border border-surface-200 p-3">
                <p className="font-semibold mb-2">Customer</p>
                <p>{selectedOrder.user?.name}</p>
                <p className="text-surface-600">{selectedOrder.user?.email}</p>
                <p className="text-surface-600">{selectedOrder.user?.phone || 'No phone'}</p>
              </div>
              <div className="rounded-xl border border-surface-200 p-3">
                <p className="font-semibold mb-2">Shipping Address</p>
                <p>{selectedOrder.address?.fullName || 'N/A'}</p>
                <p className="text-surface-600">{selectedOrder.address?.phone || 'N/A'}</p>
                <p className="text-surface-600">{selectedOrder.address?.address || 'N/A'}</p>
                <p className="text-surface-600">{selectedOrder.address?.city || 'N/A'}, {selectedOrder.address?.province || 'N/A'}</p>
              </div>
            </div>

            <div className="rounded-xl border border-surface-200 p-3 mb-4 text-sm">
              <p className="font-semibold mb-2">Payment</p>
              <p>Method: {selectedOrder.payment?.method || 'Not selected yet'}</p>
              <p>Status: {selectedOrder.payment?.status || 'UNPAID'}</p>
              <p>Total: {formatPkr(selectedOrder.total)}</p>
            </div>

            <div className="rounded-xl border border-surface-200 p-3">
              <p className="font-semibold mb-2">Products in this Order</p>
              <div className="space-y-2">
                {(selectedOrder.items || []).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 border-b border-surface-100 pb-2 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-14 rounded-md border border-surface-200 bg-white overflow-hidden shrink-0">
                        {item.product?.images?.[0] ? <img src={resolveImageUrl(item.product.images[0])} alt={item.product?.name || 'Product'} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div>
                        <p className="font-medium line-clamp-1">{item.product?.name || 'Product removed'}</p>
                        <p className="text-xs text-surface-500">
                          Qty: {item.quantity}
                          {item.size ? ` • Size: ${item.size}` : ''}
                          {item.color ? ` • Color: ${item.color}` : ''}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-medium">{formatPkr(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductsTab() {
  const queryClient = useQueryClient();
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [detailsProduct, setDetailsProduct] = useState<any | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'HIDDEN'>('ALL');
  const [stockView, setStockView] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [directImageUrl, setDirectImageUrl] = useState('');
  const [isSlugEditedManually, setIsSlugEditedManually] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [imageMeta, setImageMeta] = useState<ImageMeta[]>([]);
  const [dragImageIndex, setDragImageIndex] = useState<number | null>(null);
  const [selectedColorPreset, setSelectedColorPreset] = useState('');
  const descriptionEditorRef = useRef<HTMLDivElement | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyProductForm);

  const colorList = splitCsv(form.colorsText);
  const subcategoryOptions = ['Summer Collection', 'Winter Collection', 'Wedding', 'Formal', 'Semi-Formal', 'Casual', 'Office Wear', 'Festive Wear', 'Jummah Collection', 'Traditional'];
  const collectionOptions = ['Summer Collection', 'Winter Collection', 'Eid Collection', 'Azaadi Sale', 'Wedding Collection', 'Festive Collection', 'Jummah Special', 'New Arrivals', 'Clearance Sale'];

  const previewPrice = Number(form.price || 0);
  const previewDiscount = Number(form.discount || 0);
  const previewSalePrice = previewPrice > 0 && previewDiscount > 0
    ? Math.round(previewPrice * (1 - previewDiscount / 100))
    : previewPrice;

  const previewTitle = form.name.trim() || 'Product Name Preview';
  const previewCategory = ['Unstitched', form.subcategory].filter(Boolean).join(' / ');

  const makeSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const addColorFromPreset = () => {
    if (!selectedColorPreset) return;
    const next = Array.from(new Set([...colorList, selectedColorPreset]));
    setForm((prev) => ({ ...prev, colorsText: next.join(', ') }));
    setSelectedColorPreset('');
  };

  const removeColor = (value: string) => {
    const next = colorList.filter((entry) => entry.toLowerCase() !== value.toLowerCase());
    setForm((prev) => ({ ...prev, colorsText: next.join(', ') }));
  };

  const autofillBasicWithAi = () => {
    generateAiDescription();
    generateAutoTags();
  };

  const autofillInventoryWithAi = () => {
    setForm((prev) => {
      const stock = Number(prev.stock || 0);
      const threshold = Number(prev.lowStockThreshold || 5);
      return {
        ...prev,
        stockStatus: stock <= 0 ? 'OUT_OF_STOCK' : stock <= threshold ? 'PREORDER' : 'IN_STOCK',
      };
    });
    toast.success('Inventory autofill applied');
  };

  const generateAutoTags = () => {
    const candidateTokens = [
      'Unstitched',
      form.subcategory,
      form.brand,
      form.collection,
      ...splitCsv(form.sizesText),
      ...splitCsv(form.colorsText),
      'mens',
      'fabric',
    ]
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean)
      .map((token) => token.replace(/\s+/g, '-'));

    const styleHints = ['premium', 'pakistani-fashion'];
    if (form.featured) styleHints.push('featured');
    if (form.trending) styleHints.push('trending');
    if (Number(form.discount || 0) >= 20) styleHints.push('sale');

    const generated = Array.from(new Set([...splitCsv(form.tagsText).map((t) => t.toLowerCase()), ...candidateTokens, ...styleHints]));
    setForm((prev) => ({ ...prev, tagsText: generated.join(', ') }));
    toast.success('Tags updated');
  };

  const generateAiDescription = () => {
    const title = form.name.trim() || 'Premium Unstitched Fabric';

    const generated = `
<p><strong>${title}</strong> is a men's unstitched fabric made for clean tailoring and daily comfort.</p>
<p>Suitable for shalwar kameez stitching with a premium hand feel and dependable finish.</p>
<p>Available in fixed fabric lengths of 4.5m and 7 meter.</p>
    `.trim();

    setForm((prev) => ({
      ...prev,
      description: generated,
    }));
    toast.success('Description generated');
  };

  useEffect(() => {
    if (!isSlugEditedManually) {
      setForm((prev) => ({ ...prev, slug: makeSlug(prev.name) }));
    }
  }, [form.name, isSlugEditedManually]);

  useEffect(() => {
    if (editingProduct) return;
    const brandPart = (form.brand || 'MW').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'MW';
    const subPart = (form.subcategory || 'UST').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'UST';
    const suffix = Date.now().toString(36).toUpperCase().slice(-4);
    setForm((prev) => ({ ...prev, sku: `${brandPart}-${subPart}-${suffix}` }));
  }, [editingProduct, form.brand, form.subcategory]);

  useEffect(() => {
    if (!descriptionEditorRef.current) return;
    if (descriptionEditorRef.current.innerHTML !== form.description) {
      descriptionEditorRef.current.innerHTML = form.description || '';
    }
  }, [form.description]);

  useEffect(() => {
    setImageMeta((prev) => {
      const next = form.images.map((url, index) => {
        const found = prev.find((img) => img.url === url);
        return {
          url,
          alt: found?.alt || form.name || `Product image ${index + 1}`,
          publicId: found?.publicId,
          isPrimary: found?.isPrimary || index === 0,
        };
      });

      if (!next.some((img) => img.isPrimary) && next.length > 0) {
        next[0].isPrimary = true;
      }
      return next;
    });
  }, [form.images, form.name]);



  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => api.get('/products?limit=50').then(r => r.data),
  });

  const createProduct = useMutation({
    mutationFn: (payload: any) => productService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast.success('Product created');
      setShowInlineForm(false);
      setEditingProduct(null);
      setImageMeta([]);
      setIsSlugEditedManually(false);
      setFormErrors({});
      setForm(emptyProductForm);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to create product');
    },
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => productService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast.success('Product updated');
      setShowInlineForm(false);
      setEditingProduct(null);
      setImageMeta([]);
      setIsSlugEditedManually(false);
      setFormErrors({});
      setForm(emptyProductForm);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to update product');
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => productService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast.success('Product deleted');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to delete product');
    },
  });

  const cleanupLegacyData = useMutation({
    mutationFn: () => api.post('/admin/maintenance/cleanup-legacy-data').then(r => r.data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      const removed = result?.data?.removed || {};
      const totalRemoved = Object.values(removed).reduce((sum: number, value: any) => sum + Number(value || 0), 0);
      toast.success(`Legacy cleanup complete. Removed ${totalRemoved} stale record(s).`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Legacy cleanup failed');
    },
  });

  if (isLoading) return <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>;

  const products = data?.data?.products || [];
  const filteredProducts = products.filter((product: any) => {
    const text = `${product.name || ''} ${product.brand || ''} ${product.sku || ''} ${product.subcategory || ''}`.toLowerCase();
    const matchesSearch = !productSearch.trim() || text.includes(productSearch.trim().toLowerCase());
    const matchesStatus = productStatusFilter === 'ALL' || product.productStatus === productStatusFilter;
    const lowThreshold = Number(product.lowStockThreshold || 5);
    const matchesStock =
      stockView === 'ALL' ||
      (stockView === 'LOW' && Number(product.stock || 0) > 0 && Number(product.stock || 0) <= lowThreshold) ||
      (stockView === 'OUT' && Number(product.stock || 0) <= 0);
    return matchesSearch && matchesStatus && matchesStock;
  });
  const publishedCount = products.filter((product: any) => product.productStatus === 'PUBLISHED').length;
  const draftCount = products.filter((product: any) => product.productStatus === 'DRAFT').length;
  const lowStockCount = products.filter((product: any) => Number(product.stock || 0) > 0 && Number(product.stock || 0) <= Number(product.lowStockThreshold || 5)).length;
  const outOfStockCount = products.filter((product: any) => Number(product.stock || 0) <= 0).length;

  const openCreateInlineForm = () => {
    setEditingProduct(null);
    setShowInlineForm(true);
    setImageMeta([]);
    setFormErrors({});
    setIsSlugEditedManually(false);
    setForm(emptyProductForm);
  };

  const openEditInlineForm = (product: any) => {
    const fallbackSubcategory = subcategoryOptions[0] || 'Traditional';
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      description: product.description || '',
      subcategory: subcategoryOptions.includes(product.subcategory) ? product.subcategory : fallbackSubcategory,
      brand: product.brand || '',
      slug: product.slug || '',
      price: String(product.price ?? ''),
      sku: product.sku || '',
      stockStatus: product.stockStatus || (product.stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK'),
      lowStockThreshold: String(product.lowStockThreshold ?? 5),
      discount: String(product.discount ?? 0),
      stock: String(product.stock ?? 0),
      sizesText: (product.sizes || []).join(', '),
      colorsText: (product.colors || []).join(', '),
      tagsText: (product.tags || []).join(', '),
      collection: product.collection || '',
      careInstructions: product.careInstructions || '',
      featured: Boolean(product.featured),
      trending: Boolean(product.trending),
      productStatus: product.productStatus || 'DRAFT',
      images: product.images || [],
    });
    setImageMeta(Array.isArray(product.imageMeta) ? product.imageMeta : []);
    setShowInlineForm(true);
    setIsSlugEditedManually(true);
    setFormErrors({});
  };

  const openDetails = (product: any) => {
    setDetailsProduct(product);
    setIsDetailsOpen(true);
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = 'Product name is required';
    if (!form.description.trim()) nextErrors.description = 'Product description is required';
    if (!form.subcategory.trim()) nextErrors.subcategory = 'Subcategory is required';
    if (!form.price || Number(form.price) <= 0) nextErrors.price = 'Regular price must be greater than zero';
    if (!form.stock || Number(form.stock) < 0) nextErrors.stock = 'Stock quantity cannot be negative';
    if (!form.sku.trim()) nextErrors.sku = 'SKU is required';
    if (form.images.length === 0) nextErrors.images = 'Upload at least one image';
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please resolve required fields before saving');
      return;
    }

    const regularPrice = Number(form.price || 0);
    const discountPercent = Number(form.discount || 0);

    const orderedImages = [...imageMeta].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary)).map((img) => img.url);

    const generatedTags = splitCsv(form.tagsText);
    if (form.collection.trim()) generatedTags.push(`collection:${form.collection.trim()}`);
    generatedTags.push('gender:male', 'unstitched');
    if (form.featured) generatedTags.push('featured');
    if (form.trending) generatedTags.push('trending');

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim(),
      category: 'Unstitched',
      subcategory: form.subcategory.trim() || undefined,
      brand: form.brand.trim() || undefined,
      price: regularPrice,
      discount: discountPercent,
      stock: Number(form.stock || 0),
      stockStatus: form.stockStatus,
      lowStockThreshold: Number(form.lowStockThreshold || 0),
      sku: form.sku.trim() || undefined,
      sizes: splitCsv(form.sizesText).length ? splitCsv(form.sizesText) : ['S', 'M', 'L', 'XL', 'XXL', '4.5m', '7 meter'],
      colors: splitCsv(form.colorsText),
      tags: Array.from(new Set(generatedTags)),
      images: orderedImages,
      imageMeta,
      collection: form.collection.trim() || undefined,
      gender: 'MALE',
      careInstructions: form.careInstructions.trim() || undefined,
      featured: form.featured,
      trending: form.trending,
      productStatus: form.productStatus,
      visibility: 'PUBLIC',
    };

    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, payload });
      return;
    }
    createProduct.mutate(payload);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(event.target.files || []);
    if (rawFiles.length === 0) return;

    setUploadingImages(true);
    try {
      // Compress image files client-side to keep request payload tiny (< 300KB)
      const files = await Promise.all(rawFiles.map((file) => compressImageFile(file)));
      const uploadedImages = await productService.uploadImages(files);
      const uploadedUrls = uploadedImages.map((image) => image.url).filter(Boolean);

      if (uploadedUrls.length === 0) {
        toast.error('Upload succeeded but no image URLs were returned');
        return;
      }

      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
      setImageMeta((prev) => [...prev, ...uploadedImages.map((image, index) => ({
        url: image.url,
        publicId: image.publicId,
        alt: form.name || `Product image ${prev.length + index + 1}`,
        isPrimary: prev.length === 0 && index === 0,
      }))]);
      toast.success(`${uploadedUrls.length} image(s) uploaded`);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Image upload failed');
    } finally {
      setUploadingImages(false);
      event.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const url = directImageUrl.trim();
    if (!url) {
      toast.error('Please enter an image URL');
      return;
    }
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, url],
    }));
    setImageMeta((prev) => [
      ...prev,
      {
        url,
        publicId: `url-${Date.now()}`,
        alt: form.name || `Product image ${prev.length + 1}`,
        isPrimary: prev.length === 0,
      },
    ]);
    setDirectImageUrl('');
    toast.success('Image URL added');
  };

  const removeUploadedImage = (imageUrl: string) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img !== imageUrl),
    }));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    setForm((prev) => {
      const next = [...prev.images];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { ...prev, images: next };
    });
  };

  const setPrimaryImage = (url: string) => {
    setImageMeta((prev) => prev.map((img) => ({ ...img, isPrimary: img.url === url })));
  };

  const updateImageAlt = (url: string, alt: string) => {
    setImageMeta((prev) => prev.map((img) => (img.url === url ? { ...img, alt } : img)));
  };

  const applyRichText = (command: string) => {
    if (!descriptionEditorRef.current) return;
    descriptionEditorRef.current.focus();
    document.execCommand(command, false);
    setForm((prev) => ({ ...prev, description: descriptionEditorRef.current?.innerHTML || '' }));
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-surface-950">Products</h2>
          <p className="text-sm text-surface-500">Manage the men&apos;s unstitched catalog, stock, pricing, and merchandising.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const confirmed = window.confirm("Clean stale cart/search/view data and delete legacy non-unstitched products? Orders, payments, users, and current men's unstitched products will be kept.");
              if (confirmed) cleanupLegacyData.mutate();
            }}
            className="btn-secondary !py-2 !px-4 text-sm flex items-center gap-2"
            disabled={cleanupLegacyData.isPending}
          >
            <FiTrash2 className="w-4 h-4" /> {cleanupLegacyData.isPending ? 'Cleaning...' : 'Clean Legacy Data'}
          </button>
          <button onClick={openCreateInlineForm} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-2">
            <FiPlus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Published', value: publishedCount, icon: FiEye, tone: 'bg-emerald-50 text-emerald-700' },
          { label: 'Drafts', value: draftCount, icon: FiEdit2, tone: 'bg-amber-50 text-amber-700' },
          { label: 'Low stock', value: lowStockCount, icon: FiAlertTriangle, tone: 'bg-orange-50 text-orange-700' },
          { label: 'Out of stock', value: outOfStockCount, icon: FiX, tone: 'bg-red-50 text-red-700' },
        ].map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-surface-300 bg-white p-4 shadow-soft">
            <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${metric.tone}`}>
              <metric.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-surface-950">{metric.value}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-surface-500">{metric.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 rounded-2xl border border-surface-300 bg-white p-3 shadow-soft">
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_180px_160px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              className="input-field !pl-9"
              placeholder="Search products by name, SKU, brand, or subcategory"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
          </div>
          <select className="input-field" value={productStatusFilter} onChange={(e) => setProductStatusFilter(e.target.value as typeof productStatusFilter)}>
            <option value="ALL">All statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="HIDDEN">Hidden</option>
          </select>
          <select className="input-field" value={stockView} onChange={(e) => setStockView(e.target.value as typeof stockView)}>
            <option value="ALL">All stock</option>
            <option value="LOW">Low stock</option>
            <option value="OUT">Out of stock</option>
          </select>
        </div>
      </div>

      {showInlineForm && (
        <div className="mb-6 rounded-2xl border border-surface-300 bg-[#f7f7f5] p-3 shadow-soft md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-surface-500">Product editor</p>
              <p className="text-xl font-bold text-surface-950">{editingProduct ? 'Edit unstitched fabric' : 'Add unstitched fabric'}</p>
              <p className="text-xs text-surface-500">Shopify-style setup for men&apos;s unstitched clothing.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowInlineForm(false);
                setEditingProduct(null);
                setForm(emptyProductForm);
                setImageMeta([]);
                setFormErrors({});
              }}
              className="btn-secondary !py-1.5 !px-3 text-xs"
            >
              Close
            </button>
          </div>

          <div className="mb-4 rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-xs text-surface-600">
            Product type is fixed to men's unstitched clothing. Category, gender, and sizes are saved automatically to match the database fields.
          </div>

          <form onSubmit={handleSubmit} className="admin-compact-form grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
            <div className="xl:col-span-1 space-y-4">
                <section className="space-y-3 rounded-xl border border-surface-300 bg-white p-4 shadow-soft">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">Product details</p>
                    <button type="button" onClick={autofillBasicWithAi} className="admin-ai-btn">Generate Copy</button>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-surface-600">Product Name *</label>
                    <input
                      className="input-field"
                      placeholder="Premium Embroidered Lawn Suit"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-surface-600">Product Description (Rich Text) *</label>
                    <div className="border border-surface-200 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-2 border-b border-surface-200 p-2 bg-surface-50">
                        <button type="button" onClick={() => applyRichText('bold')} className="btn-secondary !py-1 !px-2 text-xs">Bold</button>
                        <button type="button" onClick={() => applyRichText('italic')} className="btn-secondary !py-1 !px-2 text-xs">Italic</button>
                        <button type="button" onClick={() => applyRichText('insertUnorderedList')} className="btn-secondary !py-1 !px-2 text-xs">List</button>
                      </div>
                      <div
                        ref={descriptionEditorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) => {
                          const html = (e.currentTarget as HTMLDivElement).innerHTML;
                          setForm((prev) => ({ ...prev, description: html }));
                        }}
                        className="min-h-36 p-3 text-sm outline-none"
                      />
                    </div>
                    {formErrors.description && <p className="text-xs text-red-600 mt-1">{formErrors.description}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-surface-600">Subcategory *</label>
                      <select
                        className="input-field"
                        value={form.subcategory}
                        onChange={(e) => setForm((prev) => ({ ...prev, subcategory: e.target.value }))}
                      >
                        <option value="">Select subcategory</option>
                        {subcategoryOptions.map((subcategory) => (
                          <option key={subcategory} value={subcategory}>{subcategory}</option>
                        ))}
                      </select>
                      {formErrors.subcategory && <p className="text-xs text-red-600 mt-1">{formErrors.subcategory}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-surface-600">Brand *</label>
                      <select className="input-field" value={form.brand} onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}>
                        <option value="">Select Brand</option>
                        {BRAND_OPTIONS.map((brand) => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-surface-600">Tags</label>
                      <input className="input-field" value={form.tagsText} onChange={(e) => setForm((prev) => ({ ...prev, tagsText: e.target.value }))} placeholder="embroidered, lawn, festive" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-surface-600">Product Slug</label>
                      <input
                        className="input-field"
                        value={form.slug}
                        onChange={(e) => {
                          setIsSlugEditedManually(true);
                          setForm((prev) => ({ ...prev, slug: makeSlug(e.target.value) }));
                        }}
                        placeholder="premium-embroidered-lawn-suit"
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-surface-300 bg-white p-4 shadow-soft">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">Pricing</p>
                  </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-surface-600">Regular Price *</label>
                    <input className="input-field" type="number" min="1" step="0.01" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} />
                    {formErrors.price && <p className="text-xs text-red-600 mt-1">{formErrors.price}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-surface-600">Discount %</label>
                    <input className="input-field" type="number" min="0" max="100" step="1" value={form.discount} onChange={(e) => setForm((prev) => ({ ...prev, discount: e.target.value }))} />
                  </div>
                </div>
                </section>

                <section className="rounded-xl border border-surface-300 bg-white p-4 shadow-soft">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">Inventory</p>
                    <button type="button" onClick={autofillInventoryWithAi} className="admin-ai-btn">Sync Status</button>
                  </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-surface-600">SKU (Auto) *</label>
                    <input className="input-field bg-surface-100" value={form.sku} readOnly placeholder="MW-LAWN-001" />
                    {formErrors.sku && <p className="text-xs text-red-600 mt-1">{formErrors.sku}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-surface-600">Stock Quantity *</label>
                    <input className="input-field" type="number" min="0" value={form.stock} onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))} />
                    {formErrors.stock && <p className="text-xs text-red-600 mt-1">{formErrors.stock}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-surface-600">Stock Status</label>
                    <select className="input-field" value={form.stockStatus} onChange={(e) => setForm((prev) => ({ ...prev, stockStatus: e.target.value as ProductFormState['stockStatus'] }))}>
                      <option value="IN_STOCK">In Stock</option>
                      <option value="OUT_OF_STOCK">Out of Stock</option>
                      <option value="PREORDER">Preorder</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-surface-600">Low Stock Alert Threshold</label>
                    <input className="input-field" type="number" min="0" value={form.lowStockThreshold} onChange={(e) => setForm((prev) => ({ ...prev, lowStockThreshold: e.target.value }))} />
                  </div>
                </div>
                </section>

                <section className="space-y-3 rounded-xl border border-surface-300 bg-white p-4 shadow-soft">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">Organization</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-surface-600">Collection / Season</label>
                      <select className="input-field" value={form.collection} onChange={(e) => setForm((prev) => ({ ...prev, collection: e.target.value }))}>
                        <option value="">No collection</option>
                        {collectionOptions.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-surface-600">Colors</label>
                      <div className="flex gap-2">
                        <select className="input-field" value={selectedColorPreset} onChange={(e) => setSelectedColorPreset(e.target.value)}>
                          <option value="">Select color</option>
                          {COLOR_PRESET_OPTIONS.map((color) => (
                            <option key={color} value={color}>{color}</option>
                          ))}
                        </select>
                        <button type="button" onClick={addColorFromPreset} className="btn-secondary !px-3 !py-2 text-xs">Add</button>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-surface-600">Sizes</label>
                        <div className="flex gap-1.5 text-[10px]">
                          <button type="button" onClick={() => setForm(p => ({ ...p, sizesText: 'S, M, L, XL, XXL' }))} className="text-brand-600 font-semibold hover:underline">S-XXL</button>
                          <span className="text-surface-300">•</span>
                          <button type="button" onClick={() => setForm(p => ({ ...p, sizesText: '4.5m, 7 meter' }))} className="text-brand-600 font-semibold hover:underline">4.5m/7m</button>
                        </div>
                      </div>
                      <input
                        className="input-field"
                        value={form.sizesText}
                        onChange={(e) => setForm((prev) => ({ ...prev, sizesText: e.target.value }))}
                        placeholder="S, M, L, XL, XXL or 4.5m, 7 meter"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {colorList.length === 0 ? <p className="text-xs text-surface-500">No colors selected yet.</p> : null}
                    {colorList.map((color) => (
                      <button key={color} type="button" onClick={() => removeColor(color)} className="rounded-full border border-surface-300 bg-white px-3 py-1 text-xs text-surface-700 hover:bg-surface-100">
                        {color} ×
                      </button>
                    ))}
                  </div>

                </section>

                <section className="space-y-3 rounded-xl border border-surface-300 bg-white p-4 shadow-soft">
                  <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">Media</p>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-200 pb-3">
                    <p className="text-sm font-semibold">Product Images</p>
                    <label className="btn-secondary !py-1.5 !px-3 text-xs cursor-pointer inline-flex items-center gap-1 shrink-0">
                      <FiUpload className="w-3.5 h-3.5" />
                      {uploadingImages ? 'Uploading File...' : 'Upload Image File(s)'}
                      <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploadingImages} />
                    </label>
                  </div>

                  {/* Direct Image URL Input Option */}
                  <div className="flex gap-2 items-center pt-1">
                    <input
                      type="url"
                      placeholder="Or paste image URL (e.g. https://...)"
                      value={directImageUrl}
                      onChange={(e) => setDirectImageUrl(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddImageUrl(); } }}
                      className="input-field flex-1 text-xs"
                    />
                    <button type="button" onClick={handleAddImageUrl} className="btn-secondary !py-2 !px-3 text-xs shrink-0 font-bold">
                      + Add URL
                    </button>
                  </div>
                  {formErrors.images && <p className="text-xs text-red-600">{formErrors.images}</p>}

                  {form.images.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-surface-300 p-6 text-center text-sm text-surface-500">No images uploaded yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {form.images.map((img, index) => {
                        const meta = imageMeta.find((item) => item.url === img);
                        return (
                          <div
                            key={img}
                            className="rounded-xl border border-surface-200 p-2 bg-white"
                            draggable
                            onDragStart={() => setDragImageIndex(index)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                              if (dragImageIndex === null || dragImageIndex === index) return;
                              moveImage(dragImageIndex, index);
                              setDragImageIndex(null);
                            }}
                          >
                            <div className="flex flex-col md:flex-row gap-2">
                              <AdminImage src={img} alt={meta?.alt || 'Product image'} className="w-full md:w-24 h-24 object-cover rounded-lg border border-surface-200" />
                              <div className="flex-1 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <button type="button" onClick={() => setPrimaryImage(img)} className={`btn-secondary !py-1 !px-2 text-xs ${meta?.isPrimary ? '!bg-amber-100 !text-amber-700 !border-amber-200' : ''}`}>
                                    <FiStar className="inline-block mr-1" /> {meta?.isPrimary ? 'Primary' : 'Set Primary'}
                                  </button>
                                  <button type="button" className="btn-secondary !py-1 !px-2 text-xs" onClick={() => index > 0 && moveImage(index, index - 1)}>
                                    <FiArrowUp className="inline-block" />
                                  </button>
                                  <button type="button" className="btn-secondary !py-1 !px-2 text-xs" onClick={() => index < form.images.length - 1 && moveImage(index, index + 1)}>
                                    <FiArrowDown className="inline-block" />
                                  </button>
                                  <button type="button" className="btn-secondary !py-1 !px-2 text-xs !text-red-600 !border-red-200" onClick={() => removeUploadedImage(img)}>
                                    <FiTrash2 className="inline-block" />
                                  </button>
                                </div>
                                <input
                                  className="input-field !py-1.5"
                                  placeholder="Alt text for SEO"
                                  value={meta?.alt || ''}
                                  onChange={(e) => updateImageAlt(img, e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="rounded-xl border border-surface-300 bg-white p-4 shadow-soft">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">Care Instructions</p>
                  </div>
                  <textarea className="input-field min-h-24" placeholder="Care Instructions" value={form.careInstructions} onChange={(e) => setForm((prev) => ({ ...prev, careInstructions: e.target.value }))} />
                </section>

                <section className="rounded-xl border border-surface-300 bg-white p-4 shadow-soft">
                  <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-3">Publishing</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))} /> Featured Product</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.trending} onChange={(e) => setForm((prev) => ({ ...prev, trending: e.target.checked }))} /> Trending / New Arrival</label>
                  <div>
                    <label className="text-xs font-semibold text-surface-600">Product Status</label>
                    <select className="input-field" value={form.productStatus} onChange={(e) => setForm((prev) => ({ ...prev, productStatus: e.target.value as ProductFormState['productStatus'] }))}>
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="HIDDEN">Hidden</option>
                    </select>
                  </div>
                </div>
                </section>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInlineForm(false);
                    setEditingProduct(null);
                  }}
                  className="btn-secondary !py-2 !px-4 text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary !py-2 !px-4 text-sm" disabled={createProduct.isPending || updateProduct.isPending}>
                  {editingProduct ? (updateProduct.isPending ? 'Saving...' : 'Save Product') : (createProduct.isPending ? 'Creating...' : 'Create Product')}
                </button>
              </div>
            </div>

            <div className="xl:col-span-1">
              <div className="sticky top-4 space-y-4">
              <div className="rounded-xl border border-surface-300 bg-white p-4 shadow-soft space-y-3">
                <p className="font-semibold">Storefront preview</p>
                <div className="rounded-xl overflow-hidden border border-surface-200 bg-white">
                  <div className="relative aspect-[4/5] bg-surface-100 overflow-hidden">
                    {form.images[0] ? (
                      <AdminImage src={form.images[0]} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-surface-500">No image selected</div>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="font-medium line-clamp-2">{previewTitle}</p>
                    <p className="text-xs text-surface-500">{previewCategory}</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-surface-800">{formatPkr(previewSalePrice > 0 ? previewSalePrice : previewPrice)}</p>
                      {previewDiscount > 0 && <span className="badge bg-red-100 text-red-600">-{previewDiscount}%</span>}
                    </div>
                    <p className="text-xs text-surface-500">SKU: {form.sku || 'Auto SKU'}</p>
                    <p className="text-xs text-surface-500">Status: {form.productStatus} • PUBLIC</p>
                  </div>
                </div>
              </div>

                <div className="rounded-xl border border-surface-300 bg-white p-4 text-xs text-surface-600 shadow-soft">
                  <p className="font-semibold mb-1 flex items-center gap-1"><FiInfo className="w-3.5 h-3.5" /> Publishing checklist</p>
                  <p>Use a clear product name, at least one image, accurate stock, and selected colors before publishing.</p>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-surface-300 bg-white shadow-soft">
        <div className="border-b border-surface-200 px-4 py-3">
          <p className="text-sm font-semibold text-surface-950">{filteredProducts.length} product(s)</p>
        </div>
        {filteredProducts.length === 0 ? (
          <div className="p-10 text-center text-sm text-surface-500">No products match the current filters.</div>
        ) : null}
        {filteredProducts.map((p: any) => {
          const imageUrl = p.images?.[0] ? resolveImageUrl(p.images[0]) : '';
          const stock = Number(p.stock || 0);
          return (
          <div key={p.id} className="grid grid-cols-1 gap-3 border-b border-surface-100 p-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border border-surface-200 bg-surface-100">
                <AdminImage src={imageUrl} alt={p.name || 'Product'} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-surface-950 line-clamp-1">{p.name}</p>
                  <span className={`badge ${productStatusBadgeClass(p.productStatus)}`}>{p.productStatus || 'DRAFT'}</span>
                </div>
                <p className="mt-1 text-sm text-surface-500 line-clamp-1">
                  {p.brand || 'No brand'} • {p.subcategory || p.category} • SKU {p.sku || 'N/A'}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-surface-500">
                  <span className="rounded-full bg-surface-100 px-2 py-1">PKR {p.price?.toLocaleString()}</span>
                  <span className={`rounded-full px-2 py-1 ${stock <= 0 ? 'bg-red-50 text-red-700' : stock <= Number(p.lowStockThreshold || 5) ? 'bg-orange-50 text-orange-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    Stock {stock}
                  </span>
                  {(p.colors || []).slice(0, 4).map((color: string) => (
                    <span key={color} className="rounded-full bg-surface-100 px-2 py-1">{color}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {p.discount > 0 && <span className="badge bg-red-100 text-red-600">-{p.discount}%</span>}
              <button onClick={() => openDetails(p)} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1">
                <FiEye className="w-3.5 h-3.5" /> Details
              </button>
              <button onClick={() => openEditInlineForm(p)} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1">
                <FiEdit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={() => {
                  const confirmed = window.confirm(`Delete "${p.name}"? This cannot be undone.`);
                  if (confirmed) deleteProduct.mutate(p.id);
                }}
                className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1 !text-red-600 !border-red-200 hover:!bg-red-50"
              >
                <FiTrash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        );
        })}
      </div>

      {isDetailsOpen && detailsProduct && (
        <div className="fixed inset-0 z-[70] bg-black/45 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-bold">Product Details</h3>
              <button onClick={() => setIsDetailsOpen(false)} className="p-2 rounded-lg hover:bg-surface-100">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <p><span className="font-semibold">Name:</span> {detailsProduct.name}</p>
              <p><span className="font-semibold">Category:</span> {detailsProduct.category}</p>
              <p><span className="font-semibold">Price:</span> PKR {detailsProduct.price?.toLocaleString()}</p>
              <p><span className="font-semibold">Discount:</span> {detailsProduct.discount || 0}%</p>
              <p><span className="font-semibold">Stock:</span> {detailsProduct.stock}</p>
              <p><span className="font-semibold">Sizes:</span> {(detailsProduct.sizes || []).join(', ') || 'N/A'}</p>
              <p><span className="font-semibold">Colors:</span> {(detailsProduct.colors || []).join(', ') || 'N/A'}</p>
              <p><span className="font-semibold">Tags:</span> {(detailsProduct.tags || []).join(', ') || 'N/A'}</p>
              <div>
                <p className="font-semibold mb-1">Description:</p>
                <FormattedProductDescription content={detailsProduct.description} />
              </div>
              <div>
                <p className="font-semibold mb-1">Images:</p>
                <div className="space-y-1">
                  {(detailsProduct.images || []).length === 0 && <p className="text-surface-500">No images</p>}
                  {(detailsProduct.images || []).map((img: string, idx: number) => (
                    <a key={idx} href={resolveImageUrl(img)} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline break-all block">
                      {img}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function UsersTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get('/admin/users').then(r => r.data),
  });

  if (isLoading) return <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>;

  const users = data?.data?.users || [];

  return (
    <div className="space-y-3">
      {users.map((u: any) => (
        <div key={u.id} className="card p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">{u.name}</p>
            <p className="text-sm text-surface-500">{u.email} — {u.phone}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge ${u.role === 'ADMIN' ? 'badge-warning' : 'badge-info'}`}>{u.role}</span>
            {u.isLocked && <span className="badge badge-error">Locked</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ShopifyCustomersTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get('/admin/users').then(r => r.data),
  });

  if (isLoading) return <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>;

  const users = data?.data?.users || [];
  const adminCount = users.filter((u: any) => u.role === 'ADMIN').length;
  const lockedCount = users.filter((u: any) => u.isLocked).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-950">Customers</h2>
          <p className="text-sm text-surface-500">View customer accounts, staff roles, and account security state.</p>
        </div>
        <button className="btn-secondary !rounded-lg !px-3 !py-2 text-xs" onClick={() => toast.success('Customer export report queued.')}>
          <FiDownload className="mr-1 inline" /> Export customers
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Customers', value: users.length, icon: FiUsers },
          { label: 'Staff admins', value: adminCount, icon: FiSettings },
          { label: 'Locked', value: lockedCount, icon: FiAlertTriangle },
          { label: 'Active', value: Math.max(users.length - lockedCount, 0), icon: FiCheck },
        ].map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-surface-300 bg-white p-4 shadow-soft">
            <metric.icon className="mb-3 h-4 w-4 text-surface-500" />
            <p className="text-2xl font-bold text-surface-950">{metric.value}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-surface-500">{metric.label}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-300 bg-white shadow-soft">
        <div className="hidden grid-cols-[1.2fr_1fr_0.7fr_0.7fr] gap-3 border-b border-surface-200 bg-surface-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-surface-500 lg:grid">
          <span>Name</span>
          <span>Contact</span>
          <span>Role</span>
          <span>Status</span>
        </div>
        {users.length === 0 ? <div className="p-10 text-center text-sm text-surface-500">No customers found.</div> : null}
        {users.map((u: any) => (
          <div key={u.id} className="grid grid-cols-1 gap-3 border-b border-surface-100 px-4 py-4 last:border-b-0 lg:grid-cols-[1.2fr_1fr_0.7fr_0.7fr] lg:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-900 text-sm font-bold text-white">
                {String(u.name || u.email || 'U').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-surface-950">{u.name}</p>
                <p className="truncate text-xs text-surface-500">Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="truncate text-sm text-surface-800">{u.email}</p>
              <p className="truncate text-xs text-surface-500">{u.phone || 'No phone'}</p>
            </div>
            <span className={`badge w-fit ${u.role === 'ADMIN' ? 'badge-warning' : 'badge-info'}`}>{u.role}</span>
            <span className={`badge w-fit ${u.isLocked ? 'badge-error' : 'badge-success'}`}>{u.isLocked ? 'Locked' : 'Active'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: () => api.get('/admin/payments/pending').then(r => r.data),
  });
  const queryClient = useQueryClient();

  const verify = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      api.post(`/admin/payments/${id}/verify`, { approved }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin'] }); toast.success('Payment updated'); },
  });

  if (isLoading) return <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>;

  const payments = data?.data?.payments || [];

  return (
    <div className="space-y-3">
      {payments.length === 0 && <p className="text-center text-surface-500 py-10">No pending payments</p>}
      {payments.map((p: any) => (
        <div key={p.id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-medium">Order: {p.order?.orderNumber}</p>
            <p className="text-sm text-surface-500">{p.method} — PKR {p.amount?.toLocaleString()} — {p.order?.user?.name}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => verify.mutate({ id: p.id, approved: true })} className="btn-accent !py-1.5 !px-3 text-xs flex items-center gap-1">
              <FiCheck className="w-3 h-3" /> Approve
            </button>
            <button onClick={() => verify.mutate({ id: p.id, approved: false })} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1">
              <FiX className="w-3 h-3" /> Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ShopifyPaymentsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: () => api.get('/admin/payments/pending').then(r => r.data),
  });
  const queryClient = useQueryClient();

  const verify = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      api.post(`/admin/payments/${id}/verify`, { approved }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin'] }); toast.success('Payment updated'); },
  });

  if (isLoading) return <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>;

  const payments = data?.data?.payments || [];
  const totalPendingAmount = payments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-950">Payments</h2>
          <p className="text-sm text-surface-500">Review Safepay payment exceptions and manual verification queue.</p>
        </div>
        <button className="btn-secondary !rounded-lg !px-3 !py-2 text-xs" onClick={() => toast.success('Payment reconciliation export queued.')}>
          <FiDownload className="mr-1 inline" /> Export payments
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-surface-300 bg-white p-4 shadow-soft">
          <FiClock className="mb-3 h-4 w-4 text-surface-500" />
          <p className="text-2xl font-bold text-surface-950">{payments.length}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-500">Pending reviews</p>
        </div>
        <div className="rounded-2xl border border-surface-300 bg-white p-4 shadow-soft md:col-span-2">
          <FiDollarSign className="mb-3 h-4 w-4 text-surface-500" />
          <p className="text-2xl font-bold text-surface-950">{formatPkr(totalPendingAmount)}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-500">Pending payment value</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-300 bg-white shadow-soft">
        <div className="hidden grid-cols-[1fr_0.8fr_0.8fr_0.9fr] gap-3 border-b border-surface-200 bg-surface-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-surface-500 lg:grid">
          <span>Order</span>
          <span>Method</span>
          <span>Amount</span>
          <span className="text-right">Decision</span>
        </div>
        {payments.length === 0 ? <div className="p-10 text-center text-sm text-surface-500">No pending payments</div> : null}
        {payments.map((p: any) => (
          <div key={p.id} className="grid grid-cols-1 gap-3 border-b border-surface-100 px-4 py-4 last:border-b-0 lg:grid-cols-[1fr_0.8fr_0.8fr_0.9fr] lg:items-center">
            <div>
              <p className="font-semibold text-surface-950">{p.order?.orderNumber}</p>
              <p className="text-xs text-surface-500">{p.order?.user?.name || 'Customer'}</p>
            </div>
            <span className="badge badge-info w-fit">{p.method}</span>
            <p className="text-sm font-semibold text-surface-950">{formatPkr(p.amount)}</p>
            <div className="flex justify-start gap-2 lg:justify-end">
              <button onClick={() => verify.mutate({ id: p.id, approved: true })} className="btn-accent !rounded-lg !py-2 !px-3 text-xs flex items-center gap-1">
                <FiCheck className="w-3 h-3" /> Approve
              </button>
              <button onClick={() => verify.mutate({ id: p.id, approved: false })} className="btn-secondary !rounded-lg !py-2 !px-3 text-xs flex items-center gap-1">
                <FiX className="w-3 h-3" /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StoreSettingsTab() {
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
        operatingDays: settingsData.operatingDays || 'Mon to Fri: 9:00 AM - 6:00 PM',
        address: settingsData.address || 'F-8 Markaz, Islamabad, Pakistan',
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

  if (isLoading) {
    return <div className="p-8 text-center text-surface-500">Loading store settings...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Hero Banner Section */}
      <HeroBannerManager />

      {/* Homepage Appearance */}
      <div className="rounded-2xl border border-surface-300 bg-white p-5 shadow-soft">
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
                  className={`h-9 w-14 rounded-full text-sm font-bold transition-all ${
                    form.homepageGridCols === cols
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
      <div className="rounded-2xl border border-surface-300 bg-white p-5 shadow-soft">
        <h2 className="text-xl font-bold text-surface-950 mb-1">Store Contact Information & Policies</h2>
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
                Operating Days & Hours
              </label>
              <input
                type="text"
                value={form.operatingDays}
                onChange={(e) => setForm({ ...form, operatingDays: e.target.value })}
                placeholder="e.g. Mon to Fri: 9:00 AM - 6:00 PM"
                className="w-full rounded-xl border border-surface-300 px-3.5 py-2.5 text-sm font-medium focus:border-black outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-surface-200">
            <h3 className="text-lg font-bold text-surface-950 mb-1">Customer Care Policies</h3>
            <p className="text-xs text-surface-500 mb-4">
              Enter custom policy text overrides or leave blank to use standard default guidelines.
            </p>

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
                  Exchange & Return Policy Content
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

