import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fetchLiveAqi, searchCities } from '@/services/locationService';
import { cpcbSubIndex, computeCpcbAqi } from '@/services/cpcbAqi';
import { useLocationStore } from '@/store/locationStore';

const aqPayload = {
  current: {
    time: '2026-09-20T10:00',
    us_aqi: 152.4,
    us_aqi_pm2_5: 140.2,
    us_aqi_pm10: 95.1,
    pm2_5: 51.3,
    pm10: 78.9,
    carbon_monoxide: 320.5,
    nitrogen_dioxide: 18.2,
    sulphur_dioxide: 4.1,
    ozone: 45.6,
  },
};

describe('fetchLiveAqi', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve(aqPayload) }),
      ) as unknown as typeof fetch,
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('prefers the CPCB NAQI computed from concentrations', async () => {
    const aqi = await fetchLiveAqi(18.52, 73.85, new AbortController().signal);
    // pm2.5 51.3 µg/m³ → CPCB sub-index 86; max across pollutants
    expect(aqi.aqi).toBe(86);
    expect(aqi.aqiScale).toBe('cpcb');
    expect(aqi.dominantPollutant).toBe('PM2.5');
    expect(aqi.pollutants.map((p) => p.label)).toEqual(['PM2.5', 'PM10', 'CO', 'NO₂', 'O₃', 'SO₂']);
    expect(aqi.pollutants[0]).toMatchObject({ value: 51.3, unit: 'µg/m³' });
  });

  it('falls back to the US-EPA index when no concentrations are usable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ current: { time: 't', us_aqi: 63.7 } }),
        }),
      ) as unknown as typeof fetch,
    );
    const aqi = await fetchLiveAqi(0, 0, new AbortController().signal);
    expect(aqi.aqi).toBe(64);
    expect(aqi.aqiScale).toBe('us');
  });

  it('throws a clear error when the payload has no current block', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
      ) as unknown as typeof fetch,
    );
    await expect(fetchLiveAqi(0, 0, new AbortController().signal)).rejects.toThrow('current');
  });
});

describe('searchCities', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('promotes Indian cities to the top of the list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [
                { id: 1, name: 'Hyderabad', country: 'United States', country_code: 'US', latitude: 1, longitude: 2 },
                { id: 2, name: 'Hyderabad', country: 'India', country_code: 'IN', latitude: 17.38, longitude: 78.48, admin1: 'Telangana' },
              ],
            }),
        }),
      ) as unknown as typeof fetch,
    );
    const results = await searchCities('hyderabad', new AbortController().signal);
    expect(results[0].countryCode).toBe('IN');
    expect(results[0].admin1).toBe('Telangana');
  });

  it('returns [] for very short queries without hitting the network', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
    const results = await searchCities('p', new AbortController().signal);
    expect(results).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('cpcbAqi', () => {
  it('maps breakpoints piecewise-linearly (PM2.5 51.3 → 86)', () => {
    expect(cpcbSubIndex('pm2_5', 51.3)).toBe(86);
    expect(cpcbSubIndex('pm2_5', 0)).toBe(0);
    expect(cpcbSubIndex('pm2_5', 30)).toBe(50); // top edge of band 1 wins
  });

  it('converts CO from µg/m³ to mg/m³ before indexing', () => {
    expect(cpcbSubIndex('carbon_monoxide', 1000)).toBe(50); // 1 mg/m³
    expect(cpcbSubIndex('carbon_monoxide', 2000)).toBe(100); // 2 mg/m³
  });

  it('caps beyond the top breakpoint and rejects invalid input', () => {
    expect(cpcbSubIndex('pm2_5', 9999)).toBe(500);
    expect(cpcbSubIndex('pm2_5', -1)).toBeNull();
    expect(cpcbSubIndex('pm2_5', Number.NaN)).toBeNull();
  });

  it('returns the max sub-index as the overall NAQI with its dominant pollutant', () => {
    const result = computeCpcbAqi([
      { key: 'pm2_5', label: 'PM2.5', value: 51.3, unit: 'µg/m³' },
      { key: 'pm10', label: 'PM10', value: 78.9, unit: 'µg/m³' },
      { key: 'ozone', label: 'O₃', value: 45.6, unit: 'µg/m³' },
    ]);
    expect(result).toEqual({
      aqi: 86,
      dominant: 'pm2_5',
      subIndices: { pm2_5: 86, pm10: 79, ozone: 46 },
    });
  });

  it('returns null when no reading is usable', () => {
    expect(computeCpcbAqi([{ key: 'pm2_5', label: 'PM2.5', value: -3, unit: 'µg/m³' }])).toBeNull();
  });
});

describe('locationStore', () => {
  it('starts null (fallback mode) and switches per selection', () => {
    const s = useLocationStore.getState();
    expect(s.selectedCity).toBeNull();
    useLocationStore.getState().selectCity({
      id: 1, name: 'Pune', admin1: 'Maharashtra', country: 'India', countryCode: 'IN',
      latitude: 18.52, longitude: 73.85, timezone: 'Asia/Kolkata',
    });
    expect(useLocationStore.getState().selectedCity?.name).toBe('Pune');
    useLocationStore.getState().selectCity(null);
    expect(useLocationStore.getState().selectedCity).toBeNull();
  });
});
