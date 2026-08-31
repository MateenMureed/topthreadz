'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import ProductGrid from '@/components/ProductGrid';
import { FiChevronLeft, FiX } from 'react-icons/fi';

interface Props {
  slug: string;
}

export default function CategoryPageContent({ slug }: Props) {
  const categoryName = decodeURIComponent(slug)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const [sortBy, setSortBy] = useState('newest');
  const observerTarget = useRef<HTMLDivElement>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['products', 'category', slug, sortBy],
    queryFn: ({ pageParam = 1 }) =>
      productService.getAll({
        page: pageParam as number,
        limit: 12,
        subcategory: categoryName,
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
    <div className="max-w-[1500px] mx-auto px-4 py-6 bg-[#fafafa] min-h-screen">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-slate-900 transition-colors font-semibold">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-slate-900 transition-colors font-semibold">Products</Link>
        <span>/</span>
        <span className="text-slate-900 font-bold">{categoryName}</span>
      </nav>

      {/* Page header */}
      <div className="mb-6 pb-5 border-b border-slate-200">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 mb-1">Collection</p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-950 uppercase tracking-tight">{categoryName}</h1>
            <p className="mt-1 text-sm text-slate-500 font-semibold">
              {isLoading ? 'Loading...' : `${totalItems.toLocaleString()} item${totalItems !== 1 ? 's' : ''}`}
            </p>
          </div>

          <div className="flex items-center gap-3 mt-1">
            {/* Sort */}
            <div className="h-10 rounded-xl border border-slate-300 bg-white flex items-center px-3 shadow-sm min-w-[160px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                id={`sort-select-${slug}`}
              >
                <option value="newest">Newest</option>
                <option value="recommended">Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            <Link
              href="/products"
              className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <FiChevronLeft className="w-4 h-4" />
              All
            </Link>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <ProductGrid products={products} loading={isLoading} showGridControls={false} initialGridCols={4} />

      {/* Infinite Scroll Trigger */}
      <div ref={observerTarget} className="mt-8 flex justify-center py-6">
        {isFetchingNextPage ? (
          <div className="flex gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700 animate-bounce" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700 animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700 animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        ) : hasNextPage ? (
          <div className="h-8" />
        ) : products.length > 0 ? (
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">End of Collection</p>
        ) : null}
      </div>
    </div>
  );
}
