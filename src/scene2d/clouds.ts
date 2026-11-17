import { type Scene2DFrameContext, clamp, smoothstep } from './types';

interface CloudLine {
  layer: 0 | 1 | 2;
  nx: number;
  baseY: number;
  wU: number;
  hU: number;
  alpha: number;
}

const CLOUDS: CloudLine[] = [
  { layer: 0, nx: 0.24, baseY: 0.14, wU: 2.6, hU: 0.34, alpha: 0.14 },
  { layer: 0, nx: 0.78, baseY: 0.10, wU: 3.0, hU: 0.38, alpha: 0.16 },
  { layer: 1, nx: 0.20, baseY: -0.32, wU: 3.8, hU: 0.48, alpha: 0.22 },
  { layer: 1, nx: 0.68, baseY: -0.38, wU: 4.2, hU: 0.54, alpha: 0.26 },
  { layer: 2, nx: 0.55, baseY: 0.86, wU: 5.4, hU: 0.46, alpha: 0.20 },
  { layer: 2, nx: 0.88, baseY: 0.88, wU: 4.6, hU: 0.42, alpha: 0.16 },
];

/**
 * Minimalist monochrome Black & White cloud strata (zero gradients, ultra-fast).
 */
export function renderAtmosphericClouds(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, mouseX, unit } = frame;
  if (sp > 0.355) return;

  const climbProg = clamp((sp - 0.165) / (0.355 - 0.165), 0, 1);
  const fadeOut = 1 - smoothstep(0.305, 0.355, sp);

  ctx.save();
  ctx.lineWidth = 1;

  for (let i = 0; i < CLOUDS.length; i++) {
    const c = CLOUDS[i];
    let y = 0;
    let alpha = c.alpha * fadeOut;

    if (c.layer === 0) {
      y = c.baseY * h + climbProg * h * 1.4;
      alpha *= 1 - smoothstep(0.24, 0.31, sp);
    } else if (c.layer === 1) {
      y = c.baseY * h + climbProg * h * 2.1;
    } else {
      if (sp < 0.235) continue;
      y = c.baseY * h + smoothstep(0.235, 0.355, sp) * h * 0.32;
      alpha *= smoothstep(0.235, 0.275, sp);
    }

    if (alpha < 0.015) continue;

    const cw = c.wU * unit;
    const ch = c.hU * unit;
    if (y - ch > h || y + ch < -ch) continue;

    const x = c.nx * w - mouseX * (c.layer === 1 ? 12 : 6);

    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.45})`;
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.roundRect(x - cw * 0.5, y - ch * 0.5, cw, ch, ch * 0.5);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}
