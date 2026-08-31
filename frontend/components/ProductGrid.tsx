'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FiPackage } from 'react-icons/fi';
import ProductCard from './ProductCard';
import ScrollReveal from './ScrollReveal';

interface Product {
  id: string;
  name: string;
  price: number;
  discount: number;
  images: string[];
  category: string;
  subcategory?: string;
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
  initialGridCols?: 2 | 3 | 4;
  gridControlsLabel?: string;
}

export default function ProductGrid({
  products,
  loading,
  showGridControls = true,
  initialGridCols = 4,
  gridControlsLabel,
}: ProductGridProps) {
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(initialGridCols);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (initialGridCols) {
      setGridCols(initialGridCols);
    }
  }, [initialGridCols]);

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
      ? 'sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2'
      : gridCols === 3
        ? 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3'
        : 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  const isSparse = uniqueProducts.length > 0 && uniqueProducts.length < gridCols;
  const gridClass = `grid grid-cols-2 gap-3.5 sm:gap-4 md:gap-5 lg:gap-6 ${desktopGridClass} ${isSparse ? 'justify-center mx-auto max-w-5xl' : ''}`;

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
    <div className="mb-5 hidden sm:flex flex-col gap-3 border-b border-surface-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
      {gridControlsLabel ? <h2 className="text-xl font-bold text-surface-950">{gridControlsLabel}</h2> : <span className="text-sm font-semibold text-surface-600">Choose a layout</span>}
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
            aria-pressed={gridCols === cols}
            title={`${cols} Columns`}
          >
            {cols}
          </button>
        ))}
      </div>
    </div>
  );

  const renderPlaceholderCard = () => (
    <div className="rounded-2xl border-2 border-dashed border-surface-300 bg-surface-50/70 p-6 sm:p-8 text-center flex flex-col items-center justify-center min-h-[380px] h-full transition-all hover:border-surface-400 hover:bg-surface-100/60">
      <div className="w-14 h-14 rounded-full bg-surface-200/80 flex items-center justify-center text-surface-700 mb-4 shadow-inner">
        <FiPackage className="w-6 h-6" />
      </div>
      <span className="text-xs font-bold tracking-[0.16em] text-surface-500 mb-1">
        TOP THREADZ COLLECTION
      </span>
      <h3 className="font-display text-lg font-bold text-surface-900 mb-2">
        More Arriving Soon
      </h3>
      <p className="text-xs text-surface-600 max-w-[220px] mx-auto mb-5 leading-relaxed">
        New unstitched wash & wear fabrics and exclusive drops are currently being curated.
      </p>
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 rounded-full bg-surface-950 px-4 py-2 text-xs font-bold text-white uppercase tracking-wider hover:bg-surface-800 transition-all shadow-sm"
      >
        Explore All Drops →
      </Link>
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
      <div>
        {showGridControls && isMounted ? renderGridControls() : null}
        <div className="max-w-md mx-auto py-8">
          {renderPlaceholderCard()}
        </div>
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

        {/* Fallback card when only 1 item exists */}
        {uniqueProducts.length === 1 && (
          <ScrollReveal delay={100} animation="slide-up">
            {renderPlaceholderCard()}
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}
