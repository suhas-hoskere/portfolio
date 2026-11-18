import {
  type Scene2DFrameContext,
  clamp,
  easeOutCubic,
  smoothstep,
  mulberry32,
} from './types';

interface MonoExhaustStreak {
  nozzle: 0 | 1 | 2 | 3;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  len: number;
}

let exhaustStreaks: MonoExhaustStreak[] | null = null;
let cachedPlumeSprite: HTMLCanvasElement | null = null;
let cachedTrailPuffSprite: HTMLCanvasElement | null = null;

function getExhaustStreaks(): MonoExhaustStreak[] {
  if (exhaustStreaks) return exhaustStreaks;
  const rand = mulberry32(4242);
  exhaustStreaks = [];
  for (let i = 0; i < 32; i++) {
    const nozzle = (i < 10 ? 0 : i < 20 ? 1 : i < 26 ? 2 : 3) as 0 | 1 | 2 | 3;
    exhaustStreaks.push({
      nozzle,
      x: 0,
      y: 0,
      vx: (rand() - 0.5) * 0.42,
      vy: 4.8 + rand() * 4.5,
      age: rand() * 0.35,
      life: 0.20 + rand() * 0.22,
      len: 8 + rand() * 14,
    });
  }
  return exhaustStreaks;
}

/**
 * Pre-renders a soft, glowing volumetric monochrome rocket exhaust plume sprite ONCE (120x280):
 * - Zero hard edges or cartoon strokes — pure feathered radiant plasma glow!
 * - Built once at startup so drawing at 120Hz costs <0.04ms per engine.
 */
function getPlumeSprite(): HTMLCanvasElement {
  if (cachedPlumeSprite) return cachedPlumeSprite;
  const w = 120;
  const h = 280;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const cx = w * 0.5;

  // 1. Wide soft outer luminous atmospheric bloom around supersonic exhaust column
  const bloom = ctx.createRadialGradient(cx, 54, 4, cx, 98, 128);
  bloom.addColorStop(0.0, 'rgba(255, 255, 255, 0.55)');
  bloom.addColorStop(0.32, 'rgba(235, 235, 244, 0.22)');
  bloom.addColorStop(0.68, 'rgba(200, 200, 214, 0.06)');
  bloom.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, w, h);

  // 2. Feathered expanding supersonic exhaust jet layers (zero stroke outlines!)
  const layers = [
    { rx: 32, len: 264, a0: 0.30, a1: 0.08 },
    { rx: 21, len: 212, a0: 0.56, a1: 0.16 },
    { rx: 13, len: 152, a0: 0.88, a1: 0.28 },
    { rx: 7.5, len: 92, a0: 1.0, a1: 0.42 },
  ];
  for (const l of layers) {
    const grad = ctx.createLinearGradient(cx, 6, cx, l.len);
    grad.addColorStop(0.0, `rgba(255, 255, 255, ${l.a0})`);
    grad.addColorStop(0.45, `rgba(244, 244, 250, ${l.a1})`);
    grad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx - l.rx * 0.52, 6);
    ctx.quadraticCurveTo(cx - l.rx * 1.15, l.len * 0.46, cx, l.len);
    ctx.quadraticCurveTo(cx + l.rx * 1.15, l.len * 0.46, cx + l.rx * 0.52, 6);
    ctx.closePath();
    ctx.fill();
  }

  // 3. Blazing incandescent throat core right at nozzle exit
  const throat = ctx.createRadialGradient(cx, 16, 1, cx, 20, 22);
  throat.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  throat.addColorStop(0.55, 'rgba(255, 255, 255, 0.72)');
  throat.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = throat;
  ctx.beginPath();
  ctx.arc(cx, 20, 22, 0, Math.PI * 2);
  ctx.fill();

  cachedPlumeSprite = canvas;
  return canvas;
}

/** Soft feathered monochrome smoke puff sprite for booster burnout trails & cold-gas RCS vents */
function getTrailPuffSprite(): HTMLCanvasElement {
  if (cachedTrailPuffSprite) return cachedTrailPuffSprite;
  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size * 0.5;
  const lobes = [
    { dx: -10, dy: 4, r: 24, a: 0.34 },
    { dx: 10, dy: -4, r: 26, a: 0.38 },
    { dx: 0, dy: 0, r: 30, a: 0.44 },
  ];
  for (const l of lobes) {
    const g = ctx.createRadialGradient(c + l.dx, c + l.dy, 2, c + l.dx, c + l.dy, l.r);
    g.addColorStop(0.0, `rgba(235, 235, 242, ${l.a})`);
    g.addColorStop(0.55, `rgba(180, 180, 192, ${l.a * 0.42})`);
    g.addColorStop(1.0, 'rgba(180, 180, 192, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(c + l.dx, c + l.dy, l.r, 0, Math.PI * 2);
    ctx.fill();
  }
  cachedTrailPuffSprite = canvas;
  return canvas;
}

/**
 * Draws a live roaring, radiant volumetric monochrome supersonic exhaust plume:
 * - Uses additive luminance blending + feathered pre-rendered plasma sprite (ZERO hard strokes!)
 * - Soft luminous pulsing Mach diamond shock nodes (no dark outline borders!)
 */
function drawLiveMonoPlume(
  ctx: CanvasRenderingContext2D,
  nx: number,
  ny: number,
  width: number,
  length: number,
  fireRamp: number,
  t: number,
  withMachDiamonds: boolean,
  reducedMotion: boolean
): void {
  if (fireRamp <= 0.02) return;

  const turbLen = reducedMotion
    ? 1
    : 0.91 + Math.sin(t * 58 + nx * 0.3) * 0.09 + Math.cos(t * 102 + nx) * 0.05;
  const turbW = reducedMotion ? 1 : 0.94 + Math.sin(t * 46 + nx) * 0.06;
  const drawW = width * 2.85 * fireRamp * turbW;
  const drawH = length * 1.18 * fireRamp * turbLen;

  const plumeImg = getPlumeSprite();

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = clamp(fireRamp * 0.96, 0, 1);

  // Primary roaring feathered volumetric plasma jet
  ctx.drawImage(plumeImg, nx - drawW * 0.5, ny - drawH * 0.03, drawW, drawH);

  // Secondary turbulent shimmering inner core (subtle cross-flutter for living fire texture)
  const coreFlicker = reducedMotion ? 1 : 0.88 + Math.sin(t * 82 + nx * 0.7) * 0.12;
  ctx.globalAlpha = clamp(fireRamp * 0.72 * coreFlicker, 0, 1);
  ctx.drawImage(
    plumeImg,
    nx - drawW * 0.28,
    ny - drawH * 0.02,
    drawW * 0.56,
    drawH * 0.74
  );

  // Soft glowing incandescent Mach diamond shock nodes (NO hard black outlines!)
  if (withMachDiamonds && fireRamp > 0.25) {
    const pulse = reducedMotion ? 1 : 0.86 + Math.sin(t * 74) * 0.14;
    for (let d = 0; d < 3; d++) {
      const dy = ny + length * (0.14 + d * 0.145) * turbLen;
      const dw = width * (0.30 - d * 0.055) * pulse;
      const dh = length * (0.048 - d * 0.008) * pulse;
      ctx.fillStyle = `rgba(255, 255, 255, ${(0.82 - d * 0.18) * fireRamp})`;
      ctx.beginPath();
      ctx.moveTo(nx, dy - dh);
      ctx.lineTo(nx + dw, dy);
      ctx.lineTo(nx, dy + dh);
      ctx.lineTo(nx - dw, dy);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawMonoS200Booster(
  ctx: CanvasRenderingContext2D,
  side: -1 | 1,
  u: number,
  isBurning: boolean,
  fireRamp: number,
  sepProgress: number,
  t: number,
  blueprintMode: boolean,
  reducedMotion: boolean
): void {
  const bw = u * 0.145;
  const bodyH = u * 1.86;
  const noseH = u * 0.54;
  const topY = -bodyH;

  if (isBurning && sepProgress === 0) {
    drawLiveMonoPlume(ctx, 0, u * 0.20, bw * 1.55, u * 2.25, fireRamp, t, false, reducedMotion);
  }

  // Soft volumetric burnout smoke puffs drifting cleanly behind separating boosters (ZERO soap-bubble circles!)
  if (sepProgress > 0 && sepProgress < 1) {
    const trailPuff = getTrailPuffSprite();
    const trailAlpha = (1 - sepProgress) * 0.48;
    for (let s = 0; s < 5; s++) {
      const drift = reducedMotion ? 0 : ((t * 1.15 + s * 0.22) % 1) * 0.34;
      const sy = u * (0.28 + s * 0.26 + drift + sepProgress * 0.42);
      const sz = u * (0.28 + s * 0.14 + drift * 0.30);
      ctx.save();
      ctx.globalAlpha = trailAlpha * (1 - s * 0.16);
      ctx.translate(((s % 2) - 0.5) * u * 0.08, sy);
      ctx.rotate(s * 1.3 + t * 0.4);
      ctx.drawImage(trailPuff, -sz * 0.5, -sz * 0.5, sz, sz);
      ctx.restore();
    }
  }

  if (sepProgress < 0.15) {
    const innerEdge = -side * bw;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.36)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(innerEdge, topY + u * 0.18);
    ctx.lineTo(innerEdge - side * u * 0.14, topY + u * 0.06);
    ctx.moveTo(innerEdge, -u * 0.16);
    ctx.lineTo(innerEdge - side * u * 0.14, -u * 0.22);
    ctx.stroke();
  }

  if (blueprintMode) {
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(-bw, topY);
    ctx.lineTo(side * bw * 0.16, topY - noseH);
    ctx.lineTo(bw, topY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeRect(-bw, topY, bw * 2, bodyH);
    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.strokeRect(-bw * 0.62, topY + u * 0.1, bw * 1.24, bodyH - u * 0.2);
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(-bw * 0.52, 0);
    ctx.lineTo(-bw * 0.76, u * 0.20);
    ctx.lineTo(bw * 0.76, u * 0.20);
    ctx.lineTo(bw * 0.52, 0);
    ctx.closePath();
    ctx.stroke();
    return;
  }

  // Nose cone (sleek pearl-silver + soft hairline stroke)
  ctx.fillStyle = '#e4e4e7';
  ctx.beginPath();
  ctx.moveTo(-bw, topY);
  ctx.quadraticCurveTo(-bw * 0.72, topY - noseH * 0.58, side * bw * 0.16, topY - noseH);
  ctx.quadraticCurveTo(bw * 0.72, topY - noseH * 0.58, bw, topY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#c4c4cc';
  ctx.beginPath();
  ctx.moveTo(-bw, topY);
  ctx.quadraticCurveTo(-bw * 0.72, topY - noseH * 0.58, side * bw * 0.16, topY - noseH);
  ctx.lineTo(0, topY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(24, 24, 27, 0.38)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-bw, topY);
  ctx.quadraticCurveTo(-bw * 0.72, topY - noseH * 0.58, side * bw * 0.16, topY - noseH);
  ctx.quadraticCurveTo(bw * 0.72, topY - noseH * 0.58, bw, topY);
  ctx.closePath();
  ctx.stroke();

  // Main S200 Light Silver Casing + Delicate Charcoal Collar Bands
  ctx.fillStyle = '#e4e4e7';
  ctx.fillRect(-bw, topY, bw * 2, bodyH);
  ctx.fillStyle = '#c4c4cc';
  ctx.fillRect(-bw, topY, bw * 0.92, bodyH);

  ctx.fillStyle = '#27272a';
  ctx.fillRect(-bw, topY + u * 0.04, bw * 2, u * 0.045);
  ctx.fillRect(-bw, topY + bodyH * 0.52, bw * 2, u * 0.032);

  ctx.strokeStyle = 'rgba(24, 24, 27, 0.38)';
  ctx.lineWidth = 0.9;
  ctx.strokeRect(-bw, topY, bw * 2, bodyH);

  ctx.strokeStyle = 'rgba(24, 24, 27, 0.16)';
  ctx.lineWidth = 0.75;
  for (const frac of [0.28, 0.76]) {
    const sy = topY + bodyH * frac;
    ctx.beginPath();
    ctx.moveTo(-bw, sy);
    ctx.lineTo(bw, sy);
    ctx.stroke();
  }

  // Aft Skirt & Nozzle Bell
  ctx.fillStyle = '#1f1f23';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.lineWidth = 0.85;
  ctx.beginPath();
  ctx.moveTo(-bw, -u * 0.02);
  ctx.lineTo(-bw * 1.05, u * 0.08);
  ctx.lineTo(bw * 1.05, u * 0.08);
  ctx.lineTo(bw, -u * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#2e2e34';
  ctx.beginPath();
  ctx.moveTo(-bw * 0.54, u * 0.08);
  ctx.lineTo(-bw * 0.76, u * 0.20);
  ctx.lineTo(bw * 0.76, u * 0.20);
  ctx.lineTo(bw * 0.54, u * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Crisp directional separation motor cold-gas puff shooting inward/upward (replaces fake target circle!)
  if (sepProgress > 0.01 && sepProgress < 0.65) {
    const puffBell = Math.sin((sepProgress / 0.65) * Math.PI);
    const trailPuff = getTrailPuffSprite();
    const rcsX = -side * (bw + u * (0.08 + sepProgress * 0.22));
    const rcsY = topY + u * 0.08;
    const rcsSize = u * (0.20 + sepProgress * 0.34);
    ctx.save();
    ctx.globalAlpha = puffBell * 0.65;
    ctx.drawImage(trailPuff, rcsX - rcsSize * 0.5, rcsY - rcsSize * 0.5, rcsSize, rcsSize);
    ctx.restore();
  }
}

/**
 * Shared physical rocket trajectory pose (used by both rocketVehicle & heroSatellite):
 * - On liftoff (0.170+): Rocket genuinely accelerates UPWARD off the pad, clears the gantry,
 *   shrinks dramatically as it climbs far away from Earth (1.0 -> 0.36!), and curves along a realistic gravity turn!
 */
export function getRocketPose(
  sp: number,
  mouseX: number,
  vehicleAnchorX: number,
  groundY: number,
  unit: number,
  cameraMode: Scene2DFrameContext['cameraMode']
): { x: number; y: number; u: number; pitchRad: number } {
  const camZoom =
    cameraMode === 'BOOSTER' ? 1.42 : cameraMode === 'CHASE' ? 1.22 : 1.0;

  // Rocket realistically shrinks much smaller as it flies high and far away from Earth (1.00 -> 0.36)
  const climbDist = smoothstep(0.175, 0.425, sp);
  const altitudeScale = 1 - Math.pow(climbDist, 0.88) * 0.64;
  const u = unit * camZoom * altitudeScale;

  // Realistic gravity-turn lateral arc + pitch eastward into LEO
  const turnProg = smoothstep(0.215, 0.425, sp);
  const pitchRad = turnProg * 0.28;
  const x = vehicleAnchorX - mouseX * 10 + turnProg * unit * 0.24;

  // Rocket physically blasts UPWARD off the pad during liftoff (0.170 -> 0.290) and climbs high above Earth!
  let baseY = groundY - unit * 0.14;
  if (cameraMode === 'BOOSTER') baseY += unit * 0.32;
  else if (cameraMode === 'CHASE') baseY -= unit * 0.22;

  const liftoffRise = sp >= 0.170 ? Math.pow(smoothstep(0.170, 0.360, sp), 1.05) * unit * 2.15 : 0;
  const y = baseY - liftoffRise;

  return { x, y, u, pitchRad };
}

/**
 * Pure monochrome Black & White LIVE 2.5D LVM3 Launch Vehicle:
 * Taller, slimmer sleek silhouette, radiant volumetric fire plumes (zero hard outlines),
 * zero shaking, realistic upward liftoff + gravity turn + smooth multi-phase staging!
 */
export function renderRocketVehicle(frame: Scene2DFrameContext): void {
  const {
    ctx,
    sp,
    scrollSpeed,
    t,
    dt,
    mouseX,
    vehicleAnchorX,
    groundY,
    unit,
    cameraMode,
    blueprintMode,
    reducedMotion,
  } = frame;

  if (sp >= 0.550) return;

  const { x: basePadX, y: baseY, u, pitchRad } = getRocketPose(
    sp,
    mouseX,
    vehicleAnchorX,
    groundY,
    unit,
    cameraMode
  );

  // Core engines throttle down smoothly before stage separation (0.415 -> 0.445)
  const coreCutoff = 1 - smoothstep(0.415, 0.445, sp);
  const isBurning = sp >= 0.035 && sp < 0.448;
  const fireRamp = isBurning ? clamp((sp - 0.035) / 0.025, 0, 1) * coreCutoff : 0;

  // Booster solid motors burn out smoothly right before detaching (0.298 -> 0.322)
  const boosterFireRamp =
    isBurning && sp < 0.325
      ? clamp((sp - 0.035) / 0.025, 0, 1) * (1 - smoothstep(0.298, 0.322, sp))
      : 0;

  // Slow, graceful multi-step separation:
  // 1) Fairing clamshells peel open slowly across 0.395 -> 0.515 (12% scroll span!)
  const isFairingOpening = sp >= 0.395;
  const fairingProg = isFairingOpening ? smoothstep(0.395, 0.515, sp) : 0;

  // 2) Spent rocket core detaches and drifts slowly downward after fairing opens (0.435 -> 0.548)
  const coreSepProg = sp >= 0.435 ? smoothstep(0.435, 0.548, sp) : 0;
  const coreDropY = Math.pow(coreSepProg, 1.35) * u * 5.2;
  const coreDropRot = coreSepProg * 0.22;
  const coreAlpha = 1 - smoothstep(0.495, 0.548, sp);

  ctx.save();
  ctx.translate(basePadX, baseY);
  ctx.rotate(pitchRad);

  // Taller, slimmer sleek launch vehicle proportions
  const coreR = u * 0.185;
  const l110H = u * 1.82;
  const interstageH = u * 0.22;
  const c25H = u * 1.10;
  const fairingCylH = u * 0.52;
  const fairingNoseH = u * 0.90;

  const l110TopY = -l110H;
  const interTopY = l110TopY - interstageH;
  const c25TopY = interTopY - c25H;

  // =========================================================================
  // 1. LOWER ROCKET BODY + RADIANT VOLUMETRIC EXHAUST + LIVE SPARK STREAKS
  // =========================================================================
  ctx.save();
  ctx.globalAlpha = coreAlpha;
  ctx.translate(0, coreDropY);
  ctx.rotate(coreDropRot);

  // Twin Core Vikas Radiant Plumes + Glowing Mach Diamonds
  if (fireRamp > 0.01) {
    const thrustStretch = 1.0 + Math.min(scrollSpeed * 0.22, 0.42);
    const vikasSpread = coreR * 0.46;
    drawLiveMonoPlume(ctx, -vikasSpread, u * 0.18, coreR * 0.85, u * 2.05 * thrustStretch, fireRamp, t, true, reducedMotion);
    drawLiveMonoPlume(ctx, vikasSpread, u * 0.18, coreR * 0.85, u * 2.05 * thrustStretch, fireRamp, t, true, reducedMotion);
  }

  // Live supersonic monochrome spark streaks streaming down from active engine nozzles
  if (fireRamp > 0.05 && !reducedMotion) {
    const streaks = getExhaustStreaks();
    const boostersActive = boosterFireRamp > 0.1;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.15;
    for (let i = 0; i < streaks.length; i++) {
      const p = streaks[i];
      if (!boostersActive && p.nozzle < 2) continue;
      p.age += dt * (1.25 + Math.min(scrollSpeed * 0.35, 0.8));
      if (p.age >= p.life) {
        p.age = 0;
        const ox =
          p.nozzle === 0
            ? -coreR * 1.92
            : p.nozzle === 1
              ? coreR * 1.92
              : p.nozzle === 2
                ? -coreR * 0.46
                : coreR * 0.46;
        p.x = ox + (((i * 29) % 10) - 5) * 0.015 * u;
        p.y = u * 0.22;
      } else {
        p.x += p.vx * u * dt;
        p.y += p.vy * u * dt * fireRamp;
      }
      const ratio = clamp(p.age / p.life, 0, 1);
      ctx.globalAlpha = (1 - ratio) * 0.82 * fireRamp * coreAlpha;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 2, p.y + p.len);
      ctx.stroke();
    }
    ctx.globalAlpha = coreAlpha;
  }

  if (blueprintMode) {
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1.2;
    ctx.fillRect(-coreR, c25TopY, coreR * 2, l110H + interstageH + c25H);
    ctx.strokeRect(-coreR, l110TopY, coreR * 2, l110H);
    ctx.strokeRect(-coreR, interTopY, coreR * 2, interstageH);
    ctx.strokeRect(-coreR, c25TopY, coreR * 2, c25H);

    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(0, c25TopY + c25H * 0.34, coreR * 0.70, c25H * 0.23, 0, 0, Math.PI * 2);
    ctx.ellipse(0, c25TopY + c25H * 0.76, coreR * 0.66, c25H * 0.18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(-coreR * 0.70, l110TopY + u * 0.12, coreR * 1.40, l110H * 0.36);
    ctx.strokeRect(-coreR * 0.70, l110TopY + l110H * 0.56, coreR * 1.40, l110H * 0.34);
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${Math.max(9, Math.round(u * 0.08))}px "JetBrains Mono", monospace`;
    ctx.fillText('C25', coreR + u * 0.10, c25TopY + c25H * 0.55);
    ctx.fillText('L110', coreR + u * 0.10, l110TopY + l110H * 0.55);
  } else {
    // L110 Core Stage — sleek light pearl-silver hull with delicate minimal stage trim
    ctx.fillStyle = '#e4e4e7';
    ctx.fillRect(-coreR, l110TopY, coreR * 2, l110H);
    ctx.fillStyle = '#c4c4cc';
    ctx.fillRect(-coreR, l110TopY, coreR * 0.92, l110H);

    ctx.fillStyle = '#27272a';
    ctx.fillRect(-coreR, l110TopY + l110H * 0.72, coreR * 2, u * 0.042);
    ctx.strokeStyle = 'rgba(24, 24, 27, 0.16)';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(-coreR, l110TopY + l110H * 0.36);
    ctx.lineTo(coreR, l110TopY + l110H * 0.36);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(24, 24, 27, 0.38)';
    ctx.lineWidth = 0.9;
    ctx.strokeRect(-coreR, l110TopY, coreR * 2, l110H);

    // Interstage Adapter — sleek matte graphite collar
    ctx.fillStyle = '#1f1f23';
    ctx.fillRect(-coreR * 1.01, interTopY, coreR * 2.02, interstageH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.lineWidth = 0.85;
    ctx.strokeRect(-coreR * 1.01, interTopY, coreR * 2.02, interstageH);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillRect(-coreR * 1.02, interTopY + interstageH * 0.47, coreR * 2.04, 1.2);

    // C25 Cryogenic Upper Stage — light pearl hull + thin collar line
    ctx.fillStyle = '#ececef';
    ctx.fillRect(-coreR, c25TopY, coreR * 2, c25H);
    ctx.fillStyle = '#d0d0d8';
    ctx.fillRect(-coreR, c25TopY, coreR * 0.92, c25H);
    ctx.fillStyle = '#27272a';
    ctx.fillRect(-coreR, c25TopY + c25H * 0.18, coreR * 2, u * 0.032);
    ctx.strokeStyle = 'rgba(24, 24, 27, 0.38)';
    ctx.lineWidth = 0.9;
    ctx.strokeRect(-coreR, c25TopY, coreR * 2, c25H);

    // Core Aft Boat-tail & Twin Vikas Nozzles
    ctx.fillStyle = '#1f1f23';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(-coreR, -u * 0.04);
    ctx.lineTo(-coreR * 0.84, u * 0.06);
    ctx.lineTo(coreR * 0.84, u * 0.06);
    ctx.lineTo(coreR, -u * 0.04);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const vikasSpread = coreR * 0.46;
    for (const side of [-1, 1]) {
      const vx = side * vikasSpread;
      ctx.fillStyle = '#2e2e34';
      ctx.beginPath();
      ctx.moveTo(vx - u * 0.036, u * 0.06);
      ctx.lineTo(vx - u * 0.062, u * 0.19);
      ctx.lineTo(vx + u * 0.062, u * 0.19);
      ctx.lineTo(vx + u * 0.036, u * 0.06);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  // Twin S200 Solid Boosters — slow, gradual separation & gentle fade-out (sp 0.315 -> 0.425)
  if (sp < 0.428) {
    const sepProg = sp >= 0.315 ? smoothstep(0.315, 0.425, sp) : 0;
    const boosterFade = 1 - smoothstep(0.382, 0.426, sp);
    const baseBoosterX = coreR + u * 0.17;
    if (boosterFade > 0.01) {
      for (const side of [-1, 1] as const) {
        ctx.save();
        ctx.globalAlpha = coreAlpha * boosterFade;
        ctx.translate(
          side * (baseBoosterX + Math.pow(sepProg, 1.15) * u * 2.35),
          Math.pow(sepProg, 1.3) * u * 2.25
        );
        ctx.rotate(side * sepProg * 0.58);
        drawMonoS200Booster(
          ctx,
          side,
          u,
          boosterFireRamp > 0.01,
          boosterFireRamp,
          sepProg,
          t,
          blueprintMode,
          reducedMotion
        );
        ctx.restore();
      }
    }
  }

  ctx.restore(); // End lower body

  // =========================================================================
  // 2. MONOCHROME PAYLOAD FAIRING (slow clamshell split 0.395 -> 0.515)
  // =========================================================================
  const fairingBaseY = c25TopY;

  if (!isFairingOpening) {
    if (blueprintMode) {
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-coreR, fairingBaseY);
      ctx.lineTo(-coreR, fairingBaseY - fairingCylH);
      ctx.quadraticCurveTo(-coreR * 0.92, fairingBaseY - fairingCylH - fairingNoseH * 0.55, 0, fairingBaseY - fairingCylH - fairingNoseH);
      ctx.quadraticCurveTo(coreR * 0.92, fairingBaseY - fairingCylH - fairingNoseH * 0.55, coreR, fairingBaseY - fairingCylH);
      ctx.lineTo(coreR, fairingBaseY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = `600 ${Math.max(9, Math.round(u * 0.08))}px "JetBrains Mono", monospace`;
      ctx.fillText('PLF', coreR + u * 0.10, fairingBaseY - fairingCylH * 0.6);
    } else {
      ctx.fillStyle = '#ececef';
      ctx.beginPath();
      ctx.moveTo(-coreR, fairingBaseY);
      ctx.lineTo(-coreR, fairingBaseY - fairingCylH);
      ctx.quadraticCurveTo(-coreR * 0.92, fairingBaseY - fairingCylH - fairingNoseH * 0.58, 0, fairingBaseY - fairingCylH - fairingNoseH);
      ctx.quadraticCurveTo(coreR * 0.92, fairingBaseY - fairingCylH - fairingNoseH * 0.58, coreR, fairingBaseY - fairingCylH);
      ctx.lineTo(coreR, fairingBaseY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#d0d0d8';
      ctx.beginPath();
      ctx.moveTo(-coreR, fairingBaseY);
      ctx.lineTo(-coreR, fairingBaseY - fairingCylH);
      ctx.quadraticCurveTo(-coreR * 0.92, fairingBaseY - fairingCylH - fairingNoseH * 0.58, 0, fairingBaseY - fairingCylH - fairingNoseH);
      ctx.lineTo(0, fairingBaseY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#27272a';
      ctx.fillRect(-coreR, fairingBaseY - u * 0.032, coreR * 2, u * 0.032);

      ctx.strokeStyle = 'rgba(24, 24, 27, 0.38)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(-coreR, fairingBaseY);
      ctx.lineTo(-coreR, fairingBaseY - fairingCylH);
      ctx.quadraticCurveTo(-coreR * 0.92, fairingBaseY - fairingCylH - fairingNoseH * 0.58, 0, fairingBaseY - fairingCylH - fairingNoseH);
      ctx.quadraticCurveTo(coreR * 0.92, fairingBaseY - fairingCylH - fairingNoseH * 0.58, coreR, fairingBaseY - fairingCylH);
      ctx.lineTo(coreR, fairingBaseY);
      ctx.closePath();
      ctx.stroke();
    }
  } else if (sp < 0.518) {
    const fSep = easeOutCubic(fairingProg);
    const fadeOut = 1 - smoothstep(0.460, 0.515, sp);
    ctx.globalAlpha = fadeOut;

    for (const side of [-1, 1] as const) {
      ctx.save();
      ctx.translate(
        side * Math.pow(fSep, 1.1) * u * 2.55,
        fairingBaseY + Math.pow(fSep, 1.3) * u * 1.45
      );
      ctx.rotate(side * fSep * 0.85);
      ctx.fillStyle = blueprintMode ? 'rgba(255,255,255,0.08)' : side > 0 ? '#ececef' : '#d0d0d8';
      ctx.strokeStyle = blueprintMode ? '#ffffff' : 'rgba(24, 24, 27, 0.38)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -(fairingCylH + fairingNoseH));
      ctx.quadraticCurveTo(side * coreR * 0.92, -(fairingCylH + fairingNoseH * 0.58), side * coreR, -fairingCylH);
      ctx.lineTo(side * coreR, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
