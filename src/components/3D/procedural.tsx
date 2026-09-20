import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Hand-built Three.js fallbacks mirroring each Blender asset. They guarantee
 * the demo always shows a live 3D scene, even before the GLB pipeline runs.
 * Each accepts a normalised 0–100 data value and animates in useFrame.
 */

export function ProceduralGlobe({ value, autoRotate = true }: { value: number; autoRotate?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const markers = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const phi = Math.acos(1 - (2 * (i + 0.5)) / 7);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        return new THREE.Vector3().setFromSphericalCoords(1.32, phi, theta);
      }),
    [],
  );

  useFrame((_, delta) => {
    if (group.current && autoRotate) group.current.rotation.y += delta * 0.18;
  });

  const norm = value / 100;

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[1.25, 48, 48]} />
        <meshStandardMaterial color="#0b3a5c" roughness={0.55} metalness={0.15} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.28, 32, 32]} />
        <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.08} />
      </mesh>
      {markers.map((pos, i) => (
        <PulsingMarker key={i} position={pos} healthy={i / markers.length < norm} />
      ))}
    </group>
  );
}

function PulsingMarker({ position, healthy }: { position: THREE.Vector3; healthy: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const t = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    t.current += delta * 3;
    if (ref.current) {
      const s = 1 + Math.sin(t.current) * 0.35;
      ref.current.scale.setScalar(s);
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.045, 12, 12]} />
      <meshBasicMaterial color={healthy ? '#22d3a7' : '#fb7185'} />
    </mesh>
  );
}

export function ProceduralAirField({ value }: { value: number }) {
  const points = useRef<THREE.Points>(null);
  const count = 260;

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 3.4;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3.4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3.4;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const hue = (1 - value / 100) * 0.33;

  useFrame((state, delta) => {
    if (!points.current) return;
    points.current.rotation.y += delta * (0.05 + (value / 100) * 0.25);
    const mat = points.current.material as THREE.PointsMaterial;
    mat.color.setHSL(hue, 0.85, 0.55);
    mat.size = 0.028 + (value / 100) * 0.035;
    points.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.08;
  });

  return <points ref={points} geometry={geometry} />;
}

export function ProceduralEnergyCore({ value }: { value: number }) {
  const ring = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const norm = value / 100;

  useFrame((state, delta) => {
    if (ring.current) {
      ring.current.rotation.z += delta * (0.4 + norm * 2.2);
      const s = 1 + Math.sin(state.clock.elapsedTime * 2.4) * 0.04 * norm;
      ring.current.scale.setScalar(s);
    }
    if (core.current) {
      const mat = core.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.6 + norm * 1.8 + Math.sin(state.clock.elapsedTime * 5) * 0.15;
    }
  });

  const hue = (1 - norm) * 0.33;

  return (
    <group>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.85, 1]} />
        <meshStandardMaterial
          color={new THREE.Color().setHSL(hue, 0.7, 0.45)}
          emissive={new THREE.Color().setHSL(hue, 0.9, 0.5)}
          emissiveIntensity={1}
          roughness={0.3}
          metalness={0.4}
          flatShading
        />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[1.35, 0.035, 12, 90]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <mesh rotation={[Math.PI / 1.7, 0.5, 0]}>
        <torusGeometry args={[1.55, 0.02, 10, 90]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

export function ProceduralBins({ value }: { value: number }) {
  const group = useRef<THREE.Group>(null);
  const norm = value / 100;
  const bins = 4;

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.22;
  });

  return (
    <group ref={group}>
      {Array.from({ length: bins }, (_, i) => {
        const fill = Math.min(1, norm + i * 0.08);
        const hue = (1 - fill) * 0.33;
        const angle = (i / bins) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(angle) * 1.1, 0, Math.sin(angle) * 1.1]}>
            <mesh position={[0, 0.55, 0]}>
              <boxGeometry args={[0.5, 1.1, 0.5]} />
              <meshStandardMaterial color="#334155" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.15 + fill * 0.9, 0]}>
              <boxGeometry args={[0.42, Math.max(0.04, fill), 0.42]} />
              <meshStandardMaterial
                color={new THREE.Color().setHSL(hue, 0.85, 0.5)}
                emissive={new THREE.Color().setHSL(hue, 0.9, 0.35)}
                emissiveIntensity={0.5}
              />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.1, 40]} />
        <meshBasicMaterial color="#0f1b33" />
      </mesh>
    </group>
  );
}
