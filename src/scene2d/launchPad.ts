import {
  type Scene2DFrameContext,
  clamp,
  easeOutCubic,
  smoothstep,
  mulberry32,
} from './types';
import { getLaunchPadDropPx } from './sriharikotaTerrain';

interface SteamPuff {
  dirX: -1 | 1;
  x: number; // in units relative to pad center
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  baseR: number;
}

interface TrenchSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
}

interface CryoWisp {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  r: number;
}

let steamPuffs: SteamPuff[] | null = null;
let trenchSparks: TrenchSpark[] | null = null;
let cryoWisps: CryoWisp[] | null = null;

function initParticles(): {
  puffs: SteamPuff[];
  sparks: TrenchSpark[];
  cryo: CryoWisp[];
} {
  if (steamPuffs && trenchSparks && cryoWisps) {
    return { puffs: steamPuffs, sparks: trenchSparks, cryo: cryoWisps };
  }

  const rand = mulberry32(31415);

  steamPuffs = [];
  for (let i = 0; i < 46; i++) {
    const dirX: -1 | 1 = i % 2 === 0 ? 1 : -1;
    steamPuffs.push({
      dirX,
      x: dirX * (0.45 + rand() * 0.35),
      y: 0.08 + (rand() - 0.5) * 0.14,
      vx: dirX * (2.2 + rand() * 2.4),
      vy: -(0.12 + rand() * 0.25),
      age: rand() * 1.6,
      life: 1.3 + rand() * 1.2,
      baseR: 0.26 + rand() * 0.22,
    });
  }

  trenchSparks = [];
  for (let i = 0; i < 36; i++) {
    const dirX = i % 2 === 0 ? 1 : -1;
    trenchSparks.push({
      x: dirX * (0.3 + rand() * 0.25),
      y: 0.02,
      vx: dirX * (2.6 + rand() * 3.0),
      vy: -(0.8 + rand() * 1.9),
      age: rand() * 0.7,
      life: 0.45 + rand() * 0.55,
      size: 1.4 + rand() * 2.0,
    });
  }

  cryoWisps = [];
  for (let i = 0; i < 18; i++) {
    cryoWisps.push({
      x: -0.28,
      y: -1.65,
      vx: 0.38 + rand() * 0.35,
      vy: -(0.06 + rand() * 0.12),
      age: rand() * 1.8,
      life: 1.4 + rand() * 1.1,
      r: 0.10 + rand() * 0.10,
    });
  }

  return { puffs: steamPuffs, sparks: trenchSparks, cryo: cryoWisps };
}

function drawAviationBeacon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  pulse: number
): void {
  // Soft additive red bloom halo
  const haloR = radius * (4.5 + pulse * 5.5);
  const grad = ctx.createRadialGradient(x, y, 0, x, y, haloR);
  grad.addColorStop(0.0, `rgba(255, 160, 160, ${0.75 + pulse * 0.25})`);
  grad.addColorStop(0.25, `rgba(255, 34, 34, ${0.42 + pulse * 0.48})`);
  grad.addColorStop(0.65, `rgba(210, 12, 12, ${0.12 + pulse * 0.18})`);
  grad.addColorStop(1.0, 'rgba(180, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, haloR, 0, Math.PI * 2);
  ctx.fill();

  // Lamp filament dot
  ctx.fillStyle = pulse > 0.25 ? '#ff9898' : '#ef4444';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * BACK LAYER (drawn behind the Rocket):
 * - 4 distant perimeter lightning protection masts with blinking red beacons
 * - Spherical Sriharikota water deluge storage tower on the east flank
 * - Open-lattice steel Umbilical Service Gantry Tower with X-braces & platforms
 * - Mobile Launch Platform (MLP) foundation, flame trench pit & incandescent deflector wedge
 */
export function renderLaunchPadBack(frame: Scene2DFrameContext): void {
  const { ctx, h, sp, t, mouseX, vehicleAnchorX, groundY, unit } = frame;
  if (sp > 0.275) return;

  const dropPx = getLaunchPadDropPx(sp, h);
  const padX = vehicleAnchorX - mouseX * 14;
  const padY = groundY + dropPx;

  if (padY - unit * 4.5 > h) return;

  // Synchronized 1 Hz aviation obstacle strobe pulse
  const beaconCycle = t % 1.0;
  const beaconPulse =
    beaconCycle < 0.44 ? Math.sin((beaconCycle / 0.44) * Math.PI) : 0;

  ctx.save();

  // 1. DISTANT PERIMETER LIGHTNING PROTECTION MASTS (4 slender pylons)
  const masts = [
    { ox: -3.9, hUnits: 3.1 },
    { ox: -2.05, hUnits: 3.45 },
    { ox: 2.35, hUnits: 3.35 },
    { ox: 4.25, hUnits: 2.95 },
  ];
  for (const m of masts) {
    const mx = vehicleAnchorX + m.ox * unit - mouseX * 9;
    const baseY = padY - unit * 0.10;
    const topY = baseY - m.hUnits * unit;

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.72)';
    ctx.lineWidth = Math.max(1.2, unit * 0.022);
    ctx.beginPath();
    ctx.moveTo(mx - unit * 0.025, baseY);
    ctx.lineTo(mx, topY);
    ctx.lineTo(mx + unit * 0.025, baseY);
    ctx.stroke();

    // Mast lamp housing
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(mx - unit * 0.024, topY - unit * 0.03, unit * 0.048, unit * 0.035);
    drawAviationBeacon(ctx, mx, topY - unit * 0.042, Math.max(1.8, unit * 0.022), beaconPulse);
  }

  // 2. DISTANT SPHERICAL WATER DELUGE STORAGE TOWER (East side)
  const wtX = vehicleAnchorX + unit * 3.15 - mouseX * 10;
  const wtBaseY = padY - unit * 0.06;
  const wtH = unit * 1.55;
  const wtR = unit * 0.42;

  // Steel support column & diagonal struts
  ctx.fillStyle = '#475569';
  ctx.fillRect(wtX - unit * 0.09, wtBaseY - wtH, unit * 0.18, wtH);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = Math.max(1, unit * 0.02);
  ctx.beginPath();
  ctx.moveTo(wtX - unit * 0.24, wtBaseY);
  ctx.lineTo(wtX - unit * 0.09, wtBaseY - wtH * 0.85);
  ctx.moveTo(wtX + unit * 0.24, wtBaseY);
  ctx.lineTo(wtX + unit * 0.09, wtBaseY - wtH * 0.85);
  ctx.stroke();

  // 2.5D shaded metallic-white water sphere (warm sunrise light on right)
  const sphereY = wtBaseY - wtH - wtR * 0.72;
  const wtGrad = ctx.createRadialGradient(
    wtX + wtR * 0.35,
    sphereY - wtR * 0.28,
    wtR * 0.08,
    wtX,
    sphereY,
    wtR
  );
  wtGrad.addColorStop(0.0, '#fff7ed');
  wtGrad.addColorStop(0.45, '#cbd5e1');
  wtGrad.addColorStop(0.85, '#64748b');
  wtGrad.addColorStop(1.0, '#334155');
  ctx.fillStyle = wtGrad;
  ctx.beginPath();
  ctx.arc(wtX, sphereY, wtR, 0, Math.PI * 2);
  ctx.fill();

  // 3. OPEN-LATTICE UMBILICAL SERVICE GANTRY TOWER (Positioned slightly left behind rocket)
  const towerW = unit * 0.62;
  const towerH = unit * 3.45;
  const towerCx = padX - unit * 0.78;
  const towerBaseY = padY - unit * 0.05;
  const towerTopY = towerBaseY - towerH;
  const tiers = 6;
  const tierH = towerH / tiers;

  // Inner dark shadow elevator core
  ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
  ctx.fillRect(towerCx - towerW * 0.18, towerTopY, towerW * 0.36, towerH);

  // Diagonal steel X-bracing per lattice bay
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = Math.max(1.2, unit * 0.022);
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

    // Horizontal steel platform deck + yellow safety kick-plate
    ctx.fillStyle = '#334155';
    ctx.fillRect(lx - unit * 0.04, y1 - unit * 0.03, towerW + unit * 0.08, unit * 0.055);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(lx - unit * 0.04, y1 - unit * 0.045, towerW + unit * 0.08, unit * 0.016);
  }

  // Left & Right main galvanized steel corner columns (eastern edge catches warm sun)
  const colW = Math.max(2.5, unit * 0.055);
  ctx.fillStyle = '#475569';
  ctx.fillRect(towerCx - towerW * 0.5, towerTopY, colW, towerH);
  const eastColGrad = ctx.createLinearGradient(
    towerCx + towerW * 0.5 - colW,
    0,
    towerCx + towerW * 0.5,
    0
  );
  eastColGrad.addColorStop(0, '#475569');
  eastColGrad.addColorStop(1, '#cbd5e1');
  ctx.fillStyle = eastColGrad;
  ctx.fillRect(towerCx + towerW * 0.5 - colW, towerTopY, colW, towerH);

  // Tower apex lightning mast & blinking red aviation strobe
  const mastTopY = towerTopY - unit * 0.58;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = Math.max(1.5, unit * 0.025);
  ctx.beginPath();
  ctx.moveTo(towerCx, towerTopY);
  ctx.lineTo(towerCx, mastTopY);
  ctx.stroke();
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(towerCx - unit * 0.03, mastTopY - unit * 0.02, unit * 0.06, unit * 0.04);
  drawAviationBeacon(ctx, towerCx, mastTopY - unit * 0.04, Math.max(2.2, unit * 0.028), beaconPulse);

  // 4. MOBILE LAUNCH PLATFORM (MLP) FOUNDATION, FLAME TRENCH & INCANDESCENT DEFLECTOR
  const mlpW = unit * 2.15;
  const mlpH = unit * 0.34;
  const mlpTopY = padY - unit * 0.16;
  const trenchW = unit * 0.84;

  // Dark central flame trench cutout pit
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(padX - trenchW * 0.5, mlpTopY + unit * 0.05, trenchW, mlpH);

  // Double-sided Steel Flame Deflector Wedge beneath engines
  const fireRamp = sp >= 0.035 && sp < 0.240
    ? Math.min((sp - 0.035) / 0.025, 1.0) * (sp < 0.170 ? 1.0 : Math.max(0, 1.0 - (sp - 0.170) / 0.070))
    : 0;
  const heatFlicker = fireRamp * (0.85 + 0.15 * Math.sin(t * 42));

  ctx.beginPath();
  ctx.moveTo(padX, mlpTopY + unit * 0.09);
  ctx.lineTo(padX - trenchW * 0.44, mlpTopY + mlpH + unit * 0.02);
  ctx.lineTo(padX + trenchW * 0.44, mlpTopY + mlpH + unit * 0.02);
  ctx.closePath();

  if (heatFlicker > 0.02) {
    const defGrad = ctx.createLinearGradient(padX, mlpTopY + unit * 0.08, padX, mlpTopY + mlpH);
    defGrad.addColorStop(0.0, `rgba(255, 224, 130, ${0.4 + heatFlicker * 0.6})`);
    defGrad.addColorStop(0.35, `rgba(249, 115, 22, ${0.55 + heatFlicker * 0.45})`);
    defGrad.addColorStop(0.85, '#7c2d12');
    defGrad.addColorStop(1.0, '#334155');
    ctx.fillStyle = defGrad;
  } else {
    ctx.fillStyle = '#334155';
  }
  ctx.fill();

  // Warm radiant trench fire glow spilling outward during ignition
  if (heatFlicker > 0.02) {
    const trenchGlow = ctx.createRadialGradient(
      padX,
      mlpTopY + unit * 0.16,
      unit * 0.05,
      padX,
      mlpTopY + unit * 0.16,
      unit * 1.95
    );
    trenchGlow.addColorStop(0.0, `rgba(255, 215, 110, ${0.65 * heatFlicker})`);
    trenchGlow.addColorStop(0.35, `rgba(249, 115, 22, ${0.32 * heatFlicker})`);
    trenchGlow.addColorStop(1.0, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = trenchGlow;
    ctx.beginPath();
    ctx.arc(padX, mlpTopY + unit * 0.16, unit * 1.95, 0, Math.PI * 2);
    ctx.fill();
  }

  // Left & Right Concrete Foundation Piers flanking the flame trench
  const pierW = (mlpW - trenchW) * 0.5;
  ctx.fillStyle = '#475569';
  ctx.fillRect(padX - mlpW * 0.5, mlpTopY + unit * 0.06, pierW, mlpH - unit * 0.02);
  ctx.fillRect(padX + trenchW * 0.5, mlpTopY + unit * 0.06, pierW, mlpH - unit * 0.02);

  // Heavy galvanized steel MLP launch decks + crisp top highlight bevel
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(padX - mlpW * 0.5 - unit * 0.05, mlpTopY, pierW + unit * 0.07, unit * 0.065);
  ctx.fillRect(padX + trenchW * 0.5 - unit * 0.02, mlpTopY, pierW + unit * 0.07, unit * 0.065);

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(padX - mlpW * 0.5 - unit * 0.05, mlpTopY, pierW + unit * 0.07, 1.5);
  ctx.fillRect(padX + trenchW * 0.5 - unit * 0.02, mlpTopY, pierW + unit * 0.07, 1.5);

  // Safety yellow perimeter kick-plates on outer MLP edges
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(padX - mlpW * 0.5 - unit * 0.05, mlpTopY - unit * 0.03, unit * 0.025, unit * 0.035);
  ctx.fillRect(padX + mlpW * 0.5 + unit * 0.025, mlpTopY - unit * 0.03, unit * 0.025, unit * 0.035);

  ctx.restore();
}

/**
 * FRONT LAYER (drawn in front of the Rocket):
 * - 4 Hold-Down Launch Support Clamps (swing outward at Step 02)
 * - 3 Retractable Umbilical Service Arms + Step 02 Cryogenic QD Purge Puffs
 * - Standby Cryogenic LOX Boil-Off Vapour Wisps
 * - Step 03 Water Deluge Quench Spray Jets + Bilateral Billowing Trench Steam
 * - Step 01–04 Flying Incandescent Trench Sparks
 */
export function renderLaunchPadFront(frame: Scene2DFrameContext): void {
  const { ctx, h, sp, t, dt, mouseX, vehicleAnchorX, groundY, unit, reducedMotion } = frame;
  if (sp > 0.275) return;

  const dropPx = getLaunchPadDropPx(sp, h);
  const padX = vehicleAnchorX - mouseX * 14;
  const padY = groundY + dropPx;
  if (padY - unit * 4.5 > h) return;

  const mlpTopY = padY - unit * 0.16;
  const towerCx = padX - unit * 0.78;
  const towerBaseY = padY - unit * 0.05;
  const { puffs, sparks, cryo } = initParticles();

  ctx.save();

  // 1. 4 ARTICULATED HOLD-DOWN LAUNCH SUPPORT CLAMPS (Disengage outward at Step 02)
  const clampOpen = sp < 0.080 ? 0 : easeOutCubic((sp - 0.080) / 0.045);
  const clampPositions = [-0.34, -0.19, 0.19, 0.34];
  for (let i = 0; i < clampPositions.length; i++) {
    const cx = padX + clampPositions[i] * unit;
    const side = clampPositions[i] < 0 ? -1 : 1;
    ctx.save();
    ctx.translate(cx, mlpTopY);
    ctx.rotate(side * clampOpen * 0.32);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-unit * 0.032, -unit * 0.095, unit * 0.064, unit * 0.095);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-unit * 0.022, -unit * 0.125, unit * 0.044, unit * 0.032);
    ctx.restore();
  }

  // 2. RETRACTABLE UMBILICAL SERVICE ARMS + STEP 02 CRYOGENIC QD PURGE PUFFS
  // Arms connect from the gantry tower right edge across to the rocket body,
  // then pivot cleanly upward/retracted during Step 02 (sp 0.080 -> 0.125).
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
    const armLen = arm.lenU * unit;
    // Perspective swing: rotates & foreshortens cleanly as it swings 55° back behind the gantry
    const visualLen = armLen * (1 - armRetract * 0.62);
    const swingTilt = -armRetract * 0.36;

    ctx.save();
    ctx.translate(towerRightEdge, pivotY);
    ctx.rotate(swingTilt);

    // Truss arm beam
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, -unit * 0.028, visualLen, unit * 0.052);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, -unit * 0.028, visualLen, 1.4);

    // Red cryogenic LOX/LH2 feed pipe hanging underneath
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = Math.max(1.5, unit * 0.022);
    ctx.beginPath();
    ctx.moveTo(unit * 0.05, unit * 0.03);
    ctx.lineTo(visualLen * 0.92, unit * 0.03);
    ctx.stroke();

    // Quick-Disconnect (QD) metallic clamp coupler head
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(visualLen - unit * 0.03, -unit * 0.04, unit * 0.045, unit * 0.085);

    ctx.restore();

    // Step 02 Cryogenic Quick-Disconnect Purge Puff bursting at the decoupled tip
    if (sp >= 0.080 && sp < 0.132) {
      const qdProg = (sp - 0.080) / 0.052;
      const qdAlpha = Math.sin(qdProg * Math.PI) * 0.65;
      const qdX = towerRightEdge + visualLen + qdProg * unit * 0.12;
      const qdY = pivotY - qdProg * unit * 0.14;
      const qdR = unit * (0.14 + qdProg * 0.26);

      const qdGrad = ctx.createRadialGradient(qdX, qdY, 0, qdX, qdY, qdR);
      qdGrad.addColorStop(0.0, `rgba(240, 249, 255, ${qdAlpha})`);
      qdGrad.addColorStop(0.55, `rgba(224, 242, 254, ${qdAlpha * 0.45})`);
      qdGrad.addColorStop(1.0, 'rgba(224, 242, 254, 0)');
      ctx.fillStyle = qdGrad;
      ctx.beginPath();
      ctx.arc(qdX, qdY, qdR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. STANDBY CRYOGENIC LOX BOIL-OFF VAPOUR BLEED (sp < 0.080)
  if (sp < 0.080) {
    const cryoFade = 1 - smoothstep(0.050, 0.080, sp);
    const ventOriginX = padX - unit * 0.18;
    const ventOriginY = towerBaseY - unit * 2.15;

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
      const alpha = Math.sin(p * Math.PI) * 0.34 * cryoFade;
      const wx = ventOriginX + c.x * unit;
      const wy = ventOriginY + c.y * unit;
      const wr = (c.r + p * 0.22) * unit;

      const grad = ctx.createRadialGradient(wx, wy, 0, wx, wy, wr);
      grad.addColorStop(0.0, `rgba(240, 248, 255, ${alpha})`);
      grad.addColorStop(1.0, 'rgba(240, 248, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(wx, wy, wr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. STEP 03 HIGH-FLOW WATER DELUGE QUENCH SPRAY JETS (sp 0.125 -> 0.215)
  if (sp >= 0.125 && sp < 0.215) {
    const delugeProg = (sp - 0.125) / 0.090;
    const delugeAlpha = Math.sin(delugeProg * Math.PI) * (0.58 + 0.14 * Math.sin(t * 44));
    const sprayOffsets = [-0.42, -0.34, 0.34, 0.42];

    for (let i = 0; i < sprayOffsets.length; i++) {
      const ox = sprayOffsets[i];
      const sx = padX + ox * unit;
      const dir = ox < 0 ? 1 : -1;

      const sprayGrad = ctx.createLinearGradient(
        sx,
        mlpTopY + unit * 0.04,
        sx + dir * unit * 0.26,
        mlpTopY + unit * 0.32
      );
      sprayGrad.addColorStop(0.0, `rgba(224, 242, 254, ${delugeAlpha})`);
      sprayGrad.addColorStop(1.0, 'rgba(224, 242, 254, 0)');

      ctx.fillStyle = sprayGrad;
      ctx.beginPath();
      ctx.moveTo(sx, mlpTopY + unit * 0.03);
      ctx.lineTo(sx + dir * unit * 0.32, mlpTopY + unit * 0.24);
      ctx.lineTo(sx + dir * unit * 0.18, mlpTopY + unit * 0.34);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 5. STEP 03–04 BILATERAL BILLOWING TRENCH STEAM CLOUDS (sp 0.125 -> 0.260)
  if (sp >= 0.125 && sp < 0.260) {
    const density =
      sp < 0.170
        ? smoothstep(0.125, 0.168, sp)
        : 1 - smoothstep(0.175, 0.260, sp);

    for (let i = 0; i < puffs.length; i++) {
      const p = puffs[i];
      if (!reducedMotion) {
        p.age += dt;
        if (p.age >= p.life) {
          p.age = 0;
          p.x = p.dirX * (0.38 + (i % 5) * 0.08);
          p.y = 0.08;
          p.vx = p.dirX * (2.2 + ((i * 19) % 10) * 0.22);
          p.vy = -(0.12 + ((i * 13) % 7) * 0.04);
        } else {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= Math.pow(0.28, dt); // Smooth horizontal air drag
          p.vy -= 0.48 * dt;          // Hot buoyant steam rises as it rolls out
        }
      }

      const lifeFrac = clamp(p.age / p.life, 0, 1);
      const puffAlpha = Math.sin(lifeFrac * Math.PI) * 0.56 * density;
      if (puffAlpha < 0.01) continue;

      const px = padX + p.x * unit;
      const py = padY + p.y * unit;
      const pr = (p.baseR + lifeFrac * 0.72) * unit * (0.75 + density * 0.45);

      // Authentic sunrise side-lit coloration + fiery orange trench underglow near center
      const nearFire = clamp(1 - Math.abs(p.x) / 1.45, 0, 1);
      const rCol = p.dirX > 0 ? 255 : Math.round(215 + nearFire * 40);
      const gCol = p.dirX > 0 ? Math.round(234 - nearFire * 48) : Math.round(225 - nearFire * 58);
      const bCol = p.dirX > 0 ? Math.round(205 - nearFire * 115) : Math.round(238 - nearFire * 145);

      const sGrad = ctx.createRadialGradient(px, py - pr * 0.15, pr * 0.08, px, py, pr);
      sGrad.addColorStop(0.0, `rgba(${rCol}, ${gCol}, ${bCol}, ${puffAlpha})`);
      sGrad.addColorStop(0.55, `rgba(${rCol - 15}, ${gCol - 10}, ${bCol}, ${puffAlpha * 0.52})`);
      sGrad.addColorStop(1.0, `rgba(${rCol - 25}, ${gCol - 15}, ${bCol}, 0)`);

      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 6. STEP 01–04 FLYING INCANDESCENT TRENCH SPARKS (sp 0.035 -> 0.220)
  if (sp >= 0.035 && sp < 0.220) {
    const sparkRamp = smoothstep(0.035, 0.060, sp) * (1 - smoothstep(0.170, 0.220, sp));
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      if (!reducedMotion) {
        s.age += dt;
        if (s.age >= s.life) {
          s.age = 0;
          const dir = i % 2 === 0 ? 1 : -1;
          s.x = dir * (0.28 + (i % 4) * 0.08);
          s.y = 0.04;
          s.vx = dir * (2.6 + ((i * 23) % 10) * 0.28);
          s.vy = -(0.9 + ((i * 17) % 10) * 0.18);
        } else {
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.vy += 4.2 * dt; // Gravity arc
        }
      }
      const lifeFrac = clamp(s.age / s.life, 0, 1);
      const alpha = (1 - lifeFrac) * 0.92 * sparkRamp;
      if (alpha < 0.02) continue;

      const sx = padX + s.x * unit;
      const sy = padY + s.y * unit;
      ctx.fillStyle = lifeFrac < 0.35 ? `rgba(255, 248, 200, ${alpha})` : `rgba(249, 115, 22, ${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
