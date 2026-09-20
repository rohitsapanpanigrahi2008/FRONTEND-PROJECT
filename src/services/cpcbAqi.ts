/**
 * CPCB National Air Quality Index (NAQI) computation.
 *
 * Open-Meteo exposes the US-EPA AQI, but this dashboard's severity bands
 * (`AQI_BANDS` in config/constants.ts) follow India's CPCB NAQI scale
 * (Good / Satisfactory / Moderate / Poor / Very Poor / Severe, 0–500).
 * We therefore compute the NAQI ourselves from the raw pollutant
 * concentrations the API already returns.
 *
 * Method (CPCB, 2014): for each pollutant, map the concentration onto a
 * piecewise-linear sub-index via the official breakpoint table; the overall
 * NAQI is the maximum sub-index and its pollutant is the dominant one.
 *
 * Notes:
 * - CPCB defines averaging periods (24h PM/NO2/SO2, 8h O3/CO). Live
 *   dashboards apply the same breakpoints to instantaneous readings; we do
 *   the same and surface `updatedAt` so users know the observation time.
 * - NH3 and Pb are part of the official index but are not available from
 *   Open-Meteo's current block, so the index is computed from the six
 *   pollutants we do have — still conservative, since we take the maximum.
 */

import type { PollutantReading } from '@/types/location';

interface CpcbBand {
  /** Concentration lower bound (inclusive). */
  readonly cLo: number;
  /** Concentration upper bound (inclusive). */
  readonly cHi: number;
  /** Sub-index at cLo. */
  readonly iLo: number;
  /** Sub-index at cHi. */
  readonly iHi: number;
}

/** Pollutants we can contribute to the NAQI, keyed like PollutantReading. */
export type CpcbPollutantKey = PollutantReading['key'];

/**
 * Official CPCB NAQI breakpoints. Concentrations in µg/m³, except CO which
 * is in mg/m³ (converted at the call site).
 */
const CPCB_BREAKPOINTS: Record<CpcbPollutantKey, readonly CpcbBand[]> = {
  pm2_5: [
    { cLo: 0, cHi: 30, iLo: 0, iHi: 50 },
    { cLo: 30, cHi: 60, iLo: 51, iHi: 100 },
    { cLo: 60, cHi: 90, iLo: 101, iHi: 200 },
    { cLo: 90, cHi: 120, iLo: 201, iHi: 300 },
    { cLo: 120, cHi: 250, iLo: 301, iHi: 400 },
    { cLo: 250, cHi: 380, iLo: 401, iHi: 500 },
  ],
  pm10: [
    { cLo: 0, cHi: 50, iLo: 0, iHi: 50 },
    { cLo: 50, cHi: 100, iLo: 51, iHi: 100 },
    { cLo: 100, cHi: 250, iLo: 101, iHi: 200 },
    { cLo: 250, cHi: 350, iLo: 201, iHi: 300 },
    { cLo: 350, cHi: 430, iLo: 301, iHi: 400 },
    { cLo: 430, cHi: 510, iLo: 401, iHi: 500 },
  ],
  nitrogen_dioxide: [
    { cLo: 0, cHi: 40, iLo: 0, iHi: 50 },
    { cLo: 40, cHi: 80, iLo: 51, iHi: 100 },
    { cLo: 80, cHi: 180, iLo: 101, iHi: 200 },
    { cLo: 180, cHi: 280, iLo: 201, iHi: 300 },
    { cLo: 280, cHi: 400, iLo: 301, iHi: 400 },
    { cLo: 400, cHi: 520, iLo: 401, iHi: 500 },
  ],
  ozone: [
    { cLo: 0, cHi: 50, iLo: 0, iHi: 50 },
    { cLo: 50, cHi: 100, iLo: 51, iHi: 100 },
    { cLo: 100, cHi: 168, iLo: 101, iHi: 200 },
    { cLo: 168, cHi: 208, iLo: 201, iHi: 300 },
    { cLo: 208, cHi: 748, iLo: 301, iHi: 400 },
    { cLo: 748, cHi: 1000, iLo: 401, iHi: 500 },
  ],
  sulphur_dioxide: [
    { cLo: 0, cHi: 40, iLo: 0, iHi: 50 },
    { cLo: 40, cHi: 80, iLo: 51, iHi: 100 },
    { cLo: 80, cHi: 380, iLo: 101, iHi: 200 },
    { cLo: 380, cHi: 800, iLo: 201, iHi: 300 },
    { cLo: 800, cHi: 1600, iLo: 301, iHi: 400 },
    { cLo: 1600, cHi: 2400, iLo: 401, iHi: 500 },
  ],
  carbon_monoxide: [
    { cLo: 0, cHi: 1, iLo: 0, iHi: 50 },
    { cLo: 1, cHi: 2, iLo: 51, iHi: 100 },
    { cLo: 2, cHi: 10, iLo: 101, iHi: 200 },
    { cLo: 10, cHi: 17, iLo: 201, iHi: 300 },
    { cLo: 17, cHi: 34, iLo: 301, iHi: 400 },
    { cLo: 34, cHi: 50, iLo: 401, iHi: 500 },
  ],
};

/**
 * CPCB sub-index for one pollutant. `concUgM3` is in µg/m³ (CO is converted
 * to mg/m³ internally). Returns `null` only for unusable input; concentrations
 * beyond the top breakpoint are capped at 500 (standard practice — Delhi
 * winters regularly exceed the highest PM2.5/PM10 breakpoints).
 */
export function cpcbSubIndex(key: CpcbPollutantKey, concUgM3: number): number | null {
  if (!Number.isFinite(concUgM3) || concUgM3 < 0) return null;

  const conc = key === 'carbon_monoxide' ? concUgM3 / 1000 : concUgM3;
  const band = CPCB_BREAKPOINTS[key].find((b) => conc <= b.cHi);
  if (!band) return 500; // beyond the top breakpoint — cap the sub-index

  const idx =
    ((band.iHi - band.iLo) / (band.cHi - band.cLo)) * (conc - band.cLo) + band.iLo;
  return Math.max(0, Math.min(500, Math.round(idx)));
}

export interface CpcbAqiResult {
  /** Overall NAQI (max of the available sub-indices). */
  aqi: number;
  /** Key of the pollutant driving the index. */
  dominant: CpcbPollutantKey;
  /** Per-pollutant sub-indices that were computable. */
  subIndices: Partial<Record<CpcbPollutantKey, number>>;
}

/**
 * Overall CPCB NAQI from a set of readings. Returns `null` when no reading
 * is usable, letting callers fall back to the provider's own index.
 */
export function computeCpcbAqi(readings: readonly PollutantReading[]): CpcbAqiResult | null {
  const subIndices: Partial<Record<CpcbPollutantKey, number>> = {};
  let best: { key: CpcbPollutantKey; idx: number } | null = null;

  for (const reading of readings) {
    const idx = cpcbSubIndex(reading.key, reading.value);
    if (idx === null) continue;
    subIndices[reading.key] = idx;
    if (!best || idx > best.idx) best = { key: reading.key, idx };
  }

  return best ? { aqi: best.idx, dominant: best.key, subIndices } : null;
}
