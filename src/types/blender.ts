import type { ModelAsset, ModuleId } from './index';

/**
 * Manifest of GLB assets produced by the Blender pipeline
 * (`blender/scripts/generate_all_models.py`) into `public/models/`.
 * Size budgets keep first-load light: models are lazy-loaded per module view.
 */
export const MODEL_ASSETS: ModelAsset[] = [
  { id: 'facility-globe', moduleId: 'overview', name: 'Facility Globe', url: '/models/facility-globe.glb', maxBytes: 2_000_000 },
  { id: 'air-quality-viz', moduleId: 'air-quality', name: 'Air Quality Viz', url: '/models/air-quality-viz.glb', maxBytes: 2_000_000 },
  { id: 'energy-flow', moduleId: 'energy', name: 'Energy Flow', url: '/models/energy-flow.glb', maxBytes: 2_000_000 },
  { id: 'waste-station', moduleId: 'waste', name: 'Waste Station', url: '/models/waste-station.glb', maxBytes: 2_000_000 },
  { id: 'water-tank', moduleId: 'water', name: 'Water Tank', url: '/models/water-tank.glb', maxBytes: 2_000_000 },
  { id: 'traffic-flow', moduleId: 'traffic', name: 'Traffic Flow', url: '/models/traffic-flow.glb', maxBytes: 2_000_000 },
  { id: 'asset-tracker', moduleId: 'assets', name: 'Asset Tracker', url: '/models/asset-tracker.glb', maxBytes: 2_000_000 },
  { id: 'safety-beacon', moduleId: 'safety', name: 'Safety Beacon', url: '/models/safety-beacon.glb', maxBytes: 2_000_000 },
  { id: 'sustainability-meter', moduleId: 'sustainability', name: 'Sustainability Meter', url: '/models/sustainability-meter.glb', maxBytes: 2_000_000 },
];

export function modelForModule(moduleId: ModuleId): ModelAsset | undefined {
  return MODEL_ASSETS.find((m) => m.moduleId === moduleId);
}
