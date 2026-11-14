import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RocketModel } from './RocketModel';
import { EarthModel } from './EarthModel';
import { MoonModel } from './MoonModel';
import { MarsModel } from './MarsModel';
import { WarpStarfield } from './WarpStarfield';
import { IndiaLaunchPad } from './IndiaLaunchPad';
import { AtmosphericClouds } from './AtmosphericClouds';
import { STAGE_CONFIG } from '../scene/stageConfig';

interface CosmicFlightSceneProps {
  scrollProgressRef: React.MutableRefObject<number>;
  scrollSpeedRef: React.MutableRefObject<number>;
  activeStageIndex: number;
  isIgnited?: boolean;
}

// 3D Camera Rig: Telephoto architectural alignment (view vector strictly parallel to -Z)
// Completely eliminates perspective keystoning / slant, keeping the rocket & launch tower 100% plumb vertical!
// Cleanly frames the launch vehicle & spacecraft on the right half, leaving the left 50% open for story cards!
const FlightCameraRig: React.FC<{
  scrollProgressRef: React.MutableRefObject<number>;
  isIgnited?: boolean;
}> = ({ scrollProgressRef, isIgnited = false }) => {
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
    let targetCamY = isMobile ? 0.45 : 0.4;
    let targetCamZ = baseCamZ;

    // Continuous spline interpolation across stages
    if (sp < 0.18) {
      // Ground zero -> lift-off
      const p = sp / 0.18;
      targetCamY = (isMobile ? 0.35 : 0.2) + p * 0.40;
      targetCamZ = baseCamZ + p * 0.2;
    } else if (sp < 0.36) {
      // Atmospheric ascent & cloud punch: Camera pulls back and tilts up as speed rises
      const p = (sp - 0.18) / 0.18;
      targetCamY = (isMobile ? 0.75 : 0.60) + p * 0.25;
      targetCamZ = baseCamZ + 0.2 + p * 0.55;
    } else if (sp < 0.52) {
      // LEO & translunar injection
      const p = (sp - 0.36) / 0.16;
      targetCamY = (isMobile ? 0.95 : 0.80) - p * 0.15;
      targetCamZ = baseCamZ + 0.3 + p * 0.1;
    } else if (sp < 0.72) {
      // Lunar flyby
      const p = (sp - 0.52) / 0.20;
      targetCamY = (isMobile ? 0.80 : 0.65) - p * 0.15;
      targetCamZ = baseCamZ + 0.35;
    } else if (sp < 0.88) {
      // Mars encounter
      const p = (sp - 0.72) / 0.16;
      targetCamY = (isMobile ? 0.65 : 0.50) - p * 0.10;
      targetCamZ = baseCamZ + 0.35 - p * 0.2;
    } else {
      // Terminal deep space uplink
      const p = (sp - 0.88) / 0.12;
      targetCamY = (isMobile ? 0.55 : 0.40) - p * 0.15;
      targetCamZ = baseCamZ + 0.15 - p * 0.3;
    }

    targetCamY += mouse.y * 0.08;

    // Camera shake at ground zero ignition & Max-Q ascent
    const t = state.clock.getElapsedTime();
    let shakeX = 0;
    let shakeY = 0;
    if ((isIgnited || sp > 0.005) && sp < 0.08) {
      const shakeAmt = STAGE_CONFIG.stage00_launchPad.padCameraShake;
      shakeX = (Math.sin(t * 78) * 0.7 + Math.cos(t * 112) * 0.3) * shakeAmt;
      shakeY = (Math.cos(t * 88) * 0.7 + Math.sin(t * 130) * 0.3) * shakeAmt;
    } else if (sp >= STAGE_CONFIG.stage01_ascent.maxQScrollRange[0] && sp <= STAGE_CONFIG.stage01_ascent.maxQScrollRange[1]) {
      const qRange = STAGE_CONFIG.stage01_ascent.maxQScrollRange;
      const qProgress = (sp - qRange[0]) / (qRange[1] - qRange[0]);
      const qBell = Math.sin(qProgress * Math.PI);
      const shakeAmt = STAGE_CONFIG.stage01_ascent.maxQShakeIntensity * qBell;
      shakeX = (Math.sin(t * 96) * 0.7 + Math.cos(t * 144) * 0.3) * shakeAmt;
      shakeY = (Math.cos(t * 110) * 0.7 + Math.sin(t * 170) * 0.3) * shakeAmt;
    }

    // Frame-rate independent cinematic camera damping (pure butter-smooth tracking with zero artificial jitter)
    const delta = state.clock.getDelta();
    const lerpFactor = 1 - Math.exp(-8.5 * delta);

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetCamX + shakeX, lerpFactor);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetCamY + shakeY, lerpFactor);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetCamZ, lerpFactor);

    // Architectural alignment with subtle pitch elevation tilt during ascent
    let pitchTilt = 0;
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
      sunLightRef.current.intensity = STAGE_CONFIG.stage02_orbit.sunIntensity;
      sunLightRef.current.position.set(...STAGE_CONFIG.stage02_orbit.sunPosition);

      ambientLightRef.current.color.set('#ffffff');
      ambientLightRef.current.intensity = 0.38;

      bounceLightRef.current.color.set('#38bdf8');
      bounceLightRef.current.intensity = 1.35;
      bounceLightRef.current.position.set(-6, -8, 2);
    } else if (sp < 0.71) {
      // Stage 3: Moon Flyby (Silvery lunar regolith albedo reflection at comfortable distance)
      sunLightRef.current.color.set('#fffdf5');
      sunLightRef.current.intensity = 3.0;

      ambientLightRef.current.color.set('#e2e8f0');
      ambientLightRef.current.intensity = 0.32;

      bounceLightRef.current.color.set('#cbd5e1');
      bounceLightRef.current.intensity = 0.48;
      bounceLightRef.current.position.set(5, 1, -6);
    } else if (sp < 0.87) {
      // Stage 4: Mars Encounter (Warm ferric oxide albedo bounce at comfortable distance)
      sunLightRef.current.color.set('#fff8eb');
      sunLightRef.current.intensity = 2.8;

      ambientLightRef.current.color.set('#fed7aa');
      ambientLightRef.current.intensity = 0.32;

      bounceLightRef.current.color.set('#ea580c');
      bounceLightRef.current.intensity = 0.58;
      bounceLightRef.current.position.set(5, 1, -6);
    } else {
      // Stage 5: Deep Space Terminal Void (Stark solar key light with soft interstellar starlight)
      sunLightRef.current.color.set('#ffffff');
      sunLightRef.current.intensity = 2.6;

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
  const moonOpacityRef = useRef(0);
  const marsOpacityRef = useRef(0);

  useFrame((state) => {
    const sp = scrollProgressRef.current;
    const t = state.clock.getElapsedTime();

    // =========================================================================
    // 1. REALISTIC KEPLERIAN LUNAR APPROACH & FLYBY (0.45 to 0.73)
    // =========================================================================
    // Constant Bearing Decreasing Range (CBDR) Trajectory:
    // Maintained at a comfortable deep-space distance (peak z = -27.0, scale = 1.33)
    // Elegantly framed in the upper right celestial quadrant without filling the screen
    if (moonRef.current) {
      if (sp >= 0.45 && sp <= 0.73) {
        moonRef.current.visible = true;
        const u = (sp - 0.45) / 0.28; // Progress 0 -> 1

        // Smooth harmonic approach curve (continuous C1 velocity, peak at u = 0.50)
        const harmonic = Math.sin(u * Math.PI); // 0 -> 1 -> 0
        const zDist = -85.0 + 58.0 * harmonic; // -85.0 down to -27.0 at periapsis -> -85.0
        const dist = 7.5 - zDist; // Distance to camera at Z = 7.5

        // Clean positioning in upper-right cosmic quadrant
        const tanX = 0.28 + 0.02 * (u - 0.5);
        const tanY = 0.12 - 0.02 * (u - 0.5);

        const xPos = 0.4 + dist * tanX;
        const yPos = 0.65 + dist * tanY;

        // Comfortable deep-space scale: starts tiny (0.08) and peaks at a majestic 1.33
        const s = 0.08 + 1.25 * harmonic;

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
        const zDist = -95.0 + 65.0 * harmonic; // -95.0 down to -30.0 at closest approach -> -95.0
        const dist = 7.3 - zDist;

        // Clean upper-right placement clear of the text cards on the left
        const tanX = 0.29 + 0.02 * (v - 0.5);
        const tanY = 0.11 - 0.02 * (v - 0.5);

        const xPos = 0.4 + dist * tanX;
        const yPos = 0.55 + dist * tanY;

        // Comfortable interplanetary scale: peaks at 1.38
        const s = 0.08 + 1.30 * harmonic;

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
    </>
  );
};

// Internal Scene Content
const SceneEntities: React.FC<{
  scrollProgressRef: React.MutableRefObject<number>;
  scrollSpeedRef: React.MutableRefObject<number>;
  activeStageIndex: number;
  isIgnited?: boolean;
}> = ({ scrollProgressRef, scrollSpeedRef, activeStageIndex, isIgnited }) => {
  return (
    <>
      {/* 100% GPU-driven Starfield with Warp Streaks & Dynamic Atmospheric Sky */}
      <WarpStarfield
        scrollSpeedRef={scrollSpeedRef}
        scrollProgressRef={scrollProgressRef}
      />

      {/* Atmospheric Cloud Deck & Transonic Mach Vapor Punch centered on rocket at x = 2.6 */}
      <group position={[2.6, 0, 0]}>
        <AtmosphericClouds
          scrollProgressRef={scrollProgressRef}
          scrollSpeedRef={scrollSpeedRef}
        />
      </group>

      {/* Ground Launch Base in India & Slender Rocket positioned cleanly on the right (x = 2.6) */}
      <group position={[2.6, 0, 0]}>
        <IndiaLaunchPad scrollProgressRef={scrollProgressRef} isIgnited={isIgnited} />

        <RocketModel
          scrollProgressRef={scrollProgressRef}
          scrollSpeedRef={scrollSpeedRef}
          isIgnited={isIgnited}
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

export const CosmicFlightScene: React.FC<CosmicFlightSceneProps> = ({
  scrollProgressRef,
  scrollSpeedRef,
  activeStageIndex,
  isIgnited,
}) => {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[#030611]">
      <Canvas
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
          stencil: false,
          depth: true,
        }}
        camera={{ position: [0.4, 0.4, 7.2], fov: 36, near: 0.1, far: 200 }}
        dpr={[1, 2]}
      >
        <FlightCameraRig
          scrollProgressRef={scrollProgressRef}
          isIgnited={isIgnited}
        />

        {/* Dynamic Coastal Dawn Fog at Ground Level */}
        <DynamicAtmosphericFog scrollProgressRef={scrollProgressRef} />

        {/* Physical Space Lighting: Oblique Sunlight + Dynamic Planetary Albedo */}
        <DynamicSpaceLighting scrollProgressRef={scrollProgressRef} />

        <SceneEntities
          scrollProgressRef={scrollProgressRef}
          scrollSpeedRef={scrollSpeedRef}
          activeStageIndex={activeStageIndex}
          isIgnited={isIgnited}
        />
      </Canvas>
    </div>
  );
};
