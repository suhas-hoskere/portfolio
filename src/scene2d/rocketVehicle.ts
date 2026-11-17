import {
  type Scene2DFrameContext,
  clamp,
  easeOutCubic,
  smoothstep,
} from './types';

/** Draws a crisp flat monochrome supersonic exhaust plume + geometric Mach diamonds (zero radial gradients) */
function drawMonoPlume(
  ctx: CanvasRenderingContext2D,
  nx: number,
  ny: number,
  width: number,
  length: number,
  fireRamp: number,
  withMachDiamonds: boolean
): void {
  if (fireRamp <= 0.02) return;
  const w = width * fireRamp;
  const len = length * fireRamp;

  // Outer translucent silver-white exhaust envelope
  ctx.fillStyle = `rgba(255, 255, 255, ${0.22 * fireRamp})`;
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.48 * fireRamp})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(nx - w * 0.55, ny);
  ctx.quadraticCurveTo(nx - w * 1.15, ny + len * 0.52, nx, ny + len);
  ctx.quadraticCurveTo(nx + w * 1.15, ny + len * 0.52, nx + w * 0.55, ny);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Pure white inner supersonic core
  const coreLen = len * 0.56;
  ctx.fillStyle = `rgba(255, 255, 255, ${0.92 * fireRamp})`;
  ctx.beginPath();
  ctx.moveTo(nx - w * 0.34, ny);
  ctx.quadraticCurveTo(nx - w * 0.45, ny + coreLen * 0.65, nx, ny + coreLen);
  ctx.quadraticCurveTo(nx + w * 0.45, ny + coreLen * 0.65, nx + w * 0.34, ny);
  ctx.closePath();
  ctx.fill();

  // Sharp monochrome Mach diamond shock lozenges inside Vikas core plume
  if (withMachDiamonds && fireRamp > 0.25) {
    ctx.strokeStyle = '#09090b';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 1;
    for (let d = 0; d < 3; d++) {
      const dy = ny + len * (0.16 + d * 0.14);
      const dw = w * (0.32 - d * 0.06);
      const dh = len * (0.058 - d * 0.01);
      ctx.beginPath();
      ctx.moveTo(nx, dy - dh);
      ctx.lineTo(nx + dw, dy);
      ctx.lineTo(nx, dy + dh);
      ctx.lineTo(nx - dw, dy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
}

/** Draws a single monochrome Black & White S200 Solid Rocket Booster */
function drawMonoS200Booster(
  ctx: CanvasRenderingContext2D,
  side: -1 | 1,
  u: number,
  isBurning: boolean,
  fireRamp: number,
  sepProgress: number,
  blueprintMode: boolean
): void {
  const bw = u * 0.22;
  const bodyH = u * 1.46;
  const noseH = u * 0.45;
  const topY = -bodyH;

  // Booster exhaust flame while attached
  if (isBurning && sepProgress === 0) {
    drawMonoPlume(ctx, 0, u * 0.20, bw * 1.4, u * 2.1, fireRamp, false);
  }

  // Post-separation monochrome residual burnout trail circles
  if (sepProgress > 0 && sepProgress < 1) {
    const trailAlpha = (1 - sepProgress) * 0.45;
    ctx.strokeStyle = `rgba(255, 255, 255, ${trailAlpha})`;
    ctx.fillStyle = `rgba(255, 255, 255, ${trailAlpha * 0.25})`;
    ctx.lineWidth = 1;
    for (let s = 0; s < 3; s++) {
      const sy = u * (0.28 + s * 0.36 + sepProgress * 0.42);
      const sr = u * (0.12 + s * 0.08 + sepProgress * 0.12);
      ctx.beginPath();
      ctx.arc(0, sy, sr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // Attachment struts while attached
  if (sepProgress < 0.15) {
    const innerEdge = -side * bw;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.lineWidth = 1.4;
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

  // Outward-canted aerodynamic nose cone (pure white + crisp shadow side)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-bw, topY);
  ctx.quadraticCurveTo(-bw * 0.72, topY - noseH * 0.58, side * bw * 0.16, topY - noseH);
  ctx.quadraticCurveTo(bw * 0.72, topY - noseH * 0.58, bw, topY);
  ctx.closePath();
  ctx.fill();

  // Left half shadow shading for crisp 2.5D monochrome depth
  ctx.fillStyle = '#d4d4d8';
  ctx.beginPath();
  ctx.moveTo(-bw, topY);
  ctx.quadraticCurveTo(-bw * 0.72, topY - noseH * 0.58, side * bw * 0.16, topY - noseH);
  ctx.lineTo(0, topY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-bw, topY);
  ctx.quadraticCurveTo(-bw * 0.72, topY - noseH * 0.58, side * bw * 0.16, topY - noseH);
  ctx.quadraticCurveTo(bw * 0.72, topY - noseH * 0.58, bw, topY);
  ctx.closePath();
  ctx.stroke();

  // Main S200 White Casing + Left Half Silver Shadow + Black Roll Bands
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-bw, topY, bw * 2, bodyH);
  ctx.fillStyle = '#d4d4d8';
  ctx.fillRect(-bw, topY, bw * 0.92, bodyH);

  // Iconic Apollo-style Black Roll-Pattern Bands
  ctx.fillStyle = '#09090b';
  ctx.fillRect(-bw, topY + u * 0.04, bw * 2, u * 0.08);
  ctx.fillRect(-bw, topY + bodyH * 0.52, bw * 2, u * 0.06);

  // Crisp 1.2px ink outline & weld seams
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-bw, topY, bw * 2, bodyH);

  ctx.strokeStyle = 'rgba(9, 9, 11, 0.35)';
  ctx.lineWidth = 0.9;
  for (const frac of [0.28, 0.76]) {
    const sy = topY + bodyH * frac;
    ctx.beginPath();
    ctx.moveTo(-bw, sy);
    ctx.lineTo(bw, sy);
    ctx.stroke();
  }

  // Aft Skirt & Nozzle Bell
  ctx.fillStyle = '#18181b';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-bw, -u * 0.02);
  ctx.lineTo(-bw * 1.06, u * 0.08);
  ctx.lineTo(bw * 1.06, u * 0.08);
  ctx.lineTo(bw, -u * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#27272a';
  ctx.beginPath();
  ctx.moveTo(-bw * 0.54, u * 0.08);
  ctx.lineTo(-bw * 0.78, u * 0.21);
  ctx.lineTo(bw * 0.78, u * 0.21);
  ctx.lineTo(bw * 0.54, u * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Pyrotechnic separation flash ring at nose collar
  if (sepProgress > 0 && sepProgress < 0.75) {
    const flash = Math.sin((sepProgress / 0.75) * Math.PI);
    ctx.strokeStyle = `rgba(255, 255, 255, ${flash})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, topY + u * 0.06, u * (0.14 + flash * 0.18), 0, Math.PI * 2);
    ctx.stroke();
  }
}

/**
 * Pure monochrome Black & White 2.5D LVM3 Launch Vehicle (Stages 00–01).
 * Iconic stark white & obsidian roll-pattern livery, zero radial gradients, zero heavy loops.
 */
export function renderRocketVehicle(frame: Scene2DFrameContext): void {
  const {
    ctx,
    sp,
    mouseX,
    vehicleAnchorX,
    groundY,
    unit,
    cameraMode,
    blueprintMode,
  } = frame;

  if (sp >= 0.365) return;

  const camZoom =
    cameraMode === 'BOOSTER' ? 1.42 : cameraMode === 'CHASE' ? 1.22 : 1.0;
  const u = unit * camZoom;

  const basePadX = vehicleAnchorX - mouseX * 10;
  let baseY = groundY - unit * 0.28;
  if (cameraMode === 'BOOSTER') baseY += unit * 0.32;
  else if (cameraMode === 'CHASE') baseY -= unit * 0.26;

  // Smooth eastward gravity pitch turn during ascent (0.22 -> 0.35)
  const pitchRad = sp >= 0.220 ? smoothstep(0.220, 0.345, sp) * 0.14 : 0;

  const isBurning = sp >= 0.035 && sp < 0.355;
  const fireRamp = isBurning ? clamp((sp - 0.035) / 0.025, 0, 1) : 0;

  const isDeploying = sp >= 0.340;
  const deployFrac = isDeploying ? clamp((sp - 0.340) / 0.025, 0, 1) : 0;
  const coreDropY = deployFrac * u * 5.2;
  const coreDropRot = deployFrac * 0.18;

  ctx.save();
  ctx.translate(basePadX, baseY);
  ctx.rotate(pitchRad);

  const coreR = u * 0.26;
  const l110H = u * 1.42;
  const interstageH = u * 0.20;
  const c25H = u * 0.86;
  const fairingCylH = u * 0.42;
  const fairingNoseH = u * 0.72;

  const l110TopY = -l110H;
  const interTopY = l110TopY - interstageH;
  const c25TopY = interTopY - c25H;

  // =========================================================================
  // 1. LOWER ROCKET BODY (L110 + INTERSTAGE + C25 + TWIN S200 BOOSTERS)
  // =========================================================================
  ctx.save();
  ctx.translate(0, coreDropY);
  ctx.rotate(coreDropRot);

  // Twin Core Vikas Plumes + Mach Diamonds
  if (isBurning) {
    const vikasSpread = coreR * 0.46;
    drawMonoPlume(ctx, -vikasSpread, u * 0.18, coreR * 0.74, u * 1.78, fireRamp, true);
    drawMonoPlume(ctx, vikasSpread, u * 0.18, coreR * 0.74, u * 1.78, fireRamp, true);
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
    // L110 Main Core Tank (pure white + crisp left silver shading + ink stroke)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-coreR, l110TopY, coreR * 2, l110H);
    ctx.fillStyle = '#d4d4d8';
    ctx.fillRect(-coreR, l110TopY, coreR * 0.92, l110H);

    // Classic Black Roll-Pattern Checkered Stripes on L110
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-coreR, l110TopY + l110H * 0.68, coreR, l110H * 0.22);
    ctx.fillRect(0, l110TopY + l110H * 0.46, coreR, l110H * 0.22);

    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.25;
    ctx.strokeRect(-coreR, l110TopY, coreR * 2, l110H);

    // Interstage Adapter Collar (solid black with white flange band)
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-coreR * 1.02, interTopY, coreR * 2.04, interstageH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-coreR * 1.02, interTopY, coreR * 2.04, interstageH);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-coreR * 1.04, interTopY + interstageH * 0.45, coreR * 2.08, 2);

    // C25 Cryogenic Upper Stage (white + silver shadow + black telemetry stripe)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-coreR, c25TopY, coreR * 2, c25H);
    ctx.fillStyle = '#e4e4e7';
    ctx.fillRect(-coreR, c25TopY, coreR * 0.92, c25H);
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-coreR, c25TopY + c25H * 0.18, coreR * 2, u * 0.055);
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.25;
    ctx.strokeRect(-coreR, c25TopY, coreR * 2, c25H);

    // Aft Skirt & Twin Vikas Engine Bells
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
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
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      ctx.moveTo(vx - u * 0.05, u * 0.06);
      ctx.lineTo(vx - u * 0.088, u * 0.20);
      ctx.lineTo(vx + u * 0.088, u * 0.20);
      ctx.lineTo(vx + u * 0.05, u * 0.06);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  // Twin S200 Solid Boosters (detach cleanly at sp 0.315 -> 0.340)
  if (sp < 0.342) {
    const sepProg = sp >= 0.315 ? easeOutCubic((sp - 0.315) / 0.025) : 0;
    const baseBoosterX = coreR + u * 0.26;
    for (const side of [-1, 1] as const) {
      ctx.save();
      ctx.translate(side * (baseBoosterX + sepProg * u * 2.1), sepProg * u * 1.9);
      ctx.rotate(side * sepProg * 0.44);
      drawMonoS200Booster(ctx, side, u, isBurning, fireRamp, sepProg, blueprintMode);
      ctx.restore();
    }
  }

  // Crisp Monochrome Prandtl-Glauert Max-Q Shock Cone (sp 0.270 -> 0.315)
  if (sp >= 0.270 && sp <= 0.315) {
    const qBell = Math.sin(((sp - 0.270) / 0.045) * Math.PI);
    const coneY = c25TopY - fairingCylH * 0.2;
    const coneW = u * 1.25;
    const coneH = u * 0.56;

    ctx.fillStyle = `rgba(255, 255, 255, ${0.18 * qBell})`;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.72 * qBell})`;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(-coreR * 1.05, coneY - u * 0.12);
    ctx.lineTo(-coneW * 0.82, coneY + coneH * 0.65);
    ctx.quadraticCurveTo(0, coneY + coneH * 0.90, coneW * 0.82, coneY + coneH * 0.65);
    ctx.lineTo(coreR * 1.05, coneY - u * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore(); // End lower body

  // =========================================================================
  // 2. MONOCHROME PAYLOAD FAIRING (INTACT < 0.340, SPLITTING HALVES 0.340+)
  // =========================================================================
  const fairingBaseY = c25TopY;

  if (!isDeploying) {
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
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-coreR, fairingBaseY);
      ctx.lineTo(-coreR, fairingBaseY - fairingCylH);
      ctx.quadraticCurveTo(-coreR * 0.92, fairingBaseY - fairingCylH - fairingNoseH * 0.58, 0, fairingBaseY - fairingCylH - fairingNoseH);
      ctx.quadraticCurveTo(coreR * 0.92, fairingBaseY - fairingCylH - fairingNoseH * 0.58, coreR, fairingBaseY - fairingCylH);
      ctx.lineTo(coreR, fairingBaseY);
      ctx.closePath();
      ctx.fill();

      // Left half silver shadow for clean 2.5D curvature
      ctx.fillStyle = '#d4d4d8';
      ctx.beginPath();
      ctx.moveTo(-coreR, fairingBaseY);
      ctx.lineTo(-coreR, fairingBaseY - fairingCylH);
      ctx.quadraticCurveTo(-coreR * 0.92, fairingBaseY - fairingCylH - fairingNoseH * 0.58, 0, fairingBaseY - fairingCylH - fairingNoseH);
      ctx.lineTo(0, fairingBaseY);
      ctx.closePath();
      ctx.fill();

      // Black nosecone collar + hairline seam
      ctx.fillStyle = '#09090b';
      ctx.fillRect(-coreR, fairingBaseY - u * 0.045, coreR * 2, u * 0.048);
      ctx.fillRect(-coreR, fairingBaseY - fairingCylH * 0.34, coreR * 2, u * 0.025);

      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(-coreR, fairingBaseY);
      ctx.lineTo(-coreR, fairingBaseY - fairingCylH);
      ctx.quadraticCurveTo(-coreR * 0.92, fairingBaseY - fairingCylH - fairingNoseH * 0.58, 0, fairingBaseY - fairingCylH - fairingNoseH);
      ctx.quadraticCurveTo(coreR * 0.92, fairingBaseY - fairingCylH - fairingNoseH * 0.58, coreR, fairingBaseY - fairingCylH);
      ctx.lineTo(coreR, fairingBaseY);
      ctx.closePath();
      ctx.stroke();
    }
  } else {
    const fSep = easeOutCubic(deployFrac);
    const fadeOut = 1 - smoothstep(0.65, 1.0, deployFrac);
    ctx.globalAlpha = fadeOut;

    for (const side of [-1, 1] as const) {
      ctx.save();
      ctx.translate(side * fSep * u * 2.35, fairingBaseY + fSep * u * 1.2);
      ctx.rotate(side * fSep * 0.76);
      ctx.fillStyle = blueprintMode ? 'rgba(255,255,255,0.08)' : side > 0 ? '#ffffff' : '#d4d4d8';
      ctx.strokeStyle = blueprintMode ? '#ffffff' : '#09090b';
      ctx.lineWidth = 1.2;
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
