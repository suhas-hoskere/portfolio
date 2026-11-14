import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STAGE_CONFIG } from '../scene/stageConfig';

interface IndiaLaunchPadProps {
  scrollProgressRef: React.MutableRefObject<number>;
  isIgnited?: boolean;
}

// ============================================================================
// 1. PROCEDURAL STEAM & MIST TEXTURE
// ============================================================================
let cachedSmokePuffTexture: THREE.CanvasTexture | null = null;
function getCachedSmokePuffTexture(): THREE.CanvasTexture {
  if (cachedSmokePuffTexture) return cachedSmokePuffTexture;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Soft billowing acoustic deluge steam cumulus puff (realistic semi-transparent steam)
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, 'rgba(240, 245, 252, 0.45)');
  grad.addColorStop(0.35, 'rgba(220, 230, 242, 0.28)');
  grad.addColorStop(0.65, 'rgba(185, 200, 220, 0.12)');
  grad.addColorStop(0.85, 'rgba(150, 170, 195, 0.04)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  cachedSmokePuffTexture = new THREE.CanvasTexture(canvas);
  cachedSmokePuffTexture.generateMipmaps = false;
  return cachedSmokePuffTexture;
}

let cachedFireSmokeTexture: THREE.CanvasTexture | null = null;
function getCachedFireSmokeTexture(): THREE.CanvasTexture {
  if (cachedFireSmokeTexture) return cachedFireSmokeTexture;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Hot glowing amber/orange fiery blast-smoke illuminated by solid booster combustion
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, 'rgba(255, 225, 150, 0.80)');
  grad.addColorStop(0.30, 'rgba(255, 145, 35, 0.50)');
  grad.addColorStop(0.60, 'rgba(220, 70, 15, 0.20)');
  grad.addColorStop(0.85, 'rgba(160, 40, 10, 0.05)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  cachedFireSmokeTexture = new THREE.CanvasTexture(canvas);
  cachedFireSmokeTexture.generateMipmaps = false;
  return cachedFireSmokeTexture;
}

// ============================================================================
// 2. PROCEDURAL SRIHARIKOTA SPACEPORT & TERRAIN TEXTURE (512x512)
// Natural Barrier Island Soil · Casuarina Groves · Concrete Apron · Bay of Bengal
// ============================================================================
interface TerrainTextures {
  diffuse: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
}

let cachedTerrainTextures: TerrainTextures | null = null;

function getCachedLaunchPadTerrainTexture(): TerrainTextures {
  if (cachedTerrainTextures) return cachedTerrainTextures;

  const size = 512;
  const diffuseCanvas = document.createElement('canvas');
  diffuseCanvas.width = size;
  diffuseCanvas.height = size;
  const dctx = diffuseCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d')!;

  // 1. Base Terrain: Sriharikota barrier island natural coastal soil, dunes & marsh
  const baseGrad = dctx.createLinearGradient(0, 0, size, 0);
  baseGrad.addColorStop(0.0, '#1c261e'); // Inland Pulicat salt marsh & scrub
  baseGrad.addColorStop(0.30, '#252e22'); // Coastal evergreen scrubland
  baseGrad.addColorStop(0.50, '#2e2c24'); // Compacted spaceport ground
  baseGrad.addColorStop(0.72, '#383226'); // Sandy coastal dune soil
  baseGrad.addColorStop(0.85, '#28241d'); // Damp intertidal shoreline
  baseGrad.addColorStop(0.92, '#11283d'); // Bay of Bengal surf break
  baseGrad.addColorStop(1.0, '#061424'); // Deep Bay of Bengal ocean waters
  dctx.fillStyle = baseGrad;
  dctx.fillRect(0, 0, size, size);

  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, size, size);

  // 2. Natural Casuarina Pine Tree Clusters (Distant natural barrier treeline)
  dctx.save();
  const forestColors = [
    'rgba(18, 38, 22, 0.70)',
    'rgba(24, 48, 28, 0.65)',
    'rgba(30, 58, 34, 0.55)',
  ];

  for (let i = 0; i < 24; i++) {
    const fx = ((i * 73 + 23) % size);
    const fy = ((i * 89 + 41) % size);
    const distToCenter = Math.hypot(fx - size * 0.5, fy - size * 0.5);
    if (distToCenter < 90) continue; // Leave central launch apron clear

    const frad = 12 + (i % 5) * 8;
    const fColor = forestColors[i % forestColors.length];
    const fg = dctx.createRadialGradient(fx, fy, 0, fx, fy, frad);
    fg.addColorStop(0, fColor);
    fg.addColorStop(0.7, fColor.replace('0.', '0.25'));
    fg.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = fg;
    dctx.beginPath();
    dctx.arc(fx, fy, frad, 0, Math.PI * 2);
    dctx.fill();

    // Bump for tree canopy volume
    const bg = bctx.createRadialGradient(fx, fy, 0, fx, fy, frad);
    bg.addColorStop(0, '#9a9a9a');
    bg.addColorStop(0.7, '#888888');
    bg.addColorStop(1, '#808080');
    bctx.fillStyle = bg;
    bctx.beginPath();
    bctx.arc(fx, fy, frad, 0, Math.PI * 2);
    bctx.fill();
  }
  dctx.restore();

  // 3. Central Reinforced Concrete Launch Apron (SDSC SHAR Second Launch Pad)
  const cx = size * 0.50;
  const cy = size * 0.50;
  const padRad = 72;

  // Outer Apron Tarmac Clearing
  const apronGrad = dctx.createRadialGradient(cx, cy, 0, cx, cy, padRad * 1.2);
  apronGrad.addColorStop(0.0, '#333e4d');
  apronGrad.addColorStop(0.85, '#28313d');
  apronGrad.addColorStop(1.0, 'rgba(40, 49, 61, 0)');
  dctx.fillStyle = apronGrad;
  dctx.beginPath();
  dctx.arc(cx, cy, padRad * 1.2, 0, Math.PI * 2);
  dctx.fill();

  // Heavy Industrial Concrete Core Pad
  dctx.fillStyle = '#424f60';
  dctx.beginPath();
  dctx.arc(cx, cy, padRad, 0, Math.PI * 2);
  dctx.fill();

  // Exhaust Blast Scorched Footprint (Thermal ablation zone)
  const blastGrad = dctx.createRadialGradient(cx, cy, 0, cx, cy, 48);
  blastGrad.addColorStop(0.0, 'rgba(15, 18, 22, 0.90)');
  blastGrad.addColorStop(0.50, 'rgba(22, 27, 34, 0.65)');
  blastGrad.addColorStop(0.85, 'rgba(32, 38, 48, 0.20)');
  blastGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  dctx.fillStyle = blastGrad;
  dctx.beginPath();
  dctx.arc(cx, cy, 48, 0, Math.PI * 2);
  dctx.fill();

  // Bump Map for Elevated Concrete Pad
  bctx.fillStyle = '#949494';
  bctx.beginPath();
  bctx.arc(cx, cy, padRad, 0, Math.PI * 2);
  bctx.fill();

  const diffuse = new THREE.CanvasTexture(diffuseCanvas);
  diffuse.wrapS = THREE.ClampToEdgeWrapping;
  diffuse.wrapT = THREE.ClampToEdgeWrapping;
  diffuse.generateMipmaps = false;
  diffuse.minFilter = THREE.LinearFilter;

  const bump = new THREE.CanvasTexture(bumpCanvas);
  bump.wrapS = THREE.ClampToEdgeWrapping;
  bump.wrapT = THREE.ClampToEdgeWrapping;
  bump.generateMipmaps = false;
  bump.minFilter = THREE.LinearFilter;

  cachedTerrainTextures = { diffuse, bump };
  return cachedTerrainTextures;
}
// ============================================================================
// 3. MAIN INDIA LAUNCH PAD COMPONENT (SDSC SHAR SECOND LAUNCH PAD)
// ============================================================================
export const IndiaLaunchPad: React.FC<IndiaLaunchPadProps> = ({
  scrollProgressRef,
  isIgnited = false,
}) => {
  const padGroup = useRef<THREE.Group>(null);
  const umbilicalGantryLeft = useRef<THREE.Group>(null);
  const umbilicalGantryRight = useRef<THREE.Group>(null);
  const delugeSteamGroup = useRef<THREE.Group>(null);
  const cryoVapourGroup = useRef<THREE.Group>(null);
  const padLightRef = useRef<THREE.PointLight>(null);
  const ignitionTimeRef = useRef<number | null>(null);

  const smokePuffTexture = useMemo(() => getCachedSmokePuffTexture(), []);
  const fireSmokeTexture = useMemo(() => getCachedFireSmokeTexture(), []);
  const terrainTextures = useMemo(() => getCachedLaunchPadTerrainTexture(), []);

  const materials = useMemo(() => {
    return {
      concretePad: new THREE.MeshStandardMaterial({
        color: '#475569',
        roughness: 0.85,
        metalness: 0.12,
      }),
      concreteBase: new THREE.MeshStandardMaterial({
        color: '#334155',
        roughness: 0.90,
      }),
      pylonConcrete: new THREE.MeshStandardMaterial({
        color: '#cbd5e1', // High-visibility light concrete for camera pylons
        roughness: 0.75,
        metalness: 0.15,
      }),
      mlpSteel: new THREE.MeshStandardMaterial({
        color: '#94a3b8', // Industrial galvanized steel deck
        roughness: 0.35,
        metalness: 0.80,
      }),
      mlpConcreteWall: new THREE.MeshStandardMaterial({
        color: '#e2e8f0', // Clean light concrete wall on SDSC SHAR launch mount
        roughness: 0.70,
        metalness: 0.15,
      }),
      flameTrenchLining: new THREE.MeshStandardMaterial({
        color: '#1e2430',
        roughness: 0.70,
        metalness: 0.45,
      }),
      deflectorSteel: new THREE.MeshStandardMaterial({
        color: '#334155',
        roughness: 0.45,
        metalness: 0.78,
      }),
      holdDownSteel: new THREE.MeshStandardMaterial({
        color: '#283344',
        roughness: 0.32,
        metalness: 0.92,
      }),
      galvanizedLattice: new THREE.MeshStandardMaterial({
        color: '#94a3b8', // Authentic galvanized steel framing SDSC SHAR towers
        roughness: 0.35,
        metalness: 0.85,
      }),
      towerSteel: new THREE.MeshStandardMaterial({
        color: '#475569',
        roughness: 0.40,
        metalness: 0.82,
      }),
      towerAccent: new THREE.MeshStandardMaterial({
        color: '#334155',
        roughness: 0.35,
        metalness: 0.80,
      }),
      cabinWhite: new THREE.MeshStandardMaterial({
        color: '#e2e8f0', // Enclosed tower maintenance cabins
        roughness: 0.45,
        metalness: 0.25,
      }),
      craneYellow: new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        roughness: 0.30,
        metalness: 0.65,
      }),
      gantryOrange: new THREE.MeshStandardMaterial({
        color: '#ea580c', // Iconic SDSC SHAR Second Launch Pad service wing orange
        roughness: 0.35,
        metalness: 0.70,
      }),
      handrailYellow: new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        roughness: 0.28,
        metalness: 0.60,
      }),
      delugeRed: new THREE.MeshStandardMaterial({
        color: '#dc2626', // High-pressure water deluge supply red
        roughness: 0.35,
        metalness: 0.65,
      }),
      tropicalFoliage: new THREE.MeshStandardMaterial({
        color: '#070f0b', // Soft atmospheric dark silhouette
        roughness: 0.96,
        metalness: 0.02,
      }),
      foliageHighlight: new THREE.MeshStandardMaterial({
        color: '#0a1610',
        roughness: 0.94,
        metalness: 0.02,
      }),
      treeBark: new THREE.MeshStandardMaterial({
        color: '#120d09', // Weathered dark bark
        roughness: 0.95,
        metalness: 0.02,
      }),
      forestCanopyDeep: new THREE.MeshStandardMaterial({
        color: '#050c08', // Deepest silhouette shadow
        roughness: 0.98,
        metalness: 0.01,
      }),
      forestCanopyMid: new THREE.MeshStandardMaterial({
        color: '#08120b',
        roughness: 0.95,
        metalness: 0.02,
      }),
      forestCanopyLight: new THREE.MeshStandardMaterial({
        color: '#0c1810',
        roughness: 0.92,
        metalness: 0.03,
      }),
      mastWhite: new THREE.MeshBasicMaterial({ color: '#f8fafc' }),
      mastRed: new THREE.MeshBasicMaterial({ color: '#ef4444' }),
      floodlightGlow: new THREE.MeshBasicMaterial({
        color: '#fef08a',
      }),
      saffronBand: new THREE.MeshBasicMaterial({ color: '#ff9933' }),
      whiteBand: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      greenBand: new THREE.MeshBasicMaterial({ color: '#138808' }),
      beaconRed: new THREE.MeshBasicMaterial({
        color: '#ef4444',
      }),
      cryoTankWhite: new THREE.MeshStandardMaterial({
        color: '#f8fafc',
        roughness: 0.28,
        metalness: 0.35,
      }),
      cryoPipeSilver: new THREE.MeshStandardMaterial({
        color: '#cbd5e1',
        roughness: 0.22,
        metalness: 0.88,
      }),
      pipeOrange: new THREE.MeshStandardMaterial({
        color: '#ea580c',
        roughness: 0.38,
        metalness: 0.55,
      }),
      delugeSteamMat: new THREE.MeshBasicMaterial({
        map: smokePuffTexture,
        transparent: true,
        opacity: 0.30,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
      fireSmokeMat: new THREE.MeshBasicMaterial({
        map: fireSmokeTexture,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    };
  }, [smokePuffTexture, fireSmokeTexture]);

  // Real Chandrayaan-3 / LVM3 Launch Pad Trench Smoke:
  // Exhaust is deflected LATERALLY out through East and West flame trenches,
  // boiling into colossal acoustic deluge steam clouds across the ground apron on left and right,
  // with deep trench fire glow under the deck, keeping the central vehicle corridor COMPLETELY UNOBSCURED!
  const launchSmokeClouds = useMemo(() => {
    const clouds = [];

    // Lateral West (Left) Trench Plume - venting out to the left flank across the ground
    for (let i = 0; i < 16; i++) {
      const dist = 2.2 + (i % 6) * 0.55; // x from -2.2 out to -5.0
      clouds.push({
        x: -dist,
        y: -0.15 + (i % 3) * 0.08, // hugs the ground flume
        z: -0.6 + (i % 4) * 0.35,
        baseScale: 0.38 + (i % 5) * 0.08,
        isFire: i < 3, // fiery near trench exit
        rotSpeed: (i % 2 === 0 ? 1 : -1) * (0.12 + (i % 3) * 0.05),
      });
    }

    // Lateral East (Right) Trench Plume - venting out to the right flank across the ground
    for (let i = 0; i < 16; i++) {
      const dist = 2.2 + (i % 6) * 0.55; // x from +2.2 out to +5.0
      clouds.push({
        x: dist,
        y: -0.15 + (i % 3) * 0.08,
        z: -0.6 + (i % 4) * 0.35,
        baseScale: 0.38 + (i % 5) * 0.08,
        isFire: i < 3,
        rotSpeed: (i % 2 === 0 ? 1 : -1) * (0.12 + (i % 3) * 0.05),
      });
    }

    // Deep Sub-Deck Trench Flame Deflector - buried deep inside the pit under the MLP
    for (let i = 0; i < 4; i++) {
      clouds.push({
        x: ((i % 2) - 0.5) * 0.4,
        y: -0.32,
        z: ((i % 2) - 0.5) * 0.3,
        baseScale: 0.28,
        isFire: true,
        rotSpeed: (i % 2 === 0 ? 1 : -1) * 0.15,
      });
    }

    return clouds;
  }, []);

  // Continuous 3D Coastal Pine & Casuarina Forest Horizon
  // Replaces flat void with authentic Sriharikota tropical barrier-island treeline
  const horizonForest = useMemo(() => {
    const trees = [];
    for (let i = 0; i < 44; i++) {
      const x = -26.0 + i * 1.25 + (Math.sin(i * 1.7) * 0.4);
      // Keep immediate central rocket corridor clear
      if (Math.abs(x) < 2.5) continue;
      const z = -14.0 - ((i * 11) % 16);
      const height = 1.6 + ((i % 5) * 0.35);
      const radius = 0.45 + ((i % 4) * 0.12);
      trees.push({
        key: `h-tree-${i}`,
        x,
        z,
        height,
        radius,
        matVariant: i % 3,
      });
    }
    return trees;
  }, []);

  // Spaceport High-Mast Security Perimeter Lighting (Authentic SDSC SHAR perimeter infrastructure)
  const perimeterLights = useMemo(() => {
    return [
      { x: -7.5, z: -8.0 },
      { x: -7.5, z: 2.0 },
      { x: 7.5, z: -8.0 },
      { x: 7.5, z: 2.0 },
      { x: -14.0, z: -15.0 },
      { x: 14.0, z: -15.0 },
    ];
  }, []);

  useFrame((state) => {
    const scrollProgress = scrollProgressRef.current;
    const t = state.clock.getElapsedTime();
    const altitudeProgress = Math.min(scrollProgress / 0.16, 1.0);

    if (scrollProgress > 0.24) {
      if (padGroup.current) padGroup.current.visible = false;
      return;
    }

    if (padGroup.current) {
      padGroup.current.visible = true;

      // Realistic physical launch inertia: accelerating lift-off curve (y proportional to t^1.4)
      const easeAltitude = Math.pow(altitudeProgress, 1.4);
      padGroup.current.position.y = -easeAltitude * 24.0;
    }

    // 1. Synchronized Aviation Obstacle Beacon Red Flashing (Real SDSC SHAR tower strobes)
    const strobe = Math.sin(t * 3.8) > 0.1 ? 1.0 : 0.08;
    materials.beaconRed.color.setRGB(strobe, 0.04 * strobe, 0.04 * strobe);

    // 3. UMBILICAL SERVICE GANTRY WINGS RETRACTION:
    // Left and right cantilever service wings swing backward away from rocket at lift-off (0.025 to 0.08)
    const armRetract = Math.min(Math.max((scrollProgress - 0.025) / 0.05, 0), 1.0);
    if (umbilicalGantryLeft.current) {
      umbilicalGantryLeft.current.rotation.y = armRetract * 0.95;
    }
    if (umbilicalGantryRight.current) {
      umbilicalGantryRight.current.rotation.y = -armRetract * 0.95;
    }

    // 4. GROUND-LEVEL WATER DELUGE STEAM & BILLOWING LAUNCH SMOKE:
    // Active only when ignition occurs at T-0 (or upon user launch / scroll)
    const isActuallyIgnited = (isIgnited || scrollProgress > 0.005) && scrollProgress < 0.22;
    if (delugeSteamGroup.current) {
      if (isActuallyIgnited) {
        delugeSteamGroup.current.visible = true;

        if (ignitionTimeRef.current === null) {
          ignitionTimeRef.current = t;
        }
        const timeSinceIgnition = t - ignitionTimeRef.current;
        const eruptionGrowth = Math.min(timeSinceIgnition / 0.55, 1.0);

        const fadeOut = scrollProgress > 0.09 ? Math.max(1.0 - (scrollProgress - 0.09) / 0.13, 0.0) : 1.0;
        materials.delugeSteamMat.opacity = 0.30 * fadeOut * eruptionGrowth;
        materials.fireSmokeMat.opacity = 0.45 * fadeOut * eruptionGrowth;

        // Dynamic multi-lobe churning and turbulent boiling animation
        delugeSteamGroup.current.children.forEach((child, idx) => {
          const mesh = child as THREE.Mesh;
          const cloud = launchSmokeClouds[idx];
          if (cloud) {
            const pulse = 1.0 + Math.sin(t * 3.2 + idx * 0.7) * 0.08;
            mesh.scale.set(cloud.baseScale * pulse * eruptionGrowth, cloud.baseScale * pulse * eruptionGrowth, 1);
            mesh.rotation.z += 0.003 * cloud.rotSpeed;
          }
        });

        // Flame light reflection on launch trench and concrete with dramatic initial ignition flash
        if (padLightRef.current) {
          const initialFlash = timeSinceIgnition < 0.38
            ? (1.0 - timeSinceIgnition / 0.38) * STAGE_CONFIG.stage00_launchPad.ignitionFlashIntensity
            : 0;
          padLightRef.current.intensity = ((9.5 + Math.sin(t * 40) * 3.0) + initialFlash) * fadeOut * eruptionGrowth;
        }
      } else {
        delugeSteamGroup.current.visible = false;
        materials.delugeSteamMat.opacity = 0;
        materials.fireSmokeMat.opacity = 0;
        if (padLightRef.current) padLightRef.current.intensity = 0;
        ignitionTimeRef.current = null;
      }
    }

    // 5. Cryogenic LH2/LOX boil-off wisps venting from umbilical disconnect valves
    if (cryoVapourGroup.current) {
      if (scrollProgress < 0.08) {
        cryoVapourGroup.current.visible = true;
        cryoVapourGroup.current.children.forEach((child, i) => {
          const wisp = child as THREE.Mesh;
          const wispT = (t * STAGE_CONFIG.stage00_launchPad.cryoVentRate + i * 0.45) % 2.0;
          wisp.position.y = 1.35 - wispT * 0.45;
          wisp.position.x = 0.14 + Math.sin(wispT * 3.0 + i) * 0.06 - wispT * 0.08;
          wisp.position.z = -0.45 + Math.cos(wispT * 2.5 + i) * 0.04;
          const scale = 0.08 + wispT * 0.18;
          wisp.scale.set(scale, scale, scale);
          const mat = wisp.material as THREE.MeshBasicMaterial;
          mat.opacity = Math.sin((wispT / 2.0) * Math.PI) * STAGE_CONFIG.stage00_launchPad.cryoVentOpacity;
        });
      } else {
        cryoVapourGroup.current.visible = false;
      }
    }
  });

  // Reusable SDSC SHAR Pyramidal 4-Legged Galvanized Steel Lightning Tower
  // Faithfully modeled with tapering geometry, cross-trusses, 4 cabins, and red/white spire
  const renderSDSCSharTower = (key: string, x: number, z: number) => {
    // 7 horizontal floor tier heights from base to apex
    const tierHeights = [-0.6, 0.3, 1.3, 2.4, 3.6, 4.9, 6.2];
    const cabinLevels = [-0.2, 1.5, 3.2, 4.8];

    return (
      <group key={key} position={[x, -1.35, z]}>
        {/* Reinforced Octagonal Concrete Foundation Block */}
        <mesh position={[0, 0.18, 0]} material={materials.concretePad}>
          <cylinderGeometry args={[0.42, 0.58, 0.36, 8]} />
        </mesh>

        {/* 4 Corner Structural Steel Main Columns (Tapering from 0.56 span at base to 0.16 at top) */}
        {[-1, 1].map((signX, i) =>
          [-1, 1].map((signZ, j) => {
            const baseSpan = 0.28;
            const topSpan = 0.08;
            const angleZ = signX * 0.026;
            const angleX = -signZ * 0.026;
            return (
              <mesh
                key={`tower-col-${i}-${j}`}
                position={[signX * ((baseSpan + topSpan) / 2), 3.8, signZ * ((baseSpan + topSpan) / 2)]}
                rotation={[angleX, 0, angleZ]}
                material={materials.galvanizedLattice}
              >
                <cylinderGeometry args={[0.022, 0.038, 7.6, 8]} />
              </mesh>
            );
          })
        )}

        {/* 7 Horizontal Perimeter Tie Frames with Tapering Spans */}
        {tierHeights.map((y, idx) => {
          const t = (y - (-1.0)) / 7.6;
          const span = 0.56 * (1.0 - t * 0.72);
          return (
            <group key={`tier-frame-${idx}`} position={[0, y, 0]}>
              <mesh position={[0, 0, span / 2]} material={materials.galvanizedLattice}>
                <boxGeometry args={[span, 0.028, 0.028]} />
              </mesh>
              <mesh position={[0, 0, -span / 2]} material={materials.galvanizedLattice}>
                <boxGeometry args={[span, 0.028, 0.028]} />
              </mesh>
              <mesh position={[span / 2, 0, 0]} material={materials.galvanizedLattice}>
                <boxGeometry args={[0.028, 0.028, span]} />
              </mesh>
              <mesh position={[-span / 2, 0, 0]} material={materials.galvanizedLattice}>
                <boxGeometry args={[0.028, 0.028, span]} />
              </mesh>
            </group>
          );
        })}

        {/* Diagonal X-Lattice Bracing in every bay */}
        {tierHeights.slice(0, -1).map((yLow, idx) => {
          const yHigh = tierHeights[idx + 1];
          const yMid = (yLow + yHigh) / 2;
          const dy = yHigh - yLow;
          const t = (yMid - (-1.0)) / 7.6;
          const span = 0.56 * (1.0 - t * 0.72);
          const diagLen = Math.sqrt(span * span + dy * dy);
          const angle = Math.atan2(dy, span);

          return (
            <group key={`x-truss-${idx}`} position={[0, yMid, 0]}>
              {/* Front Face X */}
              <mesh position={[0, 0, span / 2]} rotation={[0, 0, angle]} material={materials.galvanizedLattice}>
                <boxGeometry args={[diagLen, 0.016, 0.016]} />
              </mesh>
              <mesh position={[0, 0, span / 2]} rotation={[0, 0, -angle]} material={materials.galvanizedLattice}>
                <boxGeometry args={[diagLen, 0.016, 0.016]} />
              </mesh>
              {/* Back Face X */}
              <mesh position={[0, 0, -span / 2]} rotation={[0, 0, angle]} material={materials.galvanizedLattice}>
                <boxGeometry args={[diagLen, 0.016, 0.016]} />
              </mesh>
              <mesh position={[0, 0, -span / 2]} rotation={[0, 0, -angle]} material={materials.galvanizedLattice}>
                <boxGeometry args={[diagLen, 0.016, 0.016]} />
              </mesh>
            </group>
          );
        })}

        {/* 4 Enclosed Equipment / Observation Cabins with Yellow Handrails */}
        {cabinLevels.map((y, idx) => {
          const t = (y - (-1.0)) / 7.6;
          const span = 0.56 * (1.0 - t * 0.72);
          return (
            <group key={`cabin-${idx}`} position={[0, y, 0]}>
              {/* Cabin Housing */}
              <mesh position={[0, 0.12, 0]} material={materials.cabinWhite}>
                <boxGeometry args={[span * 0.85, 0.24, span * 0.85]} />
              </mesh>
              {/* Yellow Perimeter Platform Grating & Handrail */}
              <mesh position={[0, 0.01, 0]} material={materials.handrailYellow}>
                <boxGeometry args={[span * 1.15, 0.02, span * 1.15]} />
              </mesh>
              <mesh position={[0, 0.25, span * 0.55]} material={materials.handrailYellow}>
                <boxGeometry args={[span * 1.15, 0.012, 0.012]} />
              </mesh>
            </group>
          );
        })}

        {/* High-Altitude Lightning Mast Spire with Alternating Red & White Warning Bands */}
        <group position={[0, 7.6, 0]}>
          {[
            { y: 0.12, mat: materials.mastWhite },
            { y: 0.36, mat: materials.mastRed },
            { y: 0.60, mat: materials.mastWhite },
            { y: 0.84, mat: materials.mastRed },
            { y: 1.08, mat: materials.mastWhite },
            { y: 1.32, mat: materials.mastRed },
          ].map((seg, sIdx) => (
            <mesh key={`mast-seg-${sIdx}`} position={[0, seg.y, 0]} material={seg.mat}>
              <cylinderGeometry args={[0.012, 0.018, 0.24, 8]} />
            </mesh>
          ))}
          {/* Needle Tip Discharge Electrode */}
          <mesh position={[0, 1.56, 0]} material={materials.cryoPipeSilver}>
            <cylinderGeometry args={[0.004, 0.012, 0.24, 8]} />
          </mesh>
          {/* Synchronized Red Obstruction Flashing Strobe */}
          <mesh position={[0, 1.70, 0]} material={materials.beaconRed}>
            <sphereGeometry args={[0.065, 8, 8]} />
          </mesh>
        </group>
      </group>
    );
  };

  return (
    <group ref={padGroup} position={[0, 0, 0]}>
      {/* Dynamic Ignition Exhaust Glow on Launch Pad */}
      <pointLight
        ref={padLightRef}
        position={[0, -1.0, 0]}
        color="#ff7711"
        intensity={0}
        distance={10}
      />

      {/* ===== 1. CONTINUOUS EXTENDED COASTAL TERRAIN (SRIHARIKOTA BARRIER ISLAND) ===== */}
      <mesh position={[0, -1.35, -20]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[260, 200, 32, 32]} />
        <meshStandardMaterial
          map={terrainTextures.diffuse}
          bumpMap={terrainTextures.bump}
          bumpScale={0.045}
          roughness={0.88}
          metalness={0.08}
        />
      </mesh>

      {/* Bay of Bengal Ocean Water Surface along Eastern Horizon */}
      <mesh position={[42, -1.34, -20]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 200]} />
        <meshStandardMaterial
          color="#06182c"
          roughness={0.12}
          metalness={0.75}
          transparent={true}
          opacity={0.85}
        />
      </mesh>

      {/* ===== 1B. 3D SRIHARIKOTA COASTAL CASUARINA TREELINE ON THE HORIZON ===== */}
      <group position={[0, -1.35, 0]}>
        {horizonForest.map((tree) => {
          const mat =
            tree.matVariant === 0
              ? materials.forestCanopyDeep
              : tree.matVariant === 1
              ? materials.forestCanopyMid
              : materials.forestCanopyLight;
          return (
            <group key={tree.key} position={[tree.x, 0, tree.z]}>
              {/* Slender Weathered Pine Trunk */}
              <mesh position={[0, tree.height * 0.25, 0]} material={materials.treeBark}>
                <cylinderGeometry args={[0.04, 0.08, tree.height * 0.5, 6]} />
              </mesh>
              {/* Lower Tier Canopy Cone */}
              <mesh position={[0, tree.height * 0.45, 0]} material={mat}>
                <coneGeometry args={[tree.radius * 1.05, tree.height * 0.55, 7]} />
              </mesh>
              {/* Middle Tier Canopy Cone */}
              <mesh position={[0, tree.height * 0.70, 0]} material={mat}>
                <coneGeometry args={[tree.radius * 0.82, tree.height * 0.50, 7]} />
              </mesh>
              {/* Top Canopy Spire */}
              <mesh position={[0, tree.height * 0.92, 0]} material={materials.forestCanopyLight}>
                <coneGeometry args={[tree.radius * 0.55, tree.height * 0.42, 6]} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ===== 1C. SPACEPORT PERIMETER SECURITY FLOODLIGHT MASTS ===== */}
      <group position={[0, -1.35, 0]}>
        {perimeterLights.map((light, idx) => (
          <group key={`perim-light-${idx}`} position={[light.x, 0, light.z]}>
            {/* Concrete Anchor Base */}
            <mesh position={[0, 0.1, 0]} material={materials.concretePad}>
              <cylinderGeometry args={[0.12, 0.16, 0.20, 8]} />
            </mesh>
            {/* Slender Steel Stanchion Pole */}
            <mesh position={[0, 1.25, 0]} material={materials.towerSteel}>
              <cylinderGeometry args={[0.02, 0.035, 2.3, 8]} />
            </mesh>
            {/* Horizontal Lamp Fixture */}
            <mesh position={[0, 2.4, 0]} material={materials.towerSteel}>
              <boxGeometry args={[0.22, 0.04, 0.06]} />
            </mesh>
            <mesh position={[0, 2.38, 0]} material={materials.floodlightGlow}>
              <boxGeometry args={[0.18, 0.015, 0.04]} />
            </mesh>
            {/* Red Obstruction Beacon */}
            <mesh position={[0, 2.46, 0]} material={materials.beaconRed}>
              <sphereGeometry args={[0.025, 6, 6]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ===== 2. CONCRETE LAUNCH APRON BASE, RAIL SYSTEM & FLAME TRENCH ===== */}
      {/* Heavy Reinforced Circular Launch Apron Slab (SDSC SHAR Second Launch Pad) */}
      <mesh position={[0, -1.26, 0]} material={materials.concretePad}>
        <cylinderGeometry args={[2.8, 3.2, 0.18, 48]} />
      </mesh>

      {/* Flame Exhaust Trench Channel (Trough directing supersonic blast to flumes) */}
      <mesh position={[0, -1.40, 0]} material={materials.concreteBase}>
        <boxGeometry args={[1.20, 0.28, 2.6]} />
      </mesh>

      {/* Dual Heavy Broad-Gauge Railway Tracks on the Launch Apron */}
      {/* Left Pair of Rails (Track for Port Pedestal Bogies) */}
      <mesh position={[-0.76, -1.16, 0]} material={materials.towerSteel}>
        <boxGeometry args={[0.016, 0.024, 4.4]} />
      </mesh>
      <mesh position={[-0.64, -1.16, 0]} material={materials.towerSteel}>
        <boxGeometry args={[0.016, 0.024, 4.4]} />
      </mesh>
      {/* Right Pair of Rails (Track for Starboard Pedestal Bogies) */}
      <mesh position={[0.64, -1.16, 0]} material={materials.towerSteel}>
        <boxGeometry args={[0.016, 0.024, 4.4]} />
      </mesh>
      <mesh position={[0.76, -1.16, 0]} material={materials.towerSteel}>
        <boxGeometry args={[0.016, 0.024, 4.4]} />
      </mesh>

      {/* Concrete Railway Sleepers / Ties along Tracks */}
      {[-1.8, -1.4, -1.0, -0.6, -0.2, 0.2, 0.6, 1.0, 1.4, 1.8].map((tz, tIdx) => (
        <group key={`sleeper-${tIdx}`} position={[0, -1.175, tz]}>
          <mesh position={[-0.70, 0, 0]} material={materials.concreteBase}>
            <boxGeometry args={[0.22, 0.016, 0.06]} />
          </mesh>
          <mesh position={[0.70, 0, 0]} material={materials.concreteBase}>
            <boxGeometry args={[0.22, 0.016, 0.06]} />
          </mesh>
        </group>
      ))}

      {/* Inverted-V Heavy Steel Flame Deflector Wedges Directly Below S200 Booster Wells */}
      {/* Left Booster Deflector Wedges */}
      <mesh position={[-0.2204, -1.34, 0.35]} rotation={[-0.5, 0, 0]} material={materials.deflectorSteel}>
        <boxGeometry args={[0.26, 0.08, 0.7]} />
      </mesh>
      <mesh position={[-0.2204, -1.34, -0.35]} rotation={[0.5, 0, 0]} material={materials.deflectorSteel}>
        <boxGeometry args={[0.26, 0.08, 0.7]} />
      </mesh>
      {/* Right Booster Deflector Wedges */}
      <mesh position={[0.2204, -1.34, 0.35]} rotation={[-0.5, 0, 0]} material={materials.deflectorSteel}>
        <boxGeometry args={[0.26, 0.08, 0.7]} />
      </mesh>
      <mesh position={[0.2204, -1.34, -0.35]} rotation={[0.5, 0, 0]} material={materials.deflectorSteel}>
        <boxGeometry args={[0.26, 0.08, 0.7]} />
      </mesh>

      {/* ===== 3. MOBILE LAUNCH PEDESTAL (MLP) ===== */}
      {/* Deck top surface at y = -0.72; Bottom of deck at y = -1.06; Height = 0.34 */}
      <group position={[0, -0.89, 0]}>
        {/* Outboard Left Steel Deck Wing */}
        <mesh position={[-0.60, 0, 0]} material={materials.mlpSteel}>
          <boxGeometry args={[0.64, 0.34, 1.70]} />
        </mesh>
        {/* Outboard Right Steel Deck Wing */}
        <mesh position={[0.60, 0, 0]} material={materials.mlpSteel}>
          <boxGeometry args={[0.64, 0.34, 1.70]} />
        </mesh>
        {/* Front Transverse Perimeter Girder */}
        <mesh position={[0, 0, 0.60]} material={materials.mlpSteel}>
          <boxGeometry args={[1.84, 0.34, 0.50]} />
        </mesh>
        {/* Rear Transverse Perimeter Girder */}
        <mesh position={[0, 0, -0.60]} material={materials.mlpSteel}>
          <boxGeometry args={[1.84, 0.34, 0.50]} />
        </mesh>
        {/* Inter-Booster Structural Deck Dividers */}
        <mesh position={[-0.095, 0, 0]} material={materials.mlpSteel}>
          <boxGeometry args={[0.03, 0.34, 0.70]} />
        </mesh>
        <mesh position={[0.095, 0, 0]} material={materials.mlpSteel}>
          <boxGeometry args={[0.03, 0.34, 0.70]} />
        </mesh>

        {/* Concrete Pedestal Front Skirt Wall with SDSC SHAR Identification */}
        <mesh position={[0, 0, 0.86]} material={materials.mlpConcreteWall}>
          <boxGeometry args={[1.82, 0.32, 0.03]} />
        </mesh>

        {/* Indian Tricolor Emblem Badge on Pedestal Front */}
        <group position={[0, 0.02, 0.88]}>
          <mesh position={[0, 0.028, 0]} material={materials.saffronBand}>
            <planeGeometry args={[0.60, 0.024]} />
          </mesh>
          <mesh position={[0, 0, 0]} material={materials.whiteBand}>
            <planeGeometry args={[0.60, 0.024]} />
          </mesh>
          <mesh position={[0, -0.028, 0]} material={materials.greenBand}>
            <planeGeometry args={[0.60, 0.024]} />
          </mesh>
        </group>

        {/* Ceramic Refractory Blast Well Linings (Interior Thermal Protection) */}
        {/* Left S200 Booster Well Opening (x = -0.2204) */}
        <mesh position={[-0.2204, 0, 0]} material={materials.flameTrenchLining}>
          <boxGeometry args={[0.22, 0.35, 0.30]} />
        </mesh>
        {/* Right S200 Booster Well Opening (x = +0.2204) */}
        <mesh position={[0.2204, 0, 0]} material={materials.flameTrenchLining}>
          <boxGeometry args={[0.22, 0.35, 0.30]} />
        </mesh>
        {/* Central L110 Core Engine Well Opening (x = 0) */}
        <mesh position={[0, 0, 0]} material={materials.flameTrenchLining}>
          <boxGeometry args={[0.15, 0.35, 0.22]} />
        </mesh>

        {/* 4 SOLID ROCKET BOOSTER HOLD-DOWN POSTS */}
        {/* Positioned directly under S200 Booster aft skirts at x = -0.2204 and +0.2204; Tops meet skirt at y = -0.62 */}
        {/* Left Booster Hold-Down Posts */}
        {[-0.065, 0.065].map((offZ, idx) => (
          <group key={`hdp-left-${idx}`} position={[-0.2204, 0.17, offZ]}>
            {/* Structural Steel Base Column */}
            <mesh position={[0, 0.03, 0]} material={materials.holdDownSteel}>
              <cylinderGeometry args={[0.032, 0.045, 0.06, 8]} />
            </mesh>
            {/* Clamping Explosive-Bolt Shoe (Safety Yellow, flush to booster skirt) */}
            <mesh position={[0, 0.075, 0]} material={materials.craneYellow}>
              <boxGeometry args={[0.05, 0.035, 0.045]} />
            </mesh>
          </group>
        ))}

        {/* Right Booster Hold-Down Posts */}
        {[-0.065, 0.065].map((offZ, idx) => (
          <group key={`hdp-right-${idx}`} position={[0.2204, 0.17, offZ]}>
            <mesh position={[0, 0.03, 0]} material={materials.holdDownSteel}>
              <cylinderGeometry args={[0.032, 0.045, 0.06, 8]} />
            </mesh>
            <mesh position={[0, 0.075, 0]} material={materials.craneYellow}>
              <boxGeometry args={[0.05, 0.035, 0.045]} />
            </mesh>
          </group>
        ))}

        {/* Acoustic Sound Suppression Deluge Toroidal Water Manifolds (Encircling S200 Booster Blast Wells) */}
        <group position={[-0.2204, 0.175, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.delugeRed}>
            <torusGeometry args={[0.13, 0.012, 10, 24]} />
          </mesh>
        </group>
        <group position={[0.2204, 0.175, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.delugeRed}>
            <torusGeometry args={[0.13, 0.012, 10, 24]} />
          </mesh>
        </group>

        {/* Deluge Rainbird Nozzles (Angled inward directly into the booster blast wells) */}
        {[
          { x: -0.30, z: -0.07, rotY: 0.6 },
          { x: -0.30, z: 0.07, rotY: -0.6 },
          { x: -0.14, z: -0.07, rotY: 2.5 },
          { x: -0.14, z: 0.07, rotY: -2.5 },
          { x: 0.14, z: -0.07, rotY: 0.6 },
          { x: 0.14, z: 0.07, rotY: -0.6 },
          { x: 0.30, z: -0.07, rotY: 2.5 },
          { x: 0.30, z: 0.07, rotY: -2.5 },
        ].map((rb, idx) => (
          <group key={`rainbird-${idx}`} position={[rb.x, 0.17, rb.z]} rotation={[0, rb.rotY, 0]}>
            <mesh position={[0, 0.04, 0]} material={materials.delugeRed}>
              <cylinderGeometry args={[0.012, 0.016, 0.08, 8]} />
            </mesh>
            <mesh position={[0, 0.08, 0.02]} rotation={[-0.45, 0, 0]} material={materials.towerSteel}>
              <cylinderGeometry args={[0.014, 0.010, 0.05, 8]} />
            </mesh>
          </group>
        ))}

        {/* Yellow Double-Tier Safety Handrails along MLP Deck Perimeter */}
        {/* Front & Rear Handrails */}
        {[-0.84, 0.84].map((zPos, sIdx) => (
          <group key={`mlp-rail-ns-${sIdx}`} position={[0, 0.17, zPos]}>
            <mesh position={[0, 0.11, 0]} material={materials.handrailYellow}>
              <boxGeometry args={[1.80, 0.012, 0.012]} />
            </mesh>
            <mesh position={[0, 0.05, 0]} material={materials.handrailYellow}>
              <boxGeometry args={[1.80, 0.010, 0.010]} />
            </mesh>
            {[-0.80, -0.48, -0.16, 0.16, 0.48, 0.80].map((xSt, pIdx) => (
              <mesh key={`post-${pIdx}`} position={[xSt, 0.055, 0]} material={materials.handrailYellow}>
                <cylinderGeometry args={[0.007, 0.007, 0.11, 6]} />
              </mesh>
            ))}
          </group>
        ))}

        {/* Left & Right Side Handrails */}
        {[-0.90, 0.90].map((xPos, sIdx) => (
          <group key={`mlp-rail-ew-${sIdx}`} position={[xPos, 0.17, 0]}>
            <mesh position={[0, 0.11, 0]} material={materials.handrailYellow}>
              <boxGeometry args={[0.012, 0.012, 1.66]} />
            </mesh>
            <mesh position={[0, 0.05, 0]} material={materials.handrailYellow}>
              <boxGeometry args={[0.010, 0.010, 1.66]} />
            </mesh>
            {[-0.72, -0.36, 0.0, 0.36, 0.72].map((zSt, pIdx) => (
              <mesh key={`post-${pIdx}`} position={[0, 0.055, zSt]} material={materials.handrailYellow}>
                <cylinderGeometry args={[0.007, 0.007, 0.11, 6]} />
              </mesh>
            ))}
          </group>
        ))}

        {/* Heavy Steel Rail Bogie Wheel Sets at 4 Corners of the MLP */}
        {[-0.70, 0.70].map((bx, i) =>
          [-0.55, 0.55].map((bz, j) => (
            <group key={`bogie-${i}-${j}`} position={[bx, -0.22, bz]}>
              <mesh material={materials.towerSteel}>
                <boxGeometry args={[0.16, 0.08, 0.28]} />
              </mesh>
              {[-0.08, 0.08].map((wz, k) => (
                <mesh key={`wheel-${k}`} position={[0, -0.05, wz]} rotation={[0, 0, Math.PI / 2]} material={materials.towerAccent}>
                  <cylinderGeometry args={[0.045, 0.045, 0.20, 12]} />
                </mesh>
              ))}
            </group>
          ))
        )}
      </group>

      {/* ===== 4. FRONT LAUNCHPAD INSTRUMENTATION & FLOODLIGHT PYLONS ===== */}
      {/* Symmetrical camera & floodlight towers in the foreground illuminating the launch vehicle */}
      {[-1.20, 1.20].map((px, idx) => (
        <group key={`pylon-${idx}`} position={[px, -1.35, 1.35]}>
          {/* Concrete Pedestal Column */}
          <mesh position={[0, 0.20, 0]} material={materials.pylonConcrete}>
            <cylinderGeometry args={[0.12, 0.16, 0.40, 10]} />
          </mesh>
          {/* Pylon Equipment Base Deck */}
          <mesh position={[0, 0.42, 0]} material={materials.towerSteel}>
            <boxGeometry args={[0.30, 0.03, 0.30]} />
          </mesh>
          {/* Platform Safety Railings */}
          <mesh position={[0, 0.50, 0.14]} material={materials.handrailYellow}>
            <boxGeometry args={[0.30, 0.010, 0.010]} />
          </mesh>
          <mesh position={[0, 0.50, -0.14]} material={materials.handrailYellow}>
            <boxGeometry args={[0.30, 0.010, 0.010]} />
          </mesh>
          {/* High-Intensity Quad Halogen Floodlights Aimed Upward at Rocket */}
          <group position={[0, 0.54, 0]} rotation={[-0.45, idx === 0 ? 0.35 : -0.35, 0]}>
            <mesh material={materials.towerSteel}>
              <boxGeometry args={[0.26, 0.11, 0.08]} />
            </mesh>
            {[-0.08, 0.08].map((lx, lIdx) =>
              [-0.025, 0.025].map((ly, lyIdx) => (
                <mesh key={`pylon-lamp-${lIdx}-${lyIdx}`} position={[lx, ly, 0.045]} material={materials.floodlightGlow}>
                  <boxGeometry args={[0.07, 0.035, 0.015]} />
                </mesh>
              ))
            )}
          </group>
        </group>
      ))}

      {/* ===== 5. 3D VOLUMETRIC BILLOWING LAUNCH SMOKE & DELUGE STEAM PLUME ===== */}
      <group ref={delugeSteamGroup} position={[0, -1.25, 0]} visible={false}>
        {launchSmokeClouds.map((cloud, idx) => (
          <mesh
            key={`smoke-cloud-${idx}`}
            position={[cloud.x, cloud.y, cloud.z]}
            scale={[cloud.baseScale, cloud.baseScale, 1]}
          >
            <planeGeometry args={[1.0, 1.0]} />
            <primitive object={cloud.isFire ? materials.fireSmokeMat : materials.delugeSteamMat} attach="material" />
          </mesh>
        ))}
      </group>

      {/* ===== 6. TWO ICONIC SDSC SHAR SYMMETRICAL LIGHTNING TOWERS ===== */}
      {/* Left Tower framing the launch vista symmetrically */}
      {renderSDSCSharTower('shar-tower-left', -2.10, -0.35)}

      {/* Right Tower framing the launch vista symmetrically */}
      {renderSDSCSharTower('shar-tower-right', 2.10, -0.35)}

      {/* ===== 7. SDSC SHAR UMBILICAL TOWER & 4-TIERED CANTILEVER SERVICE GANTRY WINGS ===== */}
      {/* Positioned directly behind the rocket at z = -0.65, extending orange gantry wings to both sides */}
      <group position={[0, 0.65, -0.65]}>
        {/* Central Vertical Lattice Tower Core (rising from ground y = -1.18 to y = 2.45) */}
        {[-0.14, 0.14].map((cx, i) =>
          [-0.14, 0.14].map((cz, j) => (
            <mesh key={`ut-col-${i}-${j}`} position={[cx, -0.01, cz]} material={materials.towerSteel}>
              <cylinderGeometry args={[0.018, 0.018, 3.63, 8]} />
            </mesh>
          ))
        )}

        {/* 9 Horizontal Tower Floor Platforms */}
        {[-1.6, -1.2, -0.8, -0.4, 0.0, 0.4, 0.8, 1.2, 1.6].map((y, idx) => (
          <group key={`ut-ring-${idx}`} position={[0, y, 0]}>
            <mesh position={[0, 0, 0.14]} material={materials.towerSteel}>
              <boxGeometry args={[0.30, 0.022, 0.022]} />
            </mesh>
            <mesh position={[0, 0, -0.14]} material={materials.towerSteel}>
              <boxGeometry args={[0.30, 0.022, 0.022]} />
            </mesh>
            <mesh position={[-0.14, 0, 0]} material={materials.towerSteel}>
              <boxGeometry args={[0.022, 0.022, 0.28]} />
            </mesh>
            <mesh position={[0.14, 0, 0]} material={materials.towerSteel}>
              <boxGeometry args={[0.022, 0.022, 0.28]} />
            </mesh>
            <mesh position={[0, -0.008, 0]} material={materials.towerAccent}>
              <boxGeometry args={[0.26, 0.010, 0.26]} />
            </mesh>
          </group>
        ))}

        {/* Diagonal Cross-Braces in Tower Core */}
        {[-1.4, -1.0, -0.6, -0.2, 0.2, 0.6, 1.0, 1.4].map((y, idx) => (
          <group key={`ut-diag-${idx}`} position={[0, y, 0]}>
            <mesh position={[0, 0, -0.14]} rotation={[0, 0, 0.85]} material={materials.towerAccent}>
              <boxGeometry args={[0.38, 0.014, 0.014]} />
            </mesh>
            <mesh position={[0, 0, -0.14]} rotation={[0, 0, -0.85]} material={materials.towerAccent}>
              <boxGeometry args={[0.38, 0.014, 0.014]} />
            </mesh>
          </group>
        ))}

        {/* --- 4-TIERED CANTILEVER SERVICE GANTRY WINGS (ISRO Safety Orange) --- */}
        {/* Symmetrical Left Gantry Wing (Swings back upon lift-off) */}
        <group ref={umbilicalGantryLeft} position={[-0.14, 0, 0.14]}>
          {[
            { y: -1.15, spanX: 0.32, reachZ: 0.48 }, // Tier 1: Booster Aft Skirt Access
            { y: -0.65, spanX: 0.30, reachZ: 0.46 }, // Tier 2: Booster Mid & Core Propellant Fill
            { y: -0.10, spanX: 0.28, reachZ: 0.44 }, // Tier 3: Core Interstage Umbilical
            { y: 0.50, spanX: 0.26, reachZ: 0.40 },  // Tier 4: C25 Cryogenic / Fairing Service
          ].map((tier, tIdx) => {
            const h = 0.08;
            return (
              <group key={`gantry-left-tier-${tIdx}`} position={[0, tier.y, 0]}>
                {/* Upper Safety Orange Steel Chords */}
                <mesh position={[-tier.spanX / 2, h / 2, tier.reachZ / 2]} material={materials.gantryOrange}>
                  <boxGeometry args={[tier.spanX, 0.015, 0.015]} />
                </mesh>
                <mesh position={[-tier.spanX, h / 2, tier.reachZ / 2]} material={materials.gantryOrange}>
                  <boxGeometry args={[0.015, 0.015, tier.reachZ]} />
                </mesh>
                {/* Lower Safety Orange Steel Chords */}
                <mesh position={[-tier.spanX / 2, -h / 2, tier.reachZ / 2]} material={materials.gantryOrange}>
                  <boxGeometry args={[tier.spanX, 0.015, 0.015]} />
                </mesh>
                <mesh position={[-tier.spanX, -h / 2, tier.reachZ / 2]} material={materials.gantryOrange}>
                  <boxGeometry args={[0.015, 0.015, tier.reachZ]} />
                </mesh>
                {/* Vertical Uprights */}
                <mesh position={[-tier.spanX, 0, tier.reachZ]} material={materials.gantryOrange}>
                  <boxGeometry args={[0.015, h, 0.015]} />
                </mesh>
                {/* Walking Grating */}
                <mesh position={[-tier.spanX / 2, h / 2 + 0.005, tier.reachZ / 2]} material={materials.craneYellow}>
                  <boxGeometry args={[tier.spanX, 0.008, tier.reachZ * 0.9]} />
                </mesh>
                {/* Safety Handrail */}
                <mesh position={[-tier.spanX, h / 2 + 0.08, tier.reachZ / 2]} material={materials.handrailYellow}>
                  <boxGeometry args={[0.010, 0.010, tier.reachZ]} />
                </mesh>
                {/* Flexible Cryogenic Umbilical Service Line (Reaches directly into Rocket Disconnect Plate) */}
                <mesh position={[-tier.spanX * 0.45, -0.02, tier.reachZ * 0.95]} rotation={[0.3, 0, 0.4]} material={materials.towerAccent}>
                  <cylinderGeometry args={[0.010, 0.010, 0.16, 8]} />
                </mesh>
              </group>
            );
          })}
        </group>

        {/* Symmetrical Right Gantry Wing (Swings back upon lift-off) */}
        <group ref={umbilicalGantryRight} position={[0.14, 0, 0.14]}>
          {[
            { y: -1.15, spanX: 0.32, reachZ: 0.48 }, // Tier 1: Booster Aft Skirt Access
            { y: -0.65, spanX: 0.30, reachZ: 0.46 }, // Tier 2: Booster Mid & Core Propellant Fill
            { y: -0.10, spanX: 0.28, reachZ: 0.44 }, // Tier 3: Core Interstage Umbilical
            { y: 0.50, spanX: 0.26, reachZ: 0.40 },  // Tier 4: C25 Cryogenic / Fairing Service
          ].map((tier, tIdx) => {
            const h = 0.08;
            return (
              <group key={`gantry-right-tier-${tIdx}`} position={[0, tier.y, 0]}>
                {/* Upper Safety Orange Steel Chords */}
                <mesh position={[tier.spanX / 2, h / 2, tier.reachZ / 2]} material={materials.gantryOrange}>
                  <boxGeometry args={[tier.spanX, 0.015, 0.015]} />
                </mesh>
                <mesh position={[tier.spanX, h / 2, tier.reachZ / 2]} material={materials.gantryOrange}>
                  <boxGeometry args={[0.015, 0.015, tier.reachZ]} />
                </mesh>
                {/* Lower Safety Orange Steel Chords */}
                <mesh position={[tier.spanX / 2, -h / 2, tier.reachZ / 2]} material={materials.gantryOrange}>
                  <boxGeometry args={[tier.spanX, 0.015, 0.015]} />
                </mesh>
                <mesh position={[tier.spanX, -h / 2, tier.reachZ / 2]} material={materials.gantryOrange}>
                  <boxGeometry args={[0.015, 0.015, tier.reachZ]} />
                </mesh>
                {/* Vertical Uprights */}
                <mesh position={[tier.spanX, 0, tier.reachZ]} material={materials.gantryOrange}>
                  <boxGeometry args={[0.015, h, 0.015]} />
                </mesh>
                {/* Walking Grating */}
                <mesh position={[tier.spanX / 2, h / 2 + 0.005, tier.reachZ / 2]} material={materials.craneYellow}>
                  <boxGeometry args={[tier.spanX, 0.008, tier.reachZ * 0.9]} />
                </mesh>
                {/* Safety Handrail */}
                <mesh position={[tier.spanX, h / 2 + 0.08, tier.reachZ / 2]} material={materials.handrailYellow}>
                  <boxGeometry args={[0.010, 0.010, tier.reachZ]} />
                </mesh>
                {/* Flexible Cryogenic Umbilical Service Line (Reaches directly into Rocket Disconnect Plate) */}
                <mesh position={[tier.spanX * 0.45, -0.02, tier.reachZ * 0.95]} rotation={[0.3, 0, -0.4]} material={materials.towerAccent}>
                  <cylinderGeometry args={[0.010, 0.010, 0.16, 8]} />
                </mesh>
              </group>
            );
          })}
        </group>

        {/* Top Heavy Hammerhead Service Crane (Cantilever Jib over Rocket Nose) */}
        <group position={[0, 1.82, 0]}>
          <mesh position={[0, 0.02, 0]} material={materials.towerSteel}>
            <cylinderGeometry args={[0.12, 0.14, 0.04, 12]} />
          </mesh>
          <mesh position={[0.12, 0.10, 0]} material={materials.towerSteel}>
            <boxGeometry args={[0.16, 0.14, 0.12]} />
          </mesh>
          {/* Rear Counterweight Block */}
          <mesh position={[0.26, 0.10, 0]} material={materials.concretePad}>
            <boxGeometry args={[0.14, 0.12, 0.14]} />
          </mesh>
          {/* Forward Angled Cantilever Jib Boom reaching over Rocket Fairing */}
          <mesh position={[-0.15, 0.12, 0.28]} rotation={[0, -0.3, 0.04]} material={materials.craneYellow}>
            <boxGeometry args={[0.65, 0.05, 0.05]} />
          </mesh>
        </group>

        {/* Indian Flag Emblem on Launch Umbilical Tower */}
        <group position={[0.15, 1.40, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[0, 0.06, 0]} material={materials.saffronBand}>
            <planeGeometry args={[0.28, 0.04]} />
          </mesh>
          <mesh position={[0, 0, 0]} material={materials.whiteBand}>
            <planeGeometry args={[0.28, 0.04]} />
          </mesh>
          <mesh position={[0, -0.06, 0]} material={materials.greenBand}>
            <planeGeometry args={[0.28, 0.04]} />
          </mesh>
        </group>

        {/* Alternating Red and White Aviation Obstacle Lightning Mast */}
        <group position={[0, 2.05, 0]}>
          {[
            { y: -0.20, mat: materials.mastWhite },
            { y: -0.10, mat: materials.mastRed },
            { y: 0.00, mat: materials.mastWhite },
            { y: 0.10, mat: materials.mastRed },
            { y: 0.20, mat: materials.mastWhite },
          ].map((seg, idx) => (
            <mesh key={`mast-seg-${idx}`} position={[0, seg.y, 0]} material={seg.mat}>
              <cylinderGeometry args={[0.010, 0.014, 0.10, 8]} />
            </mesh>
          ))}
          <mesh position={[0, 0.30, 0]} material={materials.cryoPipeSilver}>
            <cylinderGeometry args={[0.003, 0.008, 0.12, 8]} />
          </mesh>
          <mesh position={[0, 0.38, 0]} material={materials.beaconRed}>
            <sphereGeometry args={[0.045, 8, 8]} />
          </mesh>
        </group>
      </group>

      {/* ===== 8. TROPICAL CASUARINA COASTAL FORESTRY (AUTHENTIC CORNER SILHOUETTE FRAMING) ===== */}
      {/* Tucked into outer corners, scaled down, darkened into atmospheric silhouettes */}
      {/* Bottom-Left Natural Foliage Silhouette */}
      <group position={[-3.6, -1.60, 2.4]} scale={[0.52, 0.52, 0.52]}>
        {/* Slender Weathered Casuarina Trunks */}
        <mesh position={[0, 0.35, 0]} material={materials.treeBark}>
          <cylinderGeometry args={[0.05, 0.09, 0.75, 8]} />
        </mesh>
        <mesh position={[0.25, 0.30, 0.1]} rotation={[0, 0, -0.15]} material={materials.treeBark}>
          <cylinderGeometry args={[0.04, 0.07, 0.65, 8]} />
        </mesh>
        {/* Layered Organic Foliage Crowns */}
        {[
          { x: 0.00, y: 0.65, z: 0.00, sx: 0.52, sy: 0.45, sz: 0.52, mat: materials.forestCanopyDeep },
          { x: -0.18, y: 0.55, z: 0.14, sx: 0.42, sy: 0.38, sz: 0.42, mat: materials.tropicalFoliage },
          { x: 0.22, y: 0.58, z: -0.10, sx: 0.46, sy: 0.40, sz: 0.46, mat: materials.forestCanopyMid },
          { x: 0.05, y: 0.85, z: 0.02, sx: 0.36, sy: 0.35, sz: 0.36, mat: materials.forestCanopyLight },
          { x: -0.28, y: 0.40, z: -0.12, sx: 0.34, sy: 0.28, sz: 0.34, mat: materials.foliageHighlight },
        ].map((crown, idx) => (
          <mesh key={`tree-l-${idx}`} position={[crown.x, crown.y, crown.z]} scale={[crown.sx, crown.sy, crown.sz]} material={crown.mat}>
            <sphereGeometry args={[1.0, 14, 12]} />
          </mesh>
        ))}
      </group>

      {/* Bottom-Right Natural Foliage Silhouette */}
      <group position={[3.6, -1.60, 2.4]} scale={[0.52, 0.52, 0.52]}>
        {/* Slender Weathered Casuarina Trunks */}
        <mesh position={[0, 0.35, 0]} material={materials.treeBark}>
          <cylinderGeometry args={[0.05, 0.09, 0.75, 8]} />
        </mesh>
        <mesh position={[-0.22, 0.30, 0.1]} rotation={[0, 0, 0.15]} material={materials.treeBark}>
          <cylinderGeometry args={[0.04, 0.07, 0.65, 8]} />
        </mesh>
        {/* Layered Organic Foliage Crowns */}
        {[
          { x: 0.00, y: 0.65, z: 0.00, sx: 0.52, sy: 0.45, sz: 0.52, mat: materials.forestCanopyDeep },
          { x: 0.18, y: 0.55, z: 0.14, sx: 0.42, sy: 0.38, sz: 0.42, mat: materials.tropicalFoliage },
          { x: -0.20, y: 0.58, z: -0.10, sx: 0.46, sy: 0.40, sz: 0.46, mat: materials.forestCanopyMid },
          { x: -0.05, y: 0.85, z: 0.02, sx: 0.36, sy: 0.35, sz: 0.36, mat: materials.forestCanopyLight },
          { x: 0.25, y: 0.40, z: -0.12, sx: 0.34, sy: 0.28, sz: 0.34, mat: materials.foliageHighlight },
        ].map((crown, idx) => (
          <mesh key={`tree-r-${idx}`} position={[crown.x, crown.y, crown.z]} scale={[crown.sx, crown.sy, crown.sz]} material={crown.mat}>
            <sphereGeometry args={[1.0, 14, 12]} />
          </mesh>
        ))}
      </group>

      {/* ===== MORNING SUNRISE GOD-RAYS (Filtering through the Umbilical Gantry) ===== */}
      <mesh position={[1.8, 2.4, -2.0]} rotation={[0.42, 0.35, -0.68]}>
        <cylinderGeometry args={[0.6, 3.2, 7.5, 16, 1, true]} />
        <meshBasicMaterial
          color={STAGE_CONFIG.stage00_launchPad.sunColor}
          transparent
          opacity={0.055}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ===== CRYOGENIC LH2/LOX BOIL-OFF VAPOUR WISPS ===== */}
      <group ref={cryoVapourGroup} position={[0, 0, 0]}>
        {[...Array(8)].map((_, i) => (
          <mesh key={`cryo-wisp-${i}`} position={[0.14, 1.25, -0.45]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial
              map={smokePuffTexture}
              transparent
              opacity={0.35}
              depthWrite={false}
              blending={THREE.NormalBlending}
            />
          </mesh>
        ))}
      </group>

      {/* ===== INDUSTRIAL DECK PERIMETER LIGHTING ===== */}
      {[
        { x: -0.88, z: -0.78 },
        { x: 0.88, z: -0.78 },
        { x: -0.88, z: 0.78 },
        { x: 0.88, z: 0.78 },
      ].map((pt, i) => (
        <group key={`pad-flood-${i}`} position={[pt.x, 0.35, pt.z]}>
          <mesh material={materials.towerSteel}>
            <cylinderGeometry args={[0.015, 0.02, 0.06, 6]} />
          </mesh>
          <mesh position={[0, 0.04, 0]} material={materials.floodlightGlow}>
            <sphereGeometry args={[0.035, 8, 8]} />
          </mesh>
        </group>
      ))}

      {/* ===== 9. DEEP BACKGROUND CRYOGENIC PROPELLANT TANKS (SAFE STAND-OFF DISTANCE) ===== */}
      <group position={[-5.5, -1.35, -12.0]} scale={[0.65, 0.65, 0.65]}>
        {/* Concrete Foundation Cradle */}
        <mesh position={[0, 0.14, 0]} material={materials.concretePad}>
          <boxGeometry args={[2.4, 0.28, 2.4]} />
        </mesh>
        {/* Steel Saddle Legs */}
        {[-0.75, 0.75].map((lx, i) =>
          [-0.75, 0.75].map((lz, j) => (
            <mesh key={`saddle-bg-${i}-${j}`} position={[lx, 0.65, lz]} material={materials.towerSteel}>
              <cylinderGeometry args={[0.05, 0.06, 1.0, 8]} />
            </mesh>
          ))
        )}
        {/* Insulated Storage Sphere */}
        <mesh position={[0, 1.45, 0]} material={materials.cryoTankWhite}>
          <sphereGeometry args={[1.2, 28, 28]} />
        </mesh>
        <mesh position={[0, 1.45, 0]} rotation={[-Math.PI / 2, 0, 0]} material={materials.towerSteel}>
          <ringGeometry args={[1.22, 1.35, 28]} />
        </mesh>
        <mesh position={[0.5, 2.75, 0]} material={materials.cryoPipeSilver}>
          <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
        </mesh>

        {/* Secondary LOX Sphere */}
        <group position={[-2.4, 0, 1.5]} scale={[0.8, 0.8, 0.8]}>
          <mesh position={[0, 0.12, 0]} material={materials.concretePad}>
            <boxGeometry args={[1.8, 0.24, 1.8]} />
          </mesh>
          <mesh position={[0, 1.2, 0]} material={materials.cryoTankWhite}>
            <sphereGeometry args={[0.9, 24, 24]} />
          </mesh>
          <mesh position={[0.4, 2.15, 0]} material={materials.cryoPipeSilver}>
            <cylinderGeometry args={[0.025, 0.025, 0.9, 8]} />
          </mesh>
        </group>
      </group>
    </group>
  );
};
