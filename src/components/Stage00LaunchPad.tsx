import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
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
  isIgnited: _isIgnited = false,
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
  const palmyraRef = useRef<THREE.InstancedMesh>(null);
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
        roughness: 0.88,
        metalness: 0.04,
        vertexColors: true,
      }),
      palmyraMat: new THREE.MeshStandardMaterial({
        roughness: 0.85,
        metalness: 0.04,
        vertexColors: true,
        side: THREE.DoubleSide,
      }),
      palmMat: new THREE.MeshStandardMaterial({
        roughness: 0.82,
        metalness: 0.05,
        vertexColors: true,
        side: THREE.DoubleSide,
      }),
      eucalyptusMat: new THREE.MeshStandardMaterial({
        roughness: 0.86,
        metalness: 0.04,
        vertexColors: true,
      }),
      scrubMat: new THREE.MeshStandardMaterial({
        roughness: 0.90,
        metalness: 0.02,
        vertexColors: true,
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

  // 3. Authentic Indian Coastal Vegetation Geometries & Instanced Groves
  // A. Tall Casuarina equisetifolia (Savukku - Slender weeping coastal windbreak spires)
  const casuarinaGeom = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];

    // Slender dark woody trunk, lower 40% clean
    const trunk = new THREE.CylinderGeometry(0.045, 0.075, 4.8, 8, 4);
    trunk.deleteAttribute('uv');
    trunk.deleteAttribute('normal');
    trunk.translate(0, 2.4, 0);
    const tpos = trunk.attributes.position;
    const tCols = new Float32Array(tpos.count * 3);
    for (let i = 0; i < tpos.count; i++) {
      tCols[i * 3] = 0.26;
      tCols[i * 3 + 1] = 0.20;
      tCols[i * 3 + 2] = 0.16;
    }
    trunk.setAttribute('color', new THREE.BufferAttribute(tCols, 3));
    parts.push(trunk.toNonIndexed());

    // 6 Descending Tiers of Weeping Feathery Needles (Narrow conical spire tapering upwards)
    const tiers = [
      { y: 1.8, rBase: 0.52, len: 1.1, numNeedles: 8 },
      { y: 2.4, rBase: 0.46, len: 1.0, numNeedles: 8 },
      { y: 3.0, rBase: 0.38, len: 0.9, numNeedles: 7 },
      { y: 3.6, rBase: 0.28, len: 0.8, numNeedles: 6 },
      { y: 4.1, rBase: 0.18, len: 0.7, numNeedles: 5 },
      { y: 4.6, rBase: 0.09, len: 0.6, numNeedles: 4 },
    ];

    tiers.forEach((tr, tIdx) => {
      for (let n = 0; n < tr.numNeedles; n++) {
        const angle = (n / tr.numNeedles) * Math.PI * 2 + tIdx * 0.45;
        const nGeom = new THREE.CylinderGeometry(0.015, tr.rBase * 0.25, tr.len, 5, 2);
        nGeom.deleteAttribute('uv');
        nGeom.deleteAttribute('normal');
        nGeom.translate(0, -tr.len / 2, 0);

        // Weeping droop angle (~42 degrees downward from trunk)
        const droopAngle = 0.72 + (n % 2) * 0.08;
        const quat = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(Math.sin(angle) * droopAngle, 0, Math.cos(angle) * droopAngle)
        );
        nGeom.applyQuaternion(quat);
        nGeom.translate(Math.cos(angle) * 0.04, tr.y, Math.sin(angle) * 0.04);

        const npos = nGeom.attributes.position;
        const nCols = new Float32Array(npos.count * 3);
        for (let i = 0; i < npos.count; i++) {
          nCols[i * 3] = 0.20 + tIdx * 0.015;
          nCols[i * 3 + 1] = 0.34 + tIdx * 0.02;
          nCols[i * 3 + 2] = 0.22 + tIdx * 0.015;
        }
        nGeom.setAttribute('color', new THREE.BufferAttribute(nCols, 3));
        parts.push(nGeom.toNonIndexed());
      }
    });

    const merged = mergeGeometries(parts, false);
    merged.computeVertexNormals();
    return merged;
  }, []);

  // B. Authentic South Indian Coconut Palm (ತೆಂಗಿನ ಮರ / ಕೊಬ್ಬರಿ చెట్టు)
  const palmGeom = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];

    // Slender curved trunk with fibrous bark rings
    const trunk = new THREE.CylinderGeometry(0.045, 0.085, 3.8, 8, 14);
    trunk.deleteAttribute('uv');
    trunk.deleteAttribute('normal');
    trunk.translate(0, 1.9, 0);
    const pos = trunk.attributes.position;
    const tColors = new Float32Array(pos.count * 3);

    let topX = 0, topZ = 0;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const h = y / 3.8;
      const curveX = Math.sin(h * 1.5) * 0.42;
      const curveZ = Math.sin(h * 1.1) * 0.16;
      pos.setX(i, pos.getX(i) + curveX);
      pos.setZ(i, pos.getZ(i) + curveZ);

      if (h > 0.95) {
        topX = pos.getX(i);
        topZ = pos.getZ(i);
      }

      const ring = Math.sin(y * 22.0) * 0.04;
      tColors[i * 3] = 0.42 + ring;
      tColors[i * 3 + 1] = 0.34 + ring;
      tColors[i * 3 + 2] = 0.26 + ring;
    }
    trunk.setAttribute('color', new THREE.BufferAttribute(tColors, 3));
    parts.push(trunk.toNonIndexed());

    // 14 Distinct Arching, Drooping Fronds radiating 360 degrees
    const numFronds = 14;
    for (let f = 0; f < numFronds; f++) {
      const angle = (f / numFronds) * Math.PI * 2 + (f % 2) * 0.12;
      const frondGeom = new THREE.BufferGeometry();
      const fVerts: number[] = [];
      const fCols: number[] = [];
      const segs = 9;
      const frondLen = 2.3 + (f % 3) * 0.25;

      for (let s = 0; s < segs; s++) {
        const t0 = s / segs;
        const t1 = (s + 1) / segs;
        const d0 = t0 * frondLen;
        const d1 = t1 * frondLen;

        const y0 = Math.sin(t0 * Math.PI * 0.72) * 0.65 - Math.pow(t0, 2.1) * 1.15;
        const y1 = Math.sin(t1 * Math.PI * 0.72) * 0.65 - Math.pow(t1, 2.1) * 1.15;

        const w0 = Math.sin(t0 * Math.PI) * 0.28 + 0.02;
        const w1 = Math.sin(t1 * Math.PI) * 0.28 + 0.02;

        const cx0 = topX + Math.cos(angle) * d0;
        const cz0 = topZ + Math.sin(angle) * d0;
        const cy0 = 3.8 + y0;

        const cx1 = topX + Math.cos(angle) * d1;
        const cz1 = topZ + Math.sin(angle) * d1;
        const cy1 = 3.8 + y1;

        const sx0 = -Math.sin(angle) * (w0 * 0.5);
        const sz0 = Math.cos(angle) * (w0 * 0.5);
        const sx1 = -Math.sin(angle) * (w1 * 0.5);
        const sz1 = Math.cos(angle) * (w1 * 0.5);

        const droop0 = -0.04 * (w0 / 0.28);
        const droop1 = -0.04 * (w1 / 0.28);

        // Quad 1: Left half
        fVerts.push(cx0 + sx0, cy0 + droop0, cz0 + sz0);
        fCols.push(0.22, 0.52, 0.16);
        fVerts.push(cx0, cy0, cz0);
        fCols.push(0.30, 0.62, 0.20);
        fVerts.push(cx1 + sx1, cy1 + droop1, cz1 + sz1);
        fCols.push(0.24, 0.54, 0.18);

        fVerts.push(cx1 + sx1, cy1 + droop1, cz1 + sz1);
        fCols.push(0.24, 0.54, 0.18);
        fVerts.push(cx0, cy0, cz0);
        fCols.push(0.30, 0.62, 0.20);
        fVerts.push(cx1, cy1, cz1);
        fCols.push(0.32, 0.65, 0.22);

        // Quad 2: Right half
        fVerts.push(cx0, cy0, cz0);
        fCols.push(0.30, 0.62, 0.20);
        fVerts.push(cx0 - sx0, cy0 + droop0, cz0 - sz0);
        fCols.push(0.20, 0.48, 0.14);
        fVerts.push(cx1, cy1, cz1);
        fCols.push(0.32, 0.65, 0.22);

        fVerts.push(cx1, cy1, cz1);
        fCols.push(0.32, 0.65, 0.22);
        fVerts.push(cx0 - sx0, cy0 + droop0, cz0 - sz0);
        fCols.push(0.20, 0.48, 0.14);
        fVerts.push(cx1 - sx1, cy1 + droop1, cz1 - sz1);
        fCols.push(0.22, 0.50, 0.16);
      }

      frondGeom.setAttribute('position', new THREE.Float32BufferAttribute(fVerts, 3));
      frondGeom.setAttribute('color', new THREE.Float32BufferAttribute(fCols, 3));
      parts.push(frondGeom);
    }

    // Small coconut clusters under crown
    for (let c = 0; c < 4; c++) {
      const nut = new THREE.DodecahedronGeometry(0.08, 0);
      nut.deleteAttribute('uv');
      nut.deleteAttribute('normal');
      const na = (c / 4) * Math.PI * 2;
      nut.translate(topX + Math.cos(na) * 0.12, 3.68, topZ + Math.sin(na) * 0.12);
      const nCols = new Float32Array(nut.attributes.position.count * 3);
      for (let j = 0; j < nut.attributes.position.count; j++) {
        nCols[j * 3] = 0.35;
        nCols[j * 3 + 1] = 0.38;
        nCols[j * 3 + 2] = 0.20;
      }
      nut.setAttribute('color', new THREE.BufferAttribute(nCols, 3));
      parts.push(nut.toNonIndexed());
    }

    const merged = mergeGeometries(parts, false);
    merged.computeVertexNormals();
    return merged;
  }, []);

  // B2. Authentic Palmyra Palm (Borassus flabellifer - Iconic Indian coastal fan palm)
  const palmyraGeom = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];

    // Stout columnar dark charcoal-black trunk with ring scars
    const trunk = new THREE.CylinderGeometry(0.065, 0.09, 4.4, 10, 16);
    trunk.deleteAttribute('uv');
    trunk.deleteAttribute('normal');
    trunk.translate(0, 2.2, 0);
    const tpos = trunk.attributes.position;
    const tCols = new Float32Array(tpos.count * 3);
    for (let i = 0; i < tpos.count; i++) {
      const y = tpos.getY(i);
      const ring = Math.sin(y * 32.0) * 0.05;
      const isPersistent = y > 3.85;
      if (isPersistent) {
        tCols[i * 3] = 0.24 + ring;
        tCols[i * 3 + 1] = 0.20 + ring;
        tCols[i * 3 + 2] = 0.16 + ring;
      } else {
        tCols[i * 3] = 0.18 + ring;
        tCols[i * 3 + 1] = 0.17 + ring;
        tCols[i * 3 + 2] = 0.16 + ring;
      }
    }
    trunk.setAttribute('color', new THREE.BufferAttribute(tCols, 3));
    parts.push(trunk.toNonIndexed());

    // Globose compact head of 24 stiff fan-shaped (costapalmate) radiating fronds
    const numLeaves = 24;
    for (let f = 0; f < numLeaves; f++) {
      const angle = (f / numLeaves) * Math.PI * 2;
      const tier = f % 3;
      const pitch = tier === 0 ? 0.42 : tier === 1 ? 0.05 : -0.52;
      const leafLen = 1.35 + (f % 3) * 0.15;
      const fGeom = new THREE.BufferGeometry();
      const fVerts: number[] = [];
      const fCols: number[] = [];

      const petioleLen = 0.55;
      const pX1 = Math.cos(angle) * Math.cos(pitch) * petioleLen;
      const pY1 = 4.4 + Math.sin(pitch) * petioleLen;
      const pZ1 = Math.sin(angle) * Math.cos(pitch) * petioleLen;

      const fanSegments = 7;
      const fanSpan = 0.82;
      for (let seg = 0; seg < fanSegments; seg++) {
        const segFrac0 = (seg / fanSegments - 0.5) * fanSpan;
        const segFrac1 = ((seg + 1) / fanSegments - 0.5) * fanSpan;
        const tipLen = leafLen * (1.0 - Math.abs(seg - fanSegments / 2) * 0.12);
        const droop = tier === 2 ? -0.24 : -0.10;
        const a0 = angle + segFrac0;
        const a1 = angle + segFrac1;

        const tX0 = Math.cos(a0) * Math.cos(pitch) * tipLen;
        const tY0 = pY1 + Math.sin(pitch) * (tipLen - petioleLen) + droop;
        const tZ0 = Math.sin(a0) * Math.cos(pitch) * tipLen;
        const tX1 = Math.cos(a1) * Math.cos(pitch) * tipLen;
        const tY1 = pY1 + Math.sin(pitch) * (tipLen - petioleLen) + droop;
        const tZ1 = Math.sin(a1) * Math.cos(pitch) * tipLen;

        fVerts.push(pX1, pY1, pZ1);
        fCols.push(0.20, 0.36, 0.22);
        fVerts.push(tX0, tY0, tZ0);
        fCols.push(0.24, 0.44, 0.26);
        fVerts.push(tX1, tY1, tZ1);
        fCols.push(0.22, 0.40, 0.24);
      }

      fGeom.setAttribute('position', new THREE.Float32BufferAttribute(fVerts, 3));
      fGeom.setAttribute('color', new THREE.Float32BufferAttribute(fCols, 3));
      parts.push(fGeom);
    }
    const merged = mergeGeometries(parts, false);
    merged.computeVertexNormals();
    return merged;
  }, []);

  // C. Indian Broadleaf Shade Tree (Neem / Tamarind / Peepal - sprawling woody canopy)
  const eucalyptusGeom = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];

    // Main Woody Trunk
    const trunk = new THREE.CylinderGeometry(0.12, 0.18, 1.6, 8, 4);
    trunk.deleteAttribute('uv');
    trunk.deleteAttribute('normal');
    trunk.translate(0, 0.8, 0);
    const tpos = trunk.attributes.position;
    const tCols = new Float32Array(tpos.count * 3);
    for (let i = 0; i < tpos.count; i++) {
      tCols[i * 3] = 0.28;
      tCols[i * 3 + 1] = 0.20;
      tCols[i * 3 + 2] = 0.14;
    }
    trunk.setAttribute('color', new THREE.BufferAttribute(tCols, 3));
    parts.push(trunk.toNonIndexed());

    // 4 Crooked Spreading Limbs
    const limbs = [
      { from: [0, 1.4, 0], to: [-0.45, 2.3, 0.25], r: 0.08 },
      { from: [0, 1.4, 0], to: [0.50, 2.4, -0.20], r: 0.08 },
      { from: [0, 1.4, 0], to: [0.05, 2.5, -0.45], r: 0.075 },
      { from: [0, 1.4, 0], to: [-0.10, 2.6, 0.40], r: 0.07 },
    ];

    limbs.forEach(limb => {
      const dx = limb.to[0] - limb.from[0];
      const dy = limb.to[1] - limb.from[1];
      const dz = limb.to[2] - limb.from[2];
      const len = Math.hypot(dx, dy, dz);

      const bGeom = new THREE.CylinderGeometry(limb.r * 0.7, limb.r, len, 6, 2);
      bGeom.deleteAttribute('uv');
      bGeom.deleteAttribute('normal');
      bGeom.translate(0, len / 2, 0);

      const quat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(dx, dy, dz).normalize()
      );
      bGeom.applyQuaternion(quat);
      bGeom.translate(limb.from[0], limb.from[1], limb.from[2]);

      const bCols = new Float32Array(bGeom.attributes.position.count * 3);
      for (let i = 0; i < bGeom.attributes.position.count; i++) {
        bCols[i * 3] = 0.30;
        bCols[i * 3 + 1] = 0.22;
        bCols[i * 3 + 2] = 0.15;
      }
      bGeom.setAttribute('color', new THREE.BufferAttribute(bCols, 3));
      parts.push(bGeom.toNonIndexed());
    });

    // Lush Organic Leaf Clusters (Smooth Deformed Spheres with Natural Canopy Volume)
    const canopyClusters = [
      { pos: [0, 2.9, 0], r: 0.95 },
      { pos: [-0.60, 2.6, 0.35], r: 0.85 },
      { pos: [0.65, 2.7, -0.25], r: 0.88 },
      { pos: [0.10, 2.8, -0.65], r: 0.82 },
      { pos: [-0.20, 3.0, 0.55], r: 0.80 },
      { pos: [0.45, 3.2, 0.30], r: 0.78 },
      { pos: [-0.40, 3.3, -0.30], r: 0.75 },
      { pos: [0.0, 3.5, 0.0], r: 0.70 },
    ];

    canopyClusters.forEach((cl, cIdx) => {
      const puff = new THREE.SphereGeometry(cl.r, 12, 10);
      puff.deleteAttribute('uv');
      puff.deleteAttribute('normal');
      const ppos = puff.attributes.position;
      const pCols = new Float32Array(ppos.count * 3);

      for (let i = 0; i < ppos.count; i++) {
        const vx = ppos.getX(i);
        const vy = ppos.getY(i);
        const vz = ppos.getZ(i);

        const noise =
          Math.sin(vx * 4.5 + cIdx) * 0.10 +
          Math.cos(vy * 5.2 + cIdx) * 0.08 +
          Math.sin(vz * 4.8) * 0.08;
        const scale = 1.0 + noise;

        ppos.setXYZ(i, vx * scale + cl.pos[0], vy * scale * 0.85 + cl.pos[1], vz * scale + cl.pos[2]);

        const heightGrad = (vy + cl.r) / (cl.r * 2);
        const sunShine = Math.max(0, heightGrad);

        pCols[i * 3] = 0.16 + sunShine * 0.16;
        pCols[i * 3 + 1] = 0.38 + sunShine * 0.24;
        pCols[i * 3 + 2] = 0.12 + sunShine * 0.12;
      }
      puff.setAttribute('color', new THREE.BufferAttribute(pCols, 3));
      parts.push(puff.toNonIndexed());
    });

    const merged = mergeGeometries(parts, false);
    merged.computeVertexNormals();
    return merged;
  }, []);

  // D. Coastal Dune Scrub & Bushes
  const scrubGeom = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const clumps = [
      { pos: [0, 0.25, 0], r: 0.55 },
      { pos: [-0.3, 0.20, 0.2], r: 0.45 },
      { pos: [0.35, 0.18, -0.15], r: 0.42 },
      { pos: [0.1, 0.22, 0.35], r: 0.40 },
    ];

    clumps.forEach((cl, idx) => {
      const mound = new THREE.SphereGeometry(cl.r, 10, 8);
      mound.deleteAttribute('uv');
      mound.deleteAttribute('normal');
      mound.translate(cl.pos[0], cl.pos[1], cl.pos[2]);
      const mpos = mound.attributes.position;
      const mCols = new Float32Array(mpos.count * 3);

      for (let i = 0; i < mpos.count; i++) {
        // Flatten bottom so scrub hugs ground naturally
        const y = Math.max(0.02, mpos.getY(i) * 0.55);
        mpos.setY(i, y);

        mCols[i * 3] = 0.24 + idx * 0.02;
        mCols[i * 3 + 1] = 0.38 + idx * 0.03;
        mCols[i * 3 + 2] = 0.16 + idx * 0.02;
      }
      mound.setAttribute('color', new THREE.BufferAttribute(mCols, 3));
      parts.push(mound.toNonIndexed());
    });

    const merged = mergeGeometries(parts, false);
    merged.computeVertexNormals();
    return merged;
  }, []);

  // Casuarina Cluster Instances (Tall windbreak lines on distant horizon)
  const casuarinaInstances = useMemo(() => {
    const count = 22;
    const dummy = new THREE.Object3D();
    const data: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];
    const palette = [
      new THREE.Color(1.00, 1.00, 1.00),
      new THREE.Color(1.02, 1.02, 0.98),
      new THREE.Color(0.96, 1.00, 0.98),
      new THREE.Color(1.01, 0.98, 0.96),
    ];

    for (let i = 0; i < count; i++) {
      let tx: number, tz: number;
      if (i < 11) {
        // Northwest windbreak line (Pulicat Lagoon flank horizon)
        tx = -16 - (i % 6) * 2.5 + Math.sin(i * 2.3) * 1.2;
        tz = -30 - Math.floor(i / 6) * 4.5 - Math.cos(i * 1.7) * 1.5;
      } else {
        // Northeast windbreak line (Bay of Bengal coast flank horizon)
        tx = 16 + ((i - 11) % 6) * 2.4 + Math.sin(i * 3.1) * 1.2;
        tz = -30 - Math.floor((i - 11) / 6) * 4.5 - Math.cos(i * 2.2) * 1.5;
      }

      const scale = 0.92 + (i % 4) * 0.12;
      const hScale = scale * (0.95 + (i % 3) * 0.18);

      dummy.position.set(tx, -0.42, tz);
      dummy.scale.set(scale, hScale, scale);
      dummy.rotation.set(0, (i * 2.1) % (Math.PI * 2), 0);
      dummy.updateMatrix();

      data.push({
        matrix: dummy.matrix.clone(),
        color: palette[i % palette.length],
      });
    }
    return data;
  }, []);

  // Coconut Palm Instances (Iconic coastal South Indian palms with natural graceful lean)
  const palmInstances = useMemo(() => {
    const count = 18;
    const dummy = new THREE.Object3D();
    const data: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];
    const palette = [
      new THREE.Color(1.00, 1.00, 1.00),
      new THREE.Color(1.03, 1.02, 0.97),
      new THREE.Color(0.97, 1.02, 0.96),
      new THREE.Color(1.02, 0.98, 0.95),
    ];

    for (let i = 0; i < count; i++) {
      let tx: number, tz: number;
      if (i < 10) {
        // West/Southwest grove visible behind cards
        tx = -13 - (i % 5) * 2.6 + Math.sin(i * 1.7) * 1.0;
        tz = -22 - Math.floor(i / 5) * 3.8 - Math.cos(i * 2.1) * 1.2;
      } else {
        // East coast grove framing sea horizon
        tx = 14 + ((i - 10) % 4) * 2.5 + Math.sin(i * 2.2) * 0.8;
        tz = -22 - Math.floor((i - 10) / 4) * 3.5;
      }

      const scale = 0.88 + (i % 4) * 0.14;
      const hScale = scale * (0.95 + (i % 3) * 0.15);

      // Natural palm lean (tilted 5 to 11 degrees towards coast breeze)
      const leanAngle = 0.08 + (i % 3) * 0.05;
      const leanDir = (i * 1.8) % (Math.PI * 2);

      dummy.position.set(tx, -0.42, tz);
      dummy.scale.set(scale, hScale, scale);
      dummy.rotation.set(
        Math.sin(leanDir) * leanAngle,
        (i * 1.6) % (Math.PI * 2),
        Math.cos(leanDir) * leanAngle
      );
      dummy.updateMatrix();

      data.push({
        matrix: dummy.matrix.clone(),
        color: palette[i % palette.length],
      });
    }
    return data;
  }, []);

  // Palmyra Palm Instances (Iconic South Indian coastal silhouette)
  const palmyraInstances = useMemo(() => {
    const count = 16;
    const dummy = new THREE.Object3D();
    const data: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];
    const palette = [
      new THREE.Color(1.00, 1.00, 1.00),
      new THREE.Color(1.03, 1.01, 0.98),
      new THREE.Color(0.97, 1.02, 0.97),
    ];
    for (let i = 0; i < count; i++) {
      let tx: number, tz: number;
      if (i < 8) {
        tx = -14 - (i % 4) * 2.8 + Math.sin(i * 1.9) * 1.1;
        tz = -20 - Math.floor(i / 4) * 4.2 - Math.cos(i * 2.3) * 1.4;
      } else {
        tx = 15 + ((i - 8) % 4) * 2.6 + Math.sin(i * 2.5) * 1.0;
        tz = -20 - Math.floor((i - 8) / 4) * 4.0;
      }
      const scale = 0.95 + (i % 4) * 0.12;
      const hScale = scale * (0.95 + (i % 3) * 0.18);
      dummy.position.set(tx, -0.42, tz);
      dummy.scale.set(scale, hScale, scale);
      dummy.rotation.set(0, (i * 1.7) % (Math.PI * 2), 0);
      dummy.updateMatrix();
      data.push({ matrix: dummy.matrix.clone(), color: palette[i % palette.length] });
    }
    return data;
  }, []);

  // Indian Broadleaf Shade Tree Instances (Neem / Tamarind / Peepal)
  const eucalyptusInstances = useMemo(() => {
    const count = 10;
    const dummy = new THREE.Object3D();
    const data: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];
    const palette = [
      new THREE.Color(1.00, 1.00, 1.00),
      new THREE.Color(1.04, 1.02, 0.98),
      new THREE.Color(0.98, 1.03, 0.97),
      new THREE.Color(1.01, 0.99, 0.96),
    ];

    for (let i = 0; i < count; i++) {
      let tx: number, tz: number;
      if (i < 5) {
        // West flank stands
        tx = -16 - i * 2.4 + Math.sin(i * 2.8) * 1.2;
        tz = -25 - (i % 3) * 4.0;
      } else {
        // East flank stands
        tx = 17 + (i - 5) * 2.2 + Math.cos(i * 2.1) * 1.0;
        tz = -25 - (i % 3) * 3.8;
      }

      const scale = 0.95 + (i % 3) * 0.20;
      dummy.position.set(tx, -0.42, tz);
      dummy.scale.set(scale, scale * (0.9 + (i % 2) * 0.15), scale);
      dummy.rotation.set(0, (i * 2.3) % (Math.PI * 2), 0);
      dummy.updateMatrix();

      data.push({
        matrix: dummy.matrix.clone(),
        color: palette[i % palette.length],
      });
    }
    return data;
  }, []);

  // Coastal Dune Scrub & Bushes
  const scrubInstances = useMemo(() => {
    const count = 30;
    const dummy = new THREE.Object3D();
    const data: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];
    const palette = [
      new THREE.Color(1.00, 1.00, 1.00),
      new THREE.Color(1.04, 1.03, 0.98),
      new THREE.Color(0.97, 1.02, 0.96),
    ];

    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const tx = side * (10.5 + (i % 6) * 2.6 + Math.sin(i * 2.5) * 1.6);
      const tz = -18 - (i % 5) * 3.0 - Math.cos(i * 1.5) * 2.0;

      const scale = 0.75 + (i % 4) * 0.16;
      dummy.position.set(tx, -0.42, tz);
      dummy.scale.set(scale, scale * (0.55 + (i % 3) * 0.15), scale);
      dummy.rotation.set(0, (i * 1.9) % (Math.PI * 2), 0);
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
    if (palmyraRef.current) {
      const mesh = palmyraRef.current;
      palmyraInstances.forEach((inst, idx) => {
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
  }, [casuarinaInstances, palmyraInstances, palmInstances, eucalyptusInstances, scrubInstances]);

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
    const isSmoking = (isLiftoffActive && liftoffTime >= 0.2) || sp > 0.005;
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
                {/* 4 Hold-Down Launch Support Pedestals elevating the vehicle above the deck */}
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
        ref={palmyraRef}
        args={[palmyraGeom, materials.palmyraMat, palmyraInstances.length]}
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
      {/* Floating spark discs removed: pure rocket fire & soft trench smoke only */}

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
