'use client';

import { useEffect, useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import ScrollReveal from './ScrollReveal';

interface Product {
  id: string;
  name: string;
  price: number;
  discount: number;
  images: string[];
  category: string;
  slug: string;
  sizes?: string[];
  colors?: string[];
  imageMeta?: Array<{
    url: string;
    alt?: string;
    isPrimary?: boolean;
  }>;
}

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  showGridControls?: boolean;
}

export default function ProductGrid({
  products,
  loading,
  showGridControls = true,
}: ProductGridProps) {
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(4);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const uniqueProducts = useMemo(() => {
    const seen = new Set<string>();
    return products.filter((product) => {
      if (seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    });
  }, [products]);

  const desktopGridClass =
    gridCols === 2
      ? 'md:grid-cols-2 lg:grid-cols-2'
      : gridCols === 3
        ? 'md:grid-cols-3 lg:grid-cols-3'
        : 'md:grid-cols-3 lg:grid-cols-4';

  const gridClass = `grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6 ${desktopGridClass}`;

  const renderSkeletonGrid = () => (
    <div className={gridClass}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden bg-white border border-surface-100">
          <div className="aspect-[3/4] bg-surface-100 relative overflow-hidden">
            <div className="absolute inset-0 shimmer" />
          </div>
          <div className="p-4 space-y-2.5">
            <div className="h-2.5 w-16 bg-surface-200 rounded-full animate-pulse" />
            <div className="h-3.5 w-full bg-surface-200 rounded-full animate-pulse" />
            <div className="h-3.5 w-3/4 bg-surface-200 rounded-full animate-pulse" />
            <div className="h-5 w-24 bg-surface-200 rounded-full animate-pulse mt-1" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderGridControls = () => (
    <div className="mb-5 hidden md:flex items-center justify-between border-b border-surface-200 pb-3">
      <span className="text-xs font-bold uppercase tracking-wider text-surface-500">
        Grid Layout Controls
      </span>
      <div className="inline-flex items-center gap-1.5 rounded-full border border-surface-300 bg-white p-1 shadow-sm">
        <span className="px-2 text-xs font-semibold text-surface-600">Columns:</span>
        {([2, 3, 4] as const).map((cols) => (
          <button
            key={cols}
            type="button"
            onClick={() => setGridCols(cols)}
            className={`h-8 w-8 rounded-full text-xs font-bold transition-all ${
              gridCols === cols
                ? 'bg-surface-950 text-white shadow-md scale-105'
                : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
            }`}
            aria-label={`Show ${cols} column grid`}
            title={`${cols} Columns`}
          >
            {cols}
          </button>
        ))}
      </div>
    </div>
  );

  if (!isMounted || loading) {
    return (
      <div>
        {showGridControls && isMounted ? renderGridControls() : null}
        {renderSkeletonGrid()}
      </div>
    );
  }

  if (uniqueProducts.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-3xl">No Items</span>
        </div>
        <p className="text-surface-500 text-lg font-medium">No products found</p>
        <p className="text-surface-400 text-sm mt-1">Try adjusting your filters or search</p>
      </div>
    );
  }

  return (
    <div>
      {showGridControls && isMounted ? renderGridControls() : null}
      <div className={gridClass}>
        {uniqueProducts.map((product, i) => (
          <ScrollReveal
            key={product.id}
            delay={(i % gridCols) * 100}
            animation="slide-up"
          >
            <ProductCard {...product} />
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
