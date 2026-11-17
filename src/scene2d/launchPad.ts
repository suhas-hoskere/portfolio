import {
  type Scene2DFrameContext,
  clamp,
  easeOutCubic,
  smoothstep,
  mulberry32,
} from './types';
import { getLaunchPadDropPx } from './sriharikotaTerrain';

interface LiveSteamPuff {
  dirX: -1 | 1;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  baseR: number;
}

interface LiveSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
}

let steamPool: LiveSteamPuff[] | null = null;
let sparkPool: LiveSpark[] | null = null;

function getPadPools(): { puffs: LiveSteamPuff[]; sparks: LiveSpark[] } {
  if (steamPool && sparkPool) return { puffs: steamPool, sparks: sparkPool };
  const rand = mulberry32(9988);

  steamPool = Array.from({ length: 28 }, (_, i) => {
    const dirX: -1 | 1 = i % 2 === 0 ? 1 : -1;
    return {
      dirX,
      x: dirX * (0.4 + rand() * 0.3),
      y: 0.06,
      vx: dirX * (2.4 + rand() * 2.4),
      vy: -(0.12 + rand() * 0.28),
      age: rand() * 1.4,
      life: 1.2 + rand() * 1.1,
      baseR: 0.16 + rand() * 0.14,
    };
  });

  sparkPool = Array.from({ length: 24 }, (_, i) => {
    const dirX = i % 2 === 0 ? 1 : -1;
    return {
      x: dirX * (0.28 + rand() * 0.2),
      y: 0.02,
      vx: dirX * (2.8 + rand() * 3.0),
      vy: -(0.9 + rand() * 1.8),
      age: rand() * 0.6,
      life: 0.40 + rand() * 0.48,
    };
  });

  return { puffs: steamPool, sparks: sparkPool };
}

/**
 * Pure monochrome Black & White LIVE Launch Pad — BACK LAYER:
 * - Blinking 1 Hz white aviation beacons on lightning masts & gantry tower
 * - Monochrome spherical water deluge tower + open-lattice steel gantry
 * - MLP foundation, flame trench & flickering white-hot deflector wedge
 */
export function renderLaunchPadBack(frame: Scene2DFrameContext): void {
  const { ctx, h, sp, t, mouseX, vehicleAnchorX, groundY, unit, reducedMotion } = frame;
  if (sp > 0.275) return;

  const dropPx = getLaunchPadDropPx(sp, h);
  const padX = vehicleAnchorX - mouseX * 10;
  const padY = groundY + dropPx;
  if (padY - unit * 4.5 > h) return;

  const beaconCycle = t % 1.0;
  const beaconPulse = reducedMotion
    ? 0.5
    : beaconCycle < 0.42
      ? Math.sin((beaconCycle / 0.42) * Math.PI)
      : 0;

  ctx.save();

  // 1. 4 PERIMETER SLENDER LIGHTNING PROTECTION MASTS + BLINKING WHITE BEACONS
  const masts = [
    { ox: -3.7, hU: 3.0 },
    { ox: -1.95, hU: 3.35 },
    { ox: 2.25, hU: 3.25 },
    { ox: 4.0, hU: 2.85 },
  ];
  for (const m of masts) {
    const mx = vehicleAnchorX + m.ox * unit - mouseX * 6;
    const baseY = padY - unit * 0.10;
    const topY = baseY - m.hU * unit;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mx - unit * 0.02, baseY);
    ctx.lineTo(mx, topY);
    ctx.lineTo(mx + unit * 0.02, baseY);
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + beaconPulse * 0.6})`;
    ctx.beginPath();
    ctx.arc(mx, topY - 3, 1.8 + beaconPulse * 0.8, 0, Math.PI * 2);
    ctx.fill();
    if (beaconPulse > 0.1) {
      ctx.strokeStyle = `rgba(255,255,255,${beaconPulse * 0.45})`;
      ctx.beginPath();
      ctx.arc(mx, topY - 3, 4 + beaconPulse * 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 2. MONOCHROME SPHERICAL WATER DELUGE STORAGE TOWER
  const wtX = vehicleAnchorX + unit * 3.0 - mouseX * 7;
  const wtBaseY = padY - unit * 0.06;
  const wtH = unit * 1.48;
  const wtR = unit * 0.38;

  ctx.fillStyle = '#18181b';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.lineWidth = 1.1;
  ctx.fillRect(wtX - unit * 0.08, wtBaseY - wtH, unit * 0.16, wtH);
  ctx.strokeRect(wtX - unit * 0.08, wtBaseY - wtH, unit * 0.16, wtH);

  ctx.beginPath();
  ctx.moveTo(wtX - unit * 0.22, wtBaseY);
  ctx.lineTo(wtX - unit * 0.08, wtBaseY - wtH * 0.85);
  ctx.moveTo(wtX + unit * 0.22, wtBaseY);
  ctx.lineTo(wtX + unit * 0.08, wtBaseY - wtH * 0.85);
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
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.arc(wtX, sphereY, wtR, 0, Math.PI * 2);
  ctx.stroke();

  // 3. OPEN-LATTICE UMBILICAL SERVICE GANTRY TOWER
  const towerW = unit * 0.58;
  const towerH = unit * 3.40;
  const towerCx = padX - unit * 0.78;
  const towerBaseY = padY - unit * 0.05;
  const towerTopY = towerBaseY - towerH;
  const tiers = 6;
  const tierH = towerH / tiers;

  ctx.fillStyle = '#09090b';
  ctx.fillRect(towerCx - towerW * 0.16, towerTopY, towerW * 0.32, towerH);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.48)';
  ctx.lineWidth = 1.1;
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

    ctx.fillStyle = '#18181b';
    ctx.fillRect(lx - unit * 0.04, y1 - unit * 0.025, towerW + unit * 0.08, unit * 0.05);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(lx - unit * 0.04, y1 - unit * 0.025, towerW + unit * 0.08, 1.2);
  }

  const colW = Math.max(2.5, unit * 0.05);
  ctx.fillStyle = '#27272a';
  ctx.fillRect(towerCx - towerW * 0.5, towerTopY, colW, towerH);
  ctx.fillStyle = '#d4d4d8';
  ctx.fillRect(towerCx + towerW * 0.5 - colW, towerTopY, colW, towerH);

  const mastTopY = towerTopY - unit * 0.55;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(towerCx, towerTopY);
  ctx.lineTo(towerCx, mastTopY);
  ctx.stroke();

  ctx.fillStyle = `rgba(255, 255, 255, ${0.45 + beaconPulse * 0.55})`;
  ctx.beginPath();
  ctx.arc(towerCx, mastTopY - 3, 2.4 + beaconPulse * 0.9, 0, Math.PI * 2);
  ctx.fill();
  if (beaconPulse > 0.1) {
    ctx.strokeStyle = `rgba(255,255,255,${beaconPulse * 0.55})`;
    ctx.beginPath();
    ctx.arc(towerCx, mastTopY - 3, 5 + beaconPulse * 7, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 4. MOBILE LAUNCH PLATFORM (MLP), FLAME TRENCH & FLICKERING WHITE-HOT DEFLECTOR
  const mlpW = unit * 2.1;
  const mlpH = unit * 0.34;
  const mlpTopY = padY - unit * 0.16;
  const trenchW = unit * 0.82;

  ctx.fillStyle = '#050505';
  ctx.fillRect(padX - trenchW * 0.5, mlpTopY + unit * 0.05, trenchW, mlpH);

  const fireRamp =
    sp >= 0.035 && sp < 0.240
      ? clamp((sp - 0.035) / 0.025, 0, 1) *
        (sp < 0.170 ? 1 : Math.max(0, 1 - (sp - 0.170) / 0.070))
      : 0;
  const heatFlicker = fireRamp * (reducedMotion ? 1 : 0.85 + Math.sin(t * 48) * 0.15);

  ctx.fillStyle =
    heatFlicker > 0.05
      ? `rgba(255, 255, 255, ${0.28 + heatFlicker * 0.70})`
      : '#27272a';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.58)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(padX, mlpTopY + unit * 0.09);
  ctx.lineTo(padX - trenchW * 0.44, mlpTopY + mlpH);
  ctx.lineTo(padX + trenchW * 0.44, mlpTopY + mlpH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const pierW = (mlpW - trenchW) * 0.5;
  ctx.fillStyle = '#18181b';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillRect(padX - mlpW * 0.5, mlpTopY + unit * 0.06, pierW, mlpH - unit * 0.02);
  ctx.strokeRect(padX - mlpW * 0.5, mlpTopY + unit * 0.06, pierW, mlpH - unit * 0.02);
  ctx.fillRect(padX + trenchW * 0.5, mlpTopY + unit * 0.06, pierW, mlpH - unit * 0.02);
  ctx.strokeRect(padX + trenchW * 0.5, mlpTopY + unit * 0.06, pierW, mlpH - unit * 0.02);

  ctx.fillStyle = '#e4e4e7';
  ctx.fillRect(padX - mlpW * 0.5 - unit * 0.04, mlpTopY, pierW + unit * 0.06, unit * 0.055);
  ctx.fillRect(padX + trenchW * 0.5 - unit * 0.02, mlpTopY, pierW + unit * 0.06, unit * 0.055);

  ctx.restore();
}

/**
 * Pure monochrome Black & White LIVE Launch Pad — FRONT LAYER:
 * - Tilting hold-down clamps, retracting umbilical arms & QD purge puffs
 * - Live drifting cryogenic boil-off vapor rings at standby
 * - Live billowing bilateral trench steam clouds + animated water deluge spray + flying sparks!
 */
export function renderLaunchPadFront(frame: Scene2DFrameContext): void {
  const { ctx, h, sp, t, dt, mouseX, vehicleAnchorX, groundY, unit, reducedMotion } = frame;
  if (sp > 0.275) return;

  const dropPx = getLaunchPadDropPx(sp, h);
  const padX = vehicleAnchorX - mouseX * 10;
  const padY = groundY + dropPx;
  if (padY - unit * 4.5 > h) return;

  const mlpTopY = padY - unit * 0.16;
  const towerCx = padX - unit * 0.78;
  const towerBaseY = padY - unit * 0.05;
  const { puffs, sparks } = getPadPools();

  ctx.save();

  // 1. 4 HOLD-DOWN CLAMPS
  const clampOpen = sp < 0.080 ? 0 : easeOutCubic((sp - 0.080) / 0.045);
  const clampPositions = [-0.34, -0.19, 0.19, 0.34];
  for (let i = 0; i < clampPositions.length; i++) {
    const cx = padX + clampPositions[i] * unit;
    const side = clampPositions[i] < 0 ? -1 : 1;
    ctx.save();
    ctx.translate(cx, mlpTopY);
    ctx.rotate(side * clampOpen * 0.32);
    ctx.fillStyle = '#27272a';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.fillRect(-unit * 0.03, -unit * 0.095, unit * 0.06, unit * 0.095);
    ctx.strokeRect(-unit * 0.03, -unit * 0.095, unit * 0.06, unit * 0.095);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-unit * 0.02, -unit * 0.12, unit * 0.04, unit * 0.028);
    ctx.restore();
  }

  // 2. RETRACTABLE UMBILICAL ARMS + QD PURGE PUFFS
  const armRetract = sp < 0.080 ? 0 : easeOutCubic((sp - 0.080) / 0.045);
  const armConfigs = [
    { heightU: 1.05, lenU: 0.56 },
    { heightU: 1.62, lenU: 0.58 },
    { heightU: 2.22, lenU: 0.54 },
  ];
  const towerRightEdge = towerCx + unit * 0.28;

  for (let a = 0; a < armConfigs.length; a++) {
    const arm = armConfigs[a];
    const pivotY = towerBaseY - arm.heightU * unit;
    const visualLen = arm.lenU * unit * (1 - armRetract * 0.62);
    const swingTilt = -armRetract * 0.36;

    ctx.save();
    ctx.translate(towerRightEdge, pivotY);
    ctx.rotate(swingTilt);
    ctx.fillStyle = '#27272a';
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 1.1;
    ctx.fillRect(0, -unit * 0.026, visualLen, unit * 0.05);
    ctx.strokeRect(0, -unit * 0.026, visualLen, unit * 0.05);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(visualLen - unit * 0.028, -unit * 0.038, unit * 0.04, unit * 0.076);
    ctx.restore();

    if (sp >= 0.080 && sp < 0.132) {
      const qdProg = (sp - 0.080) / 0.052;
      const qdAlpha = Math.sin(qdProg * Math.PI) * 0.58;
      const qdX = towerRightEdge + visualLen + qdProg * unit * 0.18;
      const qdY = pivotY - qdProg * unit * 0.14;
      ctx.fillStyle = `rgba(255, 255, 255, ${qdAlpha * 0.32})`;
      ctx.strokeStyle = `rgba(255, 255, 255, ${qdAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(qdX, qdY, unit * (0.08 + qdProg * 0.18), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // 3. LIVE DRIFTING STANDBY CRYOGENIC BOIL-OFF VAPOUR RINGS (sp < 0.080)
  if (sp < 0.080 && !reducedMotion) {
    const cryoFade = 1 - smoothstep(0.055, 0.080, sp);
    const originX = padX + unit * 0.25;
    const originY = towerBaseY - unit * 2.15;
    for (let i = 0; i < 4; i++) {
      const p = (t * 0.55 + i * 0.25) % 1;
      const alpha = Math.sin(p * Math.PI) * 0.36 * cryoFade;
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(originX + p * unit * 0.72, originY - p * unit * 0.18, unit * (0.04 + p * 0.14), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 4. STEP 03 ANIMATED WATER DELUGE QUENCH SPRAY JETS
  if (sp >= 0.125 && sp < 0.215) {
    const delugeProg = (sp - 0.125) / 0.090;
    const alpha = Math.sin(delugeProg * Math.PI) * (0.62 + (reducedMotion ? 0 : Math.sin(t * 48) * 0.18));
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([6, 4]);
    ctx.lineDashOffset = reducedMotion ? 0 : -t * 140;
    for (const ox of [-0.42, -0.34, 0.34, 0.42]) {
      const sx = padX + ox * unit;
      const dir = ox < 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(sx, mlpTopY + unit * 0.03);
      ctx.lineTo(sx + dir * unit * 0.30, mlpTopY + unit * 0.30);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // 5. LIVE BILLOWING MONOCHROME TRENCH STEAM CLOUDS (Step 01 light smoke -> Step 03 massive deluge!)
  if (sp >= 0.050 && sp < 0.260) {
    const density =
      sp < 0.125
        ? smoothstep(0.050, 0.125, sp) * 0.45
        : sp < 0.170
          ? 0.45 + smoothstep(0.125, 0.168, sp) * 0.55
          : 1 - smoothstep(0.175, 0.260, sp);

    for (let i = 0; i < puffs.length; i++) {
      const p = puffs[i];
      if (!reducedMotion) {
        p.age += dt;
        if (p.age >= p.life) {
          p.age = 0;
          p.x = p.dirX * (0.36 + (i % 5) * 0.08);
          p.y = 0.06;
          p.vx = p.dirX * (2.6 + ((i * 19) % 10) * 0.24);
          p.vy = -(0.14 + ((i * 13) % 7) * 0.05);
        } else {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= Math.pow(0.26, dt);
          p.vy -= 0.52 * dt; // Hot steam billows upward
        }
      }

      const lf = clamp(p.age / p.life, 0, 1);
      const puffAlpha = Math.sin(lf * Math.PI) * 0.65 * density;
      if (puffAlpha < 0.02) continue;

      const px = padX + p.x * unit;
      const py = padY + p.y * unit;
      const pr = (p.baseR + lf * 0.48) * unit * (0.65 + density * 0.55);

      ctx.fillStyle = `rgba(255, 255, 255, ${puffAlpha * 0.26})`;
      ctx.strokeStyle = `rgba(255, 255, 255, ${puffAlpha * 0.82})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // 6. LIVE FLYING MONOCHROME TRENCH SPARKS (Step 01 Ignition -> Liftoff)
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
        s.vx = dir * (2.8 + ((i * 23) % 10) * 0.30);
        s.vy = -(1.0 + ((i * 17) % 10) * 0.20);
      } else {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 4.6 * dt;
      }
      const lf = clamp(s.age / s.life, 0, 1);
      ctx.globalAlpha = (1 - lf) * 0.92 * sparkRamp;
      ctx.fillRect(padX + s.x * unit, padY + s.y * unit, 2.2, 2.2);
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
