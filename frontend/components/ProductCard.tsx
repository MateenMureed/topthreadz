'use client';

import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
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
  /** "full" shows the entire product image (no crop) â€” used on category pages */
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
  category,
  subcategory,
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
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');

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

  const frontSrc = resolveImageUrl(orderedImages[0] || '');
  const frontAlt = imageAltMap.get(frontSrc) || name;
  const isCloudinary = isCloudinaryUrl(frontSrc);
  const isBackend = isBackendUploadUrl(frontSrc);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setImageState(imgRef.current.naturalWidth > 0 ? 'loaded' : 'error');
      return;
    }
    setImageState('loading');
    const timer = setTimeout(() => {
      setImageState((prev) => (prev === 'loading' ? 'loaded' : prev));
    }, 2500);
    return () => clearTimeout(timer);
  }, [frontSrc]);

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
            Checkout â†’
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
        } catch {
          // Fallback to local toggle if server call fails
        }
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
      toast.success(nextState ? 'Added to wishlist â¤ï¸' : 'Removed from wishlist');
    } catch {
      toast.error('Could not update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <>
    <Link href={productHref} className="block">
      <article className="group flex flex-col h-full">
        {/* Image container with 3:4 aspect ratio preserved */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[#F4F2EE] dark:bg-[#1E2228] rounded-xl cursor-pointer">
          {/* Top-left Badges matching reference mockup */}
          <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1 pointer-events-none">
            {discount > 0 ? (
              <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white bg-[#B91C2B] rounded shadow-xs">
                SALE
              </span>
            ) : /sage|cream|ivory|sky/i.test(name) ? (
              <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white bg-[#1E2229] rounded shadow-xs">
                {/sage/i.test(name) ? 'BEST SELLER' : 'NEW'}
              </span>
            ) : null}
          </div>

          {/* Product image — object-cover object-top */}
          <div className="absolute inset-0">
            {frontSrc ? (
              <>
                {imageState === 'loading' && (
                  <div className="absolute inset-0 dark:bg-[#1e2228] bg-stone-100 flex flex-col items-center justify-center gap-1.5" aria-hidden="true">
                    <div className="shimmer absolute inset-0" />
                    <span className="relative text-[11px] sm:text-xs font-black tracking-[0.28em] text-stone-400 select-none brand-loading-anim">
                      TOP THREADZ
                    </span>
                    <span className="relative text-[9px] font-semibold uppercase tracking-widest text-stone-300 brand-loading-anim-delayed">
                      Loading
                    </span>
                  </div>
                )}
                <Image
                  ref={imgRef}
                  src={frontSrc}
                  alt={frontAlt}
                  fill
                  loading="lazy"
                  decoding="async"
                  loader={isCloudinary ? cloudinaryLoader : undefined}
                  unoptimized={isBackend}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className={`h-full w-full transform-origin-center ${imageFit === 'full' ? 'object-contain object-center p-0.5 bg-white' : 'object-cover object-top'} transition-[opacity,transform] duration-500 ease-out will-change-transform group-hover:scale-[1.04] ${imageState === 'loaded' ? 'opacity-100' : 'opacity-85'}`}
                  onLoad={() => setImageState('loaded')}
                  onError={() => {
                    setImageState('loaded');
                  }}
                  draggable={false}
                />
                {imageState === 'error' ? <div className="absolute inset-0 bg-stone-200" aria-hidden="true" /> : null}
              </>
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-stone-100 to-stone-200" />
            )}
          </div>

          {/* Subtle dark tint on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 pointer-events-none" />

          {/* Wishlist button — top right */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
            className={`absolute right-2 top-2 sm:right-2.5 sm:top-2.5 z-20 inline-flex w-8 h-8 sm:w-9 sm:h-9 items-center justify-center rounded-full shadow-xs backdrop-blur-md transition-all duration-150
              pointer-events-auto active:scale-[0.96]
              ${isWishlisted ? 'bg-white text-[#B91C2B]' : 'bg-white/90 hover:bg-white text-[#1E2229]'}`}
            aria-label="Add to wishlist"
            title="Wishlist"
          >
            <FiHeart className={`h-4 w-4 ${isWishlisted ? 'fill-current text-[#B91C2B]' : 'text-[#1E2229] stroke-[2]'}`} />
          </button>
        </div>

        {/* Product Details below image */}
        <div className="pt-2.5 sm:pt-3 flex flex-col flex-1 justify-between">
          <div>
            {/* Category / Subcategory kicker */}
            <p className="truncate text-[10px] sm:text-[10.5px] font-bold text-[#8C93A0] uppercase tracking-[0.16em]">
              MEN | {subcategory || category || 'UNSTITCHED'}
            </p>

            {/* Product Title */}
            <h3 className="mt-1 line-clamp-2 text-[13px] sm:text-[13.5px] font-medium leading-snug text-[#1E2229] dark:text-[#F1F5F9] group-hover:text-[#0F1F3D] dark:group-hover:text-white transition-colors">
              {name.replace(/\s*\|\s*Top Threadz\s*/i, '')}
            </h3>

            {/* Price row matching reference design */}
            <div className="mt-1.5 flex items-center gap-2">
              {discount > 0 ? (
                <>
                  <span className="text-[11px] sm:text-[12px] font-medium text-[#8C93A0] line-through">
                    PKR {price.toLocaleString('en-US')}
                  </span>
                  <span className="text-[13.5px] sm:text-[14px] font-bold text-[#B91C2B]">
                    PKR {Math.round(effectivePrice).toLocaleString('en-US')}
                  </span>
                </>
              ) : (
                <span className="text-[13.5px] sm:text-[14px] font-bold text-[#1E2229] dark:text-[#F1F5F9]">
                  PKR {Math.round(price).toLocaleString('en-US')}
                </span>
              )}
            </div>

            {/* Color swatches preview dots matching reference mockup */}
            <div className="mt-2 flex items-center gap-1.5">
              {/cream|ivory|white/i.test(name) ? (
                <>
                  <span className="w-3 h-3 rounded-full bg-[#F5F2EB] border border-stone-300" />
                  <span className="w-3 h-3 rounded-full bg-[#EADCC9] border border-stone-300" />
                </>
              ) : /sage|green/i.test(name) ? (
                <>
                  <span className="w-3 h-3 rounded-full bg-[#9DA895] border border-stone-300" />
                  <span className="w-3 h-3 rounded-full bg-[#4E5B4B] border border-stone-300" />
                </>
              ) : /sky|blue/i.test(name) ? (
                <>
                  <span className="w-3 h-3 rounded-full bg-[#A7C5EB] border border-stone-300" />
                  <span className="w-3 h-3 rounded-full bg-[#D4E2D4] border border-stone-300" />
                  <span className="w-3 h-3 rounded-full bg-[#FFFFFF] border border-stone-300" />
                </>
              ) : /navy/i.test(name) ? (
                <>
                  <span className="w-3 h-3 rounded-full bg-[#1E3A8A] border border-stone-300" />
                  <span className="w-3 h-3 rounded-full bg-[#0F1F3D] border border-stone-300" />
                </>
              ) : (
                <>
                  <span className="w-3 h-3 rounded-full bg-[#1A1A1A] border border-stone-300" />
                  <span className="w-3 h-3 rounded-full bg-[#4B5563] border border-stone-300" />
                </>
              )}
            </div>
          </div>

          {/* Full-width dark navy Add to Cart button matching reference mockup */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full mt-3 py-2.5 sm:py-2.5 px-3 rounded-lg bg-[#0F1F3D] hover:bg-[#1A2D52] text-white text-[11px] sm:text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] shadow-2xs"
            aria-label="Add to cart"
          >
            <FiShoppingBag className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>ADD TO CART</span>
          </button>
        </div>
      </article>
    </Link>
    </>
  );
}
