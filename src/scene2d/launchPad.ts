import {
  type Scene2DFrameContext,
  clamp,
  easeOutCubic,
  smoothstep,
  mulberry32,
} from './types';
import { getPadZoomTransform } from './sriharikotaTerrain';

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
let cachedIgnitionGlowSprite: HTMLCanvasElement | null = null;
let steamPool: VolumetricSmokePuff[] | null = null;
let sparkPool: LiveSpark[] | null = null;
let cryoPool: CryoMist[] | null = null;

/** Lazily pre-rendered soft monochrome ignition light-bounce sprite (built ONCE only when ignition begins!) */
function getIgnitionGlowSprite(): HTMLCanvasElement {
  if (cachedIgnitionGlowSprite) return cachedIgnitionGlowSprite;
  const w = 220;
  const h = 140;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const cx = w * 0.5;
  const cy = h * 0.62;
  const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 108);
  g.addColorStop(0.0, 'rgba(255, 255, 255, 0.55)');
  g.addColorStop(0.32, 'rgba(236, 236, 245, 0.22)');
  g.addColorStop(0.68, 'rgba(205, 205, 220, 0.06)');
  g.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  cachedIgnitionGlowSprite = canvas;
  return canvas;
}

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
      g.addColorStop(
        0.55,
        `rgba(${Math.max(40, l.shade - 35)},${Math.max(40, l.shade - 35)},${Math.max(40, l.shade - 35)},${l.a * 0.4})`
      );
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
      x: dirX * (0.28 + rand() * 0.40),
      y: 0.05 + (rand() - 0.5) * 0.10,
      vx: dirX * (2.4 + rand() * 2.4),
      vy: -(0.12 + rand() * 0.28),
      age: rand() * 1.5,
      life: 1.25 + rand() * 1.30,
      baseR: 0.24 + rand() * 0.18,
      rot: rand() * Math.PI * 2,
      rotSpeed: dirX * (0.30 + rand() * 0.55),
    };
  });

  sparkPool = Array.from({ length: 18 }, (_, i) => {
    const dirX = i % 2 === 0 ? 1 : -1;
    return {
      x: dirX * (0.20 + rand() * 0.18),
      y: 0.02,
      vx: dirX * (2.4 + rand() * 2.6),
      vy: -(0.9 + rand() * 1.5),
      age: rand() * 0.6,
      life: 0.36 + rand() * 0.44,
    };
  });

  cryoPool = Array.from({ length: 10 }, (_, i) => ({
    x: 0,
    y: 0,
    vx: 0.36 + rand() * 0.30,
    vy: -(0.07 + rand() * 0.12),
    age: (i / 10) * 1.6,
    life: 1.3 + rand() * 0.8,
    r: 0.09 + rand() * 0.09,
  }));

  return { puffs: steamPool, sparks: sparkPool, cryo: cryoPool };
}

/**
 * Minimal, Whisper-Light Monochrome Launch Pad — BACK LAYER:
 * - Zero spheres, zero bulky clutter!
 * - Tall slender hairline gantry matching the taller, slimmer rocket
 * - Realistically zooms out & shrinks onto Earth's receding horizon on liftoff
 */
export function renderLaunchPadBack(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, t, mouseX, vehicleAnchorX, groundY, unit, reducedMotion } = frame;
  if (sp > 0.315) return;

  const { scale, anchorY, alpha } = getPadZoomTransform(sp, w, h, groundY, unit);
  if (alpha < 0.01) return;

  const padX = vehicleAnchorX - mouseX * 8 * scale;

  const beaconCycle = t % 1.0;
  const beaconPulse = reducedMotion
    ? 0.4
    : beaconCycle < 0.40
      ? Math.sin((beaconCycle / 0.40) * Math.PI)
      : 0;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(padX, anchorY);
  ctx.scale(scale, scale);

  // 1. TWO FAINT DISTANT LIGHTNING NEEDLE SPIRES
  for (const ox of [-2.25, 2.15]) {
    const mx = ox * unit;
    const baseY = -unit * 0.04;
    const topY = baseY - unit * 3.15;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.13)';
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(mx, baseY);
    ctx.lineTo(mx, topY);
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 255, 255, ${0.22 + beaconPulse * 0.42})`;
    ctx.beginPath();
    ctx.arc(mx, topY - 2, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. SLENDER, TALL LIGHTWEIGHT UMBILICAL GANTRY TOWER (proportioned to taller slimmer rocket)
  const towerW = unit * 0.28;
  const towerH = unit * 3.85;
  const towerCx = -unit * 0.56;
  const towerBaseY = -unit * 0.04;
  const towerTopY = towerBaseY - towerH;
  const bays = 8;
  const bayH = towerH / bays;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.26)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(towerCx - towerW * 0.5, towerBaseY);
  ctx.lineTo(towerCx - towerW * 0.5, towerTopY);
  ctx.moveTo(towerCx + towerW * 0.5, towerBaseY);
  ctx.lineTo(towerCx + towerW * 0.5, towerTopY);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 0.75;
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
    ctx.moveTo(lx - unit * 0.025, y1);
    ctx.lineTo(rx + unit * 0.025, y1);
    ctx.stroke();
  }

  // Top slender lightning rod + gentle pulsing white beacon
  const mastTopY = towerTopY - unit * 0.42;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
  ctx.lineWidth = 0.95;
  ctx.beginPath();
  ctx.moveTo(towerCx, towerTopY);
  ctx.lineTo(towerCx, mastTopY);
  ctx.stroke();
  ctx.fillStyle = `rgba(255, 255, 255, ${0.32 + beaconPulse * 0.58})`;
  ctx.beginPath();
  ctx.arc(towerCx, mastTopY - 2, 1.6, 0, Math.PI * 2);
  ctx.fill();

  // 3. CLEAN LOW-PROFILE LAUNCH PAD BASE
  const padW = unit * 1.38;
  const padH = unit * 0.14;
  const padTopY = -unit * 0.12;
  const trenchW = unit * 0.54;

  const fireRamp =
    sp >= 0.032 && sp < 0.255
      ? clamp((sp - 0.032) / 0.022, 0, 1) *
        (sp < 0.140 ? 1 : Math.max(0, 1 - (sp - 0.140) / 0.115))
      : 0;

  if (fireRamp > 0.03) {
    const flicker = reducedMotion ? 1 : 0.88 + Math.sin(t * 48) * 0.12;
    // Dynamic monochrome light bounce illuminating the ground pad, gantry base & lower sky
    const glowImg = getIgnitionGlowSprite();
    const glowW = unit * 4.4 * (0.94 + flicker * 0.08);
    const glowH = unit * 2.8 * (0.94 + flicker * 0.08);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = clamp(fireRamp * flicker * 0.72 * alpha, 0, 0.8);
    ctx.drawImage(glowImg, -glowW * 0.5, padTopY - glowH * 0.58, glowW, glowH);
    ctx.restore();

    ctx.fillStyle = `rgba(255, 255, 255, ${0.26 * fireRamp * flicker})`;
    ctx.beginPath();
    ctx.moveTo(0, padTopY + unit * 0.04);
    ctx.lineTo(-trenchW * 0.48, padTopY + padH + unit * 0.03);
    ctx.lineTo(trenchW * 0.48, padTopY + padH + unit * 0.03);
    ctx.closePath();
    ctx.fill();
  }

  const sideW = (padW - trenchW) * 0.5;
  ctx.fillStyle = '#141418';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.lineWidth = 0.95;
  ctx.fillRect(-padW * 0.5, padTopY, sideW, padH);
  ctx.strokeRect(-padW * 0.5, padTopY, sideW, padH);
  ctx.fillRect(trenchW * 0.5, padTopY, sideW, padH);
  ctx.strokeRect(trenchW * 0.5, padTopY, sideW, padH);

  ctx.restore();
}

/**
 * Minimal, Whisper-Light Launch Pad — FRONT LAYER:
 * - 2 delicate hold-down lines & 2 slender umbilical arms proportioned for the taller, slimmer rocket
 * - Soft volumetric smoke & sparks shrinking realistically with the pad during zoom-out
 */
export function renderLaunchPadFront(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, dt, mouseX, vehicleAnchorX, groundY, unit, reducedMotion } = frame;
  if (sp > 0.315) return;

  const { scale, anchorY, alpha } = getPadZoomTransform(sp, w, h, groundY, unit);
  if (alpha < 0.01) return;

  const padX = vehicleAnchorX - mouseX * 8 * scale;
  const padTopY = -unit * 0.12;
  const towerCx = -unit * 0.56;
  const towerBaseY = -unit * 0.04;
  const { puffs, sparks, cryo } = getPadPools();
  const smokeSprites = getSmokeSprites();

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(padX, anchorY);
  ctx.scale(scale, scale);

  // 1. TWO SIMPLE, LIGHT HOLD-DOWN CLAMPS
  const clampOpen = sp < 0.068 ? 0 : easeOutCubic((sp - 0.068) / 0.036);
  for (const side of [-1, 1] as const) {
    const cx = side * unit * 0.33;
    ctx.save();
    ctx.translate(cx, padTopY);
    ctx.rotate(side * clampOpen * 0.48);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.48)';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-side * unit * 0.025, -unit * 0.13);
    ctx.lineTo(-side * unit * 0.075, -unit * 0.15);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.68)';
    ctx.beginPath();
    ctx.arc(0, 0, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. TWO SLENDER UMBILICAL ARMS (retract cleanly at Step 02)
  const armRetract = sp < 0.068 ? 0 : easeOutCubic((sp - 0.068) / 0.036);
  const towerRightEdge = towerCx + unit * 0.14;

  for (const hU of [1.62, 2.58]) {
    const pivotY = towerBaseY - hU * unit;
    const visualLen = unit * 0.42 * (1 - armRetract * 0.58);
    const swingTilt = -armRetract * 0.45;

    ctx.save();
    ctx.translate(towerRightEdge, pivotY);
    ctx.rotate(swingTilt);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.40)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(visualLen, 0);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
    ctx.fillRect(visualLen - 2, -2.5, 2.2, 5);
    ctx.restore();

    if (sp >= 0.068 && sp < 0.115) {
      const qdProg = (sp - 0.068) / 0.047;
      const qdAlpha = Math.sin(qdProg * Math.PI) * 0.48 * alpha;
      const qdX = towerRightEdge + visualLen + qdProg * unit * 0.18;
      const qdY = pivotY - qdProg * unit * 0.14;
      const qdSize = unit * (0.28 + qdProg * 0.42);
      ctx.globalAlpha = qdAlpha;
      ctx.drawImage(smokeSprites.bright, qdX - qdSize * 0.5, qdY - qdSize * 0.5, qdSize, qdSize);
      ctx.globalAlpha = alpha;
    }
  }

  // 3. SOFT STANDBY CRYOGENIC VAPOUR MIST (sp < 0.072)
  if (sp < 0.072) {
    const cryoFade = 1 - smoothstep(0.048, 0.072, sp);
    const originX = unit * 0.17;
    const originY = towerBaseY - unit * 2.55;

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
      const mistA = Math.sin(p * Math.PI) * 0.26 * cryoFade * alpha;
      if (mistA < 0.01) continue;
      const drawSize = (c.r + p * 0.32) * unit * 2.0;
      ctx.globalAlpha = mistA;
      ctx.drawImage(
        smokeSprites.bright,
        originX + c.x * unit - drawSize * 0.5,
        originY + c.y * unit - drawSize * 0.5,
        drawSize,
        drawSize
      );
    }
    ctx.globalAlpha = alpha;
  }

  // 4. VOLUMETRIC BILLOWING MONOCHROME SMOKE & DELUGE STEAM (Step 01 -> Liftoff climb)
  if (sp >= 0.038 && sp < 0.290) {
    const density =
      sp < 0.104
        ? smoothstep(0.038, 0.104, sp) * 0.46
        : sp < 0.142
          ? 0.46 + smoothstep(0.104, 0.140, sp) * 0.54
          : 1 - smoothstep(0.165, 0.290, sp);

    for (let i = 0; i < puffs.length; i++) {
      const p = puffs[i];
      if (!reducedMotion) {
        p.age += dt;
        if (p.age >= p.life) {
          p.age = 0;
          p.x = p.dirX * (0.24 + (i % 5) * 0.08);
          p.y = 0.05 + ((i % 3) - 1) * 0.04;
          p.vx = p.dirX * (2.5 + ((i * 19) % 10) * 0.25);
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
      const puffAlpha = Math.sin(lf * Math.PI) * 0.76 * density * alpha;
      if (puffAlpha < 0.02) continue;

      const px = p.x * unit;
      const py = p.y * unit;
      const drawSize = (p.baseR + lf * 0.80) * unit * (1.2 + density * 0.82);
      const sprite = lf < 0.44 || p.dirX > 0 ? smokeSprites.bright : smokeSprites.shadow;

      ctx.save();
      ctx.globalAlpha = clamp(puffAlpha, 0, 0.80);
      ctx.translate(px, py);
      ctx.rotate(p.rot);
      ctx.drawImage(sprite, -drawSize * 0.5, -drawSize * 0.5, drawSize, drawSize);
      ctx.restore();
    }
    ctx.globalAlpha = alpha;
  }

  // 5. SUBTLE FLYING SPARKS (Step 01 -> Liftoff)
  if (sp >= 0.035 && sp < 0.235 && !reducedMotion) {
    const sparkRamp = smoothstep(0.035, 0.060, sp) * (1 - smoothstep(0.175, 0.235, sp));
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      s.age += dt;
      if (s.age >= s.life) {
        s.age = 0;
        const dir = i % 2 === 0 ? 1 : -1;
        s.x = dir * (0.20 + (i % 4) * 0.07);
        s.y = 0.02;
        s.vx = dir * (2.4 + ((i * 23) % 10) * 0.26);
        s.vy = -(0.9 + ((i * 17) % 10) * 0.18);
      } else {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 4.6 * dt;
      }
      const lf = clamp(s.age / s.life, 0, 1);
      ctx.globalAlpha = (1 - lf) * 0.74 * sparkRamp * alpha;
      ctx.fillRect(s.x * unit, s.y * unit, 1.7, 1.7);
    }
  }

  ctx.restore();
}
