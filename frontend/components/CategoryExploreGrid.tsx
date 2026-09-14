'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiArrowRight } from 'react-icons/fi';
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

// Fallback high-fashion Pakistani menswear imagery matching the reference mockup
const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  unstitched: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788891170/ecommerce-products/eki2qssmwkiagxn9fx5y.jpg',
  stitched: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788614550/ecommerce-products/miz32cpgjlvw0ejejplp.jpg',
  waistcoat: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788614812/ecommerce-products/krkdpdqc0a4mf437lzr1.jpg',
  'two-piece': 'https://res.cloudinary.com/fmxzphak/image/upload/v1788630568/ecommerce-products/qddnzjm16r9mljo8gihe.jpg',
  kids: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788295698/ecommerce-products/dtxydgwby9kpeoo6w0qu.jpg',
};

export default function CategoryExploreGrid({ categories, products = [] }: CategoryExploreGridProps) {
  // Ensure we display the 5 core categories from reference design if available
  const baseCategories = (categories && categories.length > 0) ? categories : [
    { name: 'Unstitched Fabric', slug: 'unstitched-fabric' },
    { name: 'Stitched', slug: 'stitched' },
    { name: 'Waistcoats', slug: 'waist-coats' },
    { name: 'Two Piece', slug: 'two-piece' },
    { name: 'Kids', slug: 'kids-section' },
  ];

  // Show up to 5 categories matching reference layout
  const displayed = baseCategories.slice(0, 5);

  return (
    <section
      aria-label="Shop By Category"
      className="w-full bg-[#FAFAF8] py-12 md:py-16 border-b border-surface-200/60"
    >
      {/* Luxury Heading matching reference mockup */}
      <div className="text-center mb-8 md:mb-12 px-4">
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.26em] text-[#8C93A0] mb-2">
          WHAT WOULD YOU LIKE TO EXPLORE?
        </p>
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <span className="h-[1.5px] w-8 sm:w-14 bg-[#C5A262]" />
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#1E2229] tracking-normal font-normal"
          >
            Shop By Category
          </h2>
          <span className="h-[1.5px] w-8 sm:w-14 bg-[#C5A262]" />
        </div>
      </div>

      {/* Category cards grid: 5 columns on desktop, 2-3 on tablet/mobile */}
      <div className="max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
          {displayed.map((cat, idx) => {
            const slug = cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-');
            const href = `/products/category/${encodeURIComponent(slug)}`;
            let rawImg = cat.coverImage || cat.image;

            // Auto-fetch latest product image from category if missing
            if (!rawImg && Array.isArray(products) && products.length > 0) {
              const isUnstitched = /unstitched/i.test(cat.name) || /unstitched/i.test(slug);
              const isStitched = /^stitched$/i.test(cat.name) || /^stitched$/i.test(slug);
              const isWaistcoat = /waistcoat/i.test(cat.name) || /waist/i.test(slug);
              const isTwoPiece = /two/i.test(cat.name) || /two/i.test(slug);
              const isKids = /kid/i.test(cat.name) || /kid/i.test(slug);

              const matchedProd = products.find((p: any) => {
                const pCat = String(p.category || '').toLowerCase();
                const pSub = String(p.subcategory || '').toLowerCase();
                if (isUnstitched) return pCat.includes('unstitched') || pSub.includes('unstitched');
                if (isStitched) return pCat === 'stitched' || pSub === 'stitched';
                if (isWaistcoat) return pCat.includes('waist') || pSub.includes('waist');
                if (isTwoPiece) return pCat.includes('two') || pSub.includes('two');
                if (isKids) return pCat.includes('kid') || pSub.includes('kid');
                const catLower = cat.name.toLowerCase();
                return pCat.includes(catLower) || pSub.includes(catLower);
              });

              if (matchedProd?.images?.[0]) {
                rawImg = matchedProd.images[0];
              }
            }

            // Fallback to reference collection photography
            if (!rawImg) {
              const nameLower = cat.name.toLowerCase();
              if (nameLower.includes('unstitched')) rawImg = DEFAULT_CATEGORY_IMAGES.unstitched;
              else if (nameLower.includes('stitched')) rawImg = DEFAULT_CATEGORY_IMAGES.stitched;
              else if (nameLower.includes('waist')) rawImg = DEFAULT_CATEGORY_IMAGES.waistcoat;
              else if (nameLower.includes('two')) rawImg = DEFAULT_CATEGORY_IMAGES['two-piece'];
              else if (nameLower.includes('kid')) rawImg = DEFAULT_CATEGORY_IMAGES.kids;
              else rawImg = DEFAULT_CATEGORY_IMAGES.unstitched;
            }

            const imgSrc = rawImg ? resolveImageUrl(rawImg) : null;

            return (
              <Link
                key={cat.id || slug || idx}
                href={href}
                className="group relative block w-full overflow-hidden rounded-2xl bg-stone-100 shadow-xs hover:shadow-md transition-all duration-300"
              >
                {/* 3:4 portrait card aspect ratio matching mockup */}
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                  {imgSrc ? (
                    <Image
                      src={imgSrc}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                      loading={idx === 0 ? 'eager' : 'lazy'}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-stone-200">
                      <span className="text-4xl font-serif text-stone-400 uppercase">
                        {cat.name?.[0] || '?'}
                      </span>
                    </div>
                  )}

                  {/* Dark bottom gradient overlay matching reference mockup */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent transition-opacity duration-300 group-hover:from-black/90" />

                  {/* Category Name & Arrow pinned inside at bottom */}
                  <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4 md:p-5 flex items-center justify-between text-white">
                    <span className="text-xs sm:text-[13px] font-bold uppercase tracking-[0.14em] drop-shadow-sm group-hover:translate-x-0.5 transition-transform">
                      {cat.name}
                    </span>
                    <FiArrowRight className="w-4 h-4 text-white/90 shrink-0 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
