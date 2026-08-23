'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

// ============================================================
// PREMIUM PRODUCT ZOOM SYSTEM
// Khaadi / Zara / Nike-level zoom experience
// ============================================================

export interface ZoomState {
  isZooming: boolean;
  zoomLevel: number;
  position: { x: number; y: number };
  lensPosition: { x: number; y: number };
  isTransitioning: boolean;
}

interface UseProductZoomOptions {
  maxZoom?: number;
  minZoom?: number;
  zoomStep?: number;
  activationDelay?: number;    // Subtle delay for realism
  smoothing?: number;          // Easing factor (0-1)
  edgeResistance?: number;     // How much resistance at image boundaries
  enableScrollZoom?: boolean;  // Desktop scroll wheel zoom
  enableDoubleClick?: boolean; // Double-click toggle
}

export function useProductZoom(options: UseProductZoomOptions = {}) {
  const {
    maxZoom = 3.5,
    minZoom = 1,
    zoomStep = 0.5,
    activationDelay = 80,
    smoothing = 0.12,
    edgeResistance = 0.85,
    enableScrollZoom = true,
    enableDoubleClick = true,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const activationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Current smooth position (interpolated)
  const currentPos = useRef({ x: 50, y: 50 });
  const targetPos = useRef({ x: 50, y: 50 });

  const [state, setState] = useState<ZoomState>({
    isZooming: false,
    zoomLevel: 1,
    position: { x: 50, y: 50 },
    lensPosition: { x: 0, y: 0 },
    isTransitioning: false,
  });

  // ============================================================
  // SMOOTH POSITION INTERPOLATION (60fps)
  // Provides the ultra-smooth, no-jitter movement
  // ============================================================
  const smoothLoop = useCallback(() => {
    const dx = targetPos.current.x - currentPos.current.x;
    const dy = targetPos.current.y - currentPos.current.y;

    if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
      currentPos.current.x += dx * smoothing;
      currentPos.current.y += dy * smoothing;

      setState(prev => ({
        ...prev,
        position: { ...currentPos.current },
      }));
    }

    animFrameRef.current = requestAnimationFrame(smoothLoop);
  }, [smoothing]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(smoothLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [smoothLoop]);

  // ============================================================
  // EDGE RESISTANCE — smooth stop at image boundaries
  // ============================================================
  const applyEdgeResistance = useCallback((val: number): number => {
    if (val < 0) return val * (1 - edgeResistance);
    if (val > 100) return 100 + (val - 100) * (1 - edgeResistance);
    return val;
  }, [edgeResistance]);

  // ============================================================
  // MOUSE HANDLERS — Desktop zoom interactions
  // ============================================================
  const handleMouseEnter = useCallback(() => {
    // Subtle zoom activation delay for realism
    activationTimerRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        isZooming: true,
        isTransitioning: true,
        zoomLevel: prev.zoomLevel === 1 ? 2 : prev.zoomLevel,
      }));
      // Clear transitioning flag after animation completes
      setTimeout(() => {
        setState(prev => ({ ...prev, isTransitioning: false }));
      }, 300);
    }, activationDelay);
  }, [activationDelay]);

  const handleMouseLeave = useCallback(() => {
    if (activationTimerRef.current) {
      clearTimeout(activationTimerRef.current);
    }
    setState(prev => ({
      ...prev,
      isZooming: false,
      isTransitioning: true,
      zoomLevel: 1,
    }));
    // Snap-back reset
    currentPos.current = { x: 50, y: 50 };
    targetPos.current = { x: 50, y: 50 };
    setTimeout(() => {
      setState(prev => ({ ...prev, isTransitioning: false }));
    }, 400);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();

    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;

    // Apply edge resistance
    const x = applyEdgeResistance(rawX);
    const y = applyEdgeResistance(rawY);

    targetPos.current = { x, y };

    setState(prev => ({
      ...prev,
      lensPosition: {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      },
    }));
  }, [applyEdgeResistance]);

  // ============================================================
  // SCROLL WHEEL ZOOM — Multi-level progressive zoom
  // ============================================================
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (!enableScrollZoom) return;
    e.preventDefault();

    setState(prev => {
      const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
      const newZoom = Math.max(minZoom, Math.min(maxZoom, prev.zoomLevel + delta));

      return {
        ...prev,
        zoomLevel: newZoom,
        isZooming: newZoom > 1,
        isTransitioning: true,
      };
    });

    setTimeout(() => {
      setState(prev => ({ ...prev, isTransitioning: false }));
    }, 200);
  }, [enableScrollZoom, zoomStep, minZoom, maxZoom]);

  // ============================================================
  // DOUBLE-CLICK — Zoom toggle
  // ============================================================
  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableDoubleClick) return;
    e.preventDefault();

    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setState(prev => {
      const isCurrentlyZoomed = prev.zoomLevel > 1;
      const newZoom = isCurrentlyZoomed ? 1 : 2.5;
      if (!isCurrentlyZoomed) {
        targetPos.current = { x, y };
        currentPos.current = { x, y };
      } else {
        targetPos.current = { x: 50, y: 50 };
        currentPos.current = { x: 50, y: 50 };
      }
      return {
        ...prev,
        zoomLevel: newZoom,
        isZooming: !isCurrentlyZoomed,
        isTransitioning: true,
        position: isCurrentlyZoomed ? { x: 50, y: 50 } : { x, y },
      };
    });

    setTimeout(() => {
      setState(prev => ({ ...prev, isTransitioning: false }));
    }, 400);
  }, [enableDoubleClick]);

  // ============================================================
  // TOUCH HANDLERS — Mobile pinch/drag/double-tap
  // ============================================================
  const touchStartRef = useRef<{ x: number; y: number; dist: number; time: number }>({
    x: 0, y: 0, dist: 0, time: 0,
  });
  const lastTapRef = useRef<number>(0);

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now();

    // Double-tap detection
    if (e.touches.length === 1) {
      if (now - lastTapRef.current < 300) {
        // Double-tap zoom toggle
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
        const y = ((e.touches[0].clientY - rect.top) / rect.height) * 100;

        setState(prev => {
          const isZoomed = prev.zoomLevel > 1;
          if (!isZoomed) {
            targetPos.current = { x, y };
            currentPos.current = { x, y };
          } else {
            targetPos.current = { x: 50, y: 50 };
          }
          return {
            ...prev,
            zoomLevel: isZoomed ? 1 : 2.5,
            isZooming: !isZoomed,
            isTransitioning: true,
            position: isZoomed ? { x: 50, y: 50 } : { x, y },
          };
        });

        setTimeout(() => {
          setState(prev => ({ ...prev, isTransitioning: false }));
        }, 400);
      }
      lastTapRef.current = now;
    }

    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      dist: getTouchDistance(e.touches),
      time: now,
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;

    // Pinch-to-Zoom
    if (e.touches.length >= 2) {
      const newDist = getTouchDistance(e.touches);
      const oldDist = touchStartRef.current.dist;

      if (oldDist > 0) {
        const scale = newDist / oldDist;
        setState(prev => {
          const newZoom = Math.max(minZoom, Math.min(maxZoom, prev.zoomLevel * scale));
          return {
            ...prev,
            zoomLevel: newZoom,
            isZooming: newZoom > 1,
          };
        });
      }

      touchStartRef.current.dist = newDist;
      return;
    }

    // Drag to pan (when zoomed)
    if (e.touches.length === 1 && state.zoomLevel > 1) {
      const rect = el.getBoundingClientRect();
      const dx = (e.touches[0].clientX - touchStartRef.current.x) / rect.width * -100;
      const dy = (e.touches[0].clientY - touchStartRef.current.y) / rect.height * -100;

      targetPos.current = {
        x: Math.max(0, Math.min(100, targetPos.current.x + dx * 0.3)),
        y: Math.max(0, Math.min(100, targetPos.current.y + dy * 0.3)),
      };

      touchStartRef.current.x = e.touches[0].clientX;
      touchStartRef.current.y = e.touches[0].clientY;
    }
  }, [minZoom, maxZoom, state.zoomLevel]);

  const handleTouchEnd = useCallback(() => {
    // Snap-back if zoom level is too low
    if (state.zoomLevel < 1.2) {
      setState(prev => ({
        ...prev,
        zoomLevel: 1,
        isZooming: false,
        isTransitioning: true,
      }));
      targetPos.current = { x: 50, y: 50 };
      setTimeout(() => {
        setState(prev => ({ ...prev, isTransitioning: false }));
      }, 400);
    }
  }, [state.zoomLevel]);

  // ============================================================
  // SET ZOOM LEVEL (external control)
  // ============================================================
  const setZoomLevel = useCallback((level: number) => {
    setState(prev => ({
      ...prev,
      zoomLevel: Math.max(minZoom, Math.min(maxZoom, level)),
      isZooming: level > 1,
      isTransitioning: true,
    }));
    setTimeout(() => {
      setState(prev => ({ ...prev, isTransitioning: false }));
    }, 300);
  }, [minZoom, maxZoom]);

  const resetZoom = useCallback(() => {
    setState(prev => ({
      ...prev,
      zoomLevel: 1,
      isZooming: false,
      isTransitioning: true,
      position: { x: 50, y: 50 },
    }));
    targetPos.current = { x: 50, y: 50 };
    currentPos.current = { x: 50, y: 50 };
    setTimeout(() => {
      setState(prev => ({ ...prev, isTransitioning: false }));
    }, 400);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (activationTimerRef.current) clearTimeout(activationTimerRef.current);
    };
  }, []);

  return {
    containerRef,
    state,
    handlers: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onMouseMove: handleMouseMove,
      onWheel: handleWheel,
      onDoubleClick: handleDoubleClick,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    setZoomLevel,
    resetZoom,
  };
}
