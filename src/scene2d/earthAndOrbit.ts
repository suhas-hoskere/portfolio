import {
  type Scene2DFrameContext,
  lerp,
  smoothstep,
} from './types';

interface OrbitalSatSpec {
  rxScale: number;
  ryScale: number;
  tiltRad: number;
  phase: number;
}

// Wide orbital trajectories so satellites sweep cleanly across and beyond viewport edges
const CONSTELLATION: OrbitalSatSpec[] = [
  { rxScale: 1.24, ryScale: 0.32, tiltRad: -0.20, phase: 0.72 },
  { rxScale: 1.38, ryScale: 0.38, tiltRad: 0.16, phase: 2.35 },
  { rxScale: 1.52, ryScale: 0.28, tiltRad: -0.07, phase: 4.15 },
];

function drawMonoMiniSat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  tiltRad: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tiltRad * 0.7);
  ctx.fillStyle = '#09090b';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
  ctx.lineWidth = 0.9;
  ctx.fillRect(-scale * 2.0, -scale * 0.38, scale * 1.4, scale * 0.76);
  ctx.strokeRect(-scale * 2.0, -scale * 0.38, scale * 1.4, scale * 0.76);
  ctx.fillRect(scale * 0.6, -scale * 0.38, scale * 1.4, scale * 0.76);
  ctx.strokeRect(scale * 0.6, -scale * 0.38, scale * 1.4, scale * 0.76);

  ctx.fillStyle = '#e4e4e7';
  ctx.fillRect(-scale * 0.45, -scale * 0.50, scale * 0.90, scale * 1.0);
  ctx.restore();
}

/**
 * Pure Monochrome Continuous Earth-to-Orbit Horizon (sp 0.165 -> 1.000):
 * - Seamlessly takes over from Sriharikota's flat horizon at liftoff (sp = 0.170) with near-flat planetary radius,
 *   then realistically zooms out into a glowing curved Earth limb & full 420 km LEO view!
 * - Earth stays ALWAYS visible beneath the vehicle from Ground Zero through Orbital Uplink (0% -> 100%).
 */
export function renderEarthAndOrbit(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, t, mouseX, mouseY, vehicleAnchorX, groundY, unit, reducedMotion } = frame;

  // Begins blending seamlessly under the flat ground right before liftoff so there is ZERO gap
  if (sp < 0.162) return;

  const baseHorizonY = groundY - unit * 0.24;
  const baseEarthR = Math.max(w, h) * 0.56;
  const leoTopY = Math.max(h * 0.62, h - baseEarthR * 0.44);

  // Continuous realistic camera zoom-out: flat ground (0.170) -> curved atmosphere -> LEO globe (0.480+)
  const zoomOut = smoothstep(0.170, 0.480, sp);
  const earthFadeIn = smoothstep(0.162, 0.195, sp);

  // Exponential curvature zoom-out: starts ~4.8x viewport (flat!) and smoothly tightens to 0.56x viewport (LEO)
  const earthR = baseEarthR * Math.pow(8.6, Math.pow(1 - zoomOut, 1.25));

  // Pin Earth's upper horizon limb smoothly in the lower viewport at ALL times (never disappears!)
  const terminalDrop = smoothstep(0.84, 1.0, sp) * baseEarthR * 0.06;
  const topLimbY = lerp(baseHorizonY, leoTopY, zoomOut) + terminalDrop - mouseY * (2 + 4 * zoomOut);

  // Shift horizontal center smoothly from launch pad X toward balanced orbital center
  const leoCenterX = lerp(w * 0.58, vehicleAnchorX + unit * 0.35, 0.52);
  const centerX = lerp(vehicleAnchorX, leoCenterX, zoomOut) - mouseX * (5 + 5 * zoomOut);
  const centerY = topLimbY + earthR;

  // Gradual reveal of space-altitude features as we zoom out into outer atmosphere & LEO
  const atmoGlow = smoothstep(0.19, 0.42, sp);
  const surfaceDetailAlpha = smoothstep(0.27, 0.45, sp);
  const blrReticleAlpha = smoothstep(0.32, 0.46, sp);
  const orbitRingAlpha = smoothstep(0.33, 0.48, sp);

  // Live orbital motion + scroll offset so Keplerian satellites continuously glide around Earth
  const orbitAdvance = (sp - 0.35) * 3.0 + (reducedMotion ? 0 : t * 0.20);

  const satPos = (sat: OrbitalSatSpec, angle: number) => {
    const lx = Math.cos(angle) * earthR * sat.rxScale;
    const ly = Math.sin(angle) * earthR * sat.ryScale;
    const cosT = Math.cos(sat.tiltRad);
    const sinT = Math.sin(sat.tiltRad);
    return {
      x: centerX + lx * cosT - ly * sinT,
      y: centerY - earthR * 0.24 + lx * sinT + ly * cosT,
      isFront: Math.sin(angle) >= 0,
    };
  };

  ctx.save();
  ctx.globalAlpha = earthFadeIn;

  // 1. Back orbital trace arcs (fade in cleanly once approaching LEO)
  if (orbitRingAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = earthFadeIn * orbitRingAlpha;
    ctx.setLineDash([4, 4]);
    for (const sat of CONSTELLATION) {
      ctx.save();
      ctx.translate(centerX, centerY - earthR * 0.24);
      ctx.rotate(sat.tiltRad);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, earthR * sat.rxScale, earthR * sat.ryScale, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 2. Soft Outer Atmosphere Halo Glow along Earth's curved limb (zero per-frame gradient allocation!)
  if (atmoGlow > 0.01) {
    ctx.strokeStyle = `rgba(228, 228, 234, ${0.06 * atmoGlow})`;
    ctx.lineWidth = lerp(18, 42, zoomOut);
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthR + lerp(8, 16, zoomOut), Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();

    ctx.strokeStyle = `rgba(244, 244, 248, ${0.12 * atmoGlow})`;
    ctx.lineWidth = lerp(8, 18, zoomOut);
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthR + lerp(3, 6, zoomOut), Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${0.22 * atmoGlow})`;
    ctx.lineWidth = lerp(3, 6, zoomOut);
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthR + 1.5, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  }

  // 3. Obsidian Earth Disc (matches ground #09090b seamlessly on liftoff!)
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.arc(centerX, centerY, earthR, 0, Math.PI * 2);
  ctx.fill();

  // Clip interior to draw subtle orbital graticule & crisp India contour as we zoom out
  if (surfaceDetailAlpha > 0.01) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthR, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = earthFadeIn * surfaceDetailAlpha;

    // Latitude & Longitude wireframe graticule
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let lat = -3; lat <= 3; lat++) {
      const ly = centerY + (lat / 4) * earthR;
      ctx.beginPath();
      ctx.moveTo(centerX - earthR, ly);
      ctx.lineTo(centerX + earthR, ly);
      ctx.stroke();
    }
    for (let lon = -3; lon <= 3; lon++) {
      const rx = Math.abs((lon / 4) * earthR);
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, Math.max(8, rx), earthR, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Crisp monochrome Indian Subcontinent contour
    const indiaPts: [number, number][] = [
      [-0.16, -0.82],
      [0.02, -0.88],
      [0.20, -0.78],
      [0.28, -0.66],
      [0.16, -0.54],
      [0.08, -0.44],
      [0.01, -0.43],
      [-0.06, -0.54],
      [-0.14, -0.68],
      [-0.22, -0.74],
    ];
    ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.52)';
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    indiaPts.forEach(([nx, ny], idx) => {
      const x = centerX + nx * earthR;
      const y = centerY + ny * earthR;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sri Lanka contour
    ctx.beginPath();
    ctx.ellipse(
      centerX + earthR * 0.13,
      centerY - earthR * 0.40,
      earthR * 0.022,
      earthR * 0.032,
      0.15,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    ctx.restore(); // End globe clip
  }

  // 4. Crisp White Atmospheric Limb Line (seamlessly intensifies from horizon line -> bright orbital rim)
  const rimAlpha = lerp(0.18, 0.82, atmoGlow);
  ctx.strokeStyle = `rgba(255, 255, 255, ${rimAlpha})`;
  ctx.lineWidth = lerp(1.0, 1.7, zoomOut);
  ctx.beginPath();
  ctx.arc(centerX, centerY, earthR, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();

  if (atmoGlow > 0.08) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.18 * atmoGlow})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthR + 9, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
  }

  // 5. BANGALORE ISRO GROUND STATION RETICLE (12.97° N, 77.59° E) + PULSING RADAR PING
  if (blrReticleAlpha > 0.01) {
    const blrX = centerX + earthR * 0.04;
    const blrY = centerY - earthR * 0.56;
    if (blrY < h + 40 && blrY > topLimbY) {
      ctx.save();
      ctx.globalAlpha = earthFadeIn * blrReticleAlpha;
      const pingWave = reducedMotion ? 0.35 : (t * 0.78) % 1.0;

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(blrX, blrY, unit * 0.08, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - pingWave) * 0.72})`;
      ctx.beginPath();
      ctx.arc(blrX, blrY, unit * (0.08 + pingWave * 0.26), 0, Math.PI * 2);
      ctx.stroke();

      const tick = unit * 0.13;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(blrX - tick, blrY);
      ctx.lineTo(blrX - unit * 0.042, blrY);
      ctx.moveTo(blrX + unit * 0.042, blrY);
      ctx.lineTo(blrX + tick, blrY);
      ctx.moveTo(blrX, blrY - tick);
      ctx.lineTo(blrX, blrY - unit * 0.042);
      ctx.moveTo(blrX, blrY + unit * 0.042);
      ctx.lineTo(blrX, blrY + tick);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(blrX, blrY, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = `600 ${Math.max(9, Math.round(unit * 0.08))}px "JetBrains Mono", monospace`;
      ctx.fillText('BLR // 12.97°N 77.59°E', blrX + unit * 0.15, blrY + 3);
      ctx.restore();
    }
  }

  // 6. Front orbital trace arcs & wide-sweeping monochrome Keplerian satellites
  if (orbitRingAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = earthFadeIn * orbitRingAlpha;
    for (let i = 0; i < CONSTELLATION.length; i++) {
      const sat = CONSTELLATION[i];
      ctx.save();
      ctx.translate(centerX, centerY - earthR * 0.24);
      ctx.rotate(sat.tiltRad);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.26)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, earthR * sat.rxScale, earthR * sat.ryScale, 0, 0, Math.PI);
      ctx.stroke();
      ctx.restore();

      const angle = sat.phase + (i % 2 === 0 ? orbitAdvance : -orbitAdvance * 0.85);
      const pos = satPos(sat, angle);
      if (pos.isFront) {
        drawMonoMiniSat(ctx, pos.x, pos.y, Math.max(5, unit * 0.082), sat.tiltRad);
      }
    }
    ctx.restore();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}
