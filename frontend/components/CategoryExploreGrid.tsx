'use client';

import Link from 'next/link';
import Image from 'next/image';
import { resolveImageUrl } from '@/lib/images';

interface Category {
  id?: string;
  name: string;
  slug?: string;
  coverImage?: string;
  image?: string;
}

interface CategoryExploreGridProps {
  categories: Category[];
  products?: any[];
}

export default function CategoryExploreGrid({ categories, products = [] }: CategoryExploreGridProps) {
  if (!categories || categories.length === 0) return null;

  // Show up to 4 categories
  const displayed = categories.slice(0, 4);

  return (
    <section
      aria-label="Explore categories"
      className="w-full bg-white py-10 md:py-14"
    >
      {/* Heading */}
      <div className="text-center mb-8 md:mb-10 px-4">
        <h2
          className="text-xl md:text-2xl lg:text-3xl font-light tracking-[0.22em] uppercase text-surface-900"
          style={{ fontFamily: 'var(--font-outfit, var(--font-inter, sans-serif))' }}
        >
          What Would You Like to
          <br className="sm:hidden" />
          {' '}Explore?
        </h2>
      </div>

      {/* Category cards grid */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`grid gap-3 sm:gap-4 md:gap-5 ${
            displayed.length === 4
              ? 'grid-cols-2 sm:grid-cols-4'
              : displayed.length === 3
              ? 'grid-cols-3'
              : displayed.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-1'
          }`}
        >
          {displayed.map((cat, idx) => {
            const slug = cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-');
            const href = `/products/category/${encodeURIComponent(slug)}`;
            let rawImg = cat.coverImage || cat.image;

            // Fallback: auto-fetch latest image from loaded products if category image is missing
            if (!rawImg && Array.isArray(products) && products.length > 0) {
              const isUnstitched = /unstitched/i.test(cat.name) || /unstitched/i.test(slug);
              const isStitched = /^stitched$/i.test(cat.name) || /^stitched$/i.test(slug);

              const matchedProd = products.find((p: any) => {
                const pCat = String(p.category || '').toLowerCase();
                const pSub = String(p.subcategory || '').toLowerCase();
                if (isUnstitched) {
                  return pCat.includes('unstitched') || pSub.includes('unstitched');
                }
                if (isStitched) {
                  return pCat === 'stitched' || pSub === 'stitched';
                }
                const catLower = cat.name.toLowerCase();
                return pCat.includes(catLower) || pSub.includes(catLower);
              });

              if (matchedProd?.images?.[0]) {
                rawImg = matchedProd.images[0];
              }
            }

            const imgSrc = rawImg ? resolveImageUrl(rawImg) : null;

            return (
              <Link
                key={cat.id || slug || idx}
                href={href}
                className="group flex flex-col items-center gap-3"
              >
                {/* Portrait image card */}
                <div className="relative w-full overflow-hidden bg-surface-100">
                  {/* Aspect ratio: 3:4 portrait (similar to reference) */}
                  <div className="aspect-[3/4] w-full relative">
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 320px"
                        className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                        loading={idx === 0 ? 'eager' : 'lazy'}
                        priority={idx === 0}
                      />
                    ) : (
                      /* Elegant placeholder with initial letter */
                      <div className="absolute inset-0 flex items-center justify-center bg-surface-100">
                        <span className="text-5xl md:text-7xl font-bold text-surface-300 uppercase select-none">
                          {cat.name?.[0] || '?'}
                        </span>
                      </div>
                    )}
                    {/* Subtle hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 pointer-events-none" />
                  </div>
                </div>

                {/* Category name */}
                <p className="text-[11px] sm:text-xs md:text-[13px] font-semibold uppercase tracking-[0.18em] text-surface-800 group-hover:text-surface-950 transition-colors text-center">
                  {cat.name}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
