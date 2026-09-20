/**
 * Geocoding + real-time air quality via Open-Meteo (free, keyless, CORS-enabled).
 * All network errors degrade gracefully; callers keep their existing fallback data.
 * Docs: https://open-meteo.com/en/docs/geocoding-api and /en/docs/air-quality-api
 */
import type { CityResult, LiveAqi, PollutantReading } from '@/types/location';
import { computeCpcbAqi } from '@/services/cpcbAqi';
import { sanitizeText } from '@/utils/sanitizers';

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const AQ_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

const TIMEOUT_MS = 8000;

async function getJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

/* ----------------------------- Geocoding ----------------------------- */

interface GeoApiItem {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  timezone?: string;
  population?: number;
}

/** Search cities by name. Results are biased toward India when the query is not explicit. */
export async function searchCities(query: string, signal: AbortSignal): Promise<CityResult[]> {
  const q = sanitizeText(query);
  if (q.length < 2) return [];

  // Ordering tricks: match "pune" preferentially to Pune, IN. For non-India
  // queries the country bias simply has little effect, which is fine.
  const params = new URLSearchParams({
    name: q,
    count: '8',
    language: 'en',
    format: 'json',
  });

  const data = await getJson<{ results?: GeoApiItem[] }>(`${GEO_URL}?${params}`, signal);

  const results: CityResult[] = (data.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    admin1: r.admin1 ?? '',
    country: r.country ?? '',
    countryCode: r.country_code ?? '',
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone ?? 'auto',
  }));

  // Promote Indian cities and bigger populations for a friendlier ordering.
  return results.sort((a, b) => {
    const aIn = a.countryCode === 'IN' ? 1 : 0;
    const bIn = b.countryCode === 'IN' ? 1 : 0;
    if (aIn !== bIn) return bIn - aIn;
    return 0; // keep API relevance order otherwise
  });
}

/* --------------------------- Air quality ---------------------------- */

interface AqApiCurrent {
  time: string;
  us_aqi?: number;
  us_aqi_pm2_5?: number;
  us_aqi_pm10?: number;
  pm2_5?: number;
  pm10?: number;
  carbon_monoxide?: number;
  nitrogen_dioxide?: number;
  sulphur_dioxide?: number;
  ozone?: number;
}

const POLLUTANT_DEFS: {
  key: PollutantReading['key'];
  label: string;
  usAqiField?: keyof AqApiCurrent;
}[] = [
  { key: 'pm2_5', label: 'PM2.5', usAqiField: 'us_aqi_pm2_5' },
  { key: 'pm10', label: 'PM10', usAqiField: 'us_aqi_pm10' },
  { key: 'carbon_monoxide', label: 'CO' },
  { key: 'nitrogen_dioxide', label: 'NO₂' },
  { key: 'ozone', label: 'O₃' },
  { key: 'sulphur_dioxide', label: 'SO₂' },
];

/** Fetch the live AQI snapshot for one coordinate pair. */
export async function fetchLiveAqi(
  latitude: number,
  longitude: number,
  signal: AbortSignal,
): Promise<LiveAqi> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'us_aqi,us_aqi_pm2_5,us_aqi_pm10,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone',
    timezone: 'auto',
  });

  const data = await getJson<{ current?: AqApiCurrent }>(`${AQ_URL}?${params}`, signal);
  const cur = data.current;
  if (!cur) throw new Error('Air-quality payload missing `current`');

  const pollutants: PollutantReading[] = POLLUTANT_DEFS.filter(
    (def) => typeof cur[def.key] === 'number',
  ).map((def) => ({
    key: def.key,
    label: def.label,
    value: cur[def.key] as number,
    unit: 'µg/m³',
  }));

  // Prefer India's CPCB NAQI — it matches the dashboard's severity bands
  // (Good/Satisfactory/Moderate/Poor/Very Poor/Severe). Fall back to
  // Open-Meteo's US-AQI when concentrations are unavailable.
  const cpcb = computeCpcbAqi(pollutants);
  if (cpcb) {
    const dominantLabel =
      POLLUTANT_DEFS.find((def) => def.key === cpcb.dominant)?.label ?? '—';
    return {
      latitude,
      longitude,
      aqi: cpcb.aqi,
      aqiScale: 'cpcb',
      dominantPollutant: dominantLabel,
      pollutants,
      updatedAt: cur.time,
    };
  }

  // Fallback: provider's own US-EPA index with its per-pollutant sub-indices
  // (pm2.5 / pm10) for the dominant-pollutant label.
  let dominant = pollutants[0]?.label ?? '—';
  const pm25Idx = cur.us_aqi_pm2_5;
  const pm10Idx = cur.us_aqi_pm10;
  if (typeof pm25Idx === 'number' && typeof pm10Idx === 'number') {
    dominant = pm10Idx > pm25Idx ? 'PM10' : 'PM2.5';
  } else if (typeof pm25Idx === 'number') {
    dominant = 'PM2.5';
  }

  return {
    latitude,
    longitude,
    aqi: typeof cur.us_aqi === 'number' ? Math.round(cur.us_aqi) : 0,
    aqiScale: 'us',
    dominantPollutant: dominant,
    pollutants,
    updatedAt: cur.time,
  };
}

/** Timeout signal helper so callers can bound in-flight requests. */
export function makeTimeoutSignal(ms = TIMEOUT_MS): AbortSignal {
  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), ms);
  return controller.signal;
}
