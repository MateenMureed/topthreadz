'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import api from '@/services/api';
import ProductGrid from '@/components/ProductGrid';

export default function HomePage() {
  const [heroBanner, setHeroBanner] = useState<string | null>(null);

  useEffect(() => {
    api.get('/admin/settings/hero-banner')
      .then(res => {
        const data = res.data?.data;
        if (data?.url) setHeroBanner(data.url);
      })
      .catch(() => { /* ignore */ });
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
      <section className="border-b border-surface-300 overflow-hidden">
        {heroBanner ? (
          <Link href="/products" className="block">
            <img
              src={heroBanner}
              alt="Top Threadz Hero Banner"
              className="w-full h-auto object-cover"
            />
          </Link>
        ) : (
          <div className="bg-surface-950 text-white">
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
