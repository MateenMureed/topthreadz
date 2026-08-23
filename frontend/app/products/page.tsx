'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import ProductGrid from '@/components/ProductGrid';
import { FiGrid, FiList, FiSearch, FiSliders, FiX } from 'react-icons/fi';
import { isBackendUploadUrl, resolveImageUrl } from '@/lib/images';

const SIZE_OPTIONS = ['1.5 Meter', '2.5 Meter', '3.5 Meter', '4.5 Meter', '5 Meter'];
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
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [brand, setBrand] = useState(searchParams.get('brand') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{ id: string; name: string; price: number; images?: string[] }>>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [useAiSearch, setUseAiSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [size, setSize] = useState('');
  const [minDiscount, setMinDiscount] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState('newest');

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setCategory(cat);
    const selectedBrand = searchParams.get('brand');
    if (selectedBrand) setBrand(selectedBrand);
    const discount = searchParams.get('minDiscount');
    if (discount) {
      const parsed = Number(discount);
      if (!Number.isNaN(parsed)) setMinDiscount(parsed);
    }
  }, [searchParams]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['products', { category, brand, search, minPrice, maxPrice, size, minDiscount, sortBy, useAiSearch }],
    queryFn: ({ pageParam = 1 }) => {
      const trimmedSearch = search.trim();
      if (useAiSearch && trimmedSearch) {
        return productService.aiSearch({ q: trimmedSearch, page: pageParam as number, limit: 12 });
      }
      return productService.getAll({
        page: pageParam as number,
        limit: 12,
        category,
        brand: brand || undefined,
        search: trimmedSearch || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        size: size || undefined,
        minDiscount: minDiscount === '' ? undefined : minDiscount,
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
    setCategory('');
    setBrand('');
    setSearch('');
    setSearchSuggestions([]);
    setShowSearchSuggestions(false);
    setMinPrice('');
    setMaxPrice('');
    setSize('');
    setMinDiscount('');
    setSortBy('newest');
    setUseAiSearch(false);
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
  const categories = categoriesData?.data || [];

  const saleHighlightItems = [
    { label: 'Just In: Sale', minDiscount: 1 },
    { label: 'Just In: 20%', minDiscount: 20 },
    { label: 'Just In: 30%', minDiscount: 30 },
    { label: 'Just In: 40%', minDiscount: 40 },
    { label: 'Just In: 50%', minDiscount: 50 },
    { label: 'Flat 70%', minDiscount: 70 },
  ];

  const circleProducts = products.slice(0, saleHighlightItems.length);

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-center gap-3 sm:gap-6 pb-2 px-2">
        {saleHighlightItems.map((item, index) => {
          const sampleProduct = circleProducts[index];
          const isActive = minDiscount === item.minDiscount;
          const sampleImage = resolveImageUrl(sampleProduct?.images?.[0]);

          return (
            <button
              key={item.label}
              onClick={() => {
                setMinDiscount(item.minDiscount);
              }}
              className="min-w-[70px] sm:min-w-[96px] md:min-w-[102px] lg:min-w-[110px] flex flex-col items-center gap-1 sm:gap-2"
            >
              <span className={`relative w-14 h-14 sm:w-20 sm:h-20 md:w-[86px] md:h-[86px] lg:w-24 lg:h-24 rounded-full overflow-hidden border-2 transition-all ${
                isActive ? 'border-surface-800 shadow-soft' : 'border-surface-200 hover:border-surface-400'
              }`}>
                {sampleImage ? (
                  <Image
                    src={sampleImage}
                    alt={item.label}
                    fill
                    unoptimized={isBackendUploadUrl(sampleImage)}
                    sizes="(max-width: 640px) 56px, (max-width: 768px) 80px, (max-width: 1024px) 86px, 96px"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="w-full h-full block bg-gradient-to-br from-surface-100 to-surface-300" />
                )}
              </span>
              <span className="text-[10px] sm:text-xs md:text-[13px] lg:text-sm text-surface-700 max-w-[68px] sm:max-w-[84px] md:max-w-[96px] lg:max-w-none text-center leading-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setShowMobileFilters((prev) => !prev)}
        className="w-full md:hidden h-12 rounded-xl border border-surface-300 bg-white shadow-soft font-semibold text-surface-800 flex items-center justify-center gap-2 mb-6"
      >
        <FiSliders className="w-4 h-4" />
        {showMobileFilters ? 'Hide Filters' : 'Show Filters & Sort'}
      </button>

      <div className={`mb-8 flex flex-col md:grid md:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] gap-3 md:items-center ${showMobileFilters ? 'flex' : 'hidden md:grid'}`}>
        <div className="h-11 rounded-xl border border-surface-300 bg-white flex items-center px-4 gap-2">
          <FiSliders className="w-4 h-4 text-surface-500" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-surface-700 outline-none"
          >
            <option value="">Filter by Category</option>
            {categories.map((cat: string) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="h-11 rounded-xl border border-surface-300 bg-white flex items-center px-4">
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

        <div className="hidden lg:block text-2xl font-semibold text-surface-800 tracking-tight px-2">
          {(firstPagePagination?.total || products.length || 0).toLocaleString()}<span className="text-lg font-medium ml-1">items</span>
        </div>

        <div className="hidden lg:flex items-center justify-end gap-3 px-2 text-surface-600">
          <FiList className="w-6 h-6" />
          <FiGrid className="w-6 h-6" />
        </div>
      </div>

      {brand ? (
        <div className="mb-5 flex items-center gap-2">
          <span className="text-sm font-semibold text-surface-700">Brand:</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-surface-300 px-3 py-1 text-sm font-semibold text-surface-800">
            {brand}
            <button
              type="button"
              className="text-surface-500 hover:text-surface-700"
              onClick={() => setBrand('')}
              aria-label="Clear brand filter"
            >
              <FiX className="w-4 h-4" />
            </button>
          </span>
        </div>
      ) : null}

      <div className={`mb-6 border border-surface-200 rounded-2xl bg-white p-4 ${showMobileFilters ? 'block' : 'hidden md:block'}`}>
        <div className="flex flex-wrap gap-3 md:gap-2.5 lg:gap-3 items-center">
          <div className="relative min-w-full sm:min-w-[260px] md:min-w-[280px] lg:min-w-[320px] flex-1">
            <div className="input-field !py-2 text-sm flex items-center gap-2">
              <FiSearch className="w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search by product or fabric"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSearchSuggestions(true);
                }}
                onFocus={() => setShowSearchSuggestions(true)}
                className="w-full bg-transparent outline-none"
              />
            </div>

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

          <input
            type="number"
            placeholder="Min price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="input-field !w-auto !py-2 text-sm min-w-[120px]"
          />

          <input
            type="number"
            placeholder="Max price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="input-field !w-auto !py-2 text-sm min-w-[120px]"
          />

          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="input-field !w-auto !py-2 text-sm min-w-[140px] md:min-w-[150px] lg:min-w-[170px]"
          >
            <option value="">All sizes</option>
            {SIZE_OPTIONS.map((sizeOption) => (
              <option key={sizeOption} value={sizeOption}>{sizeOption}</option>
            ))}
          </select>

          <select
            value={minDiscount === '' ? '' : String(minDiscount)}
            onChange={(e) => {
              const value = e.target.value;
              setMinDiscount(value === '' ? '' : Number(value));
            }}
            className="input-field !w-auto !py-2 text-sm min-w-[140px] md:min-w-[150px] lg:min-w-[160px]"
          >
            <option value="">All discounts</option>
            <option value="10">10% and above</option>
            <option value="20">20% and above</option>
            <option value="30">30% and above</option>
            <option value="40">40% and above</option>
            <option value="50">50% and above</option>
          </select>

          <button
            onClick={() => {
              setUseAiSearch((prev) => !prev);
            }}
            className={`btn-secondary !py-2 !px-3 text-sm whitespace-nowrap ${useAiSearch ? '!bg-brand-100 !text-brand-700 !border-brand-200' : ''}`}
            title="Enable natural language AI search"
          >
            AI Search
          </button>

          <button
            onClick={clearFilters}
            className="btn-secondary !py-2 !px-3 text-sm inline-flex items-center gap-2 whitespace-nowrap"
          >
            <FiX className="w-4 h-4" /> Clear
          </button>
        </div>
        {useAiSearch && search.trim() && (
          <p className="mt-3 text-xs text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
            AI search is active. You can type natural phrases like "summer pret under 5000 with 20% off".
          </p>
        )}
      </div>
      
      <div className="lg:hidden mb-4 flex items-center justify-between text-surface-600 font-semibold text-sm px-1">
        <span>{(firstPagePagination?.total || products.length || 0).toLocaleString()} items available</span>
      </div>

      {/* Products */}
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
