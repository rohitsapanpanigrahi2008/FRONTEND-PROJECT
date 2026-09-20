import { Suspense, lazy, useEffect, useState } from 'react';
import { Scene3D } from './Scene3D';
import {
  ProceduralAirField,
  ProceduralBins,
  ProceduralEnergyCore,
  ProceduralGlobe,
} from './procedural';
import { MODEL_ASSETS, modelForModule } from '@/types/blender';
import type { ModuleId, SceneNodeBinding } from '@/types';

const ModelLoader = lazy(() =>
  import('./ModelLoader').then((m) => ({ default: m.ModelLoader })),
);

/**
 * Per-module live-data bindings. Node names match the objects created by
 * `blender/scripts/generate_all_models.py` inside each GLB.
 */
const BINDINGS: Record<string, SceneNodeBinding> = {
  overview: { nodeName: 'Globe', animationType: 'rotation' },
  'air-quality': { nodeName: 'SensorRing', animationType: 'scale' },
  energy: { nodeName: 'Core', animationType: 'color' },
  waste: { nodeName: 'Fill_3', animationType: 'particle' },
  water: { nodeName: 'WaterLevel', animationType: 'particle' },
  traffic: { nodeName: 'Hotspot', animationType: 'scale' },
  assets: { nodeName: 'Status_3', animationType: 'scale' },
  safety: { nodeName: 'Beacon', animationType: 'color' },
  sustainability: { nodeName: 'Needle', animationType: 'color' },
};

interface Props {
  moduleId: ModuleId | 'overview';
  /** Live dashboard value 0–100 driving colours/motion. */
  dataValue: number;
  className?: string;
  autoRotate?: boolean;
}

/**
 * Renders the Blender GLB for a module when the asset exists; otherwise falls
 * back to a procedural Three.js twin so the demo never shows an empty panel.
 * The lazy GLB branch is wrapped in an error boundary per module card.
 */
export function ModuleViz3D({ moduleId, dataValue, className = '', autoRotate = true }: Props) {
  const asset =
    moduleId === 'overview'
      ? MODEL_ASSETS.find((m) => m.id === 'facility-globe')
      : modelForModule(moduleId);
  const [glbAvailable, setGlbAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!asset) {
      setGlbAvailable(false);
      return;
    }
    let cancelled = false;
    fetch(asset.url, { method: 'HEAD' })
      .then((res) => {
        if (!cancelled) setGlbAvailable(res.ok);
      })
      .catch(() => {
        if (!cancelled) setGlbAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, [asset]);

  const showGlb = glbAvailable === true && asset !== undefined;

  return (
    <Scene3D className={className} autoRotate={autoRotate} cameraZ={moduleId === 'overview' ? 4.6 : 5.4}>
      {showGlb ? (
        <Suspense fallback={<ProceduralFallback moduleId={moduleId} value={dataValue} />}>
          <ModelLoader
            modelPath={asset.url}
            scale={moduleId === 'overview' ? 1.15 : 1}
            dataValue={dataValue}
            bindings={BINDINGS[moduleId] ? [BINDINGS[moduleId]] : []}
          />
        </Suspense>
      ) : (
        <ProceduralFallback moduleId={moduleId} value={dataValue} />
      )}
    </Scene3D>
  );
}

function ProceduralFallback({ moduleId, value }: { moduleId: ModuleId | 'overview'; value: number }) {
  switch (moduleId) {
    case 'overview':
      return <ProceduralGlobe value={value} />;
    case 'air-quality':
      return <ProceduralAirField value={value} />;
    case 'energy':
      return <ProceduralEnergyCore value={value} />;
    case 'waste':
      return <ProceduralBins value={value} />;
    default:
      // Water, traffic, assets, safety, sustainability share the energy-core
      // metaphor with a neutral blue until dedicated GLBs ship.
      return <ProceduralEnergyCore value={value} />;
  }
}

/* ------- Named exports for the per-module component files ------- */
export { ProceduralGlobe as FacilityGlobeFallback };
