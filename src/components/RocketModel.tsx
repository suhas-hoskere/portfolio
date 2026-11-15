import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  getCachedSolarPanelTexture,
  getCachedGoldMliTexture,
  getCachedGoldMliBumpMap,
  getCachedCarbonBackingTexture,
  getCachedGenericBoosterTexture,
  getCachedGenericCoreTexture,
  getCachedGenericFairingTexture,
  getCachedRocketBumpMap,
} from './aerospaceTextures';

interface RocketModelProps {
  scrollProgressRef: React.MutableRefObject<number>;
  scrollSpeedRef: React.MutableRefObject<number>;
  isIgnited?: boolean;
  liftoffTime?: number;
  isLiftoffActive?: boolean;
}

// Procedural soft glowing radial particle texture for supersonic rocket exhaust
let cachedFlameParticleTexture: THREE.CanvasTexture | null = null;
function getCachedFlameParticleTexture() {
  if (cachedFlameParticleTexture) return cachedFlameParticleTexture;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.2, 'rgba(255, 215, 80, 0.9)');
  grad.addColorStop(0.5, 'rgba(249, 115, 22, 0.6)');
  grad.addColorStop(0.8, 'rgba(220, 38, 38, 0.25)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  cachedFlameParticleTexture = new THREE.CanvasTexture(canvas);
  cachedFlameParticleTexture.generateMipmaps = false;
  return cachedFlameParticleTexture;
}

// Procedural 100% soft camera-facing rocket exhaust flame envelope texture (NO hard edges)
let cachedSoftFlameSpriteTexture: THREE.CanvasTexture | null = null;
function getCachedSoftFlameSpriteTexture() {
  if (cachedSoftFlameSpriteTexture) return cachedSoftFlameSpriteTexture;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const center = size / 2;
  const grad = ctx.createRadialGradient(center, center, 0, center, center, center * 0.95);
  grad.addColorStop(0.00, 'rgba(255, 255, 255, 1.0)'); // Blinding white-hot core
  grad.addColorStop(0.18, 'rgba(255, 245, 190, 0.95)'); // Incandescent cream
  grad.addColorStop(0.38, 'rgba(255, 190, 45, 0.80)'); // Golden yellow
  grad.addColorStop(0.62, 'rgba(255, 100, 10, 0.45)'); // Fiery orange
  grad.addColorStop(0.82, 'rgba(220, 35, 5, 0.15)'); // Amber flame edge
  grad.addColorStop(1.00, 'rgba(160, 10, 0, 0.0)'); // Smooth 100% transparent falloff

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  cachedSoftFlameSpriteTexture = new THREE.CanvasTexture(canvas);
  cachedSoftFlameSpriteTexture.generateMipmaps = false;
  return cachedSoftFlameSpriteTexture;
}

// Procedural blinding white-hot supersonic core flame sprite texture
let cachedSoftCoreSpriteTexture: THREE.CanvasTexture | null = null;
function getCachedSoftCoreSpriteTexture() {
  if (cachedSoftCoreSpriteTexture) return cachedSoftCoreSpriteTexture;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const center = size / 2;
  const grad = ctx.createRadialGradient(center, center, 0, center, center, center * 0.90);
  grad.addColorStop(0.00, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.25, 'rgba(255, 255, 230, 0.95)');
  grad.addColorStop(0.55, 'rgba(255, 215, 110, 0.40)');
  grad.addColorStop(0.85, 'rgba(255, 160, 30, 0.08)');
  grad.addColorStop(1.00, 'rgba(255, 120, 0, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  cachedSoftCoreSpriteTexture = new THREE.CanvasTexture(canvas);
  cachedSoftCoreSpriteTexture.generateMipmaps = false;
  return cachedSoftCoreSpriteTexture;
}

// Procedural soft translucent cryogenic boil-off vapour puff texture
let cachedVapourTexture: THREE.CanvasTexture | null = null;
function getCachedVapourTexture() {
  if (cachedVapourTexture) return cachedVapourTexture;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const center = size / 2;
  const grad = ctx.createRadialGradient(center, center, 0, center, center, center * 0.95);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.45)');
  grad.addColorStop(0.25, 'rgba(240, 248, 255, 0.32)');
  grad.addColorStop(0.55, 'rgba(224, 242, 254, 0.16)');
  grad.addColorStop(0.80, 'rgba(210, 230, 250, 0.05)');
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  cachedVapourTexture = new THREE.CanvasTexture(canvas);
  cachedVapourTexture.generateMipmaps = false;
  return cachedVapourTexture;
}

export const RocketModel: React.FC<RocketModelProps> = ({
  scrollProgressRef,
  scrollSpeedRef,
  isIgnited: _isIgnited = false,
  liftoffTime = 0,
  isLiftoffActive = false,
}) => {
  const liftoffTimeRef = useRef(liftoffTime);
  const isLiftoffActiveRef = useRef(isLiftoffActive);
  liftoffTimeRef.current = liftoffTime;
  isLiftoffActiveRef.current = isLiftoffActive;

  const vehicleGroup = useRef<THREE.Group>(null);
  const rocketBodyGroup = useRef<THREE.Group>(null);
  const intactFairingGroup = useRef<THREE.Group>(null);
  const boosterLeft = useRef<THREE.Group>(null);
  const boosterRight = useRef<THREE.Group>(null);
  const fairingLeft = useRef<THREE.Group>(null);
  const fairingRight = useRef<THREE.Group>(null);
  const satelliteGroup = useRef<THREE.Group>(null);
  const solarLeft = useRef<THREE.Group>(null);
  const solarRight = useRef<THREE.Group>(null);
  const signalRing1 = useRef<THREE.Mesh>(null);
  const signalRing2 = useRef<THREE.Mesh>(null);

  // Translunar Injection (TLI) Thruster Pulse
  const tliFlameRef = useRef<THREE.Mesh>(null);
  const tliLightRef = useRef<THREE.PointLight>(null);

  // Idle Cryogenic Boil-Off Vapour Venting
  const cryoVapourGroup = useRef<THREE.Group>(null);

  // Dynamic particle flame system
  const flameLightRef = useRef<THREE.PointLight>(null);
  const flamePointsRef = useRef<THREE.Points>(null);
  const boosterFlameLeft = useRef<THREE.Group>(null);
  const boosterFlameRight = useRef<THREE.Group>(null);
  const coreFlamesRef = useRef<THREE.Group>(null);

  const flameTexture = useMemo(() => getCachedFlameParticleTexture(), []);
  const softPlumeTexture = useMemo(() => getCachedSoftFlameSpriteTexture(), []);
  const softCoreTexture = useMemo(() => getCachedSoftCoreSpriteTexture(), []);

  // 280 particles distributed across ALL FOUR ENGINE NOZZLES (Twin S200 Solid Boosters + Twin L110 Vikas Engines)
  const particleCount = 280;
  const { particleGeom, particleData } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const data = [];

    for (let i = 0; i < particleCount; i++) {
      // 0-89: Left S200 Booster (x = -0.76, y = -3.55)
      // 90-179: Right S200 Booster (x = +0.76, y = -3.55)
      // 180-229: Port Vikas Engine (x = -0.16, y = -4.35)
      // 230-279: Starboard Vikas Engine (x = +0.16, y = -4.35)
      const isLeftBooster = i < 90;
      const isRightBooster = i >= 90 && i < 180;
      const isPortVikas = i >= 180 && i < 230;
      const originX = isLeftBooster ? -0.76 : isRightBooster ? 0.76 : isPortVikas ? -0.16 : 0.16;
      const originY = (isLeftBooster || isRightBooster) ? -3.55 : -4.35;
      const isBooster = isLeftBooster || isRightBooster;

      const age = Math.random() * 0.45;
      const lifespan = 0.30 + Math.random() * 0.28;
      data.push({
        age,
        lifespan,
        originX,
        originY,
        isBooster,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -(3.5 + Math.random() * 4.2),
        vz: (Math.random() - 0.5) * 0.35,
      });

      positions[i * 3] = originX;
      positions[i * 3 + 1] = originY;
      positions[i * 3 + 2] = 0;

      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.9;
      colors[i * 3 + 2] = 0.5;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return { particleGeom: geom, particleData: data };
  }, [particleCount]);

  // Aerospace materials
  const materials = useMemo(() => {
    return {
      hullWhite: new THREE.MeshStandardMaterial({
        color: '#f8fafc',
        roughness: 0.22,
        metalness: 0.12,
      }),
      hullAccent: new THREE.MeshStandardMaterial({
        color: '#334155', // Industrial titanium dark accent
        roughness: 0.35,
        metalness: 0.45,
      }),
      hullDark: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.4,
        metalness: 0.6,
      }),
      engineMetal: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.28,
        metalness: 0.88,
      }),
      towerSteel: new THREE.MeshStandardMaterial({
        color: '#475569',
        roughness: 0.35,
        metalness: 0.82,
      }),
      flamePointsMat: new THREE.PointsMaterial({
        size: 0.58,
        map: flameTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true,
      }),
      softPlumeMat: new THREE.SpriteMaterial({
        map: softPlumeTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      }),
      softCoreMat: new THREE.SpriteMaterial({
        map: softCoreTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      }),
      flameShock: new THREE.MeshBasicMaterial({
        color: '#67e8f9', // Mach diamond supersonic shock cyan
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      }),
      boosterPlume: new THREE.MeshBasicMaterial({
        color: '#fb923c', // Incandescent solid booster exhaust
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      }),
      boosterPlumeWhite: new THREE.MeshBasicMaterial({
        color: '#ffffff', // Blinding white-hot supersonic core
        transparent: true,
        opacity: 0.98,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
      boosterPlumeOrange: new THREE.MeshBasicMaterial({
        color: '#ff6600', // Incandescent outer expansion shear plume
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
      tliFlameMat: new THREE.MeshBasicMaterial({
        color: '#818cf8', // Hypergolic translunar burn cyan-violet plasma
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
      }),
      goldMli: new THREE.MeshStandardMaterial({
        map: getCachedGoldMliTexture(),
        bumpMap: getCachedGoldMliBumpMap(),
        bumpScale: 0.05,
        roughness: 0.22,
        metalness: 0.92,
      }),
      coreHullMat: new THREE.MeshStandardMaterial({
        map: getCachedGenericCoreTexture(),
        bumpMap: getCachedRocketBumpMap(),
        bumpScale: 0.04,
        roughness: 0.22,
        metalness: 0.12,
      }),
      boosterHullMat: new THREE.MeshStandardMaterial({
        map: getCachedGenericBoosterTexture(),
        bumpMap: getCachedRocketBumpMap(),
        bumpScale: 0.04,
        roughness: 0.24,
        metalness: 0.12,
      }),
      fairingHullMat: new THREE.MeshStandardMaterial({
        map: getCachedGenericFairingTexture(),
        bumpMap: getCachedRocketBumpMap(),
        bumpScale: 0.03,
        roughness: 0.22,
        metalness: 0.10,
      }),
      cryoVapourMat: new THREE.SpriteMaterial({
        map: getCachedVapourTexture(),
        transparent: true,
        opacity: 0.35,
        blending: THREE.NormalBlending,
        depthWrite: false,
      }),
      solarPhotovoltaic: new THREE.MeshStandardMaterial({
        map: getCachedSolarPanelTexture(),
        roughness: 0.2,
        metalness: 0.35,
        emissive: '#092147',
        emissiveIntensity: 0.45,
        side: THREE.DoubleSide,
      }),
      solarBacking: new THREE.MeshStandardMaterial({
        map: getCachedCarbonBackingTexture(),
        roughness: 0.45,
        metalness: 0.5,
      }),
      solarFrame: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.35,
        metalness: 0.8,
      }),
      solarHinge: new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        roughness: 0.2,
        metalness: 0.9,
      }),
      solarYoke: new THREE.MeshStandardMaterial({
        color: '#475569',
        roughness: 0.25,
        metalness: 0.85,
      }),
      signalRipple: new THREE.MeshBasicMaterial({
        color: '#38bdf8',
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    };
  }, [flameTexture, softPlumeTexture, softCoreTexture]);

  useFrame((state, delta) => {
    const scrollProgress = scrollProgressRef.current;
    const scrollSpeed = scrollSpeedRef.current;
    const t = state.clock.getElapsedTime();

    // 1. VEHICLE ROTATION & ATTITUDE:
    // Strictly 100% vertical on launchpad and vertical clearance (< 0.22)
    if (vehicleGroup.current) {
      let targetRotZ = 0;
      if (scrollProgress < 0.22) {
        // Strictly vertical on pad and early vertical climb
        targetRotZ = 0;
      } else if (scrollProgress >= 0.22 && scrollProgress < 0.35) {
        // Smooth gravity pitch maneuver towards horizontal orbit over the Bay of Bengal
        const pitchProgress = (scrollProgress - 0.22) / 0.13;
        targetRotZ = -pitchProgress * 0.14;
      } else {
        // Orbital & deep space cruise attitude
        targetRotZ = -0.14 + Math.sin(t * 0.5) * 0.012;
      }

      // Subtle physical thrust acoustic vibration during high-thrust atmospheric burn
      let thrustVibeX = 0;
      let thrustVibeY = 0;
      const lt = liftoffTimeRef.current;
      const la = isLiftoffActiveRef.current;
      const isBurningNow =
        (la && lt >= 0.0) ||
        (scrollProgress > 0.005 && scrollProgress < 0.22);

      if (isBurningNow) {
        let intensity = 1.0;
        if (la) {
          if (lt < 1.5) {
            intensity = 0.5 + (lt / 1.5) * 1.5;
          } else if (lt < 4.5) {
            intensity = 2.0 + Math.sin(t * 30) * 0.5;
          } else {
            intensity = 2.4;
          }
        } else {
          intensity = 1.0 + Math.min(scrollSpeed * 2.5, 2.0);
        }

        thrustVibeX = (Math.sin(t * 72) * 0.0012 + Math.cos(t * 110) * 0.0008) * intensity;
        thrustVibeY = (Math.cos(t * 85) * 0.0016 + Math.sin(t * 125) * 0.0009) * intensity;
      }

      vehicleGroup.current.position.x = thrustVibeX;
      vehicleGroup.current.position.y = 1.28 + thrustVibeY;
      vehicleGroup.current.rotation.z = THREE.MathUtils.lerp(
        vehicleGroup.current.rotation.z,
        targetRotZ,
        0.08
      );
    }

    // 2. REALISTIC DYNAMIC ROCKET EXHAUST FIRE PLUME (Particles + Shock Diamonds + Light)
    // Starts at T-00.00 ignition or when liftoff sequence begins or when user begins scrolling
    const lt = liftoffTimeRef.current;
    const la = isLiftoffActiveRef.current;
    const isBurning =
      (la && lt >= 0.0) ||
      (scrollProgress > 0.005 && scrollProgress < 0.28);
    if (flamePointsRef.current) {
      if (isBurning) {
        flamePointsRef.current.visible = true;

        const posAttr = particleGeom.getAttribute('position') as THREE.BufferAttribute;
        const colAttr = particleGeom.getAttribute('color') as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;
        const colArray = colAttr.array as Float32Array;

        const thrustBoost = 1.0 + Math.min(scrollSpeed * 2.0, 2.5);

        for (let i = 0; i < particleCount; i++) {
          const p = particleData[i];
          p.age += delta * (1.6 + thrustBoost * 0.6);

          if (p.age >= p.lifespan) {
            p.age = 0;
            p.lifespan = 0.3 + Math.random() * 0.25;

            // If boosters have separated at scroll >= 0.22, hide booster particles offscreen
            if (p.isBooster && scrollProgress >= 0.22) {
              posArray[i * 3 + 1] = -999;
              p.vy = 0;
            } else {
              posArray[i * 3] = p.originX + (Math.random() - 0.5) * 0.16;
              posArray[i * 3 + 1] = p.originY;
              posArray[i * 3 + 2] = (Math.random() - 0.5) * 0.16;

              p.vx = (Math.random() - 0.5) * 0.45;
              p.vy = -(3.6 + Math.random() * 4.4 + thrustBoost * 3.0);
              p.vz = (Math.random() - 0.5) * 0.45;
            }
          } else {
            // Integrate turbulent particle motion
            posArray[i * 3] += p.vx * delta;
            posArray[i * 3 + 1] += p.vy * delta;
            posArray[i * 3 + 2] += p.vz * delta;

            // Turbulent outward plume expansion with altitude
            p.vx *= 1.03;
            p.vz *= 1.03;
          }

          // Dynamic combustion color grading along exhaust plume
          const ratio = p.age / p.lifespan;
          if (ratio < 0.2) {
            // White-hot core
            colArray[i * 3] = 1.0;
            colArray[i * 3 + 1] = 0.98;
            colArray[i * 3 + 2] = 0.85;
          } else if (ratio < 0.5) {
            // Incandescent golden plasma
            colArray[i * 3] = 1.0;
            colArray[i * 3 + 1] = 0.75;
            colArray[i * 3 + 2] = 0.15;
          } else if (ratio < 0.8) {
            // Fiery orange thrust
            colArray[i * 3] = 0.98;
            colArray[i * 3 + 1] = 0.42;
            colArray[i * 3 + 2] = 0.08;
          } else {
            // Crimson edge
            colArray[i * 3] = 0.75;
            colArray[i * 3 + 1] = 0.15;
            colArray[i * 3 + 2] = 0.05;
          }
        }

        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;

        // Dynamic Point Light illuminating rocket aft skirt and nozzle
        if (flameLightRef.current) {
          flameLightRef.current.intensity = 4.0 + Math.sin(t * 45) * 1.5;
        }

        // Twin solid booster exhaust flames (active before separation < 0.22)
        if (boosterFlameLeft.current && boosterFlameRight.current) {
          if (scrollProgress < 0.22) {
            boosterFlameLeft.current.visible = true;
            boosterFlameRight.current.visible = true;
            let bRamp = 1.0;
            if (la) {
              bRamp = Math.min(lt / 1.2, 1.0);
            }
            const bFlicker = (1.0 + thrustBoost * 0.25) * (1.0 + Math.sin(t * 48) * 0.12) * bRamp;
            const wPulsate = (1.0 + Math.sin(t * 32) * 0.06) * bRamp;
            boosterFlameLeft.current.scale.set(wPulsate, bFlicker, wPulsate);
            boosterFlameRight.current.scale.set(wPulsate, bFlicker, wPulsate);
          } else {
            boosterFlameLeft.current.visible = false;
            boosterFlameRight.current.visible = false;
          }
        }

        // Twin L110 core Vikas engine exhaust flames (active during ascent < 0.28)
        if (coreFlamesRef.current) {
          coreFlamesRef.current.visible = true;
          let cRamp = 1.0;
          if (la) {
            cRamp = Math.min(lt / 1.2, 1.0);
          }
          const vFlicker = (1.0 + thrustBoost * 0.2) * (1.0 + Math.sin(t * 54) * 0.1) * cRamp;
          coreFlamesRef.current.scale.set(cRamp, vFlicker, cRamp);
        }
      } else {
        flamePointsRef.current.visible = false;
        if (flameLightRef.current) flameLightRef.current.intensity = 0;
        if (boosterFlameLeft.current) boosterFlameLeft.current.visible = false;
        if (boosterFlameRight.current) boosterFlameRight.current.visible = false;
        if (coreFlamesRef.current) coreFlamesRef.current.visible = false;
      }
    }

    // 3. SOLID ROCKET BOOSTERS: Separate cleanly at 0.22 and drop away
    if (boosterLeft.current && boosterRight.current) {
      if (scrollProgress >= 0.28) {
        boosterLeft.current.visible = false;
        boosterRight.current.visible = false;
      } else if (scrollProgress >= 0.22) {
        boosterLeft.current.visible = true;
        boosterRight.current.visible = true;
        const sep = (scrollProgress - 0.22) / 0.06;
        boosterLeft.current.position.x = -0.76 - sep * 3.5;
        boosterLeft.current.position.y = -2.1 - sep * 3.0;
        boosterLeft.current.rotation.z = sep * 0.4;
        boosterRight.current.position.x = 0.76 + sep * 3.5;
        boosterRight.current.position.y = -2.1 - sep * 3.0;
        boosterRight.current.rotation.z = -sep * 0.4;
      } else {
        boosterLeft.current.visible = true;
        boosterRight.current.visible = true;
        boosterLeft.current.position.set(-0.76, -2.1, 0);
        boosterLeft.current.rotation.set(0, 0, 0);
        boosterRight.current.position.set(0.76, -2.1, 0);
        boosterRight.current.rotation.set(0, 0, 0);
      }
    }

    // 4. FAIRING JETTISON & LOWER BODY ELIMINATION (scroll 0.27 to 0.32):
    const isDeploying = scrollProgress >= 0.27;
    const isFullyDeployed = scrollProgress >= 0.32;

    // A. INTACT FAIRING vs SEPARATING HALVES:
    // Before 0.27: Intact 100% solid fairing with ZERO gap or protruding seam!
    if (intactFairingGroup.current) {
      intactFairingGroup.current.visible = !isDeploying;
    }

    // Lower Rocket Body drops away downwards rapidly into atmosphere
    if (rocketBodyGroup.current) {
      if (isFullyDeployed) {
        rocketBodyGroup.current.visible = false;
      } else if (isDeploying) {
        rocketBodyGroup.current.visible = true;
        const sepRatio = (scrollProgress - 0.27) / 0.05;
        rocketBodyGroup.current.position.y = -sepRatio * 20.0;
        rocketBodyGroup.current.rotation.z = sepRatio * 0.2;
      } else {
        rocketBodyGroup.current.visible = true;
        rocketBodyGroup.current.position.set(0, 0, 0);
        rocketBodyGroup.current.rotation.set(0, 0, 0);
      }
    }

    // Fairing Halves split open laterally and drift away
    if (fairingLeft.current && fairingRight.current) {
      if (!isDeploying || isFullyDeployed) {
        fairingLeft.current.visible = false;
        fairingRight.current.visible = false;
      } else {
        fairingLeft.current.visible = true;
        fairingRight.current.visible = true;
        const sepRatio = (scrollProgress - 0.27) / 0.05;
        fairingLeft.current.position.x = -sepRatio * 5.5;
        fairingLeft.current.position.y = 3.0 - sepRatio * 2.8;
        fairingLeft.current.rotation.z = sepRatio * 0.8;
        fairingRight.current.position.x = sepRatio * 5.5;
        fairingRight.current.position.y = 3.0 - sepRatio * 2.8;
        fairingRight.current.rotation.z = -sepRatio * 0.8;
      }
    }

    // 5. SATELLITE EMERGES FROM INSIDE FAIRING, GROWS IN ORBIT, AND ENLARGES ON LAST PAGE:
    if (satelliteGroup.current) {
      if (isDeploying) {
        satelliteGroup.current.visible = true;
        const deployRatio = Math.min((scrollProgress - 0.27) / 0.10, 1.0);

        // Slide upwards out of the booster adapter ring
        const baseY = THREE.MathUtils.lerp(2.8, 0.4, deployRatio);

        // Scale in orbit (0.35 to 1.30)
        let currentScale = THREE.MathUtils.lerp(0.35, 1.30, deployRatio);

        // AT LAST PAGE (Terminal Uplink scroll >= 0.86): Magnify satellite size to prominent hero scale!
        if (scrollProgress >= 0.86) {
          const terminalZoom = Math.min(Math.max((scrollProgress - 0.86) / 0.10, 0), 1.0);
          // Scale smoothly increases up to 3.0x prominent hero scale!
          currentScale = THREE.MathUtils.lerp(1.30, 3.0, terminalZoom);
          satelliteGroup.current.position.y = THREE.MathUtils.lerp(baseY, 0.2, terminalZoom);
          satelliteGroup.current.position.x = THREE.MathUtils.lerp(0, -0.3, terminalZoom);
        } else {
          satelliteGroup.current.position.y = baseY;
          satelliteGroup.current.position.x = 0;
        }

        satelliteGroup.current.scale.set(currentScale, currentScale, currentScale);

        // Attitude targeting & banking maneuvers during planetary flybys
        let targetRotZ = 0;
        let targetRotX = 0;
        if (scrollProgress >= 0.50 && scrollProgress <= 0.70) {
          // Lunar flyby attitude banking: spacecraft points payload sensors toward Moon
          const mFactor = Math.sin(((scrollProgress - 0.50) / 0.20) * Math.PI);
          targetRotZ = -mFactor * 0.18;
          targetRotX = mFactor * 0.12;
        } else if (scrollProgress >= 0.72 && scrollProgress <= 0.86) {
          // Mars encounter attitude alignment
          const marsFactor = Math.sin(((scrollProgress - 0.72) / 0.14) * Math.PI);
          targetRotZ = -marsFactor * 0.22;
          targetRotX = marsFactor * 0.15;
        }

        satelliteGroup.current.rotation.z = THREE.MathUtils.lerp(satelliteGroup.current.rotation.z, targetRotZ, 0.08);
        satelliteGroup.current.rotation.x = THREE.MathUtils.lerp(satelliteGroup.current.rotation.x, targetRotX, 0.08);
        satelliteGroup.current.rotation.y = t * 0.22;

        // Solar panels unfold in multi-stage mechanical sequence with elastic space structure damping
        if (solarLeft.current && solarRight.current) {
          const unfoldProgress = Math.min(Math.max((deployRatio - 0.25) / 0.75, 0), 1.0);
          const angle = (1 - unfoldProgress) * (-Math.PI / 2);
          const wingFlex = Math.sin(t * 3.2) * 0.012 * Math.min(scrollSpeed * 0.5, 1.0);
          solarLeft.current.rotation.y = angle + wingFlex;
          solarRight.current.rotation.y = -angle - wingFlex;
        }
      } else {
        // Tucked inside rocket payload fairing before deployment
        satelliteGroup.current.visible = false;
        satelliteGroup.current.scale.set(0.35, 0.35, 0.35);
      }
    }

    // 6. TRANSLUNAR INJECTION (TLI) HYPERGOLIC BURN (scroll 0.43 to 0.48):
    // Spacecraft fires thruster to depart Earth orbit toward the Moon
    const isTliBurning = scrollProgress >= 0.43 && scrollProgress <= 0.48;
    if (tliFlameRef.current) {
      if (isTliBurning) {
        tliFlameRef.current.visible = true;
        const tliProgress = (scrollProgress - 0.43) / 0.05;
        const tliBell = Math.sin(tliProgress * Math.PI);
        materials.tliFlameMat.opacity = tliBell * 0.85;
        const tliFlicker = (1.0 + Math.sin(t * 45) * 0.2) * tliBell;
        tliFlameRef.current.scale.set(1.0 + tliFlicker * 0.15, 1.2 * tliFlicker, 1.0 + tliFlicker * 0.15);
        if (tliLightRef.current) {
          tliLightRef.current.intensity = 3.0 * tliBell;
        }
      } else {
        tliFlameRef.current.visible = false;
        materials.tliFlameMat.opacity = 0;
        if (tliLightRef.current) tliLightRef.current.intensity = 0;
      }
    }

    // 7. TERMINAL UPLINK SIGNAL TRANSMISSION (scroll >= 0.88):
    const isTransmitting = scrollProgress >= 0.88;
    if (signalRing1.current && signalRing2.current) {
      if (isTransmitting) {
        signalRing1.current.visible = true;
        signalRing2.current.visible = true;
        const wave1 = (t * 1.5) % 1.0;
        const wave2 = (t * 1.5 + 0.5) % 1.0;
        signalRing1.current.scale.setScalar(0.5 + wave1 * 3.5);
        (signalRing1.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 - wave1 * 0.8);
        signalRing2.current.scale.setScalar(0.5 + wave2 * 3.5);
        (signalRing2.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 - wave2 * 0.8);
      } else {
        signalRing1.current.visible = false;
        signalRing2.current.visible = false;
      }
    }

    // 8. CRYOGENIC BOIL-OFF VAPOUR VENTING (Pad Idle):
    if (cryoVapourGroup.current) {
      const isIdleOnPad = scrollProgress < 0.02 && !isBurning;
      cryoVapourGroup.current.visible = isIdleOnPad;
      if (isIdleOnPad) {
        const vChildren = cryoVapourGroup.current.children;
        for (let vi = 0; vi < vChildren.length; vi++) {
          const sprite = vChildren[vi] as THREE.Sprite;
          const cycle = (t * 0.5 + vi * 0.33) % 1.0;
          sprite.position.x = 0.48 + cycle * 0.85;
          sprite.position.y = 0.45 + Math.sin(cycle * Math.PI) * 0.12;
          sprite.position.z = 0.05 - cycle * 0.30;
          const scale = 0.4 + cycle * 0.8;
          sprite.scale.set(scale, scale * 0.75, 1);
          (sprite.material as THREE.SpriteMaterial).opacity = Math.sin(cycle * Math.PI) * 0.32;
        }
      }
    }
  });

  return (
    <group ref={vehicleGroup} position={[0, 1.28, 0]} scale={[0.29, 0.29, 0.29]}>
      {/* =========================================================================
          1. SATELLITE PAYLOAD (EMERGES FROM INSIDE FAIRING & CONTINUES ENTIRE JOURNEY)
         ========================================================================= */}
      <group ref={satelliteGroup} position={[0, 0.5, 0]} visible={false}>
        {/* Central Satellite Body (Gold MLI Thermal Insulation Foil) */}
        <mesh material={materials.goldMli}>
          <boxGeometry args={[1.0, 1.3, 1.0]} />
        </mesh>

        {/* High-Gain Parabolic Communications Dish Antenna */}
        <mesh position={[0, 0.9, 0.25]} rotation={[0.4, 0, 0]} material={materials.hullWhite}>
          <coneGeometry args={[0.7, 0.25, 24, 1, true]} />
        </mesh>
        <mesh position={[0, 1.15, 0.35]} material={materials.hullAccent}>
          <cylinderGeometry args={[0.03, 0.03, 0.35, 8]} />
        </mesh>

        {/* Concentric Signal Telemetry Ripples (Pulsing at terminal uplink) */}
        <mesh ref={signalRing1} position={[0, 1.3, 0.4]} rotation={[-Math.PI / 2, 0, 0]} material={materials.signalRipple} visible={false}>
          <ringGeometry args={[0.4, 0.46, 32]} />
        </mesh>
        <mesh ref={signalRing2} position={[0, 1.3, 0.4]} rotation={[-Math.PI / 2, 0, 0]} material={materials.signalRipple} visible={false}>
          <ringGeometry args={[0.4, 0.46, 32]} />
        </mesh>

        {/* Satellite Main Engine Nozzle Bell (Central aft propulsion) */}
        <mesh position={[0, -0.72, 0]} rotation={[Math.PI, 0, 0]} material={materials.engineMetal}>
          <coneGeometry args={[0.18, 0.25, 16, 1, true]} />
        </mesh>

        {/* Translunar Injection (TLI) Thruster Plume */}
        <group position={[0, -0.85, 0]}>
          <mesh ref={tliFlameRef} rotation={[Math.PI, 0, 0]} material={materials.tliFlameMat} visible={false}>
            <coneGeometry args={[0.15, 1.2, 16, 1, true]} />
          </mesh>
          <pointLight ref={tliLightRef} position={[0, -0.3, 0]} color="#818cf8" intensity={0} distance={5} />
        </group>

        {/* Left Solar Panel Array Wing (Multi-segment articulated array) */}
        <group ref={solarLeft} position={[-0.5, 0, 0]}>
          {/* Root Deployment Yoke & Actuator */}
          <mesh position={[-0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.solarYoke}>
            <cylinderGeometry args={[0.035, 0.035, 0.12, 12]} />
          </mesh>
          <mesh position={[-0.15, 0, 0]} material={materials.solarYoke}>
            <boxGeometry args={[0.16, 0.06, 0.04]} />
          </mesh>
          <mesh position={[-0.24, 0, 0]} material={materials.solarHinge}>
            <boxGeometry args={[0.04, 0.14, 0.06]} />
          </mesh>

          {/* Segment 1: Inner Solar Panel */}
          <mesh position={[-0.82, 0, 0]} material={materials.solarFrame}>
            <boxGeometry args={[1.12, 0.96, 0.02]} />
          </mesh>
          <mesh position={[-0.82, 0, 0.015]} material={materials.solarPhotovoltaic}>
            <planeGeometry args={[1.08, 0.92]} />
          </mesh>
          <mesh position={[-0.82, 0, -0.015]} rotation={[0, Math.PI, 0]} material={materials.solarPhotovoltaic}>
            <planeGeometry args={[1.08, 0.92]} />
          </mesh>

          {/* Mechanical Inter-panel Hinges */}
          <mesh position={[-1.39, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.solarHinge}>
            <cylinderGeometry args={[0.025, 0.025, 0.08, 12]} />
          </mesh>
          <mesh position={[-1.39, -0.35, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.solarHinge}>
            <cylinderGeometry args={[0.025, 0.025, 0.08, 12]} />
          </mesh>
          <mesh position={[-1.39, 0, 0]} material={materials.solarYoke}>
            <boxGeometry args={[0.04, 0.08, 0.03]} />
          </mesh>

          {/* Segment 2: Outer Solar Panel */}
          <mesh position={[-1.96, 0, 0]} material={materials.solarFrame}>
            <boxGeometry args={[1.12, 0.96, 0.02]} />
          </mesh>
          <mesh position={[-1.96, 0, 0.015]} material={materials.solarPhotovoltaic}>
            <planeGeometry args={[1.08, 0.92]} />
          </mesh>
          <mesh position={[-1.96, 0, -0.015]} rotation={[0, Math.PI, 0]} material={materials.solarPhotovoltaic}>
            <planeGeometry args={[1.08, 0.92]} />
          </mesh>
          <mesh position={[-2.54, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.solarHinge}>
            <cylinderGeometry args={[0.015, 0.015, 0.06, 8]} />
          </mesh>
        </group>

        {/* Right Solar Panel Array Wing (Multi-segment articulated array) */}
        <group ref={solarRight} position={[0.5, 0, 0]}>
          {/* Root Deployment Yoke & Actuator */}
          <mesh position={[0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.solarYoke}>
            <cylinderGeometry args={[0.035, 0.035, 0.12, 12]} />
          </mesh>
          <mesh position={[0.15, 0, 0]} material={materials.solarYoke}>
            <boxGeometry args={[0.16, 0.06, 0.04]} />
          </mesh>
          <mesh position={[0.24, 0, 0]} material={materials.solarHinge}>
            <boxGeometry args={[0.04, 0.14, 0.06]} />
          </mesh>

          {/* Segment 1: Inner Solar Panel */}
          <mesh position={[0.82, 0, 0]} material={materials.solarFrame}>
            <boxGeometry args={[1.12, 0.96, 0.02]} />
          </mesh>
          <mesh position={[0.82, 0, 0.015]} material={materials.solarPhotovoltaic}>
            <planeGeometry args={[1.08, 0.92]} />
          </mesh>
          <mesh position={[0.82, 0, -0.015]} rotation={[0, Math.PI, 0]} material={materials.solarPhotovoltaic}>
            <planeGeometry args={[1.08, 0.92]} />
          </mesh>

          {/* Mechanical Inter-panel Hinges */}
          <mesh position={[1.39, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.solarHinge}>
            <cylinderGeometry args={[0.025, 0.025, 0.08, 12]} />
          </mesh>
          <mesh position={[1.39, -0.35, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.solarHinge}>
            <cylinderGeometry args={[0.025, 0.025, 0.08, 12]} />
          </mesh>
          <mesh position={[1.39, 0, 0]} material={materials.solarYoke}>
            <boxGeometry args={[0.04, 0.08, 0.03]} />
          </mesh>

          {/* Segment 2: Outer Solar Panel */}
          <mesh position={[1.96, 0, 0]} material={materials.solarFrame}>
            <boxGeometry args={[1.12, 0.96, 0.02]} />
          </mesh>
          <mesh position={[1.96, 0, 0.015]} material={materials.solarPhotovoltaic}>
            <planeGeometry args={[1.08, 0.92]} />
          </mesh>
          <mesh position={[1.96, 0, -0.015]} rotation={[0, Math.PI, 0]} material={materials.solarPhotovoltaic}>
            <planeGeometry args={[1.08, 0.92]} />
          </mesh>
          <mesh position={[2.54, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.solarHinge}>
            <cylinderGeometry args={[0.015, 0.015, 0.06, 8]} />
          </mesh>
        </group>

        {/* Corner-mounted Scientific Magnetometer Boom */}
        <mesh position={[-0.35, -0.95, -0.35]} material={materials.solarFrame}>
          <cylinderGeometry args={[0.025, 0.025, 0.65, 8]} />
        </mesh>
      </group>

      {/* =========================================================================
          2A. INTACT PAYLOAD FAIRING (ACTIVE & 100% SEAMLESS BEFORE SEPARATION < 0.27)
          Unified full 360-deg geometry matching Upper Stage Core radius & vertices
         ========================================================================= */}
      <group ref={intactFairingGroup}>
        {/* Aerodynamic Ogive Nose Cone */}
        <mesh position={[0, 4.7, 0]} material={materials.fairingHullMat}>
          <coneGeometry args={[0.44, 1.6, 32]} />
        </mesh>
        {/* Fairing Cylindrical Barrel Base */}
        <mesh position={[0, 3.45, 0]} material={materials.fairingHullMat}>
          <cylinderGeometry args={[0.44, 0.44, 0.9, 32]} />
        </mesh>
        {/* Interstage Seam Ring */}
        <mesh position={[0, 3.0, 0]} material={materials.hullAccent}>
          <cylinderGeometry args={[0.442, 0.442, 0.06, 32]} />
        </mesh>
      </group>

      {/* =========================================================================
          2B. SEPARATING PAYLOAD FAIRING HALVES (ACTIVE ONLY DURING SEPARATION >= 0.27)
         ========================================================================= */}
      {/* Left Fairing Shell (Separates along -X) */}
      <group ref={fairingLeft} position={[0, 3.0, 0]} visible={false}>
        <mesh position={[0, 1.7, 0]} material={materials.hullWhite}>
          <coneGeometry args={[0.44, 1.6, 32, 1, false, Math.PI / 2, Math.PI]} />
        </mesh>
        <mesh position={[0, 0.45, 0]} material={materials.hullWhite}>
          <cylinderGeometry args={[0.44, 0.44, 0.9, 32, 1, false, Math.PI / 2, Math.PI]} />
        </mesh>
        <mesh position={[0, 0.55, 0]} material={materials.hullAccent}>
          <cylinderGeometry args={[0.441, 0.441, 0.22, 32, 1, false, Math.PI / 2, Math.PI]} />
        </mesh>
      </group>

      {/* Right Fairing Shell (Separates along +X) */}
      <group ref={fairingRight} position={[0, 3.0, 0]} visible={false}>
        <mesh position={[0, 1.7, 0]} material={materials.hullWhite}>
          <coneGeometry args={[0.44, 1.6, 32, 1, false, -Math.PI / 2, Math.PI]} />
        </mesh>
        <mesh position={[0, 0.45, 0]} material={materials.hullWhite}>
          <cylinderGeometry args={[0.44, 0.44, 0.9, 32, 1, false, -Math.PI / 2, Math.PI]} />
        </mesh>
        <mesh position={[0, 0.55, 0]} material={materials.hullAccent}>
          <cylinderGeometry args={[0.441, 0.441, 0.22, 32, 1, false, -Math.PI / 2, Math.PI]} />
        </mesh>
      </group>

      {/* =========================================================================
          3. ROCKET BOOSTER BODY (DROPS DOWNWARDS WHEN ELIMINATED)
         ========================================================================= */}
      <group ref={rocketBodyGroup}>
        {/* Upper Stage Core with Panel Weld Seams and Cryogenic Insulation */}
        <mesh position={[0, 1.8, 0]} material={materials.coreHullMat}>
          <cylinderGeometry args={[0.44, 0.44, 2.4, 32]} />
        </mesh>

        {/* Gentle Cryogenic Boil-off Vapour Vent (Pad Idle) */}
        <group ref={cryoVapourGroup} position={[0, 0, 0]} visible={false}>
          {[0, 1, 2].map((idx) => (
            <sprite key={`cryo-vent-${idx}`} material={materials.cryoVapourMat} />
          ))}
        </group>

        {/* Interstage Separation Ring with Circumferential Stiffener Flanges */}
        <mesh position={[0, 0.45, 0]} material={materials.hullDark}>
          <cylinderGeometry args={[0.445, 0.445, 0.25, 32]} />
        </mesh>
        <mesh position={[0, 0.45, 0]} material={materials.engineMetal}>
          <cylinderGeometry args={[0.45, 0.45, 0.05, 32]} />
        </mesh>

        {/* First Stage Main Liquid Propellant Core Tank */}
        <mesh position={[0, -1.8, 0]} material={materials.coreHullMat}>
          <cylinderGeometry args={[0.44, 0.44, 4.2, 32]} />
        </mesh>

        {/* External Propellant Feed Raceways / Cable Conduits (Running along Core Cylinder) */}
        <mesh position={[0.43, -1.8, 0.12]} material={materials.engineMetal}>
          <cylinderGeometry args={[0.016, 0.016, 4.1, 8]} />
        </mesh>
        <mesh position={[-0.43, -1.8, 0.12]} material={materials.engineMetal}>
          <cylinderGeometry args={[0.016, 0.016, 4.1, 8]} />
        </mesh>

        {/* L110 Liquid Core Stage Aft Thrust Skirt */}
        <mesh position={[0, -4.0, 0]} material={materials.hullDark}>
          <cylinderGeometry args={[0.44, 0.35, 0.25, 32]} />
        </mesh>

        {/* Twin Vikas Liquid Engine Bells (Dual-engine cluster of L110 core) */}
        {[-0.16, 0.16].map((vx, vIdx) => (
          <mesh
            key={`vikas-bell-${vIdx}`}
            position={[vx, -4.22, 0]}
            rotation={[Math.PI, 0, 0]}
            material={materials.engineMetal}
          >
            <coneGeometry args={[0.13, 0.32, 24, 1, true]} />
          </mesh>
        ))}\n

        {/* Twin Core Vikas Supersonic Exhaust Flames (Ignited at T-0 along with Boosters) */}
        <group ref={coreFlamesRef} visible={false}>
          {[-0.16, 0.16].map((vx, vIdx) => (
            <group key={`core-flame-${vIdx}`} position={[vx, -4.25, 0]}>
              {/* Blinding White-Hot Core Sprites (Additive, Camera-Facing, Soft Radial Falloff) */}
              <sprite position={[0, -0.10, 0]} scale={[0.8, 1.1, 1]} material={materials.softCoreMat} renderOrder={30} />
              <sprite position={[0, -0.45, 0]} scale={[1.4, 1.7, 1]} material={materials.softCoreMat} renderOrder={30} />
              {/* Incandescent Golden/Orange Expanding Plume Sprites (Zero Hard Silhouette Edges) */}
              <sprite position={[0, -0.95, 0]} scale={[2.1, 2.6, 1]} material={materials.softPlumeMat} renderOrder={29} />
              <sprite position={[0, -1.65, 0]} scale={[3.0, 3.6, 1]} material={materials.softPlumeMat} renderOrder={28} />
            </group>
          ))}
          <pointLight position={[0, -4.5, 0]} color="#ffaa33" intensity={16} distance={10} />
        </group>

        {/* =========================================================================
            SOLID ROCKET STRAP-ON BOOSTERS (AUTHENTIC ISRO S200 HEAVY-LIFT SCALE)
           ========================================================================= */}
        {/* Left S200 Booster (ISRO Livery) */}
        <group ref={boosterLeft} position={[-0.76, -2.1, 0]}>
          {/* Canted Booster Aerodynamic Nose Cone (Outward Cant ~3 deg) */}
          <mesh position={[-0.04, 2.15, 0]} rotation={[0, 0, 0.05]} material={materials.hullWhite}>
            <coneGeometry args={[0.34, 1.15, 32]} />
          </mesh>

          {/* 4 Forward Separation Jettison Motor Pods around Nosecone Base */}
          {[
            { x: 0.32, z: 0, ry: 0 },
            { x: -0.32, z: 0, ry: Math.PI },
            { x: 0, z: 0.32, ry: Math.PI / 2 },
            { x: 0, z: -0.32, ry: -Math.PI / 2 },
          ].map((pod, pIdx) => (
            <group key={`b-l-pod-${pIdx}`} position={[pod.x, 1.62, pod.z]} rotation={[0, pod.ry, 0]}>
              <mesh material={materials.engineMetal}>
                <boxGeometry args={[0.06, 0.16, 0.06]} />
              </mesh>
              <mesh position={[0.02, -0.06, 0]} rotation={[0, 0, -0.4]} material={materials.engineMetal}>
                <cylinderGeometry args={[0.015, 0.025, 0.06, 6]} />
              </mesh>
            </group>
          ))}

          {/* Main S200 Booster Solid Propellant Casing (Generic PBR Finish with Panel Welds & Frost) */}
          <mesh position={[0, 0.25, 0]} rotation={[0, Math.PI, 0]} material={materials.boosterHullMat}>
            <cylinderGeometry args={[0.34, 0.34, 2.8, 32]} />
          </mesh>

          {/* Upper Thrust Transmission A-Frame Struts (Connecting S200 to L110 Core) */}
          <mesh position={[0.20, 1.25, 0.08]} rotation={[0, 0, -0.45]} material={materials.towerSteel}>
            <cylinderGeometry args={[0.03, 0.03, 0.42, 8]} />
          </mesh>
          <mesh position={[0.20, 1.25, -0.08]} rotation={[0, 0, -0.45]} material={materials.towerSteel}>
            <cylinderGeometry args={[0.03, 0.03, 0.42, 8]} />
          </mesh>

          {/* Lower Aft Attachment Struts */}
          <mesh position={[0.18, -1.05, 0]} rotation={[0, 0, -0.25]} material={materials.towerSteel}>
            <boxGeometry args={[0.32, 0.06, 0.14]} />
          </mesh>

          {/* Aft Skirt Conical Flare */}
          <mesh position={[0, -1.22, 0]} material={materials.hullDark}>
            <cylinderGeometry args={[0.34, 0.37, 0.26, 32]} />
          </mesh>

          {/* Submerged Flex Nozzle Bell */}
          <mesh position={[0, -1.45, 0]} rotation={[Math.PI, 0, 0]} material={materials.engineMetal}>
            <coneGeometry args={[0.25, 0.46, 24, 1, true]} />
          </mesh>

          {/* Booster Soft Additive Supersonic Thrust Fire Plume */}
          <group ref={boosterFlameLeft} position={[0, -1.55, 0]} visible={false}>
            {/* Multi-Stage Soft Camera-Facing Supersonic Flame Column (Zero Hard Silhouette Edges) */}
            {/* 1. Blinding Incandescent Supersonic Core */}
            <sprite position={[0, -0.10, 0]} scale={[1.4, 1.6, 1]} material={materials.softCoreMat} renderOrder={32} />
            <sprite position={[0, -0.55, 0]} scale={[2.2, 2.5, 1]} material={materials.softCoreMat} renderOrder={31} />
            <sprite position={[0, -1.30, 0]} scale={[3.0, 3.4, 1]} material={materials.softCoreMat} renderOrder={30} />
            <sprite position={[0, -2.25, 0]} scale={[3.8, 4.2, 1]} material={materials.softCoreMat} renderOrder={29} />
            {/* 2. Expanding Incandescent Golden & Fiery Amber Plume Envelope */}
            <sprite position={[0, -3.40, 0]} scale={[4.8, 5.4, 1]} material={materials.softPlumeMat} renderOrder={28} />
            <sprite position={[0, -4.80, 0]} scale={[5.8, 6.6, 1]} material={materials.softPlumeMat} renderOrder={27} />
            <sprite position={[0, -6.50, 0]} scale={[6.8, 8.0, 1]} material={materials.softPlumeMat} renderOrder={26} />
            <sprite position={[0, -8.60, 0]} scale={[7.8, 9.6, 1]} material={materials.softPlumeMat} renderOrder={25} />
            <pointLight position={[0, -1.2, 0]} color="#ffaa22" intensity={24} distance={16} />
            <pointLight position={[0, -5.0, 0]} color="#ff6600" intensity={18} distance={14} />
          </group>
        </group>

        {/* Right S200 Booster (INDIA Livery) */}
        <group ref={boosterRight} position={[0.76, -2.1, 0]}>
          {/* Canted Booster Aerodynamic Nose Cone (Outward Cant ~3 deg) */}
          <mesh position={[0.04, 2.15, 0]} rotation={[0, 0, -0.05]} material={materials.hullWhite}>
            <coneGeometry args={[0.34, 1.15, 32]} />
          </mesh>

          {/* 4 Forward Separation Jettison Motor Pods around Nosecone Base */}
          {[
            { x: 0.32, z: 0, ry: 0 },
            { x: -0.32, z: 0, ry: Math.PI },
            { x: 0, z: 0.32, ry: Math.PI / 2 },
            { x: 0, z: -0.32, ry: -Math.PI / 2 },
          ].map((pod, pIdx) => (
            <group key={`b-r-pod-${pIdx}`} position={[pod.x, 1.62, pod.z]} rotation={[0, pod.ry, 0]}>
              <mesh material={materials.engineMetal}>
                <boxGeometry args={[0.06, 0.16, 0.06]} />
              </mesh>
              <mesh position={[-0.02, -0.06, 0]} rotation={[0, 0, 0.4]} material={materials.engineMetal}>
                <cylinderGeometry args={[0.015, 0.025, 0.06, 6]} />
              </mesh>
            </group>
          ))}

          {/* Main S200 Booster Solid Propellant Casing (Generic PBR Finish with Panel Welds & Frost) */}
          <mesh position={[0, 0.25, 0]} rotation={[0, Math.PI, 0]} material={materials.boosterHullMat}>
            <cylinderGeometry args={[0.34, 0.34, 2.8, 32]} />
          </mesh>

          {/* Upper Thrust Transmission A-Frame Struts (Connecting S200 to L110 Core) */}
          <mesh position={[-0.20, 1.25, 0.08]} rotation={[0, 0, 0.45]} material={materials.towerSteel}>
            <cylinderGeometry args={[0.03, 0.03, 0.42, 8]} />
          </mesh>
          <mesh position={[-0.20, 1.25, -0.08]} rotation={[0, 0, 0.45]} material={materials.towerSteel}>
            <cylinderGeometry args={[0.03, 0.03, 0.42, 8]} />
          </mesh>

          {/* Lower Aft Attachment Struts */}
          <mesh position={[-0.18, -1.05, 0]} rotation={[0, 0, 0.25]} material={materials.towerSteel}>
            <boxGeometry args={[0.32, 0.06, 0.14]} />
          </mesh>

          {/* Aft Skirt Conical Flare */}
          <mesh position={[0, -1.22, 0]} material={materials.hullDark}>
            <cylinderGeometry args={[0.34, 0.37, 0.26, 32]} />
          </mesh>

          {/* Submerged Flex Nozzle Bell */}
          <mesh position={[0, -1.45, 0]} rotation={[Math.PI, 0, 0]} material={materials.engineMetal}>
            <coneGeometry args={[0.25, 0.46, 24, 1, true]} />
          </mesh>

          {/* Booster Soft Additive Supersonic Thrust Fire Plume */}
          <group ref={boosterFlameRight} position={[0, -1.55, 0]} visible={false}>
            {/* Multi-Stage Soft Camera-Facing Supersonic Flame Column (Zero Hard Silhouette Edges) */}
            {/* 1. Blinding Incandescent Supersonic Core */}
            <sprite position={[0, -0.10, 0]} scale={[1.4, 1.6, 1]} material={materials.softCoreMat} renderOrder={32} />
            <sprite position={[0, -0.55, 0]} scale={[2.2, 2.5, 1]} material={materials.softCoreMat} renderOrder={31} />
            <sprite position={[0, -1.30, 0]} scale={[3.0, 3.4, 1]} material={materials.softCoreMat} renderOrder={30} />
            <sprite position={[0, -2.25, 0]} scale={[3.8, 4.2, 1]} material={materials.softCoreMat} renderOrder={29} />
            {/* 2. Expanding Incandescent Golden & Fiery Amber Plume Envelope */}
            <sprite position={[0, -3.40, 0]} scale={[4.8, 5.4, 1]} material={materials.softPlumeMat} renderOrder={28} />
            <sprite position={[0, -4.80, 0]} scale={[5.8, 6.6, 1]} material={materials.softPlumeMat} renderOrder={27} />
            <sprite position={[0, -6.50, 0]} scale={[6.8, 8.0, 1]} material={materials.softPlumeMat} renderOrder={26} />
            <sprite position={[0, -8.60, 0]} scale={[7.8, 9.6, 1]} material={materials.softPlumeMat} renderOrder={25} />
            <pointLight position={[0, -1.2, 0]} color="#ffaa22" intensity={24} distance={16} />
            <pointLight position={[0, -5.0, 0]} color="#ff6600" intensity={18} distance={14} />
          </group>
        </group>

        {/* =========================================================================
            4. DYNAMIC HIGH-SPEED TURBULENT EXHAUST PLUME (Particles + Shock Diamonds)
           ========================================================================= */}
        {/* Dynamic Point Light casting realistic roaring orange combustion light */}
        <pointLight
          ref={flameLightRef}
          position={[0, -4.6, 0]}
          color="#ff8822"
          intensity={0}
          distance={8}
        />

        {/* Dynamic GPU flame particles & incandescent supersonic exhaust sparks */}
        <points ref={flamePointsRef} geometry={particleGeom} material={materials.flamePointsMat} visible={false} />
      </group>
    </group>
  );
};
