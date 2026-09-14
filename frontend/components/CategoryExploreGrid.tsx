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

// Fallback high-fashion Pakistani menswear imagery matching Diners aesthetic
const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  unstitched: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788891170/ecommerce-products/eki2qssmwkiagxn9fx5y.jpg',
  stitched: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788614550/ecommerce-products/miz32cpgjlvw0ejejplp.jpg',
  waistcoat: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788614812/ecommerce-products/krkdpdqc0a4mf437lzr1.jpg',
  kids: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788295698/ecommerce-products/dtxydgwby9kpeoo6w0qu.jpg',
};

const EXPLORE_ITEMS = [
  { name: 'UNSTITCHED FABRIC', slug: 'unstitched-fabric', fallbackKey: 'unstitched' },
  { name: 'STITCHED KURTA', slug: 'stitched', fallbackKey: 'stitched' },
  { name: 'WAISTCOATS', slug: 'waist-coats', fallbackKey: 'waistcoat' },
  { name: 'KIDS SECTION', slug: 'kids-section', fallbackKey: 'kids' },
];

export default function CategoryExploreGrid({ categories = [], products = [] }: CategoryExploreGridProps) {
  return (
    <section
      aria-label="What would you like to explore"
      className="w-full bg-white pt-10 pb-8 sm:pt-14 sm:pb-10 border-b border-surface-200/50"
    >
      {/* Diners Style Clean Heading */}
      <div className="text-center mb-7 sm:mb-9 px-4">
        <h2 className="text-xs sm:text-sm md:text-[15px] font-bold uppercase tracking-[0.24em] text-[#1E2229]">
          WHAT WOULD YOU LIKE TO EXPLORE?
        </h2>
      </div>

      {/* 4 Clean Cards matching Diners layout */}
      <div className="max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5 md:gap-6">
          {EXPLORE_ITEMS.map((item, idx) => {
            // Check if backend categories has a matching category
            const matchedCat = categories.find((c) => {
              const cName = (c.name || '').toLowerCase();
              const cSlug = (c.slug || '').toLowerCase();
              if (item.fallbackKey === 'unstitched') return cName.includes('unstitched') || cSlug.includes('unstitched');
              if (item.fallbackKey === 'stitched') return cName === 'stitched' || cSlug === 'stitched';
              if (item.fallbackKey === 'waistcoat') return cName.includes('waist') || cSlug.includes('waist');
              if (item.fallbackKey === 'kids') return cName.includes('kid') || cSlug.includes('kid');
              return false;
            });

            const href = `/products/category/${encodeURIComponent(matchedCat?.slug || item.slug)}`;

            let rawImg = matchedCat?.coverImage || matchedCat?.image;

            // If category doesn't have an image, look up from latest matching product
            if (!rawImg && Array.isArray(products) && products.length > 0) {
              const matchedProd = products.find((p: any) => {
                const pCat = String(p.category || '').toLowerCase();
                const pSub = String(p.subcategory || '').toLowerCase();
                if (item.fallbackKey === 'unstitched') return pCat.includes('unstitched') || pSub.includes('unstitched');
                if (item.fallbackKey === 'stitched') return pCat === 'stitched' || pSub === 'stitched';
                if (item.fallbackKey === 'waistcoat') return pCat.includes('waist') || pSub.includes('waist');
                if (item.fallbackKey === 'kids') return pCat.includes('kid') || pSub.includes('kid');
                return false;
              });
              if (matchedProd?.images?.[0]) {
                rawImg = matchedProd.images[0];
              }
            }

            if (!rawImg) {
              rawImg = DEFAULT_CATEGORY_IMAGES[item.fallbackKey];
            }

            const imgSrc = resolveImageUrl(rawImg);

            return (
              <Link
                key={item.slug}
                href={href}
                className="group flex flex-col items-center cursor-pointer"
              >
                {/* Image card: square aspect ratio with smooth hover zoom matching Diners */}
                <div className="relative aspect-square w-full overflow-hidden bg-[#F4F2EE]">
                  {imgSrc ? (
                    <Image
                      src={imgSrc}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 25vw"
                      className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                      loading={idx < 2 ? 'eager' : 'lazy'}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
                      <span className="text-2xl font-serif text-stone-400 uppercase">{item.name[0]}</span>
                    </div>
                  )}
                  {/* Subtle dark tint on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
                </div>

                {/* Diners Style Centered Label Underneath Image */}
                <div className="mt-3 sm:mt-3.5 text-center">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-[#1E2229] group-hover:text-[#0F1F3D] transition-colors">
                    {item.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

