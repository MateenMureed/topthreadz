'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { useHydration } from '@/hooks/useHydration';
import api from '@/services/api';
import { productService } from '@/services/product.service';
import { FormattedProductDescription } from '@/components/ProductDetailClient';
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
  FiCreditCard,
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
  category: string;
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
  category: 'Unstitched',
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

const STITCHED_SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL'];
const TWO_PIECE_SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL', 'Standard Fit'];
const UNSTITCHED_SIZE_OPTIONS = ['4.5 Meters', '7 Meters', '4 Meters', '5 Meters', 'Standard (4.5M)'];

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
  if (status === 'DELIVERED') return 'badge-active';
  if (status === 'PAID') return 'bg-[#E2E8F4] text-[#0F1F3D] text-[12px] px-2.5 py-0.5 rounded-full font-medium';
  if (status === 'SHIPPED') return 'bg-[#FEF3C7] text-[#92400E] text-[12px] px-2.5 py-0.5 rounded-full font-medium';
  if (status === 'CANCELLED') return 'badge-danger';
  return 'badge-draft';
}

function splitCsv(text: string) {
  return text.split(',').map(v => v.trim()).filter(Boolean);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

const productStatusBadgeClass = (status?: string) => {
  if (status === 'PUBLISHED') return 'badge-active';
  if (status === 'HIDDEN') return 'badge-danger';
  return 'badge-draft';
};

const paymentStatusBadgeClass = (status?: string) => {
  if (status === 'VERIFIED') return 'badge-active';
  if (status === 'FAILED') return 'badge-danger';
  return 'bg-[#FEF3C7] text-[#92400E] text-[12px] px-2.5 py-0.5 rounded-full font-medium';
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
        <h1 className="font-display text-2xl font-bold mb-4 text-[#0F1F3D]">Access Denied</h1>
        <p className="text-surface-500">Admin access required</p>
      </div>
    );
  }

  const tabs = [
    { key: 'dashboard', label: 'Home', icon: FiBarChart2 },
    { key: 'orders', label: 'Orders', icon: FiShoppingCart },
    { key: 'products', label: 'Products', icon: FiPackage },
    { key: 'users', label: 'Customers', icon: FiUsers },
    { key: 'payments', label: 'Payments', icon: FiCreditCard },
    { key: 'settings', label: 'Settings', icon: FiSettings },
  ] as const;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* ── TOP ADMIN HEADER BAR ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] px-4 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="mx-auto max-w-[1440px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-display font-black text-lg tracking-wider text-[#0F1F3D]">
                TOP THREADZ
              </span>
              <span className="rounded-md bg-[#0F1F3D] text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                Admin
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="admin-btn-secondary"
            >
              <FiEye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Storefront</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#E5E7EB]">
              <div className="w-7 h-7 rounded-full bg-[#0F1F3D] text-white flex items-center justify-center text-xs font-bold">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[#1A1A1A] leading-none">{user?.name || 'Administrator'}</p>
                <p className="text-[10px] text-[#6B7280] font-medium">{user?.email || 'admin@topthreadz.pk'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="admin-btn-destructive"
              title="Sign out of Admin"
            >
              <FiLogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-5 px-3 py-4 lg:grid-cols-[240px_1fr] lg:px-5 lg:py-5">
        {/* ── SIDEBAR NAV (Shopify-Style Navy with Red Active Indicator) ── */}
        <aside className="hidden h-fit rounded-[10px] bg-[#0F1F3D] p-3 shadow-md lg:sticky lg:top-16 lg:block text-white">
          <div className="px-3 py-2.5 mb-1 border-b border-white/10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">Navigation</p>
            <p className="mt-0.5 text-base font-bold text-white">Management Hub</p>
          </div>
          <nav className="mt-2 space-y-1">
            {tabs.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex w-full items-center gap-3 rounded-[8px] px-3 py-2 text-left text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[#1A2F5A] text-white border-l-[3px] border-[#B91C2B] font-semibold pl-2.5 shadow-xs'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <tab.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-white/60'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="mt-4 border-t border-white/10 pt-3">
            <button
              onClick={handleLogout}
              className="w-full flex h-[36px] items-center justify-center gap-2 rounded-[8px] bg-white/10 text-white/90 hover:bg-[#B91C2B] hover:text-white transition-all text-xs font-semibold"
            >
              <FiLogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="mb-4 admin-card">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold tracking-wide text-[#6B7280]">Admin Workspace</p>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1A1A1A]">Operations Command Center</h1>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <button className="admin-btn-secondary" onClick={() => toast.success('Export tools are ready for order and catalog reports.')}>
                  <FiDownload className="mr-1 inline w-3.5 h-3.5" /> Export
                </button>
                <button
                  className={`admin-btn-secondary ${activeTab === 'settings' ? '!bg-[#0F1F3D] !text-white' : ''}`}
                  onClick={() => setActiveTab('settings')}
                >
                  <FiSettings className="mr-1 inline w-3.5 h-3.5" /> Settings
                </button>
              </div>
            </div>
            {/* Mobile Tab Switcher */}
            <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-[#F3F4F6] p-1 lg:hidden">
              {tabs.map(tab => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex h-[36px] items-center justify-center gap-1.5 rounded-[6px] px-2 py-1 text-xs font-medium transition-all ${
                      isActive ? 'bg-white text-[#0F1F3D] shadow-xs font-semibold' : 'text-[#6B7280] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
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
  const [bannerText, setBannerText] = useState({
    heading: 'Shop Our Newest Collection',
    subheading: 'PREMIUM WASH & WEAR • SHOP OUR COLLECTION',
    buttonText: 'Shop Now',
    buttonLink: '/products'
  });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      api.get('/settings/hero-banner'),
      api.get('/settings/hero-banner-text')
    ])
      .then(([bannerRes, textRes]) => {
        const bannerData = bannerRes.data?.data;
        if (bannerData?.url) setCurrentBanner(bannerData.url);
        
        const textData = textRes.data?.data;
        if (textData) {
          setBannerText({
            heading: textData.heading || 'Shop Our Newest Collection',
            subheading: textData.subheading || 'PREMIUM WASH & WEAR • SHOP OUR COLLECTION',
            buttonText: textData.buttonText || 'Shop Now',
            buttonLink: textData.buttonLink || '/products'
          });
        }
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

  const handleSaveText = async () => {
    try {
      await api.post('/settings/hero-banner-text', bannerText);
      toast.success('Banner text updated successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update banner text');
    }
  };

  const renderBannerPreview = () => {
    if (!currentBanner) return null;

    return (
      <div className="rounded-xl border border-surface-200 bg-surface-50 p-3">
        <p className="text-xs font-semibold text-surface-600 mb-3">Active hero preview</p>
        
        <div className="relative w-full overflow-hidden rounded-lg border border-surface-300 bg-black min-h-[220px] sm:min-h-[280px] md:min-h-[340px] lg:min-h-[400px] max-h-[60vh]">
          <img 
            src={resolveImageUrl(currentBanner)} 
            alt="Hero Banner Preview" 
            className="absolute inset-0 h-full w-full object-contain object-center"
            onError={(e) => {
              console.error('Banner image failed to load:', currentBanner);
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = 'absolute inset-0 flex items-center justify-center text-white text-sm';
                fallback.textContent = '⚠️ Image failed to load. Please check the URL or upload a new image.';
                parent.appendChild(fallback);
              }
            }}
          />
          
          <div className="absolute inset-0 flex flex-col items-start justify-center px-6 sm:px-10 md:px-16 lg:px-20 pointer-events-none">
            <div className="pointer-events-auto">
              <span className="inline-block text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-white/80 bg-black/30 px-3 py-1 rounded-full mb-3">
                {bannerText.subheading || 'NEWEST COLLECTION'}
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight max-w-2xl drop-shadow-lg">
                {bannerText.heading || 'Shop Our Newest Collection'}
              </h1>
              <button className="mt-4 sm:mt-6 px-6 sm:px-8 py-2.5 sm:py-3 bg-white text-[#0F1F3D] font-semibold text-sm sm:text-base rounded-full hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                {bannerText.buttonText || 'Shop Now'}
              </button>
            </div>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent pointer-events-none" />
        </div>
        
        <p className="text-[10px] text-surface-400 mt-2 text-center">
          Banner scales automatically on all devices • Recommended: 1920 × 800 px
        </p>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-surface-300 bg-white p-3 sm:p-4 lg:p-5 shadow-soft space-y-6">
      {/* Banner Image Section */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold text-surface-950">Homepage Hero Banner</h3>
            <p className="text-xs text-surface-500">
              Upload an image file or paste a direct image URL. Recommended size: <strong>1920 × 800 px</strong> (or 16:9 / 21:9 wide format).
            </p>
          </div>
          {currentBanner && (
            <button onClick={handleClear} className="btn-secondary !py-1.5 !px-3 text-xs text-red-600 border-red-200 hover:bg-red-50">
              Remove Banner
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <div>
            <label className="text-xs font-semibold text-surface-700 block mb-1">Upload image file</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="input-field w-full file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface-100 file:text-surface-700"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-surface-700 block mb-1">Or use an image URL</label>
            <input
              type="url"
              placeholder="Paste image URL (e.g. https://...)"
              value={directUrl}
              onChange={(e) => setDirectUrl(e.target.value)}
              className="input-field w-full"
            />
          </div>
        </div>

        <div className="flex justify-stretch sm:justify-end mt-3">
          <button onClick={handleUpload} disabled={uploading} className="btn-primary min-h-11 w-full sm:w-auto !py-2.5 !px-6 text-sm disabled:opacity-60">
            {uploading ? 'Updating Banner…' : 'Save Hero Banner'}
          </button>
        </div>
      </div>

      {/* Banner Text Overlay Settings */}
      <div className="border-t border-surface-200 pt-4">
        <h4 className="text-sm font-semibold text-surface-950 mb-3">Banner Text Overlay</h4>
        <p className="text-xs text-surface-500 mb-3">
          Customize the text that appears on top of your hero banner image.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-surface-700 block mb-1">Heading Text</label>
            <input
              type="text"
              value={bannerText.heading}
              onChange={(e) => setBannerText(prev => ({ ...prev, heading: e.target.value }))}
              placeholder="e.g. Shop Our Newest Collection"
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-surface-700 block mb-1">Subheading Text</label>
            <input
              type="text"
              value={bannerText.subheading}
              onChange={(e) => setBannerText(prev => ({ ...prev, subheading: e.target.value }))}
              placeholder="e.g. PREMIUM WASH & WEAR"
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-surface-700 block mb-1">Button Text</label>
            <input
              type="text"
              value={bannerText.buttonText}
              onChange={(e) => setBannerText(prev => ({ ...prev, buttonText: e.target.value }))}
              placeholder="e.g. Shop Now"
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-surface-700 block mb-1">Button Link</label>
            <input
              type="text"
              value={bannerText.buttonLink}
              onChange={(e) => setBannerText(prev => ({ ...prev, buttonLink: e.target.value }))}
              placeholder="e.g. /products"
              className="input-field w-full"
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-3">
          <button onClick={handleSaveText} className="admin-btn-secondary">
            Save Text Settings
          </button>
        </div>
      </div>

      {/* Banner Preview with Overlay */}
      {renderBannerPreview()}
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
    { label: 'Pending Payments', value: stats?.pendingPayments || 0, icon: FiCreditCard, color: 'bg-red-50 text-red-600' },
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
              <FiCreditCard className="mx-auto mb-1 h-4 w-4" /> Payments
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-3">
        {cards.map((card, i) => (
          <div key={i} className="rounded-2xl border border-surface-300 bg-white p-5 shadow-soft">
            <div className={`h-10 w-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
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
  const [customColorInput, setCustomColorInput] = useState('');
  const descriptionEditorRef = useRef<HTMLDivElement | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyProductForm);
  const { data: categoryResponse } = useQuery({ queryKey: ['admin-categories'], queryFn: () => api.get('/categories').then(r => r.data) });
  const categories = Array.isArray(categoryResponse?.data) ? categoryResponse.data : [];

  const colorList = splitCsv(form.colorsText);
  const subcategoryOptions = ['Summer Collection', 'Winter Collection', 'Wedding', 'Formal', 'Semi-Formal', 'Casual', 'Office Wear', 'Festive Wear', 'Jummah Collection', 'Traditional'];
  const collectionOptions = ['Summer Collection', 'Winter Collection', 'Eid Collection', 'Azaadi Sale', 'Wedding Collection', 'Festive Collection', 'Jummah Special', 'New Arrivals', 'Clearance Sale'];

  const previewPrice = Number(form.price || 0);
  const previewDiscount = Number(form.discount || 0);
  const previewSalePrice = previewPrice > 0 && previewDiscount > 0
    ? Math.round(previewPrice * (1 - previewDiscount / 100))
    : previewPrice;

  const previewTitle = form.name.trim() || 'Product Name Preview';
  const isStitched = form.category.toLowerCase().trim() === 'stitched';
  const previewCategory = [form.category, form.subcategory].filter(Boolean).join(' / ');

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



  const { data, error, isError, isLoading, isFetching, refetch } = useQuery({
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

  const products = Array.isArray(data?.data?.products) ? data.data.products : [];
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
      category: product.category || 'Unstitched',
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
      sizesText: asStringArray(product.sizes).join(', '),
      colorsText: asStringArray(product.colors).join(', '),
      tagsText: asStringArray(product.tags).join(', '),
      collection: product.collection || '',
      careInstructions: product.careInstructions || '',
      featured: Boolean(product.featured),
      trending: Boolean(product.trending),
      productStatus: product.productStatus || 'DRAFT',
      images: asStringArray(product.images),
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
    const descriptionText = form.description.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
    const price = Number(form.price);
    const discount = Number(form.discount || 0);
    const stock = Number(form.stock);

    if (form.name.trim().length < 2) nextErrors.name = 'Product name must be at least 2 characters';
    if (descriptionText.length < 10) nextErrors.description = 'Product description must be at least 10 characters';
    if (!form.category.trim()) nextErrors.category = 'Category is required';
    if (!Number.isFinite(price) || price <= 0) nextErrors.price = 'Regular price must be greater than zero';
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) nextErrors.discount = 'Discount must be between 0 and 100';
    if (!Number.isInteger(stock) || stock < 0) nextErrors.stock = 'Stock quantity must be a whole number of zero or more';
    if (form.images.length === 0) nextErrors.images = 'Upload at least one image';
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAddCustomColor = () => {
    const val = customColorInput.trim();
    if (!val) return;
    const next = Array.from(new Set([...colorList, val]));
    setForm((prev) => ({ ...prev, colorsText: next.join(', ') }));
    setCustomColorInput('');
  };

  const handleToggleSize = (size: string) => {
    const currentSizes = splitCsv(form.sizesText);
    let nextSizes: string[];
    if (currentSizes.includes(size)) {
      nextSizes = currentSizes.filter((s) => s !== size);
    } else {
      nextSizes = [...currentSizes, size];
    }
    setForm((prev) => ({ ...prev, sizesText: nextSizes.join(', ') }));
  };

  const isTwoPieceCategory = /two\s*piece|2\s*piece/i.test(form.category);
  const isUnstitchedCategory = /unstitched/i.test(form.category);
  const activeCategorySizes = isTwoPieceCategory
    ? TWO_PIECE_SIZE_OPTIONS
    : isUnstitchedCategory
    ? UNSTITCHED_SIZE_OPTIONS
    : STITCHED_SIZE_OPTIONS;

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
    generatedTags.push('gender:male', isStitched ? 'stitched' : 'unstitched');
    if (form.featured) generatedTags.push('featured');
    if (form.trending) generatedTags.push('trending');

    const defaultSizesForCat = isTwoPieceCategory
      ? TWO_PIECE_SIZE_OPTIONS
      : isUnstitchedCategory
      ? UNSTITCHED_SIZE_OPTIONS
      : STITCHED_SIZE_OPTIONS;

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim(),
      category: form.category || 'Unstitched',
      subcategory: form.subcategory.trim() || undefined,
      brand: 'Top Threadz',
      price: regularPrice,
      discount: discountPercent,
      stock: Number(form.stock || 0),
      stockStatus: form.stockStatus,
      lowStockThreshold: Number(form.lowStockThreshold || 0),
      sku: form.sku.trim() || undefined,
      sizes: splitCsv(form.sizesText).length ? splitCsv(form.sizesText) : defaultSizesForCat,
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
          <h2 className="text-xl font-bold text-[#0F1F3D]">Products</h2>
          <p className="text-sm text-[#6B7280]">Manage clothing items, stock, pricing, and catalog merchandising.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const confirmed = window.confirm("Clean stale cart/search/view data and delete legacy non-unstitched products? Orders, payments, users, and current men's unstitched products will be kept.");
              if (confirmed) cleanupLegacyData.mutate();
            }}
            className="admin-btn-secondary"
          >
            Clean Legacy Data
          </button>
          <button onClick={openCreateInlineForm} className="admin-btn-primary">
            <FiPlus className="inline w-3.5 h-3.5" /> Add Product
          </button>
        </div>
      </div>

      {isError && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] p-4 text-sm text-[#B91C2B]">
          <p>{(error as any)?.response?.data?.error || 'Products could not be loaded. Please try again.'}</p>
          <button type="button" onClick={() => refetch()} className="admin-btn-secondary" disabled={isFetching}>
            {isFetching ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}

      {showInlineForm && (
        <div className="mb-6 rounded-[10px] border border-[#E5E7EB] bg-white p-4 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E5E7EB]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Product Editor</p>
              <h2 className="text-xl font-bold text-[#0F1F3D]">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
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
              className="admin-btn-secondary"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-5">
              {/* 1. Basic Information Panel */}
              <section className="space-y-4 rounded-[10px] border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between gap-2 border-b border-[#E5E7EB] pb-2">
                  <h3 className="text-sm font-bold text-[#0F1F3D] uppercase tracking-wide">1. Basic Information</h3>
                  <button type="button" onClick={autofillBasicWithAi} className="text-xs text-[#0F1F3D] font-bold hover:underline">
                    ⚡ Auto-Generate Description
                  </button>
                </div>

                <div>
                  <label className="admin-label">Product Name *</label>
                  <input
                    className="admin-input"
                    placeholder="e.g. Premium White Wash & Wear Suit"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  {formErrors.name && <p className="text-xs text-[#B91C2B] mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="admin-label">Product Description (Rich Text) *</label>
                  <div className="border border-[#D1D5DB] rounded-[8px] overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-[#E5E7EB] p-2 bg-[#F9FAFB]">
                      <button type="button" onClick={() => applyRichText('bold')} className="admin-btn-secondary !h-7 !py-0 !px-2 text-xs font-bold">B</button>
                      <button type="button" onClick={() => applyRichText('italic')} className="admin-btn-secondary !h-7 !py-0 !px-2 text-xs italic">I</button>
                      <button type="button" onClick={() => applyRichText('insertUnorderedList')} className="admin-btn-secondary !h-7 !py-0 !px-2 text-xs">• List</button>
                    </div>
                    <div
                      ref={descriptionEditorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) => {
                        const html = (e.currentTarget as HTMLDivElement).innerHTML;
                        setForm((prev) => ({ ...prev, description: html }));
                      }}
                      className="min-h-32 p-3 text-sm outline-none bg-white"
                    />
                  </div>
                  {formErrors.description && <p className="text-xs text-[#B91C2B] mt-1">{formErrors.description}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="admin-label">Category *</label>
                    <select
                      className="admin-input"
                      value={form.category}
                      onChange={(e) => {
                        const cat = e.target.value;
                        const isTwoPiece = /two\s*piece|2\s*piece/i.test(cat);
                        const isUnstitched = /unstitched/i.test(cat);
                        const defaultSizes = isTwoPiece
                          ? TWO_PIECE_SIZE_OPTIONS.join(', ')
                          : isUnstitched
                          ? UNSTITCHED_SIZE_OPTIONS.join(', ')
                          : STITCHED_SIZE_OPTIONS.join(', ');
                        setForm((prev) => ({ ...prev, category: cat, sizesText: prev.sizesText || defaultSizes }));
                      }}
                    >
                      <option value="Unstitched">Unstitched</option>
                      <option value="Stitched">Stitched</option>
                      <option value="Two Piece">Two Piece</option>
                      <option value="Kurta">Kurta</option>
                      <option value="Boski">Boski</option>
                      <option value="Kids">Kids</option>
                      {categories.map((c: any) => (
                        !['Unstitched', 'Stitched', 'Two Piece', 'Kurta', 'Boski', 'Kids'].includes(c.name) ? (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ) : null
                      ))}
                    </select>
                    {formErrors.category && <p className="text-xs text-[#B91C2B] mt-1">{formErrors.category}</p>}
                  </div>

                  <div>
                    <label className="admin-label">Collection / Season</label>
                    <select
                      className="admin-input"
                      value={form.collection}
                      onChange={(e) => setForm((prev) => ({ ...prev, collection: e.target.value }))}
                    >
                      <option value="">No Collection</option>
                      {collectionOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="admin-label">Product Slug</label>
                    <input
                      className="admin-input"
                      value={form.slug}
                      onChange={(e) => {
                        setIsSlugEditedManually(true);
                        setForm((prev) => ({ ...prev, slug: makeSlug(e.target.value) }));
                      }}
                      placeholder="e.g. premium-white-suit"
                    />
                  </div>

                  <div>
                    <label className="admin-label">Tags (comma-separated)</label>
                    <input
                      className="admin-input"
                      value={form.tagsText}
                      onChange={(e) => setForm((prev) => ({ ...prev, tagsText: e.target.value }))}
                      placeholder="e.g. summer, wash and wear, luxury"
                    />
                  </div>
                </div>
              </section>

              {/* 2. Pricing & Inventory (Unified Single Panel) */}
              <section className="space-y-4 rounded-[10px] border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <h3 className="text-sm font-bold text-[#0F1F3D] uppercase tracking-wide border-b border-[#E5E7EB] pb-2">
                  2. Pricing & Inventory
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="admin-label">Regular Price (PKR) *</label>
                    <input
                      className="admin-input"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="e.g. 4500"
                      value={form.price}
                      onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                    />
                    {formErrors.price && <p className="text-xs text-[#B91C2B] mt-1">{formErrors.price}</p>}
                  </div>

                  <div>
                    <label className="admin-label">Discount (%)</label>
                    <input
                      className="admin-input"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="e.g. 15"
                      value={form.discount}
                      onChange={(e) => setForm((prev) => ({ ...prev, discount: e.target.value }))}
                    />
                    {formErrors.discount && <p className="text-xs text-[#B91C2B] mt-1">{formErrors.discount}</p>}
                  </div>

                  <div>
                    <label className="admin-label">Effective Price (PKR)</label>
                    <div className="h-10 px-3 flex items-center bg-[#F9FAFB] border border-[#D1D5DB] rounded-[8px] text-sm font-bold text-[#1A1A1A]">
                      PKR {previewSalePrice.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <label className="admin-label">Stock Quantity *</label>
                    <input
                      className="admin-input"
                      type="number"
                      min="0"
                      placeholder="e.g. 50"
                      value={form.stock}
                      onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                    />
                    {formErrors.stock && <p className="text-xs text-[#B91C2B] mt-1">{formErrors.stock}</p>}
                  </div>

                  <div>
                    <label className="admin-label">Stock Status</label>
                    <select
                      className="admin-input"
                      value={form.stockStatus}
                      onChange={(e) => setForm((prev) => ({ ...prev, stockStatus: e.target.value as ProductFormState['stockStatus'] }))}
                    >
                      <option value="IN_STOCK">In Stock</option>
                      <option value="OUT_OF_STOCK">Out of Stock</option>
                      <option value="PREORDER">Preorder</option>
                    </select>
                  </div>

                  <div>
                    <label className="admin-label">SKU (Auto)</label>
                    <input
                      className="admin-input bg-[#F9FAFB]"
                      value={form.sku}
                      onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                      placeholder="TT-PROD-001"
                    />
                  </div>
                </div>
              </section>

              {/* 3. Variants: Sizes & Colors */}
              <section className="space-y-4 rounded-[10px] border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <h3 className="text-sm font-bold text-[#0F1F3D] uppercase tracking-wide border-b border-[#E5E7EB] pb-2">
                  3. Variants (Sizes & Colors)
                </h3>

                {/* Size Presets based on Category */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="admin-label !mb-0">
                      Available Sizes ({isTwoPieceCategory ? 'Two Piece Sizes' : isUnstitchedCategory ? 'Fabric Lengths' : 'Garment Sizes'})
                    </label>
                    <span className="text-xs text-[#6B7280]">Click chip to toggle</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {activeCategorySizes.map((size) => {
                      const isSelected = splitCsv(form.sizesText).includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleToggleSize(size)}
                          className={`px-3 py-1 rounded-[6px] text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-[#0F1F3D] text-white shadow-xs'
                              : 'bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB] hover:bg-[#E5E7EB]'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}{size}
                        </button>
                      );
                    })}
                  </div>

                  <input
                    className="admin-input"
                    value={form.sizesText}
                    onChange={(e) => setForm((prev) => ({ ...prev, sizesText: e.target.value }))}
                    placeholder="e.g. S, M, L, XL or 4.5 Meters, 7 Meters"
                  />
                </div>

                {/* Add Color Option */}
                <div className="pt-2 border-t border-[#E5E7EB]">
                  <label className="admin-label">Add Colors</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="admin-input flex-1"
                      placeholder="Type a color (e.g. Navy Blue, Off White) and press Enter"
                      value={customColorInput}
                      onChange={(e) => setCustomColorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomColor();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomColor}
                      className="admin-btn-primary shrink-0"
                    >
                      + Add Color
                    </button>
                  </div>

                  {/* Popular color suggestion chips */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[11px] text-[#6B7280] font-medium mr-1">Quick Add:</span>
                    {COLOR_PRESET_OPTIONS.slice(0, 10).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          const next = Array.from(new Set([...colorList, color]));
                          setForm((prev) => ({ ...prev, colorsText: next.join(', ') }));
                        }}
                        className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F3F4F6] hover:bg-[#0F1F3D] hover:text-white transition-all text-[#374151]"
                      >
                        + {color}
                      </button>
                    ))}
                  </div>

                  {/* Selected Colors List */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {colorList.length === 0 ? (
                      <p className="text-xs text-[#6B7280]">No colors added yet.</p>
                    ) : (
                      colorList.map((color) => (
                        <span
                          key={color}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E2E8F4] text-[#0F1F3D] text-xs font-semibold"
                        >
                          {color}
                          <button
                            type="button"
                            onClick={() => removeColor(color)}
                            className="hover:text-[#B91C2B] font-bold"
                            title="Remove color"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </section>

              {/* 4. Product Images */}
              <section className="space-y-4 rounded-[10px] border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-2">
                  <h3 className="text-sm font-bold text-[#0F1F3D] uppercase tracking-wide">4. Product Images</h3>
                  <label className="admin-btn-secondary cursor-pointer inline-flex items-center gap-1 shrink-0">
                    <FiUpload className="w-3.5 h-3.5" />
                    {uploadingImages ? 'Uploading...' : 'Upload Image File(s)'}
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploadingImages} />
                  </label>
                </div>

                <div className="flex gap-2 items-center">
                  <input
                    type="url"
                    placeholder="Or paste direct image URL (e.g. https://...)"
                    value={directImageUrl}
                    onChange={(e) => setDirectImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImageUrl();
                      }
                    }}
                    className="admin-input flex-1"
                  />
                  <button type="button" onClick={handleAddImageUrl} className="admin-btn-secondary shrink-0">
                    + Add URL
                  </button>
                </div>
                {formErrors.images && <p className="text-xs text-[#B91C2B]">{formErrors.images}</p>}

                {form.images.length === 0 ? (
                  <div className="rounded-[8px] border border-dashed border-[#D1D5DB] p-6 text-center text-xs text-[#6B7280]">
                    No images uploaded yet. Upload high resolution files or paste image URLs.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {form.images.map((img, index) => {
                      const meta = imageMeta.find((item) => item.url === img);
                      return (
                        <div key={img} className="rounded-[8px] border border-[#E5E7EB] p-2 bg-[#FAFAF8]">
                          <div className="flex flex-col sm:flex-row gap-3 items-center">
                            <AdminImage src={img} alt={meta?.alt || 'Product image'} className="w-20 h-20 object-cover rounded-[6px] border border-[#E5E7EB] bg-white" />
                            <div className="flex-1 space-y-2 w-full">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPrimaryImage(img)}
                                  className={`admin-btn-secondary !h-7 !py-0 !px-2.5 text-xs ${
                                    meta?.isPrimary ? '!bg-[#DCFCE7] !text-[#16A34A] !border-[#16A34A]' : ''
                                  }`}
                                >
                                  <FiStar className="inline mr-1" /> {meta?.isPrimary ? 'Primary Image' : 'Set Primary'}
                                </button>
                                <button type="button" className="admin-btn-secondary !h-7 !py-0 !px-2 text-xs" onClick={() => index > 0 && moveImage(index, index - 1)}>
                                  <FiArrowUp className="inline" />
                                </button>
                                <button type="button" className="admin-btn-secondary !h-7 !py-0 !px-2 text-xs" onClick={() => index < form.images.length - 1 && moveImage(index, index + 1)}>
                                  <FiArrowDown className="inline" />
                                </button>
                                <button type="button" className="admin-btn-destructive !h-7 !py-0 !px-2 text-xs" onClick={() => removeUploadedImage(img)}>
                                  <FiTrash2 className="inline" />
                                </button>
                              </div>
                              <input
                                className="admin-input !h-8 text-xs"
                                placeholder="Alt text for SEO (e.g. Men's white unstitched suit)"
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

              {/* 5. Status & Visibility & Merchandising */}
              <section className="space-y-4 rounded-[10px] border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <h3 className="text-sm font-bold text-[#0F1F3D] uppercase tracking-wide border-b border-[#E5E7EB] pb-2">
                  5. Merchandising & Visibility
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
                      className="w-4 h-4 rounded text-[#0F1F3D] focus:ring-[#0F1F3D]"
                    />
                    ⭐ Featured Product (Show in Featured List)
                  </label>

                  <label className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.trending}
                      onChange={(e) => setForm((prev) => ({ ...prev, trending: e.target.checked }))}
                      className="w-4 h-4 rounded text-[#B91C2B] focus:ring-[#B91C2B]"
                    />
                    🔥 Trending / New Arrival (Show on Homepage)
                  </label>

                  <div>
                    <label className="admin-label">Product Status</label>
                    <select
                      className="admin-input"
                      value={form.productStatus}
                      onChange={(e) => setForm((prev) => ({ ...prev, productStatus: e.target.value as ProductFormState['productStatus'] }))}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="HIDDEN">Hidden</option>
                    </select>
                  </div>

                  <div>
                    <label className="admin-label">Care Instructions</label>
                    <input
                      className="admin-input"
                      placeholder="e.g. Hand wash in cold water, do not bleach"
                      value={form.careInstructions}
                      onChange={(e) => setForm((prev) => ({ ...prev, careInstructions: e.target.value }))}
                    />
                  </div>
                </div>
              </section>

              {/* Form Action Buttons */}
              <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowInlineForm(false);
                    setEditingProduct(null);
                  }}
                  className="admin-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary !h-10 !px-6 text-sm"
                  disabled={createProduct.isPending || updateProduct.isPending}
                >
                  {editingProduct
                    ? updateProduct.isPending ? 'Saving Changes...' : 'Update Product'
                    : createProduct.isPending ? 'Creating Product...' : 'Publish Product'}
                </button>
              </div>
            </div>

            {/* Sidebar Preview */}
            <div className="xl:col-span-1">
              <div className="sticky top-20 space-y-4">
                <div className="admin-card space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Storefront Card Preview</p>
                  <div className="rounded-[10px] overflow-hidden border border-[#E5E7EB] bg-white">
                    <div className="relative aspect-[4/5] bg-[#F9FAFB] overflow-hidden">
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

      {/* Summary Metric Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Published', value: publishedCount, icon: FiEye, tone: 'bg-[#DCFCE7] text-[#16A34A]' },
          { label: 'Drafts', value: draftCount, icon: FiEdit2, tone: 'bg-[#FEF3C7] text-[#D97706]' },
          { label: 'Low Stock', value: lowStockCount, icon: FiAlertTriangle, tone: 'bg-[#FFEDD5] text-[#EA580C]' },
          { label: 'Out of Stock', value: outOfStockCount, icon: FiX, tone: 'bg-[#FEE2E2] text-[#B91C2B]' },
        ].map((metric) => (
          <div key={metric.label} className="rounded-[10px] border border-[#E5E7EB] bg-white p-4 shadow-xs">
            <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md ${metric.tone}`}>
              <metric.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-black text-[#1A1A1A]">{metric.value}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Search and Filters Bar */}
      <div className="mb-4 rounded-[10px] border border-[#E5E7EB] bg-white p-3 shadow-xs">
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_180px_160px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              className="admin-input !pl-9"
              placeholder="Search products by name, SKU, or category..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
          </div>
          <select className="admin-input" value={productStatusFilter} onChange={(e) => setProductStatusFilter(e.target.value as typeof productStatusFilter)}>
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="HIDDEN">Hidden</option>
          </select>
          <select className="admin-input" value={stockView} onChange={(e) => setStockView(e.target.value as typeof stockView)}>
            <option value="ALL">All Stock</option>
            <option value="LOW">Low Stock</option>
            <option value="OUT">Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white shadow-xs">
        <div className="border-b border-[#E5E7EB] px-4 py-3 bg-[#F9FAFB]">
          <p className="text-sm font-bold text-[#0F1F3D]">{filteredProducts.length} Product(s)</p>
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
                  {asStringArray(p.colors).slice(0, 4).map((color) => (
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
              <p><span className="font-semibold">Sizes:</span> {asStringArray(detailsProduct.sizes).join(', ') || 'N/A'}</p>
              <p><span className="font-semibold">Colors:</span> {asStringArray(detailsProduct.colors).join(', ') || 'N/A'}</p>
              <p><span className="font-semibold">Tags:</span> {asStringArray(detailsProduct.tags).join(', ') || 'N/A'}</p>
              <div>
                <p className="font-semibold mb-1">Description:</p>
                <FormattedProductDescription content={detailsProduct.description} />
              </div>
              <div>
                <p className="font-semibold mb-1">Images:</p>
                <div className="space-y-1">
                  {asStringArray(detailsProduct.images).length === 0 && <p className="text-surface-500">No images</p>}
                  {asStringArray(detailsProduct.images).map((img, idx) => (
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
          <FiCreditCard className="mb-3 h-4 w-4 text-surface-500" />
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
        operatingDays: settingsData.operatingDays || 'Mon to Fri: 9:00 AM - 6:00 PM',
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

  if (isLoading) {
    return <div className="p-8 text-center text-surface-500">Loading store settings...</div>;
  }

  return (
    <div className="space-y-8">
      <CategoriesManager />
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

            <div>
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
                Primary Store & Outlet Address
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

function CategoriesManager() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/categories?all=true').then(r => r.data)
  });

  const [name, setName] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Edit state
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editCoverImage, setEditCoverImage] = useState('');
  const [isEditUploading, setIsEditUploading] = useState(false);

  const categories = data?.data || [];

  const handleFileUpload = async (file: File, isEdit = false) => {
    const setter = isEdit ? setEditCoverImage : setCoverImage;
    const loader = isEdit ? setIsEditUploading : setIsUploading;

    try {
      loader(true);
      const formData = new FormData();
      formData.append('images', file);
      const res = await api.post('/products/upload-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.urls?.[0] || res.data?.data?.images?.[0]?.url;
      if (url) {
        setter(url);
        toast.success('Category image uploaded');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error uploading image');
    } finally {
      loader(false);
    }
  };

  const create = useMutation({
    mutationFn: () =>
      api.post('/categories', {
        name: name.trim(),
        coverImage: coverImage.trim() || undefined,
        sortOrder: categories.length,
      }),
    onSuccess: () => {
      setName('');
      setCoverImage('');
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['home', 'categories'] });
      toast.success('Category created successfully');
    },
    onError: (err: any) => {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.message ||
        (status === 401 || status === 403
          ? 'Admin session expired. Please log in again.'
          : 'Could not create category. Ensure database migrations have been applied.');
      toast.error(message);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/categories/${id}`, data),
    onSuccess: () => {
      setEditingCategory(null);
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['home', 'categories'] });
      toast.success('Category updated successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update category');
    },
  });

  const toggle = useMutation({
    mutationFn: (c: any) => api.patch(`/categories/${c.id}`, { isActive: !c.isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['home', 'categories'] });
    },
  });

  const deleteCat = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['home', 'categories'] });
      toast.success('Category deleted');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete category');
    },
  });

  const startEdit = (c: any) => {
    setEditingCategory(c);
    setEditName(c.name);
    setEditCoverImage(c.rawCoverImage || '');
  };

  return (
    <div className="rounded-2xl border border-surface-300 bg-white p-5 shadow-soft">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-950">Homepage & Store Categories</h2>
          <p className="mt-1 text-sm text-surface-500">
            Create and manage clothing categories. If no category picture is uploaded, it automatically displays the latest product image of that category on the homepage.
          </p>
        </div>
      </div>

      {/* Create Form */}
      <div className="mb-8 rounded-xl border border-surface-200 bg-surface-50 p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-surface-700">Add New Category</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-surface-700">Category Name *</label>
            <input
              className="input-field w-full"
              placeholder="e.g. Waist Coats, Unstitched, Shawls..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-surface-700">
              Category Picture (Optional)
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                className="input-field flex-1 text-xs"
                placeholder="Paste Image URL or upload below..."
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
              />
              <label className="btn-secondary flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap !py-2 text-xs">
                <FiUpload className="h-4 w-4" />
                <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, false);
                  }}
                />
              </label>
              {coverImage && (
                <button
                  type="button"
                  onClick={() => setCoverImage('')}
                  className="btn-secondary !py-2 text-xs text-red-600 hover:bg-red-50"
                >
                  Clear Image
                </button>
              )}
            </div>

            {/* Preview */}
            {coverImage ? (
              <div className="mt-2 flex items-center gap-3">
                <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-surface-300">
                  <img src={coverImage} alt="Preview" className="h-full w-full object-cover" />
                </div>
                <span className="text-xs text-emerald-600 font-medium">✓ Custom category picture ready</span>
              </div>
            ) : (
              <p className="mt-1 text-[11px] text-surface-500 italic">
                ℹ️ No picture uploaded: Will automatically use the latest product photo from this category.
              </p>
            )}
          </div>

          <button
            className="btn-primary !py-2.5 text-xs font-bold uppercase tracking-wider"
            disabled={!name.trim() || create.isPending || isUploading}
            onClick={() => create.mutate()}
          >
            {create.isPending ? 'Adding Category...' : 'Add Category'}
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-surface-200">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-surface-950">Edit Category</h3>
              <button onClick={() => setEditingCategory(null)} className="text-surface-400 hover:text-surface-600">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-surface-700">Category Name</label>
                <input
                  className="input-field w-full"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-surface-700">
                  Category Picture (Cover Image)
                </label>
                <div className="flex flex-col gap-2">
                  <input
                    className="input-field w-full text-xs"
                    placeholder="Image URL..."
                    value={editCoverImage}
                    onChange={(e) => setEditCoverImage(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <label className="btn-secondary flex-1 flex cursor-pointer items-center justify-center gap-1.5 !py-2 text-xs">
                      <FiUpload className="h-4 w-4" />
                      <span>{isEditUploading ? 'Uploading...' : 'Upload New Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isEditUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, true);
                        }}
                      />
                    </label>
                    {editCoverImage && (
                      <button
                        type="button"
                        onClick={() => setEditCoverImage('')}
                        className="btn-secondary !py-2 text-xs text-red-600 hover:bg-red-50"
                      >
                        Remove Picture
                      </button>
                    )}
                  </div>
                </div>

                {editCoverImage ? (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-surface-300">
                      <img src={editCoverImage} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                    <span className="text-xs text-emerald-600 font-medium">Custom picture set</span>
                  </div>
                ) : (
                  <p className="mt-1 text-[11px] text-surface-500 italic">
                    ℹ️ Picture removed: Will automatically show latest product image.
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setEditingCategory(null)}
                  className="btn-secondary !py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  disabled={!editName.trim() || update.isPending || isEditUploading}
                  onClick={() =>
                    update.mutate({
                      id: editingCategory.id,
                      data: { name: editName.trim(), coverImage: editCoverImage },
                    })
                  }
                  className="btn-primary !py-2 text-xs font-bold uppercase tracking-wider"
                >
                  {update.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-surface-700">Existing Categories</h3>
        {isLoading ? (
          <p className="text-sm text-surface-500">Loading categories...</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-surface-500">No categories created yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {categories.map((c: any) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-surface-200 bg-white p-3 shadow-xs hover:border-surface-300 transition-colors"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-surface-200 bg-surface-100">
                    {c.coverImage ? (
                      <img src={c.coverImage} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-surface-400">
                        <FiPackage className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate font-bold text-surface-900 text-sm">{c.name}</h4>
                    <p className="text-[11px] text-surface-500">
                      {c.hasCustomImage ? (
                        <span className="text-emerald-700 font-medium">📷 Custom Picture</span>
                      ) : c.isFallbackImage ? (
                        <span className="text-amber-700 font-medium">✨ Auto (Latest Product Image)</span>
                      ) : (
                        <span className="text-surface-400">No image available</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    className={`btn-secondary !py-1 !px-2.5 text-[11px] font-semibold ${
                      c.isActive ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-surface-500'
                    }`}
                    onClick={() => toggle.mutate(c)}
                  >
                    {c.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => startEdit(c)}
                    className="p-1.5 text-surface-500 hover:text-surface-900 hover:bg-surface-100 rounded-lg transition-colors"
                    title="Edit Category"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete category "${c.name}"?`)) {
                        deleteCat.mutate(c.id);
                      }
                    }}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Category"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}