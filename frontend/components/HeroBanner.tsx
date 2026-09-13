'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cloudinaryLoader, isCloudinaryUrl, isBackendUploadUrl } from '@/lib/images';

interface HeroBannerProps {
  heroBanner?: string | null;
  heroBannerMobile?: string | null;
  buttonLink?: string;
  buttonAriaLabel?: string;
  /** Pass true for below-the-fold banners to lazy-load them */
  lazy?: boolean;
}

export default function HeroBanner({
  heroBanner,
  heroBannerMobile,
  buttonLink = '/products',
  buttonAriaLabel = 'Shop our newest collection',
  lazy = false,
}: HeroBannerProps) {
  if (!heroBanner) return null;

  const isCloudinary = isCloudinaryUrl(heroBanner);
  const isBackend = isBackendUploadUrl(heroBanner);

  const mobileImg = heroBannerMobile || heroBanner; // fall back to desktop if no mobile image

  return (
    <div className="w-full overflow-hidden bg-[#fafafa]">
      <Link
        href={buttonLink || '/products'}
        className="block relative w-full overflow-hidden group"
        aria-label={buttonAriaLabel}
      >
        {/*
         * Responsive <picture> element:
         *  - On mobile (≤ 767px): use the mobile image (1080×1350, portrait)
         *  - On desktop (≥ 768px): use the desktop image (1920×700, landscape)
         * Both sources are wrapped in the same <Link> so click behaviour is preserved.
         * Dimensions prevent Cumulative Layout Shift (CLS).
         */}
        <picture>
          {/* Mobile portrait banner */}
          <source
            media="(max-width: 767px)"
            srcSet={mobileImg}
            width={1080}
            height={1350}
          />
          {/* Desktop landscape banner – Next.js <Image> handles srcset/optimization */}
          <Image
            src={heroBanner}
            alt="Top Threadz Men's Luxury Fabrics Collection"
            width={1920}
            height={700}
            priority={!lazy}
            fetchPriority={lazy ? 'low' : 'high'}
            loading={lazy ? 'lazy' : 'eager'}
            loader={isCloudinary ? cloudinaryLoader : undefined}
            unoptimized={isBackend}
            sizes="(max-width: 767px) 100vw, (max-width: 1200px) 100vw, 1920px"
            className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-[1.01] hidden sm:block"
            style={{ aspectRatio: '1920/700' }}
          />
        </picture>

        {/*
         * Mobile-only <img> for portrait banner.
         * Shown only on small screens (sm:hidden).
         * Not using Next.js Image here so the <picture> source above takes effect.
         * eslint-disable-next-line @next/next/no-img-element
         */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mobileImg}
          alt="Top Threadz Men's Luxury Fabrics Collection"
          width={1080}
          height={1350}
          loading={lazy ? 'lazy' : 'eager'}
          fetchPriority={lazy ? 'low' : 'high'}
          className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-[1.01] sm:hidden"
          style={{ aspectRatio: '1080/1350' }}
        />
      </Link>
    </div>
  );
}
