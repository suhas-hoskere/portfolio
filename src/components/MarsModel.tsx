import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getPhotorealisticMarsTextures } from './photorealisticPlanetTextures';
import { STAGE_CONFIG } from '../scene/stageConfig';

const marsAtmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vSunDirection;
  uniform vec3 uSunPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vPosition = mvPos.xyz;
    vSunDirection = normalize((viewMatrix * vec4(uSunPosition, 0.0)).xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const marsAtmosphereFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vSunDirection;
  uniform float uOpacity;
  void main() {
    vec3 viewDir = normalize(-vPosition);
    vec3 normal = normalize(vNormal);
    float cosTheta = clamp(dot(viewDir, normal), 0.0, 1.0);
    float rim = pow(1.0 - cosTheta, 4.2);

    float sunScatter = max(dot(normal, vSunDirection) * 0.70 + 0.30, 0.0);
    // Authentic Martian Rayleigh dust scattering: thin butterscotch / dusty-pink limb haze
    vec3 butterscotchHaze = vec3(0.85, 0.49, 0.32); // #d97d52
    gl_FragColor = vec4(butterscotchHaze, rim * sunScatter * uOpacity * 0.45);
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
  const phobosRef = useRef<THREE.Mesh>(null);
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
        uSunPosition: { value: new THREE.Vector3(...STAGE_CONFIG.stage04_mars.sunPosition) },
        uOpacity: { value: 0.95 },
      },
    });
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

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

    // Potato-shaped Phobos moon in close Keplerian orbit across Mars's disk
    if (phobosRef.current) {
      const phobosAngle = t * 0.42;
      const phobosDist = 1.48;
      phobosRef.current.position.set(
        Math.cos(phobosAngle) * phobosDist,
        Math.sin(phobosAngle * 0.4) * 0.22,
        Math.sin(phobosAngle) * phobosDist
      );
      phobosRef.current.rotation.y += delta * 0.25;
      phobosRef.current.rotation.x += delta * 0.15;
    }
  });

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* 3D High-Fidelity Mars Planetary Sphere with Valles Marineris & Tharsis Facing Sun */}
      <mesh ref={marsRef} rotation={[0.2, 0, 0]}>
        <sphereGeometry args={[1, 64, 48]} />
        <meshStandardMaterial
          ref={materialRef}
          map={diffuse}
          bumpMap={bump}
          bumpScale={0.075}
          roughness={0.82}
          metalness={0.06}
          transparent={true}
          opacity={1.0}
        />
      </mesh>

      {/* Thin Dust-Scattered Martian Butterscotch Limb Haze */}
      <mesh>
        <sphereGeometry args={[1.018, 64, 48]} />
        <primitive object={atmosphereMaterial} attach="material" />
      </mesh>

      {/* Potato-Shaped Moon Phobos transiting Mars */}
      {STAGE_CONFIG.stage04_mars.phobosEnabled && (
        <mesh ref={phobosRef} scale={[0.075, 0.052, 0.062]}>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#423a32" roughness={0.96} metalness={0.04} />
        </mesh>
      )}
    </group>
  );
};
