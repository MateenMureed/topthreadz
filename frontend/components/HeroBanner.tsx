'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cloudinaryLoader, isCloudinaryUrl, isBackendUploadUrl } from '@/lib/images';

interface HeroBannerProps {
  heroBanner?: string | null;
  buttonLink?: string;
  buttonAriaLabel?: string;
}

export default function HeroBanner({
  heroBanner,
  buttonLink = '/products',
  buttonAriaLabel = 'Shop our newest collection',
}: HeroBannerProps) {
  if (!heroBanner) return null;

  const isCloudinary = isCloudinaryUrl(heroBanner);
  const isBackend = isBackendUploadUrl(heroBanner);

  return (
    <div className="w-full overflow-hidden bg-[#fafafa]">
      <Link
        href={buttonLink || '/products'}
        className="block relative w-full overflow-hidden group"
        aria-label={buttonAriaLabel}
      >
        <Image
          src={heroBanner}
          alt="Top Threadz Men's Luxury Fabrics Collection"
          width={1920}
          height={800}
          priority
          fetchPriority="high"
          loader={isCloudinary ? cloudinaryLoader : undefined}
          unoptimized={isBackend}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1536px"
          className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-[1.01]"
          style={{
            aspectRatio: '12 / 5',
            maxHeight: '80vh',
            width: '100%',
            height: 'auto',
          }}
        />
      </Link>
    </div>
  );
}
