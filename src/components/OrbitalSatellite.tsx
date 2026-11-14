import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getCachedSolarPanelTexture, getCachedGoldMliTexture } from './aerospaceTextures';

interface OrbitalSatelliteProps {
  designation: string;
  orbitRadius: number;    // True orbital radius from Earth center (14.8 - 16.6 units)
  tiltForward: number;    // Orbit plane tilt forward toward camera (+Z)
  tiltDiagonal: number;   // Orbit plane tilt diagonally across horizon (-X to +X)
  rotY: number;           // Longitude of ascending node around Earth's polar axis
  orbitSpeed: number;     // Angular orbital velocity in radians/sec
  initialAngle: number;   // Initial orbital phase angle
  beaconColor?: string;
  busType?: 'gold' | 'white';
  scrollProgressRef: React.MutableRefObject<number>;
}

/**
 * Computes a 3D point on a true great-circle orbit encircling Earth's center (0, 0, 0).
 */
export function getGreatCircleOrbitalPosition(
  R: number,
  tiltForward: number,
  tiltDiagonal: number,
  rotY: number,
  theta: number
): THREE.Vector3 {
  // 1. Base great-circle in X-Y plane around Earth center (0, 0, 0)
  const x0 = R * Math.cos(theta);
  const y0 = R * Math.sin(theta);
  const z0 = 0;

  // 2. Tilt forward toward camera (+Z) around X axis
  const y1 = y0 * Math.cos(tiltForward) - z0 * Math.sin(tiltForward);
  const z1 = y0 * Math.sin(tiltForward) + z0 * Math.cos(tiltForward);
  const x1 = x0;

  // 3. Tilt diagonally across horizon around Z axis
  const x2 = x1 * Math.cos(tiltDiagonal) - y1 * Math.sin(tiltDiagonal);
  const y2 = x1 * Math.sin(tiltDiagonal) + y1 * Math.cos(tiltDiagonal);
  const z2 = z1;

  // 4. Rotate around polar Y axis by rotY
  const x = x2 * Math.cos(rotY) + z2 * Math.sin(rotY);
  const y = y2;
  const z = -x2 * Math.sin(rotY) + z2 * Math.cos(rotY);

  return new THREE.Vector3(x, y, z);
}

export const OrbitalSatellite: React.FC<OrbitalSatelliteProps> = ({
  orbitRadius,
  tiltForward,
  tiltDiagonal,
  rotY,
  orbitSpeed,
  initialAngle = 0,
  beaconColor = '#38bdf8',
  busType = 'gold',
  scrollProgressRef,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const craftOrientationRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.Mesh>(null);
  const dishRef = useRef<THREE.Group>(null);

  const solarTexture = useMemo(() => getCachedSolarPanelTexture(), []);
  const goldMliTexture = useMemo(() => getCachedGoldMliTexture(), []);

  const materials = useMemo(() => {
    return {
      goldBus: new THREE.MeshStandardMaterial({
        map: goldMliTexture,
        roughness: 0.24,
        metalness: 0.88,
        transparent: true,
        opacity: 0.0,
      }),
      whiteBus: new THREE.MeshStandardMaterial({
        color: '#f1f5f9',
        roughness: 0.28,
        metalness: 0.35,
        transparent: true,
        opacity: 0.0,
      }),
      solarPhotovoltaic: new THREE.MeshStandardMaterial({
        map: solarTexture,
        roughness: 0.18,
        metalness: 0.45,
        emissive: '#092147',
        emissiveIntensity: 0.40,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0,
      }),
      solarFrame: new THREE.MeshStandardMaterial({
        color: '#0f172a',
        roughness: 0.38,
        metalness: 0.75,
        transparent: true,
        opacity: 0.0,
      }),
      dishMetal: new THREE.MeshStandardMaterial({
        color: '#e2e8f0',
        roughness: 0.18,
        metalness: 0.85,
        transparent: true,
        opacity: 0.0,
      }),
      feedHorn: new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        roughness: 0.2,
        metalness: 0.9,
        transparent: true,
        opacity: 0.0,
      }),
      opticalSensor: new THREE.MeshStandardMaterial({
        color: '#0284c7',
        roughness: 0.08,
        metalness: 0.95,
        transparent: true,
        opacity: 0.0,
      }),
      thrusterTitanium: new THREE.MeshStandardMaterial({
        color: '#475569',
        roughness: 0.3,
        metalness: 0.8,
        transparent: true,
        opacity: 0.0,
      }),
      beaconMat: new THREE.MeshBasicMaterial({
        color: beaconColor,
        transparent: true,
        opacity: 0.0,
      }),
      orbitPathMat: new THREE.LineBasicMaterial({
        color: beaconColor,
        transparent: true,
        opacity: 0.0,
      }),
    };
  }, [goldMliTexture, solarTexture, beaconColor]);

  // Complete Great-Circle Orbital Ring encircling the Earth globe (128 segments)
  const orbitLine = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(getGreatCircleOrbitalPosition(orbitRadius, tiltForward, tiltDiagonal, rotY, theta));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.Line(geom, materials.orbitPathMat);
  }, [orbitRadius, tiltForward, tiltDiagonal, rotY, materials.orbitPathMat]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const sp = scrollProgressRef.current;

    // Satellites synchronize strictly with Earth (0.285 to 0.475)
    // NEVER appears late or pops in after Earth is already there!
    let satOpacity = 0;
    if (sp >= 0.285 && sp <= 0.475) {
      if (sp < 0.34) {
        satOpacity = (sp - 0.285) / 0.055;
      } else if (sp > 0.43) {
        satOpacity = Math.max(1.0 - (sp - 0.43) / 0.045, 0.0);
      } else {
        satOpacity = 1.0;
      }
    }

    const isVisible = satOpacity > 0.005;
    orbitLine.visible = isVisible;

    if (!isVisible) {
      if (groupRef.current) groupRef.current.visible = false;
      return;
    }

    if (groupRef.current) {
      groupRef.current.visible = true;
      const s = Math.min(Math.max(satOpacity, 0.001), 1.0);
      groupRef.current.scale.set(s, s, s);

      // Orbital angle advances continuously with time and silky smooth scroll inertia
      const scrollAdvancement = Math.max(0, sp - 0.285) * 1.8;
      const currentAngle = initialAngle + t * orbitSpeed + scrollAdvancement;

      // True planetary orbit position around Earth's center (0, 0, 0)
      const pos = getGreatCircleOrbitalPosition(
        orbitRadius,
        tiltForward,
        tiltDiagonal,
        rotY,
        currentAngle
      );
      groupRef.current.position.copy(pos);

      // Tangential velocity orientation: align satellite forward along its orbital track
      const forwardPos = getGreatCircleOrbitalPosition(
        orbitRadius,
        tiltForward,
        tiltDiagonal,
        rotY,
        currentAngle + 0.03
      );
      groupRef.current.lookAt(forwardPos);

      // Dish antenna points towards Earth Nadir (0, 0, 0 in parent earthGroup coordinate space)
      if (dishRef.current) {
        dishRef.current.lookAt(0, 0, 0);
      }
    }

    // Synchronize material opacities
    materials.goldBus.opacity = satOpacity;
    materials.whiteBus.opacity = satOpacity;
    materials.solarPhotovoltaic.opacity = satOpacity;
    materials.solarFrame.opacity = satOpacity;
    materials.dishMetal.opacity = satOpacity;
    materials.feedHorn.opacity = satOpacity;
    materials.opticalSensor.opacity = satOpacity;
    materials.thrusterTitanium.opacity = satOpacity;
    materials.beaconMat.opacity = satOpacity;
    // Ultra-faint elegant orbital trace lines
    materials.orbitPathMat.opacity = satOpacity * 0.14;

    // Subtle beacon LED pulse
    if (beaconRef.current) {
      const pulse = 0.85 + Math.sin(t * 4.5 + initialAngle * 2.0) * 0.30;
      beaconRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <>
      {/* Delicate Great-Circle Orbital Trace Ring */}
      <primitive object={orbitLine} />

      {/* Orbiting Spacecraft Body */}
      <group ref={groupRef} visible={false}>
        <group ref={craftOrientationRef}>
          {/* 1. Hexagonal Prismatic Avionics Bus */}
          <mesh material={busType === 'white' ? materials.whiteBus : materials.goldBus}>
            <cylinderGeometry args={[0.34, 0.34, 0.54, 6]} />
          </mesh>

          {/* Top & Bottom Structural Bulkheads */}
          <mesh position={[0, 0.28, 0]} material={materials.solarFrame}>
            <cylinderGeometry args={[0.35, 0.35, 0.03, 6]} />
          </mesh>
          <mesh position={[0, -0.28, 0]} material={materials.solarFrame}>
            <cylinderGeometry args={[0.35, 0.35, 0.03, 6]} />
          </mesh>

          {/* 2. Earth Observation / Multi-Spectral Camera Aperture (Facing Earth) */}
          <group position={[0, 0, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh material={materials.thrusterTitanium}>
              <cylinderGeometry args={[0.12, 0.15, 0.16, 16]} />
            </mesh>
            <mesh position={[0, 0.085, 0]} material={materials.opticalSensor}>
              <cylinderGeometry args={[0.11, 0.11, 0.02, 16]} />
            </mesh>
          </group>

          {/* 3. Steerable High-Gain Parabolic Telemetry Dish Antenna */}
          <group ref={dishRef} position={[0, 0.38, 0.12]}>
            <mesh rotation={[Math.PI / 4, 0, 0]} material={materials.dishMetal}>
              <coneGeometry args={[0.26, 0.11, 24, 1, true]} />
            </mesh>
            {/* Feed Horn Strut */}
            <mesh position={[0, 0.12, 0.12]} rotation={[Math.PI / 4, 0, 0]} material={materials.feedHorn}>
              <cylinderGeometry args={[0.012, 0.012, 0.18, 8]} />
            </mesh>
            <mesh position={[0, 0.18, 0.18]} material={materials.feedHorn}>
              <sphereGeometry args={[0.025, 8, 8]} />
            </mesh>
          </group>

          {/* 4. Left Solar Array Wing with Titanium Articulation Yoke */}
          <group position={[-0.22, 0, 0]}>
            {/* Yoke Booms */}
            <mesh position={[-0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.solarFrame}>
              <cylinderGeometry args={[0.02, 0.02, 0.28, 8]} />
            </mesh>
            {/* Solar Panel Wing */}
            <mesh position={[-0.78, 0, 0]} material={materials.solarFrame}>
              <boxGeometry args={[0.98, 0.44, 0.02]} />
            </mesh>
            <mesh position={[-0.78, 0, 0.014]} material={materials.solarPhotovoltaic}>
              <planeGeometry args={[0.94, 0.40]} />
            </mesh>
            <mesh position={[-0.78, 0, -0.014]} rotation={[0, Math.PI, 0]} material={materials.solarPhotovoltaic}>
              <planeGeometry args={[0.94, 0.40]} />
            </mesh>
          </group>

          {/* 5. Right Solar Array Wing with Titanium Articulation Yoke */}
          <group position={[0.22, 0, 0]}>
            {/* Yoke Booms */}
            <mesh position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.solarFrame}>
              <cylinderGeometry args={[0.02, 0.02, 0.28, 8]} />
            </mesh>
            {/* Solar Panel Wing */}
            <mesh position={[0.78, 0, 0]} material={materials.solarFrame}>
              <boxGeometry args={[0.98, 0.44, 0.02]} />
            </mesh>
            <mesh position={[0.78, 0, 0.014]} material={materials.solarPhotovoltaic}>
              <planeGeometry args={[0.94, 0.40]} />
            </mesh>
            <mesh position={[0.78, 0, -0.014]} rotation={[0, Math.PI, 0]} material={materials.solarPhotovoltaic}>
              <planeGeometry args={[0.94, 0.40]} />
            </mesh>
          </group>

          {/* 6. Four-Corner Reaction Control Thruster (RCS) Quads */}
          {[-0.22, 0.22].map((x, xi) =>
            [-0.22, 0.22].map((y, yi) => (
              <group key={`${xi}-${yi}`} position={[x, y, -0.18]}>
                <mesh material={materials.thrusterTitanium}>
                  <boxGeometry args={[0.06, 0.06, 0.06]} />
                </mesh>
                <mesh position={[0, 0, -0.05]} rotation={[Math.PI, 0, 0]} material={materials.thrusterTitanium}>
                  <coneGeometry args={[0.025, 0.05, 8, 1, true]} />
                </mesh>
              </group>
            ))
          )}

          {/* 7. Magnetometer Instrument Boom & Pulsing Status LED */}
          <mesh position={[0, -0.45, 0]} material={materials.solarFrame}>
            <cylinderGeometry args={[0.012, 0.012, 0.34, 8]} />
          </mesh>
          <mesh position={[0, -0.62, 0]} material={materials.thrusterTitanium}>
            <boxGeometry args={[0.06, 0.06, 0.06]} />
          </mesh>
          <mesh ref={beaconRef} position={[0, -0.66, 0]} material={materials.beaconMat}>
            <sphereGeometry args={[0.038, 12, 12]} />
          </mesh>
        </group>
      </group>
    </>
  );
};
