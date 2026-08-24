'use client';

import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import ProductGrid from '@/components/ProductGrid';

export default function HomePage() {
  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ['home', 'products'],
    queryFn: () => productService.getAll({ limit: 50, sortBy: 'newest' }),
  });

  const products = productsResponse?.data?.products || [];

  return (
    <div className="bg-white text-black">
      {/* Hero Section */}
      <section className="border-b border-surface-300 overflow-hidden">
        <div className="bg-surface-950 text-white">
          <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
            <p className="brand-wordmark text-sm md:text-base text-surface-400">Top Threadz</p>
            <h1 className="mt-4 text-4xl md:text-6xl font-display font-bold leading-tight text-white">
              Pure Style.
              <br />
              Pure Confidence.
            </h1>
            <p className="mt-5 text-surface-300 max-w-2xl mx-auto">
              Black and white essentials for modern menswear. Discover premium drops and bold sale picks.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/products" className="btn-primary !bg-white !text-surface-950 hover:!bg-surface-100">
                Shop All <FiArrowRight className="inline ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12 md:py-14">
        <ProductGrid products={products} loading={isLoading} showGridControls={false} />
      </section>
    </div>
  );
}
