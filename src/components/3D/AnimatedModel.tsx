import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AnimationType } from '@/types';

interface Props {
  root: THREE.Object3D;
  nodeName: string;
  animationType: AnimationType;
  /** Live value 0–100 from the dashboard feed. */
  dataValue: number;
}

/**
 * Binds a live data value to a named node inside the GLB each frame.
 * - `color`:     node's materials map green → red as the value worsens
 * - `scale`:     node pulses with the value
 * - `rotation`:  node spins proportionally (flow/energy metaphors)
 * - `particle`:  node stretches vertically (level/emission metaphor)
 * The value is smoothed so refetch jumps don't jar the animation.
 */
export function AnimatedModel({ root, nodeName, animationType, dataValue }: Props) {
  const smoothed = useRef(50);

  useFrame((_, delta) => {
    smoothed.current = THREE.MathUtils.damp(smoothed.current, dataValue, 4, delta);
    const norm = THREE.MathUtils.clamp(smoothed.current / 100, 0, 1);

    const node = root.getObjectByName(nodeName);
    if (!node) return;

    switch (animationType) {
      case 'color': {
        const hue = (1 - norm) * 0.33; // 0 = red … 0.33 = green
        node.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial) {
                mat.color.setHSL(hue, 0.85, 0.5);
              }
            });
          }
        });
        break;
      }
      case 'particle':
        node.scale.y = 0.2 + norm * 1.8;
        break;
      case 'rotation':
        node.rotation.y += norm * 0.02 * (delta * 60);
        break;
      case 'scale': {
        const s = 0.55 + norm * 0.65;
        node.scale.set(s, s, s);
        break;
      }
      default:
        break;
    }
  });

  return null;
}
