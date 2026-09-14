'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  FiTruck,
  FiHeadphones,
  FiCheckCircle,
  FiShield,
} from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import api from '@/services/api';
import ProductCard from '@/components/ProductCard';

interface HomePageClientProps {
  initialCategories?: any[];
  initialProducts?: any[];
  initialHeroBanner?: string;
  initialSettings?: any;
}

export default function HomePageClient({
  initialCategories = [],
  initialProducts = [],
}: HomePageClientProps) {
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

  // Pick top 4 products for "BEST SELLER" section matching Diners 4-column row
  const bestSellers = useMemo(() => {
    if (!products.length) return [];
    // Prioritize featured, trending, or discounted products
    const featured = products.filter((p: any) => p.featured || p.trending || (p.discount && p.discount > 0));
    if (featured.length >= 4) return featured.slice(0, 4);
    return products.slice(0, 4);
  }, [products]);

  return (
    <div className="bg-white text-[#1E2229]">
      {/* ─── 1. BEST SELLER SECTION (4 Products in a Row matching Diners) ─── */}
      <section className="w-full max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-14 border-b border-surface-200/50">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-lg sm:text-xl md:text-2xl font-normal tracking-[0.24em] text-[#1E2229] uppercase">
            BEST SELLER
          </h2>
          <p className="font-serif italic text-xs sm:text-sm text-[#8C7355] mt-1 tracking-wide">
            Handpicked for you
          </p>
        </div>

        {/* 4 Products Row with preserved 3:4 aspect ratio & compact gap spacing */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5 md:gap-3 lg:gap-3.5">
          {bestSellers.map((product: any) => (
            <ProductCard
              key={product.id || product._id}
              id={product.id || product._id}
              name={product.name}
              price={product.price}
              discount={product.discount || 0}
              images={product.images || []}
              category={product.category}
              subcategory={product.subcategory}
              sizes={product.sizes || []}
              colors={product.colors || []}
              slug={product.slug}
              imageMeta={product.imageMeta || []}
            />
          ))}
        </div>

        {/* Outlined "VIEW ALL PRODUCTS" button matching Diners */}
        <div className="mt-8 sm:mt-10 text-center">
          <Link
            href="/products"
            className="inline-block border border-[#1E2229] px-8 sm:px-10 py-2.5 sm:py-3 text-[11px] sm:text-xs font-semibold tracking-[0.22em] text-[#1E2229] uppercase hover:bg-[#1E2229] hover:text-white transition-all duration-200"
          >
            VIEW ALL PRODUCTS
          </Link>
        </div>
      </section>

      {/* ─── 2. OUR NEW COLLECTIONS (3 Large Column Grid matching Diners) ─── */}
      <section className="w-full max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-14 border-b border-surface-200/50">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-lg sm:text-xl md:text-2xl font-normal tracking-[0.24em] text-[#1E2229] uppercase">
            OUR NEW COLLECTIONS
          </h2>
          <p className="font-serif italic text-xs sm:text-sm text-[#8C7355] mt-1 tracking-wide">
            A touch of royal taste
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5 md:gap-6">
          {/* Card 1: Unstitched Fabric Collection */}
          <Link
            href="/products/category/unstitched-fabric"
            className="group relative block w-full overflow-hidden bg-[#F4F2EE] cursor-pointer"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              <Image
                src="https://res.cloudinary.com/fmxzphak/image/upload/v1788891170/ecommerce-products/eki2qssmwkiagxn9fx5y.jpg"
                alt="Unstitched Fabric Collection"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
              {/* Bottom black bar banner matching Diners */}
              <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-[2px] py-3 sm:py-3.5 px-4 text-center transition-colors duration-200 group-hover:bg-black/95">
                <h3 className="text-white text-xs sm:text-[13px] font-bold tracking-[0.16em] uppercase">
                  UNSTITCHED FABRIC COLLECTION
                </h3>
              </div>
            </div>
          </Link>

          {/* Card 2: Stitched Kurta Collection */}
          <Link
            href="/products/category/stitched"
            className="group relative block w-full overflow-hidden bg-[#F4F2EE] cursor-pointer"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              <Image
                src="https://res.cloudinary.com/fmxzphak/image/upload/v1788614550/ecommerce-products/miz32cpgjlvw0ejejplp.jpg"
                alt="Stitched Kurta Collection"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
              {/* Bottom black bar banner matching Diners */}
              <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-[2px] py-3 sm:py-3.5 px-4 text-center transition-colors duration-200 group-hover:bg-black/95">
                <h3 className="text-white text-xs sm:text-[13px] font-bold tracking-[0.16em] uppercase">
                  STITCHED KURTA COLLECTION
                </h3>
              </div>
            </div>
          </Link>

          {/* Card 3: Waistcoat & Suits Collection */}
          <Link
            href="/products/category/waist-coats"
            className="group relative block w-full overflow-hidden bg-[#F4F2EE] cursor-pointer"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              <Image
                src="https://res.cloudinary.com/fmxzphak/image/upload/v1788614812/ecommerce-products/krkdpdqc0a4mf437lzr1.jpg"
                alt="Waistcoat & Suits Collection"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
              {/* Bottom black bar banner matching Diners */}
              <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-[2px] py-3 sm:py-3.5 px-4 text-center transition-colors duration-200 group-hover:bg-black/95">
                <h3 className="text-white text-xs sm:text-[13px] font-bold tracking-[0.16em] uppercase">
                  WAISTCOAT &amp; SUITS COLLECTION
                </h3>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ─── 3. SUB-CATEGORIES SHOWCASE (4 Tall Columns matching Diners) ─── */}
      <section className="w-full max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-14 border-b border-surface-200/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
          {/* Sub-Card 1: Men's BOSKI */}
          <Link
            href="/products/category/unstitched-fabric"
            className="group relative block w-full overflow-hidden bg-[#F4F2EE] cursor-pointer"
          >
            <div className="relative aspect-[9/15] w-full overflow-hidden">
              <Image
                src="https://res.cloudinary.com/fmxzphak/image/upload/v1788890028/ecommerce-products/gpj4ravzcy5jdfewlhx9.jpg"
                alt="Men's Boski"
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />
              {/* Dark subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

              {/* Typography & SHOP NOW pill button */}
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5 flex flex-col items-center text-center">
                <span className="font-serif italic text-xs sm:text-sm text-white/90">Men&apos;s</span>
                <h3 className="font-serif text-lg sm:text-2xl md:text-3xl text-white uppercase tracking-wider font-light mt-0.5 drop-shadow-sm">
                  BOSKI
                </h3>
                <span className="mt-3 sm:mt-4 inline-flex items-center justify-center bg-white text-black group-hover:bg-[#1E2229] group-hover:text-white px-5 sm:px-6 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-[11px] font-bold tracking-widest uppercase transition-all shadow-sm">
                  SHOP NOW
                </span>
              </div>
            </div>
          </Link>

          {/* Sub-Card 2: Men's WASH & WEAR */}
          <Link
            href="/products/category/unstitched-fabric"
            className="group relative block w-full overflow-hidden bg-[#F4F2EE] cursor-pointer"
          >
            <div className="relative aspect-[9/15] w-full overflow-hidden">
              <Image
                src="https://res.cloudinary.com/fmxzphak/image/upload/v1788891170/ecommerce-products/eki2qssmwkiagxn9fx5y.jpg"
                alt="Men's Wash & Wear"
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5 flex flex-col items-center text-center">
                <span className="font-serif italic text-xs sm:text-sm text-white/90">Men&apos;s</span>
                <h3 className="font-serif text-lg sm:text-2xl md:text-3xl text-white uppercase tracking-wider font-light mt-0.5 drop-shadow-sm">
                  WASH &amp; WEAR
                </h3>
                <span className="mt-3 sm:mt-4 inline-flex items-center justify-center bg-white text-black group-hover:bg-[#1E2229] group-hover:text-white px-5 sm:px-6 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-[11px] font-bold tracking-widest uppercase transition-all shadow-sm">
                  SHOP NOW
                </span>
              </div>
            </div>
          </Link>

          {/* Sub-Card 3: Men's KURTA PAJAMA */}
          <Link
            href="/products/category/stitched"
            className="group relative block w-full overflow-hidden bg-[#F4F2EE] cursor-pointer"
          >
            <div className="relative aspect-[9/15] w-full overflow-hidden">
              <Image
                src="https://res.cloudinary.com/fmxzphak/image/upload/v1788614550/ecommerce-products/miz32cpgjlvw0ejejplp.jpg"
                alt="Men's Kurta Pajama"
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5 flex flex-col items-center text-center">
                <span className="font-serif italic text-xs sm:text-sm text-white/90">Men&apos;s</span>
                <h3 className="font-serif text-lg sm:text-2xl md:text-3xl text-white uppercase tracking-wider font-light mt-0.5 drop-shadow-sm">
                  KURTA
                </h3>
                <span className="mt-3 sm:mt-4 inline-flex items-center justify-center bg-white text-black group-hover:bg-[#1E2229] group-hover:text-white px-5 sm:px-6 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-[11px] font-bold tracking-widest uppercase transition-all shadow-sm">
                  SHOP NOW
                </span>
              </div>
            </div>
          </Link>

          {/* Sub-Card 4: Kids SECTION */}
          <Link
            href="/products/category/kids-section"
            className="group relative block w-full overflow-hidden bg-[#F4F2EE] cursor-pointer"
          >
            <div className="relative aspect-[9/15] w-full overflow-hidden">
              <Image
                src="https://res.cloudinary.com/fmxzphak/image/upload/v1788295698/ecommerce-products/dtxydgwby9kpeoo6w0qu.jpg"
                alt="Kids Section"
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5 flex flex-col items-center text-center">
                <span className="font-serif italic text-xs sm:text-sm text-white/90">Boys</span>
                <h3 className="font-serif text-lg sm:text-2xl md:text-3xl text-white uppercase tracking-wider font-light mt-0.5 drop-shadow-sm">
                  EASTERN
                </h3>
                <span className="mt-3 sm:mt-4 inline-flex items-center justify-center bg-white text-black group-hover:bg-[#1E2229] group-hover:text-white px-5 sm:px-6 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-[11px] font-bold tracking-widest uppercase transition-all shadow-sm">
                  SHOP NOW
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Diners Style Outlined "ALL CATEGORIES" button */}
        <div className="mt-8 sm:mt-10 text-center">
          <Link
            href="/products"
            className="inline-block border border-[#1E2229] px-8 sm:px-10 py-2.5 sm:py-3 text-[11px] sm:text-xs font-semibold tracking-[0.22em] text-[#1E2229] uppercase hover:bg-[#1E2229] hover:text-white transition-all duration-200"
          >
            ALL CATEGORIES
          </Link>
        </div>
      </section>

      {/* ─── 4. ASYMMETRIC 2-CARD LARGE SHOWCASE GRID matching Diners ─── */}
      <section className="w-full max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-14 border-b border-surface-200/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5 md:gap-6">
          {/* Left Large Showcase: Pure Boski Luxury */}
          <Link
            href="/products/category/unstitched-fabric"
            className="group relative block w-full overflow-hidden bg-[#1E2229] cursor-pointer"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src="https://res.cloudinary.com/fmxzphak/image/upload/v1788890028/ecommerce-products/gpj4ravzcy5jdfewlhx9.jpg"
                alt="Luxury Boski Fabrics"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 text-white">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.26em] text-[#E8C86A]">
                  ROYAL HERITAGE
                </span>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-serif mt-1 font-normal tracking-wide">
                  Luxury Boski &amp; Formal Fabrics
                </h3>
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-white/90 group-hover:text-white transition-colors">
                  <span>DISCOVER COLLECTION</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </div>
            </div>
          </Link>

          {/* Right Large Showcase: Premium Wash & Wear */}
          <Link
            href="/products/category/unstitched-fabric"
            className="group relative block w-full overflow-hidden bg-[#1E2229] cursor-pointer"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src="https://res.cloudinary.com/fmxzphak/image/upload/v1788630568/ecommerce-products/qddnzjm16r9mljo8gihe.jpg"
                alt="Summer Wash & Wear"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 text-white">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.26em] text-[#E8C86A]">
                  SIGNATURE WEAR
                </span>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-serif mt-1 font-normal tracking-wide">
                  Summer Wash &amp; Wear Edit
                </h3>
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-white/90 group-hover:text-white transition-colors">
                  <span>EXPLORE STYLES</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ─── 5. TRUST PILLARS BAR ─── */}
      <section className="bg-[#FAFAF8] py-8 sm:py-10">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
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
    </div>
  );
}