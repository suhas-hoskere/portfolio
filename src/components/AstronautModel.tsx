import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AstronautModelProps {
  position?: [number, number, number];
  scale?: number;
}

export const AstronautModel: React.FC<AstronautModelProps> = ({
  position = [4.5, 1.2, -18],
  scale = 0.85,
}) => {
  const astronautGroup = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);

  // Materials
  const materials = useMemo(() => {
    return {
      suitWhite: new THREE.MeshStandardMaterial({
        color: '#f1f5f9',
        roughness: 0.35,
        metalness: 0.1,
      }),
      goldVisor: new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        roughness: 0.05,
        metalness: 0.95, // High-gloss gold astronaut visor reflection
        emissive: '#78350f',
        emissiveIntensity: 0.25,
      }),
      backpackDark: new THREE.MeshStandardMaterial({
        color: '#334155',
        roughness: 0.5,
        metalness: 0.3,
      }),
      detailsOrange: new THREE.MeshStandardMaterial({
        color: '#ea580c',
        roughness: 0.4,
      }),
      gloveDark: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.6,
      }),
    };
  }, []);

  // Zero-G floating & limb inertia
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (astronautGroup.current) {
      // Gentle floating drift & tumble
      astronautGroup.current.position.y = position[1] + Math.sin(t * 0.8) * 0.25;
      astronautGroup.current.position.x = position[0] + Math.cos(t * 0.6) * 0.15;
      astronautGroup.current.rotation.z = Math.sin(t * 0.4) * 0.15;
      astronautGroup.current.rotation.y = Math.cos(t * 0.3) * 0.2;
    }

    // Natural zero-G undulating arm & leg motion
    if (leftArm.current) {
      leftArm.current.rotation.x = Math.sin(t * 0.7) * 0.18 + 0.2;
      leftArm.current.rotation.z = Math.cos(t * 0.5) * 0.12 - 0.4;
    }
    if (rightArm.current) {
      rightArm.current.rotation.x = -Math.sin(t * 0.65) * 0.18 - 0.1;
      rightArm.current.rotation.z = Math.sin(t * 0.5) * 0.12 + 0.4;
    }
    if (leftLeg.current) {
      leftLeg.current.rotation.x = Math.sin(t * 0.5) * 0.12 - 0.15;
    }
    if (rightLeg.current) {
      rightLeg.current.rotation.x = -Math.sin(t * 0.55) * 0.12 + 0.2;
    }
  });

  return (
    <group ref={astronautGroup} position={position} scale={[scale, scale, scale]}>
      {/* ===== TORSO & SUIT ===== */}
      <mesh position={[0, 0, 0]} material={materials.suitWhite}>
        <boxGeometry args={[0.7, 0.9, 0.48]} />
      </mesh>

      {/* Chest Control Module */}
      <mesh position={[0, 0.1, 0.26]} material={materials.backpackDark}>
        <boxGeometry args={[0.38, 0.35, 0.08]} />
      </mesh>
      {/* Status LED Lights */}
      <mesh position={[-0.1, 0.15, 0.31]}>
        <boxGeometry args={[0.04, 0.04, 0.02]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
      <mesh position={[0.1, 0.15, 0.31]}>
        <boxGeometry args={[0.04, 0.04, 0.02]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* ===== PLSS BACKPACK (Primary Life Support System) ===== */}
      <mesh position={[0, 0.1, -0.34]} material={materials.backpackDark}>
        <boxGeometry args={[0.62, 0.88, 0.28]} />
      </mesh>

      {/* Oxygen Tank Tubes */}
      <mesh position={[-0.18, 0.52, -0.34]} material={materials.suitWhite}>
        <cylinderGeometry args={[0.07, 0.07, 0.25, 16]} />
      </mesh>
      <mesh position={[0.18, 0.52, -0.34]} material={materials.suitWhite}>
        <cylinderGeometry args={[0.07, 0.07, 0.25, 16]} />
      </mesh>

      {/* ===== HELMET & GOLD VISOR ===== */}
      <group position={[0, 0.72, 0]}>
        {/* Outer White Helmet */}
        <mesh material={materials.suitWhite}>
          <sphereGeometry args={[0.38, 32, 32]} />
        </mesh>
        {/* Curved Gold Reflective Visor */}
        <mesh position={[0, 0.02, 0.16]} rotation={[0.1, 0, 0]} material={materials.goldVisor}>
          <sphereGeometry args={[0.26, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        </mesh>
      </group>

      {/* ===== LEFT ARM ===== */}
      <group ref={leftArm} position={[-0.45, 0.35, 0]}>
        {/* Shoulder */}
        <mesh position={[-0.05, 0, 0]} material={materials.suitWhite}>
          <sphereGeometry args={[0.16, 16, 16]} />
        </mesh>
        {/* Upper Arm */}
        <mesh position={[-0.18, -0.22, 0]} rotation={[0, 0, 0.4]} material={materials.suitWhite}>
          <cylinderGeometry args={[0.12, 0.11, 0.45, 16]} />
        </mesh>
        {/* Forearm & Glove */}
        <mesh position={[-0.32, -0.52, 0]} rotation={[0, 0, 0.2]} material={materials.gloveDark}>
          <cylinderGeometry args={[0.11, 0.09, 0.4, 16]} />
        </mesh>
      </group>

      {/* ===== RIGHT ARM ===== */}
      <group ref={rightArm} position={[0.45, 0.35, 0]}>
        {/* Shoulder */}
        <mesh position={[0.05, 0, 0]} material={materials.suitWhite}>
          <sphereGeometry args={[0.16, 16, 16]} />
        </mesh>
        {/* Upper Arm */}
        <mesh position={[0.18, -0.22, 0]} rotation={[0, 0, -0.4]} material={materials.suitWhite}>
          <cylinderGeometry args={[0.12, 0.11, 0.45, 16]} />
        </mesh>
        {/* Forearm & Glove */}
        <mesh position={[0.32, -0.52, 0]} rotation={[0, 0, -0.2]} material={materials.gloveDark}>
          <cylinderGeometry args={[0.11, 0.09, 0.4, 16]} />
        </mesh>
      </group>

      {/* ===== LEFT LEG ===== */}
      <group ref={leftLeg} position={[-0.22, -0.5, 0]}>
        <mesh position={[0, -0.3, 0]} material={materials.suitWhite}>
          <cylinderGeometry args={[0.15, 0.13, 0.6, 16]} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.65, 0.08]} material={materials.gloveDark}>
          <boxGeometry args={[0.18, 0.15, 0.32]} />
        </mesh>
      </group>

      {/* ===== RIGHT LEG ===== */}
      <group ref={rightLeg} position={[0.22, -0.5, 0]}>
        <mesh position={[0, -0.3, 0]} material={materials.suitWhite}>
          <cylinderGeometry args={[0.15, 0.13, 0.6, 16]} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.65, 0.08]} material={materials.gloveDark}>
          <boxGeometry args={[0.18, 0.15, 0.32]} />
        </mesh>
      </group>

      {/* Umbilical Safety Tether (gently curving into the distance) */}
      <mesh position={[0, -0.2, -0.45]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
    </group>
  );
};
