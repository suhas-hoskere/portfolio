import {
  type Scene2DFrameContext,
  lerp,
  smoothstep,
  mulberry32,
} from './types';
import { INDIA_EXACT_OUTLINE } from './indiaExactPath';

interface OrbitalSatSpec {
  rxScale: number;
  ryScale: number;
  tiltRad: number;
  phase: number;
}

const CONSTELLATION: OrbitalSatSpec[] = [
  { rxScale: 1.24, ryScale: 0.32, tiltRad: -0.20, phase: 0.72 },
  { rxScale: 1.38, ryScale: 0.38, tiltRad: 0.16, phase: 2.35 },
  { rxScale: 1.52, ryScale: 0.28, tiltRad: -0.07, phase: 4.15 },
];

let cachedEarthSprite: HTMLCanvasElement | null = null;
const EARTH_SPRITE_SIZE = 820;
const EARTH_SPRITE_R = 344; // leaves 66px silky outer atmospheric glow margin

// Placement of exact India map on Earth's visible upper orbital crown
const INDIA_CX_NORM = 0.04;
const INDIA_CY_NORM = -0.75;
const INDIA_SPAN_NORM = 0.41;

/** Maps exact normalized India-map space ([-0.45..0.45], [-0.5..0.5]) onto globe [-1..1] */
function indiaToGlobe(ux: number, uy: number): [number, number] {
  return [
    INDIA_CX_NORM + ux * INDIA_SPAN_NORM,
    INDIA_CY_NORM + uy * INDIA_SPAN_NORM,
  ];
}

/** Converts real WGS84 (lon°E, lat°N) to exact normalized India-map space aligned with INDIA_EXACT_OUTLINE */
function lonLatToIndiaNorm(lon: number, lat: number): [number, number] {
  const ux = -0.447 + ((lon - 68.1) / (97.4 - 68.1)) * 0.894;
  const uy = 0.50 - (lat - 8.08) / (37.0 - 8.08);
  return [ux, uy];
}

const SRI_LANKA_LON_LAT: [number, number][] = [
  [80.05, 9.8],
  [80.85, 8.9],
  [81.65, 7.7],
  [81.85, 6.9],
  [81.1, 6.05],
  [80.2, 5.95],
  [79.85, 6.95],
  [79.8, 8.2],
  [79.95, 9.2],
];

/**
 * Pre-renders a photorealistic monochrome LEO Earth globe sprite ONCE (820x820, 0ms per-frame cost!):
 * - ZERO wireframe grid lines!
 * - Silky zero-banding radial atmospheric limb glow
 * - Pixel-exact official India map extracted directly from the user-provided outline + Sri Lanka
 * - Soft swirling orbital cloud cover + glowing Indian metro city lights
 */
function getEarthSprite(): HTMLCanvasElement {
  if (cachedEarthSprite) return cachedEarthSprite;

  const size = EARTH_SPRITE_SIZE;
  const r = EARTH_SPRITE_R;
  const c = size * 0.5;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(42026);

  // 1. Silky continuous outer atmospheric halo (zero banding!)
  const halo = ctx.createRadialGradient(c, c, r - 3, c, c, r + 62);
  halo.addColorStop(0.0, 'rgba(255, 255, 255, 0.72)');
  halo.addColorStop(0.10, 'rgba(244, 244, 250, 0.34)');
  halo.addColorStop(0.28, 'rgba(218, 218, 230, 0.13)');
  halo.addColorStop(0.58, 'rgba(190, 190, 210, 0.035)');
  halo.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(c, c, r + 62, 0, Math.PI * 2);
  ctx.fill();

  // 2. Clipped spherical planetary body
  ctx.save();
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.clip();

  // Deep orbital ocean shading (sunlit charcoal-silver upper-right -> obsidian lower-left, zero grid!)
  const ocean = ctx.createRadialGradient(c + r * 0.32, c - r * 0.58, r * 0.08, c, c, r * 1.22);
  ocean.addColorStop(0.0, '#22222b');
  ocean.addColorStop(0.36, '#131319');
  ocean.addColorStop(0.75, '#0a0a0e');
  ocean.addColorStop(1.0, '#050507');
  ctx.fillStyle = ocean;
  ctx.fillRect(c - r, c - r, r * 2, r * 2);

  // 3. Exact Official India Map Outline (167-vertex exact contour)
  ctx.fillStyle = 'rgba(235, 235, 244, 0.14)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.lineWidth = 1.35;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  INDIA_EXACT_OUTLINE.forEach(([ux, uy], idx) => {
    const [gx, gy] = indiaToGlobe(ux, uy);
    const x = c + gx * r;
    const y = c + gy * r;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Sri Lanka nestled naturally below Tamil Nadu
  ctx.fillStyle = 'rgba(235, 235, 244, 0.15)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  SRI_LANKA_LON_LAT.forEach(([lon, lat], idx) => {
    const [ux, uy] = lonLatToIndiaNorm(lon, lat);
    const [gx, gy] = indiaToGlobe(ux, uy);
    const x = c + gx * r;
    const y = c + gy * r;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Subtle soft orbital cloud wisps across the Indian Ocean & Bay of Bengal
  for (let cl = 0; cl < 18; cl++) {
    const cxPos = c + (rand() - 0.5) * r * 1.50;
    const cyPos = c - r * 0.42 - rand() * r * 0.52;
    const rw = 24 + rand() * 54;
    const rh = 6 + rand() * 13;
    const rot = (rand() - 0.5) * 0.55;
    const a = 0.045 + rand() * 0.085;

    ctx.save();
    ctx.translate(cxPos, cyPos);
    ctx.rotate(rot);
    const cg = ctx.createRadialGradient(0, 0, 1, 0, 0, rw);
    cg.addColorStop(0.0, `rgba(255, 255, 255, ${a})`);
    cg.addColorStop(0.55, `rgba(220, 220, 228, ${a * 0.4})`);
    cg.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
    ctx.scale(1, rh / rw);
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, 0, rw, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Real-coordinate Indian metro city-light clusters mapped onto exact India contour
  const cities: [number, number, number][] = [
    [77.59, 12.97, 2.7], // Bangalore
    [80.27, 13.08, 2.1], // Chennai
    [80.23, 13.72, 1.8], // Sriharikota
    [75.92, 14.46, 1.5], // Davanagere
    [78.48, 17.38, 2.1], // Hyderabad
    [72.88, 19.07, 2.5], // Mumbai
    [77.21, 28.61, 2.6], // Delhi NCR
    [88.36, 22.57, 2.1], // Kolkata
  ];
  for (const [lon, lat, cr] of cities) {
    const [ux, uy] = lonLatToIndiaNorm(lon, lat);
    const [gx, gy] = indiaToGlobe(ux, uy);
    const lx = c + gx * r;
    const ly = c + gy * r;
    const lg = ctx.createRadialGradient(lx, ly, 0.4, lx, ly, cr * 3.8);
    lg.addColorStop(0.0, 'rgba(255, 255, 255, 0.82)');
    lg.addColorStop(0.35, 'rgba(240, 240, 248, 0.26)');
    lg.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(lx, ly, cr * 3.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft spherical limb inner atmospheric scatter
  const innerRim = ctx.createRadialGradient(c, c, r * 0.82, c, c, r);
  innerRim.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
  innerRim.addColorStop(0.74, 'rgba(220, 220, 232, 0.06)');
  innerRim.addColorStop(0.94, 'rgba(255, 255, 255, 0.24)');
  innerRim.addColorStop(1.0, 'rgba(255, 255, 255, 0.56)');
  ctx.fillStyle = innerRim;
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // End globe clip

  // Crisp 1.4px glowing atmospheric horizon line on top arc
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(c, c, r, Math.PI * 1.04, Math.PI * 1.96);
  ctx.stroke();

  cachedEarthSprite = canvas;
  return canvas;
}

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
 * Pure Monochrome Photorealistic Earth-to-Orbit Globe (sp 0.215 -> 1.000):
 * - Smoothly reveals the full shaded monochrome Earth globe right below the climbing rocket
 *   with pixel-exact India map, Sri Lanka, glowing city lights & Bangalore ISRO radar reticle!
 */
export function renderEarthAndOrbit(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, t, mouseX, mouseY, vehicleAnchorX, unit, reducedMotion } = frame;

  if (sp < 0.215) return;

  const baseEarthR = Math.max(w, h) * 0.58;
  const leoTopY = Math.max(h * 0.56, h - baseEarthR * 0.48);

  const climbCurve = smoothstep(0.215, 0.480, sp);
  const earthFadeIn = smoothstep(0.215, 0.310, sp);

  const earthR = baseEarthR * Math.pow(3.2, Math.pow(1 - climbCurve, 1.25));
  const terminalDrop = smoothstep(0.84, 1.0, sp) * baseEarthR * 0.06;
  const topLimbY = lerp(h * 0.86, leoTopY, climbCurve) + terminalDrop - mouseY * (2 + 4 * climbCurve);

  const leoCenterX = lerp(w * 0.62, vehicleAnchorX + unit * 0.15, 0.55);
  const centerX = lerp(vehicleAnchorX, leoCenterX, climbCurve) - mouseX * (5 + 5 * climbCurve);
  const centerY = topLimbY + earthR;

  const blrReticleAlpha = smoothstep(0.35, 0.47, sp);
  const orbitRingAlpha = smoothstep(0.36, 0.48, sp);

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

  // 1. Back orbital trace arcs
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

  // 2. Full Cached Photorealistic Monochrome Earth Globe Sprite
  const earthImg = getEarthSprite();
  const drawScale = earthR / EARTH_SPRITE_R;
  const drawSize = EARTH_SPRITE_SIZE * drawScale;
  ctx.drawImage(earthImg, centerX - drawSize * 0.5, centerY - drawSize * 0.5, drawSize, drawSize);

  // 3. BANGALORE ISRO GROUND STATION RETICLE (exact projected 12.97° N, 77.59° E!)
  if (blrReticleAlpha > 0.01) {
    const [blrUx, blrUy] = lonLatToIndiaNorm(77.59, 12.97);
    const [blrGx, blrGy] = indiaToGlobe(blrUx, blrUy);
    const blrX = centerX + blrGx * earthR;
    const blrY = centerY + blrGy * earthR;
    if (blrY < h - 32 && blrY > topLimbY) {
      ctx.save();
      ctx.globalAlpha = earthFadeIn * blrReticleAlpha;
      const pingWave = reducedMotion ? 0.35 : (t * 0.78) % 1.0;

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(blrX, blrY, unit * 0.075, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - pingWave) * 0.72})`;
      ctx.beginPath();
      ctx.arc(blrX, blrY, unit * (0.075 + pingWave * 0.24), 0, Math.PI * 2);
      ctx.stroke();

      const tick = unit * 0.12;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(blrX - tick, blrY);
      ctx.lineTo(blrX - unit * 0.04, blrY);
      ctx.moveTo(blrX + unit * 0.04, blrY);
      ctx.lineTo(blrX + tick, blrY);
      ctx.moveTo(blrX, blrY - tick);
      ctx.lineTo(blrX, blrY - unit * 0.04);
      ctx.moveTo(blrX, blrY + unit * 0.04);
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

  // 4. Front orbital trace arcs & monochrome Keplerian satellites
  if (orbitRingAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = earthFadeIn * orbitRingAlpha;
    for (let i = 0; i < CONSTELLATION.length; i++) {
      const sat = CONSTELLATION[i];
      ctx.save();
      ctx.translate(centerX, centerY - earthR * 0.24);
      ctx.rotate(sat.tiltRad);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
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
