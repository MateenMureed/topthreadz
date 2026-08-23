'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowRight } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import ProductGrid from '@/components/ProductGrid';

const FAVORITE_BRANDS = [
  'Gul Ahmed',
  'Alkaram Studio',
  'Bonanza Satrangi',
  'Junaid Jamshed (J.)',
  'Khaadi',
  'Nishat Linen',
  'Sapphire',
  'Ideas by Gul Ahmed',
  'Shaffer',
  'Master Fabrics',
  'Pasha Fabrics',
  'Dynasty Fabrics',
  'Orient Textiles',
  'Kamal Fabrics',
  'JNG Fabrics',
  'Sheikh Gulzar Fabrics',
  'Hilltop Fabrics',
  'Alamgir Fabrics',
  'Jeeva Textiles',
  'Asco Fabrics',
  'Cambridge',
  'Edenrobe',
  'Diners',
  'Zellbury',
  'Saya',
  'Bin Saeed',
  'Firdous',
  'Al Zohaib',
  'Resham Ghar',
  'Narkins',
  'Tawakkal Fabrics',
  'Lawrencepur',
  'Bareeze',
  'Istor',
  'Moosa Jee',
  'Kingdom Fabrics',
  'Zain G Fabrics',
];

const REVERSED_FAVORITE_BRANDS = [...FAVORITE_BRANDS].reverse();

const BRAND_STYLES = [
  'bg-slate-100 text-slate-900 border-slate-300',
  'bg-zinc-900 text-white border-zinc-800',
  'bg-amber-100 text-amber-900 border-amber-300',
  'bg-emerald-100 text-emerald-900 border-emerald-300',
  'bg-indigo-100 text-indigo-900 border-indigo-300',
  'bg-rose-100 text-rose-900 border-rose-300',
  'bg-sky-100 text-sky-900 border-sky-300',
  'bg-neutral-100 text-neutral-900 border-neutral-300',
];

export default function HomePage() {
  const router = useRouter();

  const { data: newlyLaunched, isLoading: loadingNew } = useQuery({
    queryKey: ['home', 'newly-launched'],
    queryFn: () => productService.getAll({ limit: 8, sortBy: 'newest' }),
  });

  const { data: bestSellers, isLoading: loadingBest } = useQuery({
    queryKey: ['home', 'best-sellers'],
    queryFn: () => productService.getAll({ limit: 8, sortBy: 'recommended' }),
  });

  const newProducts = newlyLaunched?.data?.products || [];
  const bestSellerProducts = bestSellers?.data?.products || [];

  return (
    <div className="bg-white text-black">
      <section className="border-b border-surface-300">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20 text-center">
          <p className="brand-wordmark text-sm md:text-base text-surface-700">Top Threadz</p>
          <h1 className="mt-4 text-4xl md:text-6xl font-display font-bold leading-tight">
            Pure Style.
            <br />
            Pure Confidence.
          </h1>
          <p className="mt-5 text-surface-700 max-w-2xl mx-auto">
            Black and white essentials for modern menswear. Discover premium drops and bold sale picks.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/products" className="btn-primary">
              Shop All <FiArrowRight className="inline ml-2" />
            </Link>
            <Link href="/products?sortBy=price_asc" className="btn-sale">
              Sale Picks
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12 md:py-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-display font-bold">Favourite Brands</h2>
        </div>
        <div className="brand-marquee">
          <div className="brand-marquee__track">
            {[...FAVORITE_BRANDS, ...FAVORITE_BRANDS].map((brand, idx) => (
              <button
                key={`${brand}-${idx}`}
                type="button"
                onClick={() => router.push(`/products?brand=${encodeURIComponent(brand)}`)}
                className={`brand-marquee__chip rounded-full border px-4 py-3 text-xs sm:text-sm md:text-base font-semibold text-left whitespace-nowrap ${BRAND_STYLES[idx % BRAND_STYLES.length]}`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        <div className="brand-marquee brand-marquee--reverse mt-3">
          <div className="brand-marquee__track">
            {[...REVERSED_FAVORITE_BRANDS, ...REVERSED_FAVORITE_BRANDS].map((brand, idx) => (
              <button
                key={`${brand}-reverse-${idx}`}
                type="button"
                onClick={() => router.push(`/products?brand=${encodeURIComponent(brand)}`)}
                className={`brand-marquee__chip rounded-full border px-4 py-3 text-xs sm:text-sm md:text-base font-semibold text-left whitespace-nowrap ${BRAND_STYLES[idx % BRAND_STYLES.length]}`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12 md:py-14 border-t border-surface-300">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold">Newly Launched</h2>
            <p className="text-surface-700 mt-1">Fresh arrivals curated for this week.</p>
          </div>
          <Link href="/products?sortBy=newest" className="text-black font-medium hover:text-surface-700">
            View All
          </Link>
        </div>
        <ProductGrid products={newProducts} loading={loadingNew} />
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12 md:py-14 border-t border-surface-300">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold">Best Sellers</h2>
            <p className="text-surface-700 mt-1">Most loved by our customers.</p>
          </div>
          <Link href="/products" className="text-black font-medium hover:text-surface-700">
            View All
          </Link>
        </div>
        <ProductGrid products={bestSellerProducts} loading={loadingBest} />
      </section>
    </div>
  );
}
