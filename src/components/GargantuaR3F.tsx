import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { blackHoleVertexShader, blackHoleFragmentShader } from '../shaders/blackHoleShader';

interface BlackHolePlaneProps {
  scrollProgress: number;
  warp: number;
}

const BlackHolePlane: React.FC<BlackHolePlaneProps> = ({ scrollProgress, warp }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const mouseRef = useRef(new THREE.Vector2(0, 0));

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
      uAspect: { value: window.innerWidth / Math.max(window.innerHeight, 1) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
      uWarp: { value: 0 },
    }),
    []
  );

  useEffect(() => {
    const handleResize = () => {
      uniforms.uAspect.value = window.innerWidth / Math.max(window.innerHeight, 1);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [uniforms]);

  useFrame((_, delta) => {
    // Continuous time advancement
    uniforms.uTime.value += delta;
    uniforms.uScroll.value = scrollProgress;
    uniforms.uWarp.value = warp;
    // Smooth mouse follow
    uniforms.uMouse.value.lerp(mouseRef.current, 0.06);
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={blackHoleVertexShader}
        fragmentShader={blackHoleFragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
};

export const GargantuaR3F: React.FC<BlackHolePlaneProps> = ({ scrollProgress, warp }) => {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-black">
      <Canvas
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.NoToneMapping,
        }}
        camera={{ position: [0, 0, 1] }}
        dpr={[1, 1.5]}
      >
        <BlackHolePlane scrollProgress={scrollProgress} warp={warp} />
      </Canvas>
    </div>
  );
};
