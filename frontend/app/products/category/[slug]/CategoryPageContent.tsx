'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import ProductGrid from '@/components/ProductGrid';
import { FiChevronLeft, FiSliders } from 'react-icons/fi';

interface Props {
  slug: string;
}

export default function CategoryPageContent({ slug }: Props) {
  const rawSlug = decodeURIComponent(slug || '');
  const categoryName = rawSlug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const [sortBy, setSortBy] = useState('newest');
  const observerTarget = useRef<HTMLDivElement>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['products', 'category', slug, sortBy],
    queryFn: ({ pageParam = 1 }) =>
      productService.getAll({
        page: pageParam as number,
        limit: 16,
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

  return (
    <div className="max-w-[1536px] mx-auto px-3 sm:px-6 py-4 sm:py-6 min-h-[70vh]">
      {/* Category Header Banner */}
      <div className="mb-6 rounded-2xl bg-white border border-surface-200/90 p-4 sm:p-6 shadow-soft flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-surface-500">
              Top Threadz Collection
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl md:text-4xl font-display font-bold text-surface-950 uppercase tracking-tight">
            {categoryName}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-surface-600 font-medium">
            {isLoading ? 'Loading catalog...' : `${totalItems.toLocaleString()} premium suit${totalItems !== 1 ? 's' : ''} available`}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="h-10 rounded-xl border border-surface-300 bg-white px-3 flex items-center shadow-xs">
            <span className="text-xs font-semibold text-surface-500 mr-2 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-bold text-surface-900 outline-none cursor-pointer"
              id={`sort-select-${slug}`}
            >
              <option value="newest">Newest Drops</option>
              <option value="recommended">Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          <Link
            href="/products"
            className="h-10 rounded-xl border border-surface-300 bg-surface-50 hover:bg-white px-3.5 text-xs sm:text-sm font-bold text-surface-800 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <FiChevronLeft className="w-4 h-4" />
            <span>All Fabrics</span>
          </Link>
        </div>
      </div>

      {/* Product Grid */}
      <ProductGrid products={products} loading={isLoading} showGridControls={true} initialGridCols={4} />

      {/* Infinite Scroll Trigger */}
      <div ref={observerTarget} className="mt-8 flex justify-center py-6">
        {isFetchingNextPage ? (
          <div className="flex gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-surface-800 animate-bounce" />
            <div className="w-2.5 h-2.5 rounded-full bg-surface-800 animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-surface-800 animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        ) : hasNextPage ? (
          <div className="h-8" />
        ) : products.length > 0 ? (
          <p className="text-xs font-bold text-surface-500 uppercase tracking-widest text-center">
            End of {categoryName} Catalog
          </p>
        ) : null}
      </div>
    </div>
  );
}
