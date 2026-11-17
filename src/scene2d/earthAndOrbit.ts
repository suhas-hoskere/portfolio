import {
  type Scene2DFrameContext,
  lerp,
  smoothstep,
} from './types';
import { drawIndiaSilhouette, INDIA_LANDMARKS } from './indiaMapPath';

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
 * Pure monochrome Black & White 2.5D Earth Outer Atmosphere (sp 0.345 -> 1.00):
 * - Rises cleanly during orbital insertion and stays permanently beneath the orbiting satellite
 * - High-precision authentic vector silhouette of INDIA centered cleanly in the visible upper arc
 * - Sriharikota (SHAR) launch-origin pin with curved dashed ascent arc rising into orbit
 * - Pulsing Bangalore ISRO Ground Station reticle (BLR // 12.97°N 77.59°E)
 * - 3 live orbiting Keplerian satellites on dashed monochrome ellipses
 */
export function renderEarthAndOrbit(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, t, mouseX, mouseY, vehicleAnchorX, unit, reducedMotion } = frame;

  if (sp < 0.345) return;

  const fadeIn = smoothstep(0.345, 0.435, sp);
  const opacity = fadeIn;
  if (opacity < 0.01) return;

  const earthR = Math.max(w, h) * 0.56;
  const centerX = lerp(w * 0.58, vehicleAnchorX + unit * 0.35, 0.55) - mouseX * 10;

  // Positions Earth's upper curved horizon cleanly in the lower 42% of the viewport so ALL of India is clearly visible!
  const settleY = h + earthR * 0.54 + smoothstep(0.84, 1.0, sp) * earthR * 0.06;
  const centerY = lerp(h + earthR * 1.15, settleY, fadeIn) - mouseY * 6;

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

  // 2. Crisp Obsidian Earth Disc + Graticule + High-Precision INDIA Map
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.arc(centerX, centerY, earthR, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, earthR, 0, Math.PI * 2);
  ctx.clip();

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

  // Prominent, geographically accurate INDIA silhouette centered right on the visible upper arc!
  const indiaCx = centerX + earthR * 0.02;
  const indiaCy = centerY - earthR * 0.72;
  const indiaScale = earthR * 0.22;

  drawIndiaSilhouette(
    ctx,
    indiaCx,
    indiaCy,
    indiaScale,
    'rgba(255, 255, 255, 0.16)',
    'rgba(255, 255, 255, 0.85)',
    1.45
  );

  // Clean editorial cartographic "INDIA" watermark centered on the subcontinent
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.font = `700 ${Math.max(10, Math.round(indiaScale * 0.16))}px "Space Grotesk", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('I N D I A', indiaCx - indiaScale * 0.08, indiaCy - indiaScale * 0.04);
  ctx.textAlign = 'left';

  ctx.restore(); // End globe clip

  // Outer crisp white atmospheric rim line + upper outer-atmosphere edge ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(centerX, centerY, earthR, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(centerX, centerY, earthR + 11, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();

  // 3. SRIHARIKOTA (SHAR) LAUNCH ORIGIN PIN + CURVED TRAJECTORY ARC RISING INTO ORBIT
  const sharX = indiaCx + INDIA_LANDMARKS.sriharikota[0] * indiaScale;
  const sharY = indiaCy + INDIA_LANDMARKS.sriharikota[1] * indiaScale;
  const blrX = indiaCx + INDIA_LANDMARKS.bangalore[0] * indiaScale;
  const blrY = indiaCy + INDIA_LANDMARKS.bangalore[1] * indiaScale;

  // Curved dashed ascent trajectory rising right off Sriharikota on India's coast toward the orbiting satellite!
  const satTargetX = vehicleAnchorX - mouseX * 10;
  const satTargetY = h * 0.44 - mouseY * 7;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.lineWidth = 1.15;
  ctx.setLineDash([5, 5]);
  ctx.lineDashOffset = reducedMotion ? 0 : -t * 18;
  ctx.beginPath();
  ctx.moveTo(sharX, sharY);
  ctx.quadraticCurveTo(
    (sharX + satTargetX) * 0.5 + unit * 0.45,
    (sharY + satTargetY) * 0.5 - unit * 0.35,
    satTargetX,
    satTargetY + unit * 0.42
  );
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Sriharikota SHAR Launch Site Pin
  if (sharY < h + 20) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sharX, sharY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(sharX, sharY, 6.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = `600 ${Math.max(8, Math.round(unit * 0.075))}px "JetBrains Mono", monospace`;
    ctx.fillText('SHAR // LAUNCH', sharX + 10, sharY + 3);
  }

  // 4. BANGALORE ISRO GROUND STATION RETICLE (12.97° N, 77.59° E)
  if (blrY < h + 20) {
    const pingWave = reducedMotion ? 0.35 : (t * 0.78) % 1.0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(blrX, blrY, unit * 0.065, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - pingWave) * 0.78})`;
    ctx.beginPath();
    ctx.arc(blrX, blrY, unit * (0.065 + pingWave * 0.22), 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(blrX, blrY, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.font = `600 ${Math.max(8, Math.round(unit * 0.075))}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'right';
    ctx.fillText('BLR // 12.97°N', blrX - 10, blrY + 3);
    ctx.textAlign = 'left';
  }

  // 5. Front orbital trace arcs & monochrome Keplerian satellites
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
