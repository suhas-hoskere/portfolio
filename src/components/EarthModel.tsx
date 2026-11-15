import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitalSatellite } from './OrbitalSatellite';
import { getPhotorealisticEarthTextures } from './photorealisticPlanetTextures';

// Physically Based Rayleigh Atmospheric Scattering Shader (FrontSide thin shell)
const atmosphereVertexShader = `
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

const atmosphereFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vSunDirection;
  uniform float uOpacity;
  void main() {
    vec3 viewDir = normalize(-vPosition);
    vec3 normal = normalize(vNormal);

    // Exponential limb grazing angle falloff
    float cosTheta = clamp(dot(viewDir, normal), 0.0, 1.0);
    float rim = pow(1.0 - cosTheta, 3.8);

    // Solar illumination alignment
    float sunDot = dot(normal, vSunDirection);

    // Deep space Rayleigh blue on sunlit limb, amber-crimson along the twilight terminator
    vec3 rayleighBlue = vec3(0.08, 0.48, 0.95);
    vec3 twilightAmber = vec3(0.98, 0.42, 0.12);
    vec3 nightHaze = vec3(0.01, 0.03, 0.08);

    vec3 skyColor;
    if (sunDot > 0.08) {
      skyColor = mix(twilightAmber, rayleighBlue, smoothstep(0.08, 0.38, sunDot));
    } else if (sunDot > -0.15) {
      skyColor = mix(nightHaze, twilightAmber, smoothstep(-0.15, 0.08, sunDot));
    } else {
      skyColor = nightHaze;
    }

    float sunVisibility = smoothstep(-0.25, 0.30, sunDot);
    float alpha = rim * (0.08 + 0.92 * sunVisibility) * uOpacity * 0.90;

    gl_FragColor = vec4(skyColor, alpha);
  }
`;

interface EarthModelProps {
  scrollProgressRef: React.MutableRefObject<number>;
  scale?: number;
}

export const EarthModel: React.FC<EarthModelProps> = ({
  scrollProgressRef,
  scale = 13.8,
}) => {
  const earthGroup = useRef<THREE.Group>(null);
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const satellitesGroup = useRef<THREE.Group>(null);

  const { dayTexture, nightTexture, specularTexture, cloudTexture } = useMemo(
    () => getPhotorealisticEarthTextures(),
    []
  );

  // Authentic Aerospace Satellite Constellation in Distinct Keplerian Orbital Planes
  const orbitalConstellation = useMemo(
    () => [
      {
        id: 'earth-obs-1',
        designation: 'Cartosat Earth Observation',
        orbitRadius: 15.0,
        tiltForward: 0.38,
        tiltDiagonal: -0.18,
        rotY: -0.12,
        speed: 0.10,
        initialAngle: Math.PI * 0.42, // Sunlit Indian Ocean apex
        beaconColor: '#38bdf8',
        busType: 'gold' as const,
      },
      {
        id: 'nav-relay-2',
        designation: 'NavIC Regional Constellation',
        orbitRadius: 15.6,
        tiltForward: -0.25,
        tiltDiagonal: 0.32,
        rotY: 0.35,
        speed: -0.09,
        initialAngle: Math.PI * 0.58, // High-inclination orbit
        beaconColor: '#f59e0b',
        busType: 'white' as const,
      },
      {
        id: 'comm-link-3',
        designation: 'Deep Space Comm Relay',
        orbitRadius: 16.2,
        tiltForward: 0.22,
        tiltDiagonal: -0.38,
        rotY: 0.95,
        speed: 0.08,
        initialAngle: Math.PI * 0.74, // Equatorial western limb
        beaconColor: '#10b981',
        busType: 'gold' as const,
      },
    ],
    []
  );

  // Dedicated materials with dynamic opacity support, photorealistic specular oceans & night-side city bioluminescence
  const surfaceMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: dayTexture,
      roughnessMap: specularTexture,
      roughness: 0.85,
      metalness: 0.08,
      transparent: true,
      opacity: 0.0,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uNightTexture = { value: nightTexture };
      shader.uniforms.uSunPosition = { value: new THREE.Vector3(12, 10, 5) };

      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
         varying vec3 vWorldNormal;
         varying vec3 vWorldPosition;
         varying vec2 vEarthUv;`
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
         vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
         vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
         vEarthUv = uv;`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
         uniform sampler2D uNightTexture;
         uniform vec3 uSunPosition;
         varying vec3 vWorldNormal;
         varying vec3 vWorldPosition;
         varying vec2 vEarthUv;`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
         vec3 sunDir = normalize(uSunPosition - vWorldPosition);
         vec3 viewDir = normalize(-vWorldPosition);
         float sunDot = dot(normalize(vWorldNormal), sunDir);
         float nightFactor = smoothstep(0.12, -0.22, sunDot);
         vec4 nightLight = texture2D(uNightTexture, vEarthUv);
         gl_FragColor.rgb += nightLight.rgb * nightFactor * 1.8;

         // Seamless Rayleigh Atmospheric Limb Scattering on Earth's Surface
         float rim = pow(1.0 - clamp(dot(normalize(vWorldNormal), viewDir), 0.0, 1.0), 3.2);
         float daySun = smoothstep(-0.10, 0.35, sunDot);
         vec3 atmoBlue = vec3(0.08, 0.42, 0.92);
         gl_FragColor.rgb = mix(gl_FragColor.rgb, atmoBlue, rim * daySun * 0.65);`
      );
    };

    return mat;
  }, [dayTexture, nightTexture, specularTexture]);

  const cloudMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [cloudTexture]);

  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uOpacity: { value: 0.0 },
        uSunPosition: { value: new THREE.Vector3(18, 12, 6) },
      },
    });
  }, []);

  useFrame((_, delta) => {
    const scrollProgress = scrollProgressRef.current;
    if (!earthGroup.current) return;

    // Earth and its satellites belong strictly to Stage 2: Low Earth Orbit (0.320 to 0.515)
    // Sinks and departs completely before the Moon arrives at 0.520, ensuring Earth and Moon are never in the same view!
    if (scrollProgress >= 0.320 && scrollProgress <= 0.515) {
      earthGroup.current.visible = true;

      // 1. Smooth Fade-in (0.320 to 0.365) and Depart Fade-out (0.475 to 0.515)
      let opacity = 0;
      if (scrollProgress < 0.365) {
        opacity = Math.min((scrollProgress - 0.320) / 0.045, 1.0);
      } else if (scrollProgress > 0.475) {
        opacity = Math.max(1.0 - (scrollProgress - 0.475) / 0.040, 0.0);
      } else {
        opacity = 1.0;
      }

      surfaceMaterial.opacity = opacity;
      cloudMaterial.opacity = opacity * 0.45;
      atmosphereMaterial.uniforms.uOpacity.value = opacity;

      // Satellites exist WITH Earth from the very first frame Earth rises into view!
      if (satellitesGroup.current) {
        satellitesGroup.current.visible = opacity > 0.01;
      }

      // 2. Majestic horizon rise from below (-28.0 -> -12.6) and depart (-12.6 -> -32.0)
      let targetY = -12.6;
      if (scrollProgress < 0.365) {
        const rise = (scrollProgress - 0.320) / 0.045;
        targetY = -28.0 + rise * 15.4;
      } else if (scrollProgress > 0.475) {
        const sink = (scrollProgress - 0.475) / 0.040;
        targetY = -12.6 - sink * 19.4;
      }

      earthGroup.current.position.y = THREE.MathUtils.lerp(
        earthGroup.current.position.y,
        targetY,
        0.10
      );

      // Continuous planetary rotation
      if (earthRef.current) earthRef.current.rotation.y += delta * 0.015;
      if (cloudRef.current) cloudRef.current.rotation.y += delta * 0.022;
    } else {
      earthGroup.current.visible = false;
      surfaceMaterial.opacity = 0.0;
      cloudMaterial.opacity = 0.0;
      atmosphereMaterial.uniforms.uOpacity.value = 0.0;
      if (satellitesGroup.current) satellitesGroup.current.visible = false;
      if (scrollProgress < 0.285) {
        earthGroup.current.position.y = -28.0;
      } else if (scrollProgress > 0.475) {
        earthGroup.current.position.y = -36.0;
      }
    }
  });

  return (
    <group ref={earthGroup} position={[2.6, -28.0, -10]} visible={false}>
      {/* 1. Planetary Sphere, Cloud & Glowing Atmosphere scaled by 13.8 */}
      <group scale={[scale, scale, scale]}>
        <mesh ref={earthRef} rotation={[0.2, -Math.PI * 0.65, 0]} material={surfaceMaterial}>
          <sphereGeometry args={[1, 64, 48]} />
        </mesh>

        <mesh ref={cloudRef} rotation={[0.2, -Math.PI * 0.65, 0]} material={cloudMaterial}>
          <sphereGeometry args={[1.003, 64, 48]} />
        </mesh>

        <mesh ref={atmosphereRef}>
          <sphereGeometry args={[1.008, 64, 48]} />
          <primitive object={atmosphereMaterial} attach="material" />
        </mesh>
      </group>

      {/* 2. Low Earth Orbit Satellite Constellation — Keplerian Orbits Encircling Earth */}
      <group ref={satellitesGroup} visible={false}>
        {orbitalConstellation.map((s) => (
          <OrbitalSatellite
            key={s.id}
            designation={s.designation}
            orbitRadius={s.orbitRadius}
            tiltForward={s.tiltForward}
            tiltDiagonal={s.tiltDiagonal}
            rotY={s.rotY}
            orbitSpeed={s.speed}
            initialAngle={s.initialAngle}
            beaconColor={s.beaconColor}
            busType={s.busType}
            scrollProgressRef={scrollProgressRef}
          />
        ))}
      </group>
    </group>
  );
};
