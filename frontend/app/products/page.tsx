'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import ProductGrid from '@/components/ProductGrid';
import { FiSearch, FiX, FiFilter, FiCheck } from 'react-icons/fi';

const PRIMARY_CATEGORIES = [
  { name: 'All Products', slug: '' },
  { name: 'Unstitched Fabric', slug: 'Unstitched-Fabric' },
  { name: 'Stitched', slug: 'Stitched' },
  { name: 'Summer Collection', slug: 'Summer-Collection' },
  { name: 'Traditional', slug: 'Traditional' },
  { name: 'Winter Collection', slug: 'Winter-Collection' },
  { name: 'Festive Wear', slug: 'Festive-Wear' },
];

const dedupeSuggestions = (items: Array<{ id: string; name: string; price: number; images?: string[] }>) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subcategory, setSubcategory] = useState(searchParams.get('category') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{ id: string; name: string; price: number; images?: string[] }>>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');

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
        limit: 16,
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
    setSearchSuggestions([]);
    setShowSearchSuggestions(false);
    setSortBy('newest');
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search.trim().length < 2) {
        setSearchSuggestions([]);
        return;
      }

      try {
        const res = await productService.getSuggestions(search.trim());
        setSearchSuggestions(dedupeSuggestions((res.data || []) as Array<{ id: string; name: string; price: number; images?: string[] }>));
      } catch {
        setSearchSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  const products = data?.pages.flatMap((page) => page?.data?.products || page?.products || []) || [];
  const firstPagePagination = data?.pages?.[0]?.data?.pagination || data?.pages?.[0]?.pagination;
  const totalItems = firstPagePagination?.total || products.length || 0;

  return (
    <div className="max-w-[1536px] mx-auto px-3 sm:px-6 py-4 sm:py-8 bg-[#fafafa]">
      {/* ── HEADER BANNER ── */}
      <div className="mb-6 rounded-2xl bg-white border border-surface-200/90 p-4 sm:p-7 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-surface-500">
              Top Threadz Store
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl md:text-4xl font-display font-bold text-surface-950 uppercase tracking-tight">
              {subcategory ? `${subcategory} Collection` : 'All Menswear & Fabrics'}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-surface-600 font-medium max-w-xl leading-relaxed">
              Explore 4.5m unstitched wash & wear fabrics, Boski, and tailored ready-to-wear kurtas crafted with fine Pakistani tailoring.
            </p>
          </div>

          <div className="text-left md:text-right shrink-0">
            <span className="inline-block rounded-full bg-surface-100 px-3.5 py-1 text-xs font-bold text-surface-800 border border-surface-200">
              {isLoading ? 'Loading items...' : `${totalItems.toLocaleString()} Products Available`}
            </span>
          </div>
        </div>
      </div>

      {/* ── CATEGORY DIRECT LINKS (SEO Landing Hub) ── */}
      <div className="mb-6 overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2 pb-2 min-w-max">
          {PRIMARY_CATEGORIES.map((cat) => {
            const isAll = cat.slug === '';
            const isActive = isAll ? !subcategory : subcategory.toLowerCase() === cat.name.toLowerCase() || subcategory.toLowerCase() === cat.slug.toLowerCase();

            if (isAll) {
              return (
                <button
                  key="all"
                  type="button"
                  onClick={() => setSubcategory('')}
                  className={`min-h-11 rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition-all border ${
                    isActive
                      ? 'bg-surface-950 text-white border-surface-950 shadow-sm'
                      : 'bg-white text-surface-700 border-surface-300 hover:border-surface-600 hover:bg-surface-50'
                  }`}
                >
                  All Products
                </button>
              );
            }

            return (
              <Link
                key={cat.slug}
                href={`/products/category/${cat.slug}`}
                className={`min-h-11 inline-flex items-center rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition-all border ${
                  isActive
                    ? 'bg-surface-950 text-white border-surface-950 shadow-sm'
                    : 'bg-white text-surface-700 border-surface-300 hover:border-surface-600 hover:bg-surface-50'
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── SEARCH & SORT CONTROLS ── */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <div className="min-h-11 rounded-xl border border-surface-300 bg-white flex items-center px-3.5 gap-2.5 shadow-xs">
            <FiSearch className="w-4 h-4 text-surface-500 shrink-0" />
            <input
              id="product-search"
              name="product-search"
              type="text"
              placeholder="Search by fabric, color, or style..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSearchSuggestions(true);
              }}
              onFocus={() => setShowSearchSuggestions(true)}
              className="w-full bg-transparent outline-none text-xs sm:text-sm font-semibold text-surface-900 placeholder:text-surface-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSearchSuggestions([]);
                  setShowSearchSuggestions(false);
                }}
                className="text-surface-400 hover:text-surface-900 p-1"
                aria-label="Clear search"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Suggestions Dropdown */}
          {showSearchSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute z-30 mt-2 w-full bg-white border border-surface-300 rounded-xl shadow-xl max-h-72 overflow-auto">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.id}-${index}`}
                  type="button"
                  onClick={() => {
                    setShowSearchSuggestions(false);
                    setSearch('');
                    router.push(`/products/${suggestion.id}`);
                  }}
                  className="w-full text-left px-4 py-3 border-b border-surface-100 last:border-0 hover:bg-surface-50 transition-colors flex items-center justify-between"
                >
                  <span className="text-sm font-bold text-surface-950 line-clamp-1">{suggestion.name}</span>
                  <span className="text-xs font-black text-surface-700 shrink-0 ml-2">PKR {Math.round(suggestion.price || 0).toLocaleString()}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort Select */}
        <div className="min-h-11 rounded-xl border border-surface-300 bg-white flex items-center px-3 shadow-xs min-w-[170px] sm:max-w-[210px]">
          <span className="text-xs font-semibold text-surface-500 mr-2 shrink-0">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-transparent text-xs sm:text-sm font-bold text-surface-900 outline-none cursor-pointer"
            id="sort-select"
          >
            <option value="newest">Newest Drops</option>
            <option value="recommended">Featured / Best</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {(subcategory || search) && (
          <button
            type="button"
            onClick={clearFilters}
            className="min-h-11 rounded-xl border border-surface-300 bg-white px-4 text-xs sm:text-sm font-bold text-surface-800 hover:bg-surface-50 transition-all flex items-center justify-center gap-1.5 shadow-xs shrink-0"
          >
            <FiX className="w-4 h-4 text-surface-600" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* ── ACTIVE FILTERS ROW ── */}
      {subcategory && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-surface-500">Filtered by:</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-950 text-white px-3 py-1 text-xs font-bold shadow-xs">
            {subcategory}
            <button
              type="button"
              onClick={() => setSubcategory('')}
              className="hover:opacity-80 p-0.5"
              aria-label="Remove category filter"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
      )}

      {/* ── PRODUCT GRID ── */}
      <ProductGrid products={products} loading={isLoading} showGridControls={true} initialGridCols={4} />

      {/* ── INFINITE SCROLL LOADER ── */}
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
            You have reached the end of the collection
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12 text-center text-surface-600 font-bold">Loading Top Threadz Catalog...</div>}>
      <ProductsPageContent />
    </Suspense>
  );
}
