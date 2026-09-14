'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import api from '@/services/api';
import ProductCard from '@/components/ProductCard';
import ScrollReveal from '@/components/ScrollReveal';
import { resolveImageUrl } from '@/lib/images';
import { FiChevronDown, FiSliders, FiPackage } from 'react-icons/fi';

interface Props {
  slug: string;
}

export default function CategoryPageContent({ slug }: Props) {
  const rawSlug = decodeURIComponent(slug || '');
  const categoryName = rawSlug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const [sortBy, setSortBy] = useState('recommended');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch categories client-side to read custom banners uploaded by admin
  const { data: categoriesData } = useQuery({
    queryKey: ['categories-client'],
    queryFn: () => api.get('/categories').then((r) => r.data?.data || r.data || []),
    staleTime: 60 * 1000,
  });

  const matchedCategory = (categoriesData || []).find(
    (c: any) =>
      c.slug?.toLowerCase() === rawSlug.toLowerCase() ||
      c.name?.toLowerCase() === categoryName.toLowerCase()
  );

  const bannerUrl = matchedCategory?.bannerImage || matchedCategory?.coverImage || null;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['products', 'category', slug, sortBy],
    queryFn: ({ pageParam = 1 }) =>
      productService.getAll({
        page: pageParam as number,
        limit: 20,
        category: categoryName,
        sortBy,
      }),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.data?.pagination || lastPage?.pagination;
      if (!pagination) return undefined;
      return pagination.page < pagination.totalPages ? Number(pagination.page) + 1 : undefined;
    },
    initialPageParam: 1,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const products = data?.pages.flatMap((page) => page?.data?.products || page?.products || []) || [];
  const firstPagePagination = data?.pages?.[0]?.data?.pagination || data?.pages?.[0]?.pagination;
  const totalItems = firstPagePagination?.total || products.length || 0;

  // Dynamic desktop column system:
  // - 2 products => 2 columns
  // - 3 products => 3 columns
  // - 4 or more products => 4 columns (max 4 on desktop, never 5!)
  // - Mobile: strictly 2 columns (grid-cols-2)
  const productCount = products.length;
  const desktopGridCols =
    productCount === 2
      ? 'lg:grid-cols-2'
      : productCount === 3
        ? 'lg:grid-cols-3'
        : 'lg:grid-cols-4';

  return (
    <div className="w-full min-h-[70vh] pb-12">
      {/* ── 1. FULL WIDTH CATEGORY BANNER (Like Image 1) ── */}
      <div className="w-full mb-4 sm:mb-6">
        {bannerUrl ? (
          <div className="relative w-full aspect-[4/1] min-h-[160px] sm:min-h-[240px] md:min-h-[320px] lg:min-h-[420px] overflow-hidden bg-surface-100 dark:bg-[#1A1D24]">
            <Image
              src={resolveImageUrl(bannerUrl)}
              alt={`${categoryName} Collection Banner`}
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
          </div>
        ) : (
          /* Editorial fallback banner with gold accent & premium styling */
          <div className="relative w-full aspect-[4/1] min-h-[170px] sm:min-h-[250px] md:min-h-[330px] overflow-hidden bg-gradient-to-r from-[#0B1528] via-[#122240] to-[#0B1528] flex items-center justify-center text-center px-4">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4A84B] to-transparent" />
            <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-[#D4A84B]/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-[#D4A84B]">
                TOP THREADZ COLLECTION
              </span>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-black tracking-tight text-white uppercase">
                {categoryName}
              </h1>
              <p className="text-xs sm:text-sm text-white/70 tracking-wider font-light max-w-xl mx-auto">
                Fine fabric, cut to your signature look.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
        {/* ── 2. BREADCRUMB & CONTROLS (Like Image 1) ── */}
        <div className="mb-6">
          {/* Breadcrumb: Home > Sultan Unstitched Premium Fabric */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-[13px] text-surface-600 dark:text-surface-400 mb-3 sm:mb-4">
            <Link href="/" className="hover:text-surface-950 dark:hover:text-white transition-colors">
              Home
            </Link>
            <span className="text-surface-400 dark:text-surface-500 font-light">&gt;</span>
            <span className="font-semibold text-surface-900 dark:text-white truncate">
              {categoryName}
            </span>
          </nav>

          {/* Action row: Left: Filter + Items count, Right: SORT BY */}
          <div className="flex items-center justify-between gap-4 border-b border-surface-200 dark:border-[#2D3340] pb-3 sm:pb-4">
            {/* Filter + Items */}
            <div className="flex items-center gap-5 sm:gap-7">
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-surface-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                aria-label="Toggle filters"
              >
                <FiSliders className="w-4 h-4 text-surface-700 dark:text-surface-300" />
                <span>Filter</span>
              </button>
              <span className="text-xs sm:text-sm text-surface-800 dark:text-surface-200">
                Items : <strong className="font-bold text-surface-950 dark:text-white">{isLoading ? '—' : totalItems}</strong>
              </span>
            </div>

            {/* Sort by dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-surface-700 dark:text-surface-300 whitespace-nowrap hidden sm:inline">
                SORT BY
              </span>
              <div className="relative">
                <select
                  id={`sort-select-${slug}`}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white dark:bg-[#1A1D24] border border-surface-300 dark:border-[#2D3340] text-surface-900 dark:text-white text-xs sm:text-sm font-semibold rounded-md pl-3 pr-8 py-1.5 sm:py-2 outline-none cursor-pointer hover:border-surface-400 dark:hover:border-[#3E4656] transition-colors"
                >
                  <option value="recommended">Most Relevant</option>
                  <option value="newest">Newest Drops</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
                <FiChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Drawer / Quick Filter Pill Bar */}
        {filterDrawerOpen && (
          <div className="mb-6 p-4 rounded-xl border border-surface-200 dark:border-[#2D3340] bg-surface-50 dark:bg-[#20252F] flex flex-wrap items-center gap-3 animate-fadeIn">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-700 dark:text-surface-300 mr-2">
              Quick Filter:
            </span>
            <button
              type="button"
              onClick={() => setSortBy('recommended')}
              className={`px-3 py-1.5 text-xs rounded-full font-semibold transition-all ${
                sortBy === 'recommended'
                  ? 'bg-surface-950 text-white dark:bg-white dark:text-surface-950 shadow-sm'
                  : 'bg-white dark:bg-[#1A1D24] border border-surface-200 dark:border-[#2D3340] text-surface-700 dark:text-surface-300 hover:border-surface-400'
              }`}
            >
              Featured
            </button>
            <button
              type="button"
              onClick={() => setSortBy('newest')}
              className={`px-3 py-1.5 text-xs rounded-full font-semibold transition-all ${
                sortBy === 'newest'
                  ? 'bg-surface-950 text-white dark:bg-white dark:text-surface-950 shadow-sm'
                  : 'bg-white dark:bg-[#1A1D24] border border-surface-200 dark:border-[#2D3340] text-surface-700 dark:text-surface-300 hover:border-surface-400'
              }`}
            >
              New Arrivals
            </button>
            <button
              type="button"
              onClick={() => setSortBy('price_asc')}
              className={`px-3 py-1.5 text-xs rounded-full font-semibold transition-all ${
                sortBy === 'price_asc'
                  ? 'bg-surface-950 text-white dark:bg-white dark:text-surface-950 shadow-sm'
                  : 'bg-white dark:bg-[#1A1D24] border border-surface-200 dark:border-[#2D3340] text-surface-700 dark:text-surface-300 hover:border-surface-400'
              }`}
            >
              Budget (Low to High)
            </button>
            <button
              type="button"
              onClick={() => setSortBy('price_desc')}
              className={`px-3 py-1.5 text-xs rounded-full font-semibold transition-all ${
                sortBy === 'price_desc'
                  ? 'bg-surface-950 text-white dark:bg-white dark:text-surface-950 shadow-sm'
                  : 'bg-white dark:bg-[#1A1D24] border border-surface-200 dark:border-[#2D3340] text-surface-700 dark:text-surface-300 hover:border-surface-400'
              }`}
            >
              Luxury (High to Low)
            </button>
          </div>
        )}

        {/* ── 3. DYNAMIC PRODUCTS GRID (Zero Space Between Grids) ── */}
        {isLoading ? (
          /* Seamless skeleton with gap-0 and dividing borders */
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 border-t border-l border-surface-200 dark:border-[#2D3340]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="border-b border-r border-surface-200 dark:border-[#2D3340] p-3 sm:p-4 bg-white dark:bg-[#1A1D24]"
              >
                <div className="aspect-[3/4] bg-surface-100 dark:bg-[#252A34] relative overflow-hidden rounded-lg">
                  <div className="absolute inset-0 shimmer" />
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-2.5 w-16 bg-surface-200 dark:bg-[#2E3544] rounded-full animate-pulse" />
                  <div className="h-3.5 w-full bg-surface-200 dark:bg-[#2E3544] rounded-full animate-pulse" />
                  <div className="h-4 w-24 bg-surface-200 dark:bg-[#2E3544] rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty state */
          <div className="py-16 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-[#222731] flex items-center justify-center mx-auto mb-4 text-surface-400">
              <FiPackage className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-1">
              No products found in this category
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400 mb-6">
              New drops for {categoryName} are currently being curated for Top Threadz.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 btn-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          /* Seamless Product Grid with dynamic desktop columns and zero gap */
          <div
            className={`grid grid-cols-2 ${desktopGridCols} gap-0 border-t border-l border-surface-200 dark:border-[#2D3340]`}
          >
            {products.map((product, i) => (
              <div
                key={product.id}
                className="border-b border-r border-surface-200 dark:border-[#2D3340] p-2.5 sm:p-4 bg-white dark:bg-[#1A1D24] transition-colors"
              >
                <ScrollReveal
                  delay={(i % 4) * 80}
                  animation="slide-up"
                >
                  <ProductCard {...product} imageFit="full" />
                </ScrollReveal>
              </div>
            ))}
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        <div ref={observerTarget} className="mt-8 flex justify-center py-4">
          {isFetchingNextPage ? (
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-surface-800 dark:bg-white animate-bounce" />
              <div
                className="w-2.5 h-2.5 rounded-full bg-surface-800 dark:bg-white animate-bounce"
                style={{ animationDelay: '0.2s' }}
              />
              <div
                className="w-2.5 h-2.5 rounded-full bg-surface-800 dark:bg-white animate-bounce"
                style={{ animationDelay: '0.4s' }}
              />
            </div>
          ) : hasNextPage ? (
            <div className="h-6" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
