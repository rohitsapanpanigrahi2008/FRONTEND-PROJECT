import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import { useCitySearch } from '@/hooks/useCitySearch';
import { useLocationStore } from '@/store/locationStore';
import { useLiveAqi } from '@/hooks/useLiveAqi';
import { aqiBand } from '@/config/constants';
import type { CityResult } from '@/types/location';

/**
 * Header dropdown for choosing any city (India or worldwide).
 * Selecting a city switches AQI-bound dashboard components to live data;
 * clearing it (✕) restores the built-in synthetic fallback.
 */
export function LocationSelector() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCity = useLocationStore((s) => s.selectedCity);
  const selectCity = useLocationStore((s) => s.selectCity);
  const { results, isSearching } = useCitySearch(open ? query : '');
  const { data: liveAqi, status } = useLiveAqi();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Reset the list cursor whenever the result set changes
  useEffect(() => {
    setHighlight(0);
  }, [results]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const label = useMemo(() => {
    if (!selectedCity) return 'Location';
    return selectedCity.admin1
      ? `${selectedCity.name}, ${selectedCity.admin1}`
      : `${selectedCity.name}, ${selectedCity.country}`;
  }, [selectedCity]);

  const choose = (city: CityResult) => {
    selectCity(city);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const city = results[highlight];
      if (city) choose(city);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
    return;
  };

  const showBadge = status === 'ready' && liveAqi !== null;
  const band = showBadge ? aqiBand(liveAqi.aqi) : null;

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="glass-input flex h-10 items-center gap-2 px-3 text-xs font-semibold text-slate-300 hover:text-white"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Choose location"
      >
        <MapPin className="h-4 w-4 text-sky-400" />
        <span className="max-w-[110px] truncate sm:max-w-[180px]">{label}</span>
        {showBadge && band && (
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
            style={{ background: `${band.color}22`, color: band.color }}
          >
            {liveAqi.aqi}
          </span>
        )}
      </button>

      {open && (
        <div className="glass-panel absolute right-0 top-12 z-50 w-[min(92vw,380px)] p-3 shadow-glass">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search any city — Pune, Delhi, London…"
              className="glass-input w-full py-2 pl-9 pr-9 text-sm text-white placeholder-slate-500"
              aria-label="Search cities"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-200"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {isSearching && (
            <p className="flex items-center gap-2 px-2 py-3 text-xs text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching locations…
            </p>
          )}

          {!isSearching && query.trim().length >= 2 && results.length === 0 && (
            <p className="px-2 py-3 text-xs text-slate-500">No matching cities found.</p>
          )}

          {!isSearching && results.length > 0 && (
            <ul role="listbox" aria-label="City results" className="max-h-72 overflow-y-auto">
              {results.map((city, i) => {
                const active = i === highlight;
                const sub = [city.admin1, city.country].filter(Boolean).join(', ');
                return (
                  <li key={`${city.id}-${city.latitude}`} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => choose(city)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                        active ? 'bg-sky-400/10 text-sky-200' : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <MapPin className="h-4 w-4 shrink-0 text-slate-500" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{city.name}</span>
                        {sub && <span className="block truncate text-[11px] text-slate-500">{sub}</span>}
                      </span>
                      {city.countryCode === 'IN' && (
                        <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                          IN
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {selectedCity && (
            <button
              type="button"
              onClick={() => {
                selectCity(null); // back to built-in synthetic fallback
                setOpen(false);
              }}
              className="mt-2 w-full rounded-lg border border-white/10 px-3 py-2 text-[11px] font-semibold text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
            >
              Reset to demo data
            </button>
          )}

          <p className="mt-2 px-2 text-[10px] leading-relaxed text-slate-600">
            Live air quality via Open-Meteo. Selecting a city refreshes AQI-bound cards;
            other modules keep their synthetic demo feed.
          </p>
        </div>
      )}
    </div>
  );
}
