'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiTruck,
  FiHeadphones,
  FiCheckCircle,
  FiShield,
} from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import api from '@/services/api';
import ProductGrid from '@/components/ProductGrid';

interface HomePageClientProps {
  initialCategories: any[];
  initialProducts: any[];
  initialHeroBanner?: string;
  initialSettings?: any;
}

export default function HomePageClient({
  initialCategories = [],
  initialProducts = [],
  initialHeroBanner,
  initialSettings,
}: HomePageClientProps) {
  const { data: heroResponse } = useQuery({
    queryKey: ['home', 'hero-banner'],
    queryFn: () => api.get('/settings/hero-banner').then((response) => response.data),
    initialData: initialHeroBanner ? { data: { url: initialHeroBanner } } : undefined,
    retry: false,
  });

  const { data: settingsData } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => api.get('/settings/store').then((res) => res.data?.data),
    initialData: initialSettings || undefined,
    retry: false,
  });

  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ['home', 'products'],
    queryFn: () => productService.getAll({ limit: 50, sortBy: 'newest' }),
    initialData: initialProducts?.length ? { data: { products: initialProducts } } : undefined,
  });

  const { data: categoriesResponse } = useQuery({
    queryKey: ['home', 'categories'],
    queryFn: () => api.get('/categories').then((response) => response.data),
    initialData: initialCategories?.length ? { data: initialCategories } : undefined,
    retry: false,
  });

  const products = productsResponse?.data?.products || initialProducts || [];
  const categories = categoriesResponse?.data || initialCategories || [];
  const heroBanner = heroResponse?.data?.url || initialHeroBanner;

  const [bannerText, setBannerText] = useState({
    heading: 'Shop Our Newest Collection',
    subheading: 'PREMIUM WASH & WEAR • SHOP OUR COLLECTION',
    buttonText: 'Shop Now',
    buttonLink: '/products'
  });

  useEffect(() => {
    const fetchBannerText = async () => {
      try {
        const response = await api.get('/settings/hero-banner-text');
        const data = response.data?.data;
        if (data) {
          setBannerText({
            heading: data.heading || 'Shop Our Newest Collection',
            subheading: data.subheading || 'PREMIUM WASH & WEAR • SHOP OUR COLLECTION',
            buttonText: data.buttonText || 'Shop Now',
            buttonLink: data.buttonLink || '/products'
          });
        }
      } catch {
        // use defaults
      }
    };
    fetchBannerText();
  }, []);

  const homepageHeading = settingsData?.homepageHeading || initialSettings?.homepageHeading || 'Shop Our Collection';
  const homepageSubheading = settingsData?.homepageSubheading || initialSettings?.homepageSubheading || 'PREMIUM WASH & WEAR • SHOP OUR COLLECTION';
  const rawCols = Number(settingsData?.homepageGridCols || initialSettings?.homepageGridCols);
  const homepageGridCols = ([2, 3, 4].includes(rawCols) ? rawCols : 4) as 2 | 3 | 4;

  const [activeTab, setActiveTab] = useState<'all' | 'trending' | 'featured'>('all');
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const handleCategoryScroll = () => {
    if (!categoryScrollRef.current) return;
    const { scrollLeft, clientWidth } = categoryScrollRef.current;
    if (clientWidth > 0) {
      const index = Math.round(scrollLeft / (clientWidth + 12));
      setActiveCategoryIndex(Math.max(0, Math.min(categories.length - 1, index)));
    }
  };

  const displayedProducts = useMemo(() => {
    if (activeTab === 'featured') {
      const featured = products.filter((p: any) => p.featured);
      return featured.length > 0 ? featured : products;
    }
    if (activeTab === 'trending') {
      const trending = products.filter((p: any) => p.trending);
      return trending.length > 0 ? trending : products;
    }
    return products;
  }, [products, activeTab]);

  return (
    <div className="bg-white text-black">
      {/* ─── HERO BANNER – IMAGE ONLY, LINKS TO PRODUCTS, NO OVERLAY ─── */}
      {heroBanner && (
        <Link
          href={bannerText.buttonLink || '/products'}
          className="block relative w-full overflow-hidden"
          aria-label="Shop our newest collection"
        >
          {/* No forced min-height and no object-fit box — the image just
              scales to full width at its own natural height, so there is
              never any background showing around/behind it on any device. */}
          <img
            src={heroBanner}
            alt="Top Threadz Men's Luxury Fabrics Collection"
            className="w-full h-auto"
            onError={(e) => {
              console.error('Hero banner failed to load');
              e.currentTarget.style.display = 'none';
            }}
          />
        </Link>
      )}

      {/* Explore Collection CTA */}
      <div className="flex items-center justify-center py-5 bg-white border-b border-surface-200">
        <a
          href="#catalog"
          className="inline-flex flex-col items-center gap-1 text-surface-700 hover:text-surface-950 transition-colors text-[11px] font-bold uppercase tracking-widest"
        >
          <span>Explore Collection</span>
          <FiChevronDown className="w-4 h-4 animate-bounce mt-0.5" />
        </a>
      </div>

      {/* Shop by Category */}
      <section className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-10 md:py-14">
        <div className="mb-5 sm:mb-8 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-surface-500">
              Top Threadz
            </p>
            <h2 className="mt-1 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-surface-950">
              Shop by Category
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-surface-600">
              Discover unstitched wash &amp; wear fabrics, Boski, and tailored stitched collections.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous categories"
                onClick={() => {
                  if (categoryScrollRef.current) {
                    categoryScrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
                  }
                }}
                className="w-8 h-8 rounded-full border border-surface-300 bg-white flex items-center justify-center hover:bg-surface-100 transition-colors shadow-soft"
              >
                <FiChevronLeft className="w-4 h-4 text-surface-700" />
              </button>
              <button
                type="button"
                aria-label="Next categories"
                onClick={() => {
                  if (categoryScrollRef.current) {
                    categoryScrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
                  }
                }}
                className="w-8 h-8 rounded-full border border-surface-300 bg-white flex items-center justify-center hover:bg-surface-100 transition-colors shadow-soft"
              >
                <FiChevronRight className="w-4 h-4 text-surface-700" />
              </button>
            </div>
            <Link
              href="/products"
              className="text-xs sm:text-sm font-bold text-[#0F1F3D] hover:text-[#B91C2B] underline underline-offset-4 transition-colors"
            >
              View all →
            </Link>
          </div>
        </div>

        <div className="relative">
          <div
            ref={categoryScrollRef}
            onScroll={handleCategoryScroll}
            className="flex snap-x snap-mandatory gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none scroll-smooth -mx-3 px-3 sm:mx-0 sm:px-0"
          >
            {categories.map((category: any, idx: number) => (
              <Link
                key={category.id}
                href={`/products/category/${encodeURIComponent(category.slug || category.name)}`}
                className={[
                  'group relative block overflow-hidden rounded-xl bg-surface-100 border border-surface-200/90 shadow-soft active:scale-[0.98] transition-all duration-300 snap-start shrink-0',
                  'w-[calc(50vw-20px)] aspect-[4/5]',
                  'sm:w-56 sm:aspect-[4/5]',
                  'md:w-60',
                  'lg:w-64',
                  'hover:shadow-lg hover:-translate-y-0.5',
                ].join(' ')}
              >
                <Image
                  src={category.coverImage || `https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=700&q=80`}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 224px, 256px"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 sm:p-4 text-white">
                  <span className="inline-block px-2 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white mb-1 whitespace-nowrap">
                    {idx + 1} / {categories.length}
                  </span>
                  <div className="flex items-end justify-between gap-1.5">
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide drop-shadow-md leading-tight truncate flex-1">
                      {category.name}
                    </h3>
                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-surface-950 flex items-center justify-center text-xs font-bold shrink-0 shadow-md transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {categories.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {categories.map((_: any, dotIdx: number) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => {
                    if (categoryScrollRef.current) {
                      const card = categoryScrollRef.current.querySelector('a');
                      const cardWidth = card ? card.getBoundingClientRect().width + 12 : 200;
                      categoryScrollRef.current.scrollTo({
                        left: dotIdx * cardWidth,
                        behavior: 'smooth',
                      });
                      setActiveCategoryIndex(dotIdx);
                    }
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeCategoryIndex === dotIdx ? 'w-6 bg-[#0F1F3D]' : 'w-1.5 bg-surface-300'
                  }`}
                  aria-label={`Go to category ${dotIdx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {categories.length === 0 && (
          <p className="text-xs sm:text-sm text-surface-500 text-center py-8">Collections coming soon.</p>
        )}
      </section>

      {/* Product Section */}
      <section id="catalog" className="w-full max-w-[1536px] mx-auto px-2 sm:px-4 md:px-6 py-8 md:py-12">
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-surface-500 shrink-0">
                {homepageSubheading}
              </span>
              <div className="h-px flex-1 bg-surface-200 hidden sm:block" />
            </div>
            <h2 className="text-2xl md:text-4xl font-display font-bold text-surface-950 uppercase tracking-tight">
              {homepageHeading}
            </h2>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-[#0F1F3D] text-white shadow-xs'
                  : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
              }`}
            >
              All Drops
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('trending')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'trending'
                  ? 'bg-[#B91C2B] text-white shadow-xs'
                  : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
              }`}
            >
              <span>🔥 Trending / New Arrival</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('featured')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'featured'
                  ? 'bg-[#0F1F3D] text-white shadow-xs'
                  : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
              }`}
            >
              <span>⭐ Featured Collection</span>
            </button>
          </div>
        </div>

        <ProductGrid products={displayedProducts} loading={isLoading} showGridControls={true} initialGridCols={homepageGridCols} />
      </section>

      {/* Feature Badges */}
      <section className="bg-surface-100/80 border-t border-surface-200 py-8 sm:py-10">
        <div className="w-full max-w-[1536px] mx-auto px-3 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            <div className="flex items-center gap-3.5 sm:gap-4 p-4 sm:p-5 bg-white rounded-2xl shadow-soft border border-surface-200/90 transition-all hover:shadow-md">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface-950 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                <FiTruck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xs sm:text-base text-surface-950 leading-tight">Fast Delivery</h3>
                <p className="text-[10px] sm:text-xs text-surface-600 mt-0.5 leading-snug">Quick shipping on all orders nationwide.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 sm:gap-4 p-4 sm:p-5 bg-white rounded-2xl shadow-soft border border-surface-200/90 transition-all hover:shadow-md">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface-950 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                <FiHeadphones className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xs sm:text-base text-surface-950 leading-tight">Support</h3>
                <p className="text-[10px] sm:text-xs text-surface-600 mt-0.5 leading-snug">We're here 24/7 to help with any inquiries.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 sm:gap-4 p-4 sm:p-5 bg-white rounded-2xl shadow-soft border border-surface-200/90 transition-all hover:shadow-md">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface-950 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                <FiCheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xs sm:text-base text-surface-950 leading-tight">100% Authentic</h3>
                <p className="text-[10px] sm:text-xs text-surface-600 mt-0.5 leading-snug">4.5m unstitched Boski & wash n wear suits.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 sm:gap-4 p-4 sm:p-5 bg-white rounded-2xl shadow-soft border border-surface-200/90 transition-all hover:shadow-md">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface-950 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                <FiShield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xs sm:text-base text-surface-950 leading-tight">Hassle-Free Returns</h3>
                <p className="text-[10px] sm:text-xs text-surface-600 mt-0.5 leading-snug">7-day easy exchange & money-back policy.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}