import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getPhotorealisticMoonTextures } from './photorealisticPlanetTextures';

// Ultra-subtle lunar exosphere regolith dust glow (Apollo / Chandrayaan sodium horizon scatter)
const moonExosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vPosition = mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const moonExosphereFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float uOpacity;
  void main() {
    vec3 viewDir = normalize(-vPosition);
    vec3 normal = normalize(vNormal);
    float cosTheta = clamp(dot(viewDir, normal), 0.0, 1.0);
    float rim = pow(1.0 - cosTheta, 4.8);
    // Forward sun scattering from upper right
    vec3 sunDir = normalize(vec3(0.8, 0.45, 0.35));
    float sunFacing = max(dot(normal, sunDir) * 0.6 + 0.4, 0.0);
    vec3 dustGlow = vec3(0.88, 0.92, 0.98); // Silvery-white lunar regolith exosphere
    gl_FragColor = vec4(dustGlow, rim * sunFacing * uOpacity * 0.55);
  }
`;

interface MoonModelProps {
  position?: [number, number, number];
  scale?: number;
  opacityRef?: React.MutableRefObject<number>;
}

export const MoonModel: React.FC<MoonModelProps> = ({
  position = [0, 0, 0],
  scale = 1.0,
  opacityRef,
}) => {
  const moonRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const { diffuse, bump } = useMemo(() => getPhotorealisticMoonTextures(), []);

  const exosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: moonExosphereVertexShader,
      fragmentShader: moonExosphereFragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uOpacity: { value: 1.0 },
      },
    });
  }, []);

  useFrame((_, delta) => {
    if (moonRef.current) {
      // Authentic lunar axial rotation (synchronous tidally locked slow roll)
      moonRef.current.rotation.y += delta * 0.008;
    }
    if (materialRef.current && opacityRef) {
      materialRef.current.opacity = opacityRef.current;
    }
    if (exosphereMaterial && opacityRef) {
      exosphereMaterial.uniforms.uOpacity.value = opacityRef.current;
    }
  });

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* 3D Moon High-Fidelity Celestial Sphere with Near-Side Maria & Tycho Facing Camera */}
      <mesh ref={moonRef} rotation={[0, 0, 0]}>
        <sphereGeometry args={[1, 64, 48]} />
        <meshStandardMaterial
          ref={materialRef}
          map={diffuse}
          bumpMap={bump}
          bumpScale={0.065}
          roughness={0.92}
          metalness={0.04}
          transparent={true}
          opacity={1.0}
        />
      </mesh>

      {/* Ultra-Subtle Silvery Lunar Dust Horizon Glow */}
      <mesh>
        <sphereGeometry args={[1.008, 64, 48]} />
        <primitive object={exosphereMaterial} attach="material" />
      </mesh>
    </group>
  );
};
