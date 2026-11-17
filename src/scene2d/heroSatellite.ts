import {
  type Scene2DFrameContext,
  clamp,
  easeOutCubic,
  lerp,
  smoothstep,
} from './types';

/** Draws one photovoltaic solar panel segment with silver busbar grid & sunlight glint */
function drawSolarPanelSegment(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pw: number,
  ph: number,
  blueprintMode: boolean,
  t: number
): void {
  if (blueprintMode) {
    ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.2;
    ctx.fillRect(x, y, pw, ph);
    ctx.strokeRect(x, y, pw, ph);
    // Blueprint cell grid
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
    ctx.lineWidth = 0.7;
    const cols = 4;
    for (let c = 1; c < cols; c++) {
      const gx = x + (pw * c) / cols;
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx, y + ph);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x, y + ph * 0.5);
    ctx.lineTo(x + pw, y + ph * 0.5);
    ctx.stroke();
    return;
  }

  // Dark anodized carbon-fiber perimeter frame
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x - 1.5, y - 1.5, pw + 3, ph + 3);

  // Deep sapphire triple-junction photovoltaic cell gradient
  const cellGrad = ctx.createLinearGradient(x, y, x + pw, y + ph);
  cellGrad.addColorStop(0.0, '#0f2557');
  cellGrad.addColorStop(0.42, '#1d4ed8');
  cellGrad.addColorStop(0.68, '#1e40af');
  cellGrad.addColorStop(1.0, '#0c1e4a');
  ctx.fillStyle = cellGrad;
  ctx.fillRect(x, y, pw, ph);

  // Crisp silver photovoltaic busbar grid lines
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.32)';
  ctx.lineWidth = 0.85;
  const cols = 5;
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

  // Subtle sunlit specular diagonal sheen gliding gently across the cells
  const glintPos = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 0.65));
  const sheen = ctx.createLinearGradient(
    x + pw * (glintPos - 0.35),
    y,
    x + pw * (glintPos + 0.35),
    y + ph
  );
  sheen.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
  sheen.addColorStop(0.5, 'rgba(186, 230, 253, 0.22)');
  sheen.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, pw, ph);

  // Subtle crisp top frame highlight catching oblique sunlight
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, pw, ph);
}

/**
 * Renders the 2.5D Hero Spacecraft (sp 0.340 -> 1.000):
 * - Emerges cleanly from fairing jettison into Low Earth Orbit
 * - Two-stage articulated solar wing unfolding with mechanical hinges
 * - Gold MLI thermal foil bus, optical star-tracker, magnetometer boom & HGA dish
 * - TLI hypergolic violet-cyan thruster burn (0.470 -> 0.515)
 * - Periodic cold-gas RCS micro-thruster attitude stabilization puffs
 * - Magnifies smoothly at Stage 05 Terminal Uplink (0.86 -> 1.00) with 3 harmonic RF signal waves
 */
export function renderHeroSatellite(frame: Scene2DFrameContext): void {
  const {
    ctx,
    h,
    sp,
    scrollSpeed,
    t,
    mouseX,
    mouseY,
    vehicleAnchorX,
    unit,
    cameraMode,
    blueprintMode,
    reducedMotion,
  } = frame;

  // Tucked inside payload fairing until deployment begins at sp 0.340
  if (sp < 0.340) return;

  const deployRatio = clamp((sp - 0.340) / 0.085, 0, 1);
  const deployEase = easeOutCubic(deployRatio);

  // Scale grows smoothly out of fairing into LEO showcase, then magnifies prominently at Stage 05 Uplink
  let satScale = lerp(0.42, 1.02, deployEase);
  if (sp >= 0.86) {
    const terminalZoom = easeOutCubic((sp - 0.86) / 0.11);
    satScale = lerp(1.02, 1.48, terminalZoom);
  }
  if (cameraMode === 'BOOSTER') satScale *= 1.18;
  else if (cameraMode === 'CHASE') satScale *= 1.10;

  const s = unit * satScale;

  // Center position: right half of viewport, gentle floating bob in microgravity
  const bobY = reducedMotion ? 0 : Math.sin(t * 1.15) * s * 0.045;
  const cx = vehicleAnchorX - mouseX * 14 - (sp >= 0.86 ? smoothstep(0.86, 0.96, sp) * unit * 0.22 : 0);
  const cy =
    lerp(h * 0.44, h * 0.48, deployEase) +
    bobY -
    mouseY * 10;

  // Attitude banking maneuvers targeting Moon (Stage 03) & Mars (Stage 04), steady pointing at Stage 05
  let bankRad = reducedMotion ? 0 : Math.sin(t * 0.45) * 0.025;
  if (sp >= 0.50 && sp <= 0.70) {
    const mFac = Math.sin(((sp - 0.50) / 0.20) * Math.PI);
    bankRad -= mFac * 0.16;
  } else if (sp >= 0.72 && sp <= 0.86) {
    const marsFac = Math.sin(((sp - 0.72) / 0.14) * Math.PI);
    bankRad -= marsFac * 0.19;
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(bankRad);

  const busW = s * 0.62;
  const busH = s * 0.76;

  // =========================================================================
  // 1. TRANSLUNAR INJECTION (TLI) HYPERGOLIC THRUSTER BURN (sp 0.470 -> 0.515)
  // =========================================================================
  if (sp >= 0.470 && sp <= 0.515) {
    const tliFrac = (sp - 0.470) / 0.045;
    const tliBell = Math.sin(tliFrac * Math.PI);
    const flicker = 1 + Math.sin(t * 48) * 0.12;
    const flameY = busH * 0.5 + s * 0.16;
    const flameLen = s * 1.15 * tliBell * flicker;
    const flameW = s * 0.24 * tliBell;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // Indigo-cyan ambient glow halo
    const tliHalo = ctx.createRadialGradient(0, flameY + flameLen * 0.25, 2, 0, flameY + flameLen * 0.35, flameLen * 0.95);
    tliHalo.addColorStop(0.0, `rgba(196, 181, 253, ${0.85 * tliBell})`);
    tliHalo.addColorStop(0.4, `rgba(99, 102, 241, ${0.48 * tliBell})`);
    tliHalo.addColorStop(1.0, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = tliHalo;
    ctx.beginPath();
    ctx.arc(0, flameY + flameLen * 0.3, flameLen * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Focused hypergolic plasma cone
    const coneGrad = ctx.createLinearGradient(0, flameY, 0, flameY + flameLen);
    coneGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.95 * tliBell})`);
    coneGrad.addColorStop(0.45, `rgba(129, 140, 248, ${0.78 * tliBell})`);
    coneGrad.addColorStop(1.0, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(-flameW * 0.55, flameY);
    ctx.lineTo(0, flameY + flameLen);
    ctx.lineTo(flameW * 0.55, flameY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // =========================================================================
  // 2. STAGE 05 TERMINAL UPLINK RF CARRIER BEAM & 3 HARMONIC SIGNAL RINGS
  // =========================================================================
  if (sp >= 0.875) {
    const txAlpha = smoothstep(0.875, 0.915, sp);
    const dishTipX = 0;
    const dishTipY = -busH * 0.5 - s * 0.44;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Soft electromagnetic carrier beam cone radiating upward from feed horn
    const beamH = s * 1.85;
    const beamGrad = ctx.createLinearGradient(dishTipX, dishTipY, dishTipX, dishTipY - beamH);
    beamGrad.addColorStop(0.0, `rgba(56, 189, 248, ${0.26 * txAlpha})`);
    beamGrad.addColorStop(0.6, `rgba(14, 165, 233, ${0.09 * txAlpha})`);
    beamGrad.addColorStop(1.0, 'rgba(14, 165, 233, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(dishTipX - s * 0.06, dishTipY);
    ctx.lineTo(dishTipX - s * 0.78, dishTipY - beamH);
    ctx.lineTo(dishTipX + s * 0.78, dishTipY - beamH);
    ctx.lineTo(dishTipX + s * 0.06, dishTipY);
    ctx.closePath();
    ctx.fill();

    // 3 Independent expanding harmonic spherical wavefront arcs
    const ringColors = ['#38bdf8', '#67e8f9', '#0ea5e9'];
    for (let rIdx = 0; rIdx < 3; rIdx++) {
      const wave = reducedMotion ? 0.25 + rIdx * 0.25 : (t * 0.72 + rIdx / 3) % 1.0;
      const ringAlpha = Math.sin(wave * Math.PI) * 0.85 * txAlpha;
      const rx = s * (0.24 + wave * 1.25);
      const ry = s * (0.10 + wave * 0.42);
      const ryPos = dishTipY - wave * s * 0.95;

      ctx.strokeStyle = ringColors[rIdx];
      ctx.globalAlpha = ringAlpha;
      ctx.lineWidth = Math.max(1.4, (1 - wave * 0.5) * 2.4);
      ctx.beginPath();
      ctx.ellipse(dishTipX, ryPos, rx, ry, 0, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
    }

    ctx.restore();
  }

  // =========================================================================
  // 3. TWO-STAGE ARTICULATED PHOTOVOLTAIC SOLAR ARRAY WINGS (LEFT & RIGHT)
  // =========================================================================
  const innerUnfold = easeOutCubic(clamp((deployRatio - 0.14) / 0.54, 0, 1));
  const outerUnfold = easeOutCubic(clamp((deployRatio - 0.38) / 0.62, 0, 1));
  const wingFlex = reducedMotion
    ? 0
    : Math.sin(t * 3.1) * 0.015 * Math.min(scrollSpeed * 0.5 + 0.15, 1.0);

  const panelW = s * 0.72;
  const panelH = s * 0.54;
  const yokeLen = s * 0.16;

  for (const side of [-1, 1] as const) {
    ctx.save();
    ctx.translate(side * busW * 0.5, 0);
    ctx.rotate(side * wingFlex);

    // Root deployment yoke & actuator shaft
    ctx.fillStyle = blueprintMode ? '#22d3ee' : '#64748b';
    ctx.fillRect(side > 0 ? 0 : -yokeLen, -s * 0.032, yokeLen, s * 0.064);
    ctx.fillStyle = blueprintMode ? '#67e8f9' : '#f59e0b';
    ctx.fillRect(side > 0 ? yokeLen - s * 0.02 : -yokeLen - s * 0.01, -s * 0.08, s * 0.03, s * 0.16);

    // Segment 1: Inner Solar Panel (foreshortens cleanly as it rotates 90° out of stowed fairing)
    const seg1VisW = Math.max(2, panelW * innerUnfold);
    const seg1X = side > 0 ? yokeLen + s * 0.02 : -(yokeLen + s * 0.02 + seg1VisW);
    drawSolarPanelSegment(ctx, seg1X, -panelH * 0.5, seg1VisW, panelH, blueprintMode, t);

    // Mechanical inter-panel gold hinges between Segment 1 & Segment 2
    const hingeX = side > 0 ? seg1X + seg1VisW + s * 0.025 : seg1X - s * 0.025;
    if (innerUnfold > 0.35) {
      ctx.fillStyle = blueprintMode ? '#67e8f9' : '#f59e0b';
      ctx.fillRect(hingeX - s * 0.018, -panelH * 0.34, s * 0.036, s * 0.055);
      ctx.fillRect(hingeX - s * 0.018, panelH * 0.34 - s * 0.055, s * 0.036, s * 0.055);
    }

    // Segment 2: Outer Solar Panel (accordion-unfolds cleanly from the inter-panel hinges)
    if (outerUnfold > 0.04) {
      const seg2VisW = Math.max(2, panelW * outerUnfold);
      const seg2X = side > 0 ? hingeX + s * 0.025 : hingeX - s * 0.025 - seg2VisW;
      drawSolarPanelSegment(ctx, seg2X, -panelH * 0.5, seg2VisW, panelH, blueprintMode, t + 0.5);
    }

    ctx.restore();
  }

  // =========================================================================
  // 4. CORNER MAGNETOMETER BOOM & AFT ENGINE NOZZLE BELL
  // =========================================================================
  ctx.strokeStyle = blueprintMode ? '#22d3ee' : '#64748b';
  ctx.lineWidth = Math.max(1.5, s * 0.024);
  ctx.beginPath();
  ctx.moveTo(-busW * 0.38, busH * 0.45);
  ctx.lineTo(-busW * 0.58, busH * 0.88);
  ctx.stroke();
  ctx.fillStyle = blueprintMode ? '#67e8f9' : '#f59e0b';
  ctx.beginPath();
  ctx.arc(-busW * 0.58, busH * 0.88, s * 0.035, 0, Math.PI * 2);
  ctx.fill();

  // Aft main propulsion bell
  ctx.fillStyle = blueprintMode ? 'rgba(6,182,212,0.18)' : '#334155';
  ctx.strokeStyle = blueprintMode ? '#22d3ee' : '#64748b';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-s * 0.075, busH * 0.5);
  ctx.lineTo(-s * 0.125, busH * 0.5 + s * 0.17);
  ctx.lineTo(s * 0.125, busH * 0.5 + s * 0.17);
  ctx.lineTo(s * 0.075, busH * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // =========================================================================
  // 5. CENTRAL SPACECRAFT BUS (GOLD MLI THERMAL INSULATION FOIL)
  // =========================================================================
  if (blueprintMode) {
    ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.4;
    ctx.fillRect(-busW * 0.5, -busH * 0.5, busW, busH);
    ctx.strokeRect(-busW * 0.5, -busH * 0.5, busW, busH);
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(-busW * 0.34, -busH * 0.34, busW * 0.68, busH * 0.68);
    ctx.restore();
  } else {
    // Rich sunlit metallic Gold MLI foil gradient
    const goldGrad = ctx.createLinearGradient(-busW * 0.5, -busH * 0.3, busW * 0.5, busH * 0.3);
    goldGrad.addColorStop(0.0, '#78350f');
    goldGrad.addColorStop(0.24, '#b45309');
    goldGrad.addColorStop(0.54, '#f59e0b');
    goldGrad.addColorStop(0.76, '#fef08a'); // Specular foil crinkle highlight
    goldGrad.addColorStop(0.92, '#d97706');
    goldGrad.addColorStop(1.0, '#92400e');
    ctx.fillStyle = goldGrad;
    ctx.fillRect(-busW * 0.5, -busH * 0.5, busW, busH);

    // Quilted MLI thermal blanket diamond stitch lines
    ctx.strokeStyle = 'rgba(120, 53, 15, 0.38)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-busW * 0.5, 0);
    ctx.lineTo(0, -busH * 0.5);
    ctx.lineTo(busW * 0.5, 0);
    ctx.lineTo(0, busH * 0.5);
    ctx.closePath();
    ctx.moveTo(-busW * 0.5, -busH * 0.5);
    ctx.lineTo(busW * 0.5, busH * 0.5);
    ctx.moveTo(busW * 0.5, -busH * 0.5);
    ctx.lineTo(-busW * 0.5, busH * 0.5);
    ctx.stroke();

    // Structural titanium top & bottom bus collar frames
    ctx.fillStyle = '#334155';
    ctx.fillRect(-busW * 0.52, -busH * 0.52, busW * 1.04, s * 0.055);
    ctx.fillRect(-busW * 0.52, busH * 0.5 - s * 0.035, busW * 1.04, s * 0.055);

    // Optical Star-Tracker / Payload Camera Aperture on spacecraft face
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -busH * 0.08, s * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(s * 0.025, -busH * 0.10, s * 0.035, 0, Math.PI * 2);
    ctx.fill();

    // Live blinking avionics telemetry status LED
    const ledOn = Math.sin(t * 5.2) > -0.2;
    ctx.fillStyle = ledOn ? '#34d399' : '#065f46';
    ctx.beginPath();
    ctx.arc(busW * 0.30, busH * 0.28, s * 0.028, 0, Math.PI * 2);
    ctx.fill();
  }

  // =========================================================================
  // 6. HIGH-GAIN PARABOLIC COMMUNICATIONS DISH ANTENNA (TOP OF BUS)
  // =========================================================================
  const dishBaseY = -busH * 0.5 - s * 0.05;
  const dishR = s * 0.44;
  const dishY = dishBaseY - s * 0.14;

  // Antenna pedestal mast
  ctx.fillStyle = blueprintMode ? '#22d3ee' : '#475569';
  ctx.fillRect(-s * 0.035, dishY, s * 0.07, s * 0.16);

  // Parabolic reflector dish cup
  ctx.beginPath();
  ctx.ellipse(0, dishY, dishR, s * 0.15, 0, 0, Math.PI);
  ctx.closePath();
  if (blueprintMode) {
    ctx.fillStyle = 'rgba(6, 182, 212, 0.16)';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.3;
    ctx.fill();
    ctx.stroke();
  } else {
    const dishGrad = ctx.createLinearGradient(-dishR, dishY, dishR, dishY);
    dishGrad.addColorStop(0.0, '#64748b');
    dishGrad.addColorStop(0.45, '#e2e8f0');
    dishGrad.addColorStop(0.82, '#ffffff');
    dishGrad.addColorStop(1.0, '#cbd5e1');
    ctx.fillStyle = dishGrad;
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // Feed horn tripod struts & central receiver tip
  const hornY = dishY - s * 0.24;
  ctx.strokeStyle = blueprintMode ? '#67e8f9' : '#94a3b8';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-dishR * 0.72, dishY + s * 0.03);
  ctx.lineTo(0, hornY);
  ctx.lineTo(dishR * 0.72, dishY + s * 0.03);
  ctx.moveTo(0, dishY + s * 0.06);
  ctx.lineTo(0, hornY);
  ctx.stroke();

  ctx.fillStyle = sp >= 0.875 ? '#38bdf8' : '#cbd5e1';
  ctx.beginPath();
  ctx.arc(0, hornY, s * 0.036, 0, Math.PI * 2);
  ctx.fill();

  // =========================================================================
  // 7. COLD-GAS RCS ATTITUDE CONTROL MICRO-THRUSTER PUFFS
  // =========================================================================
  if (deployRatio > 0.85 && !reducedMotion) {
    const rcsCycle = t % 3.4;
    const drawRcsPuff = (px: number, py: number, dirX: -1 | 1, prog: number) => {
      const p = Math.sin(prog * Math.PI);
      const len = s * (0.20 + p * 0.24);
      const rGrad = ctx.createLinearGradient(px, py, px + dirX * len, py);
      rGrad.addColorStop(0.0, `rgba(224, 242, 254, ${p * 0.78})`);
      rGrad.addColorStop(1.0, 'rgba(224, 242, 254, 0)');
      ctx.fillStyle = rGrad;
      ctx.beginPath();
      ctx.moveTo(px, py - s * 0.015);
      ctx.lineTo(px + dirX * len, py - s * 0.085);
      ctx.lineTo(px + dirX * len, py + s * 0.085);
      ctx.lineTo(px, py + s * 0.015);
      ctx.closePath();
      ctx.fill();
    };

    if (rcsCycle > 0.2 && rcsCycle < 0.48) {
      drawRcsPuff(-busW * 0.52, -busH * 0.36, -1, (rcsCycle - 0.2) / 0.28);
    } else if (rcsCycle > 1.9 && rcsCycle < 2.18) {
      drawRcsPuff(busW * 0.52, busH * 0.36, 1, (rcsCycle - 1.9) / 0.28);
    }
  }

  // Blueprint CAD callout labels
  if (blueprintMode) {
    ctx.fillStyle = '#67e8f9';
    ctx.font = `600 ${Math.max(9, Math.round(s * 0.08))}px "JetBrains Mono", monospace`;
    ctx.fillText('HGA DISH', dishR + s * 0.08, dishY);
    ctx.fillText('MLI BUS', busW * 0.5 + s * 0.08, busH * 0.46);
  }

  ctx.restore();
}
