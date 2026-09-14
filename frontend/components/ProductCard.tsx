'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { experienceService } from '@/services/experience.service';
import { isBackendUploadUrl, isCloudinaryUrl, cloudinaryLoader, resolveImageUrl } from '@/lib/images';
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
  subcategory?: string;
  sizes?: string[];
  colors?: string[];
  slug?: string;
  imageMeta?: ProductImageMeta[];
  imageFit?: 'cover' | 'full';
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
  sizes = [],
  colors = [],
  slug,
  imageMeta = [],
  imageFit = 'cover',
}: ProductCardProps) {
  const { addItem, openCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    try {
      const localWishlist: string[] = JSON.parse(localStorage.getItem('topthreadz_wishlist') || '[]');
      if (localWishlist.includes(id) || (slug && localWishlist.includes(slug))) {
        setIsWishlisted(true);
      }
    } catch {}
  }, [id, slug]);

  const imgRef = useRef<HTMLImageElement>(null);

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

  // Primary image and optional 2nd image for hover
  const frontSrc = resolveImageUrl(orderedImages[0] || '');
  const hoverSrc = orderedImages.length > 1 ? resolveImageUrl(orderedImages[1]) : null;
  const frontAlt = imageAltMap.get(frontSrc) || name;
  const isCloudinary = isCloudinaryUrl(frontSrc);
  const isBackend = isBackendUploadUrl(frontSrc);

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

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      toast((t) => (
        <div className="flex items-center justify-between gap-3 text-xs w-full">
          <span>Added <strong>{defaultSize}</strong> to cart!</span>
          <Link
            href="/checkout"
            onClick={() => toast.dismiss(t.id)}
            className="rounded-lg bg-emerald-700 px-2.5 py-1 text-white font-bold shrink-0 hover:bg-emerald-800"
          >
            Checkout →
          </Link>
        </div>
      ), { duration: 4000 });
    } else {
      toast.success(`Added ${defaultSize} to cart`);
      openCart();
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (wishlistLoading) return;
    setWishlistLoading(true);

    try {
      let nextState = !isWishlisted;

      if (isAuthenticated) {
        try {
          const result = await experienceService.toggleWishlist(id);
          if (result?.data?.wishlisted !== undefined) {
            nextState = Boolean(result.data.wishlisted);
          }
        } catch {}
      }

      // Sync with localStorage
      try {
        const localWishlist: string[] = JSON.parse(localStorage.getItem('topthreadz_wishlist') || '[]');
        let updated: string[];
        if (nextState) {
          updated = Array.from(new Set([...localWishlist, id, ...(slug ? [slug] : [])]));
        } else {
          updated = localWishlist.filter((itemKey) => itemKey !== id && itemKey !== slug);
        }
        localStorage.setItem('topthreadz_wishlist', JSON.stringify(updated));
      } catch {}

      setIsWishlisted(nextState);
      toast.success(nextState ? 'Added to wishlist ❤️' : 'Removed from wishlist');
    } catch {
      toast.error('Could not update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <Link href={productHref} className="block group h-full">
      <article className="flex flex-col h-full bg-white dark:bg-[#1E2228]">
        {/* 3:4 portrait image container with sharp corners matching reference mockup */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F4F2EE] dark:bg-[#1E2228] cursor-pointer">
          {/* Flush Red Discount Tag top-left matching Image 2 */}
          {discount > 0 && (
            <div className="absolute top-0 left-0 z-20 pointer-events-none">
              <span className="bg-[#D80000] text-white font-bold text-[10px] sm:text-[11px] px-2 py-0.5 sm:py-1 inline-block uppercase tracking-tight">
                -{Math.round(discount)}%
              </span>
            </div>
          )}

          {/* Wishlist button top-right */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
            className={`absolute right-2 top-2 sm:right-2.5 sm:top-2.5 z-20 inline-flex w-7 h-7 sm:w-8 sm:h-8 items-center justify-center rounded-full bg-white/80 hover:bg-white text-stone-800 shadow-xs transition-all duration-150 active:scale-90 ${
              isWishlisted ? 'text-[#D80000]' : 'text-stone-800'
            }`}
            aria-label="Add to wishlist"
            title="Wishlist"
          >
            <FiHeart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-current text-[#D80000]' : 'stroke-[2]'}`} />
          </button>

          {/* Product image container */}
          <div className="absolute inset-0">
            {frontSrc ? (
              <>
                {/* Primary Image (fades out on hover if 2nd image exists, otherwise zooms slightly) */}
                <Image
                  ref={imgRef}
                  src={frontSrc}
                  alt={frontAlt}
                  fill
                  loading="lazy"
                  decoding="async"
                  loader={isCloudinary ? cloudinaryLoader : undefined}
                  unoptimized={isBackend}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className={`h-full w-full ${
                    imageFit === 'full' ? 'object-contain object-center' : 'object-cover object-top'
                  } transition-all duration-500 ease-out will-change-transform ${
                    hoverSrc ? 'group-hover:opacity-0' : 'group-hover:scale-105'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  draggable={false}
                />

                {/* Second Image on Hover (if product has 2 or more images) */}
                {hoverSrc && (
                  <Image
                    src={hoverSrc}
                    alt={`${frontAlt} - alternate view`}
                    fill
                    loading="lazy"
                    decoding="async"
                    loader={isCloudinaryUrl(hoverSrc) ? cloudinaryLoader : undefined}
                    unoptimized={isBackendUploadUrl(hoverSrc)}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className={`h-full w-full ${
                      imageFit === 'full' ? 'object-contain object-center' : 'object-cover object-top'
                    } opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100`}
                    draggable={false}
                  />
                )}
              </>
            ) : (
              <div className="h-full w-full bg-stone-100 flex items-center justify-center">
                <span className="text-xs text-stone-400 uppercase font-semibold">No Image</span>
              </div>
            )}
          </div>

          {/* Circular Shopping Bag Quick Action on Bottom-Left matching Image 2 */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="absolute bottom-2.5 left-2.5 z-20 inline-flex w-7 h-7 sm:w-8 sm:h-8 items-center justify-center rounded-full bg-white/85 hover:bg-white text-stone-800 shadow-sm transition-all duration-150 active:scale-90"
            aria-label="Add to cart"
            title="Add to cart"
          >
            <FiShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
          </button>
        </div>

        {/* Product Details below image: Centered Title and Pricing matching Image 2 */}
        <div className="pt-2 pb-2.5 px-1 sm:px-2 flex flex-col items-center text-center">
          <h3 className="text-center text-[12.5px] sm:text-[13.5px] font-semibold text-[#111] dark:text-stone-100 line-clamp-1 group-hover:text-black dark:group-hover:text-white transition-colors">
            {name.replace(/\s*\|\s*Top Threadz\s*/i, '')}
          </h3>

          <div className="mt-1 flex items-center justify-center gap-2 text-center">
            {discount > 0 ? (
              <>
                <span className="text-xs sm:text-[13px] font-normal text-stone-800 dark:text-stone-400 line-through">
                  Rs {price.toLocaleString('en-US')}
                </span>
                <span className="text-xs sm:text-[13px] font-bold text-[#D80000]">
                  Rs {Math.round(effectivePrice).toLocaleString('en-US')}
                </span>
              </>
            ) : (
              <span className="text-xs sm:text-[13px] font-bold text-[#111] dark:text-stone-100">
                Rs {Math.round(price).toLocaleString('en-US')}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

