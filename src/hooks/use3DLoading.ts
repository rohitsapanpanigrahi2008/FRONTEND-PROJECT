import { useEffect, useState } from 'react';
import { MODEL_ASSETS } from '@/types/blender';
import { formatBytes } from '@/utils/formatters';

export interface ModelLoadState {
  id: string;
  url: string;
  loaded: boolean;
  bytes?: number;
}

/**
 * Tracks GLB asset sizes against their budgets (keeps first-load light) and
 * reports whether the active model has been verified as available.
 */
export function use3DLoading(url: string | undefined): {
  states: ModelLoadState[];
  isActiveModelReady: boolean;
} {
  const [states, setStates] = useState<ModelLoadState[]>(() =>
    MODEL_ASSETS.map((a) => ({ id: a.id, url: a.url, loaded: false })),
  );

  useEffect(() => {
    if (!url) return;
    const asset = MODEL_ASSETS.find((a) => a.url === url);
    if (!asset) return;

    let cancelled = false;
    fetch(url, { method: 'HEAD' })
      .then((res) => {
        if (cancelled || !res.ok) return;
        const bytes = Number(res.headers.get('content-length') ?? 0);
        if (bytes > asset.maxBytes) {
          console.warn(
            `[3D assets] ${asset.id} is ${formatBytes(bytes)} — budget is ${formatBytes(asset.maxBytes)}. Re-export with higher Draco compression.`,
          );
        }
        setStates((prev) =>
          prev.map((s) => (s.id === asset.id ? { ...s, loaded: true, bytes } : s)),
        );
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [url]);

  const active = states.find((s) => s.url === url);
  return { states, isActiveModelReady: active?.loaded ?? false };
}
