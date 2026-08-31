'use client';

import { useRef, useState } from 'react';
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
  const { data: categoriesResponse } = useQuery({
    queryKey: ['home', 'categories'],
    queryFn: () => api.get('/categories').then((response) => response.data),
    retry: false,
  });

  const products = productsResponse?.data?.products || [];
  const categories = categoriesResponse?.data || [];
  const heroBanner = heroResponse?.data?.url as string | undefined;

  const homepageHeading = settingsData?.homepageHeading || 'Shop Our Collection';
  const homepageSubheading = settingsData?.homepageSubheading || 'PREMIUM WASH & WEAR • SHOP OUR COLLECTION';
  const homepageGridCols = ([2, 3, 4].includes(Number(settingsData?.homepageGridCols)) ? Number(settingsData.homepageGridCols) : 4) as 2 | 3 | 4;

  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const handleCategoryScroll = () => {
    if (!categoryScrollRef.current) return;
    const { scrollLeft, clientWidth } = categoryScrollRef.current;
    if (clientWidth > 0) {
      const cardWidth = clientWidth * 0.88;
      const index = Math.round(scrollLeft / (cardWidth || 1));
      setActiveCategoryIndex(Math.max(0, Math.min(categories.length - 1, index)));
    }
  };

  const scrollCategory = (direction: 'left' | 'right') => {
    if (!categoryScrollRef.current) return;
    const scrollAmount = categoryScrollRef.current.clientWidth * 0.88;
    categoryScrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="bg-white text-black">
      {/* Hero Section */}
      <section className="relative border-b border-surface-300 overflow-hidden bg-surface-950 text-white">
        {heroBanner ? (
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/7] group">
            <Link href="/products" className="block h-full" aria-label="Shop all products">
              <Image
                src={heroBanner}
                alt="Top Threadz collection"
                fill
                priority
                fetchPriority="high"
                sizes="100vw"
                className="object-cover object-top"
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

      {/* Explore Collection (Mobile Touch Slider & Grid) */}
      <section className="w-full max-w-[1536px] mx-auto px-3 sm:px-6 py-6 sm:py-10 md:py-14">
        <div className="mb-4 sm:mb-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-surface-500">Top Threadz</p>
            <h2 className="mt-1 text-xl sm:text-2xl md:text-4xl font-display font-bold text-surface-950">Explore Our Collection</h2>
            <p className="mt-1 text-xs sm:text-sm text-surface-600">Find your perfect Unstitched, Stitched & Kids Wear, all in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Desktop Navigation Arrows */}
            <div className="hidden sm:flex items-center gap-1.5 mr-2">
              <button
                type="button"
                onClick={() => scrollCategory('left')}
                className="w-8 h-8 rounded-full border border-surface-300 flex items-center justify-center text-surface-700 hover:bg-surface-100 transition-colors"
                aria-label="Previous categories"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollCategory('right')}
                className="w-8 h-8 rounded-full border border-surface-300 flex items-center justify-center text-surface-700 hover:bg-surface-100 transition-colors"
                aria-label="Next categories"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
            <Link href="/products" className="text-xs sm:text-sm font-semibold underline underline-offset-4 shrink-0">View all</Link>
          </div>
        </div>

        {/* Categories Scroll / Touch Slider */}
        <div
          ref={categoryScrollRef}
          onScroll={handleCategoryScroll}
          className="flex snap-x snap-mandatory gap-3 sm:gap-4 overflow-x-auto pb-4 pt-1 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-none scroll-smooth"
        >
          {categories.map((category: any, idx: number) => (
            <Link
              key={category.id}
              href={`/products/category/${encodeURIComponent(category.slug || category.name)}`}
              className="group relative w-[88vw] min-w-[88vw] xs:w-[82vw] xs:min-w-[82vw] sm:min-w-[210px] sm:w-auto lg:flex-1 snap-center sm:snap-start overflow-hidden rounded-2xl sm:rounded-2xl bg-surface-100 border border-surface-200/90 shadow-soft hover:shadow-lg transition-all"
            >
              <div className="aspect-[16/11] xs:aspect-[4/3] sm:aspect-[3/4]">
                <Image
                  src={category.coverImage || `https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=700&q=80`}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 88vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-12 sm:p-5 sm:pt-16 text-white flex items-end justify-between">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white mb-1.5">
                    Category {idx + 1} of {categories.length}
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold uppercase tracking-wide drop-shadow-md line-clamp-1">
                    {category.name}
                  </h3>
                </div>
                <span className="w-8 h-8 rounded-full bg-white text-surface-950 flex items-center justify-center text-sm font-bold transition-transform group-hover:translate-x-1 shrink-0 ml-2 shadow-md">
                  →
                </span>
              </div>
            </Link>
          ))}
          {categories.length === 0 && <p className="text-xs sm:text-sm text-surface-500">Collections coming soon.</p>}
        </div>

        {/* Mobile Swipe Dot Indicators */}
        {categories.length > 1 && (
          <div className="flex sm:hidden items-center justify-center gap-1.5 mt-2">
            {categories.map((_: any, dotIdx: number) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => {
                  if (categoryScrollRef.current) {
                    const cardWidth = categoryScrollRef.current.clientWidth * 0.88;
                    categoryScrollRef.current.scrollTo({
                      left: dotIdx * cardWidth,
                      behavior: 'smooth',
                    });
                  }
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeCategoryIndex === dotIdx
                    ? 'w-6 bg-surface-950'
                    : 'w-1.5 bg-surface-300'
                }`}
                aria-label={`Slide to category ${dotIdx + 1}`}
              />
            ))}
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

        <ProductGrid products={products} loading={isLoading} showGridControls={true} initialGridCols={homepageGridCols} />
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
