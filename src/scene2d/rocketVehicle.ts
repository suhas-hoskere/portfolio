import {
  type Scene2DFrameContext,
  clamp,
  easeOutCubic,
  smoothstep,
  mulberry32,
} from './types';

interface ExhaustSpark {
  nozzleIdx: 0 | 1 | 2 | 3; // 0: L booster, 1: R booster, 2: L Vikas, 3: R Vikas
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
}

let exhaustParticles: ExhaustSpark[] | null = null;

function getExhaustParticles(): ExhaustSpark[] {
  if (exhaustParticles) return exhaustParticles;
  const rand = mulberry32(8080);
  const list: ExhaustSpark[] = [];
  for (let i = 0; i < 56; i++) {
    const nozzleIdx = (i < 18 ? 0 : i < 36 ? 1 : i < 46 ? 2 : 3) as 0 | 1 | 2 | 3;
    list.push({
      nozzleIdx,
      x: 0,
      y: 0,
      vx: (rand() - 0.5) * 0.45,
      vy: 3.4 + rand() * 3.8,
      age: rand() * 0.45,
      life: 0.25 + rand() * 0.28,
      size: 1.6 + rand() * 2.4,
    });
  }
  exhaustParticles = list;
  return list;
}

/** Creates a 2.5D sunlit cylindrical metallic gradient (sun from eastern right +X) */
function makeCylinderGrad(
  ctx: CanvasRenderingContext2D,
  xLeft: number,
  xRight: number,
  variant: 'white' | 'dark' | 'cryo' | 'metal'
): CanvasGradient {
  const g = ctx.createLinearGradient(xLeft, 0, xRight, 0);
  if (variant === 'white') {
    g.addColorStop(0.0, '#64748b');
    g.addColorStop(0.22, '#cbd5e1');
    g.addColorStop(0.55, '#f1f5f9');
    g.addColorStop(0.76, '#ffffff');
    g.addColorStop(0.92, '#fde68a'); // Subtle warm sunrise rim
    g.addColorStop(1.0, '#cbd5e1');
  } else if (variant === 'cryo') {
    g.addColorStop(0.0, '#475569');
    g.addColorStop(0.25, '#bae6fd'); // Subtle LOX frost sheen
    g.addColorStop(0.60, '#f0f9ff');
    g.addColorStop(0.80, '#ffffff');
    g.addColorStop(1.0, '#94a3b8');
  } else if (variant === 'dark') {
    g.addColorStop(0.0, '#0f172a');
    g.addColorStop(0.35, '#1e293b');
    g.addColorStop(0.72, '#475569');
    g.addColorStop(0.90, '#64748b');
    g.addColorStop(1.0, '#1e293b');
  } else {
    g.addColorStop(0.0, '#0f172a');
    g.addColorStop(0.45, '#334155');
    g.addColorStop(0.75, '#94a3b8');
    g.addColorStop(1.0, '#1e293b');
  }
  return g;
}

/** Draws a single soft camera-style supersonic engine flame plume with optional Mach diamonds */
function drawEnginePlume(
  ctx: CanvasRenderingContext2D,
  nx: number,
  ny: number,
  width: number,
  length: number,
  fireRamp: number,
  t: number,
  withMachDiamonds: boolean
): void {
  if (fireRamp <= 0.01) return;

  const flicker = 1 + Math.sin(t * 58 + nx) * 0.08 + Math.cos(t * 92) * 0.04;
  const w = width * fireRamp * (0.95 + Math.sin(t * 36) * 0.05);
  const len = length * fireRamp * flicker;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // 1. Wide incandescent golden-orange outer flame envelope
  const outerGrad = ctx.createRadialGradient(nx, ny + len * 0.25, w * 0.1, nx, ny + len * 0.45, len * 0.72);
  outerGrad.addColorStop(0.0, `rgba(255, 245, 200, ${0.95 * fireRamp})`);
  outerGrad.addColorStop(0.28, `rgba(255, 185, 55, ${0.82 * fireRamp})`);
  outerGrad.addColorStop(0.62, `rgba(249, 100, 18, ${0.42 * fireRamp})`);
  outerGrad.addColorStop(1.0, 'rgba(220, 38, 12, 0)');

  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  ctx.moveTo(nx - w * 0.55, ny);
  ctx.quadraticCurveTo(nx - w * 1.45, ny + len * 0.55, nx, ny + len);
  ctx.quadraticCurveTo(nx + w * 1.45, ny + len * 0.55, nx + w * 0.55, ny);
  ctx.closePath();
  ctx.fill();

  // 2. Blinding white-hot supersonic inner core jet
  const coreLen = len * 0.56;
  const coreGrad = ctx.createLinearGradient(nx, ny, nx, ny + coreLen);
  coreGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.98 * fireRamp})`);
  coreGrad.addColorStop(0.55, `rgba(255, 246, 205, ${0.85 * fireRamp})`);
  coreGrad.addColorStop(1.0, 'rgba(255, 210, 110, 0)');

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.moveTo(nx - w * 0.36, ny);
  ctx.quadraticCurveTo(nx - w * 0.52, ny + coreLen * 0.65, nx, ny + coreLen);
  ctx.quadraticCurveTo(nx + w * 0.52, ny + coreLen * 0.65, nx + w * 0.36, ny);
  ctx.closePath();
  ctx.fill();

  // 3. Supersonic Mach Diamond Compression-Expansion Shock Cells (Vikas liquid core signature)
  if (withMachDiamonds && fireRamp > 0.25) {
    const shockAlpha = (0.72 + Math.sin(t * 76) * 0.16) * fireRamp;
    for (let d = 0; d < 3; d++) {
      const dy = ny + len * (0.14 + d * 0.14);
      const dw = w * (0.34 - d * 0.06);
      const dh = len * (0.065 - d * 0.01);

      ctx.fillStyle = `rgba(125, 245, 255, ${shockAlpha * (1 - d * 0.22)})`;
      ctx.beginPath();
      ctx.moveTo(nx, dy - dh);
      ctx.lineTo(nx + dw, dy);
      ctx.lineTo(nx, dy + dh);
      ctx.lineTo(nx - dw, dy);
      ctx.closePath();
      ctx.fill();

      // Bright center shock node
      ctx.fillStyle = `rgba(255, 255, 255, ${shockAlpha * (0.9 - d * 0.2)})`;
      ctx.beginPath();
      ctx.arc(nx, dy, dw * 0.38, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/** Draws a single S200 Solid Rocket Booster (left = -1, right = +1) */
function drawS200Booster(
  ctx: CanvasRenderingContext2D,
  side: -1 | 1,
  u: number,
  isBurning: boolean,
  fireRamp: number,
  sepProgress: number, // 0 = attached, 0..1 = separating
  t: number,
  blueprintMode: boolean
): void {
  const bw = u * 0.23; // Booster radius (total diameter 0.46u)
  const bodyH = u * 1.48;
  const noseH = u * 0.46;
  const topY = -bodyH;

  // Booster exhaust flame (active while attached, shuts off cleanly at separation)
  if (isBurning && sepProgress === 0) {
    drawEnginePlume(ctx, 0, u * 0.20, bw * 1.45, u * 2.25, fireRamp, t, false);
  }

  // Post-separation residual solid-motor burnout smoke trail (sepProgress > 0)
  if (sepProgress > 0 && sepProgress < 1) {
    const trailAlpha = (1 - sepProgress) * 0.58;
    for (let s = 0; s < 3; s++) {
      const sy = u * (0.28 + s * 0.42 + sepProgress * 0.55);
      const sr = u * (0.18 + s * 0.16 + sepProgress * 0.22);
      const tGrad = ctx.createRadialGradient(0, sy, 0, 0, sy, sr);
      tGrad.addColorStop(0.0, `rgba(241, 245, 249, ${trailAlpha * (1 - s * 0.25)})`);
      tGrad.addColorStop(1.0, 'rgba(226, 232, 240, 0)');
      ctx.fillStyle = tGrad;
      ctx.beginPath();
      ctx.arc(0, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (blueprintMode) {
    ctx.strokeStyle = '#22d3ee';
    ctx.fillStyle = 'rgba(6, 182, 212, 0.10)';
    ctx.lineWidth = 1.25;
    // Nose cone wireframe
    ctx.beginPath();
    ctx.moveTo(-bw, topY);
    ctx.lineTo(side * bw * 0.18, topY - noseH);
    ctx.lineTo(bw, topY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Solid propellant casing + internal grain dashed line
    ctx.strokeRect(-bw, topY, bw * 2, bodyH);
    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.65)';
    ctx.strokeRect(-bw * 0.65, topY + u * 0.1, bw * 1.3, bodyH - u * 0.2);
    ctx.restore();

    // Nozzle bell wireframe
    ctx.beginPath();
    ctx.moveTo(-bw * 0.52, 0);
    ctx.lineTo(-bw * 0.78, u * 0.20);
    ctx.lineTo(bw * 0.78, u * 0.20);
    ctx.lineTo(bw * 0.52, 0);
    ctx.closePath();
    ctx.stroke();
    return;
  }

  // 1. Structural A-frame attachment struts connecting booster to L110 Core (visible while attached)
  if (sepProgress < 0.15) {
    const innerEdge = -side * bw;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = Math.max(1.8, u * 0.032);
    ctx.beginPath();
    // Upper A-frame thrust strut
    ctx.moveTo(innerEdge, topY + u * 0.18);
    ctx.lineTo(innerEdge - side * u * 0.14, topY + u * 0.06);
    ctx.moveTo(innerEdge, topY + u * 0.26);
    ctx.lineTo(innerEdge - side * u * 0.14, topY + u * 0.14);
    // Lower aft strut
    ctx.moveTo(innerEdge, -u * 0.16);
    ctx.lineTo(innerEdge - side * u * 0.14, -u * 0.22);
    ctx.stroke();
  }

  // 2. Outward-canted aerodynamic nose cone (authentic ISRO S200 profile)
  ctx.fillStyle = makeCylinderGrad(ctx, -bw, bw, 'white');
  ctx.beginPath();
  ctx.moveTo(-bw, topY);
  ctx.quadraticCurveTo(-bw * 0.72, topY - noseH * 0.58, side * bw * 0.16, topY - noseH);
  ctx.quadraticCurveTo(bw * 0.72, topY - noseH * 0.58, bw, topY);
  ctx.closePath();
  ctx.fill();

  // Nosecone tip metallic cap
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(side * bw * 0.15, topY - noseH + u * 0.025, u * 0.024, 0, Math.PI * 2);
  ctx.fill();

  // 3. Main S200 Solid Propellant Casing
  ctx.fillStyle = makeCylinderGrad(ctx, -bw, bw, 'white');
  ctx.fillRect(-bw, topY, bw * 2, bodyH);

  // Subtle horizontal motor-segment weld seams + ISRO dark slate band
  ctx.fillStyle = makeCylinderGrad(ctx, -bw, bw, 'dark');
  ctx.fillRect(-bw, topY + u * 0.04, bw * 2, u * 0.075);
  ctx.fillRect(-bw, topY + bodyH * 0.52, bw * 2, u * 0.055);

  // Thin warm saffron/amber telemetry accent stripe
  ctx.fillStyle = 'rgba(249, 115, 22, 0.85)';
  ctx.fillRect(-bw, topY + u * 0.12, bw * 2, u * 0.025);

  ctx.strokeStyle = 'rgba(30, 41, 59, 0.28)';
  ctx.lineWidth = 1;
  for (const frac of [0.28, 0.76]) {
    const sy = topY + bodyH * frac;
    ctx.beginPath();
    ctx.moveTo(-bw, sy);
    ctx.lineTo(bw, sy);
    ctx.stroke();
  }

  // Forward separation jettison motor pods flanking nosecone collar
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-bw - u * 0.025, topY + u * 0.03, u * 0.038, u * 0.09);
  ctx.fillRect(bw - u * 0.013, topY + u * 0.03, u * 0.038, u * 0.09);

  // 4. Conical Aft Skirt Flare & Submerged Flex Nozzle Bell
  ctx.fillStyle = makeCylinderGrad(ctx, -bw * 1.08, bw * 1.08, 'dark');
  ctx.beginPath();
  ctx.moveTo(-bw, -u * 0.02);
  ctx.lineTo(-bw * 1.08, u * 0.08);
  ctx.lineTo(bw * 1.08, u * 0.08);
  ctx.lineTo(bw, -u * 0.02);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = makeCylinderGrad(ctx, -bw * 0.8, bw * 0.8, 'metal');
  ctx.beginPath();
  ctx.moveTo(-bw * 0.55, u * 0.08);
  ctx.lineTo(-bw * 0.80, u * 0.22);
  ctx.lineTo(bw * 0.80, u * 0.22);
  ctx.lineTo(bw * 0.55, u * 0.08);
  ctx.closePath();
  ctx.fill();

  // Pyrotechnic separation motor flash at nose collar during sep (0 < sepProgress < 0.75)
  if (sepProgress > 0 && sepProgress < 0.75) {
    const flash = Math.sin((sepProgress / 0.75) * Math.PI);
    const fr = u * (0.28 + flash * 0.26);
    const fGrad = ctx.createRadialGradient(0, topY + u * 0.06, 0, 0, topY + u * 0.06, fr);
    fGrad.addColorStop(0.0, `rgba(255, 255, 240, ${flash * 0.95})`);
    fGrad.addColorStop(0.45, `rgba(253, 186, 116, ${flash * 0.65})`);
    fGrad.addColorStop(1.0, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = fGrad;
    ctx.beginPath();
    ctx.arc(0, topY + u * 0.06, fr, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Renders the 2.5D LVM3 Heavy-Lift Launch Vehicle across Stage 00 & Stage 01
 * (Ground Zero -> Ignition -> Liftoff -> Max-Q -> S200 Booster Sep -> Fairing Jettison).
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

  // Rocket is completely jettisoned and gone once Stage 02 orbital spacecraft takes over
  if (sp >= 0.365) return;

  // Responsive scale adjustments for multi-angle 2D camera perspectives
  const camZoom =
    cameraMode === 'BOOSTER' ? 1.48 : cameraMode === 'CHASE' ? 1.24 : 1.0;
  const u = unit * camZoom;

  // Vehicle base sits cleanly on the MLP hold-down pedestals at groundY - unit * 0.28
  const basePadX = vehicleAnchorX - mouseX * 14;
  let baseY = groundY - unit * 0.28;

  if (cameraMode === 'BOOSTER') {
    baseY += unit * 0.35;
  } else if (cameraMode === 'CHASE') {
    baseY -= unit * 0.28;
  }

  // Smooth gravity turn eastward pitch (0° vertical through tower clearance, then -9° pitch)
  let pitchRad = 0;
  if (sp >= 0.220 && sp < 0.355) {
    const pitchProg = smoothstep(0.220, 0.345, sp);
    pitchRad = pitchProg * 0.14; // Tilts slightly rightward (east over Bay of Bengal)
  }

  // Subtle acoustic combustion micro-vibration during engine burn (sp 0.035 -> 0.315)
  const isBurning = sp >= 0.035 && sp < 0.355;
  const fireRamp = isBurning ? clamp((sp - 0.035) / 0.025, 0, 1) : 0;
  let vibeX = 0;
  let vibeY = 0;
  if (isBurning && !reducedMotion) {
    const amp = (sp < 0.22 ? 1.4 : 0.9) * fireRamp;
    vibeX = (Math.sin(t * 78) * 0.65 + Math.cos(t * 124) * 0.35) * amp;
    vibeY = (Math.cos(t * 86) * 0.65 + Math.sin(t * 136) * 0.35) * amp;
  }

  // Core lower-stage drop-away during fairing jettison (0.340 -> 0.365)
  const isDeploying = sp >= 0.340;
  const deployFrac = isDeploying ? clamp((sp - 0.340) / 0.025, 0, 1) : 0;
  const coreDropY = deployFrac * u * 5.2;
  const coreDropRot = deployFrac * 0.18;

  ctx.save();
  ctx.translate(basePadX + vibeX, baseY + vibeY);
  ctx.rotate(pitchRad);

  // Core geometry metrics (origin [0, 0] is right at the bottom of the L110 aft skirt)
  const coreR = u * 0.27;
  const l110H = u * 1.45;
  const interstageH = u * 0.20;
  const c25H = u * 0.88;
  const fairingCylH = u * 0.42;
  const fairingNoseH = u * 0.72;

  const l110TopY = -l110H;
  const interTopY = l110TopY - interstageH;
  const c25TopY = interTopY - c25H;

  // =========================================================================
  // 1. LOWER ROCKET BODY (L110 CORE + C25 UPPER STAGE + TWIN VIKAS ENGINES)
  // =========================================================================
  ctx.save();
  ctx.translate(0, coreDropY);
  ctx.rotate(coreDropRot);

  // A. Twin Core Vikas Supersonic Exhaust Flames + Mach Diamonds (drawn behind nozzles)
  if (isBurning) {
    const thrustStretch = 1.0 + Math.min(scrollSpeed * 0.22, 0.45);
    const vikasSpread = coreR * 0.46;
    drawEnginePlume(ctx, -vikasSpread, u * 0.18, coreR * 0.78, u * 1.85 * thrustStretch, fireRamp, t, true);
    drawEnginePlume(ctx, vikasSpread, u * 0.18, coreR * 0.78, u * 1.85 * thrustStretch, fireRamp, t, true);
  }

  // B. Dynamic Supersonic Exhaust Sparks Streaming from All 4 Engine Nozzles
  if (isBurning && !reducedMotion) {
    const parts = getExhaustParticles();
    const boostersActive = sp < 0.315;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (!boostersActive && p.nozzleIdx < 2) continue;

      p.age += dt * (1.2 + Math.min(scrollSpeed * 0.4, 0.8));
      if (p.age >= p.life) {
        p.age = 0;
        const originX =
          p.nozzleIdx === 0
            ? -coreR * 1.98
            : p.nozzleIdx === 1
              ? coreR * 1.98
              : p.nozzleIdx === 2
                ? -coreR * 0.46
                : coreR * 0.46;
        p.x = originX + (((i * 31) % 10) - 5) * 0.015 * u;
        p.y = u * 0.22;
      } else {
        p.x += p.vx * u * dt;
        p.y += p.vy * u * dt * fireRamp;
      }

      const ratio = clamp(p.age / p.life, 0, 1);
      const alpha = (1 - ratio) * 0.9 * fireRamp;
      ctx.fillStyle =
        ratio < 0.25
          ? `rgba(255, 252, 225, ${alpha})`
          : ratio < 0.65
            ? `rgba(255, 180, 50, ${alpha})`
            : `rgba(249, 90, 16, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - ratio * 0.45), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // C. Core Vehicle Structure (Photorealistic 2.5D vs Cyan CAD Blueprint)
  if (blueprintMode) {
    ctx.strokeStyle = '#22d3ee';
    ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.lineWidth = 1.3;

    // L110 & C25 outer hulls
    ctx.fillRect(-coreR, c25TopY, coreR * 2, l110H + interstageH + c25H);
    ctx.strokeRect(-coreR, l110TopY, coreR * 2, l110H);
    ctx.strokeRect(-coreR, interTopY, coreR * 2, interstageH);
    ctx.strokeRect(-coreR, c25TopY, coreR * 2, c25H);

    // Internal dashed cryogenic & liquid propellant pressure vessels
    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.72)';
    // C25 LH2 + LOX spheres/domes
    ctx.beginPath();
    ctx.ellipse(0, c25TopY + c25H * 0.34, coreR * 0.72, c25H * 0.24, 0, 0, Math.PI * 2);
    ctx.ellipse(0, c25TopY + c25H * 0.76, coreR * 0.68, c25H * 0.18, 0, 0, Math.PI * 2);
    ctx.stroke();
    // L110 twin liquid tanks
    ctx.strokeRect(-coreR * 0.72, l110TopY + u * 0.12, coreR * 1.44, l110H * 0.38);
    ctx.strokeRect(-coreR * 0.72, l110TopY + l110H * 0.56, coreR * 1.44, l110H * 0.34);
    ctx.restore();

    // Vertical engineering centerline & technical labels
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.38)';
    ctx.beginPath();
    ctx.moveTo(0, c25TopY - fairingCylH - fairingNoseH - u * 0.18);
    ctx.lineTo(0, u * 0.35);
    ctx.stroke();

    ctx.fillStyle = '#67e8f9';
    ctx.font = `600 ${Math.max(9, Math.round(u * 0.085))}px "JetBrains Mono", monospace`;
    ctx.fillText('C25 CRYO', coreR + u * 0.12, c25TopY + c25H * 0.55);
    ctx.fillText('L110 VIKAS', coreR + u * 0.12, l110TopY + l110H * 0.55);
  } else {
    // 1. L110 Main Liquid Core Stage Cylinder
    ctx.fillStyle = makeCylinderGrad(ctx, -coreR, coreR, 'white');
    ctx.fillRect(-coreR, l110TopY, coreR * 2, l110H);

    // Subtle vertical propellant feed raceways on core flanks
    ctx.fillStyle = '#334155';
    ctx.fillRect(-coreR - u * 0.015, l110TopY + u * 0.06, u * 0.022, l110H - u * 0.12);
    ctx.fillRect(coreR - u * 0.007, l110TopY + u * 0.06, u * 0.022, l110H - u * 0.12);

    // Circumferential weld seams on L110 tank
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.25)';
    ctx.lineWidth = 1;
    for (const f of [0.25, 0.5, 0.75]) {
      const sy = l110TopY + l110H * f;
      ctx.beginPath();
      ctx.moveTo(-coreR, sy);
      ctx.lineTo(coreR, sy);
      ctx.stroke();
    }

    // 2. Dark Carbon-Steel Interstage Separation Ring + Stiffener Flange
    ctx.fillStyle = makeCylinderGrad(ctx, -coreR * 1.02, coreR * 1.02, 'dark');
    ctx.fillRect(-coreR * 1.02, interTopY, coreR * 2.04, interstageH);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-coreR * 1.04, interTopY + interstageH * 0.45, coreR * 2.08, u * 0.025);

    // 3. C25 Cryogenic Upper Stage (with subtle LOX frost band sheen)
    ctx.fillStyle = makeCylinderGrad(ctx, -coreR, coreR, 'cryo');
    ctx.fillRect(-coreR, c25TopY, coreR * 2, c25H);

    // Cryogenic insulation orange-amber telemetry band
    ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
    ctx.fillRect(-coreR, c25TopY + c25H * 0.16, coreR * 2, u * 0.042);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-coreR, c25TopY + c25H * 0.21, coreR * 2, u * 0.025);

    // 4. L110 Aft Thrust Skirt & Twin Vikas Engine Bells
    ctx.fillStyle = makeCylinderGrad(ctx, -coreR, coreR, 'dark');
    ctx.beginPath();
    ctx.moveTo(-coreR, -u * 0.04);
    ctx.lineTo(-coreR * 0.84, u * 0.06);
    ctx.lineTo(coreR * 0.84, u * 0.06);
    ctx.lineTo(coreR, -u * 0.04);
    ctx.closePath();
    ctx.fill();

    const vikasSpread = coreR * 0.46;
    for (const side of [-1, 1]) {
      const vx = side * vikasSpread;
      ctx.fillStyle = makeCylinderGrad(ctx, vx - u * 0.09, vx + u * 0.09, 'metal');
      ctx.beginPath();
      ctx.moveTo(vx - u * 0.055, u * 0.06);
      ctx.lineTo(vx - u * 0.092, u * 0.21);
      ctx.lineTo(vx + u * 0.092, u * 0.21);
      ctx.lineTo(vx + u * 0.055, u * 0.06);
      ctx.closePath();
      ctx.fill();

      // Glowing combustion chamber throat inside nozzle bell during burn
      if (isBurning) {
        ctx.fillStyle = `rgba(255, 240, 175, ${0.95 * fireRamp})`;
        ctx.fillRect(vx - u * 0.072, u * 0.195, u * 0.144, u * 0.024);
      }
    }
  }

  // D. TWIN S200 SOLID ROCKET BOOSTERS (Separate cleanly at sp 0.315 -> 0.340)
  if (sp < 0.342) {
    const sepProg = sp >= 0.315 ? easeOutCubic((sp - 0.315) / 0.025) : 0;
    const baseBoosterX = coreR + u * 0.27;

    for (const side of [-1, 1] as const) {
      ctx.save();
      const bx = side * (baseBoosterX + sepProg * u * 2.15);
      const by = sepProg * u * 1.95;
      const bRot = side * sepProg * 0.44;
      ctx.translate(bx, by);
      ctx.rotate(bRot);
      drawS200Booster(ctx, side, u, isBurning, fireRamp, sepProg, t, blueprintMode);
      ctx.restore();
    }
  }

  // E. TRANSONIC MAX-Q PRANDTL-GLAUERT VAPOR CONDENSATION CONE (sp 0.270 -> 0.315)
  if (sp >= 0.270 && sp <= 0.315) {
    const qFrac = (sp - 0.270) / 0.045;
    const qBell = Math.sin(qFrac * Math.PI);
    const shimmer = 1 + Math.sin(t * 60) * 0.05;
    const coneY = c25TopY - fairingCylH * 0.2;
    const coneW = u * 1.32 * shimmer;
    const coneH = u * 0.62;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const cGrad = ctx.createLinearGradient(0, coneY - coneH * 0.3, 0, coneY + coneH * 0.7);
    cGrad.addColorStop(0.0, `rgba(224, 242, 254, ${0.56 * qBell})`);
    cGrad.addColorStop(0.55, `rgba(186, 230, 253, ${0.32 * qBell})`);
    cGrad.addColorStop(1.0, 'rgba(186, 230, 253, 0)');

    // Inner Prandtl-Glauert shock skirt
    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.moveTo(-coreR * 1.05, coneY - u * 0.14);
    ctx.lineTo(-coneW * 0.82, coneY + coneH * 0.65);
    ctx.quadraticCurveTo(0, coneY + coneH * 0.92, coneW * 0.82, coneY + coneH * 0.65);
    ctx.lineTo(coreR * 1.05, coneY - u * 0.14);
    ctx.closePath();
    ctx.fill();

    // Outer subtle transonic shock lip ring
    ctx.strokeStyle = `rgba(240, 249, 255, ${0.52 * qBell})`;
    ctx.lineWidth = Math.max(1.5, u * 0.024);
    ctx.beginPath();
    ctx.ellipse(0, coneY + coneH * 0.45, coneW * 0.76, u * 0.14, 0, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore(); // End lower rocket body group

  // =========================================================================
  // 2. PAYLOAD FAIRING (INTACT < 0.340, SPLITTING HALVES 0.340 -> 0.365)
  // =========================================================================
  const fairingBaseY = c25TopY;

  if (!isDeploying) {
    // 2A. INTACT 100% SEAMLESS OGIVE PAYLOAD FAIRING
    if (blueprintMode) {
      ctx.strokeStyle = '#22d3ee';
      ctx.fillStyle = 'rgba(6, 182, 212, 0.10)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-coreR, fairingBaseY);
      ctx.lineTo(-coreR, fairingBaseY - fairingCylH);
      ctx.quadraticCurveTo(-coreR * 0.92, fairingBaseY - fairingCylH - fairingNoseH * 0.55, 0, fairingBaseY - fairingCylH - fairingNoseH);
      ctx.quadraticCurveTo(coreR * 0.92, fairingBaseY - fairingCylH - fairingNoseH * 0.55, coreR, fairingBaseY - fairingCylH);
      ctx.lineTo(coreR, fairingBaseY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#67e8f9';
      ctx.font = `600 ${Math.max(9, Math.round(u * 0.085))}px "JetBrains Mono", monospace`;
      ctx.fillText('PLF // PAYLOAD', coreR + u * 0.12, fairingBaseY - fairingCylH * 0.6);
    } else {
      ctx.fillStyle = makeCylinderGrad(ctx, -coreR, coreR, 'white');
      ctx.beginPath();
      ctx.moveTo(-coreR, fairingBaseY);
      ctx.lineTo(-coreR, fairingBaseY - fairingCylH);
      ctx.quadraticCurveTo(-coreR * 0.92, fairingBaseY - fairingCylH - fairingNoseH * 0.58, 0, fairingBaseY - fairingCylH - fairingNoseH);
      ctx.quadraticCurveTo(coreR * 0.92, fairingBaseY - fairingCylH - fairingNoseH * 0.58, coreR, fairingBaseY - fairingCylH);
      ctx.lineTo(coreR, fairingBaseY);
      ctx.closePath();
      ctx.fill();

      // Subtle fairing collar & Indian tricolor-inspired aerospace mission bands
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-coreR * 1.01, fairingBaseY - u * 0.045, coreR * 2.02, u * 0.048);
      ctx.fillStyle = '#f97316'; // Saffron telemetry stripe
      ctx.fillRect(-coreR, fairingBaseY - fairingCylH * 0.34, coreR * 2, u * 0.024);
      ctx.fillStyle = '#10b981'; // Emerald telemetry stripe
      ctx.fillRect(-coreR, fairingBaseY - fairingCylH * 0.24, coreR * 2, u * 0.020);

      // Tiny circular acoustic vent ports on fairing shoulder
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(-coreR * 0.42, fairingBaseY - fairingCylH * 0.65, u * 0.02, 0, Math.PI * 2);
      ctx.arc(coreR * 0.42, fairingBaseY - fairingCylH * 0.65, u * 0.02, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // 2B. SEPARATING LEFT & RIGHT FAIRING HALVES (0.340 -> 0.365)
    const fSep = easeOutCubic(deployFrac);
    const fadeOut = 1 - smoothstep(0.65, 1.0, deployFrac);
    ctx.globalAlpha = fadeOut;

    for (const side of [-1, 1] as const) {
      ctx.save();
      ctx.translate(side * fSep * u * 2.4, fairingBaseY + fSep * u * 1.25);
      ctx.rotate(side * fSep * 0.78);

      // Dark acoustic lining on inner fairing edge + bright metallic white exterior shell
      ctx.fillStyle = blueprintMode
        ? 'rgba(6, 182, 212, 0.16)'
        : makeCylinderGrad(ctx, -coreR, coreR, 'white');
      ctx.strokeStyle = blueprintMode ? '#22d3ee' : '#334155';
      ctx.lineWidth = blueprintMode ? 1.3 : 1.0;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -(fairingCylH + fairingNoseH));
      ctx.quadraticCurveTo(
        side * coreR * 0.92,
        -(fairingCylH + fairingNoseH * 0.58),
        side * coreR,
        -fairingCylH
      );
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
