'use client';

import { useCallback, useRef, useEffect } from 'react';

interface Mouse3DOptions {
  maxTilt?: number;
  scale?: number;
  magnetic?: boolean;
  magneticStrength?: number;
}

export function useMouse3D(options: Mouse3DOptions = {}) {
  const {
    maxTilt = 12,
    scale = 1.02,
    magnetic = true,
    magneticStrength = 0.3,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const animFrame = useRef<number>(0);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;

      cancelAnimationFrame(animFrame.current);
      animFrame.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Normalized from -1 to 1
        const normalX = (x - centerX) / centerX;
        const normalY = (y - centerY) / centerY;

        // 3D tilt
        const tiltX = -normalY * maxTilt;
        const tiltY = normalX * maxTilt;

        el.style.setProperty('--tilt-x', `${tiltX}deg`);
        el.style.setProperty('--tilt-y', `${tiltY}deg`);
        el.style.setProperty('--mouse-x', `${x}px`);
        el.style.setProperty('--mouse-y', `${y}px`);
        el.style.setProperty('--glow-opacity', '1');

        // Magnetic pull
        if (magnetic) {
          const pullX = normalX * magneticStrength * 10;
          const pullY = normalY * magneticStrength * 10;
          el.style.setProperty('--pull-x', `${pullX}px`);
          el.style.setProperty('--pull-y', `${pullY}px`);
        }
      });
    },
    [maxTilt, magnetic, magneticStrength]
  );

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    cancelAnimationFrame(animFrame.current);
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
    el.style.setProperty('--glow-opacity', '0');
    el.style.setProperty('--pull-x', '0px');
    el.style.setProperty('--pull-y', '0px');
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener('mousemove', handleMouseMove, { passive: true });
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animFrame.current);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return ref;
}

/**
 * Hook for cursor proximity detection — triggers effects when
 * the cursor is near the element (within a given radius).
 */
export function useProximity(radius = 200) {
  const ref = useRef<HTMLDivElement>(null);
  const animFrame = useRef<number>(0);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;

      cancelAnimationFrame(animFrame.current);
      animFrame.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
        const proximity = Math.max(0, 1 - dist / radius);

        el.style.setProperty('--proximity', proximity.toFixed(3));
        el.style.setProperty('--proximity-scale', (1 + proximity * 0.03).toFixed(4));
      });
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(animFrame.current);
    };
  }, [radius]);

  return ref;
}
