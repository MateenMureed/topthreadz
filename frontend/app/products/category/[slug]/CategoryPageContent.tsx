'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import ProductCard from '@/components/ProductCard';
import ScrollReveal from '@/components/ScrollReveal';
import { FiChevronDown, FiSliders, FiPackage } from 'react-icons/fi';

interface Props {
  slug: string;
  /** Server-fetched first page — keeps the product grid inside the initial HTML. */
  initialProducts?: any[];
  initialPagination?: any | null;
  /** Server-resolved banner image so the banner never depends on a client fetch. */
  bannerUrl?: string | null;
}

export default function CategoryPageContent({
  slug,
  initialProducts,
  initialPagination,
  bannerUrl,
}: Props) {
  const rawSlug = decodeURIComponent(slug || '');
  const categoryName = rawSlug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const [sortBy, setSortBy] = useState('recommended');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // How many items were already server-rendered. Cards below this index are
  // only reachable via infinite scroll, so they keep their reveal animation.
  const ssrCount = Array.isArray(initialProducts) ? initialProducts.length : 0;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['products', 'category', slug, sortBy],
    queryFn: ({ pageParam = 1 }) =>
      productService.getAll({
        page: pageParam as number,
        limit: 20,
        category: categoryName,
        sortBy,
      }),
    // Seed the query with the server-rendered first page: hydration renders
    // the real grid immediately (no skeleton flash, no "Loading..." state in
    // the initial HTML) and infinite scroll continues from correct state.
    // An explicitly empty server page (pagination present, zero items) is also
    // seeded, so categories with no products show the honest empty state in
    // the initial HTML instead of a loading skeleton.
    initialData:
      ssrCount > 0 || (Array.isArray(initialProducts) && initialPagination)
        ? {
            pages: [
              {
                data: {
                  products: initialProducts,
                  pagination:
                    initialPagination || {
                      page: 1,
                      totalPages: 1,
                      total: initialProducts!.length,
                    },
                },
              },
            ],
            pageParams: [1],
          }
        : undefined,
    initialDataUpdatedAt: ssrCount > 0 || (Array.isArray(initialProducts) && initialPagination) ? Date.now() : undefined,
    staleTime: 60 * 1000,
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
    <div className="w-full pb-2">
      {/* ── CONTROLS: Left: Filter + Items count, Right: SORT BY ── */}
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

        {/* ── 3. DYNAMIC PRODUCTS GRID (Zero-Gap Layout Matching Image 2) ── */}
        {isLoading ? (
          /* Seamless skeleton with matching 0 gap */
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 border-t border-l border-stone-200/80 dark:border-[#2D3340] w-full">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="border-r border-b border-stone-200/80 dark:border-[#2D3340] bg-white dark:bg-[#1A1D24]"
              >
                <div className="aspect-[3/4] bg-surface-100 dark:bg-[#252A34] relative overflow-hidden">
                  <div className="absolute inset-0 shimmer" />
                </div>
                <div className="p-3 space-y-2 text-center">
                  <div className="h-3 w-3/4 bg-surface-200 dark:bg-[#2E3544] rounded-full mx-auto animate-pulse" />
                  <div className="h-3.5 w-20 bg-surface-200 dark:bg-[#2E3544] rounded-full mx-auto animate-pulse" />
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
          /* Product Grid matching Image 2 with zero gap and border separation */
          <div
            className={`grid grid-cols-2 ${desktopGridCols} gap-0 border-t border-l border-stone-200/80 dark:border-[#2D3340] w-full`}
          >
            {products.map((product, i) => {
              const card = <ProductCard {...product} imageFit="cover" />;
              return (
                <div
                  key={product.id}
                  className="border-r border-b border-stone-200/80 dark:border-[#2D3340] bg-white dark:bg-[#1E2228]"
                >
                  {/* Server-rendered cards render fully visible so the initial
                      HTML carries real content; only infinite-scroll cards
                      (fetched client-side) get the reveal animation. */}
                  {i < ssrCount ? (
                    card
                  ) : (
                    <ScrollReveal delay={(i % 4) * 60} animation="slide-up">
                      {card}
                    </ScrollReveal>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        <div ref={observerTarget} className="mt-4 flex justify-center py-2">
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
    );
  }