'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  FiHeart,
  FiLogOut,
  FiSearch,
  FiShoppingBag,
  FiTruck,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthModalStore } from '@/store/authModalStore';
import { productService } from '@/services/product.service';
import { authService } from '@/services/auth.service';
import { useHydration } from '@/hooks/useHydration';
import toast from 'react-hot-toast';

interface SearchProduct {
  id: string;
  name: string;
  price: number;
  discount?: number;
  images?: string[];
  category?: string;
  brand?: string;
}

const FAVORITE_BRANDS = [
  'Gul Ahmed', 'Alkaram Studio', 'Bonanza Satrangi', 'Junaid Jamshed (J.)', 'Khaadi',
  'Nishat Linen', 'Sapphire', 'Ideas by Gul Ahmed', 'Shaffer', 'Master Fabrics',
  'Pasha Fabrics', 'Dynasty Fabrics', 'Orient Textiles', 'Kamal Fabrics', 'JNG Fabrics',
  'Sheikh Gulzar Fabrics', 'Hilltop Fabrics', 'Alamgir Fabrics', 'Jeeva Textiles', 'Asco Fabrics',
  'Cambridge', 'Edenrobe', 'Diners', 'Zellbury', 'Saya', 'Bin Saeed', 'Firdous',
  'Al Zohaib', 'Resham Ghar', 'Narkins', 'Tawakkal Fabrics', 'Lawrencepur', 'Bareeze',
  'Istor', 'Moosa Jee', 'Kingdom Fabrics', 'Zain G Fabrics',
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydration();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { openCart, getItemCount } = useCartStore();
  const { openModal } = useAuthModalStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [brands, setBrands] = useState<string[]>([]);
  const [brandPage, setBrandPage] = useState(1);
  const [hasMoreBrands, setHasMoreBrands] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const brandsScrollRef = useRef<HTMLDivElement>(null);

  const fetchBrandPage = async (pageToLoad: number, reset = false) => {
    if (loadingBrands) return;

    try {
      setLoadingBrands(true);
      const response = await productService.getAll({ page: pageToLoad, limit: 24, sortBy: 'recommended' });
      const products = (response?.data?.products || response?.products || []) as SearchProduct[];
      const pagination = response?.data?.pagination || response?.pagination;

      const nextBrands = products
        .map((item) => String(item.brand || '').trim())
        .filter(Boolean);

      setBrands((prev) => {
        const merged = reset ? nextBrands : [...prev, ...nextBrands];
        return Array.from(new Set(merged));
      });

      const totalPages = Number(pagination?.totalPages || pageToLoad);
      setBrandPage(pageToLoad);
      setHasMoreBrands(pageToLoad < totalPages);
    } catch {
      if (reset) setBrands([]);
      setHasMoreBrands(false);
    } finally {
      setLoadingBrands(false);
    }
  };

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!searchPanelRef.current) return;
      if (!searchPanelRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const isAdmin = hydrated && isAuthenticated && user?.role === 'ADMIN';
  const isAuthed = hydrated && isAuthenticated;

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore API logout errors and clear state locally
    }
    logout();
    toast.success('Signed out successfully');
  };

  const handleOpenSearch = () => {
    setSearchOpen(true);
    if (brands.length === 0) {
      fetchBrandPage(1, true);
    }
  };

  const handleBrandsScroll = async () => {
    const container = brandsScrollRef.current;
    if (!container || !hasMoreBrands || loadingBrands) return;

    const nearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 24;
    if (nearBottom) {
      await fetchBrandPage(brandPage + 1);
    }
  };

  const itemCount = hydrated ? getItemCount() : 0;

  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-soft border-b border-surface-300'
            : 'bg-white border-b border-surface-300'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div />

            <Link href="/" className="inline-flex items-center justify-center group py-1" aria-label="Top Threadz Home">
              <span className="sr-only">Top Threadz</span>
              <div className="relative h-11 sm:h-12 md:h-14 w-36 sm:w-44 md:w-52 flex items-center justify-center">
                <Image
                  src="/images/topthreadz-logo.png"
                  alt="Top Threadz"
                  width={320}
                  height={140}
                  priority
                  className="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </Link>

            <div className="hidden lg:flex items-center justify-end gap-2">
              {isAuthed && !isAdmin ? (
                <Link
                  href="/orders"
                  className="w-10 h-10 rounded-full border border-surface-300 text-surface-800 hover:bg-surface-100 hover:text-navy transition-colors flex items-center justify-center"
                  aria-label="Track order"
                  title="Track orders"
                >
                  <FiTruck className="w-5 h-5" />
                </Link>
              ) : null}

              {isAuthed ? (
                <>
                  {isAdmin ? (
                    <Link
                      href="/admin"
                      className="h-10 rounded-xl border border-surface-300 px-4 text-sm font-semibold text-surface-800 hover:bg-surface-100 hover:text-navy transition-colors inline-flex items-center"
                    >
                      Admin
                    </Link>
                  ) : (
                    <Link
                      href="/orders"
                      className="h-10 rounded-xl border border-surface-300 px-4 text-sm font-semibold text-surface-800 hover:bg-surface-100 hover:text-navy transition-colors inline-flex items-center"
                    >
                      My Orders
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="h-10 rounded-xl border border-surface-300 px-4 text-sm font-semibold text-surface-800 hover:bg-surface-100 transition-colors inline-flex items-center gap-1.5"
                  >
                    <FiLogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="w-10 h-10 rounded-full border border-surface-300 text-surface-800 hover:bg-surface-100 hover:text-navy transition-colors inline-flex items-center justify-center"
                  onClick={() => openModal('login')}
                  aria-label="Login"
                >
                  <FiUser className="w-5 h-5" />
                </button>
              )}

              <button
                type="button"
                className="w-10 h-10 rounded-full border border-surface-300 text-surface-800 hover:bg-surface-100 hover:text-navy transition-colors flex items-center justify-center"
                onClick={handleOpenSearch}
                aria-label="Open search"
              >
                <FiSearch className="w-5 h-5" />
              </button>
              <Link
                href="/products?sortBy=recommended"
                className="w-10 h-10 rounded-full border border-surface-300 text-surface-800 hover:bg-surface-100 hover:text-navy transition-colors flex items-center justify-center"
                aria-label="Favourite"
              >
                <FiHeart className="w-5 h-5" />
              </Link>

              <button
                type="button"
                onClick={openCart}
                className="relative h-9 w-11 rounded-lg border border-surface-300 text-surface-800 hover:bg-surface-100 hover:text-navy transition-colors flex items-center justify-center"
                aria-label="Cart"
              >
                <FiShoppingBag className="w-4.5 h-4.5" />
                {itemCount > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#B91C2B] text-white text-[9px] leading-[16px] font-bold text-center shadow-xs">
                    {itemCount}
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {searchOpen ? (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] pt-20 pb-24 md:pb-28 lg:pb-8 px-3 sm:px-4 md:px-6 lg:px-8">
          <div
            ref={searchPanelRef}
            className="mx-auto w-full max-w-5xl max-h-[calc(100vh-9rem)] lg:max-h-[70vh] rounded-3xl border-2 border-navy bg-white shadow-soft-lg overflow-auto"
          >
            <div className="px-4 sm:px-6 md:px-8 py-5 md:py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="w-full">
                  <p className="text-2xl sm:text-3xl font-black tracking-tight text-navy">SEARCH</p>
                  <div className="mt-3 flex items-center gap-3 border-b border-surface-400 pb-3">
                    <FiSearch className="w-5 h-5 text-navy" />
                    <input
                      id="site-search"
                      name="site-search"
                      type="search"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchText.trim().length > 0) {
                          setSearchOpen(false);
                          router.push(`/products?search=${encodeURIComponent(searchText.trim())}`);
                        }
                      }}
                      className="w-full bg-transparent outline-none text-base sm:text-lg font-semibold text-navy placeholder:text-surface-500"
                      placeholder="Search for products or brands... (Press enter)"
                      autoFocus
                    />
                  </div>
                  <div className="mt-6">
                    <p className="text-navy font-bold mb-3">Popular Brands</p>
                    <div
                      ref={brandsScrollRef}
                      onScroll={handleBrandsScroll}
                      className="overflow-x-auto hide-scrollbar border border-surface-300 rounded-xl p-3"
                    >
                      <div className="flex flex-nowrap items-center gap-2 pb-1">
                        {Array.from(new Set([...FAVORITE_BRANDS, ...brands])).map((brand) => (
                          <button
                            key={brand}
                            type="button"
                            onClick={() => {
                              setSearchOpen(false);
                              router.push(`/products?brand=${encodeURIComponent(brand)}`);
                            }}
                            className="shrink-0 px-3.5 py-1.5 rounded-full border border-surface-300 hover:border-navy hover:bg-navy hover:text-white transition-all text-xs font-semibold"
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="w-10 h-10 rounded-full border border-surface-300 hover:bg-surface-100 flex items-center justify-center shrink-0"
                  aria-label="Close search"
                >
                  <FiX className="w-5 h-5 text-navy" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
