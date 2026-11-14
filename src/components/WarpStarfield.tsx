import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STAGE_CONFIG } from '../scene/stageConfig';

// 1. Physically Authentic Atmospheric-to-Cosmic Background Sky Shader
// Seamlessly transitions from coastal tropical dawn over the Bay of Bengal (0 km)
// through stratospheric darkening (10-80 km) into pure cosmic void with the Milky Way (400+ km)
const skyVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uAltitude; // 0.0 (ground) -> 1.0 (deep space)

  // Fast GPU hash & procedural noise for organic interstellar nebulae
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float t = uTime * 0.015;

    // =========================================================================
    // 1. PHYSICAL ATMOSPHERIC DAYLIGHT & DAWN HORIZON (Ground / Low Ascent)
    // =========================================================================
    // Authentic Sriharikota / Bay of Bengal morning dawn Rayleigh sky gradient
    // Screen horizon sits at vUv.y ≈ 0.44 (just above the launch apron and ocean line)
    float horizonY = vUv.y;

    vec3 dawnAmber  = vec3(0.98, 0.45, 0.12); // Intense warm dawn horizon glow
    vec3 dawnGolden = vec3(1.00, 0.76, 0.32); // Morning solar scattering
    vec3 azureSky   = vec3(0.18, 0.54, 0.88); // Tropical coastal daytime azure
    vec3 zenithSky  = vec3(0.04, 0.16, 0.42); // Deep upper atmospheric cobalt

    // Ground atmospheric vertical Rayleigh gradient:
    // Warm dawn glow radiates from horizonY ≈ 0.44 downward to the ocean and up into azure
    float dawnBand = exp(-pow((horizonY - 0.44) * 5.0, 2.0));
    vec3 groundSky = mix(azureSky, zenithSky, smoothstep(0.48, 0.92, horizonY));
    groundSky = mix(groundSky, dawnGolden, dawnBand * 0.85);
    groundSky = mix(groundSky, dawnAmber, smoothstep(0.44, 0.28, horizonY) * 0.70);

    // Authentic Sriharikota coastal cumulus clouds (matching Chandrayaan-3 launch photo)
    vec2 cloudUv = vec2(vUv.x * 2.2 + t * 0.25, vUv.y * 1.8);
    float cloudNoise = fbm(cloudUv * 2.0);
    float cloudDetail = fbm(cloudUv * 4.5 + vec2(t * 0.15, 0.0));
    float cloudDensity = smoothstep(0.48, 0.78, cloudNoise + cloudDetail * 0.28);
    vec3 cloudSunlit = vec3(0.98, 0.98, 1.0);
    vec3 cloudShadow = vec3(0.42, 0.48, 0.58);
    vec3 cloudColor = mix(cloudShadow, cloudSunlit, smoothstep(0.40, 0.75, vUv.y + cloudDetail * 0.2));
    groundSky = mix(groundSky, cloudColor, cloudDensity * smoothstep(0.36, 0.65, horizonY) * 0.82);

    // Subtle atmospheric maritime inversion haze layer near the water line
    float haze = fbm(vec2(vUv.x * 2.5, horizonY * 2.0 + t * 0.1)) * 0.05;
    groundSky += vec3(0.15, 0.10, 0.04) * haze;

    // =========================================================================
    // 2. COSMIC DEEP SPACE ENVIRONMENT (Milky Way & Interstellar Nebulae)
    // =========================================================================
    float n1 = fbm(uv * 1.5 + vec2(t * 0.5, t * 0.2));
    float n2 = fbm(uv * 2.5 - vec2(t * 0.3, t * 0.4) + n1 * 1.2);
    float n3 = fbm(uv * 3.8 + vec2(t * 0.1, -t * 0.15));

    // Deep cosmic vacuum palette with hydrogen-alpha and interstellar dust
    vec3 deepVoid      = vec3(0.008, 0.014, 0.035);
    vec3 cosmicMagenta = vec3(0.16, 0.04, 0.18);
    vec3 cosmicCyan    = vec3(0.02, 0.09, 0.20);
    vec3 milkyWayDust  = vec3(0.12, 0.08, 0.04); // Warm galactic dust lane

    vec3 cosmicColor = mix(deepVoid, cosmicCyan, smoothstep(0.25, 0.75, n1));
    cosmicColor = mix(cosmicColor, cosmicMagenta, smoothstep(0.35, 0.85, n2) * 0.60);
    cosmicColor += milkyWayDust * smoothstep(0.40, 0.80, n3) * 0.35;

    // Subtle cosmic vignette falloff
    float d = length(uv);
    cosmicColor *= clamp(1.4 - d * 0.6, 0.0, 1.0);

    // =========================================================================
    // 3. CINEMATIC STRATOSPHERIC TRANSITION:
    // =========================================================================
    // As uAltitude climbs from 0.04 to 0.26:
    // - Daylight fades: pale blue (#1e3852) -> deep navy (#07162c) -> near-black (#030712)
    // - Horizon atmospheric curve sinks downward and condenses into Earth's glowing blue limb
    vec3 skyColorGround = vec3(0.118, 0.220, 0.322); // #1e3852
    vec3 skyColorMid    = vec3(0.027, 0.086, 0.173); // #07162c
    vec3 skyColorSpace  = vec3(0.012, 0.027, 0.071); // #030712

    float midSkyFactor   = smoothstep(0.04, 0.16, uAltitude);
    float spaceSkyFactor = smoothstep(0.16, 0.26, uAltitude);

    vec3 stratosphericSky = mix(groundSky, skyColorMid, midSkyFactor);
    stratosphericSky      = mix(stratosphericSky, skyColorSpace, spaceSkyFactor);

    float spaceTransition = smoothstep(0.12, 0.28, uAltitude);

    // Dynamic glowing atmospheric limb on horizon during ascent
    float limbHeight = 0.32 - uAltitude * 1.05;
    float atmosphericLimb = exp(-pow((vUv.y - limbHeight) * 7.5, 2.0)) * (1.0 - spaceTransition) * 0.70;
    vec3 limbColor = vec3(0.35, 0.75, 1.0) * atmosphericLimb;

    vec3 finalColor = mix(stratosphericSky, cosmicColor, spaceTransition) + limbColor;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// 2. High-precision Astronomical Starfield Shader with Atmospheric Extinction
const starVertexShader = `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uTransitStretch;
  attribute vec3 aColor;
  attribute float aSize;
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vColor = aColor;
    vec3 pos = position;

    // Organic starlight scintillation based on position and time
    vTwinkle = 0.70 + 0.30 * sin(uTime * 3.2 + pos.x * 0.5 + pos.y * 0.5 + pos.z * 0.5);

    // Warp forward along Z axis on GPU
    float zDist = 120.0;
    float warp = 1.0 + uSpeed * 6.5 + uTransitStretch * 18.0;
    pos.z = mod(pos.z + uTime * 3.5 * warp + 60.0, zDist) - 60.0;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float sizeFactor = (1.0 + uSpeed * 1.2 + uTransitStretch * 2.5);
    gl_PointSize = (aSize / -mvPosition.z) * sizeFactor;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  varying vec3 vColor;
  varying float vTwinkle;
  uniform float uAltitude;

  void main() {
    // Atmospheric extinction: Stars are completely drowned out in daylight at ground level (uAltitude < 0.08)
    // and smoothly emerge as the rocket climbs through the stratosphere (0.08 to 0.26)
    float starVisibility = smoothstep(0.08, 0.26, uAltitude);
    if (starVisibility <= 0.001) discard;

    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    // Smooth Gaussian circular starlight core
    float alpha = smoothstep(0.5, 0.04, dist);
    // Subtle optical star diffraction glow
    float glow = exp(-dist * 6.0) * 0.45;

    gl_FragColor = vec4(vColor, (alpha + glow) * 0.90 * vTwinkle * starVisibility);
  }
`;

// 3. Volumetric 3D Zodiacal Stardust Shader (Interplanetary Micrometeorites in Vacuum)
const dustVertexShader = `
  uniform float uTime;
  uniform float uSpeed;
  attribute float aSize;
  attribute float aPhase;
  varying float vShimmer;
  varying float vDist;

  void main() {
    vec3 pos = position;
    // Slow natural cosmic drift
    pos.x += sin(uTime * 0.35 + aPhase) * 0.4;
    pos.y += cos(uTime * 0.25 + aPhase * 1.4) * 0.3;
    pos.z += sin(uTime * 0.18 + aPhase * 2.1) * 0.5;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vDist = -mvPosition.z;
    gl_PointSize = (aSize / vDist) * (1.0 + uSpeed * 0.8);
    gl_Position = projectionMatrix * mvPosition;

    vShimmer = 0.55 + 0.45 * sin(uTime * 2.4 + aPhase * 3.0);
  }
`;

const dustFragmentShader = `
  uniform float uAltitude;
  varying float vShimmer;

  void main() {
    // Only visible in deep space vacuum (uAltitude >= 0.26)
    float visibility = smoothstep(0.26, 0.38, uAltitude);
    if (visibility <= 0.001) discard;

    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float alpha = smoothstep(0.5, 0.05, dist);
    // Soft stardust mote catching directional sunlight
    vec3 dustColor = vec3(0.94, 0.97, 1.0);
    gl_FragColor = vec4(dustColor, alpha * 0.60 * vShimmer * visibility);
  }
`;

interface WarpStarfieldProps {
  scrollSpeedRef: React.MutableRefObject<number>;
  scrollProgressRef: React.MutableRefObject<number>;
}

// Procedural Optical Solar Lens Flare Texture with Gaussian Corona & Diffraction Spikes
let cachedSunFlareTexture: THREE.CanvasTexture | null = null;
function getCachedSunFlareTexture(): THREE.CanvasTexture {
  if (cachedSunFlareTexture) return cachedSunFlareTexture;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const center = size / 2;

  // 1. Broad outer solar halo (soft exponential falloff)
  const haloGrad = ctx.createRadialGradient(center, center, 0, center, center, center * 0.95);
  haloGrad.addColorStop(0.0, 'rgba(255, 240, 200, 0.45)');
  haloGrad.addColorStop(0.15, 'rgba(255, 180, 70, 0.22)');
  haloGrad.addColorStop(0.35, 'rgba(251, 146, 60, 0.08)');
  haloGrad.addColorStop(0.65, 'rgba(234, 88, 12, 0.025)');
  haloGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = haloGrad;
  ctx.fillRect(0, 0, size, size);

  // 2. Optical 6-point diffraction spikes (secondary mirror spider diffraction)
  ctx.save();
  ctx.translate(center, center);
  ctx.strokeStyle = 'rgba(255, 245, 220, 0.35)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI) / 3;
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(-center * 0.85, 0);
    ctx.lineTo(center * 0.85, 0);
    ctx.stroke();
    ctx.rotate(-angle);
  }
  ctx.restore();

  // 3. Dense intense golden corona
  const coronaGrad = ctx.createRadialGradient(center, center, 0, center, center, center * 0.38);
  coronaGrad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  coronaGrad.addColorStop(0.2, 'rgba(254, 240, 138, 0.85)');
  coronaGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.40)');
  coronaGrad.addColorStop(0.8, 'rgba(234, 88, 12, 0.12)');
  coronaGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = coronaGrad;
  ctx.beginPath();
  ctx.arc(center, center, center * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // 4. Pure white incandescent core
  const coreGrad = ctx.createRadialGradient(center, center, 0, center, center, center * 0.10);
  coreGrad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  coreGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
  coreGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(center, center, center * 0.10, 0, Math.PI * 2);
  ctx.fill();

  cachedSunFlareTexture = new THREE.CanvasTexture(canvas);
  cachedSunFlareTexture.generateMipmaps = true;
  return cachedSunFlareTexture;
}

export const WarpStarfield: React.FC<WarpStarfieldProps> = ({
  scrollSpeedRef,
  scrollProgressRef,
}) => {
  const starMatRef = useRef<THREE.ShaderMaterial>(null);
  const skyMatRef = useRef<THREE.ShaderMaterial>(null);
  const dustMatRef = useRef<THREE.ShaderMaterial>(null);
  const sunSpriteRef = useRef<THREE.Sprite>(null);

  const sunTexture = useMemo(() => getCachedSunFlareTexture(), []);

  // 1,200 stars with authentic astronomical spectral types
  const count = 1200;

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);

    // Real stellar spectral classification colors
    const spectralColors = [
      new THREE.Color('#93c5fd'), // Class O/B (brilliant icy blue-white, Rigel)
      new THREE.Color('#ffffff'), // Class A (pure diamond white, Sirius, Vega)
      new THREE.Color('#f8fafc'), // Class F (white)
      new THREE.Color('#fef08a'), // Class G (warm yellow-white, the Sun, Alpha Centauri)
      new THREE.Color('#fb923c'), // Class K (amber giant, Arcturus)
      new THREE.Color('#f87171'), // Class M (ruby red supergiant, Betelgeuse)
    ];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 85;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 85;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 120;

      // Astronomical magnitude distribution (few bright stars, many faint ones)
      const roll = Math.random();
      let chosenColor: THREE.Color;
      let baseSize: number;

      if (roll < 0.50) {
        chosenColor = spectralColors[1]; // Pure white
        baseSize = 14.0 + Math.random() * 8.0;
      } else if (roll < 0.75) {
        chosenColor = spectralColors[0]; // Icy blue
        baseSize = 16.0 + Math.random() * 10.0;
      } else if (roll < 0.90) {
        chosenColor = spectralColors[3]; // Warm yellow
        baseSize = 18.0 + Math.random() * 8.0;
      } else if (roll < 0.96) {
        chosenColor = spectralColors[4]; // Amber
        baseSize = 20.0 + Math.random() * 10.0;
      } else {
        chosenColor = spectralColors[5]; // Red giant
        baseSize = 22.0 + Math.random() * 12.0;
      }

      col[i * 3] = chosenColor.r;
      col[i * 3 + 1] = chosenColor.g;
      col[i * 3 + 2] = chosenColor.b;
      sz[i] = baseSize;
    }

    return { positions: pos, colors: col, sizes: sz };
  }, [count]);

  // 250 Volumetric Zodiacal Stardust motes in deep space
  const dustCount = 250;
  const { dustPositions, dustSizes, dustPhases } = useMemo(() => {
    const pos = new Float32Array(dustCount * 3);
    const sz = new Float32Array(dustCount);
    const phases = new Float32Array(dustCount);

    for (let i = 0; i < dustCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 36;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 32 - 4;
      sz[i] = 14.0 + Math.random() * 18.0;
      phases[i] = Math.random() * Math.PI * 2;
    }

    return { dustPositions: pos, dustSizes: sz, dustPhases: phases };
  }, [dustCount]);

  const starUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: 0 },
      uTransitStretch: { value: 0 },
      uAltitude: { value: 0 },
    }),
    []
  );

  const skyUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAltitude: { value: 0 },
    }),
    []
  );

  const dustUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: 0 },
      uAltitude: { value: 0 },
    }),
    []
  );

  useFrame((_, delta) => {
    const progress = scrollProgressRef.current;
    const targetSpeed = scrollSpeedRef.current;

    // Subtle star-streak stretch during long hops (03->04 and 04->05)
    let transitStretch = 0;
    if (STAGE_CONFIG.global.enableStarStreaksOnTransit) {
      if (progress >= 0.67 && progress <= 0.75) {
        transitStretch = Math.sin(((progress - 0.67) / 0.08) * Math.PI);
      } else if (progress >= 0.83 && progress <= 0.91) {
        transitStretch = Math.sin(((progress - 0.83) / 0.08) * Math.PI);
      }
    }

    if (starMatRef.current) {
      starMatRef.current.uniforms.uTime.value += delta;
      starMatRef.current.uniforms.uSpeed.value = THREE.MathUtils.lerp(
        starMatRef.current.uniforms.uSpeed.value,
        targetSpeed,
        0.1
      );
      starMatRef.current.uniforms.uTransitStretch.value = THREE.MathUtils.lerp(
        starMatRef.current.uniforms.uTransitStretch.value,
        transitStretch,
        0.1
      );
      starMatRef.current.uniforms.uAltitude.value = progress;
    }
    if (skyMatRef.current) {
      skyMatRef.current.uniforms.uTime.value += delta;
      skyMatRef.current.uniforms.uAltitude.value = progress;
    }
    if (dustMatRef.current) {
      dustMatRef.current.uniforms.uTime.value += delta;
      dustMatRef.current.uniforms.uSpeed.value = THREE.MathUtils.lerp(
        dustMatRef.current.uniforms.uSpeed.value,
        targetSpeed,
        0.1
      );
      dustMatRef.current.uniforms.uAltitude.value = progress;
    }

    // Solar flare fade as vehicle climbs: intense golden sunrise flare on pad, fading to crisp sun disc in vacuum
    if (sunSpriteRef.current) {
      const climbFactor = THREE.MathUtils.smoothstep(progress, 0.04, 0.26);
      const targetScale = THREE.MathUtils.lerp(16.5, 9.2, climbFactor);
      const targetOpacity = THREE.MathUtils.lerp(0.95, 0.42, climbFactor);

      const currentScale = sunSpriteRef.current.scale.x;
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.08);
      sunSpriteRef.current.scale.set(newScale, newScale, 1);
      (sunSpriteRef.current.material as THREE.SpriteMaterial).opacity = THREE.MathUtils.lerp(
        (sunSpriteRef.current.material as THREE.SpriteMaterial).opacity,
        targetOpacity,
        0.08
      );
    }
  });

  return (
    <>
      {/* 1. Dynamic Atmospheric-to-Cosmic Background Sky Plane */}
      <mesh position={[0, 0, -58]}>
        <planeGeometry args={[140, 95]} />
        <shaderMaterial
          ref={skyMatRef}
          vertexShader={skyVertexShader}
          fragmentShader={skyFragmentShader}
          uniforms={skyUniforms}
          depthWrite={false}
        />
      </mesh>

      {/* 2. Physical Visible Sun with Optical Flare & Corona */}
      <group position={[18, 12, -42]}>
        <sprite ref={sunSpriteRef} scale={[14, 14, 1]}>
          <spriteMaterial
            map={sunTexture}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            transparent
            opacity={0.95}
          />
        </sprite>
      </group>

      {/* 3. Astronomical 1,200-Star Field with Atmospheric Extinction */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={starMatRef}
          vertexShader={starVertexShader}
          fragmentShader={starFragmentShader}
          uniforms={starUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 4. Volumetric 3D Zodiacal Stardust Field (Appears in Deep Space) */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[dustSizes, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[dustPhases, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={dustMatRef}
          vertexShader={dustVertexShader}
          fragmentShader={dustFragmentShader}
          uniforms={dustUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
};
