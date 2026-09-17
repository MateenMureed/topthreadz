'use client';

/**
 * HomepagePage â€” /admin/homepage
 * Homepage visual editor: hero banner (desktop/mobile), banner text/CTA,
 * category showcase cards, collection section banners, and showcase cards.
 * Uploads go through /settings/homepage/upload and settings are saved via
 * PUT /settings/homepage.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { AdminImage } from '../components/AdminImage';
import { compressImageFile } from '../components/types';
import {
  FiHome,
  FiUpload,
  FiSave,
  FiImage,
  FiMonitor,
  FiSmartphone,
  FiGrid,
  FiLayers,
  FiEye,
  FiType,
  FiLink,
} from 'react-icons/fi';

interface HpCard {
  id: string;
  label: string;
  subtitle?: string;
  href?: string;
  imageUrl: string;
  badge?: string;
  title?: string;
  cta?: string;
}

interface HomepageSettings {
  heroBanner: {
    desktop: { url: string; publicId: string };
    mobile: { url: string; publicId: string };
    heading: string;
    subheading: string;
    buttonText: string;
    buttonLink: string;
  };
  categoryCards: HpCard[];
  collectionSections: HpCard[];
  showcaseCards: HpCard[];
}

const HP_FALLBACK: HomepageSettings = {
  heroBanner: {
    desktop: { url: '', publicId: '' },
    mobile: { url: '', publicId: '' },
    heading: 'Shop Our Newest Collection',
    subheading: 'PREMIUM WASH & WEAR • SHOP OUR COLLECTION',
    buttonText: 'Shop Now',
    buttonLink: '/products',
  },
  categoryCards: [
    {
      id: 'two-piece',
      label: 'TWO PIECE',
      subtitle: "Men's",
      href: '/products/category/two-piece',
      imageUrl: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788630568/ecommerce-products/qddnzjm16r9mljo8gihe.jpg',
    },
    {
      id: 'three-piece',
      label: 'THREE PIECE',
      subtitle: "Men's",
      href: '/products/category/three-piece',
      imageUrl: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788614812/ecommerce-products/krkdpdqc0a4mf437lzr1.jpg',
    },
    {
      id: 'wash-wear',
      label: 'WASH & WEAR',
      subtitle: "Men's",
      href: '/products/category/unstitched-fabric',
      imageUrl: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788890028/ecommerce-products/gpj4ravzcy5jdfewlhx9.jpg',
    },
    {
      id: 'stitched',
      label: 'SHALWAR KAMEEZ & KURTA',
      subtitle: "Men's Stitched",
      href: '/products/category/stitched',
      imageUrl: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788614550/ecommerce-products/miz32cpgjlvw0ejejplp.jpg',
    },
  ],
  collectionSections: [
    {
      id: 'unstitched-collection',
      label: 'UNSTITCHED FABRIC COLLECTION',
      href: '/products/category/unstitched-fabric',
      imageUrl: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788891170/ecommerce-products/eki2qssmwkiagxn9fx5y.jpg',
    },
    {
      id: 'stitched-collection',
      label: 'STITCHED KURTA COLLECTION',
      href: '/products/category/stitched',
      imageUrl: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788614550/ecommerce-products/miz32cpgjlvw0ejejplp.jpg',
    },
    {
      id: 'waistcoat-collection',
      label: 'WAISTCOAT & SUITS COLLECTION',
      href: '/products/category/waist-coats',
      imageUrl: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788614812/ecommerce-products/krkdpdqc0a4mf437lzr1.jpg',
    },
  ],
  showcaseCards: [
    {
      id: 'showcase-left',
      label: 'Showcase Left',
      badge: 'ROYAL HERITAGE',
      title: 'Luxury Boski & Formal Fabrics',
      cta: 'DISCOVER COLLECTION',
      href: '/products/category/unstitched-fabric',
      imageUrl: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788890028/ecommerce-products/gpj4ravzcy5jdfewlhx9.jpg',
    },
    {
      id: 'showcase-right',
      label: 'Showcase Right',
      badge: 'SIGNATURE WEAR',
      title: 'Summer Wash & Wear Edit',
      cta: 'EXPLORE STYLES',
      href: '/products/category/unstitched-fabric',
      imageUrl: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788630568/ecommerce-products/qddnzjm16r9mljo8gihe.jpg',
    },
  ],
};

type SectionKey = 'categoryCards' | 'collectionSections' | 'showcaseCards';

function SectionHeader({
  icon,
  title,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 pb-4 border-b border-surface-100">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-subtle ${accent}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-base font-bold text-surface-900">{title}</h3>
        <p className="text-xs text-surface-500">{hint}</p>
      </div>
    </div>
  );
}

function ImageSlot({
  label,
  recommended,
  aspectClass,
  currentUrl,
  uploading,
  onUpload,
  onApplyUrl,
  directUrl,
  onDirectUrlChange,
}: {
  label: string;
  recommended: string;
  aspectClass: string;
  currentUrl: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onApplyUrl: () => void;
  directUrl: string;
  onDirectUrlChange: (v: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-2xl border border-surface-200/80 bg-surface-50/50 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-surface-900">{label}</p>
        <span className="text-[11px] font-medium text-surface-500 bg-surface-200/60 px-2 py-0.5 rounded-full">
          {recommended}
        </span>
      </div>

      <div className={`relative w-full overflow-hidden rounded-xl border border-surface-300/80 ${aspectClass}`}>
        {currentUrl ? (
          <AdminImage src={currentUrl} alt={`${label} preview`} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-100 text-surface-400">
            <FiImage className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-widest mt-1">No image</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="admin-btn-primary cursor-pointer !py-2 !px-3 !text-xs inline-flex items-center justify-center gap-1.5">
          <FiUpload className="w-3.5 h-3.5" />
          {uploading ? 'Uploading…' : 'Upload Image'}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = '';
            }}
          />
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="Paste image URL…"
            value={directUrl}
            onChange={(e) => onDirectUrlChange(e.target.value)}
            className="admin-input-field w-full !text-xs"
          />
          <button
            type="button"
            onClick={onApplyUrl}
            className="admin-btn-secondary !py-2 !px-3 !text-xs shrink-0"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function CardTextFields({
  fields,
}: {
  fields: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }[];
}) {
  return (
    <div className="rounded-2xl border border-surface-200/80 bg-surface-50/50 p-4 space-y-3">
      <p className="text-xs font-bold text-surface-900 flex items-center gap-1.5">
        <FiType className="w-3.5 h-3.5 text-surface-500" /> Text &amp; Link
      </p>
      <div className="space-y-3">
        {fields.map((f) => (
          <div key={f.label} className="space-y-1">
            <label className="text-[11px] font-semibold text-surface-700 block">{f.label}</label>
            <input
              type="text"
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              placeholder={f.placeholder}
              className="admin-input-field w-full !text-xs"
            />
          </div>
        ))}
      </div>
      <p className="text-[10px] text-surface-400 flex items-center gap-1">
        <FiLink className="w-3 h-3" /> Links accept internal paths (e.g. /products/category/two-piece) or full URLs.
      </p>
    </div>
  );
}

export default function HomepagePage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<HomepageSettings>(HP_FALLBACK);
  const [directUrls, setDirectUrls] = useState<Record<string, string>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const { isLoading, data: hpData } = useQuery({
    queryKey: ['homepage', 'settings'],
    queryFn: async () => {
      try {
        const r = await api.get('/settings/homepage');
        return r.data?.data;
      } catch (err: any) {
        if (err?.response?.status === 404) {
          const r = await api.get('/admin/settings/homepage');
          return r.data?.data;
        }
        throw err;
      }
    },
    retry: false,
  });

  // Merge fetched data into local editable state once available
  const loadedRef = useRef(false);
  useEffect(() => {
    if (!hpData || loadedRef.current) return;
    loadedRef.current = true;
    setSettings({
      heroBanner: { ...HP_FALLBACK.heroBanner, ...(hpData.heroBanner || {}) },
      categoryCards: (hpData.categoryCards?.length ? hpData.categoryCards : HP_FALLBACK.categoryCards).map((c: any) => ({
        ...c, subtitle: c.subtitle || '', label: c.label || '', href: c.href || '',
      })),
      collectionSections: (hpData.collectionSections?.length ? hpData.collectionSections : HP_FALLBACK.collectionSections).map((c: any) => ({
        ...c, label: c.label || c.title || '', title: c.title || c.label || '', href: c.href || '',
      })),
      showcaseCards: (hpData.showcaseCards?.length ? hpData.showcaseCards : HP_FALLBACK.showcaseCards).map((c: any) => ({
        ...c, badge: c.badge || '', title: c.title || c.label || '', cta: c.cta || '', href: c.href || '',
      })),
    });
  }, [hpData]);

  const saveMutation = useMutation({
    mutationFn: async (payload: HomepageSettings) => {
      const body = {
        ...payload,
        collectionSections: payload.collectionSections.map((s) => ({
          ...s,
          title: s.label || s.title || '',
          label: s.label || s.title || '',
        })),
        showcaseCards: payload.showcaseCards.map((s) => ({
          ...s,
          title: s.title || s.label || '',
          label: s.title || s.label || '',
          badge: s.badge || '',
          cta: s.cta || '',
        })),
      };
      try {
        return await api.put('/settings/homepage', body);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          return await api.put('/admin/settings/homepage', body);
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage', 'settings'] });
      toast.success('Homepage published to the storefront.');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not save homepage settings.'),
  });

  const uploadImage = async (slotKey: string, file: File, onUploaded: (url: string) => void) => {
    setUploadingKey(slotKey);
    try {
      const compressed = await compressImageFile(file, 1920, 1920, 0.85);
      const formData = new FormData();
      formData.append('image', compressed);
      let res;
      try {
        res = await api.post('/settings/homepage/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch (err: any) {
        if (err?.response?.status === 404) {
          res = await api.post('/admin/settings/homepage/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          throw err;
        }
      }
      const url = res?.data?.data?.url || res?.data?.url;
      if (url) {
        onUploaded(url);
        toast.success('Image uploaded — click Save & Publish to go live.');
      } else {
        toast.error('Upload succeeded but no URL returned.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Image upload failed.');
    } finally {
      setUploadingKey(null);
    }
  };

  const applyDirectUrl = (slotKey: string, url: string, onApplied: (url: string) => void) => {
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error('Paste a valid image URL first.');
      return;
    }
    onApplied(trimmed);
    setDirectUrls((prev) => ({ ...prev, [slotKey]: '' }));
    toast.success('URL applied — click Save & Publish to go live.');
  };

  const updateHero = (key: 'desktop' | 'mobile') => (url: string) =>
    setSettings((prev) => ({ ...prev, heroBanner: { ...prev.heroBanner, [key]: { url, publicId: '' } } }));

  const updateHeroText = (key: 'heading' | 'subheading' | 'buttonText' | 'buttonLink') => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSettings((prev) => ({ ...prev, heroBanner: { ...prev.heroBanner, [key]: e.target.value } }));

  const updateCardImage = (section: SectionKey, id: string, url: string) =>
    setSettings((prev) => ({
      ...prev,
      [section]: (prev[section] as HpCard[]).map((c) => (c.id === id ? { ...c, imageUrl: url } : c)),
    }));

  const updateCardField = (
    section: SectionKey,
    id: string,
    field: 'label' | 'subtitle' | 'href' | 'badge' | 'title' | 'cta',
    value: string,
  ) =>
    setSettings((prev) => ({
      ...prev,
      [section]: (prev[section] as HpCard[]).map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, [field]: value };
        if (section === 'collectionSections' && field === 'label') {
          updated.title = value;
        }
        if (section === 'showcaseCards' && field === 'title') {
          updated.label = value;
        }
        return updated;
      }),
    }));

  if (isLoading && !loadedRef.current) {
    return (
      <div className="space-y-3">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="h-24 skeleton rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page intro */}
      <div className="apple-card p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/60 flex items-center justify-center shadow-subtle">
            <FiHome className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-surface-900">Homepage Visual Editor</h2>
            <p className="text-xs text-surface-500">
              Manage every image and text block rendered on the storefront homepage.
            </p>
          </div>
        </div>
        <button
          onClick={() => saveMutation.mutate(settings)}
          disabled={saveMutation.isPending}
          className="admin-btn-primary inline-flex items-center justify-center gap-2"
        >
          <FiSave className="w-4 h-4" />
          {saveMutation.isPending ? 'Publishing…' : 'Save & Publish'}
        </button>
      </div>

      {/* â”€â”€ HERO BANNER â”€â”€ */}
      <section className="apple-card p-5 space-y-5">
        <SectionHeader
          icon={<FiMonitor className="w-5 h-5" />}
          title="Hero Banner"
          hint="Full-width top banner â€” desktop (1920 × 700) + mobile (800 × 1000)"
          accent="bg-accent-50 text-accent-600 border-accent-100/60"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImageSlot
            label="Desktop Banner"
            recommended="1920 × 700 px"
            aspectClass="aspect-[1920/700]"
            currentUrl={settings.heroBanner.desktop.url}
            uploading={uploadingKey === 'hero-desktop'}
            onUpload={(file) => uploadImage('hero-desktop', file, updateHero('desktop'))}
            directUrl={directUrls['hero-desktop'] || ''}
            onDirectUrlChange={(v) => setDirectUrls((p) => ({ ...p, 'hero-desktop': v }))}
            onApplyUrl={() => applyDirectUrl('hero-desktop', directUrls['hero-desktop'] || '', updateHero('desktop'))}
          />
          <ImageSlot
            label="Mobile Banner"
            recommended="800 × 1000 px"
            aspectClass="aspect-[4/5]"
            currentUrl={settings.heroBanner.mobile.url}
            uploading={uploadingKey === 'hero-mobile'}
            onUpload={(file) => uploadImage('hero-mobile', file, updateHero('mobile'))}
            directUrl={directUrls['hero-mobile'] || ''}
            onDirectUrlChange={(v) => setDirectUrls((p) => ({ ...p, 'hero-mobile': v }))}
            onApplyUrl={() => applyDirectUrl('hero-mobile', directUrls['hero-mobile'] || '', updateHero('mobile'))}
          />
        </div>

        <div className="rounded-2xl border border-surface-200/80 bg-surface-50/50 p-4 space-y-3">
          <p className="text-xs font-bold text-surface-900">Banner Text & CTA</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([
              { key: 'heading', label: 'Headline', placeholder: 'Shop Our Newest Collection' },
              { key: 'subheading', label: 'Subheading', placeholder: 'PREMIUM WASH & WEAR • SHOP OUR COLLECTION' },
              { key: 'buttonText', label: 'Button Text', placeholder: 'Shop Now' },
              { key: 'buttonLink', label: 'Button Link', placeholder: '/products' },
            ] as const).map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-semibold text-surface-700 block">{label}</label>
                <input
                  type="text"
                  value={settings.heroBanner[key]}
                  onChange={updateHeroText(key)}
                  placeholder={placeholder}
                  className="admin-input-field w-full text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* â”€â”€ COLLECTION SECTIONS â”€â”€ */}
      <section className="apple-card p-5 space-y-5">
        <SectionHeader
          icon={<FiLayers className="w-5 h-5" />}
          title="Collection Section Banners"
          hint="3 portrait collection cards â€” 900 × 1200 px (3:4)"
          accent="bg-blue-50 text-blue-600 border-blue-100/60"
        />
        <div className="rounded-xl bg-blue-50 border border-blue-200/80 p-3 text-[11px] text-blue-700">
          📐 Recommended: 900 × 1200 px (3:4 portrait). Unstitched Fabric, Stitched Kurta, Waistcoats &amp; Suits.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {settings.collectionSections.map((section) => (
            <div key={section.id} className="space-y-3">
            <ImageSlot
              label={section.label || section.title || section.id}
              recommended="900 × 1200 px"
              aspectClass="aspect-[3/4]"
              currentUrl={section.imageUrl}
              uploading={uploadingKey === `col-${section.id}`}
              onUpload={(file) => uploadImage(`col-${section.id}`, file, (url) => updateCardImage('collectionSections', section.id, url))}
              directUrl={directUrls[`col-${section.id}`] || ''}
              onDirectUrlChange={(v) => setDirectUrls((p) => ({ ...p, [`col-${section.id}`]: v }))}
              onApplyUrl={() => applyDirectUrl(`col-${section.id}`, directUrls[`col-${section.id}`] || '', (url) => updateCardImage('collectionSections', section.id, url))}
            />
            <CardTextFields
              fields={[
                { label: 'Title (black banner bar on the card)', value: section.label || section.title || '', onChange: (v) => updateCardField('collectionSections', section.id, 'label', v), placeholder: 'UNSTITCHED FABRIC COLLECTION' },
                { label: 'Link (e.g. /products/category/unstitched-fabric)', value: section.href || '', onChange: (v) => updateCardField('collectionSections', section.id, 'href', v), placeholder: '/products/category/two-piece' },
              ]}
            />
            </div>
          ))}
        </div>
      </section>

      {/* â”€â”€ CATEGORY CARDS â”€â”€ */}
      <section className="apple-card p-5 space-y-5">
        <SectionHeader
          icon={<FiGrid className="w-5 h-5" />}
          title="Category Showcase Cards"
          hint="4 tall portrait cards â€” 900 × 1500 px (3:5)"
          accent="bg-amber-50 text-amber-600 border-amber-100/60"
        />
        <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-[11px] text-amber-700">
          📐 Recommended: 900 × 1500 px (3:5 portrait). Use upright portrait photos of models â€” avoid landscapes.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settings.categoryCards.map((card) => (
            <div key={card.id} className="space-y-3">
            <ImageSlot
              label={`${card.subtitle || ''} ${card.label}`.trim()}
              recommended="900 × 1500 px"
              aspectClass="aspect-[3/5]"
              currentUrl={card.imageUrl}
              uploading={uploadingKey === `cat-${card.id}`}
              onUpload={(file) => uploadImage(`cat-${card.id}`, file, (url) => updateCardImage('categoryCards', card.id, url))}
              directUrl={directUrls[`cat-${card.id}`] || ''}
              onDirectUrlChange={(v) => setDirectUrls((p) => ({ ...p, [`cat-${card.id}`]: v }))}
              onApplyUrl={() => applyDirectUrl(`cat-${card.id}`, directUrls[`cat-${card.id}`] || '', (url) => updateCardImage('categoryCards', card.id, url))}
            />
            <CardTextFields
              fields={[
                { label: "Small Text (e.g. Men's / Men's Stitched / Kids)", value: card.subtitle || '', onChange: (v) => updateCardField('categoryCards', card.id, 'subtitle', v), placeholder: "Men's" },
                { label: 'Title (e.g. TWO PIECE / KIDS)', value: card.label || '', onChange: (v) => updateCardField('categoryCards', card.id, 'label', v), placeholder: 'TWO PIECE' },
                { label: 'Link (e.g. /products/category/two-piece)', value: card.href || '', onChange: (v) => updateCardField('categoryCards', card.id, 'href', v), placeholder: '/products/category/three-piece' },
              ]}
            />
            </div>
          ))}
        </div>
      </section>

      {/* â”€â”€ SHOWCASE CARDS â”€â”€ */}
      <section className="apple-card p-5 space-y-5">
        <SectionHeader
          icon={<FiEye className="w-5 h-5" />}
          title="Showcase Cards"
          hint="2 wide landscape feature cards â€” 1200 × 900 px (4:3)"
          accent="bg-emerald-50 text-emerald-600 border-emerald-100/60"
        />
        <div className="rounded-xl bg-emerald-50 border border-emerald-200/80 p-3 text-[11px] text-emerald-700">
          📐 Recommended: 1200 × 900 px (4:3 landscape). Boski/Fabric left card, Wash &amp; Wear right card.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settings.showcaseCards.map((card) => (
            <div key={card.id} className="space-y-3">
            <ImageSlot
              label={`${card.badge || ''} â€” ${card.title || card.label}`.trim()}
              recommended="1200 × 900 px"
              aspectClass="aspect-[4/3]"
              currentUrl={card.imageUrl}
              uploading={uploadingKey === `show-${card.id}`}
              onUpload={(file) => uploadImage(`show-${card.id}`, file, (url) => updateCardImage('showcaseCards', card.id, url))}
              directUrl={directUrls[`show-${card.id}`] || ''}
              onDirectUrlChange={(v) => setDirectUrls((p) => ({ ...p, [`show-${card.id}`]: v }))}
              onApplyUrl={() => applyDirectUrl(`show-${card.id}`, directUrls[`show-${card.id}`] || '', (url) => updateCardImage('showcaseCards', card.id, url))}
            />
            <CardTextFields
              fields={[
                { label: 'Badge (small gold text, e.g. ROYAL HERITAGE)', value: card.badge || '', onChange: (v) => updateCardField('showcaseCards', card.id, 'badge', v), placeholder: 'ROYAL HERITAGE' },
                { label: 'Title (e.g. Luxury Boski & Formal Fabrics)', value: card.title || card.label || '', onChange: (v) => updateCardField('showcaseCards', card.id, 'title', v), placeholder: 'Luxury Boski & Formal Fabrics' },
                { label: 'Button Text (CTA, e.g. DISCOVER COLLECTION)', value: card.cta || '', onChange: (v) => updateCardField('showcaseCards', card.id, 'cta', v), placeholder: 'DISCOVER COLLECTION' },
                { label: 'Link (e.g. /products/category/unstitched-fabric)', value: card.href || '', onChange: (v) => updateCardField('showcaseCards', card.id, 'href', v), placeholder: '/products/category/unstitched-fabric' },
              ]}
            />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

