'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { compressImageFile, resolveImageUrl } from './types';
import { FiImage, FiUpload, FiTrash2, FiSave, FiEye, FiType, FiSmartphone, FiMonitor } from 'react-icons/fi';

export default function HeroBannerManager() {
  const [currentBanner, setCurrentBanner] = useState('');
  const [currentMobileBanner, setCurrentMobileBanner] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const [directMobileUrl, setDirectMobileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [bannerText, setBannerText] = useState({
    heading: 'Shop Our Newest Collection',
    subheading: 'PREMIUM WASH & WEAR • SHOP OUR COLLECTION',
    buttonText: 'Shop Now',
    buttonLink: '/products'
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const mobileFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      api.get('/settings/hero-banner'),
      api.get('/settings/hero-banner-mobile').catch(() => ({ data: { data: null } })),
      api.get('/settings/hero-banner-text'),
    ])
      .then(([bannerRes, mobileBannerRes, textRes]) => {
        const bannerData = bannerRes.data?.data;
        if (bannerData?.url) setCurrentBanner(bannerData.url);

        const mobileBannerData = mobileBannerRes.data?.data;
        if (mobileBannerData?.url) setCurrentMobileBanner(mobileBannerData.url);

        const textData = textRes.data?.data;
        if (textData) {
          setBannerText({
            heading: textData.heading || 'Shop Our Newest Collection',
            subheading: textData.subheading || 'PREMIUM WASH & WEAR • SHOP OUR COLLECTION',
            buttonText: textData.buttonText || 'Shop Now',
            buttonLink: textData.buttonLink || '/products'
          });
        }
      })
      .catch(() => { /* ignore */ });
  }, []);

  // ── Desktop banner upload ─────────────────────────────────────────────
  const handleUpload = async () => {
    let file = fileRef.current?.files?.[0];
    const url = directUrl.trim();

    if (!file && !url) {
      toast.error('Please select a desktop image file or enter an image URL');
      return;
    }

    setUploading(true);
    try {
      if (file) {
        file = await compressImageFile(file, 1920, 700, 0.85);
      }
      const formData = new FormData();
      if (file) formData.append('image', file);
      if (url) formData.append('url', url);

      let bannerUrl = '';

      try {
        const res = await api.post('/settings/hero-banner', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        bannerUrl = res.data?.data?.url || '';
      } catch (apiErr: any) {
        if (url) {
          bannerUrl = url;
        } else {
          throw apiErr;
        }
      }

      if (bannerUrl) {
        setCurrentBanner(bannerUrl);
        setDirectUrl('');
        toast.success('Desktop hero banner updated successfully!');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update hero banner');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleClear = async () => {
    try {
      await api.delete('/settings/hero-banner');
    } catch { /* ignore */ }
    setCurrentBanner('');
    setDirectUrl('');
    toast.success('Desktop hero banner removed');
  };

  // ── Mobile banner upload ──────────────────────────────────────────────
  const handleUploadMobile = async () => {
    let file = mobileFileRef.current?.files?.[0];
    const url = directMobileUrl.trim();

    if (!file && !url) {
      toast.error('Please select a mobile image file or enter an image URL');
      return;
    }

    setUploadingMobile(true);
    try {
      if (file) {
        // Mobile banner: portrait 1080×1350
        file = await compressImageFile(file, 1080, 1350, 0.85);
      }
      const formData = new FormData();
      if (file) formData.append('image', file);
      if (url) formData.append('url', url);

      let bannerUrl = '';

      try {
        const res = await api.post('/settings/hero-banner-mobile', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        bannerUrl = res.data?.data?.url || '';
      } catch (apiErr: any) {
        if (url) {
          bannerUrl = url;
        } else {
          throw apiErr;
        }
      }

      if (bannerUrl) {
        setCurrentMobileBanner(bannerUrl);
        setDirectMobileUrl('');
        toast.success('Mobile hero banner updated successfully!');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update mobile hero banner');
    } finally {
      setUploadingMobile(false);
      if (mobileFileRef.current) mobileFileRef.current.value = '';
    }
  };

  const handleClearMobile = async () => {
    try {
      await api.delete('/settings/hero-banner-mobile');
    } catch { /* ignore */ }
    setCurrentMobileBanner('');
    setDirectMobileUrl('');
    toast.success('Mobile hero banner removed');
  };

  // ── Banner text save ──────────────────────────────────────────────────
  const handleSaveText = async () => {
    try {
      await api.post('/settings/hero-banner-text', bannerText);
      toast.success('Banner text updated successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update banner text');
    }
  };

  // ── Preview ───────────────────────────────────────────────────────────
  const renderBannerPreview = () => {
    if (!currentBanner && !currentMobileBanner) return null;

    return (
      <div className="space-y-4">
        {/* Desktop preview */}
        {currentBanner && (
          <div className="rounded-2xl border border-surface-200/80 bg-surface-50/50 p-4 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FiMonitor className="w-4 h-4 text-accent-500" />
                <p className="text-xs font-semibold text-surface-800 tracking-tight">Desktop Banner Preview</p>
              </div>
              <span className="text-[11px] font-medium text-surface-500 bg-surface-200/60 px-2 py-0.5 rounded-full">
                1920 × 700
              </span>
            </div>
            <div className="relative w-full overflow-hidden rounded-xl border border-surface-300/80 bg-black" style={{ aspectRatio: '1920/700' }}>
              <img
                src={resolveImageUrl(currentBanner)}
                alt="Desktop Hero Banner Preview"
                className="absolute inset-0 h-full w-full object-cover object-center"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent pointer-events-none" />
            </div>
          </div>
        )}

        {/* Mobile preview */}
        {(currentMobileBanner || currentBanner) && (
          <div className="rounded-2xl border border-surface-200/80 bg-surface-50/50 p-4 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FiSmartphone className="w-4 h-4 text-emerald-500" />
                <p className="text-xs font-semibold text-surface-800 tracking-tight">
                  Mobile Banner Preview
                  {!currentMobileBanner && (
                    <span className="ml-2 text-surface-400 font-normal">(using desktop fallback)</span>
                  )}
                </p>
              </div>
              <span className="text-[11px] font-medium text-surface-500 bg-surface-200/60 px-2 py-0.5 rounded-full">
                1080 × 1350
              </span>
            </div>
            <div className="flex justify-center">
              <div
                className="relative overflow-hidden rounded-xl border border-surface-300/80 bg-black w-32 sm:w-40"
                style={{ aspectRatio: '1080/1350' }}
              >
                <img
                  src={resolveImageUrl(currentMobileBanner || currentBanner)}
                  alt="Mobile Hero Banner Preview"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
            {!currentMobileBanner && (
              <p className="text-[11px] text-amber-600 mt-2 text-center">
                ⚠️ No mobile banner set — desktop image will be used on phones. Upload a 1080×1350 portrait image for best results.
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-surface-200/80 bg-white p-5 sm:p-6 shadow-card space-y-6">

      {/* ── Desktop Banner ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center border border-accent-100/60 shadow-subtle">
              <FiMonitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-surface-900">Desktop Banner</h3>
              <p className="text-xs text-surface-500">
                Recommended: <span className="font-semibold text-surface-700">1920 × 700 px</span> (landscape). Shown on tablets &amp; desktops.
              </p>
            </div>
          </div>
          {currentBanner && (
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 bg-red-50/50 hover:bg-red-50 text-xs font-semibold transition-all active:scale-[0.98]"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-surface-700 flex items-center gap-1.5">
              <FiUpload className="w-3.5 h-3.5 text-surface-400" />
              Upload Desktop Image
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="admin-input-field w-full file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface-100 file:text-surface-700 cursor-pointer"
            />
            <p className="text-[11px] text-surface-400">Best: 1920×700 px, JPEG/WebP, under 2 MB</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-surface-700 flex items-center gap-1.5">
              <FiImage className="w-3.5 h-3.5 text-surface-400" />
              Or Direct Image URL
            </label>
            <input
              type="url"
              placeholder="Paste direct URL (e.g. https://...)"
              value={directUrl}
              onChange={(e) => setDirectUrl(e.target.value)}
              className="admin-input-field w-full text-xs"
            />
          </div>
        </div>

        <div className="flex justify-stretch sm:justify-end mt-4">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="admin-btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2"
          >
            <FiSave className="w-4 h-4" />
            {uploading ? 'Compressing & Saving…' : 'Save Desktop Banner'}
          </button>
        </div>
      </div>

      {/* ── Mobile Banner ── */}
      <div className="border-t border-surface-100 pt-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/60 shadow-subtle">
              <FiSmartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-surface-900">Mobile Banner</h3>
              <p className="text-xs text-surface-500">
                Recommended: <span className="font-semibold text-surface-700">1080 × 1350 px</span> (portrait). Shown on smartphones only.
              </p>
            </div>
          </div>
          {currentMobileBanner && (
            <button
              onClick={handleClearMobile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 bg-red-50/50 hover:bg-red-50 text-xs font-semibold transition-all active:scale-[0.98]"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </div>

        {!currentMobileBanner && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-700">
            <span className="text-base leading-none mt-0.5">⚠️</span>
            <span>No mobile banner uploaded. The <strong>desktop image</strong> will display on phones as a fallback. Upload a portrait image for the best mobile experience.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-surface-700 flex items-center gap-1.5">
              <FiUpload className="w-3.5 h-3.5 text-surface-400" />
              Upload Mobile Image
            </label>
            <input
              ref={mobileFileRef}
              type="file"
              accept="image/*"
              className="admin-input-field w-full file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface-100 file:text-surface-700 cursor-pointer"
            />
            <p className="text-[11px] text-surface-400">Best: 1080×1350 px portrait, JPEG/WebP, under 2 MB</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-surface-700 flex items-center gap-1.5">
              <FiImage className="w-3.5 h-3.5 text-surface-400" />
              Or Direct Image URL
            </label>
            <input
              type="url"
              placeholder="Paste direct URL (e.g. https://...)"
              value={directMobileUrl}
              onChange={(e) => setDirectMobileUrl(e.target.value)}
              className="admin-input-field w-full text-xs"
            />
          </div>
        </div>

        <div className="flex justify-stretch sm:justify-end mt-4">
          <button
            onClick={handleUploadMobile}
            disabled={uploadingMobile}
            className="admin-btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 !bg-emerald-700 hover:!bg-emerald-800"
          >
            <FiSmartphone className="w-4 h-4" />
            {uploadingMobile ? 'Compressing & Saving…' : 'Save Mobile Banner'}
          </button>
        </div>
      </div>

      {/* ── Banner Text Overlay ── */}
      <div className="border-t border-surface-100 pt-5">
        <div className="flex items-center gap-2 mb-1">
          <FiType className="w-4 h-4 text-surface-500" />
          <h4 className="text-sm font-bold text-surface-900">Banner Typography Overlay</h4>
        </div>
        <p className="text-xs text-surface-500 mb-4">
          Customize the headline copy, eyebrow badge, and primary CTA button on the hero banner.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-700 block">Headline</label>
            <input
              type="text"
              value={bannerText.heading}
              onChange={(e) => setBannerText(prev => ({ ...prev, heading: e.target.value }))}
              placeholder="e.g. Shop Our Newest Collection"
              className="admin-input-field w-full text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-700 block">Eyebrow / Subheading</label>
            <input
              type="text"
              value={bannerText.subheading}
              onChange={(e) => setBannerText(prev => ({ ...prev, subheading: e.target.value }))}
              placeholder="e.g. PREMIUM WASH & WEAR"
              className="admin-input-field w-full text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-700 block">Button CTA Text</label>
            <input
              type="text"
              value={bannerText.buttonText}
              onChange={(e) => setBannerText(prev => ({ ...prev, buttonText: e.target.value }))}
              placeholder="e.g. Shop Now"
              className="admin-input-field w-full text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-700 block">Button Destination Link</label>
            <input
              type="text"
              value={bannerText.buttonLink}
              onChange={(e) => setBannerText(prev => ({ ...prev, buttonLink: e.target.value }))}
              placeholder="e.g. /products"
              className="admin-input-field w-full text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={handleSaveText}
            className="admin-btn-secondary inline-flex items-center gap-1.5 text-xs font-semibold"
          >
            <FiSave className="w-3.5 h-3.5 text-surface-500" />
            Save Text Settings
          </button>
        </div>
      </div>

      {/* ── Preview ── */}
      {(currentBanner || currentMobileBanner) && (
        <div className="border-t border-surface-100 pt-5">
          <div className="flex items-center gap-2 mb-4">
            <FiEye className="w-4 h-4 text-accent-500" />
            <h4 className="text-sm font-bold text-surface-900">Live Preview</h4>
          </div>
          {renderBannerPreview()}
        </div>
      )}
    </div>
  );
}
