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
        <div className="relative">
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={desktopSrc}
              alt="Top Threadz Men's Luxury Fabrics Collection"
              width={1920}
              height={700}
              loading={lazy ? 'lazy' : 'eager'}
              fetchPriority={lazy ? 'low' : 'high'}
              decoding="async"
              className="block w-full h-auto min-h-[420px] sm:min-h-[500px] md:min-h-[580px] lg:min-h-[640px] object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.01]"
            />
          </picture>

          {/* Luxury Editorial Overlay matching reference mockup */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent flex items-center">
            <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 flex items-center justify-between">
              {/* Left Editorial Text */}
              <div className="max-w-xl text-white">
                <p className="text-[10.5px] sm:text-xs md:text-[13px] font-bold uppercase tracking-[0.28em] text-[#D4AF37] mb-2 sm:mb-3">
                  NEW SEASON
                </p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-normal leading-[1.06] tracking-tight text-white drop-shadow-sm">
                  The New<br />Pakistani Edit
                </h1>
                <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-white/90 font-light tracking-wide max-w-md">
                  Refined fabrics. Contemporary tailoring.
                </p>

                <div className="mt-5 sm:mt-8">
                  <span className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 bg-[#0F1F3D] hover:bg-black text-white text-xs sm:text-[13px] font-semibold tracking-wider uppercase rounded-md shadow-xl transition-all border border-white/20 group-hover:border-white/50">
                    <span>EXPLORE COLLECTION</span>
                    <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>

                {/* Slide pagination indicator (01 02 03) */}
                <div className="mt-8 sm:mt-12 flex items-center gap-5 text-xs font-semibold tracking-widest text-white/60">
                  <div className="relative pb-1 text-white">
                    <span>01</span>
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D4AF37]" />
                  </div>
                  <span className="hover:text-white transition-colors cursor-pointer">02</span>
                  <span className="hover:text-white transition-colors cursor-pointer">03</span>
                </div>
              </div>

              {/* Right Signature Cursive Accent matching mockup */}
              <div className="hidden lg:block text-right pr-6">
                <p className="font-serif italic text-3xl xl:text-4xl text-white/75 drop-shadow-md rotate-[-4deg] tracking-wide leading-snug select-none">
                  Timeless Tradition<br />
                  <span className="text-white/85 text-2xl xl:text-3xl">Modern Style</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}