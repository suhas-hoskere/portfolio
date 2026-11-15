import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural fluffy cloud puff texture
let cachedCloudPuffTexture: THREE.CanvasTexture | null = null;

function getCachedCloudPuffTexture() {
  if (cachedCloudPuffTexture) return cachedCloudPuffTexture;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  for (let i = 0; i < 5; i++) {
    const cx = size * 0.5 + (Math.random() - 0.5) * 20;
    const cy = size * 0.5 + (Math.random() - 0.5) * 20;
    const r = 24 + Math.random() * 16;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    grad.addColorStop(0.5, 'rgba(235, 245, 255, 0.20)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  cachedCloudPuffTexture = new THREE.CanvasTexture(canvas);
  cachedCloudPuffTexture.generateMipmaps = false;
  cachedCloudPuffTexture.minFilter = THREE.LinearFilter;
  return cachedCloudPuffTexture;
}

interface AtmosphericCloudsProps {
  scrollProgressRef: React.MutableRefObject<number>;
  scrollSpeedRef: React.MutableRefObject<number>;
}

export const AtmosphericClouds: React.FC<AtmosphericCloudsProps> = ({
  scrollProgressRef,
}) => {
  const masterGroup = useRef<THREE.Group>(null);
  const lowCloudDeckRef = useRef<THREE.Group>(null);
  const midCloudDeckRef = useRef<THREE.Group>(null);
  const highCloudDeckRef = useRef<THREE.Group>(null);
  const cloudSeaRef = useRef<THREE.Group>(null);

  const cloudTexture = useMemo(() => getCachedCloudPuffTexture(), []);

  useFrame(() => {
    const scrollProgress = scrollProgressRef.current;
    if (!masterGroup.current) return;

    // Atmospheric phase is active from ground up to stratosphere exit (0.35)
    if (scrollProgress > 0.35) {
      masterGroup.current.visible = false;
      return;
    }
    masterGroup.current.visible = true;

    const climbProg = Math.max(0, (scrollProgress - 0.170) / (0.35 - 0.170));

    // 1. Low cloud deck
    if (lowCloudDeckRef.current) {
      lowCloudDeckRef.current.position.y = 5.0 - climbProg * 18.0;
    }

    // 2. Dense mid-level cloud punch deck
    if (midCloudDeckRef.current) {
      midCloudDeckRef.current.position.y = 10.0 - climbProg * 26.0;
    }

    // 3. High cirrus deck
    if (highCloudDeckRef.current) {
      highCloudDeckRef.current.position.y = 16.0 - climbProg * 32.0;
    }

    // 4. Sea of clouds below from the stratosphere
    if (cloudSeaRef.current) {
      if (scrollProgress >= 0.240) {
        cloudSeaRef.current.visible = true;
        const seaProgress = Math.min((scrollProgress - 0.240) / 0.12, 1.0);
        cloudSeaRef.current.position.y = -2.8 - seaProgress * 4.5;
      } else {
        cloudSeaRef.current.visible = false;
      }
    }
  });

  return (
    <group ref={masterGroup}>
      {/* Layer 1: Low Cumulus Wisps */}
      <group ref={lowCloudDeckRef} position={[0, 5, 0]}>
        {[-2.5, 0.5, 2.5, -1.5, 1.8].map((x, i) => (
          <mesh
            key={`cloud-low-${i}`}
            position={[x, Math.sin(i * 1.5) * 0.6, -1.5 - (i % 2) * 1.2]}
            scale={[4.5, 2.6, 1]}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={cloudTexture}
              transparent
              opacity={0.45}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>

      {/* Layer 2: Main Dense Cloud Punch Deck */}
      <group ref={midCloudDeckRef} position={[0, 10, 0]}>
        {[-3.0, -1.0, 1.0, 3.0, -0.2].map((x, i) => (
          <mesh
            key={`cloud-mid-${i}`}
            position={[x, Math.cos(i * 2) * 0.6, -1.0 - (i % 2) * 1.5]}
            scale={[5.5, 3.2, 1]}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={cloudTexture}
              transparent
              opacity={0.55}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>

      {/* Layer 3: High Cirrus */}
      <group ref={highCloudDeckRef} position={[0, 16, 0]}>
        {[-2.0, 0, 2.0].map((x, i) => (
          <mesh
            key={`cloud-high-${i}`}
            position={[x, Math.sin(i * 2) * 0.5, -2.0 - i * 0.8]}
            scale={[6.0, 3.5, 1]}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={cloudTexture}
              transparent
              opacity={0.45}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>

      {/* Layer 4: Stratospheric Cloud Horizon Below */}
      <group ref={cloudSeaRef} position={[0, -3.5, -2]} visible={false}>
        {[-3.0, 0, 3.0].map((x, i) => (
          <mesh
            key={`cloud-sea-${i}`}
            position={[x, 0, -1.0]}
            rotation={[-Math.PI * 0.35, 0, 0]}
            scale={[7.0, 4.0, 1]}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={cloudTexture}
              transparent
              opacity={0.6}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};
