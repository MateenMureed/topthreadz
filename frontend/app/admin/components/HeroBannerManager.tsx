'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { compressImageFile, resolveImageUrl } from './types';
import { FiImage, FiUpload, FiTrash2, FiSave, FiEye, FiType } from 'react-icons/fi';

export default function HeroBannerManager() {
  const [currentBanner, setCurrentBanner] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [bannerText, setBannerText] = useState({
    heading: 'Shop Our Newest Collection',
    subheading: 'PREMIUM WASH & WEAR • SHOP OUR COLLECTION',
    buttonText: 'Shop Now',
    buttonLink: '/products'
  });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      api.get('/settings/hero-banner'),
      api.get('/settings/hero-banner-text')
    ])
      .then(([bannerRes, textRes]) => {
        const bannerData = bannerRes.data?.data;
        if (bannerData?.url) setCurrentBanner(bannerData.url);

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

  const handleUpload = async () => {
    let file = fileRef.current?.files?.[0];
    const url = directUrl.trim();

    if (!file && !url) {
      toast.error('Please select an image file or enter an image URL');
      return;
    }

    setUploading(true);
    try {
      if (file) {
        file = await compressImageFile(file, 1920, 1080, 0.85);
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
        if (typeof window !== 'undefined') {
          localStorage.setItem('topthreadz_hero_banner', bannerUrl);
        }
        toast.success('Hero banner updated successfully!');
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('topthreadz_hero_banner');
    }
    setCurrentBanner('');
    setDirectUrl('');
    toast.success('Hero banner removed');
  };

  const handleSaveText = async () => {
    try {
      await api.post('/settings/hero-banner-text', bannerText);
      toast.success('Banner text updated successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update banner text');
    }
  };

  const renderBannerPreview = () => {
    if (!currentBanner) return null;

    return (
      <div className="rounded-2xl border border-surface-200/80 bg-surface-50/50 p-4 shadow-subtle">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FiEye className="w-4 h-4 text-accent-500" />
            <p className="text-xs font-semibold text-surface-800 tracking-tight">Active Hero Live Preview</p>
          </div>
          <span className="text-[11px] font-medium text-surface-500 bg-surface-200/60 px-2 py-0.5 rounded-full">
            1920 × 800 (Auto-fitting)
          </span>
        </div>

        <div className="relative w-full overflow-hidden rounded-xl border border-surface-300/80 bg-black min-h-[220px] sm:min-h-[280px] md:min-h-[340px] lg:min-h-[380px] max-h-[50vh] shadow-inner">
          <img
            src={resolveImageUrl(currentBanner)}
            alt="Hero Banner Preview"
            className="absolute inset-0 h-full w-full object-cover object-center"
            onError={(e) => {
              console.error('Banner image failed to load:', currentBanner);
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = 'absolute inset-0 flex items-center justify-center text-white text-xs';
                fallback.textContent = '⚠️ Image failed to load. Please check the URL or upload a new image.';
                parent.appendChild(fallback);
              }
            }}
          />

          <div className="absolute inset-0 flex flex-col items-start justify-center px-6 sm:px-10 md:px-14 pointer-events-none">
            <div className="pointer-events-auto max-w-xl">
              <span className="inline-block text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-white/90 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full mb-3 border border-white/10">
                {bannerText.subheading || 'NEWEST COLLECTION'}
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight drop-shadow-md">
                {bannerText.heading || 'Shop Our Newest Collection'}
              </h1>
              <button className="mt-4 sm:mt-5 px-5 sm:px-6 py-2 sm:py-2.5 bg-white text-[#0B1220] font-semibold text-xs sm:text-sm rounded-full shadow-lg hover:bg-surface-100 transition-all transform active:scale-95">
                {bannerText.buttonText || 'Shop Now'}
              </button>
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent pointer-events-none" />
        </div>

        <p className="text-[11px] text-surface-400 mt-2 text-center">
          Banner scales automatically across desktop, tablet, and mobile screens.
        </p>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-surface-200/80 bg-white p-5 sm:p-6 shadow-card space-y-6">
      {/* Banner Image Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center border border-accent-100/60 shadow-subtle">
              <FiImage className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-surface-900">Hero Media Asset</h3>
              <p className="text-xs text-surface-500">
                Upload a desktop-wide hero banner (Recommended: 1920 × 800 px).
              </p>
            </div>
          </div>
          {currentBanner && (
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 bg-red-50/50 hover:bg-red-50 text-xs font-semibold transition-all active:scale-[0.98]"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
              Remove Banner
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-surface-700 flex items-center gap-1.5">
              <FiUpload className="w-3.5 h-3.5 text-surface-400" />
              Upload Image File
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="admin-input-field w-full file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface-100 file:text-surface-700 cursor-pointer"
            />
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
            {uploading ? 'Compressing & Saving…' : 'Save Hero Banner'}
          </button>
        </div>
      </div>

      {/* Banner Text Overlay Settings */}
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

      {/* Banner Preview */}
      {renderBannerPreview()}
    </div>
  );
}
