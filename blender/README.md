# Blender 3D Pipeline

Generates every 3D asset used by the dashboard — no manual modelling required.
The script builds each scene procedurally, animates it with 10-second seamless
loops, and exports optimized GLB directly into `public/models/`.

## Usage

```bash
# All models (also available as npm run blender:models)
blender --background --python blender/scripts/generate_all_models.py -- --out public/models

# Just one model
blender --background --python blender/scripts/generate_all_models.py -- \
  --out public/models --only energy-flow
```

Works headless on Blender 3.6 LTS → 5.x. New keyframes default to **linear**
interpolation (set via user preferences) so exported loops are seamless; this also
avoids API differences in action/fcurve handling across versions.

## Models & data bindings

| Model (GLB) | Module | Scene contents | Data-bound node → behaviour |
|---|---|---|---|
| `facility-globe.glb` | overview | Rotating earth + wire shell + pulsing status markers | `Globe` → rotation speed ∝ health score |
| `air-quality-viz.glb` | air-quality | Sensor ring + 140 drifting pollutant motes (green→red) | `SensorRing` → scale ∝ PM2.5 |
| `energy-flow.glb` | energy | Pulsing core, spinning rings, radial cables with travelling pulses | `Core` → colour (green→red) + emissive ∝ load |
| `waste-station.glb` | waste | 4 bins with fill levels; fullest bin's lid opens | `Fill_3` → height ∝ max bin fill |
| `water-tank.glb` | water | Tank, oscillating pipes, drip | `WaterLevel` → height ∝ daily use |
| `traffic-flow.glb` | traffic | Two-lane road, vehicles looping both directions, pulsing hotspot | `Hotspot` → scale ∝ congestion |
| `asset-tracker.glb` | assets | 4 machines with status beacons (operational/idle/fault/maintenance) | `Status_3` → scale pulse ∝ utilisation |
| `safety-beacon.glb` | safety | Perimeter pole, pulsing beacon, spinning halo | `Beacon` → colour ∝ safety score |
| `sustainability-meter.glb` | sustainability | Gauge dial with banded ticks and sweeping needle | `Needle` → colour ∝ score |

Baked animations (spins, pulses, drift) play automatically in-app via
`AnimationMixer`. Data-bound nodes intentionally carry **no** baked animation on
their controlled channel — the live value drives it each frame, so the two systems
never fight.

## Design conventions

- **Low-poly by design**: primitives + flat shading; largest asset (air-quality,
  140 motes) is ~460 KB, total bundle ≈0.7 MB.
- **PBR everywhere**: Principled BSDF with emissive status colours that the app
  can re-tint live (`MeshStandardMaterial.color`).
- **Naming is the contract**: frontend bindings in
  `src/components/3D/ModuleViz3D.tsx` reference node names exactly as created here.
  Rename on both sides together.
- **Draco optional**: export tries Draco first, falls back to plain GLB where the
  Blender build lacks it. Enable it in Blender's preferences → Add-ons →
  " Draco mesh compression" for ~40-60% smaller files.

## Extending

1. Add a `build_your_model()` function returning `{ "data-node": <object> }`
   (use `new_material`, `spin`, `pulse`, `slide` helpers).
2. Register it in `BUILDERS`.
3. Add matching manifest entry in `src/types/blender.ts` and a binding in
   `ModuleViz3D.tsx`.
4. Run the script; the asset is picked up automatically (HEAD-checked at runtime).
