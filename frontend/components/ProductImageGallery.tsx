'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { FiMaximize2, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { isBackendUploadUrl, resolveImageUrl } from '@/lib/images';

interface ProductImageGalleryProps {
  images: string[];
  name: string;
  category?: string;
}

// Fabric gradient fallbacks (only used when no real images)
const fabricGradients: Record<string, string> = {
  charcoal: 'from-stone-300 to-stone-400',
  white: 'from-stone-50 to-blue-50',
  navy: 'from-blue-100 to-indigo-200',
  blue: 'from-sky-100 to-blue-200',
  gold: 'from-amber-100 to-yellow-200',
  olive: 'from-green-100 to-emerald-200',
  black: 'from-stone-400 to-stone-500',
  beige: 'from-amber-50 to-orange-50',
  burgundy: 'from-rose-200 to-rose-300',
  ivory: 'from-amber-50 to-yellow-50',
  indigo: 'from-indigo-200 to-blue-300',
  teal: 'from-teal-100 to-cyan-200',
  rust: 'from-orange-200 to-amber-200',
  sage: 'from-green-50 to-emerald-100',
  satin: 'from-violet-100 to-purple-200',
  grey: 'from-stone-200 to-stone-300',
  cream: 'from-amber-50 to-stone-50',
  brown: 'from-orange-100 to-amber-200',
  silk: 'from-amber-50 to-rose-50',
  wool: 'from-green-100 to-emerald-200',
  denim: 'from-blue-200 to-indigo-300',
  linen: 'from-amber-100 to-stone-200',
};

function getGradient(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(fabricGradients)) {
    if (lower.includes(key)) return val;
  }
  return 'from-surface-100 to-surface-200';
}

function normalizeImageSrc(src: string): string {
  return resolveImageUrl(src);
}

export default function ProductImageGallery({ images, name, category }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const gradient = getGradient(name);
  const hasRealImages = images && images.length > 0;

  // Refs for inline zoom tracking
  const imgRef = useRef<HTMLImageElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);

  // Touch swipe for mobile gallery
  const touchStartX = useRef(0);
  const [touchDelta, setTouchDelta] = useState(0);
  const totalViews = hasRealImages ? images.length : 4;

  // Trigger blur-up on image change
  useEffect(() => {
    setImageLoaded(false);
    const timer = setTimeout(() => setImageLoaded(true), 60);
    return () => clearTimeout(timer);
  }, [activeIndex]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') setActiveIndex(prev => Math.min(prev + 1, totalViews - 1));
      if (e.key === 'ArrowLeft') setActiveIndex(prev => Math.max(prev - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, totalViews]);

  // Inline Zoom Mouse Move Tracking
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // We only zoom on desktop (mouse presence implies hover capability generally)
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
    if (imgRef.current) {
      imgRef.current.style.transformOrigin = '50% 50%';
    }
    if (placeholderRef.current) {
      placeholderRef.current.style.transformOrigin = '50% 50%';
    }
  }, []);

  // Mobile swipe handlers
  const handleSwipeTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setTouchDelta(0);
  };

  const handleSwipeTouchMove = (e: React.TouchEvent) => {
    setTouchDelta(e.touches[0].clientX - touchStartX.current);
  };

  const handleSwipeTouchEnd = () => {
    if (Math.abs(touchDelta) > 50) {
      if (touchDelta < 0 && activeIndex < totalViews - 1) setActiveIndex(activeIndex + 1);
      else if (touchDelta > 0 && activeIndex > 0) setActiveIndex(activeIndex - 1);
    }
    setTouchDelta(0);
  };

  // Current image URL
  const currentImageUrl = hasRealImages ? normalizeImageSrc(images[activeIndex]) : '';

  return (
    <div className="space-y-4">
      {/* ============================================================
          MAIN IMAGE — Simple Inline Zoom Container
          ============================================================ */}
      <div
        className="relative aspect-[4/5] md:aspect-square md:rounded-2xl overflow-hidden group bg-white md:border border-surface-200/60 select-none cursor-zoom-in"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleSwipeTouchStart}
        onTouchMove={handleSwipeTouchMove}
        onTouchEnd={handleSwipeTouchEnd}
      >
        {/* ====== REAL IMAGE ====== */}
        {hasRealImages ? (
          <Image
            ref={imgRef}
            key={`img-${activeIndex}`}
            src={currentImageUrl}
            alt={`${name} - View ${activeIndex + 1}`}
            fill
            unoptimized={isBackendUploadUrl(currentImageUrl)}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="absolute inset-0 w-full h-full object-contain object-center transition-transform duration-[600ms] ease-out will-change-transform group-hover:scale-[1.75]"
            style={{
              transformOrigin: '50% 50%',
              filter: imageLoaded ? 'blur(0px)' : 'blur(12px)',
            }}
            onLoad={() => setImageLoaded(true)}
            draggable={false}
          />
        ) : (
          /* ====== GRADIENT PLACEHOLDER ====== */
          <div
            ref={placeholderRef}
            className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center transition-transform duration-[600ms] ease-out will-change-transform group-hover:scale-[1.75]`}
            style={{
              transformOrigin: '50% 50%',
              filter: imageLoaded ? 'blur(0px)' : 'blur(12px)',
            }}
          >
            <div className="text-center pointer-events-none px-6">
              <p className="text-surface-500/60 text-xs font-medium tracking-[0.15em] uppercase">{category || 'Unstitched'}</p>
              <p className="text-surface-700 text-base font-semibold mt-2 leading-snug">{name}</p>
            </div>
          </div>
        )}

        {/* Fullscreen toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
          className="absolute bottom-4 left-4 z-30 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-soft transition-all duration-300 opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-110"
        >
          <FiMaximize2 className="w-4 h-4 text-surface-600" />
        </button>

        {/* Mobile swipe dots */}
        <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
          {Array.from({ length: totalViews }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'bg-white w-5' : 'bg-white/40 w-1.5'
              }`}
            />
          ))}
        </div>

        {/* Zoom instruction hint */}
        <div className="absolute top-4 left-4 z-30 hidden md:flex items-center gap-1 text-[10px] text-surface-500 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full transition-all duration-500 opacity-0 group-hover:opacity-100">
          <span>Hover to zoom</span>
        </div>
      </div>

      {/* ============================================================
          THUMBNAIL GALLERY
          ============================================================ */}
      <div className="hidden md:flex gap-2">
        {hasRealImages ? (
          /* Real image thumbnails — small, compact */
          images.map((imgUrl, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden transition-all duration-300 ${
                i === activeIndex
                  ? 'ring-2 ring-brand-500 ring-offset-1 shadow-warm'
                  : 'border border-surface-200 hover:border-surface-300 hover:shadow-soft opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={normalizeImageSrc(imgUrl)}
                alt={`${name} thumbnail ${i + 1}`}
                fill
                unoptimized={isBackendUploadUrl(imgUrl)}
                sizes="64px"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </button>
          ))
        ) : (
          /* Gradient placeholders when no images */
          ['Front', 'Back', 'Close-up', 'Detail'].map((label, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden transition-all duration-300 ${
                i === activeIndex
                  ? 'ring-2 ring-brand-500 ring-offset-1 shadow-warm'
                  : 'border border-surface-200 hover:border-surface-300 hover:shadow-soft opacity-70 hover:opacity-100'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                <span className="text-[8px] text-surface-500 font-medium">{label}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* ============================================================
          FULLSCREEN LIGHTBOX
          ============================================================ */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-surface-900/98 backdrop-blur-sm flex items-center justify-center"
          style={{ animation: 'fadeIn 0.3s ease-out' }}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 w-11 h-11 bg-white/8 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:bg-white/15 hover:text-white transition-all z-10"
          >
            <FiX className="w-5 h-5" />
          </button>

          {/* Navigation Arrows */}
          <button
            onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
            className="absolute left-4 md:left-8 w-11 h-11 bg-white/8 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:bg-white/15 transition-all z-10 disabled:opacity-20"
            disabled={activeIndex === 0}
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveIndex(Math.min(totalViews - 1, activeIndex + 1))}
            className="absolute right-4 md:right-8 w-11 h-11 bg-white/8 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:bg-white/15 transition-all z-10 disabled:opacity-20"
            disabled={activeIndex === totalViews - 1}
          >
            <FiChevronRight className="w-5 h-5" />
          </button>

          {/* Lightbox Main Image */}
          {hasRealImages ? (
            <img
              src={currentImageUrl}
              alt={`${name} - Fullscreen view ${activeIndex + 1}`}
              className="w-[85vw] h-[75vh] max-w-4xl rounded-2xl object-contain"
              style={{ animation: 'snapIn 0.4s ease-out' }}
            />
          ) : (
            <div className={`w-[85vw] h-[75vh] max-w-4xl bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center overflow-hidden`}
              style={{ animation: 'snapIn 0.4s ease-out' }}
            >
              <div className="text-center text-surface-600/70">
                <p className="text-lg font-medium">{name}</p>
                <p className="text-xs mt-6 opacity-40">Arrow keys to navigate • Esc to close</p>
              </div>
            </div>
          )}

          {/* Lightbox Thumbnails */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5">
            {hasRealImages ? (
              images.map((imgUrl, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    i === activeIndex ? 'border-white/90 scale-110 shadow-lg' : 'border-white/20 opacity-50 hover:opacity-80'
                  }`}
                >
                    <Image src={normalizeImageSrc(imgUrl)} alt={`Preview ${i + 1}`} width={48} height={48} unoptimized={isBackendUploadUrl(imgUrl)} sizes="48px" className="w-full h-full object-cover" />
                </button>
              ))
            ) : (
              Array.from({ length: totalViews }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} border-2 transition-all duration-300 ${
                    i === activeIndex ? 'border-white/90 scale-110 shadow-lg' : 'border-white/20 opacity-50 hover:opacity-80'
                  }`}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
