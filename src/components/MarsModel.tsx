import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getPhotorealisticMarsTextures } from './photorealisticPlanetTextures';

const marsAtmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vPosition = mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const marsAtmosphereFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float uOpacity;
  void main() {
    vec3 viewDir = normalize(-vPosition);
    vec3 normal = normalize(vNormal);
    float cosTheta = clamp(dot(viewDir, normal), 0.0, 1.0);
    float rim = pow(1.0 - cosTheta, 3.6);
    // Sun alignment from upper right
    vec3 sunDir = normalize(vec3(0.8, 0.45, 0.35));
    float sunScatter = max(dot(normal, sunDir) * 0.65 + 0.35, 0.0);
    // Delicate Martian Rayleigh dust scattering: thin warm ochre-amber limb with faint high altitude tint
    vec3 dustColor = mix(vec3(0.96, 0.46, 0.18), vec3(0.76, 0.84, 0.96), pow(rim, 2.0) * 0.32);
    gl_FragColor = vec4(dustColor, rim * sunScatter * uOpacity * 0.90);
  }
`;

interface MarsModelProps {
  position?: [number, number, number];
  scale?: number;
  opacityRef?: React.MutableRefObject<number>;
}

export const MarsModel: React.FC<MarsModelProps> = ({
  position = [0, 0, 0],
  scale = 1.0,
  opacityRef,
}) => {
  const marsRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const { diffuse, bump } = useMemo(() => getPhotorealisticMarsTextures(), []);

  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: marsAtmosphereVertexShader,
      fragmentShader: marsAtmosphereFragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uOpacity: { value: 0.95 },
      },
    });
  }, []);

  useFrame((_, delta) => {
    if (marsRef.current) {
      // Natural Martian sol axial rotation
      marsRef.current.rotation.y += delta * 0.016;
    }
    if (materialRef.current && opacityRef) {
      materialRef.current.opacity = opacityRef.current;
    }
    if (atmosphereMaterial && opacityRef) {
      atmosphereMaterial.uniforms.uOpacity.value = opacityRef.current * 0.95;
    }
  });

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* 3D High-Fidelity Mars Planetary Sphere with Valles Marineris & Tharsis Facing Sun */}
      <mesh ref={marsRef} rotation={[0, 0, 0]}>
        <sphereGeometry args={[1, 64, 48]} />
        <meshStandardMaterial
          ref={materialRef}
          map={diffuse}
          bumpMap={bump}
          bumpScale={0.06}
          roughness={0.78}
          metalness={0.08}
          transparent={true}
          opacity={1.0}
        />
      </mesh>

      {/* Thin Dust-Scattered Martian Atmosphere Limb Halo */}
      <mesh>
        <sphereGeometry args={[1.015, 64, 48]} />
        <primitive object={atmosphereMaterial} attach="material" />
      </mesh>
    </group>
  );
};
