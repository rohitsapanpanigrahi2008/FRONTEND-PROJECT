/**
 * Live-location feature types (Open-Meteo, keyless).
 * A `null` selected location anywhere in the app means "use the dashboard's
 * built-in synthetic fallback data" — the pre-feature behaviour.
 */

/** Result of geocoding a user-typed city name. */
export interface CityResult {
  id: number | string;
  name: string;
  /** "Pune", "Maharashtra" — may be empty for some territories */
  admin1: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

/** Pollutant concentration in µg/m³ from the air-quality API. */
export interface PollutantReading {
  key: 'pm2_5' | 'pm10' | 'carbon_monoxide' | 'nitrogen_dioxide' | 'ozone' | 'sulphur_dioxide';
  label: string;
  value: number;
  unit: 'µg/m³';
}

/** Normalized live AQI snapshot for one location. */
export interface LiveAqi {
  latitude: number;
  longitude: number;
  /** Overall index (0–500) on the scale named by `aqiScale`. */
  aqi: number;
  /** Which scale `aqi` follows: CPCB NAQI (preferred) or US-EPA fallback. */
  aqiScale: 'cpcb' | 'us';
  dominantPollutant: string;
  pollutants: PollutantReading[];
  updatedAt: string;
}
