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

const CONSTELLATION: OrbitalSatSpec[] = [
  { rxScale: 1.12, ryScale: 0.30, tiltRad: -0.22, phase: 0.72 },
  { rxScale: 1.20, ryScale: 0.36, tiltRad: 0.18, phase: 2.35 },
  { rxScale: 1.28, ryScale: 0.26, tiltRad: -0.08, phase: 4.15 },
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
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.fillRect(-scale * 2.0, -scale * 0.38, scale * 1.4, scale * 0.76);
  ctx.strokeRect(-scale * 2.0, -scale * 0.38, scale * 1.4, scale * 0.76);
  ctx.fillRect(scale * 0.6, -scale * 0.38, scale * 1.4, scale * 0.76);
  ctx.strokeRect(scale * 0.6, -scale * 0.38, scale * 1.4, scale * 0.76);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-scale * 0.45, -scale * 0.50, scale * 0.90, scale * 1.0);
  ctx.restore();
}

/**
 * Pure monochrome Black & White 2.5D Orbital Earth (Stage 02: sp 0.315 -> 0.518):
 * - Obsidian planet sphere with fine silver latitude/longitude wireframe graticule
 * - Crisp white Indian Subcontinent & Sri Lanka geographic contour
 * - Clean white Bangalore ISRO Ground Station reticle (12.97° N, 77.59° E)
 * - 3 minimalist white satellites along dashed Keplerian ellipses (scroll-driven, zero lag!)
 */
export function renderEarthAndOrbit(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, t, mouseX, mouseY, vehicleAnchorX, unit, reducedMotion } = frame;

  // Earth's curved outer atmosphere rises during orbital insertion (0.35+) and stays through 100%!
  if (sp < 0.345) return;

  const fadeIn = smoothstep(0.345, 0.435, sp);
  const opacity = fadeIn;
  if (opacity < 0.01) return;

  const earthR = Math.max(w, h) * 0.56;
  const centerX = lerp(w * 0.58, vehicleAnchorX + unit * 0.4, 0.55) - mouseX * 10;

  // Rises majestically into Earth's outer atmosphere and settles cleanly beneath the orbiting satellite
  const settleY = h + earthR * 0.56 + smoothstep(0.84, 1.0, sp) * earthR * 0.08;
  const centerY = lerp(h + earthR * 1.15, settleY, fadeIn) - mouseY * 6;

  // Live orbital motion + scroll offset so Keplerian satellites continuously glide around Earth
  const orbitAdvance = (sp - 0.35) * 3.0 + (reducedMotion ? 0 : t * 0.22);

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
  ctx.globalAlpha = opacity;

  // 1. Back orbital trace arcs
  ctx.setLineDash([4, 4]);
  for (const sat of CONSTELLATION) {
    ctx.save();
    ctx.translate(centerX, centerY - earthR * 0.24);
    ctx.rotate(sat.tiltRad);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, earthR * sat.rxScale, earthR * sat.ryScale, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.setLineDash([]);

  // 2. Crisp Obsidian Earth Disc + Thin White Atmospheric Rim Arc
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.arc(centerX, centerY, earthR, 0, Math.PI * 2);
  ctx.fill();

  // Clip interior to draw subtle orbital graticule & crisp India contour
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, earthR, 0, Math.PI * 2);
  ctx.clip();

  // Latitude & Longitude wireframe graticule
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
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
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.58)';
  ctx.lineWidth = 1.25;
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
  ctx.ellipse(centerX + earthR * 0.13, centerY - earthR * 0.40, earthR * 0.022, earthR * 0.032, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore(); // End globe clip

  // Outer crisp white atmospheric rim line + subtle secondary halo arc
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(centerX, centerY, earthR, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(centerX, centerY, earthR + 10, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();

  // 3. BANGALORE ISRO GROUND STATION RETICLE (12.97° N, 77.59° E) + LIVE PULSING RADAR PING
  const blrX = centerX + earthR * 0.04;
  const blrY = centerY - earthR * 0.56;
  if (blrY < h + 40) {
    const pingWave = reducedMotion ? 0.35 : (t * 0.78) % 1.0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(blrX, blrY, unit * 0.085, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - pingWave) * 0.78})`;
    ctx.beginPath();
    ctx.arc(blrX, blrY, unit * (0.085 + pingWave * 0.28), 0, Math.PI * 2);
    ctx.stroke();

    const tick = unit * 0.14;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(blrX - tick, blrY);
    ctx.lineTo(blrX - unit * 0.045, blrY);
    ctx.moveTo(blrX + unit * 0.045, blrY);
    ctx.lineTo(blrX + tick, blrY);
    ctx.moveTo(blrX, blrY - tick);
    ctx.lineTo(blrX, blrY - unit * 0.045);
    ctx.moveTo(blrX, blrY + unit * 0.045);
    ctx.lineTo(blrX, blrY + tick);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(blrX, blrY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `600 ${Math.max(9, Math.round(unit * 0.082))}px "JetBrains Mono", monospace`;
    ctx.fillText('BLR // 12.97°N 77.59°E', blrX + unit * 0.16, blrY + 3);
  }

  // 4. Front orbital trace arcs & monochrome Keplerian satellites
  for (let i = 0; i < CONSTELLATION.length; i++) {
    const sat = CONSTELLATION[i];
    ctx.save();
    ctx.translate(centerX, centerY - earthR * 0.24);
    ctx.rotate(sat.tiltRad);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, earthR * sat.rxScale, earthR * sat.ryScale, 0, 0, Math.PI);
    ctx.stroke();
    ctx.restore();

    const angle = sat.phase + (i % 2 === 0 ? orbitAdvance : -orbitAdvance * 0.85);
    const pos = satPos(sat, angle);
    if (pos.isFront) {
      drawMonoMiniSat(ctx, pos.x, pos.y, Math.max(5, unit * 0.085), sat.tiltRad);
    }
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}
