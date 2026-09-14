'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useInfiniteQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import ProductGrid from '@/components/ProductGrid';
import { FiSearch, FiX, FiFilter, FiChevronDown } from 'react-icons/fi';

const PRIMARY_CATEGORIES = [
  { name: 'All Products', slug: '' },
  { name: 'Unstitched Fabric', slug: 'Unstitched-Fabric' },
  { name: 'Stitched', slug: 'Stitched' },
  { name: 'Summer Collection', slug: 'Summer-Collection' },
  { name: 'Traditional', slug: 'Traditional' },
  { name: 'Winter Collection', slug: 'Winter-Collection' },
  { name: 'Festive Wear', slug: 'Festive-Wear' },
];

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subcategory, setSubcategory] = useState(searchParams.get('category') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'recommended');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSubcategory(cat);
    const sort = searchParams.get('sortBy');
    if (sort) setSortBy(sort);
  }, [searchParams]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['products', { subcategory, search, sortBy }],
    queryFn: ({ pageParam = 1 }) => {
      const trimmedSearch = search.trim();
      return productService.getAll({
        page: pageParam as number,
        limit: 20,
        category: subcategory || undefined,
        subcategory: subcategory || undefined,
        search: trimmedSearch || undefined,
        sortBy,
      });
    },
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

  const clearFilters = () => {
    setSubcategory('');
    setSearch('');
    setSortBy('recommended');
  };

  const products = data?.pages.flatMap((page) => page?.data?.products || page?.products || []) || [];
  const firstPagePagination = data?.pages?.[0]?.data?.pagination || data?.pages?.[0]?.pagination;
  const totalItems = firstPagePagination?.total || products.length || 0;

  return (
    <div className="w-full min-h-[70vh] pb-14 bg-white text-stone-900">
      {/* ── 1. FULL WIDTH CATEGORY / ALL PRODUCTS BANNER matching Image 1 ── */}
      <div className="w-full mb-4 sm:mb-6">
        <div className="relative w-full overflow-hidden bg-stone-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/fmxzphak/image/upload/v1788891170/ecommerce-products/eki2qssmwkiagxn9fx5y.jpg"
            alt="All Products Collection Banner"
            className="w-full h-auto object-contain object-center block max-h-[500px] mx-auto"
          />
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
        {/* ── 2. BREADCRUMB matching Image 1 (Home > Category) ── */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-[13px] text-stone-500 mb-3 sm:mb-4">
          <Link href="/" className="hover:text-stone-900 transition-colors">
            Home
          </Link>
          <span className="text-stone-400 font-light">&gt;</span>
          <span className="font-normal text-stone-900 truncate">
            {subcategory ? subcategory : 'All Products'}
          </span>
        </nav>

        {/* ── 3. FILTER, SEARCH & SORT BAR matching Image 1 ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3 sm:pb-4 mb-5">
          {/* Left: Filter Toggle + Items count + Search */}
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-900 hover:text-black transition-colors cursor-pointer"
              aria-label="Toggle filters"
            >
              <FiFilter className="w-4 h-4 text-stone-700 stroke-[1.8]" />
              <span>Filter</span>
            </button>

            <span className="text-xs sm:text-sm text-stone-600">
              Items : <strong className="font-bold text-stone-950">{isLoading ? '—' : totalItems}</strong>
            </span>

            {/* Inline search input matching clean header styling */}
            <div className="relative flex items-center border border-stone-300 rounded px-2.5 py-1 text-xs sm:text-sm bg-white">
              <FiSearch className="w-3.5 h-3.5 text-stone-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-28 sm:w-44 bg-transparent outline-none text-xs sm:text-sm text-stone-800 placeholder:text-stone-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-stone-400 hover:text-stone-800 p-0.5"
                  aria-label="Clear search"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right: SORT BY dropdown in crisp rectangular border box matching Image 1 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 whitespace-nowrap hidden sm:inline">
              SORT BY
            </span>
            <div className="relative">
              <select
                id="products-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-stone-300 text-stone-900 text-xs sm:text-sm font-medium rounded-none pl-3 pr-8 py-1.5 sm:py-2 outline-none cursor-pointer hover:border-stone-500 transition-colors min-w-[130px]"
              >
                <option value="recommended">Featured</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
              <FiChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── 4. FILTER PILL DRAWER (opens on clicking Filter) ── */}
        {filterDrawerOpen && (
          <div className="mb-6 p-4 border border-stone-200 bg-stone-50/70 flex flex-wrap items-center gap-2.5 transition-all">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 mr-2">
              Categories:
            </span>
            {PRIMARY_CATEGORIES.map((cat) => {
              const isAll = cat.slug === '';
              const isActive = isAll ? !subcategory : subcategory.toLowerCase() === cat.name.toLowerCase() || subcategory.toLowerCase() === cat.slug.toLowerCase();

              return (
                <button
                  key={cat.slug || 'all'}
                  type="button"
                  onClick={() => setSubcategory(isAll ? '' : cat.name)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-none border transition-all ${
                    isActive
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}

            {(subcategory || search) && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
              >
                <FiX className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            )}
          </div>
        )}

        {/* ── 5. SEAMLESS ZERO-GAP PRODUCT GRID matching Image 2 ── */}
        <ProductGrid
          products={products}
          loading={isLoading}
          showGridControls={false}
          initialGridCols={4}
        />

        {/* ── INFINITE SCROLL TRIGGER ── */}
        <div ref={observerTarget} className="mt-8 flex justify-center py-6">
          {isFetchingNextPage ? (
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-stone-800 animate-bounce" />
              <div className="w-2.5 h-2.5 rounded-full bg-stone-800 animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2.5 h-2.5 rounded-full bg-stone-800 animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          ) : hasNextPage ? (
            <div className="h-8" />
          ) : products.length > 0 ? (
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest text-center">
              You have reached the end of the collection
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12 text-center text-stone-500 font-bold">Loading Top Threadz Catalog...</div>}>
      <ProductsPageContent />
    </Suspense>
  );
}

