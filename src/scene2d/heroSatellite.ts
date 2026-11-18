import {
  type Scene2DFrameContext,
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
  ctx.fillStyle = blueprintMode ? 'rgba(255, 255, 255, 0.05)' : '#141418';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.62)';
  ctx.lineWidth = 0.95;
  ctx.fillRect(x, y, pw, ph);

  if (!blueprintMode && pw > 8) {
    // Subtle diagonal sunlight sheen across solar cells
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + pw * 0.62, y);
    ctx.lineTo(x + pw * 0.26, y + ph);
    ctx.lineTo(x, y + ph);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeRect(x, y, pw, ph);

  // Crisp monochrome photovoltaic cell grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
  ctx.lineWidth = 0.7;
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
    groundY,
    unit,
    cameraMode,
    blueprintMode,
    reducedMotion,
  } = frame;

  // Satellite begins revealing smoothly INSIDE the opening payload fairing at sp = 0.398!
  if (sp < 0.398) return;

  // Slow, cinematic multi-phase deployment:
  // - 0.398 -> 0.432: Satellite fades into view right inside the splitting fairing nose
  // - 0.420 -> 0.555: Satellite gracefully floats out from fairing & scales up to LEO size
  // - 0.475 -> 0.555: Inner solar wings unfold smoothly
  // - 0.530 -> 0.605: Outer solar wings unfold smoothly
  const revealAlpha = smoothstep(0.398, 0.432, sp);
  const floatOut = smoothstep(0.420, 0.555, sp);
  const floatEase = easeOutCubic(floatOut);

  // Match exact rocket fairing cavity world position so satellite physically emerges from inside the rocket!
  const camZoom =
    cameraMode === 'BOOSTER' ? 1.42 : cameraMode === 'CHASE' ? 1.22 : 1.0;
  const u = unit * camZoom;
  let rocketBaseY = groundY - unit * 0.14 - unit * 0.32;
  if (cameraMode === 'BOOSTER') rocketBaseY += unit * 0.32;
  else if (cameraMode === 'CHASE') rocketBaseY -= unit * 0.22;
  const pitchRad = 0.14;
  // Fairing cavity center sits at local y = -(l110H + interstageH + c25H + 0.55 * fairingCylH) = -3.43u
  const localCavityY = -u * 3.43;
  const startX = vehicleAnchorX - mouseX * 10 - Math.sin(pitchRad) * localCavityY;
  const startY = rocketBaseY + Math.cos(pitchRad) * localCavityY;

  // Emerges smoothly from stowed fairing scale (0.30) -> full LEO showcase (1.02) -> terminal uplink zoom (1.38)
  let satScale = lerp(0.30, 1.02, floatEase);
  if (sp >= 0.87) {
    const terminalZoom = easeOutCubic((sp - 0.87) / 0.10);
    satScale = lerp(1.02, 1.38, terminalZoom);
  }
  if (cameraMode === 'BOOSTER') satScale *= 1.18;
  else if (cameraMode === 'CHASE') satScale *= 1.10;

  const s = unit * satScale;
  const bobY = reducedMotion ? 0 : Math.sin(t * 1.15) * s * 0.032 * floatEase;
  const targetX =
    vehicleAnchorX - mouseX * 10 - (sp >= 0.87 ? smoothstep(0.87, 0.96, sp) * unit * 0.18 : 0);
  const targetY = h * 0.43 + bobY - mouseY * 6;

  const cx = lerp(startX, targetX, floatEase);
  const cy = lerp(startY, targetY, floatEase);

  // Smoothly levels attitude from rocket's 0.14 rad pitch into calm horizontal orbital cruise
  const bankRad =
    lerp(pitchRad, 0, floatEase) + (reducedMotion ? 0 : Math.sin(t * 0.48) * 0.024 * floatEase);

  ctx.save();
  ctx.globalAlpha = revealAlpha;
  ctx.translate(cx, cy);
  ctx.rotate(bankRad);

  const busW = s * 0.60;
  const busH = s * 0.74;

  // 1. STAGE 05 ORBITAL DOWNLINK CONTINUOUSLY EXPANDING RF SIGNAL ARCS & CARRIER BEAM
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

  // 3. TWO-STAGE ARTICULATED MONOCHROME SOLAR ARRAY WINGS (unfold gradually after clearing fairing!)
  const innerUnfold = easeOutCubic(smoothstep(0.470, 0.555, sp));
  const outerUnfold = easeOutCubic(smoothstep(0.530, 0.610, sp));

  const panelW = s * 0.70;
  const panelH = s * 0.52;
  const yokeLen = s * 0.15;

  if (innerUnfold > 0.01) {
    for (const side of [-1, 1] as const) {
      ctx.save();
      ctx.translate(side * busW * 0.5, 0);

      // Root yoke & hinge
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(side > 0 ? 0 : -yokeLen * innerUnfold, -s * 0.025, yokeLen * innerUnfold, s * 0.05);

      // Segment 1: Inner Solar Panel
      const seg1W = Math.max(2, panelW * innerUnfold);
      const seg1X =
        side > 0 ? yokeLen * innerUnfold + s * 0.02 : -(yokeLen * innerUnfold + s * 0.02 + seg1W);
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
    ctx.fillStyle = '#e4e4e7';
    ctx.fillRect(-busW * 0.5, -busH * 0.5, busW, busH);
    ctx.fillStyle = '#c4c4cc';
    ctx.fillRect(-busW * 0.5, -busH * 0.5, busW * 0.48, busH);

    // Thermal foil diamond seam lines
    ctx.strokeStyle = 'rgba(24, 24, 27, 0.24)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-busW * 0.5, 0);
    ctx.lineTo(0, -busH * 0.5);
    ctx.lineTo(busW * 0.5, 0);
    ctx.lineTo(0, busH * 0.5);
    ctx.closePath();
    ctx.stroke();

    // Sleek matte graphite top & bottom bus collars + soft hairline outline
    ctx.fillStyle = '#1f1f23';
    ctx.fillRect(-busW * 0.52, -busH * 0.52, busW * 1.04, s * 0.052);
    ctx.fillRect(-busW * 0.52, busH * 0.5 - s * 0.032, busW * 1.04, s * 0.052);
    ctx.strokeStyle = 'rgba(24, 24, 27, 0.42)';
    ctx.lineWidth = 0.95;
    ctx.strokeRect(-busW * 0.5, -busH * 0.5, busW, busH);

    // Optical Star-Tracker Lens
    ctx.fillStyle = '#141418';
    ctx.beginPath();
    ctx.arc(0, -busH * 0.08, s * 0.105, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.lineWidth = 1.0;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s * 0.025, -busH * 0.10, s * 0.028, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. HIGH-GAIN PARABOLIC DISH ANTENNA
  const dishY = -busH * 0.5 - s * 0.18;
  const dishR = s * 0.42;

  ctx.fillStyle = '#d4d4dc';
  ctx.fillRect(-s * 0.028, dishY, s * 0.056, s * 0.15);

  ctx.beginPath();
  ctx.ellipse(0, dishY, dishR, s * 0.14, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fillStyle = blueprintMode ? 'rgba(255,255,255,0.08)' : '#e4e4e7';
  ctx.strokeStyle = blueprintMode ? '#ffffff' : 'rgba(24, 24, 27, 0.42)';
  ctx.lineWidth = 0.95;
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
