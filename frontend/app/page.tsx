'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { FiArrowRight } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import ProductGrid from '@/components/ProductGrid';

export default function HomePage() {

  const [heroBanner, setHeroBanner] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHero = localStorage.getItem('topthreadz_hero_banner');
      if (savedHero) setHeroBanner(savedHero);
    }
  }, []);

  const { data: newlyLaunched, isLoading: loadingNew } = useQuery({
    queryKey: ['home', 'newly-launched'],
    queryFn: () => productService.getAll({ limit: 8, sortBy: 'newest' }),
  });

  const { data: bestSellers, isLoading: loadingBest } = useQuery({
    queryKey: ['home', 'best-sellers'],
    queryFn: () => productService.getAll({ limit: 8, sortBy: 'recommended' }),
  });

  const newProducts = newlyLaunched?.data?.products || [];
  const bestSellerProducts = bestSellers?.data?.products || [];

  return (
    <div className="bg-white text-black">
      {/* Hero Section */}
      <section className="relative border-b border-surface-300 bg-surface-950 text-white overflow-hidden">
        {heroBanner ? (
          <div className="relative min-h-[420px] md:min-h-[520px] w-full flex items-center justify-center p-6 text-center">
            <img
              src={heroBanner}
              alt="Top Threadz Hero Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="relative z-10 max-w-3xl mx-auto space-y-4">
              <p className="brand-wordmark text-xs uppercase tracking-[0.2em] text-surface-200">Top Threadz</p>
              <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight drop-shadow-md">
                Pure Style. Pure Confidence.
              </h1>
              <p className="text-surface-200 max-w-xl mx-auto text-sm md:text-base drop-shadow">
                Premium menswear and unstitched collections crafted for elegance.
              </p>
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <Link href="/products" className="btn-primary !bg-white !text-surface-950 hover:!bg-surface-100">
                  Shop All <FiArrowRight className="inline ml-2" />
                </Link>
                <Link href="/products?sortBy=price_asc" className="btn-sale">
                  Sale Picks
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
            <p className="brand-wordmark text-sm md:text-base text-surface-400">Top Threadz</p>
            <h1 className="mt-4 text-4xl md:text-6xl font-display font-bold leading-tight text-white">
              Pure Style.
              <br />
              Pure Confidence.
            </h1>
            <p className="mt-5 text-surface-300 max-w-2xl mx-auto">
              Black and white essentials for modern menswear. Discover premium drops and bold sale picks.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/products" className="btn-primary !bg-white !text-surface-950 hover:!bg-surface-100">
                Shop All <FiArrowRight className="inline ml-2" />
              </Link>
              <Link href="/products?sortBy=price_asc" className="btn-sale">
                Sale Picks
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12 md:py-14 border-t border-surface-300">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold">Newly Launched</h2>
            <p className="text-surface-700 mt-1">Fresh arrivals curated for this week.</p>
          </div>
          <Link href="/products?sortBy=newest" className="text-black font-medium hover:text-surface-700">
            View All
          </Link>
        </div>
        <ProductGrid products={newProducts} loading={loadingNew} />
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12 md:py-14 border-t border-surface-300">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold">Best Sellers</h2>
            <p className="text-surface-700 mt-1">Most loved by our customers.</p>
          </div>
          <Link href="/products" className="text-black font-medium hover:text-surface-700">
            View All
          </Link>
        </div>
        <ProductGrid products={bestSellerProducts} loading={loadingBest} />
      </section>
    </div>
  );
}
