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

/**
 * Ultra-fast pure monochrome Black & White sky + crisp starfield (<0.1ms/frame).
 * Zero per-frame radial gradients, zero heavy shader work.
 */
export function renderSkyAndStars(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, scrollSpeed, mouseX, mouseY, reducedMotion } = frame;

  // 1. Crisp monochrome background (subtle dark charcoal at ground zero -> pure obsidian in space)
  const spaceBlend = smoothstep(0.16, 0.34, sp);
  const bgLum = Math.round(lerp(14, 5, spaceBlend));
  ctx.fillStyle = `rgb(${bgLum},${bgLum},${bgLum + 1})`;
  ctx.fillRect(0, 0, w, h);

  // Subtle architectural grid lines in deep background for precision technical aesthetic
  const gridAlpha = lerp(0.045, 0.025, spaceBlend);
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

  // 2. Crisp monochrome starfield (tiny pixel-snapped white dots + minimal scroll warp ticks)
  const starVis = lerp(0.22, 1.0, smoothstep(0.14, 0.32, sp));
  const stars = getStars();
  const driftY = sp * h * 1.45;
  const warpLen = reducedMotion
    ? 0
    : clamp(scrollSpeed, 0, 3.0) * 14 * smoothstep(0.24, 0.38, sp);

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';

  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    const dawnMask = sp < 0.24 ? smoothstep(0.60, 0.08, s.ny) : 1.0;
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
      // Crisp 4-point technical crosshair on 6 brightest navigational stars in space
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

  // 3. Minimal monochrome sunrise disc outline on eastern horizon (Stage 00 only)
  const dawnPresence = 1 - smoothstep(0.18, 0.28, sp);
  if (dawnPresence > 0.02) {
    const sunX = w * 0.86 - mouseX * 6;
    const sunY = h * 0.56 + smoothstep(0.17, 0.28, sp) * h * 0.4;
    const r = Math.min(w, h) * 0.036;

    ctx.strokeStyle = `rgba(255,255,255,${0.32 * dawnPresence})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(sunX, sunY, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255,255,255,${0.12 * dawnPresence})`;
    ctx.beginPath();
    ctx.arc(sunX, sunY, r * 2.1, 0, Math.PI * 2);
    ctx.stroke();
  }
}
