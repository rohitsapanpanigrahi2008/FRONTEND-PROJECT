import { useEffect, useState } from 'react';
import { searchCities } from '@/services/locationService';
import type { CityResult } from '@/types/location';

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

/**
 * Debounced geocoding search. Aborts in-flight requests when the query
 * changes or the component unmounts; never throws to the UI.
 */
export function useCitySearch(query: string): {
  results: CityResult[];
  isSearching: boolean;
  error: string | null;
} {
  const trimmed = query.trim();
  const shouldSearch = trimmed.length >= MIN_CHARS;

  const [results, setResults] = useState<CityResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldSearch) {
      setResults([]);
      setIsSearching(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);
    setError(null);

    const timer = window.setTimeout(() => {
      searchCities(trimmed, controller.signal)
        .then((res) => {
          setResults(res);
          setIsSearching(false);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          setResults([]);
          setError(err instanceof Error ? 'Location service unavailable' : 'Search failed');
          setIsSearching(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [trimmed, shouldSearch]);

  return { results, isSearching, error };
}
