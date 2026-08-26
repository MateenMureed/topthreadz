'use client';

import Link from 'next/link';
import {
  FiChevronDown,
  FiTruck,
  FiHeadphones,
  FiCheckCircle,
  FiShield,
} from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import api from '@/services/api';
import ProductGrid from '@/components/ProductGrid';

export default function HomePage() {
  const { data: heroResponse } = useQuery({
    queryKey: ['home', 'hero-banner'],
    queryFn: () => api.get('/settings/hero-banner').then((response) => response.data),
    retry: false,
  });

  const { data: settingsData } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => api.get('/settings/store').then((res) => res.data?.data),
    retry: false,
  });

  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ['home', 'products'],
    queryFn: () => productService.getAll({ limit: 50, sortBy: 'newest' }),
  });

  const products = productsResponse?.data?.products || [];
  const heroBanner = heroResponse?.data?.url as string | undefined;

  const homepageHeading = settingsData?.homepageHeading || 'Shop Our Collection';
  const homepageSubheading = settingsData?.homepageSubheading || 'PREMIUM WASH & WEAR • SHOP OUR COLLECTION';
  const homepageGridCols = ([2, 3, 4].includes(Number(settingsData?.homepageGridCols)) ? Number(settingsData.homepageGridCols) : 4) as 2 | 3 | 4;

  return (
    <div className="bg-white text-black">
      {/* Hero Section */}
      <section className="relative border-b border-surface-300 overflow-hidden bg-surface-950 text-white">
        {heroBanner ? (
          <div className="relative w-full group">
            <Link href="/products" className="block" aria-label="Shop all products">
              <img
                src={heroBanner}
                alt="Top Threadz collection"
                className="block h-auto w-full object-cover"
              />
            </Link>
            {/* Scroll Down Indicator */}
            <a
              href="#catalog"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/90 hover:text-white transition-all bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-lg text-[10px] sm:text-xs font-bold tracking-widest uppercase"
            >
              <span>Explore Collection</span>
              <FiChevronDown className="w-4 h-4 animate-bounce" />
            </a>
          </div>
        ) : (
          <div className="relative w-full bg-surface-100 py-20 md:py-32 flex items-center justify-center">
            <a
              href="#catalog"
              className="inline-flex flex-col items-center gap-1 text-surface-400 hover:text-surface-600 transition-colors text-[10px] font-bold uppercase tracking-widest"
            >
              <span>Explore Collection</span>
              <FiChevronDown className="w-4 h-4 animate-bounce mt-1" />
            </a>
          </div>
        )}
      </section>

      {/* Product Section */}
      <section id="catalog" className="w-full max-w-[1536px] mx-auto px-2 sm:px-4 md:px-6 py-8 md:py-12">
        {/* Section Heading with Small-Caps Subtitle & Horizontal Rule */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-surface-500 shrink-0">
              {homepageSubheading}
            </span>
            <div className="h-px flex-1 bg-surface-200" />
          </div>
          <h2 className="text-2xl md:text-4xl font-display font-bold text-surface-950 uppercase tracking-tight">
            {homepageHeading}
          </h2>
        </div>

        <ProductGrid products={products} loading={isLoading} showGridControls={false} initialGridCols={homepageGridCols} />
      </section>

      {/* Post-Catalog Feature Badges Section (Mobile-Optimized Grid) */}
      <section className="bg-surface-100/80 border-t border-surface-200 py-8 sm:py-10">
        <div className="w-full max-w-[1536px] mx-auto px-3 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {/* Fast Delivery */}
            <div className="flex items-center gap-3.5 sm:gap-4 p-4 sm:p-5 bg-white rounded-2xl shadow-soft border border-surface-200/90 transition-all hover:shadow-md">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface-950 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                <FiTruck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xs sm:text-base text-surface-950 leading-tight">Fast Delivery</h3>
                <p className="text-[10px] sm:text-xs text-surface-600 mt-0.5 leading-snug">Quick shipping on all orders nationwide.</p>
              </div>
            </div>

            {/* Support */}
            <div className="flex items-center gap-3.5 sm:gap-4 p-4 sm:p-5 bg-white rounded-2xl shadow-soft border border-surface-200/90 transition-all hover:shadow-md">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface-950 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                <FiHeadphones className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xs sm:text-base text-surface-950 leading-tight">Support</h3>
                <p className="text-[10px] sm:text-xs text-surface-600 mt-0.5 leading-snug">We’re here 24/7 to help with any inquiries.</p>
              </div>
            </div>

            {/* Premium Quality */}
            <div className="flex items-center gap-3.5 sm:gap-4 p-4 sm:p-5 bg-white rounded-2xl shadow-soft border border-surface-200/90 transition-all hover:shadow-md">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface-950 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                <FiCheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xs sm:text-base text-surface-950 leading-tight">100% Authentic</h3>
                <p className="text-[10px] sm:text-xs text-surface-600 mt-0.5 leading-snug">4.5m unstitched Boski & wash n wear suits.</p>
              </div>
            </div>

            {/* Easy Returns */}
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
