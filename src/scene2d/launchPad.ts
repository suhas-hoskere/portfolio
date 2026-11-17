import {
  type Scene2DFrameContext,
  clamp,
  easeOutCubic,
  smoothstep,
  mulberry32,
} from './types';
import { getLaunchPadDropPx } from './sriharikotaTerrain';

interface VolumetricSmokePuff {
  dirX: -1 | 1;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  baseR: number;
  rot: number;
  rotSpeed: number;
}

interface LiveSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
}

interface CryoMist {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  r: number;
}

let cachedSmokeLightSprite: HTMLCanvasElement | null = null;
let cachedSmokeDarkSprite: HTMLCanvasElement | null = null;
let steamPool: VolumetricSmokePuff[] | null = null;
let sparkPool: LiveSpark[] | null = null;
let cryoPool: CryoMist[] | null = null;

/**
 * Pre-renders 2 volumetric organic monochrome smoke puff sprites ONCE (< 160 KB RAM total):
 * - Bright incandescent-lit white billowing smoke (near rocket flame trench & sunlit tops)
 * - Moody silver-graphite shadowed billowing exhaust cloud (outer turbulent billows)
 */
function getSmokeSprites(): {
  bright: HTMLCanvasElement;
  shadow: HTMLCanvasElement;
} {
  if (cachedSmokeLightSprite && cachedSmokeDarkSprite) {
    return { bright: cachedSmokeLightSprite, shadow: cachedSmokeDarkSprite };
  }

  const buildPuff = (brightCore: boolean): HTMLCanvasElement => {
    const size = 140;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const cx = size * 0.5;
    const cy = size * 0.5;

    // Multi-lobed organic billowing cloud geometry (no soap-bubble outlines!)
    const lobes = [
      { dx: -16, dy: 8, r: 34, shade: brightCore ? 215 : 130, a: 0.42 },
      { dx: 18, dy: 10, r: 32, shade: brightCore ? 225 : 145, a: 0.40 },
      { dx: -6, dy: -14, r: 36, shade: brightCore ? 245 : 175, a: 0.50 },
      { dx: 12, dy: -10, r: 34, shade: brightCore ? 255 : 195, a: 0.52 },
      { dx: 0, dy: 2, r: 42, shade: brightCore ? 240 : 160, a: 0.56 },
    ];

    // Soft dark lower fold inside each puff for genuine 3D billowing depth
    const under = ctx.createRadialGradient(cx - 8, cy + 16, 4, cx - 4, cy + 12, 46);
    under.addColorStop(0.0, brightCore ? 'rgba(82,82,91,0.34)' : 'rgba(24,24,27,0.48)');
    under.addColorStop(0.65, 'rgba(39,39,46,0.14)');
    under.addColorStop(1.0, 'rgba(24,24,27,0)');
    ctx.fillStyle = under;
    ctx.beginPath();
    ctx.arc(cx - 4, cy + 12, 46, 0, Math.PI * 2);
    ctx.fill();

    for (const l of lobes) {
      const lx = cx + l.dx;
      const ly = cy + l.dy;
      const g = ctx.createRadialGradient(lx + 4, ly - 5, 2, lx, ly, l.r);
      g.addColorStop(0.0, `rgba(${l.shade},${l.shade},${l.shade},${l.a})`);
      g.addColorStop(0.55, `rgba(${Math.max(40, l.shade - 35)},${Math.max(40, l.shade - 35)},${Math.max(40, l.shade - 35)},${l.a * 0.45})`);
      g.addColorStop(1.0, 'rgba(180,180,188,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(lx, ly, l.r, 0, Math.PI * 2);
      ctx.fill();
    }

    return canvas;
  };

  cachedSmokeLightSprite = buildPuff(true);
  cachedSmokeDarkSprite = buildPuff(false);
  return { bright: cachedSmokeLightSprite, shadow: cachedSmokeDarkSprite };
}

function getPadPools(): {
  puffs: VolumetricSmokePuff[];
  sparks: LiveSpark[];
  cryo: CryoMist[];
} {
  if (steamPool && sparkPool && cryoPool) {
    return { puffs: steamPool, sparks: sparkPool, cryo: cryoPool };
  }
  const rand = mulberry32(9988);

  steamPool = Array.from({ length: 42 }, (_, i) => {
    const dirX: -1 | 1 = i % 2 === 0 ? 1 : -1;
    return {
      dirX,
      x: dirX * (0.35 + rand() * 0.45),
      y: 0.08 + (rand() - 0.5) * 0.12,
      vx: dirX * (2.6 + rand() * 2.8),
      vy: -(0.12 + rand() * 0.34),
      age: rand() * 1.5,
      life: 1.25 + rand() * 1.35,
      baseR: 0.28 + rand() * 0.22,
      rot: rand() * Math.PI * 2,
      rotSpeed: dirX * (0.35 + rand() * 0.65),
    };
  });

  sparkPool = Array.from({ length: 26 }, (_, i) => {
    const dirX = i % 2 === 0 ? 1 : -1;
    return {
      x: dirX * (0.28 + rand() * 0.22),
      y: 0.02,
      vx: dirX * (2.8 + rand() * 3.2),
      vy: -(1.0 + rand() * 1.9),
      age: rand() * 0.6,
      life: 0.38 + rand() * 0.48,
    };
  });

  cryoPool = Array.from({ length: 12 }, (_, i) => ({
    x: 0,
    y: 0,
    vx: 0.42 + rand() * 0.36,
    vy: -(0.08 + rand() * 0.14),
    age: (i / 12) * 1.6,
    life: 1.3 + rand() * 0.9,
    r: 0.12 + rand() * 0.12,
  }));

  return { puffs: steamPool, sparks: sparkPool, cryo: cryoPool };
}

/** Draws a slender tapered lattice lightning protection tower (replaces simple stick) */
function drawLightningTower(
  ctx: CanvasRenderingContext2D,
  mx: number,
  baseY: number,
  hPx: number,
  beaconPulse: number
): void {
  const topY = baseY - hPx;
  const baseHalfW = Math.max(4, hPx * 0.032);
  const topHalfW = Math.max(1.2, hPx * 0.008);
  const bays = 6;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.lineWidth = 0.95;

  // Tapered outer legs
  ctx.beginPath();
  ctx.moveTo(mx - baseHalfW, baseY);
  ctx.lineTo(mx - topHalfW, topY);
  ctx.moveTo(mx + baseHalfW, baseY);
  ctx.lineTo(mx + topHalfW, topY);
  ctx.stroke();

  // Internal X-bracing bays
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 0.75;
  for (let b = 0; b < bays; b++) {
    const f0 = b / bays;
    const f1 = (b + 1) / bays;
    const y0 = baseY - f0 * hPx;
    const y1 = baseY - f1 * hPx;
    const w0 = baseHalfW + (topHalfW - baseHalfW) * f0;
    const w1 = baseHalfW + (topHalfW - baseHalfW) * f1;
    ctx.beginPath();
    ctx.moveTo(mx - w0, y0);
    ctx.lineTo(mx + w1, y1);
    ctx.moveTo(mx + w0, y0);
    ctx.lineTo(mx - w1, y1);
    ctx.stroke();
  }

  // Lightning arrestor needle tip
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mx, topY);
  ctx.lineTo(mx, topY - 12);
  ctx.stroke();

  // Synced 1 Hz blinking white aviation beacon
  ctx.fillStyle = `rgba(255, 255, 255, ${0.42 + beaconPulse * 0.58})`;
  ctx.beginPath();
  ctx.arc(mx, topY - 13, 1.8 + beaconPulse * 0.7, 0, Math.PI * 2);
  ctx.fill();
  if (beaconPulse > 0.1) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${beaconPulse * 0.45})`;
    ctx.beginPath();
    ctx.arc(mx, topY - 13, 4 + beaconPulse * 5, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/**
 * Pure Monochrome Black & White Spaceport Launchpad — BACK LAYER:
 * - Mission Control Concrete Blockhouse & Radar Dish (far left)
 * - Twin Cryogenic LOX / LH2 Horton Storage Spheres + Pipeline Trestle (left flank)
 * - 4 Tapered Lattice Lightning Protection Towers with synced beacons
 * - Braced Multi-Leg Spherical Water Deluge Storage Tower (east flank)
 * - Detailed Open-Lattice Umbilical Service Gantry Tower with Cleanroom Cabin & Hammerhead Crane
 * - Heavy Mobile Launch Platform (MLP) with structural arches, buttresses, catwalk stairs & white-hot deflector wedge
 */
export function renderLaunchPadBack(frame: Scene2DFrameContext): void {
  const { ctx, h, sp, t, mouseX, vehicleAnchorX, groundY, unit, reducedMotion } = frame;
  if (sp > 0.275) return;

  const dropPx = getLaunchPadDropPx(sp, h);
  const padX = vehicleAnchorX - mouseX * 10;
  const padY = groundY + dropPx;
  if (padY - unit * 4.8 > h) return;

  const beaconCycle = t % 1.0;
  const beaconPulse = reducedMotion
    ? 0.5
    : beaconCycle < 0.42
      ? Math.sin((beaconCycle / 0.42) * Math.PI)
      : 0;

  ctx.save();

  // 1. 4 TAPERED LATTICE LIGHTNING PROTECTION TOWERS
  const masts = [
    { ox: -3.95, hU: 3.10 },
    { ox: -2.05, hU: 3.45 },
    { ox: 2.25, hU: 3.35 },
    { ox: 4.10, hU: 2.95 },
  ];
  for (const m of masts) {
    const mx = vehicleAnchorX + m.ox * unit - mouseX * 6;
    drawLightningTower(ctx, mx, padY - unit * 0.08, m.hU * unit, beaconPulse);
  }

  // 2. MISSION CONTROL BLOCKHOUSE / BLAST BUNKER + TELEMETRY DISH (Far Left)
  const blkX = vehicleAnchorX - unit * 4.65 - mouseX * 8;
  const blkY = padY - unit * 0.04;
  ctx.fillStyle = '#141418';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(blkX - unit * 0.65, blkY);
  ctx.lineTo(blkX - unit * 0.50, blkY - unit * 0.34);
  ctx.lineTo(blkX + unit * 0.52, blkY - unit * 0.34);
  ctx.lineTo(blkX + unit * 0.68, blkY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Illuminated narrow observation slits
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  for (let wIdx = -2; wIdx <= 2; wIdx++) {
    ctx.fillRect(blkX + wIdx * unit * 0.16 - unit * 0.04, blkY - unit * 0.24, unit * 0.08, unit * 0.032);
  }
  // Small rooftop tracking dish
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.moveTo(blkX + unit * 0.28, blkY - unit * 0.34);
  ctx.lineTo(blkX + unit * 0.28, blkY - unit * 0.50);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(blkX + unit * 0.32, blkY - unit * 0.52, unit * 0.12, Math.PI * 0.75, Math.PI * 1.65);
  ctx.stroke();

  // 3. CRYOGENIC LOX / LH2 HORTON STORAGE SPHERES + PIPELINE TRESTLE (Left Flank)
  const tankFarmX = vehicleAnchorX - unit * 2.85 - mouseX * 8;
  const tankBaseY = padY - unit * 0.04;
  const sphereR = unit * 0.28;

  // Elevated cryogenic transfer pipeline trestle connecting tank farm to MLP
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(tankFarmX + unit * 0.35, tankBaseY - unit * 0.18);
  ctx.lineTo(padX - unit * 1.05, tankBaseY - unit * 0.18);
  ctx.stroke();
  ctx.lineWidth = 1;
  for (let p = 0; p < 4; p++) {
    const px = tankFarmX + unit * (0.55 + p * 0.38);
    if (px < padX - unit * 1.05) {
      ctx.beginPath();
      ctx.moveTo(px, tankBaseY);
      ctx.lineTo(px, tankBaseY - unit * 0.18);
      ctx.stroke();
    }
  }

  for (const offset of [-0.34, 0.34]) {
    const tx = tankFarmX + offset * unit;
    const cy = tankBaseY - unit * 0.44;
    // Steel support legs
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(tx - sphereR * 0.75, cy + sphereR * 0.55);
    ctx.lineTo(tx - sphereR * 0.85, tankBaseY);
    ctx.moveTo(tx + sphereR * 0.75, cy + sphereR * 0.55);
    ctx.lineTo(tx + sphereR * 0.85, tankBaseY);
    ctx.moveTo(tx, cy + sphereR);
    ctx.lineTo(tx, tankBaseY);
    ctx.stroke();

    // Crisp monochrome Horton cryo sphere
    ctx.fillStyle = '#e4e4e7';
    ctx.beginPath();
    ctx.arc(tx, cy, sphereR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.arc(tx, cy, sphereR, Math.PI * 0.52, Math.PI * 1.48);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(tx, cy, sphereR, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 4. BRACED MULTI-LEG SPHERICAL WATER DELUGE STORAGE TOWER (East Flank)
  const wtX = vehicleAnchorX + unit * 3.05 - mouseX * 7;
  const wtBaseY = padY - unit * 0.05;
  const wtH = unit * 1.52;
  const wtR = unit * 0.40;

  // Braced 3-leg steel lattice frame + central riser pipe
  ctx.fillStyle = '#27272a';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1.1;
  ctx.fillRect(wtX - unit * 0.055, wtBaseY - wtH, unit * 0.11, wtH);
  ctx.strokeRect(wtX - unit * 0.055, wtBaseY - wtH, unit * 0.11, wtH);

  ctx.beginPath();
  ctx.moveTo(wtX - unit * 0.28, wtBaseY);
  ctx.lineTo(wtX - unit * 0.14, wtBaseY - wtH * 0.88);
  ctx.moveTo(wtX + unit * 0.28, wtBaseY);
  ctx.lineTo(wtX + unit * 0.14, wtBaseY - wtH * 0.88);
  // Horizontal collar struts & X-bracing
  ctx.moveTo(wtX - unit * 0.23, wtBaseY - wtH * 0.35);
  ctx.lineTo(wtX + unit * 0.23, wtBaseY - wtH * 0.35);
  ctx.moveTo(wtX - unit * 0.18, wtBaseY - wtH * 0.68);
  ctx.lineTo(wtX + unit * 0.18, wtBaseY - wtH * 0.68);
  ctx.moveTo(wtX - unit * 0.23, wtBaseY - wtH * 0.35);
  ctx.lineTo(wtX + unit * 0.18, wtBaseY - wtH * 0.68);
  ctx.moveTo(wtX + unit * 0.23, wtBaseY - wtH * 0.35);
  ctx.lineTo(wtX - unit * 0.18, wtBaseY - wtH * 0.68);
  ctx.stroke();

  const sphereY = wtBaseY - wtH - wtR * 0.72;
  ctx.fillStyle = '#e4e4e7';
  ctx.beginPath();
  ctx.arc(wtX, sphereY, wtR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#27272a';
  ctx.beginPath();
  ctx.arc(wtX, sphereY, wtR, Math.PI * 0.55, Math.PI * 1.45);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.beginPath();
  ctx.arc(wtX, sphereY, wtR, 0, Math.PI * 2);
  ctx.stroke();

  // 5. DETAILED UMBILICAL SERVICE GANTRY TOWER (Cleanroom Cabin + Hammerhead Crane + Lattice)
  const towerW = unit * 0.62;
  const towerH = unit * 3.55;
  const towerCx = padX - unit * 0.84;
  const towerBaseY = padY - unit * 0.05;
  const towerTopY = towerBaseY - towerH;
  const tiers = 7;
  const tierH = towerH / tiers;

  // Inner dark elevator shaft core
  ctx.fillStyle = '#09090b';
  ctx.fillRect(towerCx - towerW * 0.16, towerTopY, towerW * 0.32, towerH);

  // Diagonal X-bracing & horizontal service decks with safety railings
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.48)';
  ctx.lineWidth = 1.05;
  for (let i = 0; i < tiers; i++) {
    const y0 = towerBaseY - i * tierH;
    const y1 = y0 - tierH;
    const lx = towerCx - towerW * 0.46;
    const rx = towerCx + towerW * 0.46;

    ctx.beginPath();
    ctx.moveTo(lx, y0);
    ctx.lineTo(rx, y1);
    ctx.moveTo(rx, y0);
    ctx.lineTo(lx, y1);
    ctx.stroke();

    // Platform deck + top white rail line
    ctx.fillStyle = '#18181b';
    ctx.fillRect(lx - unit * 0.05, y1 - unit * 0.024, towerW + unit * 0.10, unit * 0.048);
    ctx.fillStyle = '#e4e4e7';
    ctx.fillRect(lx - unit * 0.05, y1 - unit * 0.024, towerW + unit * 0.10, 1.2);
  }

  // Mid-tower Enclosed Payload Cleanroom Servicing Cabin (tiers 4-5)
  const cabinY = towerBaseY - 5 * tierH;
  ctx.fillStyle = '#18181b';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.lineWidth = 1.15;
  ctx.fillRect(towerCx - towerW * 0.56, cabinY, towerW * 1.12, tierH * 0.92);
  ctx.strokeRect(towerCx - towerW * 0.56, cabinY, towerW * 1.12, tierH * 0.92);
  // Subtle illuminated cabin inspection windows
  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.fillRect(towerCx - towerW * 0.36, cabinY + tierH * 0.28, towerW * 0.24, tierH * 0.22);
  ctx.fillRect(towerCx + towerW * 0.12, cabinY + tierH * 0.28, towerW * 0.24, tierH * 0.22);

  // Main outer structural steel corner columns
  const colW = Math.max(2.6, unit * 0.052);
  ctx.fillStyle = '#27272a';
  ctx.fillRect(towerCx - towerW * 0.5, towerTopY, colW, towerH);
  ctx.fillStyle = '#e4e4e7';
  ctx.fillRect(towerCx + towerW * 0.5 - colW, towerTopY, colW, towerH);

  // Top Cantilevered Hammerhead Service Crane Boom & Counterweight
  const craneY = towerTopY - unit * 0.10;
  ctx.strokeStyle = '#e4e4e7';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(towerCx - unit * 0.55, craneY);
  ctx.lineTo(towerCx + unit * 0.62, craneY);
  ctx.moveTo(towerCx, towerTopY - unit * 0.32);
  ctx.lineTo(towerCx - unit * 0.50, craneY);
  ctx.moveTo(towerCx, towerTopY - unit * 0.32);
  ctx.lineTo(towerCx + unit * 0.58, craneY);
  ctx.stroke();
  // Crane counterweight block on back left
  ctx.fillStyle = '#27272a';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.fillRect(towerCx - unit * 0.58, craneY - unit * 0.04, unit * 0.16, unit * 0.12);
  ctx.strokeRect(towerCx - unit * 0.58, craneY - unit * 0.04, unit * 0.16, unit * 0.12);

  // Tower apex lightning mast & pulsing white beacon
  const mastTopY = towerTopY - unit * 0.66;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(towerCx, towerTopY);
  ctx.lineTo(towerCx, mastTopY);
  ctx.stroke();

  ctx.fillStyle = `rgba(255, 255, 255, ${0.45 + beaconPulse * 0.55})`;
  ctx.beginPath();
  ctx.arc(towerCx, mastTopY - 3, 2.5 + beaconPulse * 0.9, 0, Math.PI * 2);
  ctx.fill();
  if (beaconPulse > 0.1) {
    ctx.strokeStyle = `rgba(255,255,255,${beaconPulse * 0.55})`;
    ctx.beginPath();
    ctx.arc(towerCx, mastTopY - 3, 5 + beaconPulse * 7, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 6. HEAVY MOBILE LAUNCH PLATFORM (MLP), BLAST BUTTRESSES, STAIRS & WHITE-HOT DEFLECTOR
  const mlpW = unit * 2.38;
  const mlpH = unit * 0.38;
  const mlpTopY = padY - unit * 0.19;
  const trenchW = unit * 0.88;

  // Deep central flame exhaust trench pit
  ctx.fillStyle = '#050505';
  ctx.fillRect(padX - trenchW * 0.5, mlpTopY + unit * 0.05, trenchW, mlpH);

  // Double-sided Steel Flame Deflector Wedge with structural ribs & white-hot ignition glow
  const fireRamp =
    sp >= 0.035 && sp < 0.240
      ? clamp((sp - 0.035) / 0.025, 0, 1) *
        (sp < 0.170 ? 1 : Math.max(0, 1 - (sp - 0.170) / 0.070))
      : 0;
  const heatFlicker = fireRamp * (reducedMotion ? 1 : 0.86 + Math.sin(t * 48) * 0.14);

  ctx.fillStyle =
    heatFlicker > 0.05
      ? `rgba(255, 255, 255, ${0.32 + heatFlicker * 0.66})`
      : '#27272a';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(padX, mlpTopY + unit * 0.08);
  ctx.lineTo(padX - trenchW * 0.46, mlpTopY + mlpH);
  ctx.lineTo(padX + trenchW * 0.46, mlpTopY + mlpH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Left & Right Reinforced Concrete MLP Piers + Angled Blast Buttresses
  const pierW = (mlpW - trenchW) * 0.5;
  for (const side of [-1, 1] as const) {
    const px = side < 0 ? padX - mlpW * 0.5 : padX + trenchW * 0.5;
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.lineWidth = 1.1;
    ctx.fillRect(px, mlpTopY + unit * 0.06, pierW, mlpH - unit * 0.02);
    ctx.strokeRect(px, mlpTopY + unit * 0.06, pierW, mlpH - unit * 0.02);

    // Recessed structural concrete bay arches inside each pier
    ctx.fillStyle = '#0c0c0f';
    ctx.fillRect(px + pierW * 0.22, mlpTopY + unit * 0.14, pierW * 0.56, mlpH * 0.55);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.strokeRect(px + pierW * 0.22, mlpTopY + unit * 0.14, pierW * 0.56, mlpH * 0.55);

    // Angled outer concrete blast-skirt buttress
    const outerX = side < 0 ? padX - mlpW * 0.5 : padX + mlpW * 0.5;
    ctx.fillStyle = '#141418';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.beginPath();
    ctx.moveTo(outerX, mlpTopY + unit * 0.06);
    ctx.lineTo(outerX + side * unit * 0.26, mlpTopY + mlpH + unit * 0.04);
    ctx.lineTo(outerX, mlpTopY + mlpH + unit * 0.04);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Industrial Steel Launch Deck + Perimeter Safety Handrail Posts
  ctx.fillStyle = '#e4e4e7';
  ctx.fillRect(padX - mlpW * 0.5 - unit * 0.05, mlpTopY, pierW + unit * 0.07, unit * 0.058);
  ctx.fillRect(padX + trenchW * 0.5 - unit * 0.02, mlpTopY, pierW + unit * 0.07, unit * 0.058);

  // Crisp top safety railings on outer MLP catwalks
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 0.9;
  for (const side of [-1, 1]) {
    const rx0 = side < 0 ? padX - mlpW * 0.5 - unit * 0.04 : padX + trenchW * 0.5 + unit * 0.18;
    const rx1 = side < 0 ? padX - trenchW * 0.5 - unit * 0.18 : padX + mlpW * 0.5 + unit * 0.04;
    ctx.beginPath();
    ctx.moveTo(rx0, mlpTopY - unit * 0.065);
    ctx.lineTo(rx1, mlpTopY - unit * 0.065);
    for (let k = 0; k <= 3; k++) {
      const px = rx0 + ((rx1 - rx0) * k) / 3;
      ctx.moveTo(px, mlpTopY);
      ctx.lineTo(px, mlpTopY - unit * 0.065);
    }
    ctx.stroke();
  }

  // High-Pressure Water Deluge Manifold Header Pipes along trench lips
  ctx.fillStyle = '#d4d4d8';
  ctx.fillRect(padX - trenchW * 0.5 - unit * 0.05, mlpTopY + unit * 0.05, unit * 0.06, unit * 0.04);
  ctx.fillRect(padX + trenchW * 0.5 - unit * 0.01, mlpTopY + unit * 0.05, unit * 0.06, unit * 0.04);

  ctx.restore();
}

/**
 * Pure Monochrome Black & White Launch Pad — FRONT LAYER:
 * - 4 Heavy-Duty Articulated Hydraulic Rocket-Holder Clamp Towers (A-frames + curved locking jaws + pistons!)
 * - 3 Open-Truss Retractable Umbilical Service Arms with drooping cryogenic hoses + soft QD purge clouds
 * - Soft drifting cryogenic LOX boil-off mist at standby
 * - Step 03 high-pressure water deluge quench spray + 42 volumetric billowing monochrome smoke puffs + sparks!
 */
export function renderLaunchPadFront(frame: Scene2DFrameContext): void {
  const { ctx, h, sp, t, dt, mouseX, vehicleAnchorX, groundY, unit, reducedMotion } = frame;
  if (sp > 0.275) return;

  const dropPx = getLaunchPadDropPx(sp, h);
  const padX = vehicleAnchorX - mouseX * 10;
  const padY = groundY + dropPx;
  if (padY - unit * 4.8 > h) return;

  const mlpTopY = padY - unit * 0.19;
  const towerCx = padX - unit * 0.84;
  const towerBaseY = padY - unit * 0.05;
  const { puffs, sparks, cryo } = getPadPools();
  const smokeSprites = getSmokeSprites();

  ctx.save();

  // =========================================================================
  // 1. HEAVY-DUTY ARTICULATED HYDRAULIC ROCKET-HOLDER CLAMP TOWERS (4 CLAMPS)
  // =========================================================================
  const clampOpen = sp < 0.080 ? 0 : easeOutCubic((sp - 0.080) / 0.045);

  // Outer clamps grip S200 booster aft rings (±0.47u); inner clamps lock L110 core skirt (±0.23u)
  const holderSpecs = [
    { ox: -0.49, side: -1 as const, tall: 0.28 },
    { ox: -0.25, side: -1 as const, tall: 0.20 },
    { ox: 0.25, side: 1 as const, tall: 0.20 },
    { ox: 0.49, side: 1 as const, tall: 0.28 },
  ];

  for (let i = 0; i < holderSpecs.length; i++) {
    const hSpec = holderSpecs[i];
    const hx = padX + hSpec.ox * unit;
    const dir = hSpec.side; // -1 = left of rocket, +1 = right of rocket
    const baseH = hSpec.tall * unit;

    // A. Stationary Blast-Shielded Triangular Steel A-Frame Pedestal bolted to MLP deck
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(hx - unit * 0.065, mlpTopY);
    ctx.lineTo(hx + dir * unit * 0.02, mlpTopY - baseH * 0.58);
    ctx.lineTo(hx + unit * 0.065, mlpTopY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // B. Articulated Curved Hydraulic Locking Jaw Arm (pivots smoothly outward 38° at Step 02!)
    const pivotX = hx + dir * unit * 0.015;
    const pivotY = mlpTopY - baseH * 0.52;
    const swingAngle = dir * clampOpen * 0.66; // Opens cleanly outward away from vehicle

    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(swingAngle);

    // Hydraulic actuator piston strut backing the jaw
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(dir * unit * 0.045, baseH * 0.35);
    ctx.lineTo(-dir * unit * 0.015, -baseH * 0.25);
    ctx.stroke();

    // Heavy curved steel locking arm + white grip pad pressing onto rocket base
    ctx.fillStyle = '#27272a';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(-dir * unit * 0.025, 0);
    ctx.lineTo(-dir * unit * 0.045, -baseH * 0.48);
    ctx.lineTo(-dir * unit * 0.115, -baseH * 0.56); // Grip claw tip
    ctx.lineTo(-dir * unit * 0.095, -baseH * 0.68);
    ctx.lineTo(dir * unit * 0.025, -baseH * 0.52);
    ctx.lineTo(dir * unit * 0.04, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crisp white mechanical pivot bolt pin
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1.8, unit * 0.022), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // =========================================================================
  // 2. OPEN-TRUSS UMBILICAL SERVICE ARMS + DROOPING CRYO HOSES + SOFT QD PURGE
  // =========================================================================
  const armRetract = sp < 0.080 ? 0 : easeOutCubic((sp - 0.080) / 0.045);
  const armConfigs = [
    { heightU: 1.08, lenU: 0.62 },
    { heightU: 1.66, lenU: 0.64 },
    { heightU: 2.26, lenU: 0.60 },
  ];
  const towerRightEdge = towerCx + unit * 0.30;

  for (let a = 0; a < armConfigs.length; a++) {
    const arm = armConfigs[a];
    const pivotY = towerBaseY - arm.heightU * unit;
    const visualLen = arm.lenU * unit * (1 - armRetract * 0.62);
    const armThick = unit * 0.068;
    const swingTilt = -armRetract * 0.42;

    ctx.save();
    ctx.translate(towerRightEdge, pivotY);
    ctx.rotate(swingTilt);

    // Top & bottom steel truss chords
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(0, -armThick * 0.5);
    ctx.lineTo(visualLen, -armThick * 0.35);
    ctx.moveTo(0, armThick * 0.5);
    ctx.lineTo(visualLen, armThick * 0.35);
    ctx.stroke();

    // Internal diagonal truss zig-zag bracing
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 0.85;
    const segs = 5;
    ctx.beginPath();
    for (let s = 0; s < segs; s++) {
      const x0 = (visualLen * s) / segs;
      const x1 = (visualLen * (s + 1)) / segs;
      ctx.moveTo(x0, s % 2 === 0 ? -armThick * 0.45 : armThick * 0.45);
      ctx.lineTo(x1, s % 2 === 0 ? armThick * 0.4 : -armThick * 0.4);
    }
    ctx.stroke();

    // Realistic drooping flexible braided cryogenic hose slung underneath arm
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(visualLen * 0.08, armThick * 0.5);
    ctx.quadraticCurveTo(
      visualLen * 0.52,
      armThick * 0.5 + unit * (0.09 + armRetract * 0.06),
      visualLen * 0.92,
      armThick * 0.35
    );
    ctx.stroke();

    // Heavy Quick-Disconnect (QD) coupler plate head
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(visualLen - unit * 0.025, -armThick * 0.62, unit * 0.042, armThick * 1.24);
    ctx.restore();

    // Step 02 Soft Volumetric Cryogenic Quick-Disconnect Purge Puff
    if (sp >= 0.080 && sp < 0.135) {
      const qdProg = (sp - 0.080) / 0.055;
      const qdAlpha = Math.sin(qdProg * Math.PI) * 0.68;
      const qdX = towerRightEdge + visualLen + qdProg * unit * 0.22;
      const qdY = pivotY - qdProg * unit * 0.16;
      const qdSize = unit * (0.36 + qdProg * 0.52);

      ctx.globalAlpha = qdAlpha;
      ctx.drawImage(smokeSprites.bright, qdX - qdSize * 0.5, qdY - qdSize * 0.5, qdSize, qdSize);
      ctx.globalAlpha = 1;
    }
  }

  // =========================================================================
  // 3. SOFT VOLUMETRIC STANDBY CRYOGENIC LOX BOIL-OFF MIST (sp < 0.085)
  // =========================================================================
  if (sp < 0.085) {
    const cryoFade = 1 - smoothstep(0.055, 0.085, sp);
    const originX = padX + unit * 0.22;
    const originY = towerBaseY - unit * 2.15;

    for (let i = 0; i < cryo.length; i++) {
      const c = cryo[i];
      if (!reducedMotion) {
        c.age += dt;
        if (c.age >= c.life) {
          c.age = 0;
          c.x = 0;
          c.y = 0;
        } else {
          c.x += c.vx * dt;
          c.y += c.vy * dt;
        }
      }
      const p = clamp(c.age / c.life, 0, 1);
      const alpha = Math.sin(p * Math.PI) * 0.36 * cryoFade;
      if (alpha < 0.01) continue;
      const drawSize = (c.r + p * 0.38) * unit * 2.1;
      ctx.globalAlpha = alpha;
      ctx.drawImage(
        smokeSprites.bright,
        originX + c.x * unit - drawSize * 0.5,
        originY + c.y * unit - drawSize * 0.5,
        drawSize,
        drawSize
      );
    }
    ctx.globalAlpha = 1;
  }

  // =========================================================================
  // 4. STEP 03 HIGH-PRESSURE WATER DELUGE QUENCH SPRAY STREAKS
  // =========================================================================
  if (sp >= 0.125 && sp < 0.215) {
    const delugeProg = (sp - 0.125) / 0.090;
    const alpha = Math.sin(delugeProg * Math.PI) * (0.68 + (reducedMotion ? 0 : Math.sin(t * 50) * 0.16));
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([7, 4]);
    ctx.lineDashOffset = reducedMotion ? 0 : -t * 165;
    for (const ox of [-0.46, -0.38, 0.38, 0.46]) {
      const sx = padX + ox * unit;
      const dir = ox < 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(sx, mlpTopY + unit * 0.04);
      ctx.lineTo(sx + dir * unit * 0.32, mlpTopY + unit * 0.32);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // =========================================================================
  // 5. VOLUMETRIC BILLOWING MONOCHROME TRENCH SMOKE & STEAM (42 PUFFS)
  // =========================================================================
  if (sp >= 0.045 && sp < 0.265) {
    const density =
      sp < 0.125
        ? smoothstep(0.045, 0.125, sp) * 0.52
        : sp < 0.170
          ? 0.52 + smoothstep(0.125, 0.168, sp) * 0.48
          : 1 - smoothstep(0.178, 0.265, sp);

    for (let i = 0; i < puffs.length; i++) {
      const p = puffs[i];
      if (!reducedMotion) {
        p.age += dt;
        if (p.age >= p.life) {
          p.age = 0;
          p.x = p.dirX * (0.32 + (i % 5) * 0.09);
          p.y = 0.08 + ((i % 3) - 1) * 0.04;
          p.vx = p.dirX * (2.8 + ((i * 19) % 10) * 0.28);
          p.vy = -(0.14 + ((i * 13) % 7) * 0.06);
          p.rot = (i * 1.3) % (Math.PI * 2);
        } else {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= Math.pow(0.24, dt); // Rapid horizontal blast deceleration
          p.vy -= 0.68 * dt;          // Buoyant rolling steam cloud rise!
          p.rot += p.rotSpeed * dt;
        }
      }

      const lf = clamp(p.age / p.life, 0, 1);
      const puffAlpha = Math.sin(lf * Math.PI) * 0.85 * density;
      if (puffAlpha < 0.02) continue;

      const px = padX + p.x * unit;
      const py = padY + p.y * unit;
      // Swells dramatically as exhaust smoke cools and expands across the Sriharikota apron
      const drawSize = (p.baseR + lf * 0.88) * unit * (1.35 + density * 0.95);

      // Inner/east-lit puffs use blinding white sprite; outer rolling billows blend moody shadow sprite
      const sprite = lf < 0.42 || p.dirX > 0 ? smokeSprites.bright : smokeSprites.shadow;

      ctx.save();
      ctx.globalAlpha = clamp(puffAlpha, 0, 0.90);
      ctx.translate(px, py);
      ctx.rotate(p.rot);
      ctx.drawImage(sprite, -drawSize * 0.5, -drawSize * 0.5, drawSize, drawSize);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // =========================================================================
  // 6. FLYING INCANDESCENT MONOCHROME TRENCH SPARKS (Step 01 -> Liftoff)
  // =========================================================================
  if (sp >= 0.035 && sp < 0.220 && !reducedMotion) {
    const sparkRamp = smoothstep(0.035, 0.060, sp) * (1 - smoothstep(0.170, 0.220, sp));
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      s.age += dt;
      if (s.age >= s.life) {
        s.age = 0;
        const dir = i % 2 === 0 ? 1 : -1;
        s.x = dir * (0.28 + (i % 4) * 0.08);
        s.y = 0.03;
        s.vx = dir * (2.9 + ((i * 23) % 10) * 0.32);
        s.vy = -(1.1 + ((i * 17) % 10) * 0.22);
      } else {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 4.8 * dt;
      }
      const lf = clamp(s.age / s.life, 0, 1);
      ctx.globalAlpha = (1 - lf) * 0.95 * sparkRamp;
      ctx.fillRect(padX + s.x * unit, padY + s.y * unit, 2.2, 2.2);
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
