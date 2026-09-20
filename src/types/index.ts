/**
 * Global application types.
 * Shared contracts between the frontend, the backend REST API and the 3D asset pipeline.
 */

export type UserRole = 'admin' | 'operator' | 'analyst';

export type FacilityType = 'hospital' | 'college' | 'industrial' | 'municipal' | 'campus';

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  city: string;
  state: string;
  areaSqMeters: number;
  latitude: number;
  longitude: number;
}

export type ModuleId =
  | 'air-quality'
  | 'waste'
  | 'energy'
  | 'water'
  | 'traffic'
  | 'assets'
  | 'safety'
  | 'sustainability';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface TimeSeriesPoint {
  /** ISO timestamp */
  t: string;
  value: number;
  /** Optional forecast confidence band */
  lo?: number;
  hi?: number;
}

export interface MetricReading {
  id: string;
  label: string;
  value: number;
  unit: string;
  /** Positive/negative percentage change over the last window */
  trendPct: number;
  /** Higher-is-worse metrics invert the colour semantics */
  higherIsWorse: boolean;
  thresholds: { warn: number; critical: number };
  history: TimeSeriesPoint[];
}

export interface Anomaly {
  id: string;
  moduleId: ModuleId;
  title: string;
  description: string;
  severity: Severity;
  detectedAt: string;
  zone?: string;
  confidence: number;
}

export interface Recommendation {
  id: string;
  moduleId: ModuleId;
  title: string;
  detail: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  priority: number;
}

export interface Forecast {
  moduleId: ModuleId;
  metric: string;
  unit: string;
  horizonHours: number;
  points: TimeSeriesPoint[];
  assumptions: string[];
  model: string;
}

export interface BinStatus {
  id: string;
  zone: string;
  fillPct: number;
  /** Predicted hours until overflow at current fill rate */
  overflowEtaHours: number | null;
  lastCollectedAt: string;
}

export interface ZoneLoad {
  zone: string;
  value: number;
  capacity: number;
}

export interface AssetStatus {
  id: string;
  name: string;
  status: 'operational' | 'idle' | 'maintenance' | 'fault';
  utilisationPct: number;
  hoursSinceService: number;
  serviceIntervalHours: number;
}

export interface Incident {
  id: string;
  type: string;
  zone: string;
  occurredAt: string;
  severity: Severity;
  nearMiss: boolean;
}

export interface SafetySummary {
  score: number;
  trend: 'up' | 'down' | 'stable';
  incidents30d: Incident[];
  hotspots: { zone: string; count: number }[];
}

export interface AirQualityData {
  readings: MetricReading[];
  aqi: number;
  dominantPollutant: string;
  zonePm25: { zone: string; pm25: number }[];
}

export interface WasteData {
  bins: BinStatus[];
  composition: { category: string; pct: number }[];
  divertedPct: number;
  nextRouteOptimisation: string;
}

export interface EnergyData {
  currentKw: number;
  baselineKw: number;
  zones: ZoneLoad[];
  renewablePct: number;
  history: TimeSeriesPoint[];
  peakForecastKw: number;
}

export interface WaterData {
  dailyLitres: number;
  sources: { source: string; litres: number }[];
  leaks: { zone: string; flowLpm: number; detectedAt: string }[];
  conservationTargetPct: number;
  history: TimeSeriesPoint[];
}

export interface TrafficData {
  congestionByZone: { zone: string; level: number }[];
  parking: { occupied: number; total: number };
  vehiclesToday: number;
  peakHours: string[];
  history: TimeSeriesPoint[];
}

export interface AssetData {
  assets: AssetStatus[];
  overdueServiceCount: number;
  predictiveAlerts: { assetId: string; message: string; confidence: number }[];
}

export interface SustainabilityData {
  score: number;
  carbonTonsMonth: number;
  renewablePct: number;
  wasteReductionTargetPct: number;
  progressPct: number;
  breakdown: { label: string; score: number }[];
}

export interface ModulePayload {
  moduleId: ModuleId;
  updatedAt: string;
  data:
    | AirQualityData
    | WasteData
    | EnergyData
    | WaterData
    | TrafficData
    | AssetData
    | SafetySummary
    | SustainabilityData;
}

export interface DashboardSummary {
  facility: Facility;
  healthScore: number;
  activeAnomalies: number;
  openRecommendations: number;
  energyTodayKwh: number;
  waterTodayL: number;
  wasteTonsMonth: number;
  aqiNow: number;
  safetyScore: number;
  sustainabilityScore: number;
  lastUpdated: string;
}

/* ---------- 3D pipeline types ---------- */

export type AnimationType = 'particle' | 'color' | 'rotation' | 'scale';

export interface ModelAsset {
  id: string;
  moduleId: ModuleId | 'overview';
  name: string;
  /** Vite base-relative URL, e.g. /models/facility-globe.glb */
  url: string;
  maxBytes: number;
}

export interface SceneNodeBinding {
  /** Node name inside the GLB hierarchy that reacts to live data */
  nodeName: string;
  animationType: AnimationType;
}

export interface ApiError {
  status?: number;
  message: string;
}
