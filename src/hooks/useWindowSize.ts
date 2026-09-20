import { useSyncExternalStore } from 'react';

export interface WindowSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isUltraWide: boolean;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

/**
 * IMPORTANT: useSyncExternalStore compares snapshots by reference. A fresh
 * object per call would loop forever, so the snapshot is cached and only
 * rebuilt when the viewport actually changes.
 */
let cache: WindowSize | null = null;
let cachedW = -1;
let cachedH = -1;

function getSnapshot(): WindowSize {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (!cache || w !== cachedW || h !== cachedH) {
    cachedW = w;
    cachedH = h;
    cache = {
      width: w,
      height: h,
      isMobile: w < 640,
      isTablet: w >= 640 && w < 1024,
      isDesktop: w >= 1024 && w < 1920,
      isUltraWide: w >= 1920,
    };
  }
  return cache;
}

function getServerSnapshot(): WindowSize {
  return {
    width: 1280,
    height: 800,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isUltraWide: false,
  };
}

export function useWindowSize(): WindowSize {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
