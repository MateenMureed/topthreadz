'use client';

import Link from 'next/link';
import {
  isCloudinaryUrl,
  getOptimizedCloudinaryUrl,
  resolveImageUrl,
} from '@/lib/images';

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

  const rawDesktop = heroBanner;
  const rawMobile = heroBannerMobile || heroBanner;

  const desktopIsCloudinary = isCloudinaryUrl(rawDesktop);
  const mobileIsCloudinary = isCloudinaryUrl(rawMobile);

  const desktopSrc = desktopIsCloudinary
    ? getOptimizedCloudinaryUrl(rawDesktop, { width: 1920, quality: 'auto', format: 'auto' })
    : resolveImageUrl(rawDesktop);

  const mobileSrc1x = mobileIsCloudinary
    ? getOptimizedCloudinaryUrl(rawMobile, { width: 750, quality: 'auto', format: 'auto' })
    : resolveImageUrl(rawMobile);

  // 2x cap at 828px (414px device × 2 DPR) — saves ~60 KB vs w_1500 on mobile
  const mobileSrcSet = mobileIsCloudinary
    ? `${mobileSrc1x} 750w, ${getOptimizedCloudinaryUrl(rawMobile, { width: 828, quality: 'auto', format: 'auto' })} 828w`
    : undefined;

  return (
    <div className="w-full overflow-hidden bg-[#fafafa]">
      <Link
        href={buttonLink || '/products'}
        className="block relative w-full overflow-hidden group"
        aria-label={buttonAriaLabel}
      >
        <picture className="block w-full">
          <source
            media="(max-width: 639px)"
            srcSet={mobileSrcSet || mobileSrc1x}
            sizes="100vw"
            width={750}
            height={938}
          />
          <source
            media="(min-width: 640px)"
            srcSet={desktopSrc}
            sizes="100vw"
            width={1920}
            height={700}
          />
          {/*
           * No fixed aspect-ratio box and no object-cover here on purpose:
           * whatever ratio the uploaded image actually is, width fills the
           * screen and height follows naturally, so the full image always
           * shows — nothing gets cropped off the sides or top/bottom.
           * Trade-off: banner height will vary slightly between uploads
           * that aren't exactly 1080x1350 / 1920x700, and there's a small
           * layout shift possible if the real ratio differs a lot from the
           * width/height hints below (used only to reserve space pre-load).
           */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={desktopSrc}
            alt="Top Threadz Men's Luxury Fabrics Collection"
            width={1920}
            height={700}
            loading={lazy ? 'lazy' : 'eager'}
            fetchPriority={lazy ? 'low' : 'high'}
            decoding="async"
            className="block w-full h-auto transition-transform duration-700 ease-out group-hover:scale-[1.01] max-sm:w-screen max-sm:relative max-sm:left-1/2 max-sm:right-1/2 max-sm:-mx-[50vw]"
          />
        </picture>
      </Link>
    </div>
  );
}