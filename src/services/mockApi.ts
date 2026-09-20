/**
 * Mock API — deterministic synthetic data so the dashboard runs fully offline.
 * Simulates diurnal cycles, sensor noise, anomalies and forecasts so the UX
 * matches what the real backend will deliver.
 */
import type {
  AirQualityData,
  Anomaly,
  AssetData,
  AssetStatus,
  BinStatus,
  DashboardSummary,
  EnergyData,
  Facility,
  Forecast,
  Incident,
  MetricReading,
  ModulePayload,
  Recommendation,
  SafetySummary,
  SustainabilityData,
  TimeSeriesPoint,
  TrafficData,
  WasteData,
  WaterData,
  ZoneLoad,
  ModuleId,
} from '@/types';
import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { modelForModule } from '@/types/blender';

const FACILITY: Facility = {
  id: 'facility-demo-01',
  name: 'Govt. Medical College & Hospital — Pune',
  type: 'hospital',
  city: 'Pune',
  state: 'Maharashtra',
  areaSqMeters: 84_000,
  latitude: 18.5204,
  longitude: 73.8567,
};

export const DEFAULT_FACILITY = FACILITY;

const ZONES = ['Zone A', 'Zone B', 'Zone C', 'Area North', 'Area South', 'Block D'];

let seed = 42;
function rand(): number {
  // mulberry32 PRNG — deterministic demo data across reloads.
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 1);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function series(count: number, base: number, amplitude: number, noise = 0.04): TimeSeriesPoint[] {
  const now = Date.now();
  const stepMs = 3_600_000; // hourly points
  const out: TimeSeriesPoint[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const t = new Date(now - i * stepMs).toISOString();
    const hourOfDay = (new Date(now - i * stepMs).getUTCHours() + 5.5) / 24; // IST-ish phase
    const cycle = Math.sin(hourOfDay * Math.PI * 2);
    const value = base + amplitude * cycle + (rand() - 0.5) * base * noise;
    out.push({ t, value: Math.max(0, Number(value.toFixed(2))) });
  }
  return out;
}

function metric(
  id: string,
  label: string,
  unit: string,
  value: number,
  trendPct: number,
  thresholds: { warn: number; critical: number },
  higherIsWorse = true,
  history: TimeSeriesPoint[] = [],
): MetricReading {
  return {
    id,
    label,
    value,
    unit,
    trendPct,
    higherIsWorse,
    thresholds,
    history: history.length ? history : series(48, value, value * 0.22),
  };
}

export function generateDashboardSummary(): DashboardSummary {
  return {
    facility: FACILITY,
    healthScore: 74,
    activeAnomalies: 4,
    openRecommendations: 6,
    energyTodayKwh: 18_420,
    waterTodayL: 412_000,
    wasteTonsMonth: 96.4,
    aqiNow: 168,
  safetyScore: 82,
    sustainabilityScore: 71,
    lastUpdated: new Date().toISOString(),
  };
}

export function generateAnomalies(): Anomaly[] {
  const nowIso = new Date().toISOString();
  return [
    {
      id: 'an-1',
      moduleId: 'air-quality',
      title: 'PM2.5 spike in Zone B',
      description: 'Levels exceeded 3× the 7-day mean for 40 minutes.',
      severity: 'high',
      detectedAt: nowIso,
      zone: 'Zone B',
      confidence: 0.93,
    },
    {
      id: 'an-2',
      moduleId: 'energy',
      title: 'Night-time base load anomaly',
      description: 'Load did not follow the usual 22:00 downtrend.',
      severity: 'medium',
      detectedAt: nowIso,
      zone: 'Block D',
      confidence: 0.87,
    },
    {
      id: 'an-3',
      moduleId: 'water',
      title: 'Continuous night flow — possible leak',
      description: 'Sustained 11 L/min flow at 03:00 in Area South.',
      severity: 'high',
      detectedAt: nowIso,
      zone: 'Area South',
      confidence: 0.9,
    },
    {
      id: 'an-4',
      moduleId: 'waste',
      title: 'Bin overflow predicted',
      description: 'Zone C bin projected to overflow within 18 hours.',
      severity: 'medium',
      detectedAt: nowIso,
      zone: 'Zone C',
      confidence: 0.81,
    },
    {
      id: 'an-5',
      moduleId: 'safety',
      title: 'Near-miss cluster',
      description: '3 near-misses within 50 m of Gate 2 in 7 days.',
      severity: 'medium',
      detectedAt: nowIso,
      zone: 'Gate 2',
      confidence: 0.78,
    },
  ];
}

export function generateRecommendations(): Recommendation[] {
  return [
    {
      id: 'rec-1',
      moduleId: 'air-quality',
      title: 'Increase ventilation in Zone B',
      detail: 'Run AHU at 80% outdoor-air mode 14:00–18:00 while PM2.5 stays elevated.',
      impact: 'Est. 12–18% indoor PM2.5 reduction',
      effort: 'low',
      priority: 1,
    },
    {
      id: 'rec-2',
      moduleId: 'water',
      title: 'Dispatch leak inspection to Area South',
      detail: 'Night flow of 11 L/min suggests a distribution-line leak; inspect within 48 h.',
      impact: 'Save ~14,000 L/day',
      effort: 'medium',
      priority: 1,
  },
    {
      id: 'rec-3',
      moduleId: 'energy',
      title: 'Reschedule chiller to off-peak window',
      detail: 'Shifting 2×90 kW chillers to 01:00–05:00 trims peak demand charges.',
      impact: 'Est. ₹1.2L/month saving',
      effort: 'medium',
      priority: 2,
    },
    {
      id: 'rec-4',
      moduleId: 'waste',
      title: 'Reroute collection via Zone C first',
      detail: 'Overflow predicted in ~18 h; add an earlier pickup on the Wednesday route.',
      impact: 'Avoids 1 overflow event/week',
      effort: 'low',
      priority: 3,
    },
    {
      id: 'rec-5',
      moduleId: 'sustainability',
      title: 'Raise solar share by 6 percentage points',
      detail: 'Rooftop capacity utilisation is 64%; two additional arrays reach 70%.',
      impact: '≈ 9 tCO₂e/month avoided',
      effort: 'high',
      priority: 4,
    },
  ];
}

export function generateModulePayload(moduleId: ModuleId): ModulePayload {
  const nowIso = new Date().toISOString();

  switch (moduleId) {
    case 'air-quality': {
      const readings: MetricReading[] = [
        metric('pm25', 'PM2.5', 'µg/m³', 96, 8.2, { warn: 60, critical: 90 }),
        metric('pm10', 'PM10', 'µg/m³', 152, 5.1, { warn: 100, critical: 150 }),
        metric('co2', 'CO₂', 'ppm', 640, -3.4, { warn: 1000, critical: 1400 }),
        metric('voc', 'VOC', 'ppb', 210, 1.9, { warn: 300, critical: 500 }),
      ];
      const data: AirQualityData = {
        readings,
        aqi: 168,
        dominantPollutant: 'PM2.5',
        zonePm25: ZONES.slice(0, 4).map((zone, i) => ({ zone, pm25: 84 + i * 14 + rand() * 8 })),
      };
      return { moduleId, updatedAt: nowIso, data };
    }

    case 'waste': {
      const bins: BinStatus[] = ZONES.map((zone, i) => ({
        id: `bin-${i + 1}`,
        zone,
        fillPct: 38 + i * 11 + rand() * 6,
        overflowEtaHours: i === 2 ? 18 : i === 5 ? 64 : null,
        lastCollectedAt: new Date(Date.now() - (i + 1) * 36e5 * 9).toISOString(),
      }));
      const data: WasteData = {
        bins,
        composition: [
          { category: 'Wet', pct: 46 },
          { category: 'Dry', pct: 31 },
          { category: 'Biomedical', pct: 9 },
          { category: 'Hazardous', pct: 5 },
          { category: 'E-waste', pct: 4 },
          { category: 'Other', pct: 5 },
        ],
        divertedPct: 58,
        nextRouteOptimisation: 'Wed 06:00 — Gate 2 → Zone C → Zone B → Zone A',
      };
      return { moduleId, updatedAt: nowIso, data };
    }

    case 'energy': {
      const history = series(48, 760, 240);
      const zones: ZoneLoad[] = ZONES.map((zone, i) => ({
        zone,
        value: 120 + i * 46 + rand() * 30,
        capacity: 320,
      }));
      const data: EnergyData = {
        currentKw: 782,
        baselineKw: 705,
        zones,
        renewablePct: 34,
        history,
        peakForecastKw: 940,
      };
      return { moduleId, updatedAt: nowIso, data };
    }

    case 'water': {
      const data: WaterData = {
        dailyLitres: 412_000,
        sources: [
          { source: 'Municipal', litres: 210_000 },
          { source: 'Groundwater', litres: 128_000 },
          { source: 'Recycled', litres: 74_000 },
        ],
        leaks: [
          { zone: 'Area South', flowLpm: 11, detectedAt: new Date(Date.now() - 3 * 36e5).toISOString() },
        ],
        conservationTargetPct: 15,
        history: series(48, 17_200, 4_400),
      };
      return { moduleId, updatedAt: nowIso, data };
    }

    case 'traffic': {
      const data: TrafficData = {
        congestionByZone: ZONES.map((zone, i) => ({ zone, level: 22 + i * 13 + rand() * 10 })),
        parking: { occupied: 312, total: 420 },
        vehiclesToday: 1_846,
        peakHours: ['08:00–10:00', '16:30–18:30'],
        history: series(48, 120, 80),
      };
      return { moduleId, updatedAt: nowIso, data };
    }

    case 'assets': {
      const assets: AssetStatus[] = [
        { id: 'ch-1', name: 'Chiller #1', status: 'operational', utilisationPct: 82, hoursSinceService: 1_150, serviceIntervalHours: 2_000 },
        { id: 'ah-2', name: 'AHU Zone B', status: 'operational', utilisationPct: 76, hoursSinceService: 1_640, serviceIntervalHours: 2_000 },
        { id: 'gn-3', name: 'DG Set', status: 'idle', utilisationPct: 12, hoursSinceService: 1_940, serviceIntervalHours: 2_000 },
        { id: 'pu-4', name: 'Booster Pump 2', status: 'maintenance', utilisationPct: 0, hoursSinceService: 2_150, serviceIntervalHours: 2_000 },
        { id: 'lf-5', name: 'Lift Bank A', status: 'operational', utilisationPct: 64, hoursSinceService: 700, serviceIntervalHours: 3_000 },
        { id: 'st-6', name: 'STP Unit', status: 'fault', utilisationPct: 0, hoursSinceService: 1_200, serviceIntervalHours: 1_500 },
      ];
      const data: AssetData = {
        assets,
        overdueServiceCount: 2,
        predictiveAlerts: [
          { assetId: 'gn-3', message: 'DG Set approaching service window — schedule within 2 weeks', confidence: 0.88 },
          { assetId: 'ah-2', message: 'AHU Zone B bearing wear signature detected', confidence: 0.74 },
        ],
      };
      return { moduleId, updatedAt: nowIso, data };
    }

    case 'safety': {
      const incidents: Incident[] = [
        { id: 'in-1', type: 'Slip & near-fall', zone: 'Gate 2', occurredAt: new Date(Date.now() - 26 * 36e5).toISOString(), severity: 'medium', nearMiss: true },
        { id: 'in-2', type: 'Electrical panel contact', zone: 'Block D', occurredAt: new Date(Date.now() - 74 * 36e5).toISOString(), severity: 'high', nearMiss: false },
        { id: 'in-3', type: 'Vehicle-pedestrian conflict', zone: 'Gate 2', occurredAt: new Date(Date.now() - 140 * 36e5).toISOString(), severity: 'medium', nearMiss: true },
      ];
      const data: SafetySummary = {
        score: 82,
        trend: 'stable',
        incidents30d: incidents,
        hotspots: [
          { zone: 'Gate 2', count: 3 },
          { zone: 'Block D', count: 2 },
          { zone: 'Zone B', count: 1 },
        ],
      };
      return { moduleId, updatedAt: nowIso, data };
    }

    case 'sustainability':
    default: {
      const data: SustainabilityData = {
        score: 71,
        carbonTonsMonth: 148.2,
        renewablePct: 34,
        wasteReductionTargetPct: 20,
        progressPct: 62,
        breakdown: [
          { label: 'Energy', score: 66 },
          { label: 'Water', score: 74 },
          { label: 'Waste', score: 69 },
          { label: 'Air', score: 58 },
          { label: 'Safety', score: 82 },
        ],
      };
      return { moduleId, updatedAt: nowIso, data };
    }
  }
}

export function generateForecast(moduleId: ModuleId): Forecast {
  const base = series(48, 100, 20);
  const future: TimeSeriesPoint[] = [];
  const last = base[base.length - 1]?.value ?? 100;
  for (let h = 1; h <= 24; h += 1) {
    const drift = last + Math.sin(h / 4) * 8 + h * 0.35;
    const spread = 4 + h * 0.6;
    future.push({
      t: new Date(Date.now() + h * 36e5).toISOString(),
      value: Number(drift.toFixed(2)),
      lo: Number((drift - spread).toFixed(2)),
      hi: Number((drift + spread).toFixed(2)),
    });
  }
  return {
    moduleId,
    metric: 'composite index',
    unit: 'idx',
    horizonHours: 24,
    points: future,
    model: 'gradient-boosted regression (demo synthetic)',
    assumptions: [
      'Historical diurnal pattern continues for the horizon',
      'No extreme weather or occupancy shocks',
      'Confidence band widens linearly with horizon',
    ],
  };
}

/* ---------------- Mock router used by the api client ---------------- */

export async function mockGet<T>(path: string): Promise<T> {
  // Simulate realistic latency so skeletons are visible in the demo.
  await new Promise((r) => setTimeout(r, 120 + Math.random() * 260));

  const facilityMatch = /\/facilities\/([^/]+)/.exec(path);
  const facilityId = facilityMatch?.[1] ?? 'facility-demo-01';

  if (path === API_ENDPOINTS.facilities.dashboard(facilityId)) {
    return generateDashboardSummary() as T;
  }
  if (path === API_ENDPOINTS.facilities.anomalies(facilityId)) {
    return generateAnomalies() as T;
  }
  if (path === API_ENDPOINTS.facilities.recommendations(facilityId)) {
    return generateRecommendations() as T;
  }

  const moduleMatch = /\/modules\/([a-z-]+)$/.exec(path);
  if (moduleMatch) return generateModulePayload(moduleMatch[1] as ModuleId) as T;

  const forecastMatch = /\/forecast\/([a-z-]+)$/.exec(path);
  if (forecastMatch) return generateForecast(forecastMatch[1] as ModuleId) as T;

  throw Object.assign(new Error('Mock route not found'), { response: { status: 404 } });
}

export function mockModelUrl(moduleId: ModuleId | 'overview'): string | undefined {
  return modelForModule(moduleId as ModuleId)?.url;
}
