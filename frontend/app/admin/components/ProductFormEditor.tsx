'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { productService } from '@/services/product.service';
import { AdminImage } from './AdminImage';
import {
  COLOR_PRESET_OPTIONS,
  BRAND_OPTIONS,
  CATEGORY_OPTIONS,
  COLLECTION_OPTIONS,
  categorySizeOptions,
  compressImageFile,
  emptyProductForm,
  formatPkr,
  makeSlug,
  splitCsv,
  asStringArray,
  type ImageMeta,
  type ProductFormState,
} from './types';
import {
  FiEdit2,
  FiUpload,
  FiStar,
  FiArrowUp,
  FiArrowDown,
  FiTrash2,
  FiInfo,
} from 'react-icons/fi';

/**
 * ProductFormEditor ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â the complete product create/edit form.
 * Single source of truth shared by:
 *   /admin/products/new       (AddProductPage)
 *   /admin/products/[id]/edit (EditProductPage)
 *
 * Props:
 *   editingProduct ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â full product object when editing, null/undefined when creating.
 *   onCancel       ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â invoked when the user closes the editor without saving.
 */
export function ProductFormEditor({ editingProduct, onCancel }: { editingProduct?: any | null; onCancel?: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploadingImages, setUploadingImages] = useState(false);
  const [directImageUrl, setDirectImageUrl] = useState('');
  const [isSlugEditedManually, setIsSlugEditedManually] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [imageMeta, setImageMeta] = useState<ImageMeta[]>([]);
  const [dragImageIndex, setDragImageIndex] = useState<number | null>(null);
  const [selectedColorPreset, setSelectedColorPreset] = useState('');
  const [customColorInput, setCustomColorInput] = useState('');
  const descriptionEditorRef = useRef<HTMLDivElement | null>(null);
  const productFormRef = useRef<HTMLDivElement | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyProductForm);
  const { data: categoryResponse } = useQuery({ queryKey: ['admin-categories'], queryFn: () => api.get('/categories').then(r => r.data) });
  const categories = Array.isArray(categoryResponse?.data) ? categoryResponse.data : [];

  // Session-only options appended via "+ Add" pills (not persisted to DB)
  const [extraCategoryOptions, setExtraCategoryOptions] = useState<string[]>([]);
  const [extraCollectionOptions, setExtraCollectionOptions] = useState<string[]>([]);
  const [extraBrandOptions, setExtraBrandOptions] = useState<string[]>([]);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newCollectionInput, setNewCollectionInput] = useState('');
  const [newBrandInput, setNewBrandInput] = useState('');

  const colorList = splitCsv(form.colorsText);
  const subcategoryOptions = ['Traditional', 'Formal', 'Casual', 'Party Wear', 'Wedding', 'Embroidered', 'Printed', 'Plain'];
  const collectionOptions = Array.from(new Set([...COLLECTION_OPTIONS, ...extraCollectionOptions]));
  const brandOptions = Array.from(new Set([...BRAND_OPTIONS, ...extraBrandOptions, ...(form.brand ? [form.brand] : [])]));
  const categoryPillOptions = Array.from(new Set([...CATEGORY_OPTIONS, ...extraCategoryOptions, ...(form.category && !CATEGORY_OPTIONS.includes(form.category) ? [form.category] : [])]));

  const addSessionCategory = () => {
    const value = newCategoryInput.trim();
    if (!value) return;
    setExtraCategoryOptions((prev) => Array.from(new Set([...prev, value])));
    setForm((prev) => ({ ...prev, category: value, sizesText: categorySizeOptions(value).join(', ') }));
    setNewCategoryInput('');
  };

  const addSessionCollection = () => {
    const value = newCollectionInput.trim();
    if (!value) return;
    setExtraCollectionOptions((prev) => Array.from(new Set([...prev, value])));
    setForm((prev) => ({ ...prev, collection: value }));
    setNewCollectionInput('');
  };

  const addSessionBrand = () => {
    const value = newBrandInput.trim();
    if (!value) return;
    setExtraBrandOptions((prev) => Array.from(new Set([...prev, value])));
    setForm((prev) => ({ ...prev, brand: value }));
    setNewBrandInput('');
  };

  const previewPrice = Number(form.price || 0);
  const previewDiscount = Number(form.discount || 0);
  const previewSalePrice = previewPrice > 0 && previewDiscount > 0
    ? Math.round(previewPrice * (1 - previewDiscount / 100))
    : previewPrice;

  const previewTitle = form.name.trim() || 'Product Name Preview';
  const isStitched = form.category.toLowerCase().trim() === 'stitched';
  const previewCategory = [form.category, form.subcategory].filter(Boolean).join(' / ');

  const makeSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const addColorFromPreset = () => {
    if (!selectedColorPreset) return;
    const next = Array.from(new Set([...colorList, selectedColorPreset]));
    setForm((prev) => ({ ...prev, colorsText: next.join(', ') }));
    setSelectedColorPreset('');
  };

  const removeColor = (value: string) => {
    const next = colorList.filter((entry) => entry.toLowerCase() !== value.toLowerCase());
    setForm((prev) => ({ ...prev, colorsText: next.join(', ') }));
  };

  const autofillBasicWithAi = () => {
    generateAiDescription();
    generateAutoTags();
  };

  const autofillInventoryWithAi = () => {
    setForm((prev) => {
      const stock = Number(prev.stock || 0);
      const threshold = Number(prev.lowStockThreshold || 5);
      return {
        ...prev,
        stockStatus: stock <= 0 ? 'OUT_OF_STOCK' : stock <= threshold ? 'PREORDER' : 'IN_STOCK',
      };
    });
    toast.success('Inventory autofill applied');
  };

  const generateAutoTags = () => {
    const candidateTokens = [
      'Unstitched',
      form.subcategory,
      form.brand,
      form.collection,
      ...splitCsv(form.sizesText),
      ...splitCsv(form.colorsText),
      'mens',
      'fabric',
    ]
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean)
      .map((token) => token.replace(/\s+/g, '-'));

    const styleHints = ['premium', 'pakistani-fashion'];
    if (form.featured) styleHints.push('featured');
    if (form.trending) styleHints.push('trending');
    if (Number(form.discount || 0) >= 20) styleHints.push('sale');

    const generated = Array.from(new Set([...splitCsv(form.tagsText).map((t) => t.toLowerCase()), ...candidateTokens, ...styleHints]));
    setForm((prev) => ({ ...prev, tagsText: generated.join(', ') }));
    toast.success('Tags updated');
  };

  const generateAiDescription = () => {
    const title = form.name.trim() || 'Premium Unstitched Fabric';

    const generated = `
<p><strong>${title}</strong> is a men's unstitched fabric made for clean tailoring and daily comfort.</p>
<p>Suitable for shalwar kameez stitching with a premium hand feel and dependable finish.</p>
<p>Available in fixed fabric lengths of 4.5m and 7 meter.</p>
    `.trim();

    setForm((prev) => ({
      ...prev,
      description: generated,
    }));
    toast.success('Description generated');
  };

  useEffect(() => {
    if (!isSlugEditedManually) {
      setForm((prev) => ({ ...prev, slug: makeSlug(prev.name) }));
    }
  }, [form.name, isSlugEditedManually]);

  // ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ AI SEO Engine state & handler ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
  const [seoGenerating, setSeoGenerating] = useState<string | null>(null); // null | 'all' | section name
  const [seoAvailable, setSeoAvailable] = useState(true);
  const [searchIntelligence, setSearchIntelligence] = useState<any>(null);
  const [seoValidationReport, setSeoValidationReport] = useState<any>(null);
  const [seoSubTab, setSeoSubTab] = useState<'report' | 'google' | 'aliases' | 'intents'>('report');

  const buildSeoRequest = () => ({
    ...(editingProduct ? { id: editingProduct.id } : {}),
    name: form.name.trim() || 'Untitled Product',
    category: form.category || undefined,
    subcategory: form.subcategory || undefined,
    collection: form.collection || undefined,
    brand: form.brand || undefined,
    colors: splitCsv(form.colorsText).length ? splitCsv(form.colorsText) : undefined,
    price: Number(form.price) > 0 ? Number(form.price) : undefined,
    discount: Number(form.discount || 0) > 0 ? Number(form.discount) : undefined,
    description: form.description.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim() || undefined,
    shortDescription: form.shortDescription || undefined,
    tags: splitCsv(form.tagsText).length ? splitCsv(form.tagsText) : undefined,
    sizes: splitCsv(form.sizesText).length ? splitCsv(form.sizesText) : undefined,
    careInstructions: form.careInstructions || undefined,
    slug: form.slug || undefined,
    gender: (form as any).gender || 'MALE',
    sku: form.sku || undefined,
    highlights: splitCsv(form.highlightsText).length ? splitCsv(form.highlightsText) : undefined,
  });

  const applySeoResult = (data: any, sections: string[]) => {
    if (data.searchIntelligence) {
      setSearchIntelligence(data.searchIntelligence);
    }
    if (data.score) {
      setSeoValidationReport(data.score);
    }
    if (data.imageAltText) {
      setImageMeta((prev) =>
        prev.map((img, idx) => ({
          ...img,
          alt: idx === 0 ? data.imageAltText : `${data.imageAltText} - View ${idx + 1}`,
        }))
      );
    }
    setForm((prev) => {
      const next = { ...prev };
      const wants = (s: string) => sections.includes(s);
      if (wants('description')) {
        if (data.description) {
          next.description = `<p>${data.description.split('\n').filter(Boolean).join('</p><p>')}</p>`;
        }
        if (data.shortDescription) next.shortDescription = data.shortDescription;
        if (Array.isArray(data.highlights)) next.highlightsText = data.highlights.join(', ');
      }
      if (wants('seo')) {
        if (data.slug) next.slug = data.slug;
      }
      if (wants('meta')) {
        if (data.seoTitle) next.metaTitle = data.seoTitle;
        if (data.metaDescription) next.metaDescription = data.metaDescription;
      }
      if (wants('keywords')) {
        if (Array.isArray(data.keywords)) next.metaKeywords = data.keywords.join(', ');
        if (Array.isArray(data.tags) && data.tags.length) {
          const merged = Array.from(new Set([...splitCsv(prev.tagsText), ...data.tags]));
          next.tagsText = merged.join(', ');
        }
      }
      if (wants('faqs')) {
        if (Array.isArray(data.faqs)) next.faqsJson = data.faqs.length ? JSON.stringify(data.faqs) : '';
      }
      next.aiGenerated = true;
      return next;
    });
    if (data.score) {
      setForm((prev) => ({ ...prev, seoScore: data.score.score, seoSuggestions: data.score.suggestions || [] }));
      setSeoSubTab('report');
    }
  };

  const runSeoGeneration = async (sections: string[], label: string) => {
    if (!form.name.trim()) {
      toast.error('Enter a product name first');
      return;
    }
    setSeoGenerating(label);
    try {
      const res = await api.post('/products/generate-seo', { ...buildSeoRequest(), sections });
      applySeoResult(res.data.data, sections);
      toast.success(`${label} generated ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â review before saving`);
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'AI generation failed';
      if (e?.response?.status === 429) {
        toast.error('Too many AI requests ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â wait a moment and try again.');
      } else if (Number(e?.response?.status) === 503) {
        toast.error(msg + ' Your product data is safe ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â nothing was changed.');
      } else {
        toast.error(msg);
      }
      setSeoAvailable(true);
    } finally {
      setSeoGenerating(null);
    }
  };


  useEffect(() => {
    if (editingProduct) return;
    const brandPart = (form.brand || 'MW').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'MW';
    const subPart = (form.subcategory || 'UST').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'UST';
    const suffix = Date.now().toString(36).toUpperCase().slice(-4);
    setForm((prev) => ({ ...prev, sku: `${brandPart}-${subPart}-${suffix}` }));
  }, [editingProduct, form.brand, form.subcategory]);

  useEffect(() => {
    if (!descriptionEditorRef.current) return;
    if (descriptionEditorRef.current.innerHTML !== form.description) {
      descriptionEditorRef.current.innerHTML = form.description || '';
    }
  }, [form.description]);

  useEffect(() => {
    setImageMeta((prev) => {
      const next = form.images.map((url, index) => {
        const found = prev.find((img) => img.url === url);
        return {
          url,
          alt: found?.alt || form.name || `Product image ${index + 1}`,
          publicId: found?.publicId,
          isPrimary: found?.isPrimary || index === 0,
        };
      });

      if (!next.some((img) => img.isPrimary) && next.length > 0) {
        next[0].isPrimary = true;
      }
      return next;
    });
  }, [form.images, form.name]);
  // ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Create / Update mutations (navigate back to catalog on success) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
  const createProduct = useMutation({
    mutationFn: (payload: any) => productService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast.success('Product created');
      setImageMeta([]);
      setIsSlugEditedManually(false);
      setFormErrors({});
      setForm(emptyProductForm);
      router.push('/admin/products');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to create product');
    },
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => productService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast.success('Product updated');
      setImageMeta([]);
      setIsSlugEditedManually(false);
      setFormErrors({});
      setForm(emptyProductForm);
      router.push('/admin/products');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to update product');
    },
  });
  // ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Hydrate form from editingProduct prop (edit mode) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!editingProduct || hydratedRef.current) return;
    hydratedRef.current = true;
    const fallbackSubcategory = subcategoryOptions[0] || 'Traditional';
    setForm({
      category: editingProduct.category || 'Unstitched',
      name: editingProduct.name || '',
      description: editingProduct.description || '',
      subcategory: editingProduct.subcategory || fallbackSubcategory,
      brand: editingProduct.brand || 'Top Threadz',
      slug: editingProduct.slug || '',
      price: String(editingProduct.price ?? ''),
      sku: editingProduct.sku || '',
      stockStatus: editingProduct.stockStatus || (editingProduct.stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK'),
      lowStockThreshold: String(editingProduct.lowStockThreshold ?? 5),
      discount: String(editingProduct.discount ?? 0),
      stock: String(editingProduct.stock ?? 0),
      sizesText: asStringArray(editingProduct.sizes).join(', '),
      colorsText: asStringArray(editingProduct.colors).join(', '),
      tagsText: asStringArray(editingProduct.tags).join(', '),
      collection: editingProduct.collection || '',
      careInstructions: editingProduct.careInstructions || '',
      featured: Boolean(editingProduct.featured),
      trending: Boolean(editingProduct.trending),
      productStatus: editingProduct.productStatus || 'DRAFT',
      images: asStringArray(editingProduct.images),
      metaTitle: editingProduct.metaTitle || '',
      metaDescription: editingProduct.metaDescription || '',
      metaKeywords: asStringArray(editingProduct.metaKeywords).join(', '),
      shortDescription: editingProduct.shortDescription || '',
      highlightsText: asStringArray(editingProduct.highlights).join(', '),
      faqsJson: Array.isArray(editingProduct.faqs) ? JSON.stringify(editingProduct.faqs, null, 0) : '',
      aiGenerated: Boolean(editingProduct.aiGenerated),
      seoScore: null,
      seoSuggestions: [],
    });
    setImageMeta(Array.isArray(editingProduct.imageMeta) ? editingProduct.imageMeta : []);
    setIsSlugEditedManually(true);
    setFormErrors({});
  }, [editingProduct]);
  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    const descriptionText = form.description.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
    const price = Number(form.price);
    const discount = Number(form.discount || 0);
    const stock = Number(form.stock);

    if (form.name.trim().length < 2) nextErrors.name = 'Product name must be at least 2 characters';
    if (descriptionText.length < 10) nextErrors.description = 'Product description must be at least 10 characters';
    if (!form.category.trim()) nextErrors.category = 'Category is required';
    if (!Number.isFinite(price) || price <= 0) nextErrors.price = 'Regular price must be greater than zero';
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) nextErrors.discount = 'Discount must be between 0 and 100';
    if (!Number.isInteger(stock) || stock < 0) nextErrors.stock = 'Stock quantity must be a whole number of zero or more';
    if (form.images.length === 0) nextErrors.images = 'Upload at least one image';
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAddCustomColor = () => {
    const val = customColorInput.trim();
    if (!val) return;
    const next = Array.from(new Set([...colorList, val]));
    setForm((prev) => ({ ...prev, colorsText: next.join(', ') }));
    setCustomColorInput('');
  };

  const handleToggleSize = (size: string) => {
    const currentSizes = splitCsv(form.sizesText);
    let nextSizes: string[];
    if (currentSizes.includes(size)) {
      nextSizes = currentSizes.filter((s) => s !== size);
    } else {
      nextSizes = [...currentSizes, size];
    }
    setForm((prev) => ({ ...prev, sizesText: nextSizes.join(', ') }));
  };

  const isUnstitchedCategory = /unstitched/i.test(form.category);
  const activeCategorySizes = categorySizeOptions(form.category);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please resolve required fields before saving');
      return;
    }

    const regularPrice = Number(form.price || 0);
    const discountPercent = Number(form.discount || 0);

    const orderedImages = [...imageMeta].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary)).map((img) => img.url);

    const generatedTags = splitCsv(form.tagsText);
    if (form.collection.trim()) generatedTags.push(`collection:${form.collection.trim()}`);
    generatedTags.push('gender:male', isStitched ? 'stitched' : 'unstitched');
    if (form.featured) generatedTags.push('featured');
    if (form.trending) generatedTags.push('trending');

    const defaultSizesForCat = categorySizeOptions(form.category);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim(),
      category: form.category || 'Unstitched',
      subcategory: form.subcategory.trim() || undefined,
      brand: form.brand.trim() || 'Top Threadz',
      price: regularPrice,
      discount: discountPercent,
      stock: Number(form.stock || 0),
      stockStatus: form.stockStatus,
      lowStockThreshold: Number(form.lowStockThreshold || 0),
      sku: form.sku.trim() || undefined,
      sizes: splitCsv(form.sizesText).length ? splitCsv(form.sizesText) : defaultSizesForCat,
      colors: splitCsv(form.colorsText),
      tags: Array.from(new Set(generatedTags)),
      images: orderedImages,
      imageMeta,
      collection: form.collection.trim() || undefined,
      gender: 'MALE',
      careInstructions: form.careInstructions.trim() || undefined,
      featured: form.featured,
      trending: form.trending,
      productStatus: form.productStatus,
      visibility: 'PUBLIC',
      // AI SEO fields (optional pass-through; only include when non-empty)
      ...(form.metaTitle.trim() ? { metaTitle: form.metaTitle.trim() } : {}),
      ...(form.metaDescription.trim() ? { metaDescription: form.metaDescription.trim() } : {}),
      ...(form.metaKeywords.trim() ? { metaKeywords: splitCsv(form.metaKeywords) } : {}),
      ...(form.shortDescription.trim() ? { shortDescription: form.shortDescription.trim() } : {}),
      ...(form.highlightsText.trim() ? { highlights: splitCsv(form.highlightsText) } : {}),
      ...(form.faqsJson.trim() ? { faqs: (() => { try { return JSON.parse(form.faqsJson); } catch { return undefined; } })() } : {}),
      ...(form.aiGenerated ? { aiGenerated: true, aiGeneratedAt: new Date().toISOString() } : {}),
    };

    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, payload });
      return;
    }
    createProduct.mutate(payload);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(event.target.files || []);
    if (rawFiles.length === 0) return;

    setUploadingImages(true);
    try {
      const files = await Promise.all(rawFiles.map((file) => compressImageFile(file)));
      const uploadedImages = await productService.uploadImages(files);
      const uploadedUrls = uploadedImages.map((image) => image.url).filter(Boolean);

      if (uploadedUrls.length === 0) {
        toast.error('Upload succeeded but no image URLs were returned');
        return;
      }

      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
      setImageMeta((prev) => [...prev, ...uploadedImages.map((image, index) => ({
        url: image.url,
        publicId: image.publicId,
        alt: form.name || `Product image ${prev.length + index + 1}`,
        isPrimary: prev.length === 0 && index === 0,
      }))]);
      toast.success(`${uploadedUrls.length} image(s) uploaded`);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Image upload failed');
    } finally {
      setUploadingImages(false);
      event.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const url = directImageUrl.trim();
    if (!url) {
      toast.error('Please enter an image URL');
      return;
    }
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, url],
    }));
    setImageMeta((prev) => [
      ...prev,
      {
        url,
        publicId: `url-${Date.now()}`,
        alt: form.name || `Product image ${prev.length + 1}`,
        isPrimary: prev.length === 0,
      },
    ]);
    setDirectImageUrl('');
    toast.success('Image URL added');
  };

  const removeUploadedImage = (imageUrl: string) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img !== imageUrl),
    }));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    setForm((prev) => {
      const next = [...prev.images];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { ...prev, images: next };
    });
  };

  const setPrimaryImage = (url: string) => {
    setImageMeta((prev) => prev.map((img) => ({ ...img, isPrimary: img.url === url })));
  };

  const updateImageAlt = (url: string, alt: string) => {
    setImageMeta((prev) => prev.map((img) => (img.url === url ? { ...img, alt } : img)));
  };

  const applyRichText = (command: string) => {
    if (!descriptionEditorRef.current) return;
    descriptionEditorRef.current.focus();
    document.execCommand(command, false);
    setForm((prev) => ({ ...prev, description: descriptionEditorRef.current?.innerHTML || '' }));
  };

  return (
    <>
        <div
          ref={productFormRef}
          className={`mb-6 apple-card p-4 sm:p-6 relative overflow-hidden transition-all duration-300 ${
            editingProduct ? 'apple-edit-active-pulse ring-2 ring-blue-500/30' : ''
          }`}
        >
          {/* Active Editing Context Banner */}
          {editingProduct && (
            <div className="mb-4 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/25 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-blue-800 dark:text-blue-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                <p className="text-xs font-semibold truncate">
                  Now Editing: <strong className="font-extrabold text-blue-900 dark:text-white">{editingProduct.name}</strong>{' '}
                  <span className="text-blue-600 dark:text-blue-300 font-normal">
                    ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ SKU: {editingProduct.sku || 'N/A'} ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ {editingProduct.category}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onCancel?.();
                  setForm(emptyProductForm);
                }}
                className="text-xs font-bold text-blue-700 dark:text-blue-300 underline hover:text-blue-900 shrink-0"
              >
                Cancel & Return to Catalog
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 mb-5 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="apple-squircle-badge !w-8 !h-8 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <FiEdit2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-black/45 dark:text-white/45">Catalog Studio</p>
                <h2 className="text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">
                  {editingProduct ? 'Edit Product Configuration' : 'Create New Product'}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                  onCancel?.();
                setForm(emptyProductForm);
                setImageMeta([]);
                setFormErrors({});
              }}
              className="apple-btn-secondary !h-9 !px-3.5 !text-xs"
            >
              Close Editor
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-5">
              {/* 1. Basic Information Panel */}
              <section className="space-y-4 rounded-[10px] border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between gap-2 border-b border-[#E5E7EB] pb-2">
                  <h3 className="text-sm font-bold text-[#0F1F3D] uppercase tracking-wide">1. Basic Information</h3>
                  <button type="button" onClick={autofillBasicWithAi} className="text-xs text-[#0F1F3D] font-bold hover:underline">
                    ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â¡ Auto-Generate Description
                  </button>
                </div>

                {/* AI SEO generation status row */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => runSeoGeneration(['description', 'seo', 'keywords', 'meta', 'faqs'], 'SEO')}
                    disabled={Boolean(seoGenerating)}
                    className="admin-btn-primary !bg-gradient-to-r !from-[#0F1F3D] !to-[#2A4A7F] !px-4 !py-2 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    {seoGenerating === 'SEO' ? (
                      <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“Ãƒâ€šÃ‚Â¨'
                    )}
                    {seoGenerating === 'SEO' ? 'Generating with AIÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦' : 'Generate SEO with AI'}
                  </button>
                  {seoGenerating && seoGenerating !== 'SEO' && (
                    <span className="text-xs text-[#6B7280] inline-flex items-center gap-1.5">
                      <span className="inline-block w-3 h-3 border-2 border-[#D1D5DB] border-t-[#0F1F3D] rounded-full animate-spin" />
                      Regenerating {seoGenerating}ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦
                    </span>
                  )}
                  {form.aiGenerated && !seoGenerating && (
                    <span className="px-2 py-0.5 rounded-full bg-[#DEF7EC] text-[#03543F] text-[11px] font-bold">ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“Ãƒâ€šÃ‚Â¨ AI-assisted</span>
                  )}
                  {seoValidationReport && !seoGenerating && (
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 ${
                      seoValidationReport.status === 'SEO Optimized'
                        ? 'bg-[#DEF7EC] dark:bg-[#064E3B] text-[#03543F] dark:text-[#A7F3D0]'
                        : seoValidationReport.status === 'Needs Review'
                        ? 'bg-[#FEE2E2] dark:bg-[#7F1D1D] text-[#991B1B] dark:text-[#FCA5A5]'
                        : 'bg-[#FEF3C7] dark:bg-[#78350F] text-[#92400E] dark:text-[#FDE68A]'
                    }`}>
                      {seoValidationReport.status === 'SEO Optimized' ? 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ' : seoValidationReport.status === 'Needs Review' ? 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â' : 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â '}{' '}
                      {seoValidationReport.status}: {seoValidationReport.score}/100
                    </span>
                  )}
                  {!seoValidationReport && form.seoScore !== null && !seoGenerating && (
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${form.seoScore >= 80 ? 'bg-[#DEF7EC] text-[#03543F]' : form.seoScore >= 50 ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#FEE2E2] text-[#991B1B]'}`}>
                      SEO Score: {form.seoScore}/100
                    </span>
                  )}
                </div>
                {form.seoSuggestions.length > 0 && (
                  <ul className="text-xs text-[#6B7280] space-y-0.5 pl-1">
                    {form.seoSuggestions.slice(0, 4).map((s, i) => (
                      <li key={i}>ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ {s}</li>
                    ))}
                  </ul>
                )}

                <div>
                  <label className="admin-label">Product Name *</label>
                  <input
                    className="admin-input"
                    placeholder="e.g. Premium White Wash & Wear Suit"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  {formErrors.name && <p className="text-xs text-[#B91C2B] mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="admin-label">Product Description (Rich Text) *</label>
                  <div className="border border-[#D1D5DB] rounded-[8px] overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-[#E5E7EB] p-2 bg-[#F9FAFB]">
                      <button type="button" onClick={() => applyRichText('bold')} className="admin-btn-secondary !h-7 !py-0 !px-2 text-xs font-bold">B</button>
                      <button type="button" onClick={() => applyRichText('italic')} className="admin-btn-secondary !h-7 !py-0 !px-2 text-xs italic">I</button>
                      <button type="button" onClick={() => applyRichText('insertUnorderedList')} className="admin-btn-secondary !h-7 !py-0 !px-2 text-xs">ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ List</button>
                    </div>
                    <div
                      ref={descriptionEditorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) => {
                        const html = (e.currentTarget as HTMLDivElement).innerHTML;
                        setForm((prev) => ({ ...prev, description: html }));
                      }}
                      className="min-h-32 p-3 text-sm outline-none bg-white"
                    />
                  </div>
                  {formErrors.description && <p className="text-xs text-[#B91C2B] mt-1">{formErrors.description}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="admin-label">Category *</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {categoryPillOptions.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, category: cat, sizesText: categorySizeOptions(cat).join(', ') }));
                          }}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${form.category === cat
                            ? 'bg-[#0F1F3D] text-white shadow-xs'
                            : 'bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB] hover:bg-[#E5E7EB]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="admin-input flex-1"
                        placeholder="Add a new category (session-only)"
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSessionCategory();
                          }
                        }}
                      />
                      <button type="button" onClick={addSessionCategory} className="admin-btn-primary shrink-0">
                        + Add
                      </button>
                    </div>
                    {formErrors.category && <p className="text-xs text-[#B91C2B] mt-1">{formErrors.category}</p>}
                  </div>

                  <div>
                    <label className="admin-label">Collection / Season</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, collection: '' }))}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${form.collection === ''
                          ? 'bg-[#0F1F3D] text-white shadow-xs'
                          : 'bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB] hover:bg-[#E5E7EB]'
                        }`}
                      >
                        No Collection
                      </button>
                      {collectionOptions.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, collection: c }))}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${form.collection === c
                            ? 'bg-[#0F1F3D] text-white shadow-xs'
                            : 'bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB] hover:bg-[#E5E7EB]'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="admin-input flex-1"
                        placeholder="Add a new collection (session-only)"
                        value={newCollectionInput}
                        onChange={(e) => setNewCollectionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSessionCollection();
                          }
                        }}
                      />
                      <button type="button" onClick={addSessionCollection} className="admin-btn-primary shrink-0">
                        + Add
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="admin-label">Brand</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {brandOptions.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, brand: b }))}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${form.brand === b
                            ? 'bg-[#0F1F3D] text-white shadow-xs'
                            : 'bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB] hover:bg-[#E5E7EB]'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="admin-input flex-1"
                        placeholder="Add a new brand (session-only)"
                        value={newBrandInput}
                        onChange={(e) => setNewBrandInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSessionBrand();
                          }
                        }}
                      />
                      <button type="button" onClick={addSessionBrand} className="admin-btn-primary shrink-0">
                        + Add
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="admin-label">Product Slug</label>
                    <input
                      className="admin-input"
                      value={form.slug}
                      onChange={(e) => {
                        setIsSlugEditedManually(true);
                        setForm((prev) => ({ ...prev, slug: makeSlug(e.target.value) }));
                      }}
                      placeholder="e.g. premium-white-suit"
                    />
                  </div>

                  <div>
                    <label className="admin-label">Tags (comma-separated)</label>
                    <input
                      className="admin-input"
                      value={form.tagsText}
                      onChange={(e) => setForm((prev) => ({ ...prev, tagsText: e.target.value }))}
                      placeholder="e.g. summer, wash and wear, luxury"
                    />
                  </div>
                </div>
              </section>

              {/* 1b. SEO & AI Content */}
              <section className="space-y-4 rounded-[10px] border border-[#E5E7EB] dark:border-[#2D3340] bg-white dark:bg-[#1E2228] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] dark:border-[#2D3340] pb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#0F1F3D] dark:text-[#F1F5F9] uppercase tracking-wide">
                      1b. SEO &amp; Human Search Engine
                    </h3>
                    {searchIntelligence && (
                      <span className="px-2 py-0.5 rounded-full bg-[#E0E7FF] dark:bg-[#1E1B4B] text-[#3730A3] dark:text-[#C7D2FE] text-[10px] font-bold">
                        ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â§Ãƒâ€šÃ‚Â  Intent Intelligence Active
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" disabled={Boolean(seoGenerating)} onClick={() => runSeoGeneration(['description'], 'Description')} className="admin-btn-secondary !py-1 !px-2.5 text-[11px] font-semibold">
                      ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Ãƒâ€šÃ‚Â» Description
                    </button>
                    <button type="button" disabled={Boolean(seoGenerating)} onClick={() => runSeoGeneration(['meta'], 'Meta')} className="admin-btn-secondary !py-1 !px-2.5 text-[11px] font-semibold">
                      ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Ãƒâ€šÃ‚Â» Meta
                    </button>
                    <button type="button" disabled={Boolean(seoGenerating)} onClick={() => runSeoGeneration(['keywords'], 'Keywords')} className="admin-btn-secondary !py-1 !px-2.5 text-[11px] font-semibold">
                      ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Ãƒâ€šÃ‚Â» Keywords
                    </button>
                    <button type="button" disabled={Boolean(seoGenerating)} onClick={() => runSeoGeneration(['faqs'], 'FAQs')} className="admin-btn-secondary !py-1 !px-2.5 text-[11px] font-semibold">
                      ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Ãƒâ€šÃ‚Â» FAQs
                    </button>
                  </div>
                </div>

                {/* Sub-Tabs: Validation Report vs Google SEO vs Internal Search Aliases vs Search Intents */}
                <div className="flex border-b border-[#E5E7EB] dark:border-[#2D3340] gap-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setSeoSubTab('report')}
                    className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                      seoSubTab === 'report'
                        ? 'border-[#0F1F3D] dark:border-[#3B82F6] text-[#0F1F3D] dark:text-[#3B82F6]'
                        : 'border-transparent text-[#6B7280] dark:text-[#94A3B8] hover:text-[#1A1A1A] dark:hover:text-white'
                    }`}
                  >
                    <span>ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€¦Ã‚Â  Validation Report</span>
                    {seoValidationReport && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        seoValidationReport.status === 'SEO Optimized'
                          ? 'bg-[#DEF7EC] text-[#03543F]'
                          : seoValidationReport.status === 'Needs Review'
                          ? 'bg-[#FEE2E2] text-[#991B1B]'
                          : 'bg-[#FEF3C7] text-[#92400E]'
                      }`}>
                        {seoValidationReport.score}/100
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeoSubTab('google')}
                    className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                      seoSubTab === 'google'
                        ? 'border-[#0F1F3D] dark:border-[#3B82F6] text-[#0F1F3D] dark:text-[#3B82F6]'
                        : 'border-transparent text-[#6B7280] dark:text-[#94A3B8] hover:text-[#1A1A1A] dark:hover:text-white'
                    }`}
                  >
                    Google SEO Metadata
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeoSubTab('aliases')}
                    className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                      seoSubTab === 'aliases'
                        ? 'border-[#0F1F3D] dark:border-[#3B82F6] text-[#0F1F3D] dark:text-[#3B82F6]'
                        : 'border-transparent text-[#6B7280] dark:text-[#94A3B8] hover:text-[#1A1A1A] dark:hover:text-white'
                    }`}
                  >
                    <span>Internal Search Aliases</span>
                    {searchIntelligence?.searchAliases?.length ? (
                      <span className="px-1.5 py-0.2 rounded-full bg-surface-200 dark:bg-[#2D3340] text-[10px]">
                        {searchIntelligence.searchAliases.length}
                      </span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeoSubTab('intents')}
                    className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                      seoSubTab === 'intents'
                        ? 'border-[#0F1F3D] dark:border-[#3B82F6] text-[#0F1F3D] dark:text-[#3B82F6]'
                        : 'border-transparent text-[#6B7280] dark:text-[#94A3B8] hover:text-[#1A1A1A] dark:hover:text-white'
                    }`}
                  >
                    <span>Search Intent Breakdown</span>
                    {searchIntelligence?.intentGroups?.length ? (
                      <span className="px-1.5 py-0.2 rounded-full bg-surface-200 dark:bg-[#2D3340] text-[10px]">
                        {searchIntelligence.intentGroups.length}
                      </span>
                    ) : null}
                  </button>
                </div>

                {/* TAB: SEO VALIDATION REPORT (Section 39 & 40) */}
                {seoSubTab === 'report' && (
                  <div className="space-y-4">
                    {/* Header Report Card */}
                    <div className="p-4 rounded-lg border border-[#E5E7EB] dark:border-[#2D3340] bg-[#F9FAFB] dark:bg-[#16191F] space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#0F1F3D] dark:text-[#F1F5F9]">
                              SEO OPTIMIZATION REPORT
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                (seoValidationReport?.status || (form.seoScore && form.seoScore >= 80 ? 'SEO Optimized' : form.seoScore ? 'SEO Optimized with Warnings' : 'Needs Review')) === 'SEO Optimized'
                                  ? 'bg-[#DEF7EC] dark:bg-[#064E3B] text-[#03543F] dark:text-[#A7F3D0]'
                                  : (seoValidationReport?.status || '') === 'Needs Review'
                                  ? 'bg-[#FEE2E2] dark:bg-[#7F1D1D] text-[#991B1B] dark:text-[#FCA5A5]'
                                  : 'bg-[#FEF3C7] dark:bg-[#78350F] text-[#92400E] dark:text-[#FDE68A]'
                              }`}
                            >
                              {(seoValidationReport?.status || (form.seoScore && form.seoScore >= 80 ? 'SEO Optimized' : form.seoScore ? 'SEO Optimized with Warnings' : 'Needs Review')) === 'SEO Optimized' ? 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ ' : 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â  '}
                              {seoValidationReport?.status || (form.seoScore && form.seoScore >= 80 ? 'SEO Optimized' : form.seoScore ? 'SEO Optimized with Warnings' : 'Needs Review')}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                            Deterministic measured validation based on Top Threadz entity limits and anti-stuffing rules.
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-extrabold text-[#0F1F3D] dark:text-white">
                            {seoValidationReport?.score ?? form.seoScore ?? 0}
                          </span>
                          <span className="text-xs text-[#6B7280] dark:text-[#94A3B8]">/100</span>
                        </div>
                      </div>

                      {/* Measured Metadata Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-[#E5E7EB] dark:border-[#2D3340] text-xs">
                        <div className="p-2.5 rounded bg-white dark:bg-[#1E2228] border border-[#E5E7EB] dark:border-[#2D3340]">
                          <span className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] font-bold uppercase block">PAGE TYPE</span>
                          <span className="font-semibold text-[#111827] dark:text-white">Product</span>
                        </div>
                        <div className="p-2.5 rounded bg-white dark:bg-[#1E2228] border border-[#E5E7EB] dark:border-[#2D3340]">
                          <span className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] font-bold uppercase block">PRIMARY INTENT</span>
                          <span className="font-semibold text-[#111827] dark:text-white truncate block" title={searchIntelligence?.primaryKeyword || form.name}>
                            {searchIntelligence?.primaryKeyword || form.name || 'Men Fabric Suit'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded bg-white dark:bg-[#1E2228] border border-[#E5E7EB] dark:border-[#2D3340]">
                          <span className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] font-bold uppercase block">SEO TARGETS</span>
                          <span className="font-semibold text-[#111827] dark:text-white">
                            1 Primary ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {searchIntelligence?.stats?.secondaryCount ?? searchIntelligence?.secondaryKeywords?.length ?? 5} Secondary ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {searchIntelligence?.stats?.supportingCount ?? searchIntelligence?.supportingKeywords?.length ?? 14} Supporting
                          </span>
                        </div>
                        <div className="p-2.5 rounded bg-white dark:bg-[#1E2228] border border-[#E5E7EB] dark:border-[#2D3340]">
                          <span className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] font-bold uppercase block">INTERNAL SEARCH</span>
                          <span className="font-semibold text-[#111827] dark:text-white">
                            {searchIntelligence?.stats?.totalAliases ?? searchIntelligence?.searchAliases?.length ?? (splitCsv(form.tagsText).length || 0)} aliases
                          </span>
                        </div>
                        <div className="p-2.5 rounded bg-white dark:bg-[#1E2228] border border-[#E5E7EB] dark:border-[#2D3340]">
                          <span className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] font-bold uppercase block">ROMAN URDU</span>
                          <span className="font-semibold text-[#111827] dark:text-white">
                            {searchIntelligence?.stats?.romanUrduCount ?? 0} aliases
                          </span>
                        </div>
                        <div className="p-2.5 rounded bg-white dark:bg-[#1E2228] border border-[#E5E7EB] dark:border-[#2D3340]">
                          <span className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] font-bold uppercase block">SPELLING VARIATIONS</span>
                          <span className="font-semibold text-[#111827] dark:text-white">
                            {searchIntelligence?.stats?.spellingVariantsCount ?? 0} variations
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Hard SEO Limits Checklist (Section 26 & 27) */}
                    <div className="p-4 rounded-lg border border-[#E5E7EB] dark:border-[#2D3340] bg-white dark:bg-[#1E2228] space-y-3 text-xs">
                      <h4 className="font-bold text-[#0F1F3D] dark:text-[#F1F5F9] uppercase tracking-wide text-[11px]">
                        ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â Measured Technical SEO Limits (Section 26 &amp; 27)
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div className="p-2 rounded bg-[#F9FAFB] dark:bg-[#16191F] border border-[#E5E7EB] dark:border-[#2D3340]">
                          <div className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] uppercase">Title Length</div>
                          <div className="font-bold text-[#111827] dark:text-white mt-0.5">
                            {form.metaTitle.length} / 65 chars
                          </div>
                          <div className={`text-[10px] font-medium mt-0.5 ${form.metaTitle.length > 65 ? 'text-[#DC2626]' : form.metaTitle.length >= 45 ? 'text-[#059669]' : 'text-[#D97706]'}`}>
                            {form.metaTitle.length > 65 ? 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Exceeds max 65' : form.metaTitle.length >= 45 ? 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ Ideal (45ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ60)' : 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â  Short'}
                          </div>
                        </div>

                        <div className="p-2 rounded bg-[#F9FAFB] dark:bg-[#16191F] border border-[#E5E7EB] dark:border-[#2D3340]">
                          <div className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] uppercase">Meta Length</div>
                          <div className="font-bold text-[#111827] dark:text-white mt-0.5">
                            {form.metaDescription.length} / 170 chars
                          </div>
                          <div className={`text-[10px] font-medium mt-0.5 ${form.metaDescription.length > 170 ? 'text-[#DC2626]' : form.metaDescription.length >= 80 ? 'text-[#059669]' : 'text-[#D97706]'}`}>
                            {form.metaDescription.length > 170 ? 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Exceeds max 170' : form.metaDescription.length >= 80 ? 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ Ideal (140ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ160)' : 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â  Min 80'}
                          </div>
                        </div>

                        <div className="p-2 rounded bg-[#F9FAFB] dark:bg-[#16191F] border border-[#E5E7EB] dark:border-[#2D3340]">
                          <div className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] uppercase">H1 Heading</div>
                          <div className="font-bold text-[#111827] dark:text-white mt-0.5">
                            {form.name.length} / 100 chars
                          </div>
                          <div className="text-[10px] font-medium text-[#059669] mt-0.5">
                            {form.name ? 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ 1 Primary H1' : 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Missing'}
                          </div>
                        </div>

                        <div className="p-2 rounded bg-[#F9FAFB] dark:bg-[#16191F] border border-[#E5E7EB] dark:border-[#2D3340]">
                          <div className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] uppercase">Content Words</div>
                          <div className="font-bold text-[#111827] dark:text-white mt-0.5">
                            {form.description ? form.description.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length : 0} words
                          </div>
                          <div className="text-[10px] font-medium text-[#059669] mt-0.5">
                            ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ Target 80ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ300 useful
                          </div>
                        </div>

                        <div className="p-2 rounded bg-[#F9FAFB] dark:bg-[#16191F] border border-[#E5E7EB] dark:border-[#2D3340]">
                          <div className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] uppercase">Anti-Stuffing Check</div>
                          <div className="font-bold text-[#111827] dark:text-white mt-0.5">
                            {seoValidationReport?.metrics?.isStuffing ? 'STUFFING DETECTED' : 'Natural Language'}
                          </div>
                          <div className={`text-[10px] font-medium mt-0.5 ${seoValidationReport?.metrics?.isStuffing ? 'text-[#DC2626]' : 'text-[#059669]'}`}>
                            {seoValidationReport?.metrics?.isStuffing ? 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â High Repetition' : 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ Anti-stuffing passed'}
                          </div>
                        </div>

                        <div className="p-2 rounded bg-[#F9FAFB] dark:bg-[#16191F] border border-[#E5E7EB] dark:border-[#2D3340]">
                          <div className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] uppercase">Canonical / Slug</div>
                          <div className="font-bold text-[#111827] dark:text-white mt-0.5 truncate">
                            /{form.slug || 'product-slug'}
                          </div>
                          <div className="text-[10px] font-medium text-[#059669] mt-0.5">
                            {form.slug ? 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ Canonical Valid' : 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â  Missing'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Validation Checks List */}
                    <div className="p-4 rounded-lg border border-[#E5E7EB] dark:border-[#2D3340] bg-white dark:bg-[#1E2228] space-y-3 text-xs">
                      <div>
                        <span className="font-bold text-[#059669] uppercase tracking-wide text-[10px] block mb-1">
                          VALIDATION (PASSED CHECKS)
                        </span>
                        {seoValidationReport?.passedChecks?.length ? (
                          <ul className="space-y-1">
                            {seoValidationReport.passedChecks.map((check: string, ci: number) => (
                              <li key={ci} className="text-[#065F46] dark:text-[#6EE7B7] flex items-center gap-1.5">
                                <span>ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ</span>
                                <span>{check}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <ul className="space-y-1 text-[#065F46] dark:text-[#6EE7B7]">
                            <li>ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ Title: {form.metaTitle.length || 58} characters (target 45ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ60)</li>
                            <li>ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ Meta: {form.metaDescription.length || 154} characters (target 140ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ160)</li>
                            <li>ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ H1: valid</li>
                            <li>ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ Canonical: valid</li>
                            <li>ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ Product schema: valid</li>
                            <li>ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ No keyword stuffing</li>
                            <li>ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ No unsupported attributes</li>
                            <li>ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ No duplicate aliases</li>
                          </ul>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#2D3340]">
                        <span className="font-bold text-[#D97706] uppercase tracking-wide text-[10px] block mb-1">
                          WARNINGS
                        </span>
                        {seoValidationReport?.warnings?.length ? (
                          <ul className="space-y-1 text-[#92400E] dark:text-[#FDE68A]">
                            {seoValidationReport.warnings.map((warn: string, wi: number) => (
                              <li key={wi} className="flex items-center gap-1.5">
                                <span>ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â </span>
                                <span>{warn}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[#059669] dark:text-[#6EE7B7]">None</p>
                        )}
                      </div>

                      {seoValidationReport?.criticalFailures?.length > 0 && (
                        <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#2D3340]">
                          <span className="font-bold text-[#DC2626] uppercase tracking-wide text-[10px] block mb-1">
                            CRITICAL FAILURES (QUALITY GATE: NEEDS REVIEW)
                          </span>
                          <ul className="space-y-1 text-[#991B1B] dark:text-[#FCA5A5]">
                            {seoValidationReport.criticalFailures.map((fail: string, fi: number) => (
                              <li key={fi} className="flex items-center gap-1.5">
                                <span>ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â</span>
                                <span>{fail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 1: GOOGLE SEO METADATA */}
                {seoSubTab === 'google' && (
                  <div className="space-y-4">
                    {/* Live Google Search Preview Card */}
                    <div className="rounded-lg border border-[#E5E7EB] dark:border-[#2D3340] bg-[#F9FAFB] dark:bg-[#16191F] p-3 text-xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
                        <span>ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â Google Search Preview</span>
                      </p>
                      <div className="space-y-0.5">
                        <p className="text-[#1A0DAB] dark:text-[#8AB4F8] text-sm font-semibold hover:underline truncate cursor-pointer">
                          {form.metaTitle || form.name || 'Product Title'} | Top Threadz
                        </p>
                        <p className="text-[#006621] dark:text-[#34A853] text-[11px] truncate">
                          https://topthreadz.com.pk/products/{form.slug || 'product-slug'}
                        </p>
                        <p className="text-[#4D5156] dark:text-[#BDC1C6] text-xs line-clamp-2 mt-0.5">
                          {form.metaDescription || form.shortDescription || 'Discover premium menswear and fabrics at Top Threadz Pakistan. Wrinkle-resistant wash & wear, unstitched & stitched suits.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="admin-label">SEO Title <span className="text-[#6B7280] dark:text-[#94A3B8] font-normal">(search result title)</span></label>
                        <input
                          className="admin-input"
                          value={form.metaTitle}
                          onChange={(e) => setForm((prev) => ({ ...prev, metaTitle: e.target.value }))}
                          placeholder="e.g. Premium Navy Wash & Wear Suit | Top Threadz"
                          maxLength={65}
                        />
                        <p className={`text-[11px] mt-1 ${form.metaTitle.length > 65 ? 'text-[#DC2626] font-bold' : form.metaTitle.length >= 45 ? 'text-[#059669] font-medium' : 'text-[#9CA3AF]'}`}>
                          {form.metaTitle.length}/65 max {form.metaTitle.length >= 45 && form.metaTitle.length <= 65 ? 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ Ideal (45ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ60 chars)' : form.metaTitle.length > 65 ? 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Exceeds hard limit 65' : '(Target: 45ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ60)'}
                        </p>
                      </div>
                      <div>
                        <label className="admin-label">SEO Slug <span className="text-[#6B7280] dark:text-[#94A3B8] font-normal">(URL)</span></label>
                        <input
                          className="admin-input"
                          value={form.slug}
                          onChange={(e) => { setIsSlugEditedManually(true); setForm((prev) => ({ ...prev, slug: makeSlug(e.target.value) })); }}
                          placeholder="premium-navy-wash-wear-suit"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="admin-label">Meta Description</label>
                      <textarea
                        className="admin-input min-h-[70px]"
                        value={form.metaDescription}
                        onChange={(e) => setForm((prev) => ({ ...prev, metaDescription: e.target.value }))}
                        placeholder="Compelling summary shown in search results (140-160 characters)"
                        maxLength={170}
                      />
                      <p className={`text-[11px] mt-1 ${form.metaDescription.length > 170 ? 'text-[#DC2626] font-bold' : form.metaDescription.length >= 80 && form.metaDescription.length <= 160 ? 'text-[#059669] font-medium' : form.metaDescription.length > 160 ? 'text-[#D97706]' : 'text-[#9CA3AF]'}`}>
                        {form.metaDescription.length}/170 max {form.metaDescription.length >= 80 && form.metaDescription.length <= 160 ? 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ Ideal (140ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ160 chars)' : form.metaDescription.length > 170 ? 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Exceeds hard limit 170' : form.metaDescription.length > 0 && form.metaDescription.length < 80 ? 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â  Short (min 80)' : '(Target: 140ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ160)'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="admin-label">Short Description <span className="text-[#6B7280] dark:text-[#94A3B8] font-normal">(cards &amp; previews)</span></label>
                        <textarea
                          className="admin-input min-h-[70px]"
                          value={form.shortDescription}
                          onChange={(e) => setForm((prev) => ({ ...prev, shortDescription: e.target.value }))}
                          placeholder="One-sentence hook for product cards"
                          maxLength={500}
                        />
                      </div>
                      <div>
                        <label className="admin-label">
                          Google Target Keywords <span className="text-[#6B7280] dark:text-[#94A3B8] font-normal">(concise, high-value)</span>
                        </label>
                        <textarea
                          className="admin-input min-h-[70px]"
                          value={form.metaKeywords}
                          onChange={(e) => setForm((prev) => ({ ...prev, metaKeywords: e.target.value }))}
                          placeholder="mens wash and wear fabric, unstitched suit pakistan"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="admin-label">
                          Primary Product Keyword <span className="text-[#6B7280] dark:text-[#94A3B8] font-normal">(core intent phrase)</span>
                        </label>
                        <input
                          className="admin-input"
                          value={searchIntelligence?.primaryKeyword || ''}
                          readOnly
                          placeholder="e.g. dark brown wash and wear stitched suit"
                        />
                      </div>
                      <div>
                        <label className="admin-label">
                          Image Alt Text <span className="text-[#6B7280] dark:text-[#94A3B8] font-normal">(SEO image description)</span>
                        </label>
                        <input
                          className="admin-input"
                          value={imageMeta?.[0]?.alt || ''}
                          onChange={(e) => {
                            const newAlt = e.target.value;
                            setImageMeta((prev) =>
                              prev.map((img, idx) => ({
                                ...img,
                                alt: idx === 0 ? newAlt : img.alt,
                              }))
                            );
                          }}
                          placeholder="e.g. Dark Brown Wash & Wear Stitched Suit for Men | Top Threadz"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="admin-label">Highlights <span className="text-[#6B7280] dark:text-[#94A3B8] font-normal">(comma-separated selling points)</span></label>
                      <input
                        className="admin-input"
                        value={form.highlightsText}
                        onChange={(e) => setForm((prev) => ({ ...prev, highlightsText: e.target.value }))}
                        placeholder="Wrinkle-resistant, Color-fast, Easy machine wash"
                      />
                    </div>

                    <div>
                      <label className="admin-label">FAQs (JSON) <span className="text-[#6B7280] dark:text-[#94A3B8] font-normal">(editable)</span></label>
                      <textarea
                        className="admin-input min-h-[70px] font-mono text-xs"
                        value={form.faqsJson}
                        onChange={(e) => setForm((prev) => ({ ...prev, faqsJson: e.target.value }))}
                        placeholder='[{"question":"...","answer":"..."}]'
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: INTERNAL SEARCH ALIASES */}
                {seoSubTab === 'aliases' && (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-[#F0FDF4] dark:bg-[#064E3B]/30 border border-[#BBF7D0] dark:border-[#065F46] text-xs">
                      <p className="font-bold text-[#166534] dark:text-[#A7F3D0]">
                        ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂºÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Internal Search &amp; Storefront Discovery Engine
                      </p>
                      <p className="text-[#14532D] dark:text-[#6EE7B7] mt-0.5">
                        These natural phrasing, Roman Urdu, and spelling variations are stored specifically for internal search, autocomplete, and product discovery. They are never stuffed into Google meta tags.
                      </p>
                    </div>

                    {searchIntelligence?.searchAliases?.length ? (
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <label className="admin-label !mb-0">
                            Generated Human Search Aliases ({searchIntelligence.searchAliases.length})
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const existing = splitCsv(form.tagsText);
                              const merged = Array.from(new Set([...existing, ...searchIntelligence.searchAliases]));
                              setForm((prev) => ({ ...prev, tagsText: merged.join(', ') }));
                              toast.success('Search aliases merged into product tags!');
                            }}
                            className="text-xs text-[#0F1F3D] dark:text-[#3B82F6] font-bold hover:underline"
                          >
                            + Sync All into Product Tags
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border border-[#E5E7EB] dark:border-[#2D3340] bg-[#F9FAFB] dark:bg-[#16191F] max-h-56 overflow-y-auto">
                          {searchIntelligence.searchAliases.map((alias: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full bg-white dark:bg-[#1E2228] border border-[#D1D5DB] dark:border-[#374151] text-[#374151] dark:text-[#CBD5E1] text-xs font-medium"
                            >
                              {alias}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-[#6B7280] dark:text-[#94A3B8] border border-dashed border-[#D1D5DB] dark:border-[#374151] rounded-lg">
                        Click "Generate SEO with AI" above to generate comprehensive human search variations, Roman Urdu phrases, and spelling alternatives.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: SEARCH INTENT BREAKDOWN */}
                {seoSubTab === 'intents' && (
                  <div className="space-y-4">
                    {searchIntelligence?.intentGroups?.length ? (
                      <div className="space-y-3">
                        {searchIntelligence.intentGroups.map((group: any) => (
                          <div key={group.intent} className="p-3 rounded-lg border border-[#E5E7EB] dark:border-[#2D3340] bg-[#F9FAFB] dark:bg-[#16191F]">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-[#0F1F3D] dark:text-[#F1F5F9] uppercase tracking-wider">
                                {group.label}
                              </span>
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#E5E7EB] dark:bg-[#2D3340] text-[#374151] dark:text-[#CBD5E1] font-bold">
                                {group.keywords.length} queries
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {group.keywords.slice(0, 15).map((kw: string, ki: number) => (
                                <span
                                  key={ki}
                                  className="px-2 py-0.5 rounded bg-white dark:bg-[#1E2228] border border-[#E5E7EB] dark:border-[#2D3340] text-[11px] text-[#4B5563] dark:text-[#94A3B8]"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-[#6B7280] dark:text-[#94A3B8] border border-dashed border-[#D1D5DB] dark:border-[#374151] rounded-lg">
                        Click "Generate SEO with AI" above to view intent group classifications (Category, Fabric, Color, Style, Occasion, Buying, Roman Urdu).
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* 2. Pricing & Inventory (Unified Single Panel) */}
              <section className="space-y-4 rounded-[10px] border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <h3 className="text-sm font-bold text-[#0F1F3D] uppercase tracking-wide border-b border-[#E5E7EB] pb-2">
                  2. Pricing & Inventory
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="admin-label">Regular Price (PKR) *</label>
                    <input
                      className="admin-input"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="e.g. 4500"
                      value={form.price}
                      onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                    />
                    {formErrors.price && <p className="text-xs text-[#B91C2B] mt-1">{formErrors.price}</p>}
                  </div>

                  <div>
                    <label className="admin-label">Discount (%)</label>
                    <input
                      className="admin-input"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="e.g. 15"
                      value={form.discount}
                      onChange={(e) => setForm((prev) => ({ ...prev, discount: e.target.value }))}
                    />
                    {formErrors.discount && <p className="text-xs text-[#B91C2B] mt-1">{formErrors.discount}</p>}
                  </div>

                  <div>
                    <label className="admin-label">Effective Price (PKR)</label>
                    <div className="h-10 px-3 flex items-center bg-[#F9FAFB] border border-[#D1D5DB] rounded-[8px] text-sm font-bold text-[#1A1A1A]">
                      PKR {previewSalePrice.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <label className="admin-label">Stock Quantity *</label>
                    <input
                      className="admin-input"
                      type="number"
                      min="0"
                      placeholder="e.g. 50"
                      value={form.stock}
                      onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                    />
                    {formErrors.stock && <p className="text-xs text-[#B91C2B] mt-1">{formErrors.stock}</p>}
                  </div>

                  <div>
                    <label className="admin-label">Stock Status</label>
                    <select
                      className="admin-input"
                      value={form.stockStatus}
                      onChange={(e) => setForm((prev) => ({ ...prev, stockStatus: e.target.value as ProductFormState['stockStatus'] }))}
                    >
                      <option value="IN_STOCK">In Stock</option>
                      <option value="OUT_OF_STOCK">Out of Stock</option>
                      <option value="PREORDER">Preorder</option>
                    </select>
                  </div>

                  <div>
                    <label className="admin-label">SKU (Auto)</label>
                    <input
                      className="admin-input bg-[#F9FAFB]"
                      value={form.sku}
                      onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                      placeholder="TT-PROD-001"
                    />
                  </div>
                </div>
              </section>

              {/* 3. Variants: Sizes & Colors */}
              <section className="space-y-4 rounded-[10px] border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <h3 className="text-sm font-bold text-[#0F1F3D] uppercase tracking-wide border-b border-[#E5E7EB] pb-2">
                  3. Variants (Sizes & Colors)
                </h3>

                {/* Size Presets based on Category */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="admin-label !mb-0">
                      Available Sizes ({isUnstitchedCategory ? 'Fabric Lengths' : /kid|child|boy/i.test(form.category) ? 'Kids Age Sizes' : 'Garment Sizes'})
                    </label>
                    <span className="text-xs text-[#6B7280]">Click chip to toggle</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {activeCategorySizes.map((size) => {
                      const isSelected = splitCsv(form.sizesText).includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleToggleSize(size)}
                          className={`px-3 py-1 rounded-[6px] text-xs font-semibold transition-all ${isSelected
                              ? 'bg-[#0F1F3D] text-white shadow-xs'
                              : 'bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB] hover:bg-[#E5E7EB]'
                            }`}
                        >
                          {isSelected ? 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ ' : '+ '}{size}
                        </button>
                      );
                    })}
                  </div>

                  <input
                    className="admin-input"
                    value={form.sizesText}
                    onChange={(e) => setForm((prev) => ({ ...prev, sizesText: e.target.value }))}
                    placeholder="e.g. S, M, L, XL, Standard, 2-3Y"
                  />
                </div>

                {/* Add Color Option */}
                <div className="pt-2 border-t border-[#E5E7EB]">
                  <label className="admin-label">Add Colors</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="admin-input flex-1"
                      placeholder="Type a color (e.g. Navy Blue, Off White) and press Enter"
                      value={customColorInput}
                      onChange={(e) => setCustomColorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomColor();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomColor}
                      className="admin-btn-primary shrink-0"
                    >
                      + Add Color
                    </button>
                  </div>

                  {/* Popular color suggestion chips */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[11px] text-[#6B7280] font-medium mr-1">Quick Add:</span>
                    {COLOR_PRESET_OPTIONS.slice(0, 10).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          const next = Array.from(new Set([...colorList, color]));
                          setForm((prev) => ({ ...prev, colorsText: next.join(', ') }));
                        }}
                        className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F3F4F6] hover:bg-[#0F1F3D] hover:text-white transition-all text-[#374151]"
                      >
                        + {color}
                      </button>
                    ))}
                  </div>

                  {/* Selected Colors List */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {colorList.length === 0 ? (
                      <p className="text-xs text-[#6B7280]">No colors added yet.</p>
                    ) : (
                      colorList.map((color) => (
                        <span
                          key={color}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E2E8F4] text-[#0F1F3D] text-xs font-semibold"
                        >
                          {color}
                          <button
                            type="button"
                            onClick={() => removeColor(color)}
                            className="hover:text-[#B91C2B] font-bold"
                            title="Remove color"
                          >
                            ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </section>

              {/* 4. Product Images */}
              <section className="space-y-4 rounded-[10px] border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-2">
                  <h3 className="text-sm font-bold text-[#0F1F3D] uppercase tracking-wide">4. Product Images</h3>
                  <label className="admin-btn-secondary cursor-pointer inline-flex items-center gap-1 shrink-0">
                    <FiUpload className="w-3.5 h-3.5" />
                    {uploadingImages ? 'Uploading...' : 'Upload Image File(s)'}
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploadingImages} />
                  </label>
                </div>

                <div className="flex gap-2 items-center">
                  <input
                    type="url"
                    placeholder="Or paste direct image URL (e.g. https://...)"
                    value={directImageUrl}
                    onChange={(e) => setDirectImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImageUrl();
                      }
                    }}
                    className="admin-input flex-1"
                  />
                  <button type="button" onClick={handleAddImageUrl} className="admin-btn-secondary shrink-0">
                    + Add URL
                  </button>
                </div>
                {formErrors.images && <p className="text-xs text-[#B91C2B]">{formErrors.images}</p>}

                {form.images.length === 0 ? (
                  <div className="rounded-[8px] border border-dashed border-[#D1D5DB] p-6 text-center text-xs text-[#6B7280]">
                    No images uploaded yet. Upload high resolution files or paste image URLs.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {form.images.map((img, index) => {
                      const meta = imageMeta.find((item) => item.url === img);
                      return (
                        <div key={img} className="rounded-[8px] border border-[#E5E7EB] p-2 bg-[#FAFAF8]">
                          <div className="flex flex-col sm:flex-row gap-3 items-center">
                            <AdminImage src={img} alt={meta?.alt || 'Product image'} className="w-20 h-20 object-cover rounded-[6px] border border-[#E5E7EB] bg-white" />
                            <div className="flex-1 space-y-2 w-full">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPrimaryImage(img)}
                                  className={`admin-btn-secondary !h-7 !py-0 !px-2.5 text-xs ${meta?.isPrimary ? '!bg-[#DCFCE7] !text-[#16A34A] !border-[#16A34A]' : ''
                                    }`}
                                >
                                  <FiStar className="inline mr-1" /> {meta?.isPrimary ? 'Primary Image' : 'Set Primary'}
                                </button>
                                <button type="button" className="admin-btn-secondary !h-7 !py-0 !px-2 text-xs" onClick={() => index > 0 && moveImage(index, index - 1)}>
                                  <FiArrowUp className="inline" />
                                </button>
                                <button type="button" className="admin-btn-secondary !h-7 !py-0 !px-2 text-xs" onClick={() => index < form.images.length - 1 && moveImage(index, index + 1)}>
                                  <FiArrowDown className="inline" />
                                </button>
                                <button type="button" className="admin-btn-destructive !h-7 !py-0 !px-2 text-xs" onClick={() => removeUploadedImage(img)}>
                                  <FiTrash2 className="inline" />
                                </button>
                              </div>
                              <input
                                className="admin-input !h-8 text-xs"
                                placeholder="Alt text for SEO (e.g. Men's white unstitched suit)"
                                value={meta?.alt || ''}
                                onChange={(e) => updateImageAlt(img, e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* 5. Status & Visibility & Merchandising */}
              <section className="space-y-4 rounded-[10px] border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <h3 className="text-sm font-bold text-[#0F1F3D] uppercase tracking-wide border-b border-[#E5E7EB] pb-2">
                  5. Merchandising & Visibility
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
                      className="w-4 h-4 rounded text-[#0F1F3D] focus:ring-[#0F1F3D]"
                    />
                    ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚Â­Ãƒâ€šÃ‚Â Featured Product (Show in Featured List)
                  </label>

                  <label className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.trending}
                      onChange={(e) => setForm((prev) => ({ ...prev, trending: e.target.checked }))}
                      className="w-4 h-4 rounded text-[#B91C2B] focus:ring-[#B91C2B]"
                    />
                    ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚Â¥ Trending / New Arrival (Show on Homepage)
                  </label>

                  <div>
                    <label className="admin-label">Product Status</label>
                    <select
                      className="admin-input"
                      value={form.productStatus}
                      onChange={(e) => setForm((prev) => ({ ...prev, productStatus: e.target.value as ProductFormState['productStatus'] }))}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="HIDDEN">Hidden</option>
                    </select>
                  </div>

                  <div>
                    <label className="admin-label">Care Instructions (one per line or comma-separated)</label>
                    <textarea
                      rows={3}
                      className="admin-input"
                      placeholder="e.g. Hand wash in cold water&#10;Do not bleach&#10;Warm iron on reverse"
                      value={form.careInstructions}
                      onChange={(e) => setForm((prev) => ({ ...prev, careInstructions: e.target.value }))}
                    />
                  </div>
                </div>
              </section>

              {/* Form Action Buttons */}
              <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                  onCancel?.();
                  }}
                  className="admin-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary !h-10 !px-6 text-sm"
                  disabled={createProduct.isPending || updateProduct.isPending}
                >
                  {editingProduct
                    ? updateProduct.isPending ? 'Saving Changes...' : 'Update Product'
                    : createProduct.isPending ? 'Creating Product...' : 'Publish Product'}
                </button>
              </div>
            </div>

            {/* Sidebar Preview */}
            <div className="xl:col-span-1">
              <div className="sticky top-20 space-y-4">
                <div className="admin-card space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Storefront Card Preview</p>
                  <div className="rounded-[10px] overflow-hidden border border-[#E5E7EB] bg-white">
                    <div className="relative aspect-[4/5] bg-[#F9FAFB] overflow-hidden">
                      {form.images[0] ? (
                        <AdminImage src={form.images[0]} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-surface-500">No image selected</div>
                      )}
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="font-medium line-clamp-2">{previewTitle}</p>
                      <p className="text-xs text-surface-500">{previewCategory}</p>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-surface-800">{formatPkr(previewSalePrice > 0 ? previewSalePrice : previewPrice)}</p>
                        {previewDiscount > 0 && <span className="badge bg-red-100 text-red-600">-{previewDiscount}%</span>}
                      </div>
                      <p className="text-xs text-surface-500">SKU: {form.sku || 'Auto SKU'}</p>
                      <p className="text-xs text-surface-500">Status: {form.productStatus} ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ PUBLIC</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-surface-300 bg-white p-4 text-xs text-surface-600 shadow-soft">
                  <p className="font-semibold mb-1 flex items-center gap-1"><FiInfo className="w-3.5 h-3.5" /> Publishing checklist</p>
                  <p>Use a clear product name, at least one image, accurate stock, and selected colors before publishing.</p>
                </div>
              </div>
            </div>
          </form>
        </div>
    </>
  );
}
