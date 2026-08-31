'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import { experienceService } from '@/services/experience.service';
import { STANDARD_PRODUCT_DETAILS, STANDARD_SEO_TAGS } from '@/lib/standardProductDetails';
import ProductGrid from '@/components/ProductGrid';
import ProductImageGallery from '@/components/ProductImageGallery';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { FiMinus, FiPlus, FiHeart, FiShoppingBag } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import ScrollReveal from '@/components/ScrollReveal';
import { resolveImageUrl } from '@/lib/images';

function stripHtml(html: string) {
  if (typeof window === 'undefined') return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

function sanitizeRichHtml(html?: string) {
  const input = (html || '').trim();
  if (!input) return '';
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function cleanDescriptionMetadata(text: string): string {
  let cleaned = text || '';
  
  const metadataRegexes = [
    /category:\s*[^\n<]+/gi,
    /subcategory:\s*[^\n<]+/gi,
    /available\s+sizes?:\s*[^\n<]+/gi,
    /sizes?:\s*[^\n<]+/gi,
    /available\s+colors?:\s*[^\n<]+/gi,
    /product\s+category:\s*[^\n<]+/gi,
    /fit:\s*[^\n<]+/gi,
  ];

  metadataRegexes.forEach((regex) => {
    cleaned = cleaned.replace(regex, '');
  });

  return cleaned.trim();
}

interface DescriptionBlock {
  type: 'paragraph' | 'heading' | 'list';
  text?: string;
  items?: string[];
}

export function FormattedProductDescription({ content }: { content?: string }) {
  if (!content) return null;

  // 1. Convert block-level HTML tags into line breaks so HTML div/p/li/br content is properly separated
  let processed = content
    .replace(/<\/(div|p|h[1-6]|li|tr|section|article)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<hr\s*\/?>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ');

  processed = decodeHtmlEntities(processed);
  processed = cleanDescriptionMetadata(processed);

  // Extract non-empty lines
  const rawLines = processed
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (rawLines.length === 0) return null;

  // 2. Parse lines into structured blocks
  const blocks: DescriptionBlock[] = [];
  let currentListItems: string[] = [];

  const flushList = () => {
    if (currentListItems.length > 0) {
      blocks.push({ type: 'list', items: [...currentListItems] });
      currentListItems = [];
    }
  };

  const isHeading = (line: string, nextLine?: string) => {
    if (/^(premium\s+features|features|key\s+features|product\s+features|highlights|product\s+details|specifications|fabric\s+details|care\s+instructions|why\s+choose\s+this):?$/i.test(line)) {
      return true;
    }
    if (line.endsWith(':') && line.length <= 40) {
      return true;
    }
    if (line.length <= 35 && !line.endsWith('.') && nextLine && nextLine.length <= 60 && !nextLine.endsWith('.')) {
      return true;
    }
    return false;
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const nextLine = rawLines[i + 1];

    const cleanLine = line.replace(/^[-*•✓✔▸▪]\s*/, '').trim();

    if (isHeading(cleanLine, nextLine)) {
      flushList();
      blocks.push({ type: 'heading', text: cleanLine.replace(/:$/, '') });
      continue;
    }

    const hasBulletPrefix = /^[-*•✓✔▸▪]\s*/.test(line) || /^\d+[\.\)]\s*/.test(line);
    const lastBlock = blocks[blocks.length - 1];
    const isFollowingHeading = lastBlock?.type === 'heading';

    const isListItem =
      hasBulletPrefix ||
      (isFollowingHeading && cleanLine.length <= 80) ||
      (currentListItems.length > 0 && cleanLine.length <= 80 && !cleanLine.endsWith('.'));

    if (isListItem) {
      currentListItems.push(cleanLine);
    } else {
      flushList();
      blocks.push({ type: 'paragraph', text: cleanLine });
    }
  }
  flushList();

  return (
    <div className="space-y-2 text-[13px] sm:text-sm text-surface-800 leading-snug font-sans text-justify">
      {blocks.map((block, i) => {
        if (block.type === 'heading') {
          return (
            <div key={i} className="pt-2 pb-0.5">
              <h3 className="font-display font-bold text-sm text-surface-950 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 inline-block shrink-0" />
                {block.text}
              </h3>
              <div className="h-0.5 w-8 bg-surface-950/20 mt-0.5 rounded-full" />
            </div>
          );
        }

        if (block.type === 'list' && block.items) {
          return (
            <ul key={i} className="space-y-1 my-1 pl-0.5">
              {block.items.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-[13px] sm:text-sm text-surface-900 leading-snug">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600/80" />
                  <span className="font-medium tracking-tight text-surface-900">{item}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="leading-snug text-surface-700 tracking-normal text-justify">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function normalizeColorToken(value?: string) {
  return (value || '').toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '');
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [addedInline, setAddedInline] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [careExpanded, setCareExpanded] = useState(false);
  const { addItem, openCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();



  const { data, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      try {
        // Storefront URLs use human-readable slugs. Looking them up as UUIDs
        // first produced an expected-but-noisy 404 on every direct product visit.
        return await productService.getBySlug(id);
      } catch {
        try {
          // Preserve support for legacy links that contain a database UUID.
          return await productService.getById(id);
        } catch {
          const normalized = normalizeSlug(id);
          if (normalized && normalized !== id) {
            return await productService.getBySlug(normalized);
          }
          throw new Error('Product not found');
        }
      }
    },
    enabled: !!id,
  });

  const { data: similarData } = useQuery({
    queryKey: ['similar', id],
    queryFn: () => productService.getSimilar(id),
    enabled: !!id,
  });

  const { data: recommendedData } = useQuery({
    queryKey: ['recommended-products', id],
    queryFn: () => productService.getAll({ limit: 8, sortBy: 'recommended' }),
    enabled: !!id,
  });

  const { data: upsellData } = useQuery({
    queryKey: ['upsell', id],
    queryFn: () => productService.getUpsell(id),
    enabled: !!id,
  });

  const { data: wishlistData } = useQuery({
    queryKey: ['experience', 'wishlist', id],
    queryFn: () => experienceService.getWishlist(),
    enabled: isAuthenticated && !!id,
  });

  const { data: recentlyViewedData } = useQuery({
    queryKey: ['experience', 'recently-viewed'],
    queryFn: () => experienceService.getRecentlyViewed(),
    enabled: isAuthenticated,
  });

  const product = data?.data;
  const similar = similarData?.data || [];
  const recommendedPool = recommendedData?.data?.products || [];
  const upsell = upsellData?.data || [];
  const recentlyViewed = (recentlyViewedData?.data || []).filter((item: any) => item.id !== id).slice(0, 4);

  useEffect(() => {
    const wishlistItems = wishlistData?.data || [];
    const found = wishlistItems.some((item: any) => item.productId === id || item.product?.id === id);
    setIsWishlisted(found);
  }, [id, wishlistData]);

  useEffect(() => {
    if (!isAuthenticated || !id) return;

    productService.recordView(id).catch(() => {
      // Non-blocking telemetry call
    });

    experienceService.trackEvent('PRODUCT_VIEW', { productId: id }, `/products/${id}`).catch(() => {
      // Non-blocking analytics call
    });
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (selectedSize || !product?.sizes?.length) return;
    setSelectedSize(product.sizes[0]);
  }, [product?.id, product?.sizes, selectedSize]);

  useEffect(() => {
    if (selectedColor || !product?.colors?.length) return;
    setSelectedColor(product.colors[0]);
  }, [product?.id, product?.colors, selectedColor]);

  // Category-based placeholder gradients
  const categoryGradients: Record<string, string> = {
    'Shalwar Kameez': 'from-amber-100 via-amber-50 to-orange-50',
    'Kurta': 'from-blue-100 via-indigo-50 to-purple-50',
    'Waistcoat': 'from-gray-200 via-gray-100 to-slate-100',
    'T-Shirts & Polos': 'from-rose-100 via-pink-50 to-red-50',
    'Shirts': 'from-sky-100 via-blue-50 to-cyan-50',
    'Pants': 'from-stone-200 via-stone-100 to-zinc-100',
    'Shawls': 'from-emerald-100 via-teal-50 to-green-50',
    'Footwear': 'from-orange-100 via-amber-50 to-yellow-50',
  };

  const colorThemeMap: Record<string, { gradient: string; imageFrameClass: string; addToBagClass: string }> = {
    black: { gradient: 'from-zinc-300 via-zinc-200 to-neutral-100', imageFrameClass: 'border-zinc-400/70 shadow-zinc-300/40', addToBagClass: 'bg-zinc-900 text-white' },
    white: { gradient: 'from-slate-100 via-white to-slate-50', imageFrameClass: 'border-slate-300 shadow-slate-200/50', addToBagClass: 'bg-slate-700 text-white' },
    navyblue: { gradient: 'from-blue-300 via-indigo-200 to-sky-100', imageFrameClass: 'border-blue-400/60 shadow-blue-300/45', addToBagClass: 'bg-blue-800 text-white' },
    royalblue: { gradient: 'from-indigo-300 via-blue-200 to-cyan-100', imageFrameClass: 'border-indigo-400/60 shadow-indigo-300/45', addToBagClass: 'bg-indigo-700 text-white' },
    skyblue: { gradient: 'from-sky-300 via-cyan-200 to-blue-100', imageFrameClass: 'border-sky-400/60 shadow-sky-300/45', addToBagClass: 'bg-sky-700 text-white' },
    grey: { gradient: 'from-zinc-300 via-slate-200 to-gray-100', imageFrameClass: 'border-zinc-400/60 shadow-zinc-300/45', addToBagClass: 'bg-zinc-700 text-white' },
    brown: { gradient: 'from-amber-300 via-orange-200 to-stone-100', imageFrameClass: 'border-amber-400/60 shadow-amber-300/45', addToBagClass: 'bg-amber-800 text-white' },
    maroon: { gradient: 'from-rose-300 via-red-200 to-orange-100', imageFrameClass: 'border-rose-500/45 shadow-rose-300/45', addToBagClass: 'bg-rose-800 text-white' },
    bottlegreen: { gradient: 'from-emerald-300 via-green-200 to-lime-100', imageFrameClass: 'border-emerald-500/45 shadow-emerald-300/45', addToBagClass: 'bg-emerald-800 text-white' },
  };

  // Generate placeholder images for the gallery (different gradient angles)
  const placeholderImages = [
    { angle: 'to-br', label: 'Front View' },
    { angle: 'to-tr', label: 'Back View' },
    { angle: 'to-r', label: 'Side View' },
    { angle: 'to-bl', label: 'Detail View' },
  ];



  // ============================================================
  // Loading state
  // ============================================================
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <div className="aspect-[3/4] rounded-2xl bg-surface-100 relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
            </div>
            <div className="hidden md:flex gap-3">
              {[0,1,2,3].map(i => (
                <div key={i} className="w-20 h-20 rounded-xl bg-surface-100 relative overflow-hidden">
                  <div className="absolute inset-0 shimmer" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-3 w-20 bg-surface-200 rounded-full animate-pulse" />
            <div className="h-8 w-3/4 bg-surface-200 rounded-full animate-pulse" />
            <div className="h-10 w-40 bg-surface-200 rounded-full animate-pulse" />
            <div className="h-24 w-full bg-surface-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
      </div>
    );
  }

  const effectivePrice = product.price * (1 - product.discount / 100);
  const primaryColorToken = normalizeColorToken(selectedColor || product.colors?.[0] || '');
  const colorTheme = colorThemeMap[primaryColorToken];
  const gradient = colorTheme?.gradient || categoryGradients[product.category] || 'from-surface-200 via-surface-100 to-surface-50';
  const addToBagTheme = colorTheme?.addToBagClass || 'bg-surface-800 text-white';
  const galleryImages: string[] = Array.isArray(product.images) ? product.images.map((image: string) => resolveImageUrl(image)).filter(Boolean) : [];
  const primaryImage = galleryImages[0] || '';
  const plainDescription = stripHtml(product.description || '');
  const cleanedDescription = plainDescription ? plainDescription.replace(/category:\s*[^\n<]+/gi, '').replace(/sizes?:\s*[^\n<]+/gi, '').trim() : product.name;
  const dynamicDetailRows = [
    { label: 'Category', value: product.category },
    { label: 'Subcategory', value: product.subcategory },
    { label: 'Fit', value: product.fitType },
    { label: 'Fabric', value: product.fabric },
    { label: 'Sizes', value: Array.isArray(product.sizes) && product.sizes.length ? product.sizes.join(', ') : '' },
    { label: 'Colors', value: Array.isArray(product.colors) && product.colors.length ? product.colors.join(', ') : '' },
  ].filter((row) => Boolean(row.value));
  const recommendationCandidates = similar.length
    ? similar
    : recommendedPool.filter((item: any) => item.id !== product.id);
  const pageRecommendations = recommendationCandidates.slice(0, 8);
  const isStitchedProduct = product.category?.toLowerCase().trim() === 'stitched';
  const optionLabel = isStitchedProduct ? 'Size' : 'Fabric length';
  const lowStockThreshold = Number(product.lowStockThreshold ?? 5);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= lowStockThreshold;
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: cleanedDescription || `${product.name} unstitched menswear product`,
    category: 'Unstitched',
    image: galleryImages.length ? galleryImages : undefined,
    sku: product.sku || `${product.id}-UNSTITCHED`,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Top Threadz',
    },
    additionalProperty: STANDARD_PRODUCT_DETAILS.map((detail) => ({
      '@type': 'PropertyValue',
      name: detail.label,
      value: detail.value,
    })),
    keywords: STANDARD_SEO_TAGS.join(', '),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PKR',
      price: Math.round(effectivePrice),
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  const handleAddToCart = () => {
    if (product.sizes.length > 0 && !selectedSize) {
      toast.error(`Please select a ${optionLabel.toLowerCase()}`);
      return;
    }
    addItem({
      id: `${product.id}-${selectedSize}-${selectedColor}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      discount: product.discount,
      image: primaryImage,
      quantity,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
    });

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) {
      setAddedInline(true);
      toast((t) => (
        <div className="flex items-center justify-between gap-3 text-xs w-full">
          <span>Added to Bag!</span>
          <Link
            href="/checkout"
            onClick={() => toast.dismiss(t.id)}
            className="rounded-lg bg-emerald-700 px-2.5 py-1 text-white font-bold shrink-0 hover:bg-emerald-800"
          >
            Proceed to Checkout →
          </Link>
        </div>
      ), { duration: 4000 });
      setTimeout(() => setAddedInline(false), 4000);
    } else {
      toast.success('Added to cart!');
      openCart();
    }
  };

  const handleToggleWishlist = async () => {
    if (wishlistLoading || !product?.id) return;
    setWishlistLoading(true);

    try {
      let nextState = !isWishlisted;

      if (isAuthenticated) {
        try {
          const result = await experienceService.toggleWishlist(product.id);
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
          updated = Array.from(new Set([...localWishlist, product.id, ...(product.slug ? [product.slug] : [])]));
        } else {
          updated = localWishlist.filter((itemKey) => itemKey !== product.id && itemKey !== product.slug);
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
    <div className="max-w-7xl mx-auto px-4 py-5 sm:py-6 md:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-12">
        {/* ============================================================
            PREMIUM IMAGE GALLERY — With advanced zoom system
            ============================================================ */}
        <ProductImageGallery
          images={galleryImages}
          name={product.name}
          category={product.category}
        />

        {/* ============================================================
            PRODUCT INFO
            ============================================================ */}
        <ScrollReveal animation="slide-up" delay={200} className="animate-fade-in px-4 md:px-0 pt-6 md:pt-0">
          <p className="text-sm text-surface-500 font-semibold">{product.category}</p>
          <h1 className="font-display text-2xl md:text-3xl font-bold mt-2 leading-tight">{product.name}</h1>

          {/* Price */}
          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-bold text-surface-900">
              PKR {Math.round(effectivePrice).toLocaleString()}
            </span>
            {product.discount > 0 && (
              <>
                <span className="text-base text-surface-500 line-through">PKR {product.price.toLocaleString()}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-700 text-xs font-semibold">
                  Save {product.discount}%
                </span>
              </>
            )}
          </div>

          <p className="mt-2 text-sm text-surface-500">SKU: {product.sku || product.id.slice(0, 12)}</p>

          {/* Stock */}
          <div className="mt-3 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${!isOutOfStock && !isLowStock ? 'bg-accent-500 animate-pulse' : 'bg-red-500'}`} />
            <p className={`text-sm font-medium ${!isOutOfStock && !isLowStock ? 'text-accent-600' : 'text-red-500'}`}>
              {!isOutOfStock && !isLowStock ? `${product.stock} in stock` : isLowStock ? `Low stock (${product.stock} left)` : 'Out of stock'}
            </p>
          </div>

          {/* Purchase controls */}
          <div className="mt-6 border-t border-surface-200 pt-4 space-y-3">
            {addedInline && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900 transition-all animate-fade-in flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">✓</span>
                  <span className="font-semibold">Added to Bag!</span>
                </div>
                <Link
                  href="/checkout"
                  className="rounded-lg bg-emerald-800 px-3 py-1.5 font-bold text-white transition hover:bg-emerald-900"
                >
                  Checkout →
                </Link>
              </div>
            )}

            {Array.isArray(product.sizes) && product.sizes.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-surface-700">{optionLabel}</p>
                  {selectedSize && <span className="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-surface-700 font-medium">Selected: {selectedSize}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size: string) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`min-h-11 rounded-xl border px-3.5 py-1.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-900 focus-visible:ring-offset-2 ${
                        selectedSize === size
                          ? 'border-surface-900 bg-surface-900 text-white shadow-sm'
                          : 'border-surface-300 bg-white text-surface-700 hover:border-surface-400 hover:bg-surface-50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(product.colors) && product.colors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-surface-700">Color</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color: string) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`min-h-11 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-900 focus-visible:ring-offset-2 ${selectedColor === color ? 'border-surface-900 bg-surface-900 text-white' : 'border-surface-300 bg-white text-surface-700 hover:bg-surface-100'}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-end gap-3 border-t border-surface-200 pt-4">
              <div>
                <p className="mb-1 text-sm font-semibold text-surface-700">Quantity</p>
                <div className="qty-chip min-h-11">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity">
                    <FiMinus className="w-4 h-4" />
                  </button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity">
                    <FiPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleWishlist}
                className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-900 focus-visible:ring-offset-2 ${isWishlisted ? 'border-pink-400 text-pink-600' : 'border-surface-300 text-surface-700 hover:border-pink-400 hover:text-pink-600'}`}
                disabled={wishlistLoading}
                aria-pressed={isWishlisted}
              >
                <FiHeart className="w-4 h-4" /> {isWishlisted ? 'Saved' : 'Wishlist'}
              </button>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`min-h-11 flex-1 rounded-xl px-5 py-3 text-sm font-semibold transition-colors hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-900 focus-visible:ring-offset-2 disabled:opacity-60 ${addToBagTheme}`}
                id="add-to-cart"
              >
                {addedInline ? '✓ Added to Bag' : product.stock === 0 ? 'Sold out' : 'Add to Bag'}
              </button>
            </div>

            {addedInline && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 transition-all animate-fade-in flex items-center justify-between gap-2 shadow-sm">
                <span className="font-semibold">Added to Bag</span>
                <Link href="/checkout" className="rounded-lg bg-emerald-800 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-900">Checkout</Link>
              </div>
            )}

            <div className="space-y-0 border-y border-surface-200">
              <button
                type="button"
                onClick={() => setDetailsExpanded((prev) => !prev)}
                className="flex w-full items-center justify-between py-3 text-left"
              >
                <h2 className="text-xl font-semibold text-surface-800">Details</h2>
                <span className="text-2xl text-surface-600">{detailsExpanded ? '−' : '+'}</span>
              </button>
              {detailsExpanded && (
                <div className="pb-3 text-sm text-surface-700 space-y-3">
                  <FormattedProductDescription content={product.description || product.name} />
                  <div className="grid grid-cols-1 gap-y-1 pt-3 border-t border-surface-200 text-xs">
                    {dynamicDetailRows.map((detail) => (
                      <p key={detail.label}><span className="font-semibold text-surface-900">{detail.label}:</span> {detail.value}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-0 border-b border-surface-200">
              <button
                type="button"
                onClick={() => setCareExpanded((prev) => !prev)}
                className="flex w-full items-center justify-between py-3 text-left"
              >
                <h2 className="text-xl font-semibold text-surface-800">Care instructions</h2>
                <span className="text-2xl text-surface-600">{careExpanded ? '−' : '+'}</span>
              </button>
              {careExpanded && (
                <div className="pb-3 text-sm text-surface-700">
                  {product.careInstructions || 'Dry clean recommended. Do not bleach. Iron at medium heat.'}
                </div>
              )}
            </div>

          </div>
        </ScrollReveal>
      </div>

      {/* Lightbox is now handled inside ProductImageGallery */}

      {/* ============================================================
          SMART UPSELL SUGGESTIONS
          ============================================================ */}
      {upsell.length > 0 && (
        <ScrollReveal animation="slide-up">
          <section className="mt-20">
            <h2 className="font-display text-xl font-bold mb-8 flex items-center gap-2">
              <span className="text-brand-500">✦</span> Complete the look
            </h2>
            <ProductGrid products={upsell} gridControlsLabel="Complete the look" />
          </section>
        </ScrollReveal>
      )}

      {/* ============================================================
          SIMILAR PRODUCTS (AI Recommendations)
          ============================================================ */}
      {pageRecommendations.length > 0 && (
        <ScrollReveal animation="slide-up">
          <section className="mt-12">
            <ProductGrid products={pageRecommendations} gridControlsLabel="You may also like" />
          </section>
        </ScrollReveal>
      )}

      {recentlyViewed.length > 0 && (
        <ScrollReveal animation="slide-up">
          <section className="mt-12">
            <ProductGrid products={recentlyViewed} gridControlsLabel="Recently viewed" />
          </section>
        </ScrollReveal>
      )}

      {/* Mobile Sticky Add to Bag Bar */}
      <aside
        aria-label="Quick Add to Bag"
        className="lg:hidden fixed bottom-3 inset-x-3 z-[85] max-w-lg mx-auto bg-slate-950/95 backdrop-blur-xl text-white rounded-full px-3 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.35)] border border-white/15 flex items-center justify-between gap-3 animate-fade-in"
      >
        <div className="flex items-center gap-2.5 min-w-0 pl-1">
          {product.images?.[0] ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/20 bg-slate-900">
              <Image
                src={resolveImageUrl(product.images[0])}
                alt={product.name}
                fill
                sizes="40px"
                className="object-cover object-top"
              />
            </div>
          ) : null}
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate max-w-[130px] sm:max-w-[180px]">
              {product.name}
            </p>
            <div className="flex items-center gap-1.5 leading-none mt-0.5">
              <span className="text-[13px] font-black text-white">
                PKR {Math.round(effectivePrice).toLocaleString()}
              </span>
              {selectedSize && (
                <span className="text-[10px] text-slate-300 font-bold bg-white/10 px-1.5 py-0.5 rounded">
                  {selectedSize}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="min-h-11 px-5 rounded-full bg-white text-slate-950 text-xs font-black uppercase tracking-wider hover:bg-slate-100 active:scale-95 transition-all shadow-md shrink-0 flex items-center gap-1.5 disabled:opacity-50"
        >
          <FiShoppingBag className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{addedInline ? 'Added ✓' : product.stock === 0 ? 'Sold Out' : 'Add to Bag'}</span>
        </button>
      </aside>

    </div>
  );
}
