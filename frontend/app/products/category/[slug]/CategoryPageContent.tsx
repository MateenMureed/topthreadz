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

// Premium category copy — catchy, brand-consistent one-liners per collection.
const CATEGORY_COPY: Record<string, { line: string; sub: string }> = {
  Unstitched: {
    line: 'Fine fabric, cut to your signature.',
    sub: 'Premium unstitched suit lengths — choose the cloth, own the fit.',
  },
  Stitched: {
    line: 'Ready to wear, tailored to impress.',
    sub: 'Finished menswear with a crisp, considered fit — straight from box to occasion.',
  },
  'Two Piece': {
    line: 'Two pieces. One sharp statement.',
    sub: 'Coordinated kameez & trouser sets for effortless polish.',
  },
  'Three Piece': {
    line: 'The complete ensemble.',
    sub: 'Kameez, trouser and dupatta/scarf — a full look, thoughtfully matched.',
  },
  Kids: {
    line: 'Little gentlemen, big style.',
    sub: 'Comfort-first kids\u2019 wear with the same premium finish.',
  },
  Kurta: {
    line: 'The everyday essential, elevated.',
    sub: 'Breathable kurtas for jummah, work and everything between.',
  },
  Boski: {
    line: 'Silk heritage, modern drape.',
    sub: 'Luxurious boski fabric with a naturally rich fall.',
  },
};

function categoryCopy(name: string) {
  return CATEGORY_COPY[name] || {
    line: 'Curated for the modern gentleman.',
    sub: 'Hand-selected pieces with the premium Top Threadz finish.',
  };
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
  const copy = categoryCopy(categoryName);

  return (
    <div className="max-w-[1536px] mx-auto px-3 sm:px-6 py-4 sm:py-6 min-h-[70vh]">
      {/* Premium Category Hero — compact so products are visible without scrolling */}
      <div className="mb-4 sm:mb-5 rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-[#0F1F3D] via-[#152A52] to-[#0F1F3D] relative shadow-soft">
        {/* Gold stitch accent */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4A84B]/80 to-transparent" />
        <div className="absolute -right-10 -bottom-16 w-48 h-48 rounded-full bg-[#D4A84B]/10 blur-3xl pointer-events-none" />

        <div className="relative px-5 sm:px-8 py-5 sm:py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-[#E8C86A]">
              Top Threadz Collection
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
              {categoryName}
            </h1>
            <p className="mt-1 text-[13px] sm:text-sm font-medium text-white/85 italic">
              “{copy.line}”
            </p>
            <p className="mt-0.5 text-[11px] sm:text-xs text-white/55 max-w-xl">
              {copy.sub}
            </p>
          </div>

          {/* Counts + controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="rounded-xl bg-white/10 border border-white/15 px-3.5 py-2 hidden sm:block">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/50">Pieces</p>
              <p className="text-sm font-bold text-white leading-none mt-0.5">
                {isLoading ? '—' : totalItems.toLocaleString()}
              </p>
            </div>

            <div className="h-10 rounded-xl border border-white/20 bg-white/10 px-3 flex items-center backdrop-blur-sm">
              <span className="text-xs font-semibold text-white/60 mr-2 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-bold text-white outline-none cursor-pointer [&>option]:text-surface-900"
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
              className="h-10 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3.5 text-xs sm:text-sm font-bold text-white transition-all flex items-center gap-1.5 backdrop-blur-sm"
            >
              <FiChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">All Collections</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Product Grid — 5 columns on wide screens so full products show above the fold */}
      <ProductGrid products={products} loading={isLoading} showGridControls={true} initialGridCols={5} imageFit="full" />

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
