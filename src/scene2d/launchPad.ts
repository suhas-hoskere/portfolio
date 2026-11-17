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

    const lobes = [
      { dx: -16, dy: 8, r: 34, shade: brightCore ? 215 : 130, a: 0.36 },
      { dx: 18, dy: 10, r: 32, shade: brightCore ? 225 : 145, a: 0.34 },
      { dx: -6, dy: -14, r: 36, shade: brightCore ? 245 : 175, a: 0.44 },
      { dx: 12, dy: -10, r: 34, shade: brightCore ? 255 : 195, a: 0.46 },
      { dx: 0, dy: 2, r: 42, shade: brightCore ? 235 : 160, a: 0.48 },
    ];

    for (const l of lobes) {
      const lx = cx + l.dx;
      const ly = cy + l.dy;
      const g = ctx.createRadialGradient(lx + 4, ly - 5, 2, lx, ly, l.r);
      g.addColorStop(0.0, `rgba(${l.shade},${l.shade},${l.shade},${l.a})`);
      g.addColorStop(0.55, `rgba(${Math.max(40, l.shade - 35)},${Math.max(40, l.shade - 35)},${Math.max(40, l.shade - 35)},${l.a * 0.4})`);
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

  steamPool = Array.from({ length: 34 }, (_, i) => {
    const dirX: -1 | 1 = i % 2 === 0 ? 1 : -1;
    return {
      dirX,
      x: dirX * (0.32 + rand() * 0.42),
      y: 0.06 + (rand() - 0.5) * 0.10,
      vx: dirX * (2.5 + rand() * 2.5),
      vy: -(0.12 + rand() * 0.30),
      age: rand() * 1.5,
      life: 1.25 + rand() * 1.30,
      baseR: 0.26 + rand() * 0.20,
      rot: rand() * Math.PI * 2,
      rotSpeed: dirX * (0.30 + rand() * 0.55),
    };
  });

  sparkPool = Array.from({ length: 20 }, (_, i) => {
    const dirX = i % 2 === 0 ? 1 : -1;
    return {
      x: dirX * (0.24 + rand() * 0.20),
      y: 0.02,
      vx: dirX * (2.6 + rand() * 2.8),
      vy: -(0.9 + rand() * 1.6),
      age: rand() * 0.6,
      life: 0.36 + rand() * 0.44,
    };
  });

  cryoPool = Array.from({ length: 10 }, (_, i) => ({
    x: 0,
    y: 0,
    vx: 0.38 + rand() * 0.32,
    vy: -(0.07 + rand() * 0.12),
    age: (i / 10) * 1.6,
    life: 1.3 + rand() * 0.8,
    r: 0.10 + rand() * 0.10,
  }));

  return { puffs: steamPool, sparks: sparkPool, cryo: cryoPool };
}

/**
 * Minimal, Whisper-Light Monochrome Launch Pad — BACK LAYER:
 * - Zero spheres, zero bulky bunkers/clutter!
 * - 2 faint distant lightning needle spires with subtle pulsing beacon dots
 * - Slender lightweight architectural gantry tower (low-opacity crisp hairline truss)
 * - Clean low-profile launch base platform with subtle deflector glow on ignition
 */
export function renderLaunchPadBack(frame: Scene2DFrameContext): void {
  const { ctx, h, sp, t, mouseX, vehicleAnchorX, groundY, unit, reducedMotion } = frame;
  if (sp > 0.275) return;

  const dropPx = getLaunchPadDropPx(sp, h);
  const padX = vehicleAnchorX - mouseX * 8;
  const padY = groundY + dropPx;
  if (padY - unit * 4.2 > h) return;

  const beaconCycle = t % 1.0;
  const beaconPulse = reducedMotion
    ? 0.4
    : beaconCycle < 0.40
      ? Math.sin((beaconCycle / 0.40) * Math.PI)
      : 0;

  ctx.save();

  // 1. TWO FAINT DISTANT LIGHTNING NEEDLE SPIRES (subtle vertical depth, zero clutter)
  for (const ox of [-2.45, 2.35]) {
    const mx = vehicleAnchorX + ox * unit - mouseX * 5;
    const baseY = padY - unit * 0.04;
    const topY = baseY - unit * 2.85;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(mx, baseY);
    ctx.lineTo(mx, topY);
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 255, 255, ${0.25 + beaconPulse * 0.45})`;
    ctx.beginPath();
    ctx.arc(mx, topY - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. SLENDER, LIGHTWEIGHT UMBILICAL GANTRY TOWER (delicate hairline silhouette)
  const towerW = unit * 0.36;
  const towerH = unit * 3.15;
  const towerCx = padX - unit * 0.72;
  const towerBaseY = padY - unit * 0.04;
  const towerTopY = towerBaseY - towerH;
  const bays = 7;
  const bayH = towerH / bays;

  // Vertical slender legs
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(towerCx - towerW * 0.5, towerBaseY);
  ctx.lineTo(towerCx - towerW * 0.5, towerTopY);
  ctx.moveTo(towerCx + towerW * 0.5, towerBaseY);
  ctx.lineTo(towerCx + towerW * 0.5, towerTopY);
  ctx.stroke();

  // Delicate X-bracing & light platform ticks
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < bays; i++) {
    const y0 = towerBaseY - i * bayH;
    const y1 = y0 - bayH;
    const lx = towerCx - towerW * 0.5;
    const rx = towerCx + towerW * 0.5;
    ctx.beginPath();
    ctx.moveTo(lx, y0);
    ctx.lineTo(rx, y1);
    ctx.moveTo(rx, y0);
    ctx.lineTo(lx, y1);
    ctx.moveTo(lx - unit * 0.03, y1);
    ctx.lineTo(rx + unit * 0.03, y1);
    ctx.stroke();
  }

  // Top slender lightning rod + gentle pulsing white beacon
  const mastTopY = towerTopY - unit * 0.45;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(towerCx, towerTopY);
  ctx.lineTo(towerCx, mastTopY);
  ctx.stroke();
  ctx.fillStyle = `rgba(255, 255, 255, ${0.35 + beaconPulse * 0.6})`;
  ctx.beginPath();
  ctx.arc(towerCx, mastTopY - 2, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // 3. CLEAN LOW-PROFILE LAUNCH PAD BASE (minimal horizontal plinth + subtle trench glow)
  const padW = unit * 1.65;
  const padH = unit * 0.16;
  const padTopY = padY - unit * 0.14;
  const trenchW = unit * 0.66;

  // Subtle white glow beneath nozzles on ignition
  const fireRamp =
    sp >= 0.035 && sp < 0.240
      ? clamp((sp - 0.035) / 0.025, 0, 1) *
        (sp < 0.170 ? 1 : Math.max(0, 1 - (sp - 0.170) / 0.070))
      : 0;

  if (fireRamp > 0.03) {
    const flicker = reducedMotion ? 1 : 0.85 + Math.sin(t * 48) * 0.15;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.28 * fireRamp * flicker})`;
    ctx.beginPath();
    ctx.moveTo(padX, padTopY + unit * 0.04);
    ctx.lineTo(padX - trenchW * 0.48, padTopY + padH + unit * 0.03);
    ctx.lineTo(padX + trenchW * 0.48, padTopY + padH + unit * 0.03);
    ctx.closePath();
    ctx.fill();
  }

  // Minimal flanking pad plinths (clean low-contrast graphite + crisp 1px top datum line)
  const sideW = (padW - trenchW) * 0.5;
  ctx.fillStyle = '#141418';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1;
  ctx.fillRect(padX - padW * 0.5, padTopY, sideW, padH);
  ctx.strokeRect(padX - padW * 0.5, padTopY, sideW, padH);
  ctx.fillRect(padX + trenchW * 0.5, padTopY, sideW, padH);
  ctx.strokeRect(padX + trenchW * 0.5, padTopY, sideW, padH);

  ctx.restore();
}

/**
 * Minimal, Whisper-Light Launch Pad — FRONT LAYER:
 * - 2 simple, delicate hold-down arms lightly holding the rocket base (swing open cleanly at Step 02)
 * - 2 slender umbilical service arms lightly touching the rocket flank (retract smoothly at Step 02)
 * - Soft volumetric cryogenic mist & billowing monochrome exhaust smoke + subtle sparks
 */
export function renderLaunchPadFront(frame: Scene2DFrameContext): void {
  const { ctx, h, sp, dt, mouseX, vehicleAnchorX, groundY, unit, reducedMotion } = frame;
  if (sp > 0.275) return;

  const dropPx = getLaunchPadDropPx(sp, h);
  const padX = vehicleAnchorX - mouseX * 8;
  const padY = groundY + dropPx;
  if (padY - unit * 4.2 > h) return;

  const padTopY = padY - unit * 0.14;
  const towerCx = padX - unit * 0.72;
  const towerBaseY = padY - unit * 0.04;
  const { puffs, sparks, cryo } = getPadPools();
  const smokeSprites = getSmokeSprites();

  ctx.save();

  // 1. TWO SIMPLE, LIGHT HOLD-DOWN CLAMPS (just enough to suggest holding the rocket)
  const clampOpen = sp < 0.080 ? 0 : easeOutCubic((sp - 0.080) / 0.045);
  for (const side of [-1, 1] as const) {
    const cx = padX + side * unit * 0.44;
    ctx.save();
    ctx.translate(cx, padTopY);
    ctx.rotate(side * clampOpen * 0.48);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.52)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-side * unit * 0.03, -unit * 0.14);
    ctx.lineTo(-side * unit * 0.09, -unit * 0.16);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.beginPath();
    ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. TWO SLENDER UMBILICAL ARMS (lightly holding upper/mid vehicle, swing away smoothly at Step 02)
  const armRetract = sp < 0.080 ? 0 : easeOutCubic((sp - 0.080) / 0.045);
  const towerRightEdge = towerCx + unit * 0.18;

  for (const hU of [1.28, 2.02]) {
    const pivotY = towerBaseY - hU * unit;
    const visualLen = unit * 0.54 * (1 - armRetract * 0.58);
    const swingTilt = -armRetract * 0.45;

    ctx.save();
    ctx.translate(towerRightEdge, pivotY);
    ctx.rotate(swingTilt);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(visualLen, 0);
    ctx.stroke();

    // Small crisp tip coupler tick
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fillRect(visualLen - 2, -3, 2.5, 6);
    ctx.restore();

    // Soft QD purge mist puff on decouple (Step 02)
    if (sp >= 0.080 && sp < 0.135) {
      const qdProg = (sp - 0.080) / 0.055;
      const qdAlpha = Math.sin(qdProg * Math.PI) * 0.52;
      const qdX = towerRightEdge + visualLen + qdProg * unit * 0.18;
      const qdY = pivotY - qdProg * unit * 0.14;
      const qdSize = unit * (0.30 + qdProg * 0.44);
      ctx.globalAlpha = qdAlpha;
      ctx.drawImage(smokeSprites.bright, qdX - qdSize * 0.5, qdY - qdSize * 0.5, qdSize, qdSize);
      ctx.globalAlpha = 1;
    }
  }

  // 3. SOFT STANDBY CRYOGENIC VAPOUR MIST (sp < 0.085)
  if (sp < 0.085) {
    const cryoFade = 1 - smoothstep(0.055, 0.085, sp);
    const originX = padX + unit * 0.22;
    const originY = towerBaseY - unit * 2.05;

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
      const alpha = Math.sin(p * Math.PI) * 0.28 * cryoFade;
      if (alpha < 0.01) continue;
      const drawSize = (c.r + p * 0.34) * unit * 2.0;
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

  // 4. VOLUMETRIC BILLOWING MONOCHROME SMOKE & DELUGE STEAM (Step 01 -> Liftoff)
  if (sp >= 0.045 && sp < 0.265) {
    const density =
      sp < 0.125
        ? smoothstep(0.045, 0.125, sp) * 0.48
        : sp < 0.170
          ? 0.48 + smoothstep(0.125, 0.168, sp) * 0.52
          : 1 - smoothstep(0.178, 0.265, sp);

    for (let i = 0; i < puffs.length; i++) {
      const p = puffs[i];
      if (!reducedMotion) {
        p.age += dt;
        if (p.age >= p.life) {
          p.age = 0;
          p.x = p.dirX * (0.28 + (i % 5) * 0.09);
          p.y = 0.06 + ((i % 3) - 1) * 0.04;
          p.vx = p.dirX * (2.6 + ((i * 19) % 10) * 0.26);
          p.vy = -(0.12 + ((i * 13) % 7) * 0.05);
          p.rot = (i * 1.3) % (Math.PI * 2);
        } else {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= Math.pow(0.24, dt);
          p.vy -= 0.62 * dt;
          p.rot += p.rotSpeed * dt;
        }
      }

      const lf = clamp(p.age / p.life, 0, 1);
      const puffAlpha = Math.sin(lf * Math.PI) * 0.78 * density;
      if (puffAlpha < 0.02) continue;

      const px = padX + p.x * unit;
      const py = padY + p.y * unit;
      const drawSize = (p.baseR + lf * 0.82) * unit * (1.25 + density * 0.85);
      const sprite = lf < 0.44 || p.dirX > 0 ? smokeSprites.bright : smokeSprites.shadow;

      ctx.save();
      ctx.globalAlpha = clamp(puffAlpha, 0, 0.82);
      ctx.translate(px, py);
      ctx.rotate(p.rot);
      ctx.drawImage(sprite, -drawSize * 0.5, -drawSize * 0.5, drawSize, drawSize);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // 5. SUBTLE FLYING SPARKS (Step 01 -> Liftoff)
  if (sp >= 0.035 && sp < 0.220 && !reducedMotion) {
    const sparkRamp = smoothstep(0.035, 0.060, sp) * (1 - smoothstep(0.170, 0.220, sp));
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      s.age += dt;
      if (s.age >= s.life) {
        s.age = 0;
        const dir = i % 2 === 0 ? 1 : -1;
        s.x = dir * (0.24 + (i % 4) * 0.08);
        s.y = 0.02;
        s.vx = dir * (2.6 + ((i * 23) % 10) * 0.28);
        s.vy = -(0.9 + ((i * 17) % 10) * 0.20);
      } else {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 4.6 * dt;
      }
      const lf = clamp(s.age / s.life, 0, 1);
      ctx.globalAlpha = (1 - lf) * 0.78 * sparkRamp;
      ctx.fillRect(padX + s.x * unit, padY + s.y * unit, 1.8, 1.8);
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
