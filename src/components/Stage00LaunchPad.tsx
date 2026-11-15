import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
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

  const size = 1024;
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

  // 3. High-frequency micro-gravel surface noise
  const imgData = dctx.getImageData(0, 0, size, size);
  const bumpData = bctx.getImageData(0, 0, size, size);
  const dPixels = imgData.data;
  const bPixels = bumpData.data;

  for (let i = 0; i < dPixels.length; i += 4) {
    const noise = (Math.random() - 0.5) * 14;
    dPixels[i] = Math.min(255, Math.max(0, dPixels[i] + noise));
    dPixels[i + 1] = Math.min(255, Math.max(0, dPixels[i + 1] + noise));
    dPixels[i + 2] = Math.min(255, Math.max(0, dPixels[i + 2] + noise));
    bPixels[i] = Math.min(255, Math.max(0, 128 + noise * 3));
    bPixels[i + 1] = bPixels[i];
    bPixels[i + 2] = bPixels[i];
  }
  dctx.putImageData(imgData, 0, 0);
  bctx.putImageData(bumpData, 0, 0);

  const diffuse = new THREE.CanvasTexture(dCanvas);
  diffuse.wrapS = THREE.RepeatWrapping;
  diffuse.wrapT = THREE.RepeatWrapping;
  diffuse.generateMipmaps = true;

  const bump = new THREE.CanvasTexture(bCanvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.generateMipmaps = true;

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

export const Stage00LaunchPad: React.FC<Stage00LaunchPadProps> = ({
  scrollProgressRef,
  isIgnited = false,
  liftoffTime,
  isLiftoffActive,
}) => {
  const padRootRef = useRef<THREE.Group>(null);
  const umbilicalArmsRef = useRef<THREE.Group>(null);
  const smokePointsRef = useRef<THREE.Points>(null);
  const sparkPointsRef = useRef<THREE.Points>(null);
  const beaconLightRef = useRef<THREE.PointLight>(null);
  const flameTrenchLightRef = useRef<THREE.PointLight>(null);
  const casuarinaRef = useRef<THREE.InstancedMesh>(null);
  const palmsRef = useRef<THREE.InstancedMesh>(null);
  const eucalyptusRef = useRef<THREE.InstancedMesh>(null);
  const scrubRef = useRef<THREE.InstancedMesh>(null);

  const terrain = useMemo(() => getCachedTerrainTextures(), []);
  const smokeTexture = useMemo(() => getCachedSmokeTexture(), []);
  const mistTexture = useMemo(() => getCachedMistTexture(), []);
  const emberTexture = useMemo(() => getCachedEmberTexture(), []);
  const beaconGlowTexture = useMemo(() => getCachedBeaconGlowTexture(), []);

  // 1. Realistic PBR Materials
  const materials = useMemo(() => {
    return {
      concreteApron: new THREE.MeshStandardMaterial({
        map: terrain.diffuse,
        bumpMap: terrain.bump,
        bumpScale: 0.06,
        roughness: 0.78,
        metalness: 0.15,
      }),
      mlpDeckSteel: new THREE.MeshStandardMaterial({
        color: '#94a3b8', // Clean industrial galvanized deck
        roughness: 0.38,
        metalness: 0.75,
      }),
      mlpConcreteBase: new THREE.MeshStandardMaterial({
        color: '#475569', // Heavy industrial weathered launch pad concrete
        roughness: 0.85,
        metalness: 0.10,
      }),
      galvanizedTruss: new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        roughness: 0.35,
        metalness: 0.85,
      }),
      towerSteel: new THREE.MeshStandardMaterial({
        color: '#475569',
        roughness: 0.40,
        metalness: 0.80,
      }),
      trenchPit: new THREE.MeshStandardMaterial({
        color: '#1e2430',
        roughness: 0.85,
        metalness: 0.30,
      }),
      flameDeflectorSteel: new THREE.MeshStandardMaterial({
        color: '#334155',
        roughness: 0.35,
        metalness: 0.88,
      }),
      handrailYellow: new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        roughness: 0.35,
        metalness: 0.45,
      }),
      waterTowerMat: new THREE.MeshStandardMaterial({
        color: '#cbd5e1',
        roughness: 0.45,
        metalness: 0.60,
      }),
      pipingRed: new THREE.MeshStandardMaterial({
        color: '#dc2626',
        roughness: 0.40,
        metalness: 0.50,
      }),
      beaconRed: new THREE.MeshStandardMaterial({
        color: '#ff1111',
        emissive: '#ff0000',
        emissiveIntensity: 0.2,
        roughness: 0.2,
        metalness: 0.1,
      }),
      beaconGlowMat: new THREE.SpriteMaterial({
        map: beaconGlowTexture,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      }),
      mastHousingMat: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.45,
        metalness: 0.85,
      }),
      slenderMastMat: new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        roughness: 0.35,
        metalness: 0.85,
      }),
      casuarinaMat: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.86,
        metalness: 0.04,
      }),
      palmMat: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.78,
        metalness: 0.06,
      }),
      eucalyptusMat: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.82,
        metalness: 0.04,
      }),
      scrubMat: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.90,
        metalness: 0.02,
      }),
      smokeMat: new THREE.PointsMaterial({
        size: 3.2,
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
    };
  }, [terrain, smokeTexture, mistTexture, emberTexture, beaconGlowTexture]);

  // 2. Uneven Ground Mesh
  const groundGeom = useMemo(() => {
    const geom = new THREE.PlaneGeometry(120, 120, 64, 64);
    const pos = geom.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);
      const distFromPad = Math.hypot(vertex.x, vertex.y);

      // Pad foundation remains flat within radius 4.5
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
    return geom;
  }, []);

  // 3. Authentic Sriharikota Vegetation Geometries & Instanced Clusters
  // A. Tall, slender Casuarina equisetifolia (iconic coastal windbreaks with wispy feathery spindle crowns)
  const casuarinaGeom = useMemo(() => {
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0.045, 0.0),   // Slender trunk base firmly in ground
      new THREE.Vector2(0.038, 2.2),   // Tall slender bare trunk (55% bare!)
      new THREE.Vector2(0.28, 2.5),    // Lower feathery canopy begins high off ground
      new THREE.Vector2(0.42, 3.1),    // Widest soft feathery waist
      new THREE.Vector2(0.38, 3.7),    // Gently tapering upper crown
      new THREE.Vector2(0.24, 4.2),    // Narrowing wispy top
      new THREE.Vector2(0.08, 4.6),    // Slender drooping tip
      new THREE.Vector2(0.0, 4.8),     // Crown apex
    ];
    const geom = new THREE.LatheGeometry(points, 12);
    geom.computeVertexNormals();
    return geom;
  }, []);

  // B. Palmyra & Coconut Palms (Slender bare trunk + arching umbrella frond canopy)
  const palmGeom = useMemo(() => {
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0.055, 0.0),   // Base
      new THREE.Vector2(0.040, 2.0),   // Slender curved trunk
      new THREE.Vector2(0.035, 3.4),   // Bare trunk crown junction
      new THREE.Vector2(0.090, 3.45),  // Crown node
      new THREE.Vector2(0.95, 3.35),   // Arching frond canopy
      new THREE.Vector2(1.20, 3.00),   // Drooping frond tips
      new THREE.Vector2(0.70, 3.40),   // Canopy underside
      new THREE.Vector2(0.0, 3.70),    // Crown apex
    ];
    const geom = new THREE.LatheGeometry(points, 10);
    geom.computeVertexNormals();
    return geom;
  }, []);

  // C. Eucalyptus (Straight pale trunks with high airy crowns)
  const eucalyptusGeom = useMemo(() => {
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0.048, 0.0),
      new THREE.Vector2(0.036, 2.7),   // 60% of tree is bare pale trunk!
      new THREE.Vector2(0.35, 3.0),    // Lower airy canopy lobe
      new THREE.Vector2(0.22, 3.4),    // Narrow waist
      new THREE.Vector2(0.42, 3.8),    // Upper airy canopy lobe
      new THREE.Vector2(0.18, 4.2),    // Narrow waist
      new THREE.Vector2(0.26, 4.5),    // Top puff
      new THREE.Vector2(0.0, 4.7),     // Apex
    ];
    const geom = new THREE.LatheGeometry(points, 10);
    geom.computeVertexNormals();
    return geom;
  }, []);

  // D. Low Coastal Scrub & Sand Dune Grass Tufts
  const scrubGeom = useMemo(() => {
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.65, 0.02),   // Sprawling base
      new THREE.Vector2(0.55, 0.18),   // Scrub rim
      new THREE.Vector2(0.30, 0.32),   // Scrub crest
      new THREE.Vector2(0.0, 0.38),    // Scrub mound top
    ];
    const geom = new THREE.LatheGeometry(points, 7);
    geom.computeVertexNormals();
    return geom;
  }, []);

  // Casuarina Cluster Instances (flanks & distant perimeter z <= -24, |tx| >= 12, foreground clear)
  const casuarinaInstances = useMemo(() => {
    const count = 24;
    const dummy = new THREE.Object3D();
    const data: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];
    const palette = [
      new THREE.Color('#3f5242'),
      new THREE.Color('#495a4b'),
      new THREE.Color('#364839'),
      new THREE.Color('#516453'),
      new THREE.Color('#435545'),
    ];

    for (let i = 0; i < count; i++) {
      let tx: number, tz: number;
      if (i < 12) {
        // Northwest stand (Lagoon flank)
        tx = -14 - (i % 6) * 2.4 + Math.sin(i * 2.3) * 1.2;
        tz = -24 - Math.floor(i / 6) * 4.5 - Math.cos(i * 1.7) * 1.5;
      } else {
        // Northeast stand (Coast flank)
        tx = 14 + ((i - 12) % 6) * 2.2 + Math.sin(i * 3.1) * 1.2;
        tz = -24 - Math.floor((i - 12) / 6) * 4.5 - Math.cos(i * 2.2) * 1.5;
      }

      const scale = 0.85 + (i % 4) * 0.14;
      const hScale = scale * (0.95 + (i % 3) * 0.20);

      dummy.position.set(tx, -0.42, tz);
      dummy.scale.set(scale, hScale, scale);
      dummy.rotation.y = (i * 2.1) % (Math.PI * 2);
      dummy.updateMatrix();

      data.push({
        matrix: dummy.matrix.clone(),
        color: palette[i % palette.length],
      });
    }
    return data;
  }, []);

  // Palmyra & Coconut Palm Instances (flank margins)
  const palmInstances = useMemo(() => {
    const count = 12;
    const dummy = new THREE.Object3D();
    const data: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];
    const palette = [
      new THREE.Color('#2d442a'),
      new THREE.Color('#364e32'),
      new THREE.Color('#283c25'),
      new THREE.Color('#3d5638'),
    ];

    for (let i = 0; i < count; i++) {
      let tx: number, tz: number;
      if (i < 7) {
        // Coastal margin near eastern sea horizon
        tx = 15 + (i % 4) * 2.8 + Math.sin(i * 1.8) * 1.0;
        tz = -22 - Math.floor(i / 4) * 4.2;
      } else {
        // Western lagoon margin
        tx = -15 - (i - 7) * 2.5;
        tz = -24 - (i % 3) * 3.2;
      }

      const scale = 0.88 + (i % 3) * 0.16;
      const hScale = scale * (1.0 + (i % 4) * 0.15);

      dummy.position.set(tx, -0.42, tz);
      dummy.scale.set(scale, hScale, scale);
      dummy.rotation.y = (i * 1.7) % (Math.PI * 2);
      dummy.updateMatrix();

      data.push({
        matrix: dummy.matrix.clone(),
        color: palette[i % palette.length],
      });
    }
    return data;
  }, []);

  // Eucalyptus Instances (flank groves)
  const eucalyptusInstances = useMemo(() => {
    const count = 12;
    const dummy = new THREE.Object3D();
    const data: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];
    const palette = [
      new THREE.Color('#586b55'),
      new THREE.Color('#637860'),
      new THREE.Color('#4e5e4b'),
      new THREE.Color('#6d826a'),
    ];

    for (let i = 0; i < count; i++) {
      let tx: number, tz: number;
      if (i < 6) {
        tx = -18 - (i % 3) * 2.8 + Math.sin(i * 2.5) * 1.0;
        tz = -26 - Math.floor(i / 3) * 4.2;
      } else {
        tx = 18 + (i - 6) * 2.2 + Math.cos(i * 2.1) * 1.0;
        tz = -25 - (i % 3) * 3.6;
      }

      const scale = 0.86 + (i % 4) * 0.15;
      const hScale = scale * (0.95 + (i % 3) * 0.18);

      dummy.position.set(tx, -0.42, tz);
      dummy.scale.set(scale, hScale, scale);
      dummy.rotation.y = (i * 2.4) % (Math.PI * 2);
      dummy.updateMatrix();

      data.push({
        matrix: dummy.matrix.clone(),
        color: palette[i % palette.length],
      });
    }
    return data;
  }, []);

  // Low Coastal Scrub & Sand Dune Grass Instances
  const scrubInstances = useMemo(() => {
    const count = 34;
    const dummy = new THREE.Object3D();
    const data: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];
    const palette = [
      new THREE.Color('#636e52'),
      new THREE.Color('#727e5e'),
      new THREE.Color('#545f44'),
      new THREE.Color('#7d8664'),
    ];

    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const tx = side * (9.5 + (i % 7) * 2.8 + Math.sin(i * 2.7) * 1.8);
      const tz = -18 - (i % 6) * 3.0 - Math.cos(i * 1.4) * 2.0;

      const scale = 0.75 + (i % 5) * 0.18;
      const hScale = scale * (0.55 + (i % 3) * 0.15);

      dummy.position.set(tx, -0.42, tz);
      dummy.scale.set(scale, hScale, scale);
      dummy.rotation.y = (i * 1.9) % (Math.PI * 2);
      dummy.updateMatrix();

      data.push({
        matrix: dummy.matrix.clone(),
        color: palette[i % palette.length],
      });
    }
    return data;
  }, []);

  // Apply matrix and colors to instanced plant meshes
  useEffect(() => {
    if (casuarinaRef.current) {
      const mesh = casuarinaRef.current;
      casuarinaInstances.forEach((inst, idx) => {
        mesh.setMatrixAt(idx, inst.matrix);
        mesh.setColorAt(idx, inst.color);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    if (palmsRef.current) {
      const mesh = palmsRef.current;
      palmInstances.forEach((inst, idx) => {
        mesh.setMatrixAt(idx, inst.matrix);
        mesh.setColorAt(idx, inst.color);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    if (eucalyptusRef.current) {
      const mesh = eucalyptusRef.current;
      eucalyptusInstances.forEach((inst, idx) => {
        mesh.setMatrixAt(idx, inst.matrix);
        mesh.setColorAt(idx, inst.color);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    if (scrubRef.current) {
      const mesh = scrubRef.current;
      scrubInstances.forEach((inst, idx) => {
        mesh.setMatrixAt(idx, inst.matrix);
        mesh.setColorAt(idx, inst.color);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }, [casuarinaInstances, palmInstances, eucalyptusInstances, scrubInstances]);

  // 4. Bilateral Trench Smoke Simulation Data
  const smokeCount = STAGE_CONFIG.stage00_launchPad.fireAndSmoke.maxSmokeParticles;
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

      // Realistic physical liftoff downward motion:
      let padDrop = 0;
      if (isLiftoffActive) {
        if (liftoffTime > 4.5) {
          const climbSec = liftoffTime - 4.5;
          padDrop = 0.5 * 1.6 * climbSec * climbSec;
        }
      } else if (sp > 0.01) {
        const altProgress = Math.min((sp - 0.01) / 0.18, 1.0);
        padDrop = Math.pow(altProgress, 1.5) * 28.0;
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

    // 2. Umbilical Service Arms Retraction (swings clear at T+4.5s release)
    if (umbilicalArmsRef.current) {
      let swingAngle = 0;
      if (isLiftoffActive && liftoffTime >= 4.2) {
        swingAngle = Math.min((liftoffTime - 4.2) / 1.2, 1.0) * 0.95;
      } else if (sp > 0.03) {
        swingAngle = Math.min((sp - 0.03) / 0.05, 1.0) * 0.95;
      }
      umbilicalArmsRef.current.rotation.y = swingAngle;
    }

    // 3. Bilateral Trench Smoke & Deluge Steam

    // 4. Bilateral Trench Smoke & Deluge Steam
    const isSmoking = (isLiftoffActive && liftoffTime >= 0.2) || isIgnited || sp > 0.005;
    if (smokePointsRef.current) {
      if (isSmoking) {
        smokePointsRef.current.visible = true;

        let smokeDensity = 0;
        if (isLiftoffActive) {
          if (liftoffTime < 1.5) {
            smokeDensity = (liftoffTime / 1.5) * 0.50;
          } else if (liftoffTime < 4.5) {
            smokeDensity = 0.50 + ((liftoffTime - 1.5) / 3.0) * 0.45;
          } else if (liftoffTime < 8.0) {
            smokeDensity = 0.95;
          } else {
            smokeDensity = Math.max(0, 0.95 - (liftoffTime - 8.0) * 0.35);
          }
        } else {
          smokeDensity = sp < 0.12 ? 0.85 : Math.max(0, 1.0 - (sp - 0.12) / 0.12);
        }

        materials.smokeMat.opacity = smokeDensity * 0.60;

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
            posArray[i * 3] = p.dirX * (0.9 + Math.random() * 0.3);
            posArray[i * 3 + 1] = -0.3;
            posArray[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
          } else {
            posArray[i * 3] += p.vx * delta;
            posArray[i * 3 + 1] += p.vy * delta;
            posArray[i * 3 + 2] += p.vz * delta;

            p.vx *= 0.985;
            p.vy *= 0.99;
          }

          // Sunrise side-lit illumination
          const progressRatio = p.age / p.life;
          if (p.dirX > 0) {
            colArray[i * 3] = 1.0;
            colArray[i * 3 + 1] = 0.90 - progressRatio * 0.2;
            colArray[i * 3 + 2] = 0.72 - progressRatio * 0.3;
          } else {
            colArray[i * 3] = 0.75 - progressRatio * 0.2;
            colArray[i * 3 + 1] = 0.82 - progressRatio * 0.2;
            colArray[i * 3 + 2] = 0.90 - progressRatio * 0.1;
          }
        }

        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
      } else {
        smokePointsRef.current.visible = false;
      }
    }

    // 5. Fire Trench Light & Ignition Flash
    if (flameTrenchLightRef.current) {
      if (isSmoking) {
        let flash = 0;
        if (isLiftoffActive && liftoffTime < 1.2) {
          flash = Math.sin((liftoffTime / 1.2) * Math.PI) * STAGE_CONFIG.stage00_launchPad.ignitionFlashIntensity;
        }
        const flicker = 8.0 + Math.sin(t * 55) * 3.0;
        flameTrenchLightRef.current.intensity = flicker + flash;
      } else {
        flameTrenchLightRef.current.intensity = 0;
      }
    }

    // 6. Flying Sparks Simulation
    if (sparkPointsRef.current) {
      if (isSmoking && liftoffTime < 5.5) {
        sparkPointsRef.current.visible = true;
        materials.sparkMat.opacity = 0.85;

        const posAttr = sparkGeom.getAttribute('position') as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;

        for (let i = 0; i < sparkCount; i++) {
          const spk = sparkData[i];
          spk.age += delta;

          if (spk.age >= spk.life) {
            spk.age = 0;
            const dirX = Math.random() > 0.5 ? 1 : -1;
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
            <pointLight position={[0, 6.465, 0]} color="#ff2222" intensity={2.8} distance={10} />
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

      {/* 6. Authentic Sriharikota Coastal Flora (Instanced) */}
      <instancedMesh
        ref={casuarinaRef}
        args={[casuarinaGeom, materials.casuarinaMat, casuarinaInstances.length]}
      />
      <instancedMesh
        ref={palmsRef}
        args={[palmGeom, materials.palmMat, palmInstances.length]}
      />
      <instancedMesh
        ref={eucalyptusRef}
        args={[eucalyptusGeom, materials.eucalyptusMat, eucalyptusInstances.length]}
      />
      <instancedMesh
        ref={scrubRef}
        args={[scrubGeom, materials.scrubMat, scrubInstances.length]}
      />

      {/* 7. Eastern Bay of Bengal Coastal Sea Horizon */}
      <mesh
        position={[42, -0.45, -14]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[65, 95]} />
        <meshStandardMaterial
          color="#253c4e"
          roughness={0.28}
          metalness={0.62}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* 7. Lateral Trench Bilateral Billowing Smoke & Steam */}
      <points ref={smokePointsRef} geometry={smokeGeom} material={materials.smokeMat} />

      {/* 9. Flying Sparks from Flame Trench */}
      <points ref={sparkPointsRef} geometry={sparkGeom} material={materials.sparkMat} />

      {/* 10. Flame Trench Lighting & Ignition Flash */}
      <pointLight
        ref={flameTrenchLightRef}
        position={[0, -0.3, 0.4]}
        color="#ffaa33"
        intensity={0}
        distance={14}
        decay={2}
      />

      {/* 11. Pad Floodlights Illuminating Vehicle Base & Lattice Gantry */}
      <pointLight position={[1.2, 0.8, 1.2]} color="#fff0db" intensity={2.8} distance={8} decay={1.8} />
      <pointLight position={[-1.2, 0.8, 1.2]} color="#fff0db" intensity={2.8} distance={8} decay={1.8} />
      <pointLight position={[0.2, 0.5, 1.4]} color="#fffaed" intensity={2.4} distance={9} decay={1.6} />
    </group>
  );
};
