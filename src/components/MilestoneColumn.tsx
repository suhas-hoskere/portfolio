import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Milestone } from './TesseractLattice';
import { ArrowUpRight } from 'lucide-react';

interface MilestoneColumnProps {
  milestone: Milestone;
  cameraZ: number;
  onSelectProject?: (m: Milestone) => void;
}

export const MilestoneColumn: React.FC<MilestoneColumnProps> = ({
  milestone,
  cameraZ,
  onSelectProject,
}) => {
  const columnRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);

  // Approach distance: positive when camera is approaching from ahead
  const approach = cameraZ - milestone.zPos;
  // Peak focus occurs when the column is ~2.8 units in front of the camera
  const focusDistance = Math.abs(approach - 2.8);
  const isFocused = focusDistance < 2.2;
  const opacity = Math.max(0, 1 - focusDistance / 5.8);

  useFrame((state) => {
    if (!coreRef.current) return;
    const t = state.clock.getElapsedTime();
    // Strands vibrate and pulse when focused
    if (isFocused) {
      coreRef.current.scale.x = 1 + Math.sin(t * 8) * 0.18;
      coreRef.current.scale.z = 1 + Math.cos(t * 8) * 0.18;
      if (coronaRef.current) {
        coronaRef.current.scale.x = 1 + Math.cos(t * 6) * 0.25;
        coronaRef.current.scale.z = 1 + Math.sin(t * 6) * 0.25;
      }
    } else {
      coreRef.current.scale.set(1, 1, 1);
      if (coronaRef.current) {
        coronaRef.current.scale.set(1, 1, 1);
      }
    }
  });

  if (opacity <= 0.02) return null;

  // Offset HTML card slightly toward the central corridor for ideal readability
  const cardOffsetX = milestone.xPos < 0 ? 0.35 : milestone.xPos > 0 ? -0.35 : 0;

  return (
    <group ref={columnRef} position={[milestone.xPos, 0, milestone.zPos]}>
      {/* Tall Glowing Vertical Light Column */}
      <mesh ref={coreRef}>
        <cylinderGeometry args={[0.08, 0.08, 28, 8]} />
        <meshBasicMaterial
          color={isFocused ? '#fde047' : '#f59e0b'}
          transparent
          opacity={isFocused ? 0.9 : opacity * 0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Luminous Atmospheric Corona */}
      <mesh ref={coronaRef}>
        <cylinderGeometry args={[0.26, 0.26, 28, 8]} />
        <meshBasicMaterial
          color="#ea580c"
          transparent
          opacity={isFocused ? 0.45 : opacity * 0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Materializing HTML Content Panel */}
      <Html
        position={[cardOffsetX, 0, 0]}
        center
        distanceFactor={11}
        zIndexRange={[15, 0]}
      >
        <div
          className={`transition-all duration-300 pointer-events-auto select-none ${
            isFocused
              ? 'scale-100 opacity-100 filter drop-shadow-[0_0_25px_rgba(245,158,11,0.4)]'
              : 'scale-90 opacity-30'
          }`}
          style={{ width: '290px' }}
        >
          <div className="p-5 rounded-2xl bg-black/90 backdrop-blur-xl border border-amber-400/40 shadow-[0_0_35px_rgba(245,158,11,0.2)] space-y-2.5 text-left">
            {/* Year / Category Badge */}
            <div className="flex items-center justify-between text-[11px] font-sans font-medium text-amber-400 uppercase tracking-wider">
              <span>{milestone.year}</span>
              {milestone.kannada && (
                <span className="font-kannada text-xs font-semibold text-amber-300">
                  {milestone.kannada}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-xl font-serif text-cream-50 font-bold leading-tight">
              {milestone.title}
            </h3>

            {/* Description */}
            <p className="text-xs text-cream-200/90 font-sans font-light leading-relaxed">
              {milestone.description}
            </p>

            {/* Tags */}
            {milestone.tags && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {milestone.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded text-[10px] font-sans bg-amber-500/10 border border-amber-400/25 text-amber-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Project Expand Action */}
            {milestone.isProject && (
              <button
                onClick={() => onSelectProject?.(milestone)}
                className="w-full mt-3 py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/50 text-amber-300 font-sans text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Inspect Project Architecture</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </Html>
    </group>
  );
};
