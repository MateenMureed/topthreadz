'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
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
  initialCategories?: any[];
  initialProducts?: any[];
  initialHeroBanner?: string;
  initialSettings?: any;
}

export default function HomePageClient({
  initialCategories = [],
  initialProducts = [],
  initialSettings,
}: HomePageClientProps) {
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

  const homepageHeading = settingsData?.homepageHeading || initialSettings?.homepageHeading || 'Shop Our Collection';
  const homepageSubheading = settingsData?.homepageSubheading || initialSettings?.homepageSubheading || 'PREMIUM WASH & WEAR • SHOP OUR COLLECTION';
  const rawCols = Number(settingsData?.homepageGridCols || initialSettings?.homepageGridCols);
  const homepageGridCols = ([2, 3, 4].includes(rawCols) ? rawCols : 4) as 2 | 3 | 4;

  const [activeTab, setActiveTab] = useState<'all' | 'trending' | 'featured'>('all');

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
      {/* ─── PRODUCT CATALOG SECTION ─── */}
      <section id="catalog" className="w-full max-w-[1536px] mx-auto px-2 sm:px-4 md:px-6 py-8 md:py-12">
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-surface-700 shrink-0">
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