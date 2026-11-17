import {
  type Scene2DFrameContext,
  clamp,
  easeOutCubic,
  lerp,
  smoothstep,
} from './types';

function drawMonoSolarSegment(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pw: number,
  ph: number,
  blueprintMode: boolean
): void {
  ctx.fillStyle = blueprintMode ? 'rgba(255, 255, 255, 0.05)' : '#18181b';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.15;
  ctx.fillRect(x, y, pw, ph);
  ctx.strokeRect(x, y, pw, ph);

  // Crisp monochrome photovoltaic cell grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';
  ctx.lineWidth = 0.8;
  const cols = 4;
  const rows = 3;
  for (let c = 1; c < cols; c++) {
    const gx = x + (pw * c) / cols;
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + ph);
    ctx.stroke();
  }
  for (let r = 1; r < rows; r++) {
    const gy = y + (ph * r) / rows;
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + pw, gy);
    ctx.stroke();
  }
}

/**
 * Pure monochrome Black & White 2.5D Hero Satellite (Stages 02–05, sp 0.340 -> 1.000):
 * - Crisp white/graphite spacecraft bus with quilted thermal lines & optical aperture
 * - Two-stage unfolding monochrome photovoltaic solar array wings
 * - Monochrome TLI thruster cone (0.470 -> 0.515)
 * - Stage 05 prominent magnification + 3 crisp expanding white RF signal arcs
 */
export function renderHeroSatellite(frame: Scene2DFrameContext): void {
  const {
    ctx,
    h,
    sp,
    t,
    mouseX,
    mouseY,
    vehicleAnchorX,
    unit,
    cameraMode,
    blueprintMode,
    reducedMotion,
  } = frame;

  if (sp < 0.340) return;

  const deployRatio = clamp((sp - 0.340) / 0.085, 0, 1);
  const deployEase = easeOutCubic(deployRatio);

  let satScale = lerp(0.42, 1.0, deployEase);
  if (sp >= 0.86) {
    const terminalZoom = easeOutCubic((sp - 0.86) / 0.11);
    satScale = lerp(1.0, 1.44, terminalZoom);
  }
  if (cameraMode === 'BOOSTER') satScale *= 1.18;
  else if (cameraMode === 'CHASE') satScale *= 1.10;

  const s = unit * satScale;
  const bobY = reducedMotion ? 0 : Math.sin(t * 1.35) * s * 0.04;
  const cx = vehicleAnchorX - mouseX * 10 - (sp >= 0.86 ? smoothstep(0.86, 0.96, sp) * unit * 0.20 : 0);
  const cy = lerp(h * 0.44, h * 0.48, deployEase) + bobY - mouseY * 7;

  let bankRad = reducedMotion ? 0 : Math.sin(t * 0.55) * 0.025;
  if (sp >= 0.50 && sp <= 0.70) {
    bankRad -= Math.sin(((sp - 0.50) / 0.20) * Math.PI) * 0.16;
  } else if (sp >= 0.72 && sp <= 0.86) {
    bankRad -= Math.sin(((sp - 0.72) / 0.14) * Math.PI) * 0.19;
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(bankRad);

  const busW = s * 0.60;
  const busH = s * 0.74;

  // 1. TRANSLUNAR INJECTION (TLI) FLICKERING MONOCHROME THRUST CONE (0.470 -> 0.515)
  if (sp >= 0.470 && sp <= 0.515) {
    const tliBell = Math.sin(((sp - 0.470) / 0.045) * Math.PI);
    const flicker = reducedMotion ? 1 : 0.88 + Math.sin(t * 54) * 0.14;
    const flameY = busH * 0.5 + s * 0.16;
    const flameLen = s * 1.15 * tliBell * flicker;
    const flameW = s * 0.22 * tliBell;

    ctx.fillStyle = `rgba(255, 255, 255, ${0.30 * tliBell})`;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.88 * tliBell})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-flameW * 0.55, flameY);
    ctx.lineTo(0, flameY + flameLen);
    ctx.lineTo(flameW * 0.55, flameY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 2. STAGE 05 TERMINAL UPLINK CONTINUOUSLY EXPANDING RF SIGNAL ARCS & CARRIER BEAM
  if (sp >= 0.875) {
    const txAlpha = smoothstep(0.875, 0.915, sp);
    const dishTipY = -busH * 0.5 - s * 0.42;

    ctx.strokeStyle = `rgba(255, 255, 255, ${0.20 * txAlpha})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = reducedMotion ? 0 : t * 24;
    ctx.beginPath();
    ctx.moveTo(-s * 0.04, dishTipY);
    ctx.lineTo(-s * 0.72, dishTipY - s * 1.6);
    ctx.moveTo(s * 0.04, dishTipY);
    ctx.lineTo(s * 0.72, dishTipY - s * 1.6);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3 Continuously radiating monochrome RF wavefront arcs
    for (let rIdx = 0; rIdx < 3; rIdx++) {
      const f = reducedMotion ? (rIdx + 1) / 3 : (t * 0.65 + rIdx / 3) % 1.0;
      const rx = s * (0.24 + f * 1.05);
      const ry = s * (0.08 + f * 0.34);
      const ryPos = dishTipY - f * s * 0.88;
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.sin(f * Math.PI) * 0.88 * txAlpha})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, ryPos, rx, ry, 0, Math.PI * 1.10, Math.PI * 1.90);
      ctx.stroke();
    }
  }

  // 3. TWO-STAGE ARTICULATED MONOCHROME SOLAR ARRAY WINGS
  const innerUnfold = easeOutCubic(clamp((deployRatio - 0.14) / 0.54, 0, 1));
  const outerUnfold = easeOutCubic(clamp((deployRatio - 0.38) / 0.62, 0, 1));

  const panelW = s * 0.70;
  const panelH = s * 0.52;
  const yokeLen = s * 0.15;

  for (const side of [-1, 1] as const) {
    ctx.save();
    ctx.translate(side * busW * 0.5, 0);

    // Root yoke & hinge
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(side > 0 ? 0 : -yokeLen, -s * 0.025, yokeLen, s * 0.05);

    // Segment 1: Inner Solar Panel
    const seg1W = Math.max(2, panelW * innerUnfold);
    const seg1X = side > 0 ? yokeLen + s * 0.02 : -(yokeLen + s * 0.02 + seg1W);
    drawMonoSolarSegment(ctx, seg1X, -panelH * 0.5, seg1W, panelH, blueprintMode);

    // Inter-panel mechanical hinges
    const hingeX = side > 0 ? seg1X + seg1W + s * 0.022 : seg1X - s * 0.022;
    if (innerUnfold > 0.35) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(hingeX - s * 0.014, -panelH * 0.32, s * 0.028, s * 0.05);
      ctx.fillRect(hingeX - s * 0.014, panelH * 0.32 - s * 0.05, s * 0.028, s * 0.05);
    }

    // Segment 2: Outer Solar Panel
    if (outerUnfold > 0.04) {
      const seg2W = Math.max(2, panelW * outerUnfold);
      const seg2X = side > 0 ? hingeX + s * 0.022 : hingeX - s * 0.022 - seg2W;
      drawMonoSolarSegment(ctx, seg2X, -panelH * 0.5, seg2W, panelH, blueprintMode);
    }

    ctx.restore();
  }

  // 4. MAGNETOMETER BOOM & AFT THRUSTER NOZZLE
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-busW * 0.38, busH * 0.45);
  ctx.lineTo(-busW * 0.56, busH * 0.86);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-busW * 0.56, busH * 0.86, s * 0.032, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#18181b';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-s * 0.072, busH * 0.5);
  ctx.lineTo(-s * 0.12, busH * 0.5 + s * 0.16);
  ctx.lineTo(s * 0.12, busH * 0.5 + s * 0.16);
  ctx.lineTo(s * 0.072, busH * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 5. CENTRAL MONOCHROME SPACECRAFT BUS
  if (blueprintMode) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.3;
    ctx.fillRect(-busW * 0.5, -busH * 0.5, busW, busH);
    ctx.strokeRect(-busW * 0.5, -busH * 0.5, busW, busH);
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(-busW * 0.34, -busH * 0.34, busW * 0.68, busH * 0.68);
    ctx.restore();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-busW * 0.5, -busH * 0.5, busW, busH);
    ctx.fillStyle = '#d4d4d8';
    ctx.fillRect(-busW * 0.5, -busH * 0.5, busW * 0.48, busH);

    // Thermal foil diamond seam lines
    ctx.strokeStyle = 'rgba(9, 9, 11, 0.35)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-busW * 0.5, 0);
    ctx.lineTo(0, -busH * 0.5);
    ctx.lineTo(busW * 0.5, 0);
    ctx.lineTo(0, busH * 0.5);
    ctx.closePath();
    ctx.stroke();

    // Crisp dark top & bottom bus collars + outline
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-busW * 0.52, -busH * 0.52, busW * 1.04, s * 0.055);
    ctx.fillRect(-busW * 0.52, busH * 0.5 - s * 0.035, busW * 1.04, s * 0.055);
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.3;
    ctx.strokeRect(-busW * 0.5, -busH * 0.5, busW, busH);

    // Optical Star-Tracker Lens
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(0, -busH * 0.08, s * 0.105, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s * 0.025, -busH * 0.10, s * 0.03, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. HIGH-GAIN PARABOLIC DISH ANTENNA
  const dishY = -busH * 0.5 - s * 0.18;
  const dishR = s * 0.42;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-s * 0.03, dishY, s * 0.06, s * 0.15);

  ctx.beginPath();
  ctx.ellipse(0, dishY, dishR, s * 0.14, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fillStyle = blueprintMode ? 'rgba(255,255,255,0.08)' : '#ffffff';
  ctx.strokeStyle = blueprintMode ? '#ffffff' : '#09090b';
  ctx.lineWidth = 1.25;
  ctx.fill();
  ctx.stroke();

  const hornY = dishY - s * 0.22;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-dishR * 0.70, dishY + s * 0.03);
  ctx.lineTo(0, hornY);
  ctx.lineTo(dishR * 0.70, dishY + s * 0.03);
  ctx.moveTo(0, dishY + s * 0.06);
  ctx.lineTo(0, hornY);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, hornY, s * 0.035, 0, Math.PI * 2);
  ctx.fill();

  if (blueprintMode) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${Math.max(9, Math.round(s * 0.075))}px "JetBrains Mono", monospace`;
    ctx.fillText('HGA DISH', dishR + s * 0.08, dishY);
    ctx.fillText('BUS', busW * 0.5 + s * 0.08, busH * 0.46);
  }

  ctx.restore();
}
