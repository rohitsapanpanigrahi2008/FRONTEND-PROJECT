import type { ModuleId, Severity } from '@/types';

export const APP_NAME = 'Facility Intelligence';
export const APP_TAGLINE = 'Sustainable Estate Dashboard';

/** Client-side session behaviour (defence in depth; the server remains authoritative). */
export const SESSION = {
  /** Idle timeout before forced sign-out, in minutes. */
  IDLE_TIMEOUT_MIN: 30,
  /** Warn the user this many minutes before forced sign-out. */
  WARNING_BEFORE_MIN: 2,
} as const;

export const RATE_LIMITS = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  api: { maxAttempts: 100, windowMs: 60 * 1000 },
  upload: { maxAttempts: 10, windowMs: 60 * 1000 },
} as const;

export const API_TIMEOUT_MS = 30_000;

export interface ModuleMeta {
  id: ModuleId;
  name: string;
  short: string;
  description: string;
  accent: string;
  icon: string;
}

export const MODULES: ModuleMeta[] = [
  {
    id: 'air-quality',
    name: 'Air Quality Monitor',
    short: 'Air',
    description: 'PM2.5, PM10, CO₂ and VOC trends with hotspot zones.',
    accent: '#38bdf8',
    icon: 'Wind',
  },
  {
    id: 'waste',
    name: 'Waste Management',
    short: 'Waste',
    description: 'Bin fill levels, overflow prediction and route planning.',
    accent: '#a78bfa',
    icon: 'Recycle',
  },
  {
    id: 'energy',
    name: 'Energy Consumption',
    short: 'Energy',
    description: 'Live load by zone, peak forecasts and savings advice.',
    accent: '#fbbf24',
    icon: 'Zap',
  },
  {
    id: 'water',
    name: 'Water Usage',
    short: 'Water',
    description: 'Source mix, leak alerts and conservation targets.',
    accent: '#2dd4bf',
    icon: 'Droplets',
  },
  {
    id: 'traffic',
    name: 'Traffic & Parking',
    short: 'Traffic',
    description: 'Congestion hotspots and parking availability.',
    accent: '#fb923c',
    icon: 'Car',
  },
  {
    id: 'assets',
    name: 'Asset Utilisation',
    short: 'Assets',
    description: 'Equipment status and predictive maintenance.',
    accent: '#94a3b8',
    icon: 'Cpu',
  },
  {
    id: 'safety',
    name: 'Safety Incidents',
    short: 'Safety',
    description: 'Incident trends, near-misses and safety score.',
    accent: '#fb7185',
    icon: 'ShieldAlert',
  },
  {
    id: 'sustainability',
    name: 'Sustainability Scorecard',
    short: 'Score',
    description: 'Composite score, carbon footprint and targets.',
    accent: '#22d3a7',
    icon: 'Leaf',
  },
];

export const SEVERITY_COLORS: Record<Severity, string> = {
  low: '#22d3a7',
  medium: '#fbbf24',
  high: '#fb923c',
  critical: '#fb7185',
};

/** AQI breakpoints used for colouring (simplified Indian CPCB scale). */
export const AQI_BANDS = [
  { max: 50, label: 'Good', color: '#22d3a7' },
  { max: 100, label: 'Satisfactory', color: '#a3e635' },
  { max: 200, label: 'Moderate', color: '#fbbf24' },
  { max: 300, label: 'Poor', color: '#fb923c' },
  { max: 400, label: 'Very Poor', color: '#fb7185' },
  { max: Infinity, label: 'Severe', color: '#f43f5e' },
] as const;

export function aqiBand(aqi: number) {
  return AQI_BANDS.find((b) => aqi <= b.max) ?? AQI_BANDS[AQI_BANDS.length - 1];
}
