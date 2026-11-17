import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SriharikotaVegetation } from './SriharikotaVegetation';
import { STAGE_CONFIG } from '../scene/stageConfig';

interface Stage00LaunchPadProps {
  scrollProgressRef: React.MutableRefObject<number>;
  isIgnited?: boolean;
  liftoffTime: number; // 0 to 10 seconds
  isLiftoffActive: boolean;
}

// ============================================================================
// 1. PROCEDURAL 2K PBR TERRAIN TEXTURES
// Concrete apron, packed earth, blast soot, and natural coastal scrub
// ============================================================================
let cachedTerrainTextures: { diffuse: THREE.CanvasTexture; bump: THREE.CanvasTexture } | null = null;

function getCachedTerrainTextures(): { diffuse: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  if (cachedTerrainTextures) return cachedTerrainTextures;

  const size = 384;
  const dCanvas = document.createElement('canvas');
  dCanvas.width = size;
  dCanvas.height = size;
  const dctx = dCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bctx = bCanvas.getContext('2d')!;

  // 1. Natural coastal sandy soil & scrub base (Sriharikota Barrier Island)
  const baseGrad = dctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  baseGrad.addColorStop(0.0, '#505d6e'); // Concrete grey under pad
  baseGrad.addColorStop(0.12, '#454e59'); // Apron perimeter
  baseGrad.addColorStop(0.20, '#b8a98f'); // Coastal dune sand
  baseGrad.addColorStop(0.35, '#8c8068'); // Compacted sandy loam
  baseGrad.addColorStop(0.60, '#5a6b4b'); // Dry coastal scrub & sea-grass
  baseGrad.addColorStop(0.85, '#48563c'); // Outer scrubland
  baseGrad.addColorStop(1.0, '#36422e'); // Distant marsh border
  dctx.fillStyle = baseGrad;
  dctx.fillRect(0, 0, size, size);

  // East side: Bay of Bengal coastal sea horizon transition
  const seaGrad = dctx.createLinearGradient(size * 0.65, 0, size, 0);
  seaGrad.addColorStop(0.0, 'rgba(184, 169, 143, 0.0)');
  seaGrad.addColorStop(0.20, 'rgba(210, 198, 172, 0.65)'); // Pale surf sand spit
  seaGrad.addColorStop(0.40, 'rgba(64, 98, 125, 0.85)'); // Bay of Bengal coastal water
  seaGrad.addColorStop(1.0, 'rgba(38, 62, 82, 0.95)'); // Deep sea horizon
  dctx.fillStyle = seaGrad;
  dctx.fillRect(size * 0.65, 0, size * 0.35, size);

  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, size, size);

  // 2. Concrete Launch Apron (Paved circular foundation with radial joints)
  const cx = size / 2;
  const cy = size / 2;
  const apronR = 105;

  dctx.save();
  const apronGrad = dctx.createRadialGradient(cx, cy, 0, cx, cy, apronR);
  apronGrad.addColorStop(0.0, '#64748b');
  apronGrad.addColorStop(0.72, '#475569');
  apronGrad.addColorStop(0.92, '#334155');
  apronGrad.addColorStop(1.0, 'rgba(51, 65, 85, 0)');
  dctx.fillStyle = apronGrad;
  dctx.beginPath();
  dctx.arc(cx, cy, apronR, 0, Math.PI * 2);
  dctx.fill();

  // Radial & concentric concrete expansion joints
  dctx.strokeStyle = '#1e293b';
  dctx.lineWidth = 2.0;
  for (let r = 25; r < apronR; r += 25) {
    dctx.beginPath();
    dctx.arc(cx, cy, r, 0, Math.PI * 2);
    dctx.stroke();
  }
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    dctx.beginPath();
    dctx.moveTo(cx, cy);
    dctx.lineTo(cx + Math.cos(a) * apronR, cy + Math.sin(a) * apronR);
    dctx.stroke();
  }

  // Flame trench lateral blast weathering & soot streaks (East-West corridor)
  const blastGrad = dctx.createLinearGradient(cx - 160, cy, cx + 160, cy);
  blastGrad.addColorStop(0.0, 'rgba(15, 23, 42, 0.85)');
  blastGrad.addColorStop(0.35, 'rgba(30, 41, 59, 0.45)');
  blastGrad.addColorStop(0.50, 'rgba(51, 65, 85, 0.15)');
  blastGrad.addColorStop(0.65, 'rgba(30, 41, 59, 0.45)');
  blastGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.85)');
  dctx.fillStyle = blastGrad;
  dctx.fillRect(cx - 160, cy - 45, 320, 90);
  dctx.restore();

  // 3. Lightweight micro-gravel texture stippling (Fast & zero RAM spike)
  dctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
  for (let s = 0; s < 300; s++) {
    dctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }

  const diffuse = new THREE.CanvasTexture(dCanvas);
  diffuse.wrapS = THREE.RepeatWrapping;
  diffuse.wrapT = THREE.RepeatWrapping;
  diffuse.generateMipmaps = false;
  diffuse.minFilter = THREE.LinearFilter;

  const bump = new THREE.CanvasTexture(bCanvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.generateMipmaps = false;
  bump.minFilter = THREE.LinearFilter;

  cachedTerrainTextures = { diffuse, bump };
  return cachedTerrainTextures;
}

// Procedural soft glowing aviation obstacle beacon sprite texture
let cachedBeaconGlowTexture: THREE.CanvasTexture | null = null;
function getCachedBeaconGlowTexture(): THREE.CanvasTexture {
  if (cachedBeaconGlowTexture) return cachedBeaconGlowTexture;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const center = size / 2;
  const grad = ctx.createRadialGradient(center, center, 0, center, center, center * 0.95);
  grad.addColorStop(0.00, 'rgba(255, 120, 120, 1.0)'); // Warm incandescent red filament center
  grad.addColorStop(0.18, 'rgba(255, 30, 30, 0.92)'); // Deep aviation obstacle red
  grad.addColorStop(0.45, 'rgba(230, 15, 15, 0.55)'); // Soft red bloom halo
  grad.addColorStop(0.75, 'rgba(180, 5, 5, 0.18)'); // Ambient falloff
  grad.addColorStop(1.00, 'rgba(120, 0, 0, 0.0)'); // 100% transparent edge

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  cachedBeaconGlowTexture = new THREE.CanvasTexture(canvas);
  cachedBeaconGlowTexture.generateMipmaps = false;
  return cachedBeaconGlowTexture;
}

// Procedural soft billowing smoke puff texture
let cachedSmokeTexture: THREE.CanvasTexture | null = null;
function getCachedSmokeTexture(): THREE.CanvasTexture {
  if (cachedSmokeTexture) return cachedSmokeTexture;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const center = size / 2;
  const grad = ctx.createRadialGradient(center, center, 0, center, center, center * 0.95);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.70)');
  grad.addColorStop(0.25, 'rgba(240, 243, 248, 0.50)');
  grad.addColorStop(0.55, 'rgba(210, 220, 232, 0.25)');
  grad.addColorStop(0.80, 'rgba(175, 188, 205, 0.08)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  cachedSmokeTexture = new THREE.CanvasTexture(canvas);
  cachedSmokeTexture.generateMipmaps = false;
  return cachedSmokeTexture;
}

// Procedural ground mist texture
let cachedMistTexture: THREE.CanvasTexture | null = null;
function getCachedMistTexture(): THREE.CanvasTexture {
  if (cachedMistTexture) return cachedMistTexture;

  const width = 512;
  const height = 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
  grad.addColorStop(0.0, 'rgba(235, 245, 255, 0.35)');
  grad.addColorStop(0.4, 'rgba(215, 230, 245, 0.20)');
  grad.addColorStop(0.75, 'rgba(185, 205, 225, 0.05)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  cachedMistTexture = new THREE.CanvasTexture(canvas);
  cachedMistTexture.generateMipmaps = false;
  return cachedMistTexture;
}

// Procedural fire blast ember texture
let cachedEmberTexture: THREE.CanvasTexture | null = null;
function getCachedEmberTexture(): THREE.CanvasTexture {
  if (cachedEmberTexture) return cachedEmberTexture;

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const center = size / 2;
  const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.3, 'rgba(255, 215, 80, 0.9)');
  grad.addColorStop(0.6, 'rgba(249, 115, 22, 0.6)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  cachedEmberTexture = new THREE.CanvasTexture(canvas);
  cachedEmberTexture.generateMipmaps = false;
  return cachedEmberTexture;
}

// Cached Launch Pad Materials & Geometries (Instantiated once globally)
let cachedPadMaterials: any = null;
function getCachedPadMaterials(terrain: any, smokeTexture: any, mistTexture: any, emberTexture: any, beaconGlowTexture: any) {
  if (cachedPadMaterials) return cachedPadMaterials;
  cachedPadMaterials = {
    concreteApron: new THREE.MeshLambertMaterial({
      map: terrain.diffuse,
    }),
    mlpDeckSteel: new THREE.MeshLambertMaterial({
      color: '#94a3b8',
    }),
    mlpConcreteBase: new THREE.MeshLambertMaterial({
      color: '#475569',
    }),
    galvanizedTruss: new THREE.MeshLambertMaterial({
      color: '#94a3b8',
    }),
    towerSteel: new THREE.MeshLambertMaterial({
      color: '#475569',
    }),
    trenchPit: new THREE.MeshLambertMaterial({
      color: '#1e2430',
    }),
    flameDeflectorSteel: new THREE.MeshLambertMaterial({
      color: '#334155',
      emissive: new THREE.Color('#000000'),
      emissiveIntensity: 0.0,
    }),
    delugeSprayMat: new THREE.MeshBasicMaterial({
      color: '#e0f2fe',
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
    qdPurgeMat: new THREE.SpriteMaterial({
      map: mistTexture,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.NormalBlending,
    }),
    handrailYellow: new THREE.MeshLambertMaterial({
      color: '#f59e0b',
    }),
    waterTowerMat: new THREE.MeshLambertMaterial({
      color: '#cbd5e1',
    }),
    pipingRed: new THREE.MeshLambertMaterial({
      color: '#dc2626',
    }),
    beaconRed: new THREE.MeshLambertMaterial({
      color: '#ff1111',
      emissive: '#ff0000',
      emissiveIntensity: 0.2,
    }),
    beaconGlowMat: new THREE.SpriteMaterial({
      map: beaconGlowTexture,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    }),
    mastHousingMat: new THREE.MeshLambertMaterial({
      color: '#1e293b',
    }),
    slenderMastMat: new THREE.MeshLambertMaterial({
      color: '#94a3b8',
    }),
    smokeMat: new THREE.PointsMaterial({
      size: 5.2,
      map: smokeTexture,
      transparent: true,
      opacity: 0.0,
      blending: THREE.NormalBlending,
      depthWrite: false,
      vertexColors: true,
    }),
    sparkMat: new THREE.PointsMaterial({
      size: 0.34,
      map: emberTexture,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    groundMistMat: new THREE.MeshBasicMaterial({
      map: mistTexture,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      blending: THREE.NormalBlending,
    }),
    cryoVentMat: new THREE.PointsMaterial({
      size: 1.8,
      map: mistTexture,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.NormalBlending,
    }),
    seaHorizonMat: new THREE.MeshLambertMaterial({
      color: '#253c4e',
      transparent: true,
      opacity: 0.88,
    }),
  };
  return cachedPadMaterials;
}

let cachedGroundGeom: THREE.PlaneGeometry | null = null;
function getCachedGroundGeom() {
  if (cachedGroundGeom) return cachedGroundGeom;
  const geom = new THREE.PlaneGeometry(120, 120, 24, 24);
  const pos = geom.attributes.position;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    vertex.fromBufferAttribute(pos, i);
    const distFromPad = Math.hypot(vertex.x, vertex.y);

    if (distFromPad > 4.5) {
      const falloff = Math.min((distFromPad - 4.5) / 15.0, 1.0);
      const elevation =
        (Math.sin(vertex.x * 0.12) * Math.cos(vertex.y * 0.14) * 0.35 +
          Math.sin(vertex.x * 0.28 + vertex.y * 0.22) * 0.18) *
        falloff;
      vertex.z = elevation;
    } else {
      vertex.z = 0;
    }
    pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  geom.computeVertexNormals();
  cachedGroundGeom = geom;
  return cachedGroundGeom;
}

export const Stage00LaunchPad: React.FC<Stage00LaunchPadProps> = ({
  scrollProgressRef,
  isIgnited: _isIgnited = false,
  liftoffTime: _liftoffTime,
  isLiftoffActive: _isLiftoffActive,
}) => {
  const padRootRef = useRef<THREE.Group>(null);
  const umbilicalArmsRef = useRef<THREE.Group>(null);
  const smokePointsRef = useRef<THREE.Points>(null);
  const sparkPointsRef = useRef<THREE.Points>(null);
  const beaconLightRef = useRef<THREE.PointLight>(null);
  const flameTrenchLightRef = useRef<THREE.PointLight>(null);
  const cryoVentPointsRef = useRef<THREE.Points>(null);
  const holdDownClampsRef = useRef<THREE.Group>(null);
  const qdPurgeGroupRef = useRef<THREE.Group>(null);
  const delugeSprayGroupRef = useRef<THREE.Group>(null);

  const terrain = useMemo(() => getCachedTerrainTextures(), []);
  const smokeTexture = useMemo(() => getCachedSmokeTexture(), []);
  const mistTexture = useMemo(() => getCachedMistTexture(), []);
  const emberTexture = useMemo(() => getCachedEmberTexture(), []);
  const beaconGlowTexture = useMemo(() => getCachedBeaconGlowTexture(), []);

  // 1. Ultra-Lightweight Lambert Materials (Cached globally)
  const materials = useMemo(
    () => getCachedPadMaterials(terrain, smokeTexture, mistTexture, emberTexture, beaconGlowTexture),
    [terrain, smokeTexture, mistTexture, emberTexture, beaconGlowTexture]
  );

  // 2. Uneven Ground Mesh (Cached globally)
  const groundGeom = useMemo(() => getCachedGroundGeom(), []);

  // 3B. Cryogenic LOX Boil-off Vapor Bleed Data (Standby & Early Ignition)
  const cryoCount = 48;
  const { cryoGeom, cryoData } = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(cryoCount * 3);
    const data = [];
    for (let i = 0; i < cryoCount; i++) {
      pos[i * 3] = 0.06;
      pos[i * 3 + 1] = 2.15;
      pos[i * 3 + 2] = 0.42;
      data.push({
        vx: -0.35 + (Math.random() - 0.5) * 0.15,
        vy: 0.08 + Math.random() * 0.12,
        vz: 0.18 + (Math.random() - 0.5) * 0.12,
        age: Math.random() * 2.2,
        life: 1.8 + Math.random() * 1.2,
      });
    }
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { cryoGeom: geom, cryoData: data };
  }, []);

  // 4. Bilateral Trench Smoke Simulation Data (Optimized 90 particle budget)
  const smokeCount = 90;
  const { smokeGeom, smokeData } = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(smokeCount * 3);
    const col = new Float32Array(smokeCount * 3);
    const data = [];

    for (let i = 0; i < smokeCount; i++) {
      const isLeftTrench = i < smokeCount / 2;
      const dirX = isLeftTrench ? -1 : 1;

      pos[i * 3] = dirX * (0.9 + Math.random() * 0.4);
      pos[i * 3 + 1] = -0.3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.6;

      col[i * 3] = 0.95;
      col[i * 3 + 1] = 0.95;
      col[i * 3 + 2] = 0.95;

      data.push({
        dirX,
        vx: dirX * (2.8 + Math.random() * 2.4),
        vy: 0.15 + Math.random() * 0.35,
        vz: (Math.random() - 0.5) * 0.8,
        age: Math.random() * 1.8,
        life: 1.6 + Math.random() * 1.4,
      });
    }

    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return { smokeGeom: geom, smokeData: data };
  }, [smokeCount]);

  // 5. Sparks Data
  const sparkCount = STAGE_CONFIG.stage00_launchPad.fireAndSmoke.maxSparks;
  const { sparkGeom, sparkData } = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(sparkCount * 3);
    const data = [];

    for (let i = 0; i < sparkCount; i++) {
      const dirX = i % 2 === 0 ? 1 : -1;
      pos[i * 3] = dirX * (0.6 + Math.random() * 0.3);
      pos[i * 3 + 1] = -0.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

      data.push({
        vx: dirX * (3.5 + Math.random() * 3.0),
        vy: 1.2 + Math.random() * 2.5,
        vz: (Math.random() - 0.5) * 1.8,
        age: Math.random() * 0.8,
        life: 0.4 + Math.random() * 0.6,
      });
    }

    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { sparkGeom: geom, sparkData: data };
  }, [sparkCount]);

  // 6. Simulation Frame Controller
  useFrame((state, delta) => {
    const sp = scrollProgressRef.current;
    const t = state.clock.getElapsedTime();

    if (sp > 0.26) {
      if (padRootRef.current) padRootRef.current.visible = false;
      return;
    }

    if (padRootRef.current) {
      padRootRef.current.visible = true;

      // Purely scroll-driven pad downward motion:
      let padDrop = 0;
      if (sp < 0.170) {
        // Steps 0, 1, 2, 3: Pad stays completely locked in place at ground zero!
        padDrop = 0;
      } else if (sp < 0.260) {
        // Step 4: Vertical movement begins! Pad drops smoothly as rocket clears the tower
        const climbProgress = (sp - 0.170) / (0.260 - 0.170);
        padDrop = Math.pow(climbProgress, 1.4) * 26.0;
      } else {
        padDrop = 26.0;
      }

      padRootRef.current.position.y = -padDrop;
    }

    // 1. Aviation Obstacle Strobes (Slow 1 Hz Blink: 0.42s pulse, 0.58s interval)
    const beaconCycle = t % 1.0;
    const isBeaconOn = beaconCycle < 0.45;
    const beaconPulse = isBeaconOn ? Math.sin((beaconCycle / 0.45) * Math.PI) : 0.0;

    materials.beaconRed.emissiveIntensity = 0.6 + beaconPulse * 4.5;
    materials.beaconGlowMat.opacity = 0.40 + beaconPulse * 0.60;
    if (beaconLightRef.current) {
      beaconLightRef.current.intensity = 1.2 + beaconPulse * 3.8;
    }

    // 2. Umbilical Service Arms Retraction ("second releases locks")
    if (umbilicalArmsRef.current) {
      let swingAngle = 0;
      if (sp < 0.080) {
        // Step 0 & 1: Arms firmly connected to rocket body
        swingAngle = 0;
      } else if (sp < 0.125) {
        // Step 2: Arms swing smoothly 55 degrees away from the vehicle with damped ease-out
        const rawProg = Math.min(Math.max((sp - 0.080) / (0.125 - 0.080), 0), 1.0);
        const easedProg = 1.0 - Math.pow(1.0 - rawProg, 2.2);
        swingAngle = easedProg * 0.95;
      } else {
        // Step 3 & 4: Fully swung clear
        swingAngle = 0.95;
      }
      umbilicalArmsRef.current.rotation.y = swingAngle;
    }

    // 2B. Hold-Down Support Clamps Disengagement (Step 02)
    if (holdDownClampsRef.current) {
      const clampOpen = sp < 0.080 ? 0 : Math.min((sp - 0.080) / 0.045, 1.0);
      const children = holdDownClampsRef.current.children;
      for (let c = 0; c < children.length; c++) {
        const dir = c < 2 ? 1 : -1; // Left clamps tilt outward left (+Z), right clamps tilt outward right (-Z)
        children[c].rotation.z = dir * clampOpen * 0.28;
      }
    }

    // 2C. Cryogenic Quick-Disconnect (QD) Coupling Purge Vapour Puff (Step 02)
    if (qdPurgeGroupRef.current) {
      if (sp >= 0.080 && sp < 0.130) {
        qdPurgeGroupRef.current.visible = true;
        const qdProg = (sp - 0.080) / 0.050;
        const qdFade = Math.sin(qdProg * Math.PI);
        materials.qdPurgeMat.opacity = qdFade * 0.62;
        const qdScale = 0.45 + qdProg * 0.85;
        qdPurgeGroupRef.current.scale.set(qdScale, qdScale, qdScale);
      } else {
        qdPurgeGroupRef.current.visible = false;
        materials.qdPurgeMat.opacity = 0;
      }
    }

    // 2D. High-Flow Water Deluge Quench Spray Manifolds (Step 03)
    if (delugeSprayGroupRef.current) {
      if (sp >= 0.125 && sp < 0.215) {
        delugeSprayGroupRef.current.visible = true;
        const delugeProg = (sp - 0.125) / 0.090;
        const delugeWave = Math.sin(delugeProg * Math.PI);
        const sprayFlicker = (0.78 + Math.sin(t * 48) * 0.16) * delugeWave;
        materials.delugeSprayMat.opacity = sprayFlicker * 0.72;
      } else {
        delugeSprayGroupRef.current.visible = false;
        materials.delugeSprayMat.opacity = 0;
      }
    }

    // 3. Bilateral Trench Smoke & Deluge Steam

    // 3B. Cryogenic Boil-off Vapor Animation
    if (cryoVentPointsRef.current) {
      if (sp < 0.080) {
        cryoVentPointsRef.current.visible = true;
        const cryoFade = 1.0 - (sp / 0.080);
        materials.cryoVentMat.opacity = cryoFade * 0.48;

        const cPosAttr = cryoGeom.getAttribute('position') as THREE.BufferAttribute;
        const cPosArray = cPosAttr.array as Float32Array;

        for (let i = 0; i < cryoCount; i++) {
          const p = cryoData[i];
          p.age += delta;
          if (p.age >= p.life) {
            p.age = 0;
            cPosArray[i * 3] = 0.06 + (Math.random() - 0.5) * 0.06;
            cPosArray[i * 3 + 1] = 2.15 + (Math.random() - 0.5) * 0.08;
            cPosArray[i * 3 + 2] = 0.42 + (Math.random() - 0.5) * 0.06;
          } else {
            cPosArray[i * 3] += p.vx * delta;
            cPosArray[i * 3 + 1] += p.vy * delta;
            cPosArray[i * 3 + 2] += p.vz * delta;
          }
        }
        cPosAttr.needsUpdate = true;
      } else {
        cryoVentPointsRef.current.visible = false;
      }
    }

    // 4. Bilateral Trench Smoke & Deluge Steam ("third gives smoke")
    const isSmoking = sp >= 0.125 && sp < 0.260;
    if (smokePointsRef.current) {
      if (isSmoking) {
        smokePointsRef.current.visible = true;

        let smokeDensity = 0;
        if (sp < 0.170) {
          // Step 3: Deluge steam and massive trench smoke billows outwards
          smokeDensity = (sp - 0.125) / (0.170 - 0.125);
        } else {
          // Step 4: Disperses as vehicle climbs
          smokeDensity = Math.max(0, 1.0 - (sp - 0.170) / 0.090);
        }

        materials.smokeMat.opacity = smokeDensity * 0.64;
        materials.smokeMat.size = 4.4 + smokeDensity * 2.6;

        const posAttr = smokeGeom.getAttribute('position') as THREE.BufferAttribute;
        const colAttr = smokeGeom.getAttribute('color') as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;
        const colArray = colAttr.array as Float32Array;

        for (let i = 0; i < smokeCount; i++) {
          const p = smokeData[i];
          p.age += delta;

          if (p.age >= p.life) {
            p.age = 0;
            p.life = 1.4 + Math.random() * 1.5;
            p.vx = p.dirX * (3.0 + Math.random() * 2.6);
            p.vy = 0.15 + Math.random() * 0.35;
            p.vz = (Math.random() - 0.5) * 0.9;
            posArray[i * 3] = p.dirX * (0.9 + Math.random() * 0.3);
            posArray[i * 3 + 1] = -0.3;
            posArray[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
          } else {
            posArray[i * 3] += p.vx * delta;
            posArray[i * 3 + 1] += p.vy * delta;
            posArray[i * 3 + 2] += p.vz * delta;

            // Aerodynamic drag horizontally + buoyant steam billow lift as cloud rolls outward
            p.vx *= 0.982;
            p.vy += delta * 0.55;
          }

          // Sunrise side-lit illumination + warm fire trench under-glow near origin
          const progressRatio = p.age / p.life;
          if (p.dirX > 0) {
            colArray[i * 3] = 1.0;
            colArray[i * 3 + 1] = 0.92 - progressRatio * 0.18;
            colArray[i * 3 + 2] = 0.76 - progressRatio * 0.25;
          } else {
            colArray[i * 3] = 0.78 - progressRatio * 0.15;
            colArray[i * 3 + 1] = 0.85 - progressRatio * 0.16;
            colArray[i * 3 + 2] = 0.93 - progressRatio * 0.08;
          }
        }

        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
      } else {
        smokePointsRef.current.visible = false;
      }
    }

    // 5. Fire Trench Light, Deflector Thermal Incandescence & Ignition Flash
    if (flameTrenchLightRef.current) {
      if (sp >= 0.035 && sp < 0.240) {
        const fireIntensity = Math.min((sp - 0.035) / 0.025, 1.0);
        const flicker = (8.0 + Math.sin(t * 55) * 3.0) * fireIntensity;
        flameTrenchLightRef.current.intensity = flicker;

        // Thermal heat glow on double-sided flame deflector steel wedge under 2,000C exhaust
        const heatRamp = sp < 0.170 ? fireIntensity : Math.max(0, 1.0 - (sp - 0.170) / 0.070);
        materials.flameDeflectorSteel.emissiveIntensity = heatRamp * (1.35 + Math.sin(t * 38) * 0.28);
        materials.flameDeflectorSteel.emissive.setRGB(1.0 * heatRamp, 0.38 * heatRamp, 0.06 * heatRamp);
      } else {
        flameTrenchLightRef.current.intensity = 0;
        materials.flameDeflectorSteel.emissiveIntensity = 0;
      }
    }

    // 6. Flying Incandescent Trench Sparks Simulation (Step 01 Ignition through Liftoff)
    if (sparkPointsRef.current) {
      if (sp >= 0.035 && sp < 0.220) {
        sparkPointsRef.current.visible = true;
        const sparkRamp = Math.min((sp - 0.035) / 0.025, 1.0);
        const sparkFade = sp < 0.170 ? 1.0 : Math.max(0, 1.0 - (sp - 0.170) / 0.050);
        materials.sparkMat.opacity = 0.90 * sparkRamp * sparkFade;

        const posAttr = sparkGeom.getAttribute('position') as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;

        for (let i = 0; i < sparkCount; i++) {
          const spk = sparkData[i];
          spk.age += delta;

          if (spk.age >= spk.life) {
            spk.age = 0;
            const dirX = Math.random() > 0.5 ? 1 : -1;
            spk.vx = dirX * (3.5 + Math.random() * 3.2);
            spk.vy = 1.4 + Math.random() * 2.6;
            spk.vz = (Math.random() - 0.5) * 1.8;
            posArray[i * 3] = dirX * (0.6 + Math.random() * 0.3);
            posArray[i * 3 + 1] = -0.2;
            posArray[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
          } else {
            posArray[i * 3] += spk.vx * delta;
            posArray[i * 3 + 1] += spk.vy * delta;
            posArray[i * 3 + 2] += spk.vz * delta;
            spk.vy -= 9.8 * delta;
          }
        }
        posAttr.needsUpdate = true;
      } else {
        sparkPointsRef.current.visible = false;
      }
    }
  });

  return (
    <group ref={padRootRef} position={[0, 0, 0]}>
      {/* 1. Realistic Uneven Textured Ground Plane with Contact Shadows */}
      <mesh
        geometry={groundGeom}
        material={materials.concreteApron}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.42, 0]}
        receiveShadow
      />

      {/* 2. Low Ground Mist Billowing over Grass */}
      <group position={[0, -0.22, -12]}>
        {[-16, 0, 16].map((mx, idx) => (
          <mesh
            key={`mist-${idx}`}
            position={[mx, 0, idx * 3]}
            material={materials.groundMistMat}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[28, 14]} />
          </mesh>
        ))}
      </group>

      {/* 3. Launch Mount & Mobile Launch Platform (MLP) Deck */}
      <group position={[0, -0.18, 0]}>
        {/* Concrete foundation block with central flame trench exhaust duct */}
        <mesh position={[-1.0, -0.14, 0]} material={materials.mlpConcreteBase}>
          <boxGeometry args={[1.2, 0.52, 2.8]} />
        </mesh>
        <mesh position={[1.0, -0.14, 0]} material={materials.mlpConcreteBase}>
          <boxGeometry args={[1.2, 0.52, 2.8]} />
        </mesh>
        {/* Heavy galvanized steel launch deck flanking the central flame trench */}
        <mesh position={[-0.95, 0.14, 0]} material={materials.mlpDeckSteel}>
          <boxGeometry args={[1.1, 0.08, 2.6]} />
        </mesh>
        <mesh position={[0.95, 0.14, 0]} material={materials.mlpDeckSteel}>
          <boxGeometry args={[1.1, 0.08, 2.6]} />
        </mesh>
        {/* 4 Hold-Down Launch Support Pedestals elevating the vehicle above the deck */}
        <group ref={holdDownClampsRef}>
          {[
            { x: -0.22, z: 0.12 },
            { x: -0.22, z: -0.12 },
            { x: 0.22, z: 0.12 },
            { x: 0.22, z: -0.12 },
          ].map((clamp, cIdx) => (
            <group key={`launch-clamp-${cIdx}`} position={[clamp.x, 0.18, clamp.z]}>
              <mesh position={[0, 0.04, 0]} material={materials.towerSteel}>
                <boxGeometry args={[0.09, 0.10, 0.09]} />
              </mesh>
              <mesh position={[0, 0.10, 0]} material={materials.mlpDeckSteel}>
                <boxGeometry args={[0.06, 0.04, 0.06]} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Step 03 Water Deluge Quench Spray Nozzles along Flame Trench Lip */}
        <group ref={delugeSprayGroupRef} visible={false}>
          {[
            { x: -0.52, z: -0.65 },
            { x: -0.52, z: 0.0 },
            { x: -0.52, z: 0.65 },
            { x: 0.52, z: -0.65 },
            { x: 0.52, z: 0.0 },
            { x: 0.52, z: 0.65 },
          ].map((noz, nIdx) => (
            <group key={`deluge-noz-${nIdx}`} position={[noz.x, 0.12, noz.z]}>
              <mesh material={materials.pipingRed}>
                <cylinderGeometry args={[0.024, 0.024, 0.08, 8]} />
              </mesh>
              <mesh
                position={[noz.x < 0 ? 0.18 : -0.18, -0.14, 0]}
                rotation={[0, 0, noz.x < 0 ? -0.82 : 0.82]}
                material={materials.delugeSprayMat}
              >
                <coneGeometry args={[0.17, 0.42, 10, 1, true]} />
              </mesh>
            </group>
          ))}
        </group>
        {/* Flame Trench Cutout Pit beneath vehicle */}
        <mesh position={[0, -0.22, 0]} material={materials.trenchPit}>
          <boxGeometry args={[1.2, 0.44, 2.2]} />
        </mesh>
        {/* Double-sided Flame Deflector Wedge beneath engines */}
        <mesh position={[0, -0.18, 0]} rotation={[0, 0, Math.PI / 4]} material={materials.flameDeflectorSteel}>
          <boxGeometry args={[0.55, 0.55, 1.8]} />
        </mesh>
        {/* Perimeter Safety Kick-plate Coaming */}
        {[-1.42, 1.42].map((hx, hIdx) => (
          <mesh key={`handrail-${hIdx}`} position={[hx, 0.20, 0]} material={materials.towerSteel}>
            <boxGeometry args={[0.02, 0.06, 2.5]} />
          </mesh>
        ))}
      </group>

      {/* 4. Credible Umbilical Service Gantry Tower (Open Lattice Truss placed BEHIND rocket at z = -1.35) */}
      <group position={[-0.2, 0, -1.35]}>
        {/* 4 Slender Galvanized Steel Vertical Corner Columns */}
        {[
          { x: -0.45, z: -0.45 },
          { x: 0.45, z: -0.45 },
          { x: -0.45, z: 0.45 },
          { x: 0.45, z: 0.45 },
        ].map((col, cIdx) => (
          <mesh key={`tower-col-${cIdx}`} position={[col.x, 2.6, col.z]} material={materials.galvanizedTruss}>
            <cylinderGeometry args={[0.04, 0.04, 5.4, 8]} />
          </mesh>
        ))}

        {/* Horizontal Platform Tier Decks */}
        {[0.6, 1.6, 2.6, 3.6, 4.6].map((py, pIdx) => (
          <mesh key={`platform-${pIdx}`} position={[0, py, 0]} material={materials.towerSteel}>
            <boxGeometry args={[1.0, 0.06, 1.0]} />
          </mesh>
        ))}

        {/* Diagonal X-Braces framing the lattice */}
        {[1.1, 2.1, 3.1, 4.1].map((by, bIdx) => (
          <group key={`xbrace-${bIdx}`} position={[0, by, 0]}>
            <mesh rotation={[0, 0, 0.7]} material={materials.galvanizedTruss}>
              <cylinderGeometry args={[0.02, 0.02, 1.35, 6]} />
            </mesh>
            <mesh rotation={[0, 0, -0.7]} material={materials.galvanizedTruss}>
              <cylinderGeometry args={[0.02, 0.02, 1.35, 6]} />
            </mesh>
          </group>
        ))}

        {/* Retractable Umbilical Service Arms (Pivoting clear at T+4.5s) */}
        <group ref={umbilicalArmsRef} position={[0, 0.9, 0.5]}>
          {[
            { y: 0.4, len: 1.0 },
            { y: 0.8, len: 1.0 },
            { y: 1.25, len: 0.9 },
          ].map((arm, aIdx) => (
            <group key={`arm-${aIdx}`} position={[0, arm.y, 0]}>
              <mesh position={[0, 0, arm.len / 2]} material={materials.towerSteel}>
                <boxGeometry args={[0.12, 0.08, arm.len]} />
              </mesh>
              {/* Red Cryogenic Supply Pipe */}
              <mesh position={[0.06, -0.06, arm.len * 0.8]} material={materials.pipingRed}>
                <cylinderGeometry args={[0.02, 0.02, 0.16, 8]} />
              </mesh>
            </group>
          ))}

          {/* Step 02 Cryogenic Quick-Disconnect (QD) Coupling Purge Vapour Puffs */}
          <group ref={qdPurgeGroupRef} visible={false}>
            {[0.4, 0.8, 1.25].map((py, pIdx) => (
              <sprite
                key={`qd-purge-${pIdx}`}
                position={[0.06, py, 0.96]}
                scale={[0.9, 0.75, 1]}
                material={materials.qdPurgeMat}
              />
            ))}
          </group>
        </group>

        {/* Tower Top Mast & Red Aviation Beacon */}
        <mesh position={[0, 5.5, 0]} material={materials.slenderMastMat}>
          <cylinderGeometry args={[0.010, 0.026, 0.9, 8]} />
        </mesh>
        <mesh position={[0, 5.97, 0]} material={materials.mastHousingMat}>
          <cylinderGeometry args={[0.022, 0.020, 0.04, 8]} />
        </mesh>
        <mesh position={[0, 6.00, 0]} material={materials.beaconRed}>
          <cylinderGeometry args={[0.016, 0.016, 0.03, 8]} />
        </mesh>
        <sprite position={[0, 6.01, 0]} scale={[0.48, 0.48, 1]} material={materials.beaconGlowMat} renderOrder={30} />
        <pointLight ref={beaconLightRef} position={[0, 6.01, 0]} color="#ff2222" intensity={3.5} distance={14} />
      </group>

      {/* 5. Distant Lightning Masts & Water Deluge Tower (Framing the launch complex realistically) */}
      <group position={[0, 0, 0]}>
        {/* 4 Perimeter Slender Lightning Protection Masts with Lamp Housing & Glowing Beacons */}
        {[
          { x: -12.0, z: -18.0 },
          { x: -5.0, z: -20.0 },
          { x: 9.0, z: -19.0 },
          { x: 17.0, z: -17.0 },
        ].map((mast, mIdx) => (
          <group key={`mast-${mIdx}`} position={[mast.x, 0, mast.z]}>
            {/* Slender tapered mast pylon (thinner than gantry columns) */}
            <mesh position={[0, 3.2, 0]} material={materials.slenderMastMat}>
              <cylinderGeometry args={[0.010, 0.030, 6.4, 8]} />
            </mesh>
            {/* Lamp housing slightly wider than mast tip */}
            <mesh position={[0, 6.42, 0]} material={materials.mastHousingMat}>
              <cylinderGeometry args={[0.024, 0.022, 0.045, 8]} />
            </mesh>
            {/* Emissive red beacon lamp */}
            <mesh position={[0, 6.455, 0]} material={materials.beaconRed}>
              <cylinderGeometry args={[0.017, 0.017, 0.035, 8]} />
            </mesh>
            {/* Soft glow sprite clearly larger than mast tip */}
            <sprite position={[0, 6.465, 0]} scale={[0.48, 0.48, 1]} material={materials.beaconGlowMat} renderOrder={30} />
          </group>
        ))}

        {/* Distant Spherical Water Deluge Storage Tower */}
        <group position={[14.5, 0, -18.0]}>
          <mesh position={[0, 2.2, 0]} material={materials.towerSteel}>
            <cylinderGeometry args={[0.3, 0.5, 4.4, 8]} />
          </mesh>
          <mesh position={[0, 4.8, 0]} material={materials.waterTowerMat}>
            <sphereGeometry args={[1.4, 24, 20]} />
          </mesh>
        </group>
      </group>

      {/* 6. Authentic Sriharikota Coastal Flora with Procedural Alpha Textures */}
      <SriharikotaVegetation />

      {/* 7. Eastern Bay of Bengal Coastal Sea Horizon */}
      <mesh
        position={[42, -0.45, -14]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={materials.seaHorizonMat}
      >
        <planeGeometry args={[65, 95]} />
      </mesh>

      {/* 7. Lateral Trench Bilateral Billowing Smoke, Steam & Incandescent Sparks */}
      <points ref={cryoVentPointsRef} geometry={cryoGeom} material={materials.cryoVentMat} />
      <points ref={smokePointsRef} geometry={smokeGeom} material={materials.smokeMat} />
      <points ref={sparkPointsRef} geometry={sparkGeom} material={materials.sparkMat} visible={false} />

      {/* 9. Flame Trench Lighting & Ignition Flash */}
      <pointLight
        ref={flameTrenchLightRef}
        position={[0, -0.3, 0.4]}
        color="#ffaa33"
        intensity={0}
        distance={14}
        decay={2}
      />

      {/* 10. Consolidated Single Key Pad Floodlight Illuminating Vehicle Base & Lattice Gantry */}
      <pointLight position={[0, 1.2, 1.4]} color="#fff0db" intensity={3.5} distance={10} decay={1.8} />
    </group>
  );
};
