'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import ProductGrid from '@/components/ProductGrid';
import { FiSearch, FiX } from 'react-icons/fi';

const SEASONAL_CATEGORIES = [
  'All',
  'Summer Collection',
  'Winter Collection',
  'Wedding',
  'Formal',
  'Semi-Formal',
  'Casual',
  'Office Wear',
  'Festive Wear',
  'Jummah Collection',
  'Traditional',
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
        limit: 12,
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

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productService.getCategories(),
  });

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
  const backendCategories: string[] = categoriesData?.data || [];

  // Merge backend categories with our seasonal list (deduped)
  const allCategoryOptions = (() => {
    const merged = new Set<string>(SEASONAL_CATEGORIES);
    backendCategories.forEach((cat) => merged.add(cat));
    return Array.from(merged);
  })();

  const handleCategoryPill = (cat: string) => {
    setSubcategory(cat === 'All' ? '' : cat);
  };

  const activeCategory = subcategory || 'All';

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-6">
      {/* ── CATEGORY PILL TABS ── */}
      <div className="mb-6 overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex items-center gap-2 pb-2 min-w-max">
          {allCategoryOptions.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryPill(cat)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all border ${
                activeCategory === cat
                  ? 'bg-surface-950 text-white border-surface-950 shadow-md'
                  : 'bg-white text-surface-700 border-surface-300 hover:border-surface-500 hover:bg-surface-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── SEARCH + SORT BAR ── */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <div className="h-11 rounded-xl border border-surface-300 bg-white flex items-center px-4 gap-2 shadow-sm">
            <FiSearch className="w-4 h-4 text-surface-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by product or fabric..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSearchSuggestions(true);
              }}
              onFocus={() => setShowSearchSuggestions(true)}
              className="w-full bg-transparent outline-none text-sm font-medium text-surface-800 placeholder:text-surface-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSearchSuggestions([]);
                  setShowSearchSuggestions(false);
                }}
                className="text-surface-400 hover:text-surface-700"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Suggestions Dropdown */}
          {showSearchSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute z-20 mt-2 w-full bg-white border border-surface-200 rounded-xl shadow-soft-md max-h-72 overflow-auto">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.id}-${index}`}
                  type="button"
                  onClick={() => {
                    setShowSearchSuggestions(false);
                    setSearch('');
                    router.push(`/products/${suggestion.id}`);
                  }}
                  className="w-full text-left px-3 py-2.5 hover:bg-surface-50 transition-colors"
                >
                  <p className="text-sm font-medium text-surface-700 line-clamp-1">{suggestion.name}</p>
                  <p className="text-xs text-surface-400">PKR {Math.round(suggestion.price || 0).toLocaleString()}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort */}
        <div className="h-11 rounded-xl border border-surface-300 bg-white flex items-center px-4 shadow-sm min-w-[180px] sm:max-w-[220px]">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-surface-700 outline-none"
            id="sort-select"
          >
            <option value="newest">Newest</option>
            <option value="recommended">Recommended</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        {/* Clear */}
        {(subcategory || search) && (
          <button
            onClick={clearFilters}
            className="h-11 rounded-xl border border-surface-300 bg-white px-4 text-sm font-semibold text-surface-600 hover:bg-surface-50 hover:border-surface-400 transition-all flex items-center gap-2 shadow-sm shrink-0"
          >
            <FiX className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* ── ITEM COUNT ── */}
      <div className="mb-4 flex items-center justify-between text-surface-600 font-semibold text-sm px-1">
        <span>{(firstPagePagination?.total || products.length || 0).toLocaleString()} items</span>
        {subcategory && (
          <span className="inline-flex items-center gap-2 rounded-full border border-surface-300 px-3 py-1 text-xs font-semibold text-surface-800 bg-white">
            {subcategory}
            <button
              type="button"
              className="text-surface-500 hover:text-surface-700"
              onClick={() => setSubcategory('')}
              aria-label="Clear subcategory filter"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          </span>
        )}
      </div>

      {/* ── PRODUCTS GRID ── */}
      <div className="flex-1">
        <ProductGrid products={products} loading={isLoading} />

        {/* Infinite Scroll Trigger */}
        <div ref={observerTarget} className="mt-8 flex justify-center py-6">
          {isFetchingNextPage ? (
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-surface-400 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-surface-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 rounded-full bg-surface-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          ) : hasNextPage ? (
            <div className="h-8" />
          ) : products.length > 0 ? (
            <p className="text-sm font-semibold text-surface-400 uppercase tracking-widest">End of Results</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8">Loading products...</div>}>
      <ProductsPageContent />
    </Suspense>
  );
}
