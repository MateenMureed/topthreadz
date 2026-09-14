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
      {/* ─── FEATURED PRODUCTS SECTION matching reference mockup ─── */}
      <section id="catalog" className="w-full max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="mb-6 sm:mb-8 flex items-end justify-between gap-4 border-b border-surface-200/60 pb-4">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.24em] text-[#C5A262] mb-1.5">
              PREMIUM MENSWEAR
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#1E2229] font-normal tracking-tight">
              Featured Products
            </h2>
          </div>

          <Link
            href="/products"
            className="text-xs sm:text-[13px] font-semibold text-[#1E2229] hover:text-[#0F1F3D] flex items-center gap-1.5 transition-colors group"
          >
            <span>View All Products</span>
            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        <ProductGrid
          products={displayedProducts}
          loading={isLoading}
          showGridControls={false}
          initialGridCols={homepageGridCols}
        />
      </section>

      {/* ─── TRUST PILLARS BAR matching reference mockup ─── */}
      <section className="bg-[#FAFAF8] border-y border-surface-200/80 py-8 sm:py-10">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* 1. Fast Delivery */}
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg border border-[#1E2229]/15 flex items-center justify-center shrink-0 bg-white shadow-2xs">
                <FiTruck className="w-5 h-5 text-[#1E2229] stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1E2229] leading-tight">
                  FAST DELIVERY
                </h3>
                <p className="text-[11px] sm:text-xs text-[#6B7280] mt-0.5">Nationwide shipping</p>
              </div>
            </div>

            {/* 2. Secure Checkout */}
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg border border-[#1E2229]/15 flex items-center justify-center shrink-0 bg-white shadow-2xs">
                <FiShield className="w-5 h-5 text-[#1E2229] stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1E2229] leading-tight">
                  SECURE CHECKOUT
                </h3>
                <p className="text-[11px] sm:text-xs text-[#6B7280] mt-0.5">Safe &amp; secure payments</p>
              </div>
            </div>

            {/* 3. 100% Authentic */}
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg border border-[#1E2229]/15 flex items-center justify-center shrink-0 bg-white shadow-2xs">
                <FiCheckCircle className="w-5 h-5 text-[#1E2229] stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1E2229] leading-tight">
                  100% AUTHENTIC
                </h3>
                <p className="text-[11px] sm:text-xs text-[#6B7280] mt-0.5">Premium fabrics</p>
              </div>
            </div>

            {/* 4. Easy Returns */}
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg border border-[#1E2229]/15 flex items-center justify-center shrink-0 bg-white shadow-2xs">
                <FiHeadphones className="w-5 h-5 text-[#1E2229] stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1E2229] leading-tight">
                  EASY RETURNS
                </h3>
                <p className="text-[11px] sm:text-xs text-[#6B7280] mt-0.5">7-day return policy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECONDARY EDITORIAL BANNER ("The Craft of Tradition") matching reference mockup ─── */}
      <section className="w-full bg-[#EAE4DC] overflow-hidden">
        <div className="max-w-[1536px] mx-auto grid grid-cols-1 md:grid-cols-12 items-center min-h-[360px] lg:min-h-[420px]">
          {/* Left Editorial Content */}
          <div className="md:col-span-6 lg:col-span-5 px-6 sm:px-10 lg:px-16 py-12 md:py-16">
            <p className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.24em] text-[#8C7355] mb-2">
              THE CRAFT OF TRADITION
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#1E2229] font-normal leading-[1.12] tracking-tight">
              Premium Unstitched Fabrics
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#5C554E] font-light leading-relaxed max-w-md">
              Soft. Durable. Perfect for Every Occasion.
            </p>
            <div className="mt-7 sm:mt-8">
              <Link
                href="/products/category/unstitched-fabric"
                className="inline-flex items-center gap-2.5 px-7 sm:px-8 py-3.5 rounded-md bg-[#0F1F3D] hover:bg-black text-white text-xs sm:text-[13px] font-semibold tracking-wider uppercase transition-all shadow-md active:scale-[0.98]"
              >
                <span>SHOP FABRICS</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Right Rolled Fabrics Imagery */}
          <div className="md:col-span-6 lg:col-span-7 relative h-[260px] sm:h-[320px] md:h-full min-h-[320px] lg:min-h-[420px] overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
              style={{
                backgroundImage: 'url("https://res.cloudinary.com/fmxzphak/image/upload/v1788890028/ecommerce-products/gpj4ravzcy5jdfewlhx9.jpg")',
                backgroundPosition: 'center 40%',
              }}
            />
            {/* Subtle soft gradient fade into the left text container */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#EAE4DC] to-transparent hidden md:block" />
          </div>
        </div>
      </section>
    </div>
  );
}