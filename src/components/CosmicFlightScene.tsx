import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RocketModel } from './RocketModel';
import { EarthModel } from './EarthModel';
import { MoonModel } from './MoonModel';
import { MarsModel } from './MarsModel';
import { WarpStarfield } from './WarpStarfield';
import { Stage00LaunchPad } from './Stage00LaunchPad';
import { AtmosphericClouds } from './AtmosphericClouds';
import { getPhotorealisticEarthTextures } from './photorealisticPlanetTextures';
import { STAGE_CONFIG } from '../scene/stageConfig';

interface CosmicFlightSceneProps {
  scrollProgressRef: React.MutableRefObject<number>;
  scrollSpeedRef: React.MutableRefObject<number>;
  activeStageIndex: number;
  isIgnited?: boolean;
  liftoffTime?: number;
  isLiftoffActive?: boolean;
}

// 3D Camera Rig: Telephoto architectural alignment (view vector strictly parallel to -Z)
// Completely eliminates perspective keystoning / slant, keeping the rocket & launch tower 100% plumb vertical!
// Cleanly frames the launch vehicle & spacecraft on the right half, leaving the left 50% open for story cards!
const FlightCameraRig: React.FC<{
  scrollProgressRef: React.MutableRefObject<number>;
  isIgnited?: boolean;
  liftoffTime?: number;
  isLiftoffActive?: boolean;
}> = ({
  scrollProgressRef,
  isIgnited: _isIgnited = false,
  liftoffTime: _liftoffTime = 0,
  isLiftoffActive: _isLiftoffActive = false,
}) => {
  const mouseRef = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state) => {
    const sp = scrollProgressRef.current;
    const mouse = mouseRef.current;
    const aspect = state.viewport.aspect;
    const isMobile = aspect < 1.0;

    // Responsive Camera Framing:
    // On desktop: Camera X = 0.4 frames the rocket (at X = 2.6) on the right, keeping the left 50% open.
    // On mobile portrait: Camera X adjusts so the vehicle is framed prominently above the bottom story cards.
    const baseCamX = isMobile ? (aspect < 0.65 ? 1.55 : 1.15) : 0.4;
    const baseCamZ = isMobile ? (aspect < 0.65 ? 8.8 : 8.0) : 7.2;

    const baseOffsetX = baseCamX + mouse.x * (isMobile ? 0.04 : 0.12);
    let targetCamX = baseOffsetX;
    let targetCamY = isMobile ? 0.95 : 0.75;
    let targetCamZ = baseCamZ;

    let pitchTilt = 0;

    // 100% Scroll-Driven Camera Waypoints across granular flight phases
    if (sp < 0.170) {
      // Step 0 to Step 3: Standby, Fire Ignition, Lock Release, and Deluge Smoke
      // Camera stays firmly parked at ground zero framing the launch complex!
      targetCamY = isMobile ? 0.90 : 0.75;
      targetCamZ = baseCamZ;
    } else if (sp < 0.240) {
      // Step 4: Vertical Liftoff Clearance - Camera tracks smoothly upward with ascending rocket!
      const climb = (sp - 0.170) / (0.240 - 0.170);
      targetCamY = (isMobile ? 0.90 : 0.75) + Math.pow(climb, 1.25) * 0.45;
      targetCamZ = baseCamZ + climb * 0.25;
      pitchTilt = climb * 0.08;
    } else if (sp < 0.380) {
      // Stage 1: Atmospheric ascent & cloud punch
      const p = (sp - 0.240) / (0.380 - 0.240);
      targetCamY = (isMobile ? 1.35 : 1.20) + p * 0.25;
      targetCamZ = baseCamZ + 0.25 + p * 0.55;
      pitchTilt = 0.08 + p * 0.06;
    } else if (sp < 0.520) {
      // Stage 2: LEO & orbital injection
      const p = (sp - 0.380) / 0.140;
      targetCamY = (isMobile ? 1.50 : 1.35) - p * 0.15;
      targetCamZ = baseCamZ + 0.30 + p * 0.10;
    } else if (sp < 0.740) {
      // Stage 3: Lunar flyby
      const p = (sp - 0.520) / 0.220;
      targetCamY = (isMobile ? 1.35 : 1.20) - p * 0.15;
      targetCamZ = baseCamZ + 0.35;
    } else if (sp < 0.880) {
      // Stage 4: Mars encounter
      const p = (sp - 0.740) / 0.140;
      targetCamY = (isMobile ? 1.20 : 1.05) - p * 0.10;
      targetCamZ = baseCamZ + 0.35 - p * 0.2;
    } else {
      // Stage 5: Terminal deep space uplink
      const p = (sp - 0.880) / 0.120;
      targetCamY = (isMobile ? 1.10 : 0.95) - p * 0.15;
      targetCamZ = baseCamZ + 0.15 - p * 0.3;
    }

    targetCamY += mouse.y * 0.08;

    // Camera shake at ground zero ignition & Max-Q ascent
    const t = state.clock.getElapsedTime();
    let shakeX = 0;
    let shakeY = 0;
    if (sp >= 0.035 && sp < 0.240) {
      // Step 1 to 4: Camera rumble scales directly with engine burn and liftoff
      let shakeAmt = 0.001;
      if (sp < 0.080) {
        shakeAmt = THREE.MathUtils.lerp(0.0006, 0.0028, (sp - 0.035) / 0.045);
      } else if (sp < 0.170) {
        shakeAmt = THREE.MathUtils.lerp(0.0028, 0.0062, (sp - 0.080) / 0.090);
      } else {
        shakeAmt = THREE.MathUtils.lerp(0.0062, 0.0078, (sp - 0.170) / 0.070);
      }
      shakeX = (Math.sin(t * 88) * 0.7 + Math.cos(t * 124) * 0.3) * shakeAmt;
      shakeY = (Math.cos(t * 96) * 0.7 + Math.sin(t * 140) * 0.3) * shakeAmt;
    } else if (sp >= STAGE_CONFIG.stage01_ascent.maxQScrollRange[0] && sp <= STAGE_CONFIG.stage01_ascent.maxQScrollRange[1]) {
      const qRange = STAGE_CONFIG.stage01_ascent.maxQScrollRange;
      const qProgress = (sp - qRange[0]) / (qRange[1] - qRange[0]);
      const qBell = Math.sin(qProgress * Math.PI);
      const shakeAmt = STAGE_CONFIG.stage01_ascent.maxQShakeIntensity * qBell;
      shakeX = (Math.sin(t * 96) * 0.7 + Math.cos(t * 144) * 0.3) * shakeAmt;
      shakeY = (Math.cos(t * 110) * 0.7 + Math.sin(t * 170) * 0.3) * shakeAmt;
    }

    // Respect prefers-reduced-motion (disable camera shake)
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      shakeX = 0;
      shakeY = 0;
    }

    // Frame-rate independent cinematic camera damping (pure butter-smooth tracking with zero artificial jitter)
    const delta = state.clock.getDelta();
    const lerpFactor = 1 - Math.exp(-8.5 * delta);

    const override = (typeof window !== 'undefined' && (window as any).__cameraOverride) ? (window as any).__cameraOverride : null;
    if (override) {
      state.camera.position.set(override.x, override.y, override.z);
      state.camera.lookAt(override.lookAt[0], override.lookAt[1], override.lookAt[2]);
      return;
    }

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetCamX + shakeX, lerpFactor);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetCamY + shakeY, lerpFactor);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetCamZ, lerpFactor);

    // Architectural alignment with subtle pitch elevation tilt during ascent
    if (sp >= 0.18 && sp < 0.36) {
      const p = (sp - 0.18) / 0.18;
      pitchTilt = p * 0.12;
    }
    state.camera.lookAt(state.camera.position.x, state.camera.position.y + pitchTilt, 0);
  });

  return null;
};

// Dynamic Coastal Dawn Atmospheric Fog at Ground Level (dissolves horizon into morning sky)
const DynamicAtmosphericFog: React.FC<{
  scrollProgressRef: React.MutableRefObject<number>;
}> = ({ scrollProgressRef }) => {
  const { scene } = useThree();

  useFrame(() => {
    const sp = scrollProgressRef.current;
    if (sp < 0.22) {
      const u = sp / 0.22;
      // Soft coastal dawn maritime haze at ground level, seamlessly dissolving the horizon
      const density = THREE.MathUtils.lerp(0.014, 0.0, u);
      if (!scene.fog) {
        scene.fog = new THREE.FogExp2('#1e2a38', density);
      } else {
        (scene.fog as THREE.FogExp2).density = density;
      }
    } else {
      if (scene.fog) {
        scene.fog = null;
      }
    }
  });

  return null;
};

// Dynamic Space Lighting (Primary Oblique Sun + Dynamic Planetary Albedo Bounce)
const DynamicSpaceLighting: React.FC<{
  scrollProgressRef: React.MutableRefObject<number>;
}> = ({ scrollProgressRef }) => {
  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const bounceLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);

  useFrame(() => {
    const sp = scrollProgressRef.current;
    if (!sunLightRef.current || !bounceLightRef.current || !ambientLightRef.current) return;

    if (sp < 0.18) {
      // Stage 0: Ground Spaceport at Sriharikota (Warm golden morning dawn sunlight & coastal daylight)
      sunLightRef.current.color.set('#fff1db');
      sunLightRef.current.intensity = 3.0;
      sunLightRef.current.position.set(16, 9, 5);

      ambientLightRef.current.color.set('#bae6fd');
      ambientLightRef.current.intensity = 0.58;

      bounceLightRef.current.color.set('#ca8a04'); // Warm ground/sand reflection
      bounceLightRef.current.intensity = 0.40;
      bounceLightRef.current.position.set(-2, -4, 2);
    } else if (sp < 0.32) {
      // Stage 1: Atmospheric Ascent (Sun hardens into intense white, atmosphere thins out)
      const u = (sp - 0.18) / 0.14;
      sunLightRef.current.color.set('#ffffff');
      sunLightRef.current.intensity = 3.2;

      ambientLightRef.current.color.set(u < 0.5 ? '#93c5fd' : '#e0e7ff');
      ambientLightRef.current.intensity = THREE.MathUtils.lerp(0.55, 0.38, u);

      bounceLightRef.current.color.set('#38bdf8'); // Glowing atmospheric limb
      bounceLightRef.current.intensity = THREE.MathUtils.lerp(0.5, 1.2, u);
      bounceLightRef.current.position.set(-5, -7, 2);
    } else if (sp < 0.48) {
      // Stage 2: LEO & Orbital Constellation (Brilliant Earth blue albedo reflection)
      sunLightRef.current.color.set('#ffffff');
      sunLightRef.current.intensity = 3.2;
      sunLightRef.current.position.set(16, 9, 5);

      ambientLightRef.current.color.set('#ffffff');
      ambientLightRef.current.intensity = 0.38;

      bounceLightRef.current.color.set('#38bdf8');
      bounceLightRef.current.intensity = 1.35;
      bounceLightRef.current.position.set(-6, -8, 2);
    } else if (sp < 0.71) {
      // Stage 3: Moon Flyby (Grazing side sunlight with terminator crater relief)
      sunLightRef.current.color.set('#fffdf5');
      sunLightRef.current.intensity = STAGE_CONFIG.stage03_moon.sunIntensity;
      sunLightRef.current.position.set(...STAGE_CONFIG.stage03_moon.sunPosition);

      ambientLightRef.current.color.set('#e2e8f0');
      ambientLightRef.current.intensity = 0.28;

      bounceLightRef.current.color.set('#cbd5e1');
      bounceLightRef.current.intensity = 0.35;
      bounceLightRef.current.position.set(5, 1, -6);
    } else if (sp < 0.87) {
      // Stage 4: Mars Encounter (Warm sunlight at comfortable distance)
      sunLightRef.current.color.set(STAGE_CONFIG.stage04_mars.sunColor);
      sunLightRef.current.intensity = STAGE_CONFIG.stage04_mars.sunIntensity;
      sunLightRef.current.position.set(...STAGE_CONFIG.stage04_mars.sunPosition);

      ambientLightRef.current.color.set('#fed7aa');
      ambientLightRef.current.intensity = 0.28;

      bounceLightRef.current.color.set('#ea580c');
      bounceLightRef.current.intensity = 0.42;
      bounceLightRef.current.position.set(5, 1, -6);
    } else {
      // Stage 5: Deep Space Terminal Void (Stark solar key light with soft interstellar starlight)
      sunLightRef.current.color.set('#ffffff');
      sunLightRef.current.intensity = 2.6;
      sunLightRef.current.position.set(16, 9, 5);

      ambientLightRef.current.color.set('#818cf8');
      ambientLightRef.current.intensity = 0.28;

      bounceLightRef.current.color.set('#6366f1');
      bounceLightRef.current.intensity = 0.45;
      bounceLightRef.current.position.set(0, 4, 6);
    }
  });

  return (
    <>
      <ambientLight ref={ambientLightRef} intensity={0.58} color="#bae6fd" />
      {/* Primary Oblique Sun (Aligned with the optical Sun in WarpStarfield) */}
      <directionalLight ref={sunLightRef} position={[16, 9, 5]} intensity={3.0} color="#fff1db" />
      {/* Dynamic Planetary Albedo / Terrain Bounce Light */}
      <directionalLight ref={bounceLightRef} position={[-2, -4, 2]} intensity={0.4} color="#ca8a04" />
    </>
  );
};

// Continuous Celestial Encounters (Realistic Keplerian Approach & Flyby Trajectories)
// Sequence strictly follows:
// 1. Earth & orbital constellation depart (0.475)
// 2. Moon in continuous distance-approach -> close flyby -> distant departure (0.45 to 0.73)
// 3. Mars in continuous distance-approach -> close flyby -> distant departure (0.70 to 0.92)
// 4. Terminal Deep Space Void with Hero Satellite enlarged
const CelestialEncounters: React.FC<{
  scrollProgressRef: React.MutableRefObject<number>;
}> = ({ scrollProgressRef }) => {
  const moonRef = useRef<THREE.Group>(null);
  const marsRef = useRef<THREE.Group>(null);
  const distantEarthRef = useRef<THREE.Group>(null);
  const distantDeepSpaceBeaconRef = useRef<THREE.Group>(null);
  const moonOpacityRef = useRef(0);
  const marsOpacityRef = useRef(0);
  const distantEarthOpacityRef = useRef(0);

  const earthTextures = useMemo(() => getPhotorealisticEarthTextures(), []);

  useFrame((state, delta) => {
    const sp = scrollProgressRef.current;
    const t = state.clock.getElapsedTime();

    // =========================================================================
    // 1. REALISTIC KEPLERIAN LUNAR APPROACH & FLYBY (0.45 to 0.73)
    // =========================================================================
    // Constant Bearing Decreasing Range (CBDR) Trajectory:
    // Pushed back cleanly to z = -24.0 with majestic radius 1.85, unambiguously
    // separate from the foreground spacecraft (z = 0) with rich parallax!
    if (moonRef.current) {
      if (sp >= 0.45 && sp <= 0.73) {
        moonRef.current.visible = true;
        const u = (sp - 0.45) / 0.28; // Progress 0 -> 1

        // Smooth harmonic approach curve (continuous C1 velocity, peak at u = 0.50)
        const harmonic = Math.sin(u * Math.PI); // 0 -> 1 -> 0
        const zDist = -85.0 + (85.0 + STAGE_CONFIG.stage03_moon.moonClosestZ) * harmonic; // -85.0 down to -24.0
        const dist = 7.5 - zDist; // Distance to camera at Z = 7.5

        // Clean positioning in upper-right cosmic quadrant
        const tanX = 0.25 + 0.02 * (u - 0.5);
        const tanY = 0.12 - 0.02 * (u - 0.5);

        const xPos = 0.4 + dist * tanX;
        const yPos = 0.65 + dist * tanY;

        // Majestic scale: starts small (0.12) and peaks at 1.85 (STAGE_CONFIG.stage03_moon.moonRadius)
        const s = 0.12 + (STAGE_CONFIG.stage03_moon.moonRadius - 0.12) * harmonic;

        // Smooth opacity fade at cosmic boundaries (fades in 0->0.12, locked 1.0, fades out 0.88->1.0)
        const fadeIn = THREE.MathUtils.smoothstep(u, 0.0, 0.12);
        const fadeOut = 1.0 - THREE.MathUtils.smoothstep(u, 0.88, 1.0);
        moonOpacityRef.current = fadeIn * fadeOut;

        moonRef.current.position.set(xPos, yPos, zDist);
        moonRef.current.scale.set(s, s, s);

        // Near-Side Apollo/Chandrayaan landing maria & Tycho rays face camera and sunlight
        moonRef.current.rotation.y = 3.32 + (u - 0.5) * 0.42 + t * 0.008;
        moonRef.current.rotation.x = 0.16 + (u - 0.5) * 0.08;
      } else {
        moonRef.current.visible = false;
        moonOpacityRef.current = 0;
      }
    }

    // Distant background Earth marble (Looking back home from lunar flyby)
    if (distantEarthRef.current) {
      if (sp >= 0.45 && sp <= 0.73) {
        distantEarthRef.current.visible = true;
        const u = (sp - 0.45) / 0.28;
        const fadeIn = THREE.MathUtils.smoothstep(u, 0.0, 0.12);
        const fadeOut = 1.0 - THREE.MathUtils.smoothstep(u, 0.88, 1.0);
        distantEarthOpacityRef.current = fadeIn * fadeOut;

        const [eX, eY, eZ] = STAGE_CONFIG.stage03_moon.backgroundEarthPosition;
        distantEarthRef.current.position.set(eX, eY, eZ);
        const es = STAGE_CONFIG.stage03_moon.backgroundEarthScale;
        distantEarthRef.current.scale.set(es, es, es);
        distantEarthRef.current.rotation.y += delta * 0.01;
      } else {
        distantEarthRef.current.visible = false;
        distantEarthOpacityRef.current = 0;
      }
    }

    // =========================================================================
    // 2. REALISTIC KEPLERIAN MARS APPROACH & FLYBY (0.70 to 0.92)
    // =========================================================================
    // CBDR Interplanetary Approach:
    // Maintained at a majestic interplanetary cruise distance (peak z = -30.0, scale = 1.38)
    // Clean upper-right placement clear of story cards and telemetry
    if (marsRef.current) {
      if (sp >= 0.70 && sp <= 0.92) {
        marsRef.current.visible = true;
        const v = (sp - 0.70) / 0.22; // Progress 0 -> 1

        const harmonic = Math.sin(v * Math.PI);
        const zDist = -95.0 + (95.0 + STAGE_CONFIG.stage04_mars.marsClosestZ) * harmonic; // -95.0 down to -26.0
        const dist = 7.3 - zDist;

        // Clean upper-right placement clear of the text cards on the left
        const tanX = 0.26 + 0.02 * (v - 0.5);
        const tanY = 0.11 - 0.02 * (v - 0.5);

        const xPos = 0.4 + dist * tanX;
        const yPos = 0.55 + dist * tanY;

        // Elliptical encounter: swells from a distant 0.10 to a close high-detail 2.1 (STAGE_CONFIG.stage04_mars.marsRadius)
        const s = 0.10 + (STAGE_CONFIG.stage04_mars.marsRadius - 0.10) * harmonic;

        const fadeIn = THREE.MathUtils.smoothstep(v, 0.0, 0.12);
        const fadeOut = 1.0 - THREE.MathUtils.smoothstep(v, 0.88, 1.0);
        marsOpacityRef.current = fadeIn * fadeOut;

        marsRef.current.position.set(xPos, yPos, zDist);
        marsRef.current.scale.set(s, s, s);

        // Valles Marineris canyon rifts & Tharsis shield volcanoes face camera and sunlight
        marsRef.current.rotation.y = 3.52 + (v - 0.5) * 0.45 + t * 0.010;
        marsRef.current.rotation.x = 0.20 + (v - 0.5) * 0.10;
      } else {
        marsRef.current.visible = false;
        marsOpacityRef.current = 0;
      }
    }

    // =========================================================================
    // 3. TERMINAL DEEP SPACE VOID: DISTANT SUN & PALE BLUE DOT (EARTH) (0.86 to 1.00)
    // =========================================================================
    if (distantDeepSpaceBeaconRef.current) {
      if (sp >= 0.86) {
        distantDeepSpaceBeaconRef.current.visible = true;
      } else {
        distantDeepSpaceBeaconRef.current.visible = false;
      }
    }
  });

  return (
    <>
      {/* 1. Moon (Continuous Keplerian Flyby past Tycho craters) */}
      <group ref={moonRef} position={[24.0, 9.0, -85]} visible={false}>
        <MoonModel position={[0, 0, 0]} scale={1.0} opacityRef={moonOpacityRef} />
      </group>

      {/* 2. Mars (Continuous Keplerian Flyby past Olympus Mons) */}
      <group ref={marsRef} position={[26.0, 8.5, -95]} visible={false}>
        <MarsModel position={[0, 0, 0]} scale={1.0} opacityRef={marsOpacityRef} />
      </group>

      {/* 3. Distant Background Earth Marble (Narrative: Looking back home from lunar flyby) */}
      <group ref={distantEarthRef} visible={false}>
        <mesh>
          <sphereGeometry args={[1, 32, 24]} />
          <meshBasicMaterial map={earthTextures.dayTexture} />
        </mesh>
        <mesh scale={[1.06, 1.06, 1.06]}>
          <sphereGeometry args={[1, 32, 24]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* 4. Stage 05 Distant Pinpoint Sun & Pale Blue Dot Earth */}
      <group ref={distantDeepSpaceBeaconRef} position={STAGE_CONFIG.stage05_uplink.distantSunPosition} visible={false}>
        {/* Pinpoint distant Sun */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.55, 16, 16]} />
          <meshBasicMaterial color="#fffbeb" />
        </mesh>
        {/* Faint distant corona */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[12, 12]} />
          <meshBasicMaterial
            color="#fff0c2"
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {/* Tiny Pale Blue Dot (Earth) sitting 2.5 units to the right in the black void */}
        <mesh position={[2.5, -0.6, 1.5]}>
          <sphereGeometry args={[STAGE_CONFIG.stage05_uplink.distantEarthScale, 16, 16]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[2.5, -0.6, 1.5]}>
          <sphereGeometry args={[STAGE_CONFIG.stage05_uplink.distantEarthScale * 2.2, 16, 16]} />
          <meshBasicMaterial
            color="#0ea5e9"
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </>
  );
};

// Internal Scene Content
const SceneEntities: React.FC<{
  scrollProgressRef: React.MutableRefObject<number>;
  scrollSpeedRef: React.MutableRefObject<number>;
  activeStageIndex: number;
  isIgnited?: boolean;
  liftoffTime?: number;
  isLiftoffActive?: boolean;
}> = ({
  scrollProgressRef,
  scrollSpeedRef,
  activeStageIndex,
  isIgnited: _isIgnited,
  liftoffTime: _liftoffTime = 0,
  isLiftoffActive: _isLiftoffActive = false,
}) => {
  return (
    <>
      {/* 100% GPU-driven Starfield with Warp Streaks & Dynamic Atmospheric Sky */}
      <WarpStarfield
        scrollSpeedRef={scrollSpeedRef}
        scrollProgressRef={scrollProgressRef}
      />

      {/* Atmospheric Cloud Deck & Transonic Mach Vapor Punch centered on rocket at x = 2.6 */}
      <group position={[1.75, 0, 0]}>
        <AtmosphericClouds
          scrollProgressRef={scrollProgressRef}
          scrollSpeedRef={scrollSpeedRef}
        />
      </group>

      {/* Ground Launch Base & Slender Rocket positioned cleanly on the right (x = 2.6) */}
      <group position={[1.75, 0, 0]}>
        <Stage00LaunchPad
          scrollProgressRef={scrollProgressRef}
          isIgnited={_isIgnited}
          liftoffTime={_liftoffTime}
          isLiftoffActive={_isLiftoffActive}
        />

        <RocketModel
          scrollProgressRef={scrollProgressRef}
          scrollSpeedRef={scrollSpeedRef}
          isIgnited={_isIgnited}
          liftoffTime={_liftoffTime}
          isLiftoffActive={_isLiftoffActive}
        />
      </group>

      {/* 3D Earth & its 6 Keplerian Orbital Satellites (Mounts when ascending to orbit, saving massive memory & load time at ground zero) */}
      {activeStageIndex >= 1 && (
        <EarthModel scrollProgressRef={scrollProgressRef} scale={13.8} />
      )}

      {/* Continuous Zero-Overlap Celestial Encounters (Mounts only when approaching Moon/Mars stages) */}
      {activeStageIndex >= 2 && (
        <CelestialEncounters scrollProgressRef={scrollProgressRef} />
      )}
    </>
  );
};

// Adaptive Performance Controller: monitors frame delta times; if frame time stays above 20ms (>50fps drop),
// dynamically clamps DPR to 1.0 to protect smooth 60fps on integrated GPU laptops
const AdaptiveQualityController: React.FC = () => {
  const { gl } = useThree();
  const frameTimes = useRef<number[]>([]);
  const isReduced = useRef(false);

  useFrame((_, delta) => {
    const ms = delta * 1000;
    const history = frameTimes.current;
    history.push(ms);
    if (history.length > 50) history.shift();

    if (history.length >= 50) {
      const avg = history.reduce((a, b) => a + b, 0) / history.length;
      if (avg > STAGE_CONFIG.global.adaptiveQualityTargetMs && !isReduced.current) {
        gl.setPixelRatio(STAGE_CONFIG.global.dprMin);
        isReduced.current = true;
      } else if (avg < 15.5 && isReduced.current) {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, STAGE_CONFIG.global.dprMax));
        isReduced.current = false;
      }
    }
  });

  return null;
};

export const CosmicFlightScene: React.FC<CosmicFlightSceneProps> = ({
  scrollProgressRef,
  scrollSpeedRef,
  activeStageIndex,
  isIgnited: _isIgnited,
  liftoffTime: _liftoffTime = 0,
  isLiftoffActive: _isLiftoffActive = false,
}) => {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[#030611]">
      <Canvas
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: STAGE_CONFIG.global.toneMappingExposure,
          stencil: false,
          depth: true,
        }}
        camera={{ position: [0.4, 0.4, 7.2], fov: 36, near: 0.1, far: 200 }}
        dpr={[STAGE_CONFIG.global.dprMin, STAGE_CONFIG.global.dprMax]}
      >
        <AdaptiveQualityController />
        <FlightCameraRig
          scrollProgressRef={scrollProgressRef}
          isIgnited={_isIgnited}
          liftoffTime={_liftoffTime}
          isLiftoffActive={_isLiftoffActive}
        />

        {/* Dynamic Coastal Dawn Fog at Ground Level */}
        <DynamicAtmosphericFog scrollProgressRef={scrollProgressRef} />

        {/* Physical Space Lighting: Oblique Sunlight + Dynamic Planetary Albedo */}
        <DynamicSpaceLighting scrollProgressRef={scrollProgressRef} />

        <SceneEntities
          scrollProgressRef={scrollProgressRef}
          scrollSpeedRef={scrollSpeedRef}
          activeStageIndex={activeStageIndex}
          isIgnited={_isIgnited}
          liftoffTime={_liftoffTime}
          isLiftoffActive={_isLiftoffActive}
        />
      </Canvas>
    </div>
  );
};
