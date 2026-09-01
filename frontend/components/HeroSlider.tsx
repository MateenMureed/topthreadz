'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export interface HeroBanner { id: string; imageUrl: string; link: string; altText: string; }

export default function HeroSlider({ banners }: { banners: HeroBanner[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const touchStart = useRef<number | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const next = () => setCurrent((value) => (value + 1) % banners.length);
  const previous = () => setCurrent((value) => (value - 1 + banners.length) % banners.length);
  useEffect(() => { if (banners.length < 2 || paused) return; const timer = window.setInterval(next, 5000); return () => window.clearInterval(timer); }, [banners.length, paused]);
  const pauseTouch = () => { setPaused(true); if (resumeTimer.current) clearTimeout(resumeTimer.current); resumeTimer.current = setTimeout(() => setPaused(false), 3000); };
  return <section className="relative overflow-hidden border-b border-surface-300 bg-surface-100" aria-label="Featured collections" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX || null; pauseTouch(); }} onTouchEnd={(event) => { const start = touchStart.current; const end = event.changedTouches[0]?.clientX; if (start !== null && end !== undefined && Math.abs(start - end) > 40) start > end ? next() : previous(); touchStart.current = null; }}>
    <div className="relative aspect-[4/3] sm:aspect-[16/7] lg:aspect-[21/9] max-h-[640px]">
      {!loaded && <div className="absolute inset-0 animate-pulse bg-surface-200" />}
      {banners.map((banner, index) => (index === current || index === (current + 1) % banners.length) && <Link key={banner.id} href={banner.link || '/products'} aria-label={banner.altText} className={`absolute inset-0 transition-opacity duration-500 ${index === current ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'}`}>
        <Image src={banner.imageUrl} alt={banner.altText} fill priority={index === current} loading={index === current ? 'eager' : 'lazy'} sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 100vw" className="object-cover object-center" onLoad={() => setLoaded(true)} />
      </Link>)}
      {banners.length > 1 && <><button type="button" onClick={previous} aria-label="Previous banner" className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 text-surface-900 shadow sm:block"><FiChevronLeft /></button><button type="button" onClick={next} aria-label="Next banner" className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 text-surface-900 shadow sm:block"><FiChevronRight /></button><div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">{banners.map((banner, index) => <button key={banner.id} type="button" onClick={() => setCurrent(index)} aria-label={`Show banner ${index + 1}`} className={`h-2 rounded-full transition-all ${index === current ? 'w-6 bg-white' : 'w-2 bg-white/60'}`} />)}</div></>}
    </div>
  </section>;
}
