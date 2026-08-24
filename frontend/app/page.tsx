'use client';

import Link from 'next/link';
import { FiArrowRight, FiChevronDown } from 'react-icons/fi';
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

  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ['home', 'products'],
    queryFn: () => productService.getAll({ limit: 50, sortBy: 'newest' }),
  });

  const products = productsResponse?.data?.products || [];
  const heroBanner = heroResponse?.data?.url as string | undefined;

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
          <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
            <p className="brand-wordmark text-xs uppercase tracking-[0.25em] text-surface-400 font-bold">Top Threadz</p>
            <h1 className="mt-4 text-4xl md:text-6xl font-display font-bold leading-tight text-white">
              Pure Style.
              <br />
              Pure Confidence.
            </h1>
            <p className="mt-5 text-surface-300 max-w-2xl mx-auto text-sm md:text-base">
              Black and white essentials for modern menswear. Discover premium drops, unstitched wash & wear fabrics, and bold sale picks.
            </p>

            {/* Primary & Secondary CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/products"
                className="btn-primary !bg-white !text-surface-950 hover:!bg-surface-100 !px-7 !py-3.5 text-xs font-bold uppercase tracking-wider shadow-md"
              >
                Shop All <FiArrowRight className="inline ml-2" />
              </Link>
              <Link
                href="/products?sortBy=newest"
                className="rounded-full border-2 border-white/80 px-7 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white hover:text-surface-950 shadow-sm"
              >
                New Arrivals
              </Link>
            </div>

            {/* Scroll Down Indicator */}
            <div className="mt-12 flex justify-center">
              <a
                href="#catalog"
                className="inline-flex flex-col items-center gap-1 text-surface-400 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest"
              >
                <span>Explore Collection</span>
                <FiChevronDown className="w-4 h-4 animate-bounce text-white mt-1" />
              </a>
            </div>
          </div>
        )}
      </section>

      {/* Product Section */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        {/* Section Heading with Small-Caps Subtitle & Horizontal Rule */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-surface-500 shrink-0">
              PREMIUM WASH & WEAR • SHOP OUR COLLECTION
            </span>
            <div className="h-px flex-1 bg-surface-200" />
          </div>
          <h2 className="text-2xl md:text-4xl font-display font-bold text-surface-950 uppercase tracking-tight">
            Shop Our Collection
          </h2>
        </div>

        <ProductGrid products={products} loading={isLoading} showGridControls={false} />
      </section>
    </div>
  );
}
