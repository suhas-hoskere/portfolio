import {
  type Scene2DFrameContext,
  lerp,
  smoothstep,
  mulberry32,
} from './types';

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

/**
 * Pre-renders a clean, photorealistic monochrome LEO Earth globe sprite ONCE (820x820, 0ms per-frame cost!):
 * - ZERO map outlines, ZERO wireframe grids!
 * - Silky zero-banding radial atmospheric limb glow
 * - Spherical sunlit-to-obsidian ocean depth + soft swirling monochrome orbital weather cloud bands
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

  // Deep orbital ocean shading (sunlit silver-charcoal upper-right -> deep obsidian lower-left)
  const ocean = ctx.createRadialGradient(c + r * 0.32, c - r * 0.58, r * 0.08, c, c, r * 1.22);
  ocean.addColorStop(0.0, '#24242d');
  ocean.addColorStop(0.36, '#14141a');
  ocean.addColorStop(0.75, '#0a0a0e');
  ocean.addColorStop(1.0, '#050507');
  ctx.fillStyle = ocean;
  ctx.fillRect(c - r, c - r, r * 2, r * 2);

  // Clean swirling monochrome orbital cloud bands across the planetary hemisphere
  for (let cl = 0; cl < 32; cl++) {
    const cxPos = c + (rand() - 0.5) * r * 1.65;
    const cyPos = c - r * 0.32 - rand() * r * 0.65;
    const rw = 30 + rand() * 76;
    const rh = 7 + rand() * 18;
    const rot = (rand() - 0.5) * 0.58;
    const a = 0.06 + rand() * 0.13;

    ctx.save();
    ctx.translate(cxPos, cyPos);
    ctx.rotate(rot);
    const cg = ctx.createRadialGradient(0, 0, 1, 0, 0, rw);
    cg.addColorStop(0.0, `rgba(255, 255, 255, ${a})`);
    cg.addColorStop(0.55, `rgba(220, 220, 228, ${a * 0.42})`);
    cg.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
    ctx.scale(1, rh / rw);
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, 0, rw, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Soft spherical limb inner atmospheric scatter (brighter on upper-right side facing the Sun!)
  const innerRim = ctx.createRadialGradient(c, c, r * 0.80, c, c, r);
  innerRim.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
  innerRim.addColorStop(0.72, 'rgba(220, 220, 232, 0.05)');
  innerRim.addColorStop(0.94, 'rgba(255, 255, 255, 0.22)');
  innerRim.addColorStop(1.0, 'rgba(255, 255, 255, 0.52)');
  ctx.fillStyle = innerRim;
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.fill();

  // Directional Sun-facing specular horizon bloom on upper-right limb (ties Earth lighting to the Sun!)
  const sunGlint = ctx.createRadialGradient(
    c + r * 0.42,
    c - r * 0.84,
    4,
    c + r * 0.42,
    c - r * 0.84,
    r * 0.52
  );
  sunGlint.addColorStop(0.0, 'rgba(255, 255, 255, 0.42)');
  sunGlint.addColorStop(0.42, 'rgba(244, 244, 252, 0.14)');
  sunGlint.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sunGlint;
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.fill();

  // Subtle twilight shadow on far left limb opposite the Sun
  const dusk = ctx.createLinearGradient(c - r, c - r * 0.5, c - r * 0.15, c - r * 0.5);
  dusk.addColorStop(0.0, 'rgba(4, 4, 7, 0.58)');
  dusk.addColorStop(1.0, 'rgba(4, 4, 7, 0)');
  ctx.fillStyle = dusk;
  ctx.fillRect(c - r, c - r, r, r * 2);

  ctx.restore(); // End globe clip

  // Crisp glowing atmospheric horizon line — brighter on the Sun-facing right arc, softer into twilight on left!
  const rimGrad = ctx.createLinearGradient(c - r * 0.9, c - r * 0.5, c + r * 0.8, c - r * 0.8);
  rimGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.28)');
  rimGrad.addColorStop(0.45, 'rgba(255, 255, 255, 0.72)');
  rimGrad.addColorStop(0.82, 'rgba(255, 255, 255, 0.98)');
  rimGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.82)');
  ctx.strokeStyle = rimGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(c, c, r, Math.PI * 1.04, Math.PI * 1.96);
  ctx.stroke();

  cachedEarthSprite = canvas;
  return canvas;
}

/** Pre-warms the offscreen Earth globe sprite during idle time so Stage 01 entry has 0ms frame hitch */
export function warmEarthSprite(): void {
  getEarthSprite();
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

/** Shared Earth orbital center & radius so rocket & satellite align mathematically with Earth's curve */
export function getEarthOrbitGeometry(frame: Scene2DFrameContext): {
  centerX: number;
  centerY: number;
  earthR: number;
  topLimbY: number;
  climbCurve: number;
} {
  const { w, h, sp, mouseX, mouseY, vehicleAnchorX, unit } = frame;
  const baseEarthR = Math.max(w, h) * 0.58;
  const leoTopY = Math.max(h * 0.58, h - baseEarthR * 0.46);
  const climbCurve = smoothstep(0.255, 0.560, sp);
  const orbitalPass = smoothstep(0.52, 0.98, sp);
  const earthR = baseEarthR * Math.pow(3.2, Math.pow(1 - climbCurve, 1.25));
  const terminalDrop = smoothstep(0.84, 1.0, sp) * baseEarthR * 0.055;
  const orbitalHorizonDip = Math.sin(orbitalPass * Math.PI) * baseEarthR * 0.018;
  const topLimbY =
    lerp(h * 0.88, leoTopY, climbCurve) + terminalDrop - orbitalHorizonDip - mouseY * (2 + 4 * climbCurve);
  const leoCenterX = lerp(w * 0.62, vehicleAnchorX + unit * 0.15, 0.55) - orbitalPass * w * 0.045;
  const centerX = lerp(vehicleAnchorX, leoCenterX, climbCurve) - mouseX * (5 + 5 * climbCurve);
  const centerY = topLimbY + earthR;
  return { centerX, centerY, earthR, topLimbY, climbCurve };
}

/** Shared live screen coordinates of the Bangalore Ground Station beacon on Earth */
export function getBlrGroundStationPos(frame: Scene2DFrameContext): { x: number; y: number; visible: boolean } {
  const { h, sp } = frame;
  if (sp < 0.46) return { x: 0, y: 0, visible: false };
  const { centerX, centerY, earthR, topLimbY } = getEarthOrbitGeometry(frame);
  // Smoothly rotates Bangalore across Earth's curved globe into nadir lock as the spacecraft approaches Stage 05
  const groundTrack = smoothstep(0.46, 0.92, sp);
  const x = centerX + lerp(earthR * 0.14, earthR * 0.02, groundTrack);
  const y = centerY - lerp(earthR * 0.69, earthR * 0.73, groundTrack);
  return { x, y, visible: y < h - 32 && y > topLimbY };
}

/**
 * Pure Monochrome Photorealistic Earth-to-Orbit Globe (sp 0.255 -> 1.000):
 * - Clean atmospheric globe with swirling clouds & glowing limb (zero map outlines, zero grids)
 * - Subtle pulsing Bangalore orbital ground-track beacon + orbiting constellation satellites
 */
export function renderEarthAndOrbit(frame: Scene2DFrameContext): void {
  const { ctx, h, sp, t, unit, reducedMotion } = frame;

  // Rises gradually across the expanded ascent-to-orbit span (0.255 -> 0.560)
  if (sp < 0.255) return;

  const { centerX, centerY, earthR, topLimbY } = getEarthOrbitGeometry(frame);
  const earthFadeIn = smoothstep(0.255, 0.365, sp);

  const blrReticleAlpha = smoothstep(0.46, 0.57, sp);
  const orbitRingAlpha = smoothstep(0.47, 0.58, sp);

  const orbitAdvance = (sp - 0.45) * 4.2 + (reducedMotion ? 0 : t * 0.20);

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

  // 2. Full Cached Photorealistic Monochrome Earth Globe Sprite (pure clouds + atmosphere, zero map!)
  const earthImg = getEarthSprite();
  const drawScale = earthR / EARTH_SPRITE_R;
  const drawSize = EARTH_SPRITE_SIZE * drawScale;
  ctx.drawImage(earthImg, centerX - drawSize * 0.5, centerY - drawSize * 0.5, drawSize, drawSize);

  // 3. Subtle pulsing Bangalore Ground Station Beacon on Earth's horizon
  if (blrReticleAlpha > 0.01) {
    const blrX = centerX + earthR * 0.02;
    const blrY = centerY - earthR * 0.72;
    if (blrY < h - 32 && blrY > topLimbY) {
      ctx.save();
      ctx.globalAlpha = earthFadeIn * blrReticleAlpha;
      const pingWave = reducedMotion ? 0.35 : (t * 0.78) % 1.0;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(blrX, blrY, unit * 0.068, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - pingWave) * 0.65})`;
      ctx.beginPath();
      ctx.arc(blrX, blrY, unit * (0.068 + pingWave * 0.24), 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(blrX, blrY, 2.0, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = `600 ${Math.max(9, Math.round(unit * 0.078))}px "JetBrains Mono", monospace`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText('BLR // 12.97°N 77.59°E', blrX + unit * 0.14, blrY + 3);
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
