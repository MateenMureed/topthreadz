'use client';

/**
 * SocialPublishingPage — /admin/social
 *
 * Admin UI for publishing product posts to Facebook and/or Instagram
 * using the Meta Graph API (server-side).
 *
 * Flow:
 *   1. Check if Meta is configured (/api/social/status)
 *   2. Pick a product from the catalog
 *   3. Generate a premium AI caption (/api/social/caption)
 *   4. Preview the post in a modal
 *   5. Publish to FB / IG / Both (/api/social/publish)
 *   6. View post history table (/api/social/history)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { AdminImage } from '../components/AdminImage';
import { resolveImageUrl, asStringArray } from '../components/types';
import {
  FiShare2,
  FiInstagram,
  FiEye,
  FiRefreshCw,
  FiX,
  FiCheck,
  FiAlertTriangle,
  FiExternalLink,
  FiSearch,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiZap,
} from 'react-icons/fi';

// ── Facebook SVG icon (react-icons/fi doesn't have FB) ────────────────────
function FiFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────

interface MetaStatus {
  configured: boolean;
  facebookPageId: string | null;
  instagramAccountId: string | null;
  tokenValid: boolean | null;
  pageName?: string;
  error?: string;
}

interface GeneratedCaption {
  caption: string;
  hashtags: string[];
  fullText: string;
}

interface SocialPost {
  id: string;
  productName: string;
  platform: 'FACEBOOK' | 'INSTAGRAM' | 'BOTH';
  status: 'DRAFT' | 'PUBLISHED' | 'FAILED';
  caption: string;
  fbPostId?: string;
  igMediaId?: string;
  errorMessage?: string;
  publishedAt?: string;
  createdAt: string;
  imageUrl: string;
}

const HISTORY_PAGE_SIZE = 10;

// ── Character limits ───────────────────────────────────────────────────────
const CHAR_LIMITS = { FACEBOOK: 63206, INSTAGRAM: 2200 };

// ── Platform badge styles ──────────────────────────────────────────────────
function platformBadge(platform: string) {
  if (platform === 'FACEBOOK') return 'bg-[#1877F2]/10 text-[#1877F2]';
  if (platform === 'INSTAGRAM') return 'bg-[#E1306C]/10 text-[#E1306C]';
  return 'bg-[#6366F1]/10 text-[#6366F1]';
}

function statusBadge(status: string) {
  if (status === 'PUBLISHED') return 'bg-[#DCFCE7] text-[#16A34A]';
  if (status === 'FAILED') return 'bg-[#FEE2E2] text-[#B91C2B]';
  return 'bg-[#FEF3C7] text-[#D97706]';
}

function platformIcon(platform: string, size = 'h-3.5 w-3.5') {
  if (platform === 'FACEBOOK') return <FiFacebook className={size} />;
  if (platform === 'INSTAGRAM') return <FiInstagram className={size} />;
  return (
    <span className="flex items-center gap-0.5">
      <FiFacebook className={size} /><FiInstagram className={size} />
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function SocialPublishingPage() {
  const queryClient = useQueryClient();

  // ── State ────────────────────────────────────────────────────────────────
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPlatform, setHistoryPlatform] = useState('');
  const [historyStatus, setHistoryStatus] = useState('');

  // ── Data fetching ────────────────────────────────────────────────────────

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['admin', 'social', 'status'],
    queryFn: () => api.get('/social/status').then(r => r.data?.data as MetaStatus),
    retry: false,
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => api.get('/products?limit=100').then(r => r.data),
  });

  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['admin', 'social', 'history', historyPage, historyPlatform, historyStatus],
    queryFn: () =>
      api.get('/social/history', {
        params: { page: historyPage, limit: HISTORY_PAGE_SIZE, platform: historyPlatform || undefined, status: historyStatus || undefined },
      }).then(r => r.data?.data),
  });

  const products: any[] = useMemo(
    () => (Array.isArray(productsData?.data?.products) ? productsData.data.products : []),
    [productsData]
  );

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p: any) =>
      `${p.name} ${p.sku || ''} ${p.category}`.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  // ── Generate Caption ─────────────────────────────────────────────────────

  const generateCaptionMutation = useMutation({
    mutationFn: (product: any) =>
      api.post('/social/caption', { product }).then(r => r.data?.data as GeneratedCaption),
    onSuccess: (data) => {
      setCaption(data.caption);
      setHashtags(data.hashtags);
      setHashtagInput(data.hashtags.join(', '));
      toast.success('Caption generated!');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Caption generation failed.');
    },
  });

  const handleGenerateCaption = () => {
    if (!selectedProduct) {
      toast.error('Please select a product first.');
      return;
    }
    generateCaptionMutation.mutate(selectedProduct);
  };

  // ── Publish ──────────────────────────────────────────────────────────────

  const publishMutation = useMutation({
    mutationFn: (vars: { platform: 'FACEBOOK' | 'INSTAGRAM' | 'BOTH' }) => {
      const storeUrl = process.env.NEXT_PUBLIC_STORE_URL || 'https://www.topthreadz.com.pk';
      const productUrl = `${storeUrl}/products/${selectedProduct?.slug}`;
      const primaryImage = selectedProduct?.images?.[0]
        ? resolveImageUrl(selectedProduct.images[0])
        : '';

      const colorNames = asStringArray(selectedProduct?.colors);
      const category = selectedProduct?.category || '';
      const priceStr = selectedProduct?.salePrice
        ? `PKR ${selectedProduct.salePrice.toLocaleString()}`
        : selectedProduct?.price
          ? `PKR ${selectedProduct.price.toLocaleString()}`
          : '';

      return api.post('/social/publish', {
        productId: selectedProduct?.id,
        productName: selectedProduct?.name,
        imageUrl: primaryImage,
        productUrl,
        caption,
        hashtags,
        platform: vars.platform,
        colorNames,
        category,
        priceStr,
      }).then(r => r.data?.data);
    },
    onSuccess: (data, vars) => {
      const platform = vars.platform === 'BOTH' ? 'Facebook & Instagram' : vars.platform === 'FACEBOOK' ? 'Facebook' : 'Instagram';
      if (data?.success === false) {
        toast.error(`Publish to ${platform} failed: ${data.error}`);
      } else {
        toast.success(`✅ Published to ${platform}!`);
        queryClient.invalidateQueries({ queryKey: ['admin', 'social', 'history'] });
        refetchHistory();
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Publish failed.');
    },
  });

  const handlePublish = (platform: 'FACEBOOK' | 'INSTAGRAM' | 'BOTH') => {
    if (!selectedProduct) { toast.error('Select a product first.'); return; }
    if (!caption.trim()) { toast.error('Caption is required.'); return; }
    const img = selectedProduct?.images?.[0];
    if (!img) { toast.error('This product has no image. Add an image before publishing.'); return; }
    publishMutation.mutate({ platform });
  };

  // ── Hashtag input sync ───────────────────────────────────────────────────
  const handleHashtagChange = (val: string) => {
    setHashtagInput(val);
    const parsed = val.split(',').map(h => h.trim().replace(/^#/, '')).filter(Boolean);
    setHashtags(parsed);
  };

  // ── Full caption text for preview / character count ──────────────────────
  const fullCaptionText = useMemo(() => {
    const tagStr = hashtags.length ? `\n\n${hashtags.map(h => `#${h}`).join(' ')}` : '';
    return `${caption}${tagStr}`;
  }, [caption, hashtags]);

  // ── Product image for preview ────────────────────────────────────────────
  const previewImageUrl = useMemo(() => {
    if (!selectedProduct?.images?.[0]) return '';
    return resolveImageUrl(selectedProduct.images[0]);
  }, [selectedProduct]);

  const storeUrl = 'https://www.topthreadz.com.pk';
  const productUrl = selectedProduct ? `${storeUrl}/products/${selectedProduct.slug}` : '';

  // ── Render ───────────────────────────────────────────────────────────────

  if (statusLoading) {
    return (
      <div className="space-y-3">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="h-20 skeleton rounded-xl" />
        ))}
      </div>
    );
  }

  // ─── NOT CONFIGURED STATE ────────────────────────────────────────────────
  if (!statusData?.configured) {
    return <MetaSetupBanner status={statusData} />;
  }

  // ─── TOKEN INVALID WARNING ───────────────────────────────────────────────
  const tokenWarning = statusData.configured && statusData.tokenValid === false;

  return (
    <>
      {/* ── Header ── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1877F2] to-[#E1306C] text-white">
            <FiShare2 className="h-4 w-4" />
          </div>
          <h2 className="text-2xl font-black text-[#0F1F3D] dark:text-white">Social Publishing</h2>
        </div>
        <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">
          Auto-post products to Facebook and Instagram via the Meta Graph API.
        </p>
      </div>

      {/* ── Meta Status Banner ── */}
      {tokenWarning ? (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-4">
          <FiAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#B91C2B]" />
          <div>
            <p className="font-semibold text-[#B91C2B]">Page Access Token is invalid or expired</p>
            <p className="mt-0.5 text-sm text-[#B91C2B]/80">
              {statusData.error || 'Generate a new long-lived token and update META_PAGE_ACCESS_TOKEN in your Vercel backend environment.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#16A34A]">
            <FiCheck className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-[#15803D]">
              Meta connected{statusData.pageName ? ` — ${statusData.pageName}` : ''}
            </p>
            <p className="text-xs text-[#15803D]/70">
              Page ID: {statusData.facebookPageId} · IG Account: {statusData.instagramAccountId}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_400px]">

        {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Product Picker */}
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white shadow-xs dark:border-[#2D3340] dark:bg-[#1E2228]">
            <div className="border-b border-[#E5E7EB] px-4 py-3 dark:border-[#2D3340]">
              <h3 className="text-sm font-bold text-[#0F1F3D] dark:text-white">1. Select Product</h3>
            </div>
            <div className="p-4 space-y-3">
              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  className="admin-input !pl-9"
                  placeholder="Search products…"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                />
              </div>

              {/* Product List */}
              <div className="max-h-60 overflow-y-auto rounded-lg border border-[#E5E7EB] dark:border-[#2D3340]">
                {productsLoading && (
                  <div className="p-4 text-center text-sm text-[#9CA3AF]">Loading products…</div>
                )}
                {!productsLoading && filteredProducts.length === 0 && (
                  <div className="p-4 text-center text-sm text-[#9CA3AF]">No products found.</div>
                )}
                {filteredProducts.slice(0, 40).map((p: any) => {
                  const img = p.images?.[0] ? resolveImageUrl(p.images[0]) : '';
                  const isSelected = selectedProduct?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProduct(p);
                        setCaption('');
                        setHashtags([]);
                        setHashtagInput('');
                      }}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-[#F1F1F1] dark:border-[#2D3340] last:border-b-0 ${
                        isSelected
                          ? 'bg-[#EFF6FF] dark:bg-[#1A365D]'
                          : 'hover:bg-[#F9FAFB] dark:hover:bg-[#262B34]'
                      }`}
                    >
                      <div className="relative h-10 w-9 shrink-0 overflow-hidden rounded-md border border-[#E5E7EB] bg-[#F3F4F6]">
                        {img && <AdminImage src={img} alt={p.name} className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold truncate ${isSelected ? 'text-[#1877F2]' : 'text-[#0F1F3D] dark:text-white'}`}>
                          {p.name}
                        </p>
                        <p className="text-xs text-[#9CA3AF] truncate">
                          PKR {p.price?.toLocaleString()} · {p.subcategory || p.category}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1877F2]">
                          <FiCheck className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Caption Editor */}
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white shadow-xs dark:border-[#2D3340] dark:bg-[#1E2228]">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3 dark:border-[#2D3340]">
              <h3 className="text-sm font-bold text-[#0F1F3D] dark:text-white">2. Caption & Hashtags</h3>
              <button
                type="button"
                onClick={handleGenerateCaption}
                disabled={!selectedProduct || generateCaptionMutation.isPending}
                className="admin-btn-primary flex items-center gap-1.5 !py-1.5 !px-3 text-xs disabled:opacity-50"
              >
                {generateCaptionMutation.isPending ? (
                  <FiRefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FiZap className="h-3.5 w-3.5" />
                )}
                {generateCaptionMutation.isPending ? 'Generating…' : 'AI Generate'}
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Caption textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Caption</label>
                  <span className={`text-xs font-mono ${caption.length > CHAR_LIMITS.INSTAGRAM ? 'text-[#B91C2B]' : 'text-[#9CA3AF]'}`}>
                    {caption.length} / {CHAR_LIMITS.INSTAGRAM.toLocaleString()} (IG)
                  </span>
                </div>
                <textarea
                  className="admin-input min-h-[140px] resize-y font-normal leading-relaxed"
                  placeholder={selectedProduct ? 'Click "AI Generate" or type your caption…' : 'Select a product first…'}
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  disabled={!selectedProduct}
                />
              </div>

              {/* Hashtags */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
                  Hashtags <span className="normal-case font-normal">(comma-separated, without #)</span>
                </label>
                <textarea
                  className="admin-input min-h-[70px] resize-y font-mono text-xs"
                  placeholder="TopThreadz, PremiumFabric, MensWear…"
                  value={hashtagInput}
                  onChange={e => handleHashtagChange(e.target.value)}
                  disabled={!selectedProduct}
                />
                {hashtags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {hashtags.slice(0, 20).map(h => (
                      <span key={h} className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-medium text-[#1877F2]">
                        #{h}
                      </span>
                    ))}
                    {hashtags.length > 20 && (
                      <span className="text-[11px] text-[#9CA3AF]">+{hashtags.length - 20} more</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Publish Actions */}
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white shadow-xs dark:border-[#2D3340] dark:bg-[#1E2228]">
            <div className="border-b border-[#E5E7EB] px-4 py-3 dark:border-[#2D3340]">
              <h3 className="text-sm font-bold text-[#0F1F3D] dark:text-white">3. Publish</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Preview */}
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedProduct) { toast.error('Select a product first.'); return; }
                    if (!caption.trim()) { toast.error('Add a caption first.'); return; }
                    setPreviewOpen(true);
                  }}
                  className="admin-btn-secondary flex flex-col items-center gap-2 py-4"
                >
                  <FiEye className="h-5 w-5 text-[#6B7280]" />
                  <span className="text-xs font-semibold">Preview</span>
                </button>

                {/* Publish to Facebook */}
                <button
                  type="button"
                  onClick={() => handlePublish('FACEBOOK')}
                  disabled={publishMutation.isPending || tokenWarning}
                  className="flex flex-col items-center gap-2 py-4 rounded-[8px] border border-[#1877F2]/30 bg-[#EFF6FF] text-[#1877F2] font-semibold text-xs hover:bg-[#DBEAFE] transition-colors disabled:opacity-40"
                >
                  {publishMutation.isPending && publishMutation.variables?.platform === 'FACEBOOK' ? (
                    <FiRefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <FiFacebook className="h-5 w-5" />
                  )}
                  <span>Facebook</span>
                </button>

                {/* Publish to Instagram */}
                <button
                  type="button"
                  onClick={() => handlePublish('INSTAGRAM')}
                  disabled={publishMutation.isPending || tokenWarning}
                  className="flex flex-col items-center gap-2 py-4 rounded-[8px] border border-[#E1306C]/30 bg-[#FFF0F6] text-[#E1306C] font-semibold text-xs hover:bg-[#FFE4EF] transition-colors disabled:opacity-40"
                >
                  {publishMutation.isPending && publishMutation.variables?.platform === 'INSTAGRAM' ? (
                    <FiRefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <FiInstagram className="h-5 w-5" />
                  )}
                  <span>Instagram</span>
                </button>

                {/* Publish to Both */}
                <button
                  type="button"
                  onClick={() => handlePublish('BOTH')}
                  disabled={publishMutation.isPending || tokenWarning}
                  className="flex flex-col items-center gap-2 py-4 rounded-[8px] border border-[#6366F1]/30 bg-[#EEF2FF] text-[#6366F1] font-semibold text-xs hover:bg-[#E0E7FF] transition-colors disabled:opacity-40"
                >
                  {publishMutation.isPending && publishMutation.variables?.platform === 'BOTH' ? (
                    <FiRefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-0.5">
                      <FiFacebook className="h-4 w-4" /><FiInstagram className="h-4 w-4" />
                    </span>
                  )}
                  <span>Publish Both</span>
                </button>
              </div>

              {tokenWarning && (
                <p className="mt-3 text-xs text-center text-[#B91C2B]">
                  Publishing is disabled — fix the Page Access Token first.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN — Product Preview Card ─────────────────────── */}
        <div className="space-y-5">
          <div className="sticky top-4 rounded-[12px] border border-[#E5E7EB] bg-white shadow-xs dark:border-[#2D3340] dark:bg-[#1E2228]">
            <div className="border-b border-[#E5E7EB] px-4 py-3 dark:border-[#2D3340]">
              <h3 className="text-sm font-bold text-[#0F1F3D] dark:text-white">Post Preview</h3>
            </div>
            {!selectedProduct ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1877F2] to-[#E1306C] text-white opacity-30">
                  <FiShare2 className="h-6 w-6" />
                </div>
                <p className="text-sm text-[#9CA3AF]">Select a product to see the post preview</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Product image with bottom centered brand overlay preview */}
                {previewImageUrl && (
                  <div className="relative aspect-square overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] group">
                    <AdminImage src={previewImageUrl} alt={selectedProduct.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-6 pb-3 px-3 text-center">
                      <div className="mx-auto w-16 h-[1.5px] bg-[#c8952a] mb-1.5 opacity-80" />
                      <p className="text-[10px] tracking-widest uppercase font-medium text-[#e8d5a3] truncate">
                        {asStringArray(selectedProduct.colors).slice(0, 3).join(' · ') || 'Premium Fabric'} {selectedProduct.category ? `| ${selectedProduct.category}` : ''}
                      </p>
                      <p className="text-sm font-black tracking-wide text-[#f5d97a] drop-shadow-sm">
                        {selectedProduct.salePrice ? `PKR ${selectedProduct.salePrice.toLocaleString()}` : `PKR ${selectedProduct.price?.toLocaleString()}`}
                      </p>
                      <div className="mx-auto w-8 h-[2px] bg-[#c8952a]/60 mt-1" />
                    </div>
                  </div>
                )}

                {/* Product info */}
                <div>
                  <p className="font-bold text-[#0F1F3D] dark:text-white">{selectedProduct.name}</p>
                  <p className="text-sm text-[#6B7280]">
                    PKR {selectedProduct.price?.toLocaleString()}
                    {selectedProduct.discount > 0 && (
                      <span className="ml-1 rounded-full bg-[#DCFCE7] px-1.5 py-0.5 text-xs font-semibold text-[#16A34A]">
                        -{selectedProduct.discount}%
                      </span>
                    )}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {asStringArray(selectedProduct.colors).slice(0, 4).map(c => (
                      <span key={c} className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[11px] text-[#6B7280]">{c}</span>
                    ))}
                  </div>
                </div>

                {/* Caption preview */}
                {caption && (
                  <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3 dark:border-[#2D3340] dark:bg-[#262B34]">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#374151] dark:text-[#CBD5E1]">
                      {caption}
                    </p>
                    {hashtags.length > 0 && (
                      <p className="mt-2 text-xs text-[#1877F2]">
                        {hashtags.slice(0, 10).map(h => `#${h}`).join(' ')}
                        {hashtags.length > 10 && ` +${hashtags.length - 10} more`}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const full = `${caption}\n\n${hashtags.map(h => `#${h}`).join(' ')}`;
                        navigator.clipboard.writeText(full);
                        toast.success('Copied to clipboard!');
                      }}
                      className="mt-2 flex items-center gap-1 text-xs text-[#9CA3AF] hover:text-[#0F1F3D]"
                    >
                      <FiCopy className="h-3 w-3" /> Copy caption
                    </button>
                  </div>
                )}

                {/* Product URL */}
                {productUrl && (
                  <a
                    href={productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[#1877F2] hover:underline"
                  >
                    <FiExternalLink className="h-3.5 w-3.5" />
                    <span className="truncate">{productUrl}</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── POST HISTORY TABLE ──────────────────────────────────────────── */}
      <div className="mt-8 rounded-[12px] border border-[#E5E7EB] bg-white shadow-xs dark:border-[#2D3340] dark:bg-[#1E2228]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] px-4 py-3 dark:border-[#2D3340]">
          <h3 className="text-sm font-bold text-[#0F1F3D] dark:text-white">
            <FiClock className="inline h-4 w-4 mr-1.5 text-[#9CA3AF]" />
            Post History
          </h3>
          <div className="flex items-center gap-2">
            <select
              className="admin-input !py-1.5 !text-xs"
              value={historyPlatform}
              onChange={e => { setHistoryPlatform(e.target.value); setHistoryPage(1); }}
            >
              <option value="">All Platforms</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="BOTH">Both</option>
            </select>
            <select
              className="admin-input !py-1.5 !text-xs"
              value={historyStatus}
              onChange={e => { setHistoryStatus(e.target.value); setHistoryPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="FAILED">Failed</option>
              <option value="DRAFT">Draft</option>
            </select>
            <button
              type="button"
              onClick={() => refetchHistory()}
              className="admin-btn-secondary !py-1.5 !px-2"
              title="Refresh history"
            >
              <FiRefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-xs font-semibold uppercase tracking-wider text-[#6B7280] dark:border-[#2D3340]">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Links</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[#9CA3AF]">
                    Loading history…
                  </td>
                </tr>
              )}
              {!historyLoading && (!historyData?.posts || historyData.posts.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-[#9CA3AF]">
                    No posts yet. Publish your first product above!
                  </td>
                </tr>
              )}
              {(historyData?.posts || []).map((post: SocialPost) => (
                <tr
                  key={post.id}
                  className="border-b border-[#F1F1F1] last:border-0 hover:bg-[#F9FAFB] dark:border-[#2D3340] dark:hover:bg-[#262B34]"
                >
                  {/* Product + thumbnail */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {post.imageUrl && (
                        <div className="relative h-9 w-8 shrink-0 overflow-hidden rounded-md border border-[#E5E7EB] bg-[#F3F4F6]">
                          <AdminImage src={post.imageUrl} alt={post.productName} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-[#0F1F3D] dark:text-white line-clamp-1">{post.productName}</p>
                        <p className="text-xs text-[#9CA3AF] line-clamp-1">{post.caption?.slice(0, 60)}…</p>
                      </div>
                    </div>
                  </td>

                  {/* Platform */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${platformBadge(post.platform)}`}>
                      {platformIcon(post.platform)}
                      {post.platform === 'BOTH' ? 'FB + IG' : post.platform}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(post.status)}`}>
                      {post.status === 'PUBLISHED' && <FiCheck className="h-3 w-3" />}
                      {post.status === 'FAILED' && <FiAlertTriangle className="h-3 w-3" />}
                      {post.status}
                    </span>
                    {post.status === 'FAILED' && post.errorMessage && (
                      <p className="mt-0.5 text-[10px] text-[#B91C2B] max-w-[200px] truncate" title={post.errorMessage}>
                        {post.errorMessage}
                      </p>
                    )}
                  </td>

                  {/* Published date */}
                  <td className="px-4 py-3 text-xs text-[#6B7280]">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })
                      : new Date(post.createdAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>

                  {/* Links */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {post.fbPostId && (
                        <a
                          href={`https://www.facebook.com/${post.fbPostId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-[#EFF6FF] px-2 py-1 text-[11px] font-semibold text-[#1877F2] hover:underline"
                        >
                          <FiFacebook className="h-3 w-3" /> FB Post
                        </a>
                      )}
                      {post.igMediaId && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#FFF0F6] px-2 py-1 text-[11px] font-semibold text-[#E1306C]">
                          <FiInstagram className="h-3 w-3" /> IG: {post.igMediaId.slice(-8)}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* History pagination */}
        {historyData?.pagination && historyData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#E5E7EB] px-4 py-3 dark:border-[#2D3340]">
            <p className="text-sm text-[#6B7280]">
              {historyData.pagination.total} total posts
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                disabled={historyPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#E5E7EB] text-[#6B7280] disabled:opacity-40"
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: historyData.pagination.totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === historyData.pagination.totalPages || Math.abs(n - historyPage) <= 1)
                .map(n => (
                  <button
                    key={n}
                    onClick={() => setHistoryPage(n)}
                    className={`flex h-8 w-8 items-center justify-center rounded-[8px] text-sm font-semibold ${
                      n === historyPage ? 'bg-[#0F1F3D] text-white dark:bg-white dark:text-[#0F1F3D]' : 'text-[#6B7280] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              <button
                onClick={() => setHistoryPage(p => Math.min(historyData.pagination.totalPages, p + 1))}
                disabled={historyPage === historyData.pagination.totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#E5E7EB] text-[#6B7280] disabled:opacity-40"
              >
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── PREVIEW MODAL ────────────────────────────────────────────────── */}
      {previewOpen && selectedProduct && (
        <PostPreviewModal
          product={selectedProduct}
          caption={caption}
          hashtags={hashtags}
          imageUrl={previewImageUrl}
          productUrl={productUrl}
          onClose={() => setPreviewOpen(false)}
          onPublish={handlePublish}
          isPublishing={publishMutation.isPending}
          tokenWarning={tokenWarning}
        />
      )}
    </>
  );
}

// ── Post Preview Modal ─────────────────────────────────────────────────────

function PostPreviewModal({
  product,
  caption,
  hashtags,
  imageUrl,
  productUrl,
  onClose,
  onPublish,
  isPublishing,
  tokenWarning,
}: {
  product: any;
  caption: string;
  hashtags: string[];
  imageUrl: string;
  productUrl: string;
  onClose: () => void;
  onPublish: (platform: 'FACEBOOK' | 'INSTAGRAM' | 'BOTH') => void;
  isPublishing: boolean;
  tokenWarning: boolean;
}) {
  const fullText = `${caption}\n\n${hashtags.map(h => `#${h}`).join(' ')}`;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-[#1E2228] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4 dark:border-[#2D3340]">
            <h3 className="text-base font-bold text-[#0F1F3D] dark:text-white">Post Preview</h3>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#6B7280] hover:bg-[#F3F4F6] dark:hover:bg-[#262B34]"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>

          {/* Preview body — simulates a social post card */}
          <div className="overflow-y-auto max-h-[60vh]">
            {/* Page / account header */}
            <div className="flex items-center gap-3 px-5 pt-4 pb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1877F2] to-[#E1306C] text-white text-xs font-black">
                TT
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F1F3D] dark:text-white">Top Threadz</p>
                <p className="text-xs text-[#9CA3AF]">Sponsored · Just now</p>
              </div>
            </div>

            {/* Caption */}
            <div className="px-5 pb-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#374151] dark:text-[#CBD5E1]">
                {caption}
              </p>
              {hashtags.length > 0 && (
                <p className="mt-2 text-sm text-[#1877F2]">
                  {hashtags.map(h => `#${h}`).join(' ')}
                </p>
              )}
            </div>

            {/* Product image with bottom centered brand overlay */}
            {imageUrl && (
              <div className="relative aspect-square bg-[#F3F4F6] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-8 pb-4 px-4 text-center">
                  <div className="mx-auto w-20 h-[1.5px] bg-[#c8952a] mb-2 opacity-80" />
                  <p className="text-[11px] tracking-widest uppercase font-medium text-[#e8d5a3] truncate">
                    {asStringArray(product.colors).slice(0, 3).join(' · ') || 'Premium Fabric'} {product.category ? `| ${product.category}` : ''}
                  </p>
                  <p className="text-base font-black tracking-wide text-[#f5d97a] drop-shadow-sm">
                    {product.salePrice ? `PKR ${product.salePrice.toLocaleString()}` : `PKR ${product.price?.toLocaleString()}`}
                  </p>
                  <div className="mx-auto w-10 h-[2px] bg-[#c8952a]/60 mt-1.5" />
                </div>
              </div>
            )}

            {/* Product link bar */}
            <div className="border-t border-[#E5E7EB] bg-[#F9FAFB] px-5 py-3 dark:border-[#2D3340] dark:bg-[#262B34]">
              <p className="text-xs text-[#9CA3AF] uppercase tracking-wider">topthreadz.com.pk</p>
              <p className="font-semibold text-[#0F1F3D] dark:text-white">{product.name}</p>
              <p className="text-sm text-[#6B7280]">PKR {product.price?.toLocaleString()}</p>
            </div>
          </div>

          {/* Footer actions */}
          <div className="border-t border-[#E5E7EB] px-5 py-4 dark:border-[#2D3340] space-y-3">
            {tokenWarning && (
              <p className="text-xs text-center text-[#B91C2B]">
                Publishing disabled — fix the Page Access Token first.
              </p>
            )}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { onPublish('FACEBOOK'); onClose(); }}
                disabled={isPublishing || tokenWarning}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-[#1877F2]/30 bg-[#EFF6FF] py-3 text-[#1877F2] font-semibold text-xs hover:bg-[#DBEAFE] transition-colors disabled:opacity-40"
              >
                <FiFacebook className="h-5 w-5" />
                Facebook
              </button>
              <button
                type="button"
                onClick={() => { onPublish('INSTAGRAM'); onClose(); }}
                disabled={isPublishing || tokenWarning}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-[#E1306C]/30 bg-[#FFF0F6] py-3 text-[#E1306C] font-semibold text-xs hover:bg-[#FFE4EF] transition-colors disabled:opacity-40"
              >
                <FiInstagram className="h-5 w-5" />
                Instagram
              </button>
              <button
                type="button"
                onClick={() => { onPublish('BOTH'); onClose(); }}
                disabled={isPublishing || tokenWarning}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-[#6366F1]/30 bg-[#EEF2FF] py-3 text-[#6366F1] font-semibold text-xs hover:bg-[#E0E7FF] transition-colors disabled:opacity-40"
              >
                <span className="flex items-center gap-0.5">
                  <FiFacebook className="h-4 w-4" /><FiInstagram className="h-4 w-4" />
                </span>
                Publish Both
              </button>
            </div>
            <button type="button" onClick={onClose} className="admin-btn-secondary w-full text-xs">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Meta Setup Banner ──────────────────────────────────────────────────────

function MetaSetupBanner({ status }: { status?: MetaStatus }) {
  const steps = [
    { num: 1, title: 'Create a Meta Developer App', detail: 'Go to developers.facebook.com/apps → Create App → Choose "Business" type.' },
    { num: 2, title: 'Add Facebook Login + Instagram Graph API', detail: 'Inside your app, add both products. Instagram Graph API requires a Professional/Business account connected to a Facebook Page.' },
    { num: 3, title: 'Generate a Page Access Token', detail: 'Use Graph API Explorer → select your app and page → generate a token with pages_manage_posts + instagram_basic + instagram_content_publish permissions.' },
    { num: 4, title: 'Extend to a Long-Lived Token (60 days)', detail: 'Exchange the short-lived token via: GET /oauth/access_token?grant_type=fb_exchange_token&...' },
    { num: 5, title: 'Find your Page ID and IG Account ID', detail: 'Page ID: Facebook Page → Settings → About. IG Account ID: GET /{page-id}?fields=instagram_business_account' },
    { num: 6, title: 'Set Vercel Environment Variables', detail: 'In your Vercel backend project → Settings → Environment Variables. See the variable names in SOCIAL_SETUP.md' },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      {/* Icon + Title */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1877F2] to-[#E1306C] text-white shadow-lg">
          <FiShare2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-[#0F1F3D] dark:text-white">Connect Meta to Top Threadz</h2>
        <p className="mt-2 text-sm text-[#6B7280]">
          Set up 5 environment variables in your Vercel backend to enable auto-posting to Facebook and Instagram.
        </p>
      </div>

      {/* Missing vars summary */}
      <div className="mb-5 rounded-xl border border-[#FEF3C7] bg-[#FFFBEB] p-4">
        <p className="flex items-center gap-2 font-semibold text-[#D97706]">
          <FiAlertTriangle className="h-4 w-4 shrink-0" />
          Meta credentials not configured
        </p>
        <p className="mt-1 text-sm text-[#D97706]/80">
          The following backend environment variables are missing. Add them to your Vercel backend project (not the frontend).
        </p>
        <ul className="mt-3 space-y-1 font-mono text-xs text-[#92400E]">
          {['META_APP_ID', 'META_APP_SECRET', 'META_PAGE_ACCESS_TOKEN', 'META_FACEBOOK_PAGE_ID', 'META_INSTAGRAM_ACCOUNT_ID'].map(v => (
            <li key={v} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D97706] shrink-0" />
              {v}
            </li>
          ))}
        </ul>
      </div>

      {/* Step-by-step */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs dark:border-[#2D3340] dark:bg-[#1E2228] overflow-hidden">
        <div className="border-b border-[#E5E7EB] px-4 py-3 dark:border-[#2D3340]">
          <h3 className="text-sm font-bold text-[#0F1F3D] dark:text-white">Setup Steps</h3>
        </div>
        <ol className="divide-y divide-[#F1F1F1] dark:divide-[#2D3340]">
          {steps.map(step => (
            <li key={step.num} className="flex gap-4 px-4 py-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0F1F3D] text-white text-xs font-bold dark:bg-white dark:text-[#0F1F3D]">
                {step.num}
              </span>
              <div>
                <p className="text-sm font-semibold text-[#0F1F3D] dark:text-white">{step.title}</p>
                <p className="mt-0.5 text-xs text-[#6B7280]">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <a
          href="https://developers.facebook.com/apps"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-btn-primary flex items-center gap-1.5"
        >
          <FiExternalLink className="h-3.5 w-3.5" />
          Open Meta Developer Portal
        </a>
        <a
          href="https://developers.facebook.com/tools/explorer"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-btn-secondary flex items-center gap-1.5"
        >
          <FiExternalLink className="h-3.5 w-3.5" />
          Graph API Explorer
        </a>
      </div>

      <p className="mt-4 text-center text-xs text-[#9CA3AF]">
        Full detailed instructions are in <code className="rounded bg-[#F3F4F6] px-1 py-0.5">SOCIAL_SETUP.md</code> at the project root.
      </p>
    </div>
  );
}
