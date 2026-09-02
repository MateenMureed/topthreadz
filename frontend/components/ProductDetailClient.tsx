'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import { experienceService } from '@/services/experience.service';
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

  let processed = content
    .replace(/<\/(div|p|h[1-6]|li|tr|section|article)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<hr\s*\/?>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ');

  processed = decodeHtmlEntities(processed);
  processed = cleanDescriptionMetadata(processed);

  const rawLines = processed
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (rawLines.length === 0) return null;

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

interface ProductDetailClientProps {
  initialProduct: any;
  productId: string;
}

export function FormattedCareInstructions({ content }: { content?: string }) {
  if (!content) return null;

  const cleaned = decodeHtmlEntities(content)
    .replace(/<[^>]+>/g, '\n')
    .trim();

  const items = cleaned
    .split(/\r?\n|•|;/)
    .map((s) => s.trim().replace(/^[-*•\d.)\s]+/, ''))
    .filter((s) => s.length > 0);

  if (items.length === 0) return null;

  return (
    <ul className="pt-2 space-y-2 text-xs sm:text-sm text-surface-700">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#0F1F3D] shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ProductDetailClient({ initialProduct, productId }: ProductDetailClientProps) {
  const id = productId;
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
        return await productService.getBySlug(id);
      } catch {
        try {
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
    initialData: initialProduct ? { data: initialProduct } : undefined,
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

  const product = data?.data || initialProduct;
  const similar = similarData?.data || [];
  const recommendedPool = recommendedData?.data?.products || [];
  const recentlyViewed = (recentlyViewedData?.data || []).filter((item: any) => item.id !== id).slice(0, 4);

  useEffect(() => {
    const wishlistItems = wishlistData?.data || [];
    const found = wishlistItems.some((item: any) => item.productId === id || item.product?.id === id);
    setIsWishlisted(found);
  }, [id, wishlistData]);

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    productService.recordView(id).catch(() => {});
    experienceService.trackEvent('PRODUCT_VIEW', { productId: id }, `/products/${id}`).catch(() => {});
  }, [id, isAuthenticated]);

  const [showStickyAdd, setShowStickyAdd] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyAdd(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!selectedSize && product?.sizes?.length) {
      setSelectedSize(product.sizes[0]);
    }
  }, [product?.id, product?.sizes, selectedSize]);

  useEffect(() => {
    if (!selectedColor && product?.colors?.length) {
      setSelectedColor(product.colors[0]);
    }
  }, [product?.id, product?.colors, selectedColor]);

  if (isLoading && !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <div className="aspect-[3/4] rounded-2xl bg-surface-100 relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-surface-200 rounded-full animate-pulse" />
            <div className="h-10 w-40 bg-surface-200 rounded-full animate-pulse" />
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

  const effectivePrice = product.price * (1 - (product.discount || 0) / 100);
  const galleryImages: string[] = Array.isArray(product.images)
    ? product.images.map((image: string) => resolveImageUrl(image)).filter(Boolean)
    : [];
  const primaryImage = galleryImages[0] || '';
  const recommendationCandidates = similar.length
    ? similar
    : recommendedPool.filter((item: any) => item.id !== product.id);
  const pageRecommendations = recommendationCandidates.slice(0, 8);
  const isStitchedProduct = product.category?.toLowerCase().trim() === 'stitched';
  const optionLabel = isStitchedProduct ? 'Size' : 'Fabric length';
  const lowStockThreshold = Number(product.lowStockThreshold ?? 5);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= lowStockThreshold;

  const handleAddToCart = () => {
    if (product.sizes?.length > 0 && !selectedSize) {
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
      size: selectedSize,
      color: selectedColor,
      quantity,
    });
    setAddedInline(true);
    setTimeout(() => setAddedInline(false), 2000);
    toast.success('Added to Bag');
  };

  const handleBuyNow = () => {
    handleAddToCart();
    openCart();
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to manage your wishlist');
      return;
    }
    setWishlistLoading(true);
    try {
      await experienceService.toggleWishlist(product.id);
      setIsWishlisted((prev) => !prev);
      toast.success(isWishlisted ? 'Removed from Wishlist' : 'Added to Wishlist');
    } catch {
      toast.error('Wishlist action failed');
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* Main Product Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-10">
        {/* Left Column: Image Gallery — compact */}
        <div className="lg:col-span-5">
          <ProductImageGallery images={galleryImages} name={product.name} category={product.category} />
        </div>

        {/* Right Column: Product Info & Actions */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F1F3D] bg-surface-100 px-2.5 py-1 rounded-full">
                {product.category || 'Menswear'}
              </span>
              {product.collection && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B91C2B] bg-red-50 px-2.5 py-1 rounded-full">
                  {product.collection}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-display font-bold text-surface-950 leading-tight">
              {product.name}
            </h1>

            {/* Pricing Section */}
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-black text-surface-950">
                PKR {Math.round(effectivePrice).toLocaleString()}
              </span>
              {product.discount > 0 && (
                <>
                  <span className="text-base text-surface-400 line-through">
                    PKR {product.price?.toLocaleString()}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#B91C2B] text-white">
                    {product.discount}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Stock Alert */}
            <div className="mt-2.5">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B91C2B]">
                  <span className="w-2 h-2 rounded-full bg-[#B91C2B]" /> Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Only {product.stock} left in stock — order soon
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> In Stock & Ready to Ship
                </span>
              )}
            </div>
          </div>

          {/* Size / Length Selector */}
          {product.sizes?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-surface-700">
                  Select {optionLabel}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size: string) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`min-h-[40px] px-4 rounded-lg text-xs font-bold transition-all ${
                      selectedSize === size
                        ? 'bg-[#0F1F3D] text-white shadow-xs'
                        : 'bg-white border border-surface-300 text-surface-800 hover:border-surface-950'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {product.colors?.length > 0 && (
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-2">
                Color: <span className="text-surface-950">{selectedColor || product.colors[0]}</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((col: string) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setSelectedColor(col)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      selectedColor === col
                        ? 'bg-[#0F1F3D] text-white'
                        : 'bg-surface-100 text-surface-800 hover:bg-surface-200'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & CTA Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-surface-300 rounded-lg h-11 bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-full flex items-center justify-center text-surface-600 hover:text-surface-950"
                  aria-label="Decrease quantity"
                >
                  <FiMinus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-sm font-bold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock || 10, q + 1))}
                  className="w-10 h-full flex items-center justify-center text-surface-600 hover:text-surface-950"
                  aria-label="Increase quantity"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 btn-primary h-11 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider disabled:opacity-50"
              >
                <FiShoppingBag className="w-4 h-4" />
                <span>{addedInline ? 'Added ✓' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className={`w-11 h-11 rounded-lg border flex items-center justify-center transition-all ${
                  isWishlisted
                    ? 'border-[#B91C2B] bg-red-50 text-[#B91C2B]'
                    : 'border-surface-300 hover:border-surface-950 text-surface-700'
                }`}
                aria-label="Wishlist"
              >
                <FiHeart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="w-full btn-secondary h-11 text-sm font-bold uppercase tracking-wider disabled:opacity-50"
            >
              Buy It Now
            </button>
          </div>

          {/* Product Description */}
          <div className="pt-4 border-t border-surface-200">
            <button
              type="button"
              onClick={() => setDetailsExpanded((v) => !v)}
              className="w-full flex items-center justify-between text-left py-2 font-display font-bold text-base text-surface-950"
            >
              <span>Product Description & Fabric Specs</span>
              <span>{detailsExpanded ? '−' : '+'}</span>
            </button>
            {detailsExpanded && (
              <div className="pt-2">
                <FormattedProductDescription content={product.description} />
              </div>
            )}
          </div>

          {/* Care Instructions */}
          {product.careInstructions && (
            <div className="pt-2 border-t border-surface-200">
              <button
                type="button"
                onClick={() => setCareExpanded((v) => !v)}
                className="w-full flex items-center justify-between text-left py-2 font-display font-bold text-base text-surface-950"
              >
                <span>Care Instructions</span>
                <span>{careExpanded ? '−' : '+'}</span>
              </button>
              {careExpanded && (
                <FormattedCareInstructions content={product.careInstructions} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Similar Products */}
      {pageRecommendations.length > 0 && (
        <ScrollReveal animation="slide-up">
          <section className="mt-14 pt-8 border-t border-surface-200">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-surface-950 uppercase tracking-tight mb-6">
              You May Also Like
            </h2>
            <ProductGrid products={pageRecommendations} />
          </section>
        </ScrollReveal>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <ScrollReveal animation="slide-up">
          <section className="mt-14 pt-8 border-t border-surface-200">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-surface-950 uppercase tracking-tight mb-6">
              Recently Viewed
            </h2>
            <ProductGrid products={recentlyViewed} />
          </section>
        </ScrollReveal>
      )}

      {/* Mobile Sticky Add to Bag Bar */}
      <aside
        aria-label="Quick Add to Bag"
        className={`lg:hidden fixed bottom-4 inset-x-4 z-[85] max-w-md mx-auto bg-[#0F1F3D] text-white rounded-full px-3.5 py-2.5 shadow-[0_12px_40px_rgba(15,31,61,0.45)] border border-white/20 flex items-center justify-between gap-3 transition-all duration-300 ease-out ${
          showStickyAdd ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-24 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 pl-1">
          {product.images?.[0] ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/20 bg-[#16284D]">
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
                <span className="text-[10px] text-white font-bold bg-white/20 px-1.5 py-0.5 rounded">
                  {selectedSize}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="min-h-[40px] px-5 rounded-full bg-[#B91C2B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#8F1620] active:scale-95 transition-all shadow-md shrink-0 flex items-center gap-1.5 disabled:bg-[#D1D5DB]"
        >
          <FiShoppingBag className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{addedInline ? 'Added ✓' : isOutOfStock ? 'Sold Out' : 'Add to Bag'}</span>
        </button>
      </aside>
    </div>
  );
}
