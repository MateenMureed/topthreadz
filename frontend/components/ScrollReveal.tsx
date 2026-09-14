'use client';

import { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  /** Fixed delay in ms. Ignored if `stagger` + `index` are supplied. */
  delay?: number;
  /** Index of this item within a revealed group (e.g. product grid position). */
  index?: number;
  /** ms of extra delay per index step, used with `index`. */
  stagger?: number;
  /** Caps the total stagger delay so a long grid doesn't take seconds to finish. */
  maxDelay?: number;
  className?: string;
  animation?: 'slide-up' | 'fade-in' | 'slide-left' | 'scale-up';
}

export default function ScrollReveal({
  children,
  delay = 0,
  index,
  stagger = 60,
  maxDelay = 480,
  className = '',
  animation = 'fade-in',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        // Trigger a little before full entry so product cards feel ready,
        // not chased into view, as the shopper scrolls a grid.
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.1,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const getAnimationClass = () => {
    if (reducedMotion) return 'opacity-100';
    switch (animation) {
      case 'slide-up':
        return 'translate-y-[20px] opacity-0 data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100';
      case 'fade-in':
        return 'opacity-0 data-[visible=true]:opacity-100';
      case 'scale-up':
        return 'scale-[0.97] opacity-0 data-[visible=true]:scale-100 data-[visible=true]:opacity-100';
      case 'slide-left':
        return 'translate-x-[20px] opacity-0 data-[visible=true]:translate-x-0 data-[visible=true]:opacity-100';
      default:
        return '';
    }
  };

  const computedDelay =
    typeof index === 'number' ? Math.min(index * stagger, maxDelay) : delay;

  const duration = animation === 'scale-up' ? 650 : 550;

  return (
    <div
      ref={ref}
      data-visible={isVisible}
      className={`transition-all ease-[cubic-bezier(0.16,1,0.3,1)] ${getAnimationClass()} ${className}`}
      style={{
        transitionDuration: reducedMotion ? '0ms' : `${duration}ms`,
        transitionDelay: reducedMotion ? '0ms' : `${computedDelay}ms`,
      }}
    >
      {children}
    </div>
  );
}