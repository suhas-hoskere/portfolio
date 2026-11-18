import {
  type Scene2DFrameContext,
  clamp,
  lerp,
  smoothstep,
  mulberry32,
} from './types';

interface MonoStar {
  nx: number;
  ny: number;
  size: number;
  alpha: number;
  depth: number;
  bright: boolean;
}

let cachedStars: MonoStar[] | null = null;
let cachedSunSprite: HTMLCanvasElement | null = null;
let cachedMoonSprite: HTMLCanvasElement | null = null;

function getStars(): MonoStar[] {
  if (cachedStars) return cachedStars;
  const rand = mulberry32(20260420);
  const stars: MonoStar[] = [];
  for (let i = 0; i < 120; i++) {
    const mag = Math.pow(rand(), 2.4);
    stars.push({
      nx: rand(),
      ny: rand(),
      size: 1 + Math.floor(mag * 2.2),
      alpha: 0.25 + mag * 0.75,
      depth: 0.35 + mag * 0.65,
      bright: i < 6,
    });
  }
  cachedStars = stars;
  return stars;
}

/** Pre-renders a luminous monochrome Sun sprite ONCE (180x180) — glowing core + soft corona + subtle rays */
function getSunSprite(): HTMLCanvasElement {
  if (cachedSunSprite) return cachedSunSprite;
  const size = 180;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size * 0.5;

  // Outer soft monochrome atmospheric bloom
  const outer = ctx.createRadialGradient(c, c, 8, c, c, c);
  outer.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
  outer.addColorStop(0.18, 'rgba(255, 255, 255, 0.72)');
  outer.addColorStop(0.34, 'rgba(244, 244, 248, 0.28)');
  outer.addColorStop(0.62, 'rgba(220, 220, 228, 0.08)');
  outer.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.arc(c, c, c, 0, Math.PI * 2);
  ctx.fill();

  // Subtle delicate monochrome solar flare cross rays
  ctx.save();
  ctx.translate(c, c);
  for (let r = 0; r < 8; r++) {
    const angle = (r / 8) * Math.PI * 2;
    const len = r % 2 === 0 ? c * 0.82 : c * 0.52;
    const rg = ctx.createLinearGradient(0, 0, Math.cos(angle) * len, Math.sin(angle) * len);
    rg.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
    rg.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.strokeStyle = rg;
    ctx.lineWidth = r % 2 === 0 ? 1.4 : 0.9;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.restore();

  // Crisp luminous white photosphere disc
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(c, c, 19, 0, Math.PI * 2);
  ctx.fill();

  cachedSunSprite = canvas;
  return canvas;
}

/** Pre-renders a crisp, lightly cratered monochrome Moon sprite ONCE (96x96) */
function getMoonSprite(): HTMLCanvasElement {
  if (cachedMoonSprite) return cachedMoonSprite;
  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size * 0.5;
  const r = 22;

  // Faint moonlight halo
  const halo = ctx.createRadialGradient(c, c, r * 0.85, c, c, c);
  halo.addColorStop(0.0, 'rgba(255, 255, 255, 0.22)');
  halo.addColorStop(0.55, 'rgba(228, 228, 232, 0.06)');
  halo.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(c, c, c, 0, Math.PI * 2);
  ctx.fill();

  // Moon disc clipped for shaded phase + subtle craters
  ctx.save();
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.clip();

  // Sunlit silver-white lunar surface (lit from top-right towards the Sun)
  const surf = ctx.createRadialGradient(c + r * 0.35, c - r * 0.3, 2, c, c, r * 1.35);
  surf.addColorStop(0.0, '#f4f4f6');
  surf.addColorStop(0.62, '#c8c8d0');
  surf.addColorStop(1.0, '#4a4a52');
  ctx.fillStyle = surf;
  ctx.fillRect(c - r, c - r, r * 2, r * 2);

  // Delicate monochrome lunar maria & craters
  const craters = [
    { x: -6, y: -4, cr: 5.5, a: 0.16 },
    { x: 5, y: 3, cr: 4.2, a: 0.14 },
    { x: -2, y: 8, cr: 3.4, a: 0.12 },
    { x: 7, y: -7, cr: 2.8, a: 0.11 },
    { x: -9, y: 4, cr: 2.5, a: 0.13 },
  ];
  for (const cr of craters) {
    ctx.fillStyle = `rgba(24, 24, 28, ${cr.a})`;
    ctx.beginPath();
    ctx.arc(c + cr.x, c + cr.y, cr.cr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft crescent shadow on lower-left limb
  ctx.fillStyle = 'rgba(9, 9, 12, 0.56)';
  ctx.beginPath();
  ctx.arc(c - r * 0.58, c + r * 0.24, r * 1.02, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Crisp subtle lunar rim highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(c, c, r, -Math.PI * 0.72, Math.PI * 0.32);
  ctx.stroke();

  cachedMoonSprite = canvas;
  return canvas;
}

/**
 * Ultra-fast pure monochrome Black & White sky, crisp starfield,
 * luminous monochrome Sun, and continuously moving Moon crossing full screen borders.
 */
export function renderSkyAndStars(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, t, scrollSpeed, mouseX, mouseY, reducedMotion } = frame;

  // 1. Crisp monochrome background (subtle dark charcoal at ground zero -> pure obsidian in space)
  const spaceBlend = smoothstep(0.16, 0.36, sp);
  const bgLum = Math.round(lerp(14, 5, spaceBlend));
  ctx.fillStyle = `rgb(${bgLum},${bgLum},${bgLum + 1})`;
  ctx.fillRect(0, 0, w, h);

  // Subtle architectural grid lines in deep background
  const gridAlpha = lerp(0.04, 0.022, spaceBlend);
  const gridStep = Math.max(64, Math.round(Math.min(w, h) * 0.11));
  ctx.strokeStyle = `rgba(255,255,255,${gridAlpha})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = gridStep; gx < w; gx += gridStep) {
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, h);
  }
  for (let gy = gridStep; gy < h; gy += gridStep) {
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
  }
  ctx.stroke();

  // 2. Crisp monochrome starfield
  const starVis = lerp(0.24, 1.0, smoothstep(0.14, 0.34, sp));
  const stars = getStars();
  const driftY = sp * h * 1.45;
  const warpLen = reducedMotion
    ? 0
    : clamp(scrollSpeed, 0, 3.0) * 12 * smoothstep(0.24, 0.38, sp);

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';

  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    const dawnMask = sp < 0.24 ? smoothstep(0.62, 0.08, s.ny) : 1.0;
    const alpha = s.alpha * starVis * dawnMask;
    if (alpha < 0.05) continue;

    const px = ((s.nx * w - mouseX * 10 * s.depth) % w + w) % w;
    const py = ((s.ny * h + driftY * s.depth - mouseY * 7 * s.depth) % h + h) % h;

    ctx.globalAlpha = alpha;
    if (warpLen > 2.5) {
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, py - warpLen * s.depth);
      ctx.stroke();
    } else {
      ctx.fillRect(px, py, s.size, s.size);
      if (s.bright && sp > 0.30) {
        ctx.globalAlpha = alpha * 0.38;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(px - 6, py + 1);
        ctx.lineTo(px + 8, py + 1);
        ctx.moveTo(px + 1, py - 6);
        ctx.lineTo(px + 1, py + 8);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;

  // 3. LUMINOUS MONOCHROME SUN (replaces the hollow circle — glowing solar disc & subtle corona)
  const sunImg = getSunSprite();
  const sunX = w * 0.85 - mouseX * 5;
  const sunY = lerp(h * 0.24, h * 0.18, smoothstep(0.17, 0.48, sp)) - mouseY * 3;
  const sunPulse = reducedMotion ? 1 : 1 + Math.sin(t * 0.9) * 0.025;
  const sunSize = Math.min(w, h) * 0.22 * sunPulse;

  ctx.save();
  ctx.globalAlpha = lerp(0.86, 0.72, spaceBlend);
  ctx.drawImage(sunImg, sunX - sunSize * 0.5, sunY - sunSize * 0.5, sunSize, sunSize);
  ctx.restore();

  // 4. CONTINUOUSLY MOVING MONOCHROME MOON (glides smoothly across full screen & beyond borders)
  const moonImg = getMoonSprite();
  const moonSize = Math.min(w, h) * 0.115;
  const moonSpan = w + moonSize * 2.4;
  // Continuous gentle orbital drift from outside left border across the sky and out the right border
  const moonTravel = reducedMotion ? 0.34 : ((0.22 + t * 0.011 + sp * 0.28) % 1 + 1) % 1;
  const moonX = moonTravel * moonSpan - moonSize * 1.2 - mouseX * 7;
  // Gentle celestial arc across the upper sky
  const arcOffset = Math.sin(moonTravel * Math.PI) * h * 0.11;
  const moonY = lerp(h * 0.30, h * 0.25, spaceBlend) - arcOffset - mouseY * 4;

  ctx.save();
  ctx.globalAlpha = lerp(0.76, 0.92, spaceBlend);
  ctx.drawImage(moonImg, moonX - moonSize * 0.5, moonY - moonSize * 0.5, moonSize, moonSize);
  ctx.restore();
}
