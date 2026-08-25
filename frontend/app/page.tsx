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

      {/* Post-Catalog Feature Badges Section */}
      <section className="bg-surface-100 border-y border-surface-200 py-12 md:py-16">
        <div className="w-full max-w-[1536px] mx-auto px-3 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Fast Delivery */}
            <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-soft border border-surface-200">
              <div className="p-3 bg-surface-950 text-white rounded-xl shrink-0">
                <FiTruck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-surface-950">Fast Delivery</h3>
                <p className="text-xs text-surface-600 mt-1 leading-relaxed">Quick shipping on all orders nationwide.</p>
              </div>
            </div>

            {/* Support */}
            <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-soft border border-surface-200">
              <div className="p-3 bg-surface-950 text-white rounded-xl shrink-0">
                <FiHeadphones className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-surface-950">Support</h3>
                <p className="text-xs text-surface-600 mt-1 leading-relaxed">We’re here 24/7 to help with any inquiries.</p>
              </div>
            </div>

            {/* Premium Quality */}
            <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-soft border border-surface-200">
              <div className="p-3 bg-surface-950 text-white rounded-xl shrink-0">
                <FiCheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-surface-950">100% Authentic</h3>
                <p className="text-xs text-surface-600 mt-1 leading-relaxed">4.5m unstitched Boski & wash n wear suits.</p>
              </div>
            </div>

            {/* Easy Returns */}
            <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-soft border border-surface-200">
              <div className="p-3 bg-surface-950 text-white rounded-xl shrink-0">
                <FiShield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-surface-950">Hassle-Free Returns</h3>
                <p className="text-xs text-surface-600 mt-1 leading-relaxed">7-day easy exchange & money-back policy.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
