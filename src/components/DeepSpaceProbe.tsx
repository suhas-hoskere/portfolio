import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DeepSpaceProbeProps {
  scrollSpeedRef?: React.MutableRefObject<number>;
}

export const DeepSpaceProbe: React.FC<DeepSpaceProbeProps> = () => {
  const probeGroup = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  const materials = useMemo(() => {
    return {
      goldMli: new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        roughness: 0.15,
        metalness: 0.9, // Radiant gold thermal insulation foil
        emissive: '#78350f',
        emissiveIntensity: 0.15,
      }),
      dishMetal: new THREE.MeshStandardMaterial({
        color: '#f8fafc',
        roughness: 0.25,
        metalness: 0.75, // High-gain parabolic antenna reflector
      }),
      feedHorn: new THREE.MeshStandardMaterial({
        color: '#ea580c',
        roughness: 0.3,
        metalness: 0.8,
      }),
      solarCell: new THREE.MeshStandardMaterial({
        color: '#0f172a',
        roughness: 0.1,
        metalness: 0.9,
      }),
      solarFrame: new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        roughness: 0.3,
        metalness: 0.8,
      }),
      signalGlow: new THREE.MeshBasicMaterial({
        color: '#38bdf8',
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
      telemetryBeam: new THREE.MeshBasicMaterial({
        color: '#f97316',
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Slow, majestic zero-G floating rotation
    if (probeGroup.current) {
      probeGroup.current.rotation.y = t * 0.25;
      probeGroup.current.rotation.x = Math.sin(t * 0.5) * 0.08;
      probeGroup.current.rotation.z = Math.cos(t * 0.4) * 0.05;
      probeGroup.current.position.y = Math.sin(t * 1.2) * 0.08;
    }

    // Concentric transmission radio ripple waves radiating toward Earth
    const wave1 = (t * 1.4) % 1.0;
    const wave2 = (t * 1.4 + 0.33) % 1.0;
    const wave3 = (t * 1.4 + 0.66) % 1.0;

    if (ring1Ref.current) {
      ring1Ref.current.scale.setScalar(0.4 + wave1 * 2.8);
      (ring1Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 - wave1 * 0.8);
    }
    if (ring2Ref.current) {
      ring2Ref.current.scale.setScalar(0.4 + wave2 * 2.8);
      (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 - wave2 * 0.8);
    }
    if (ring3Ref.current) {
      ring3Ref.current.scale.setScalar(0.4 + wave3 * 2.8);
      (ring3Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 - wave3 * 0.8);
    }
  });

  return (
    <group ref={probeGroup} position={[0, 0, 0]} scale={[1.1, 1.1, 1.1]}>
      {/* ===== CENTRAL HEXAGONAL PROBE BUS (Gold Foil Wrapped) ===== */}
      <mesh material={materials.goldMli}>
        <cylinderGeometry args={[0.42, 0.42, 0.65, 6]} />
      </mesh>

      {/* Equipment Bay Interconnect Ring */}
      <mesh position={[0, 0.35, 0]} material={materials.feedHorn}>
        <cylinderGeometry args={[0.25, 0.38, 0.12, 16]} />
      </mesh>

      {/* ===== HIGH-GAIN PARABOLIC DISH ANTENNA (Aimed Forward) ===== */}
      <group position={[0, 0.45, 0.15]} rotation={[0.4, 0, 0]}>
        {/* Parabolic Reflector Dish */}
        <mesh material={materials.dishMetal}>
          <coneGeometry args={[0.85, 0.28, 32, 1, true]} />
        </mesh>

        {/* Backing structural ring */}
        <mesh position={[0, 0.05, 0]} material={materials.solarFrame}>
          <ringGeometry args={[0.75, 0.85, 32]} />
        </mesh>

        {/* Center Feed Horn & Sub-reflector Mast */}
        <mesh position={[0, 0.35, 0]} material={materials.feedHorn}>
          <cylinderGeometry args={[0.03, 0.04, 0.45, 12]} />
        </mesh>
        <mesh position={[0, 0.58, 0]} material={materials.dishMetal}>
          <sphereGeometry args={[0.07, 12, 12]} />
        </mesh>

        {/* ===== PULSING TELEMETRY RADIO SIGNAL RIPPLES ===== */}
        <mesh ref={ring1Ref} position={[0, 0.65, 0]} rotation={[-Math.PI / 2, 0, 0]} material={materials.signalGlow}>
          <ringGeometry args={[0.4, 0.45, 32]} />
        </mesh>
        <mesh ref={ring2Ref} position={[0, 0.65, 0]} rotation={[-Math.PI / 2, 0, 0]} material={materials.signalGlow}>
          <ringGeometry args={[0.4, 0.45, 32]} />
        </mesh>
        <mesh ref={ring3Ref} position={[0, 0.65, 0]} rotation={[-Math.PI / 2, 0, 0]} material={materials.telemetryBeam}>
          <ringGeometry args={[0.4, 0.45, 32]} />
        </mesh>
      </group>

      {/* ===== SOLAR PANEL WING ARRAYS (Port & Starboard) ===== */}
      {/* Left Solar Wing */}
      <group position={[-1.25, 0, 0]}>
        {/* Boom Yoke */}
        <mesh position={[0.45, 0, 0]} material={materials.solarFrame}>
          <boxGeometry args={[0.5, 0.04, 0.04]} />
        </mesh>
        {/* Photovoltaic Panels */}
        <mesh material={materials.solarCell}>
          <boxGeometry args={[1.1, 0.5, 0.03]} />
        </mesh>
        <mesh material={materials.solarFrame}>
          <boxGeometry args={[1.14, 0.54, 0.02]} />
        </mesh>
      </group>

      {/* Right Solar Wing */}
      <group position={[1.25, 0, 0]}>
        {/* Boom Yoke */}
        <mesh position={[-0.45, 0, 0]} material={materials.solarFrame}>
          <boxGeometry args={[0.5, 0.04, 0.04]} />
        </mesh>
        {/* Photovoltaic Panels */}
        <mesh material={materials.solarCell}>
          <boxGeometry args={[1.1, 0.5, 0.03]} />
        </mesh>
        <mesh material={materials.solarFrame}>
          <boxGeometry args={[1.14, 0.54, 0.02]} />
        </mesh>
      </group>

      {/* ===== MAGNETOMETER BOOM & SENSORS ===== */}
      <mesh position={[0, -0.65, 0]} material={materials.solarFrame}>
        <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
      </mesh>
      <mesh position={[0, -0.95, 0]} material={materials.goldMli}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
      </mesh>

      {/* Low-Gain Omni Antenna */}
      <mesh position={[0.25, -0.2, 0.35]} material={materials.feedHorn}>
        <cylinderGeometry args={[0.015, 0.015, 0.4, 8]} />
      </mesh>
    </group>
  );
};
