import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getPhotorealisticMoonTextures } from './photorealisticPlanetTextures';
import { STAGE_CONFIG } from '../scene/stageConfig';

// High-Fidelity Lunar Surface Shader with Grazing-Angle Terminator, Hard Shadows & Earthshine
const moonVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const moonFragmentShader = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  uniform sampler2D uDiffuse;
  uniform sampler2D uBump;
  uniform vec3 uSunPosition;
  uniform vec3 uEarthPosition;
  uniform float uSunIntensity;
  uniform float uEarthshineIntensity;
  uniform float uOpacity;

  void main() {
    vec3 sunDir = normalize(uSunPosition - vWorldPosition);
    vec3 earthDir = normalize(uEarthPosition - vWorldPosition);

    // Micro-normal perturbation from crater bump map for pronounced relief
    float bumpOffset = 0.002;
    float hL = texture2D(uBump, vUv - vec2(bumpOffset, 0.0)).r;
    float hR = texture2D(uBump, vUv + vec2(bumpOffset, 0.0)).r;
    float hD = texture2D(uBump, vUv - vec2(0.0, bumpOffset)).r;
    float hU = texture2D(uBump, vUv + vec2(0.0, bumpOffset)).r;

    vec3 dNormal = vec3((hL - hR) * 2.2, (hD - hU) * 2.2, 1.0);
    vec3 norm = normalize(vWorldNormal + dNormal * 0.16);

    // Grazing-angle solar illumination across the disk
    float sunDot = dot(norm, sunDir);
    // Hard shadow terminator with stark crater rim relief
    float terminator = smoothstep(-0.015, 0.055, sunDot);

    // LRO texture: pure neutral grey palette (NO blue tint!) with dark maria & bright highlands
    vec3 rawColor = texture2D(uDiffuse, vUv).rgb;
    float lum = dot(rawColor, vec3(0.299, 0.587, 0.114));
    vec3 greyAlbedo = vec3(lum);
    // Enhance contrast between basalt maria and anorthosite highlands
    greyAlbedo = mix(vec3(lum * 0.56), vec3(lum * 1.18), smoothstep(0.32, 0.68, lum));

    // Sunlit surface with Lommel-Seeliger scattering
    float sunFacing = max(sunDot, 0.0);
    vec3 sunlit = greyAlbedo * uSunIntensity * sunFacing;

    // Very faint earthshine on the dark side (cool earthlight reflected from Earth)
    float earthFacing = max(dot(norm, earthDir), 0.0);
    vec3 earthshineColor = vec3(0.08, 0.16, 0.30) * uEarthshineIntensity * earthFacing * greyAlbedo;

    // Hard vacuum shadows: dark side receives only faint earthshine; no atmosphere, no rim glow
    vec3 finalColor = sunlit * terminator + earthshineColor * (1.0 - terminator);

    gl_FragColor = vec4(finalColor, uOpacity);
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
  const { diffuse, bump } = useMemo(() => getPhotorealisticMoonTextures(), []);

  const moonMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: moonVertexShader,
      fragmentShader: moonFragmentShader,
      transparent: true,
      depthWrite: true,
      uniforms: {
        uDiffuse: { value: diffuse },
        uBump: { value: bump },
        uSunPosition: { value: new THREE.Vector3(...STAGE_CONFIG.stage03_moon.sunPosition) },
        uEarthPosition: { value: new THREE.Vector3(...STAGE_CONFIG.stage03_moon.backgroundEarthPosition) },
        uSunIntensity: { value: STAGE_CONFIG.stage03_moon.sunIntensity },
        uEarthshineIntensity: { value: STAGE_CONFIG.stage03_moon.earthshineIntensity },
        uOpacity: { value: 1.0 },
      },
    });
  }, [diffuse, bump]);

  useFrame((_, delta) => {
    if (moonRef.current) {
      // Authentic lunar axial rotation (synchronous tidally locked slow roll)
      moonRef.current.rotation.y += delta * 0.008;
    }
    if (moonMaterial && opacityRef) {
      moonMaterial.uniforms.uOpacity.value = opacityRef.current;
    }
  });

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* 3D Moon High-Fidelity Celestial Sphere with Hard Terminator, Grazing Shadows & Earthshine */}
      <mesh ref={moonRef} rotation={[0, 0, 0]}>
        <sphereGeometry args={[1, 64, 48]} />
        <primitive object={moonMaterial} attach="material" />
      </mesh>
    </group>
  );
};
