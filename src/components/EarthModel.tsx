import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitalSatellite } from './OrbitalSatellite';
import { getPhotorealisticEarthTextures } from './photorealisticPlanetTextures';
import { STAGE_CONFIG } from '../scene/stageConfig';

// Physically Based Rayleigh Atmospheric Scattering Shader (BackSide thin shell)
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
  uniform float uSunriseGlow;
  void main() {
    vec3 viewDir = normalize(-vPosition);
    vec3 normal = normalize(vNormal);

    // Exponential limb grazing angle falloff for BackSide sphere
    float cosTheta = clamp(dot(viewDir, -normal), 0.0, 1.0);
    float limb = pow(1.0 - cosTheta, 3.8);
    float brightLimbLine = pow(1.0 - cosTheta, 7.8) * 1.5;

    // Solar illumination alignment
    float sunDot = dot(-normal, vSunDirection);

    // Deep space Rayleigh blue on sunlit limb, warm amber along the twilight terminator
    // Restrained natural saturation
    vec3 rayleighBlue = vec3(0.11, 0.48, 0.90);
    vec3 twilightAmber = vec3(0.98, 0.38, 0.12);
    vec3 nightHaze = vec3(0.005, 0.015, 0.04);

    vec3 skyColor;
    if (sunDot > 0.08) {
      skyColor = mix(twilightAmber, rayleighBlue, smoothstep(0.08, 0.36, sunDot));
    } else if (sunDot > -0.15) {
      skyColor = mix(nightHaze, twilightAmber, smoothstep(-0.15, 0.08, sunDot));
    } else {
      skyColor = nightHaze;
    }

    // Orbital sunrise lighting up the atmosphere
    vec3 sunriseColor = vec3(1.0, 0.88, 0.65);
    skyColor += sunriseColor * uSunriseGlow * smoothstep(-0.1, 0.4, sunDot) * 0.85;

    float sunVisibility = smoothstep(-0.25, 0.30, sunDot);
    float alpha = (limb * 0.70 + brightLimbLine + uSunriseGlow * 0.35) * (0.08 + 0.92 * sunVisibility) * uOpacity * 0.95;

    gl_FragColor = vec4(skyColor, alpha);
  }
`;

interface EarthModelProps {
  scrollProgressRef: React.MutableRefObject<number>;
  scale?: number;
}

// Procedural optical orbital sunrise flare texture
let cachedSunriseFlareTexture: THREE.CanvasTexture | null = null;
function getCachedSunriseFlareTexture(): THREE.CanvasTexture {
  if (cachedSunriseFlareTexture) return cachedSunriseFlareTexture;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const center = size / 2;
  const grad = ctx.createRadialGradient(center, center, 0, center, center, center * 0.95);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.18, 'rgba(255, 245, 190, 0.88)');
  grad.addColorStop(0.45, 'rgba(251, 146, 60, 0.38)');
  grad.addColorStop(0.72, 'rgba(56, 189, 248, 0.12)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  cachedSunriseFlareTexture = new THREE.CanvasTexture(canvas);
  return cachedSunriseFlareTexture;
}

export const EarthModel: React.FC<EarthModelProps> = ({
  scrollProgressRef,
  scale = 13.8,
}) => {
  const earthGroup = useRef<THREE.Group>(null);
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const sunriseFlareRef = useRef<THREE.Sprite>(null);
  const satellitesGroup = useRef<THREE.Group>(null);

  const sunriseTexture = useMemo(() => getCachedSunriseFlareTexture(), []);
  const surfaceUniformsRef = useRef<{
    uSunriseFlash?: { value: number };
  }>({});

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
      shader.uniforms.uSpecularTexture = { value: specularTexture };
      shader.uniforms.uCloudTexture = { value: cloudTexture };
      shader.uniforms.uSunPosition = { value: new THREE.Vector3(22, 10, 6) };
      shader.uniforms.uSunriseFlash = { value: 0.0 };
      surfaceUniformsRef.current.uSunriseFlash = shader.uniforms.uSunriseFlash;

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
         uniform sampler2D uSpecularTexture;
         uniform sampler2D uCloudTexture;
         uniform vec3 uSunPosition;
         uniform float uSunriseFlash;
         varying vec3 vWorldNormal;
         varying vec3 vWorldPosition;
         varying vec2 vEarthUv;`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
         vec3 sunDir = normalize(uSunPosition - vWorldPosition);
         vec3 viewDir = normalize(-vWorldPosition);
         vec3 norm = normalize(vWorldNormal);
         float sunDot = dot(norm, sunDir);

         // 1. Day / night blend using smoothstep on dot(normal, sunDir) with soft terminator
         float terminator = smoothstep(-0.16, 0.16, sunDot);

         // 2. Reddish twilight band at the terminator
         float twilight = exp(-pow(sunDot * 6.2, 2.0));
         vec3 twilightColor = vec3(1.0, 0.38, 0.12);
         gl_FragColor.rgb += twilightColor * twilight * 0.45;

         // 3. Night-side city lights using the lights texture squared, warm orange
         vec4 rawNightLight = texture2D(uNightTexture, vEarthUv);
         vec3 squaredLights = pow(rawNightLight.rgb, vec3(2.0)) * vec3(1.0, 0.72, 0.35) * 2.8;
         gl_FragColor.rgb += squaredLights * (1.0 - terminator);

         // 4. Ocean-only specular sun glint
         float oceanMask = texture2D(uSpecularTexture, vEarthUv).r;
         vec3 sunReflect = reflect(-sunDir, norm);
         float oceanGlint = pow(max(dot(viewDir, sunReflect), 0.0), 42.0) * oceanMask;
         gl_FragColor.rgb += vec3(1.0, 0.96, 0.88) * oceanGlint * 1.8 * terminator;

         // 5. Cloud soft shadowing on Earth surface
         float cloudVal = texture2D(uCloudTexture, vEarthUv + sunDir.xy * 0.0035).r;
         gl_FragColor.rgb *= (1.0 - cloudVal * 0.38 * terminator);

         // 6. Seamless Rayleigh Atmospheric Limb Scattering on Earth's Surface
         float rim = pow(1.0 - clamp(dot(norm, viewDir), 0.0, 1.0), 3.2);
         float daySun = smoothstep(-0.10, 0.35, sunDot);
         vec3 atmoBlue = vec3(0.08, 0.42, 0.92);
         gl_FragColor.rgb = mix(gl_FragColor.rgb, atmoBlue, rim * daySun * 0.65);

         // Orbital sunrise flash brightening the surface
         gl_FragColor.rgb += vec3(1.0, 0.90, 0.70) * uSunriseFlash * rim * daySun * 1.2;`
      );
    };

    return mat;
  }, [dayTexture, nightTexture, specularTexture, cloudTexture]);

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
        uSunriseGlow: { value: 0.0 },
        uSunPosition: { value: new THREE.Vector3(22, 10, 6) },
      },
    });
  }, []);

  useFrame((_, delta) => {
    const scrollProgress = scrollProgressRef.current;
    if (!earthGroup.current) return;

    // Earth begins rising as a thin curved horizon near end of Stage 01 ascent (0.25)
    // and fills the lower 40-50% in Stage 02: Low Earth Orbit (0.34 to 0.43), then departs before Moon arrival (0.475)
    if (scrollProgress >= STAGE_CONFIG.stage01_ascent.curvedHorizonFadeStart && scrollProgress <= 0.475) {
      earthGroup.current.visible = true;

      // 1. Smooth Fade-in (0.25 to 0.34) and Depart Fade-out (0.43 to 0.475)
      let opacity = 0;
      if (scrollProgress < 0.34) {
        opacity = Math.min((scrollProgress - STAGE_CONFIG.stage01_ascent.curvedHorizonFadeStart) / 0.09, 1.0);
      } else if (scrollProgress > 0.43) {
        opacity = Math.max(1.0 - (scrollProgress - 0.43) / 0.045, 0.0);
      } else {
        opacity = 1.0;
      }

      surfaceMaterial.opacity = opacity;
      cloudMaterial.opacity = opacity * 0.45;
      atmosphereMaterial.uniforms.uOpacity.value = opacity;

      // Satellites exist only once orbital altitude is reached (> 0.33)
      if (satellitesGroup.current) {
        satellitesGroup.current.visible = scrollProgress >= 0.33 && opacity > 0.01;
      }

      // 2. Thin curved horizon rise from below (-24.5 -> apexY) and depart (apexY -> -32.0)
      // At scroll 0.25: targetY = -24.5, so only the glowing curved top limb is visible across the bottom
      const apexY = STAGE_CONFIG.stage02_orbit.earthPosition[1];
      let targetY = apexY;
      if (scrollProgress < 0.34) {
        const rise = (scrollProgress - STAGE_CONFIG.stage01_ascent.curvedHorizonFadeStart) / 0.09;
        targetY = -24.5 + rise * (apexY - (-24.5));
      } else if (scrollProgress > 0.43) {
        const sink = (scrollProgress - 0.43) / 0.045;
        targetY = apexY - sink * 18.0;
      }

      earthGroup.current.position.y = THREE.MathUtils.lerp(
        earthGroup.current.position.y,
        targetY,
        0.10
      );

      // Continuous planetary rotation
      if (earthRef.current) earthRef.current.rotation.y += delta * 0.015;
      if (cloudRef.current) cloudRef.current.rotation.y += delta * 0.022;

      // 3. Orbital sunrise moment at scroll 0.35 to 0.41 (apex at 0.38)
      let sunriseGlow = 0;
      if (scrollProgress >= 0.35 && scrollProgress <= 0.41) {
        const sProgress = (scrollProgress - 0.35) / 0.06;
        sunriseGlow = Math.sin(sProgress * Math.PI);
      }
      atmosphereMaterial.uniforms.uSunriseGlow.value =
        sunriseGlow * STAGE_CONFIG.stage02_orbit.orbitalSunriseFlareIntensity;
      if (surfaceUniformsRef.current.uSunriseFlash) {
        surfaceUniformsRef.current.uSunriseFlash.value = sunriseGlow;
      }

      if (sunriseFlareRef.current) {
        if (sunriseGlow > 0.01) {
          sunriseFlareRef.current.visible = true;
          const flScale = 3.5 + sunriseGlow * 8.5;
          sunriseFlareRef.current.scale.set(flScale, flScale, 1);
          (sunriseFlareRef.current.material as THREE.SpriteMaterial).opacity = sunriseGlow * 0.95;
        } else {
          sunriseFlareRef.current.visible = false;
        }
      }
    } else {
      earthGroup.current.visible = false;
      surfaceMaterial.opacity = 0.0;
      cloudMaterial.opacity = 0.0;
      atmosphereMaterial.uniforms.uOpacity.value = 0.0;
      atmosphereMaterial.uniforms.uSunriseGlow.value = 0.0;
      if (surfaceUniformsRef.current.uSunriseFlash) {
        surfaceUniformsRef.current.uSunriseFlash.value = 0.0;
      }
      if (sunriseFlareRef.current) sunriseFlareRef.current.visible = false;
      if (satellitesGroup.current) satellitesGroup.current.visible = false;
      if (scrollProgress < 0.285) {
        earthGroup.current.position.y = -28.0;
      } else if (scrollProgress > 0.475) {
        earthGroup.current.position.y = -36.0;
      }
    }
  });

  return (
    <group ref={earthGroup} position={[0.5, -28.0, -4.5]} visible={false}>
      {/* 1. Planetary Sphere, Cloud & Glowing Atmosphere scaled by 13.8 with 23.44 deg axial tilt */}
      <group scale={[scale, scale, scale]} rotation={[0, 0, -0.409]}>
        <mesh ref={earthRef} rotation={[0.22, -Math.PI * 0.52, 0]} material={surfaceMaterial}>
          <sphereGeometry args={[1, 64, 48]} />
        </mesh>

        <mesh ref={cloudRef} rotation={[0.22, -Math.PI * 0.52, 0]} material={cloudMaterial}>
          <sphereGeometry args={[1.0035, 64, 48]} />
        </mesh>

        <mesh ref={atmosphereRef}>
          <sphereGeometry args={[1.032, 64, 48]} />
          <primitive object={atmosphereMaterial} attach="material" />
        </mesh>
      </group>

      {/* Orbital Sunrise Lens Flare on the curved limb */}
      <sprite ref={sunriseFlareRef} position={[2.8, 0.4, -4.2]} visible={false}>
        <spriteMaterial
          map={sunriseTexture}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.0}
        />
      </sprite>

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
