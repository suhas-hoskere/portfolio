import {
  type Scene2DFrameContext,
  clamp,
  easeOutCubic,
  smoothstep,
} from './types';
import { getLaunchPadDropPx } from './sriharikotaTerrain';

/**
 * Pure monochrome Black & White Launch Pad — BACK LAYER (drawn behind the Rocket):
 * - 4 slender lightning protection masts with crisp white beacon markers
 * - Monochrome spherical water deluge tower
 * - Open-lattice steel Umbilical Service Gantry Tower with X-bracing
 * - Concrete & steel Mobile Launch Platform (MLP), flame trench & white-hot deflector wedge
 */
export function renderLaunchPadBack(frame: Scene2DFrameContext): void {
  const { ctx, h, sp, mouseX, vehicleAnchorX, groundY, unit } = frame;
  if (sp > 0.275) return;

  const dropPx = getLaunchPadDropPx(sp, h);
  const padX = vehicleAnchorX - mouseX * 10;
  const padY = groundY + dropPx;
  if (padY - unit * 4.5 > h) return;

  ctx.save();

  // 1. 4 PERIMETER SLENDER LIGHTNING PROTECTION MASTS
  const masts = [
    { ox: -3.7, hU: 3.0 },
    { ox: -1.95, hU: 3.35 },
    { ox: 2.25, hU: 3.25 },
    { ox: 4.0, hU: 2.85 },
  ];
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 1;
  for (const m of masts) {
    const mx = vehicleAnchorX + m.ox * unit - mouseX * 6;
    const baseY = padY - unit * 0.10;
    const topY = baseY - m.hU * unit;
    ctx.beginPath();
    ctx.moveTo(mx - unit * 0.02, baseY);
    ctx.lineTo(mx, topY);
    ctx.lineTo(mx + unit * 0.02, baseY);
    ctx.stroke();

    // Crisp white aviation beacon dot + ring
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(mx, topY - 3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.arc(mx, topY - 3, 5.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 2. MONOCHROME SPHERICAL WATER DELUGE STORAGE TOWER (East flank)
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
  // Crisp shadow crescent on left side of sphere
  ctx.fillStyle = '#27272a';
  ctx.beginPath();
  ctx.arc(wtX, sphereY, wtR, Math.PI * 0.55, Math.PI * 1.45);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.arc(wtX, sphereY, wtR, 0, Math.PI * 2);
  ctx.stroke();

  // 3. OPEN-LATTICE UMBILICAL SERVICE GANTRY TOWER (Crisp Black & White Truss)
  const towerW = unit * 0.58;
  const towerH = unit * 3.40;
  const towerCx = padX - unit * 0.78;
  const towerBaseY = padY - unit * 0.05;
  const towerTopY = towerBaseY - towerH;
  const tiers = 6;
  const tierH = towerH / tiers;

  // Inner dark shadow elevator shaft
  ctx.fillStyle = '#09090b';
  ctx.fillRect(towerCx - towerW * 0.16, towerTopY, towerW * 0.32, towerH);

  // Diagonal X-bracing & horizontal service decks
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

  // Main vertical truss columns
  const colW = Math.max(2.5, unit * 0.05);
  ctx.fillStyle = '#27272a';
  ctx.fillRect(towerCx - towerW * 0.5, towerTopY, colW, towerH);
  ctx.fillStyle = '#d4d4d8';
  ctx.fillRect(towerCx + towerW * 0.5 - colW, towerTopY, colW, towerH);

  // Tower top lightning mast & crisp white beacon
  const mastTopY = towerTopY - unit * 0.55;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(towerCx, towerTopY);
  ctx.lineTo(towerCx, mastTopY);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(towerCx, mastTopY - 3, 2.6, 0, Math.PI * 2);
  ctx.fill();

  // 4. MOBILE LAUNCH PLATFORM (MLP), FLAME TRENCH & MONOCHROME DEFLECTOR WEDGE
  const mlpW = unit * 2.1;
  const mlpH = unit * 0.34;
  const mlpTopY = padY - unit * 0.16;
  const trenchW = unit * 0.82;

  ctx.fillStyle = '#050505';
  ctx.fillRect(padX - trenchW * 0.5, mlpTopY + unit * 0.05, trenchW, mlpH);

  // Double-sided Flame Deflector Wedge (flashes crisp white-hot on ignition)
  const fireRamp =
    sp >= 0.035 && sp < 0.240
      ? clamp((sp - 0.035) / 0.025, 0, 1) *
        (sp < 0.170 ? 1 : Math.max(0, 1 - (sp - 0.170) / 0.070))
      : 0;

  ctx.fillStyle = fireRamp > 0.05 ? `rgba(255, 255, 255, ${0.25 + fireRamp * 0.72})` : '#27272a';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(padX, mlpTopY + unit * 0.09);
  ctx.lineTo(padX - trenchW * 0.44, mlpTopY + mlpH);
  ctx.lineTo(padX + trenchW * 0.44, mlpTopY + mlpH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Left & Right Concrete Foundation Piers + Steel Decks
  const pierW = (mlpW - trenchW) * 0.5;
  ctx.fillStyle = '#18181b';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillRect(padX - mlpW * 0.5, mlpTopY + unit * 0.06, pierW, mlpH - unit * 0.02);
  ctx.strokeRect(padX - mlpW * 0.5, mlpTopY + unit * 0.06, pierW, mlpH - unit * 0.02);
  ctx.fillRect(padX + trenchW * 0.5, mlpTopY + unit * 0.06, pierW, mlpH - unit * 0.02);
  ctx.strokeRect(padX + trenchW * 0.5, mlpTopY + unit * 0.06, pierW, mlpH - unit * 0.02);

  // Top steel launch deck plates
  ctx.fillStyle = '#e4e4e7';
  ctx.fillRect(padX - mlpW * 0.5 - unit * 0.04, mlpTopY, pierW + unit * 0.06, unit * 0.055);
  ctx.fillRect(padX + trenchW * 0.5 - unit * 0.02, mlpTopY, pierW + unit * 0.06, unit * 0.055);

  ctx.restore();
}

/**
 * Pure monochrome Black & White Launch Pad — FRONT LAYER:
 * - 4 Hold-Down Launch Support Clamps (swing open cleanly at Step 02)
 * - 3 Retractable Umbilical Service Arms + Step 02 Cryogenic QD Purge Arcs
 * - Step 03 Water Deluge Quench Spray Lines & Deterministic Billowing Monochrome Steam Clouds
 * Zero radial gradients, zero heavy particle loops!
 */
export function renderLaunchPadFront(frame: Scene2DFrameContext): void {
  const { ctx, h, sp, mouseX, vehicleAnchorX, groundY, unit } = frame;
  if (sp > 0.275) return;

  const dropPx = getLaunchPadDropPx(sp, h);
  const padX = vehicleAnchorX - mouseX * 10;
  const padY = groundY + dropPx;
  if (padY - unit * 4.5 > h) return;

  const mlpTopY = padY - unit * 0.16;
  const towerCx = padX - unit * 0.78;
  const towerBaseY = padY - unit * 0.05;

  ctx.save();

  // 1. 4 HOLD-DOWN CLAMPS (Tilt outward at Step 02)
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

  // 2. RETRACTABLE UMBILICAL SERVICE ARMS + STEP 02 QD PURGE PUFFS
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

    // Crisp monochrome QD purge puff circles on decouple (Step 02)
    if (sp >= 0.080 && sp < 0.132) {
      const qdProg = (sp - 0.080) / 0.052;
      const qdAlpha = Math.sin(qdProg * Math.PI) * 0.52;
      const qdX = towerRightEdge + visualLen + qdProg * unit * 0.14;
      const qdY = pivotY - qdProg * unit * 0.12;
      ctx.fillStyle = `rgba(255, 255, 255, ${qdAlpha * 0.35})`;
      ctx.strokeStyle = `rgba(255, 255, 255, ${qdAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(qdX, qdY, unit * (0.08 + qdProg * 0.16), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // 3. STEP 03 WATER DELUGE QUENCH SPRAY LINES (sp 0.125 -> 0.215)
  if (sp >= 0.125 && sp < 0.215) {
    const delugeProg = (sp - 0.125) / 0.090;
    const alpha = Math.sin(delugeProg * Math.PI) * 0.65;
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 1.4;
    for (const ox of [-0.42, -0.34, 0.34, 0.42]) {
      const sx = padX + ox * unit;
      const dir = ox < 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(sx, mlpTopY + unit * 0.03);
      ctx.lineTo(sx + dir * unit * 0.28, mlpTopY + unit * 0.28);
      ctx.stroke();
    }
  }

  // 4. STEP 03–04 CRISP MONOCHROME BILLOWING TRENCH STEAM CLOUDS (Pure flat vector circles, zero lag)
  if (sp >= 0.125 && sp < 0.260) {
    const density =
      sp < 0.170
        ? smoothstep(0.125, 0.168, sp)
        : 1 - smoothstep(0.175, 0.260, sp);
    const spread = smoothstep(0.125, 0.220, sp);

    for (const dir of [-1, 1] as const) {
      for (let i = 0; i < 6; i++) {
        const f = i / 5;
        const dist = (0.48 + f * 2.15 * (0.35 + spread * 0.85)) * unit;
        const lift = (0.04 + f * f * 0.65 * spread) * unit;
        const r = (0.22 + f * 0.38) * unit * (0.65 + density * 0.45);
        const px = padX + dir * dist;
        const py = padY - lift;
        const alpha = (1 - f * 0.45) * density;

        ctx.fillStyle = `rgba(255, 255, 255, ${0.14 * alpha})`;
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.42 * alpha})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}
