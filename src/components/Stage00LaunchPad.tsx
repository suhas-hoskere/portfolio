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

  // 1. Natural coastal soil & scrub base
  const baseGrad = dctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  baseGrad.addColorStop(0.0, '#475569'); // Concrete grey under pad
  baseGrad.addColorStop(0.12, '#3b434e'); // Apron perimeter
  baseGrad.addColorStop(0.18, '#322d24'); // Packed earth & gravel
  baseGrad.addColorStop(0.35, '#242f1f'); // Coastal evergreen grass
  baseGrad.addColorStop(0.70, '#1a2417'); // Scrubland
  baseGrad.addColorStop(1.0, '#10170e'); // Distant treeline marsh
  dctx.fillStyle = baseGrad;
  dctx.fillRect(0, 0, size, size);

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
  const treesInstancedRef = useRef<THREE.InstancedMesh>(null);

  const terrain = useMemo(() => getCachedTerrainTextures(), []);
  const smokeTexture = useMemo(() => getCachedSmokeTexture(), []);
  const mistTexture = useMemo(() => getCachedMistTexture(), []);
  const emberTexture = useMemo(() => getCachedEmberTexture(), []);

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
        color: '#e2e8f0', // Clean architectural concrete mount
        roughness: 0.65,
        metalness: 0.15,
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
      beaconRed: new THREE.MeshBasicMaterial({
        color: '#ff2222',
      }),
      pineNeedleMat: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.82,
        metalness: 0.05,
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
  }, [terrain, smokeTexture, mistTexture, emberTexture]);

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

  // 3. Instanced Natural Trees (Realistic 4-Tier Lathe Geometry with organic hue variations)
  const treeCount = STAGE_CONFIG.stage00_launchPad.environment.treeCount;

  const treeGeom = useMemo(() => {
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0.12, 0.0),   // Trunk base firmly planted in ground
      new THREE.Vector2(0.10, 0.10),  // Trunk flare
      new THREE.Vector2(0.95, 0.10),  // Bottom tier foliage right near ground
      new THREE.Vector2(0.65, 0.85),  // Tier 1 waist
      new THREE.Vector2(0.80, 0.85),  // Tier 2 flare
      new THREE.Vector2(0.48, 1.65),  // Tier 2 waist
      new THREE.Vector2(0.60, 1.65),  // Tier 3 flare
      new THREE.Vector2(0.28, 2.45),  // Tier 3 waist
      new THREE.Vector2(0.36, 2.45),  // Tier 4 flare
      new THREE.Vector2(0.0, 3.2),    // Apex tip
    ];
    const geom = new THREE.LatheGeometry(points, 9);
    geom.computeVertexNormals();
    return geom;
  }, []);

  const treeMatrices = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const dummy = new THREE.Object3D();

    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2 + Math.sin(i * 3.7) * 0.4;
      const radius = 18 + (i % 7) * 4.2 + Math.sin(i * 1.9) * 3.0;

      const tx = Math.cos(angle) * radius * 1.4;
      // All trees sit along the distant horizon and flanks (tz <= -7.0)
      const tz = -Math.abs(Math.sin(angle) * radius) - 7.0;

      // Keep central rocket corridor clear
      if (Math.abs(tx) < 4.5 && Math.abs(tz) < 10.0) continue;

      const scale = 0.85 + (i % 5) * 0.22 + (i % 3) * 0.15;
      const heightScale = scale * (0.95 + (i % 4) * 0.22);

      dummy.position.set(tx, -0.42, tz);
      dummy.scale.set(scale, heightScale, scale);
      dummy.rotation.y = (i * 1.3) % (Math.PI * 2);
      dummy.updateMatrix();

      matrices.push(dummy.matrix.clone());
    }

    return matrices;
  }, [treeCount]);

  useEffect(() => {
    if (!treesInstancedRef.current) return;
    const mesh = treesInstancedRef.current;
    const palette = [
      new THREE.Color('#223f20'),
      new THREE.Color('#2a4c28'),
      new THREE.Color('#1a3217'),
      new THREE.Color('#35522a'),
      new THREE.Color('#284023'),
      new THREE.Color('#1f3a1d'),
    ];
    treeMatrices.forEach((mat, idx) => {
      mesh.setMatrixAt(idx, mat);
      mesh.setColorAt(idx, palette[idx % palette.length]);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [treeMatrices]);

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

    // 1. Aviation Obstacle Strobes
    const beaconStrobe = Math.sin(t * STAGE_CONFIG.stage00_launchPad.beaconStrobeHz * Math.PI) > 0.3 ? 1.0 : 0.05;
    materials.beaconRed.color.setRGB(beaconStrobe, 0.02 * beaconStrobe, 0.02 * beaconStrobe);
    if (beaconLightRef.current) {
      beaconLightRef.current.intensity = beaconStrobe * 3.5;
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
        {/* Solid concrete foundation block embedded into ground */}
        <mesh position={[0, -0.14, 0]} material={materials.mlpConcreteBase}>
          <boxGeometry args={[3.2, 0.52, 2.8]} />
        </mesh>
        {/* Heavy galvanized steel launch deck */}
        <mesh position={[0, 0.14, 0]} material={materials.mlpDeckSteel}>
          <boxGeometry args={[3.0, 0.08, 2.6]} />
        </mesh>
        {/* Flame Trench Cutout Opening beneath vehicle */}
        <mesh position={[0, -0.20, 0]} material={materials.trenchPit}>
          <boxGeometry args={[1.5, 0.50, 1.3]} />
        </mesh>
        {/* Flame Deflector Wedge beneath opening */}
        <mesh position={[0, -0.18, 0]} rotation={[0, 0, Math.PI / 4]} material={materials.flameDeflectorSteel}>
          <boxGeometry args={[0.55, 0.55, 1.2]} />
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
        <mesh position={[0, 5.5, 0]} material={materials.towerSteel}>
          <cylinderGeometry args={[0.03, 0.05, 0.9, 8]} />
        </mesh>
        <mesh position={[0, 6.0, 0]} material={materials.beaconRed}>
          <sphereGeometry args={[0.08, 8, 8]} />
        </mesh>
        <pointLight ref={beaconLightRef} position={[0, 6.0, 0]} color="#ff2222" intensity={3.5} distance={14} />
      </group>

      {/* 5. Distant Lightning Masts & Water Deluge Tower (Framing the launch complex realistically) */}
      <group position={[0, 0, 0]}>
        {/* 4 Perimeter Lightning Protection Masts (Set in the distance along the horizon) */}
        {[
          { x: -12.0, z: -18.0 },
          { x: -5.0, z: -20.0 },
          { x: 9.0, z: -19.0 },
          { x: 17.0, z: -17.0 },
        ].map((mast, mIdx) => (
          <group key={`mast-${mIdx}`} position={[mast.x, 0, mast.z]}>
            <mesh position={[0, 2.5, 0]} material={materials.galvanizedTruss}>
              <cylinderGeometry args={[0.08, 0.16, 5.8, 8]} />
            </mesh>
            <mesh position={[0, 5.5, 0]} material={materials.beaconRed}>
              <sphereGeometry args={[0.12, 6, 6]} />
            </mesh>
          </group>
        ))}

        {/* Distant Spherical Water Deluge Storage Tower */}
        <group position={[14.5, 0, -18.0]}>
          <mesh position={[0, 2.2, 0]} material={materials.towerSteel}>
            <cylinderGeometry args={[0.4, 0.6, 4.4, 8]} />
          </mesh>
          <mesh position={[0, 4.8, 0]} material={materials.waterTowerMat}>
            <sphereGeometry args={[1.5, 24, 20]} />
          </mesh>
        </group>
      </group>

      {/* 6. Instanced Natural Pine & Casuarina Trees */}
      <instancedMesh
        ref={treesInstancedRef}
        args={[treeGeom, materials.pineNeedleMat, treeCount]}
      />

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
