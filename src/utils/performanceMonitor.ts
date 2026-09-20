/**
 * Lightweight performance instrumentation.
 * Uses PerformanceObserver marks and an FPS sampler for the 3D canvases.
 * Never throws — monitoring must not break UX.
 */

export function markPerformance(name: string): void {
  try {
    performance.mark(name);
  } catch {
    /* noop */
  }
}

export function measurePerformance(name: string, startMark: string): void {
  try {
    performance.mark(`${name}-end`);
    performance.measure(name, startMark, `${name}-end`);
  } catch {
    /* noop */
  }
}

/** Observe long tasks (>50ms) to catch jank early in dev. */
export function watchLongTasks(onLongTask?: (durationMs: number) => void): () => void {
  if (typeof PerformanceObserver === 'undefined') return () => undefined;
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        onLongTask?.(entry.duration);
      }
    });
    observer.observe({ entryTypes: ['longtask'] });
    return () => observer.disconnect();
  } catch {
    return () => undefined;
  }
}

/**
 * Sample FPS inside a requestAnimationFrame loop. Returns a stop function.
 * Used by the 3D scenes to degrade quality when frame rate drops.
 */
export function createFpsSampler(onSample: (fps: number) => void): () => void {
  let raf = 0;
  let frames = 0;
  let last = performance.now();
  const loop = (now: number) => {
    frames += 1;
    if (now - last >= 1000) {
      onSample(Math.round((frames * 1000) / (now - last)));
      frames = 0;
      last = now;
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}
