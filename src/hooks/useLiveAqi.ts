import { useEffect, useState } from 'react';
import { fetchLiveAqi } from '@/services/locationService';
import { useLocationStore } from '@/store/locationStore';
import type { LiveAqi } from '@/types/location';

const REFRESH_MS = 10 * 60 * 1000; // AQI models update roughly hourly; be gentle

export type LiveAqiStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Live air quality for the selected city. When no city is selected the hook
 * reports `idle` and the dashboard keeps its synthetic fallback data.
 */
export function useLiveAqi(): {
  status: LiveAqiStatus;
  data: LiveAqi | null;
  error: string | null;
  refresh: () => void;
} {
  const selectedCity = useLocationStore((s) => s.selectedCity);
  const [data, setData] = useState<LiveAqi | null>(null);
  const [status, setStatus] = useState<LiveAqiStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!selectedCity) {
      setData(null);
      setStatus('idle');
      setError(null);
      return;
    }

    const controller = new AbortController();
    setStatus('loading');
    setError(null);

    fetchLiveAqi(selectedCity.latitude, selectedCity.longitude, controller.signal)
      .then((aqi) => {
        setData(aqi);
        setStatus('ready');
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setError('Live air-quality data unavailable for this location');
        setStatus('error');
      });

    const interval = window.setInterval(() => setTick((t) => t + 1), REFRESH_MS);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [selectedCity, tick]);

  return { status, data, error, refresh };
}

/** Convenience: display label for the active location (or null for fallback). */
export function useActiveLocationLabel(): string | null {
  const city = useLocationStore((s) => s.selectedCity);
  if (!city) return null;
  return city.admin1 ? `${city.name}, ${city.admin1}` : `${city.name}, ${city.country}`;
}
