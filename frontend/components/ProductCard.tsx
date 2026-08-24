'use client';

import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { experienceService } from '@/services/experience.service';
import { isBackendUploadUrl, resolveImageUrl } from '@/lib/images';
import toast from 'react-hot-toast';

interface ProductImageMeta {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  discount: number;
  images: string[];
  category: string;
  sizes?: string[];
  colors?: string[];
  slug?: string;
  imageMeta?: ProductImageMeta[];
}

function normalizeImageMetaInput(input: unknown): ProductImageMeta[] {
  if (!Array.isArray(input)) return [];
  return input.filter(
    (item): item is ProductImageMeta =>
      Boolean(item) && typeof item === 'object' && typeof (item as ProductImageMeta).url === 'string'
  );
}

function normalizeImageListInput(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

export default function ProductCard({
  id,
  name,
  price,
  discount,
  images,
  category,
  sizes = [],
  colors = [],
  slug,
  imageMeta = [],
}: ProductCardProps) {
  const { addItem, openCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Inline zoom refs — direct DOM manipulation for 60fps performance
  const imgRef = useRef<HTMLImageElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);

  const safeImageMeta = useMemo(() => normalizeImageMetaInput(imageMeta), [imageMeta]);
  const safeImages = useMemo(() => normalizeImageListInput(images), [images]);

  const orderedImages = useMemo(() => {
    const seen = new Set<string>();
    const metaUrls = [...safeImageMeta]
      .sort((a, b) => Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)))
      .map((item) => item.url);

    return [...metaUrls, ...safeImages].filter((url) => {
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    });
  }, [safeImageMeta, safeImages]);

  const imageAltMap = useMemo(() => {
    const altMap = new Map<string, string>();
    safeImageMeta.forEach((item) => {
      if (item.url && item.alt) altMap.set(item.url, item.alt);
    });
    return altMap;
  }, [safeImageMeta]);

  const effectivePrice = price * (1 - discount / 100);
  const defaultSize = sizes[0] || 'S';
  const isSlugLike = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value);

  const safeIdentifier = (() => {
    const candidate = (slug || '').trim();
    if (!candidate || candidate.includes('/') || !isSlugLike(candidate)) return id;
    return candidate;
  })();

  const productHref = `/products/${encodeURIComponent(safeIdentifier)}`;

  const frontSrc = resolveImageUrl(orderedImages[0] || '');
  const frontAlt = imageAltMap.get(frontSrc) || name;

  // ============================================================
  // INLINE ZOOM — cursor-tracked transform-origin
  // The image scales up on hover (via CSS group-hover:scale),
  // and the transform-origin follows the mouse for a natural
  // "zoom into whatever you're looking at" effect.
  // ============================================================
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (imgRef.current) {
      imgRef.current.style.transformOrigin = `${x}% ${y}%`;
    }
    if (placeholderRef.current) {
      placeholderRef.current.style.transformOrigin = `${x}% ${y}%`;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Reset to center so the scale-down looks natural
    if (imgRef.current) {
      imgRef.current.style.transformOrigin = '50% 50%';
    }
    if (placeholderRef.current) {
      placeholderRef.current.style.transformOrigin = '50% 50%';
    }
  }, []);

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      id: `${id}-${defaultSize}-${colors[0] || 'default'}`,
      productId: id,
      name,
      price,
      discount,
      image: frontSrc || '',
      quantity: 1,
      size: defaultSize,
      color: colors[0] || undefined,
    });

    toast.success(`Added ${defaultSize} to cart`);
    openCart();
  };

  const handleToggleWishlist = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to use wishlist');
      return;
    }

    if (wishlistLoading) return;

    try {
      setWishlistLoading(true);
      const result = await experienceService.toggleWishlist(id);
      const nextState = Boolean(result?.data?.wishlisted);
      setIsWishlisted(nextState);
      toast.success(nextState ? 'Added to wishlist' : 'Removed from wishlist');
    } catch {
      toast.error('Could not update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <>
    <Link href={productHref} className="block">
      <article className="group">
        {/* Image container — overflow:hidden clips the zoomed image */}
        <div
          className="relative aspect-[3/4] overflow-hidden bg-[#efede7] cursor-zoom-in"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="absolute inset-0">
            {frontSrc ? (
              <Image
                ref={imgRef}
                src={frontSrc}
                alt={frontAlt}
                fill
                unoptimized={isBackendUploadUrl(frontSrc)}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="h-full w-full object-contain object-center transition-transform duration-[600ms] ease-out will-change-transform group-hover:scale-[1.35] mix-blend-multiply"
                style={{ transformOrigin: '50% 50%' }}
                draggable={false}
              />
            ) : (
              <div
                ref={placeholderRef}
                className="h-full w-full bg-gradient-to-br from-stone-100 to-stone-200 transition-transform duration-[600ms] ease-out will-change-transform group-hover:scale-[1.35]"
                style={{ transformOrigin: '50% 50%' }}
              />
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-10 flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-14 lg:w-14 flex-col items-center justify-center rounded-full bg-[#dedddc]/95 text-[#292929] shadow-sm backdrop-blur-sm transition-transform duration-200 hover:scale-105"
            aria-label="Add to bag"
            title="Add to bag"
          >
            <span className="relative">
              <FiShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-[18px] md:w-[18px]" />
              <span className="absolute -right-1 -top-1 text-[8px] sm:text-[9px] md:text-[10px] font-bold leading-none">+</span>
            </span>
            <span className="mt-0.5 text-[8px] md:text-[10px] font-semibold leading-none tracking-[0.08em] hidden md:block">ADD</span>
          </button>

          <button
            type="button"
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
            className={`absolute right-2 top-2 sm:right-3 sm:top-3 z-10 inline-flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-transform duration-200 hover:scale-105 ${isWishlisted ? 'bg-pink-50 text-pink-500' : 'bg-white/90 text-surface-900'}`}
            aria-label="Add to wishlist"
            title="Love"
          >
            <FiHeart className={`h-4 w-4 md:h-[18px] md:w-[18px] ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="pt-3 md:pt-4">
          <p className="truncate text-[11px] min-[768px]:max-[1023px]:text-xs font-medium text-slate-500 uppercase tracking-widest">{category}</p>
          <h3 className="mt-1 line-clamp-2 text-[15px] font-medium leading-snug text-slate-900 min-[768px]:max-[1023px]:text-[17px] md:text-[16px]">{name}</h3>

          <div className="mt-1.5 md:mt-2 flex items-center gap-2">
            {discount > 0 ? (
              <span className="text-[13px] min-[768px]:max-[1023px]:text-[15px] font-normal leading-none text-slate-500 line-through md:text-[14px]">PKR {price.toLocaleString()}</span>
            ) : null}
            <span className="text-[15px] min-[768px]:max-[1023px]:text-[17px] font-semibold leading-none text-slate-900 md:text-[16px]">PKR {Math.round(effectivePrice).toLocaleString()}</span>
          </div>

          <div className="mt-2 md:mt-2.5 flex items-center gap-1.5">
            {discount > 0 ? (
              <span className="rounded-full bg-[#f8623f] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.02em] text-white">
                {discount}% Off
              </span>
            ) : null}
            <span className="rounded-full bg-[#f8e9ea] px-2 py-0.5 text-[10px] font-semibold text-[#e05661]">Just In</span>
          </div>
        </div>
      </article>
    </Link>
    </>
  );
}
