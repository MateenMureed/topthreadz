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

  useEffect(() => {
    setImageState('loading');
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
        {/* Image container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[#f4f2ee] rounded-xl cursor-pointer">

          {/* Product image — object-cover object-top so model and suit are always centered & sharp */}
          <div className="absolute inset-0">
            {frontSrc ? (
              <>
                {imageState === 'loading' ? <div className="absolute inset-0 bg-stone-100 shimmer" aria-hidden="true" /> : null}
                <Image
                  ref={imgRef}
                  src={frontSrc}
                  alt={frontAlt}
                  fill
                  loading="lazy"
                  decoding="async"
                  unoptimized={isBackendUploadUrl(frontSrc)}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className={`h-full w-full object-cover object-top transition-[opacity,transform] duration-500 ease-out will-change-transform group-hover:scale-[1.05] ${imageState === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                  style={{ transformOrigin: '50% 50%' }}
                  onLoad={() => setImageState('loaded')}
                  onError={() => setImageState('error')}
                  draggable={false}
                />
                {imageState === 'error' ? <div className="absolute inset-0 bg-stone-200" aria-hidden="true" /> : null}
              </>
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-stone-100 to-stone-200 transition-transform duration-500 ease-out group-hover:scale-[1.05]" />
            )}
          </div>

          {/* Subtle dark tint on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 pointer-events-none" />

          {/* Wishlist button — 44x44px touch target, appears on hover or touch */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
            className={`absolute right-2 top-2 sm:right-3 sm:top-3 z-20 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full shadow-md backdrop-blur-md transition-all duration-300
              opacity-90 sm:opacity-0 translate-y-0 sm:translate-y-1 sm:group-hover:opacity-100 sm:group-hover:translate-y-0
              pointer-events-auto
              ${isWishlisted ? 'bg-white/95 text-pink-600 border border-pink-200' : 'bg-white/95 text-slate-900 border border-slate-200/80 hover:scale-105'}`}
            aria-label="Add to wishlist"
            title="Wishlist"
          >
            <FiHeart className={`h-4 w-4 ${isWishlisted ? 'fill-current text-pink-600' : 'text-slate-900 stroke-[2.2]'}`} />
          </button>

          {/* Add to Cart — 44px touch target, slides up from bottom */}
          <div
            className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center pb-3 pt-10 translate-y-0 sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-300 ease-out pointer-events-auto"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)' }}
          >
            <button
              type="button"
              onClick={handleAddToCart}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white text-slate-950 px-5 py-2.5 text-[12px] sm:text-[13px] font-bold shadow-lg hover:bg-slate-950 hover:text-white transition-all duration-200 active:scale-95"
              aria-label="Add to cart"
            >
              <FiShoppingBag className="h-4 w-4 stroke-[2.5]" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>

        <div className="pt-2.5 sm:pt-3.5">
          {/* Category / Subcategory standard label */}
          <p className="truncate text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-[0.18em]">
            Men | {subcategory || category || 'Premium Fabric'}
          </p>

          {/* Title with clean 2-line clamp */}
          <h3 className="mt-1 line-clamp-2 text-[13px] sm:text-[14px] font-bold leading-snug text-slate-950 group-hover:text-slate-700 transition-colors">
            {name}
          </h3>

          {/* Price & discount row */}
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <span className="text-[14px] sm:text-[15px] font-black leading-none text-slate-950">
              PKR {Math.round(effectivePrice).toLocaleString()}
            </span>
            {discount > 0 ? (
              <span className="text-[11px] sm:text-[12px] font-semibold leading-none text-slate-400 line-through">
                PKR {price.toLocaleString()}
              </span>
            ) : null}
            {discount > 0 ? (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.02em] text-white">
                {discount}% Off
              </span>
            ) : null}
          </div>

          {/* Available sizes */}
          {sizes.length > 0 ? (
            <div className="mt-2 flex items-center gap-1 flex-wrap">
              {sizes.slice(0, 4).map((size) => (
                <span
                  key={size}
                  className="inline-flex items-center justify-center rounded border border-slate-300/80 bg-white px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-slate-700 leading-none shadow-2xs"
                >
                  {size}
                </span>
              ))}
              {sizes.length > 4 && (
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">+{sizes.length - 4}</span>
              )}
            </div>
          ) : null}
        </div>
      </article>
    </Link>
    </>
  );
}
