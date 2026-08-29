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
  subcategory?: string;
  sizes?: string[];
  colors?: string[];
  slug?: string;
  imageMeta?: ProductImageMeta[];
  priority?: boolean;
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
  priority = false,
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

  useEffect(() => {
    setImageState('loading');
  }, [frontSrc]);

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
      toast.success(nextState ? 'Added to wishlist ❤️' : 'Removed from wishlist');
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
          {/* Top-left category badge */}
          {(subcategory || category) ? (
            <span className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10 rounded-full bg-slate-950 px-3 py-1 text-[10px] sm:text-[11px] font-bold text-white shadow-md border border-black/10 tracking-wider uppercase">
              {subcategory || category}
            </span>
          ) : null}

          <div className="absolute inset-0">
            {frontSrc ? (
              <>
                {/* The neutral overlay stays inside the already-reserved 3:4 frame. */}
                {imageState === 'loading' ? <div className="absolute inset-0 bg-stone-100 shimmer" aria-hidden="true" /> : null}
                <Image
                  ref={imgRef}
                  src={frontSrc}
                  alt={frontAlt}
                  fill
                  priority={priority}
                  loading={priority ? 'eager' : 'lazy'}
                  decoding="async"
                  unoptimized={isBackendUploadUrl(frontSrc)}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className={`h-full w-full object-cover object-center transition-[opacity,transform] duration-[200ms] ease-out will-change-transform group-hover:scale-[1.35] ${imageState === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                  style={{ transformOrigin: '50% 50%' }}
                  onLoad={() => setImageState('loaded')}
                  onError={() => setImageState('error')}
                  draggable={false}
                />
                {imageState === 'error' ? <div className="absolute inset-0 bg-stone-200" aria-hidden="true" /> : null}
              </>
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
            className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-10 flex h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 flex-col items-center justify-center rounded-full bg-slate-950 text-white shadow-md transition-all duration-200 hover:bg-black hover:scale-105 active:scale-95"
            aria-label="Add to bag"
            title="Add to bag"
          >
            <span className="relative">
              <FiShoppingBag className="h-4 w-4 stroke-[2.5]" />
              <span className="absolute -right-1 -top-1 text-[9px] font-bold leading-none">+</span>
            </span>
          </button>

          <button
            type="button"
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
            className={`absolute right-2 top-2 sm:right-3 sm:top-3 z-10 inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 ${isWishlisted ? 'bg-pink-50 text-pink-600 border border-pink-200' : 'bg-white text-slate-950 border border-slate-200'}`}
            aria-label="Add to wishlist"
            title="Love"
          >
            <FiHeart className={`h-4 w-4 ${isWishlisted ? 'fill-current text-pink-600' : 'text-slate-950 stroke-[2.5]'}`} />
          </button>

          {/* Quick View Hover Overlay */}
          <div className="absolute inset-x-0 bottom-0 z-10 hidden md:flex items-center justify-center bg-slate-950/80 backdrop-blur-md py-2 text-white text-[11px] font-bold uppercase tracking-[0.18em] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            Quick View →
          </div>
        </div>

        <div className="pt-3 md:pt-4">
          <p className="truncate text-[11px] min-[768px]:max-[1023px]:text-xs font-bold text-slate-600 uppercase tracking-widest">{category}</p>
          <h3 className="mt-1 line-clamp-2 text-[14px] sm:text-[15px] font-bold leading-snug text-slate-950">{name}</h3>

          <div className="mt-1.5 md:mt-2 flex items-center gap-2">
            {discount > 0 ? (
              <span className="text-[12px] sm:text-[13px] font-semibold leading-none text-slate-400 line-through">PKR {price.toLocaleString()}</span>
            ) : null}
            <span className="text-[15px] sm:text-[16px] font-black leading-none text-slate-950">PKR {Math.round(effectivePrice).toLocaleString()}</span>
          </div>

          {discount > 0 ? (
            <div className="mt-2 md:mt-2.5 flex items-center gap-1.5">
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.02em] text-white shadow-xs">
                {discount}% Off
              </span>
            </div>
          ) : null}
        </div>
      </article>
    </Link>
    </>
  );
}
