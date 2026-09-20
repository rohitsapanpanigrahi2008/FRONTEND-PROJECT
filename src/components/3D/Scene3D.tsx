import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useWindowSize } from '@/hooks/useWindowSize';
import { LoadingSpinner } from '@/components/Common/LoadingSpinner';

interface Props {
  children: React.ReactNode;
  interactive?: boolean;
  className?: string;
  cameraZ?: number;
  autoRotate?: boolean;
}

/**
 * Shared R3F canvas. Quality scales with device: DPR is capped on mobile and
 * the environment is lit procedurally (no external HDRI fetch → CSP/offline safe).
 */
export function Scene3D({
  children,
  interactive = true,
  className = '',
  cameraZ = 5.5,
  autoRotate = false,
}: Props) {
  const { isMobile } = useWindowSize();
  const [ready, setReady] = useState(false);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <Canvas
        camera={{ position: [0, 1.1, cameraZ], fov: 45 }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        aria-hidden="true"
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 4]} intensity={1.25} color="#dbeafe" />
        <pointLight position={[-4, 2, -4]} intensity={0.5} color="#38bdf8" />
        <pointLight position={[0, -3, 2]} intensity={0.35} color="#22d3a7" />

        <SceneReadyReporter onReady={() => setReady(true)}>{children}</SceneReadyReporter>

        {interactive && (
          <OrbitControls
            enablePan={false}
            enableZoom={!isMobile}
            autoRotate={autoRotate}
            autoRotateSpeed={0.6}
            minDistance={3}
            maxDistance={9}
            makeDefault
          />
        )}
      </Canvas>

      {!ready && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="lg" label="Loading 3D scene" />
        </div>
      )}
      <span className="pointer-events-none absolute bottom-2 right-3 text-[10px] uppercase tracking-wider text-slate-500">
        drag to rotate
      </span>
    </div>
  );
}

/**
 * Reports readiness once its children commit — used to hide the spinner
 * overlay exactly when content first appears inside the canvas.
 */
function SceneReadyReporter({
  children,
  onReady,
}: {
  children: React.ReactNode;
  onReady: () => void;
}) {
  return <group onUpdate={onReady}>{children}</group>;
}
