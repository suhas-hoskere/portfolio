import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Mail, ArrowUpRight } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from './Icons';

export const SignalBeam: React.FC<{ cameraZ: number }> = ({ cameraZ }) => {
  const beamRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const zPos = -98;
  const approach = cameraZ - zPos;
  // Active when approaching or at the terminus
  const isFocused = approach <= 7.0 && approach >= -3.0;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (beamRef.current) {
      beamRef.current.rotation.y = t * 0.4;
      beamRef.current.scale.x = 1 + Math.sin(t * 4) * 0.12;
      beamRef.current.scale.z = 1 + Math.cos(t * 4) * 0.12;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.2;
    }
  });

  return (
    <group position={[0, 0, zPos]}>
      {/* Converging Vertical Beam of Light */}
      <mesh ref={beamRef}>
        <cylinderGeometry args={[0.38, 0.38, 48, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={isFocused ? 0.95 : 0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outer Golden Corona */}
      <mesh>
        <cylinderGeometry args={[0.95, 0.95, 48, 16]} />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={isFocused ? 0.45 : 0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Ground Concentric Signal Wave Ring */}
      <mesh ref={ringRef} position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 5.0, 32]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* HTML Contact Card in 3D */}
      <Html position={[0, 0, 0]} center distanceFactor={11} zIndexRange={[25, 0]}>
        <div
          className={`transition-all duration-300 pointer-events-auto select-none ${
            isFocused
              ? 'scale-100 opacity-100 filter drop-shadow-[0_0_40px_rgba(245,158,11,0.5)]'
              : 'scale-90 opacity-20'
          }`}
          style={{ width: '350px' }}
        >
          <div className="p-7 rounded-3xl bg-black/95 backdrop-blur-2xl border border-amber-400/50 shadow-[0_0_55px_rgba(245,158,11,0.35)] space-y-4 text-center">
            <div className="text-[11px] font-sans font-semibold text-amber-400 uppercase tracking-widest">
              END OF THE LATTICE // SCENE 4
            </div>

            <h2 className="text-3xl font-serif text-cream-50 font-bold leading-tight">
              Send a signal back.
            </h2>

            <p className="text-xs text-cream-200/90 font-sans font-light leading-relaxed">
              Open to engineering challenges, speech pipelines, machine learning systems, and full-stack builds.
            </p>

            <div className="space-y-2.5 pt-2">
              <a
                href="mailto:suhas.hoskere@example.com"
                className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-space-950 font-sans font-semibold text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Send an email</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 rounded-full bg-space-900 border border-cream-200/20 hover:border-cream-100 text-cream-200 hover:text-white font-sans text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <GithubIcon className="w-3.5 h-3.5" />
                  <span>GitHub</span>
                  <ArrowUpRight className="w-3 h-3 text-cream-400" />
                </a>

                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 rounded-full bg-space-900 border border-cream-200/20 hover:border-cream-100 text-cream-200 hover:text-white font-sans text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LinkedinIcon className="w-3.5 h-3.5" />
                  <span>LinkedIn</span>
                  <ArrowUpRight className="w-3 h-3 text-cream-400" />
                </a>
              </div>
            </div>

            <div className="pt-2 border-t border-cream-200/10 text-[11px] font-kannada font-medium text-amber-300">
              ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ, ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
};
