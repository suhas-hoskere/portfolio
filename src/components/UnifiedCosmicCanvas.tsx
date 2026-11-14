import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { blackHoleVertexShader, blackHoleFragmentShader } from '../shaders/blackHoleShader';
import {
  MILESTONES,
  TesseractDust,
  TesseractLatticeMesh,
  ConnectingStrands,
} from './TesseractLattice';
import type { Milestone } from './TesseractLattice';
import { MilestoneColumn } from './MilestoneColumn';
import { SignalBeam } from './SignalBeam';

interface UnifiedCosmicCanvasProps {
  scrollProgress: number; // 0.0 to 1.0
  cameraZ: number;        // 5.0 to -100.0
  warp: number;           // 0.0 to 1.0 (flash)
  onSelectProject: (m: Milestone) => void;
}

// 1. Black Hole Shader Plane (Active during Hero & Infall)
const GargantuaLayer: React.FC<{ scrollProgress: number; warp: number }> = ({
  scrollProgress,
  warp,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const { size } = useThree();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAspect: { value: size.width / Math.max(size.height, 1) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
      uWarp: { value: 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    uniforms.uAspect.value = size.width / Math.max(size.height, 1);
  }, [size, uniforms]);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    // Normalize infall progress for shader (0.0 to 0.16 mapped to 0.0 to 1.0)
    const infallProgress = Math.min(scrollProgress / 0.16, 1.0);
    uniforms.uScroll.value = infallProgress;
    uniforms.uWarp.value = warp;
    uniforms.uMouse.value.lerp(mouseRef.current, 0.06);
  });

  // Fade out black hole once camera crosses into the tesseract
  const isVisible = scrollProgress < 0.20;
  if (!isVisible) return null;

  const layerOpacity = scrollProgress > 0.15 ? Math.max(0, 1 - (scrollProgress - 0.15) / 0.04) : 1;

  return (
    <mesh ref={meshRef} position={[0, 0, 0.1]}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={blackHoleVertexShader}
        fragmentShader={blackHoleFragmentShader}
        uniforms={uniforms}
        transparent
        opacity={layerOpacity}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
};

// 2. Camera Rig: drives smooth 3D flight along the TIME axis
const CameraRig: React.FC<{
  cameraZ: number;
  scrollProgress: number;
}> = ({ cameraZ, scrollProgress }) => {
  const mouseRef = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state) => {
    if (scrollProgress <= 0.16) {
      // Scene 1: Gargantua Hero Camera (fixed at Z=1 looking at black hole quad)
      state.camera.position.set(0, 0, 1);
      state.camera.lookAt(0, 0, 0);
    } else {
      // Scene 3: The Tesseract 3D Flight
      // Camera glides down Z-axis with subtle fluid mouse parallax
      const targetX = mouseRef.current.x * 0.45;
      const targetY = mouseRef.current.y * 0.35;

      state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.05);
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.05);
      state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, cameraZ, 0.12);

      // Look slightly forward into the infinite time lattice
      state.camera.lookAt(0, targetY * 0.5, state.camera.position.z - 7.0);
    }
  });

  return null;
};

// 3. Master Canvas Component
export const UnifiedCosmicCanvas: React.FC<UnifiedCosmicCanvasProps> = ({
  scrollProgress,
  cameraZ,
  warp,
  onSelectProject,
}) => {
  return (
    <div className="fixed inset-0 w-full h-full z-0 bg-black pointer-events-none">
      <Canvas
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        camera={{ position: [0, 0, 1], fov: 60, near: 0.1, far: 200 }}
        dpr={[1, 1.5]}
      >
        {/* Dynamic Camera Rig */}
        <CameraRig cameraZ={cameraZ} scrollProgress={scrollProgress} />

        {/* Ambient Cosmic Illumination */}
        <ambientLight intensity={0.25} />
        <pointLight position={[0, 4, cameraZ + 2]} intensity={1.5} color="#fbbf24" distance={20} />

        {/* Scene 1 & 2: Gargantua Black Hole Layer */}
        <GargantuaLayer scrollProgress={scrollProgress} warp={warp} />

        {/* Scene 3 & 4: The Tesseract 3D Lattice World */}
        {scrollProgress >= 0.12 && (
          <group>
            {/* Ambient Floating Dust */}
            <TesseractDust />

            {/* Infinite Perspective Lattice Columns */}
            <TesseractLatticeMesh />

            {/* Connecting Bezier Light Strands */}
            <ConnectingStrands />

            {/* 17 Milestone Columns */}
            {MILESTONES.map((milestone) => (
              <MilestoneColumn
                key={milestone.id}
                milestone={milestone}
                cameraZ={cameraZ}
                onSelectProject={onSelectProject}
              />
            ))}

            {/* Scene 4: Converging Signal Beam & Contact */}
            <SignalBeam cameraZ={cameraZ} />
          </group>
        )}
      </Canvas>
    </div>
  );
};
