import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneNodeBinding } from '@/types';
import { AnimatedModel } from './AnimatedModel';

interface Props {
  modelPath: string;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** Live data value 0–100 driving the animation bindings. */
  dataValue?: number;
  bindings?: SceneNodeBinding[];
  onLoad?: () => void;
}

/**
 * Loads a Blender-exported GLB, plays its baked looping animation(s), and
 * binds live dashboard data to named nodes. The scene is cloned so multiple
 * panels can mount the same asset safely.
 */
export function ModelLoader({
  modelPath,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  dataValue = 50,
  bindings = [],
  onLoad,
}: Props) {
  const { scene, animations } = useGLTF(modelPath);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // Play every baked clip on an infinite loop (spin / pulse / drift cycles).
  const mixer = useMemo(() => new THREE.AnimationMixer(cloned), [cloned]);
  useEffect(() => {
    animations.forEach((clip) => {
      mixer.clipAction(clip).play();
    });
    return () => {
      mixer.stopAllAction();
    };
  }, [mixer, animations]);
  useFrame((_, delta) => mixer.update(delta));

  useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={cloned} />
      {bindings.map((b) => (
        <AnimatedModel
          key={`${b.nodeName}-${b.animationType}`}
          root={cloned}
          nodeName={b.nodeName}
          animationType={b.animationType}
          dataValue={dataValue}
        />
      ))}
    </group>
  );
}

/** Preload helper for route-level warmup. */
export function preloadModel(url: string): void {
  useGLTF.preload(url);
}

export default ModelLoader;
