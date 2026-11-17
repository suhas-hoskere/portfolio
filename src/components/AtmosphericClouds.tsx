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

let cachedCloudPlaneGeom: THREE.PlaneGeometry | null = null;
function getCachedCloudPlaneGeom() {
  if (!cachedCloudPlaneGeom) {
    cachedCloudPlaneGeom = new THREE.PlaneGeometry(1, 1);
  }
  return cachedCloudPlaneGeom;
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
  const planeGeom = useMemo(() => getCachedCloudPlaneGeom(), []);

  // 4 shared lightweight cloud layer materials (replaces 16 duplicate inline materials)
  const cloudMats = useMemo(() => {
    const makeMat = (opacity: number, color: string) =>
      new THREE.MeshBasicMaterial({
        map: cloudTexture,
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
    return {
      low: makeMat(0.42, '#fff5e6'),   // Warm sunrise-tinted coastal cumulus
      mid: makeMat(0.58, '#eef6ff'),   // Dense troposphere cloud punch deck
      high: makeMat(0.44, '#cfe6ff'),  // High stratosphere cirrus wisps
      sea: makeMat(0.0, '#bae6fd'),    // Stratospheric cloud sea horizon below
    };
  }, [cloudTexture]);

  useFrame((state) => {
    const scrollProgress = scrollProgressRef.current;
    if (!masterGroup.current) return;

    // Atmospheric phase is active from ground up to stratosphere exit (0.355)
    if (scrollProgress > 0.355) {
      masterGroup.current.visible = false;
      return;
    }
    masterGroup.current.visible = true;

    const t = state.clock.getElapsedTime();
    const climbProg = Math.max(0, (scrollProgress - 0.170) / (0.355 - 0.170));
    const atmoFadeOut = 1.0 - THREE.MathUtils.smoothstep(scrollProgress, 0.305, 0.355);

    // 1. Low coastal cumulus deck (drifts gently in morning breeze)
    if (lowCloudDeckRef.current) {
      lowCloudDeckRef.current.position.y = 5.0 - climbProg * 18.0;
      lowCloudDeckRef.current.position.x = Math.sin(t * 0.08) * 0.65;
      cloudMats.low.opacity = 0.42 * atmoFadeOut;
    }

    // 2. Dense mid-level cloud punch deck (peaks density during Stage 01 punch sp 0.25 - 0.30)
    if (midCloudDeckRef.current) {
      midCloudDeckRef.current.position.y = 10.0 - climbProg * 26.0;
      midCloudDeckRef.current.position.x = -Math.sin(t * 0.06) * 0.5;
      const punchBoost = scrollProgress >= 0.24 && scrollProgress <= 0.31
        ? Math.sin(((scrollProgress - 0.24) / 0.07) * Math.PI) * 0.28
        : 0;
      cloudMats.mid.opacity = (0.52 + punchBoost) * atmoFadeOut;
    }

    // 3. High cirrus deck
    if (highCloudDeckRef.current) {
      highCloudDeckRef.current.position.y = 16.0 - climbProg * 32.0;
      cloudMats.high.opacity = 0.45 * atmoFadeOut;
    }

    // 4. Sea of clouds below from the stratosphere (fades in smoothly then recedes into space)
    if (cloudSeaRef.current) {
      if (scrollProgress >= 0.235) {
        cloudSeaRef.current.visible = true;
        const seaProgress = Math.min((scrollProgress - 0.235) / 0.12, 1.0);
        cloudSeaRef.current.position.y = -2.8 - seaProgress * 4.8;
        const seaIn = THREE.MathUtils.smoothstep(scrollProgress, 0.235, 0.275);
        cloudMats.sea.opacity = 0.62 * seaIn * atmoFadeOut;
      } else {
        cloudSeaRef.current.visible = false;
        cloudMats.sea.opacity = 0;
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
            geometry={planeGeom}
            material={cloudMats.low}
            position={[x, Math.sin(i * 1.5) * 0.6, -1.5 - (i % 2) * 1.2]}
            scale={[4.5, 2.6, 1]}
          />
        ))}
      </group>

      {/* Layer 2: Main Dense Cloud Punch Deck */}
      <group ref={midCloudDeckRef} position={[0, 10, 0]}>
        {[-3.0, -1.0, 1.0, 3.0, -0.2].map((x, i) => (
          <mesh
            key={`cloud-mid-${i}`}
            geometry={planeGeom}
            material={cloudMats.mid}
            position={[x, Math.cos(i * 2) * 0.6, -1.0 - (i % 2) * 1.5]}
            scale={[5.8, 3.4, 1]}
          />
        ))}
      </group>

      {/* Layer 3: High Cirrus */}
      <group ref={highCloudDeckRef} position={[0, 16, 0]}>
        {[-2.0, 0, 2.0].map((x, i) => (
          <mesh
            key={`cloud-high-${i}`}
            geometry={planeGeom}
            material={cloudMats.high}
            position={[x, Math.sin(i * 2) * 0.5, -2.0 - i * 0.8]}
            scale={[6.2, 3.6, 1]}
          />
        ))}
      </group>

      {/* Layer 4: Stratospheric Cloud Horizon Below */}
      <group ref={cloudSeaRef} position={[0, -3.5, -2]} visible={false}>
        {[-3.0, 0, 3.0].map((x, i) => (
          <mesh
            key={`cloud-sea-${i}`}
            geometry={planeGeom}
            material={cloudMats.sea}
            position={[x, 0, -1.0]}
            rotation={[-Math.PI * 0.35, 0, 0]}
            scale={[7.4, 4.2, 1]}
          />
        ))}
      </group>
    </group>
  );
};
