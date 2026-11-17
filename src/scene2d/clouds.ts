import { type Scene2DFrameContext, clamp, smoothstep } from './types';

interface CloudSpec {
  layer: 0 | 1 | 2 | 3; // 0: low cumulus, 1: mid punch deck, 2: high cirrus, 3: cloud sea below
  nx: number;           // Normalized horizontal anchor [0..1]
  baseYOffset: number;  // Initial offset in viewport heights
  scaleW: number;       // Width in `unit`s
  scaleH: number;       // Height in `unit`s
  driftSpeed: number;
  baseAlpha: number;
}

let cachedCloudSprite: HTMLCanvasElement | null = null;

/** Pre-renders a single soft, multi-lobed sunlit cumulus puff sprite (180x100) once */
function getCloudSprite(): HTMLCanvasElement {
  if (cachedCloudSprite) return cachedCloudSprite;
  const w = 180;
  const h = 100;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const lobes = [
    { x: 52, y: 58, r: 34, top: 'rgba(255,250,242,0.52)', bot: 'rgba(186,210,235,0.08)' },
    { x: 126, y: 58, r: 32, top: 'rgba(255,250,242,0.48)', bot: 'rgba(186,210,235,0.08)' },
    { x: 90, y: 46, r: 44, top: 'rgba(255,253,248,0.68)', bot: 'rgba(195,218,240,0.10)' },
    { x: 70, y: 52, r: 36, top: 'rgba(255,252,246,0.55)', bot: 'rgba(190,214,238,0.08)' },
    { x: 112, y: 50, r: 35, top: 'rgba(255,252,246,0.55)', bot: 'rgba(190,214,238,0.08)' },
  ];

  for (const l of lobes) {
    const g = ctx.createRadialGradient(l.x, l.y - l.r * 0.25, l.r * 0.08, l.x, l.y, l.r);
    g.addColorStop(0.0, l.top);
    g.addColorStop(0.55, l.bot);
    g.addColorStop(1.0, 'rgba(220, 235, 250, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
    ctx.fill();
  }

  cachedCloudSprite = canvas;
  return canvas;
}

const CLOUDS: CloudSpec[] = [
  // Layer 0: Low morning coastal cumulus wisps
  { layer: 0, nx: 0.22, baseYOffset: 0.12, scaleW: 3.6, scaleH: 1.4, driftSpeed: 0.012, baseAlpha: 0.36 },
  { layer: 0, nx: 0.62, baseYOffset: 0.06, scaleW: 4.2, scaleH: 1.6, driftSpeed: 0.015, baseAlpha: 0.42 },
  { layer: 0, nx: 0.86, baseYOffset: 0.16, scaleW: 3.4, scaleH: 1.3, driftSpeed: 0.010, baseAlpha: 0.34 },

  // Layer 1: Dense mid-troposphere cloud punch deck (peaks during Stage 01 punch sp 0.24-0.31)
  { layer: 1, nx: 0.18, baseYOffset: -0.35, scaleW: 5.2, scaleH: 2.2, driftSpeed: -0.014, baseAlpha: 0.56 },
  { layer: 1, nx: 0.48, baseYOffset: -0.42, scaleW: 6.0, scaleH: 2.5, driftSpeed: -0.010, baseAlpha: 0.62 },
  { layer: 1, nx: 0.76, baseYOffset: -0.32, scaleW: 5.8, scaleH: 2.4, driftSpeed: -0.016, baseAlpha: 0.64 },
  { layer: 1, nx: 0.94, baseYOffset: -0.45, scaleW: 4.6, scaleH: 2.0, driftSpeed: -0.012, baseAlpha: 0.52 },

  // Layer 2: High stratospheric cirrus streaks
  { layer: 2, nx: 0.30, baseYOffset: -0.95, scaleW: 6.4, scaleH: 1.5, driftSpeed: 0.018, baseAlpha: 0.38 },
  { layer: 2, nx: 0.72, baseYOffset: -1.05, scaleW: 7.0, scaleH: 1.6, driftSpeed: 0.020, baseAlpha: 0.42 },

  // Layer 3: Stratospheric cloud sea horizon below (visible sp 0.235 -> 0.355)
  { layer: 3, nx: 0.25, baseYOffset: 0.86, scaleW: 6.8, scaleH: 2.2, driftSpeed: 0.008, baseAlpha: 0.50 },
  { layer: 3, nx: 0.60, baseYOffset: 0.84, scaleW: 7.6, scaleH: 2.5, driftSpeed: 0.006, baseAlpha: 0.56 },
  { layer: 3, nx: 0.90, baseYOffset: 0.88, scaleW: 6.4, scaleH: 2.2, driftSpeed: 0.009, baseAlpha: 0.48 },
];

export function renderAtmosphericClouds(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, t, mouseX, unit, reducedMotion } = frame;

  // Clouds exist cleanly from ground zero up through stratosphere exit (sp <= 0.355)
  if (sp > 0.355) return;

  const sprite = getCloudSprite();
  const climbProg = clamp((sp - 0.165) / (0.355 - 0.165), 0, 1);
  const atmoFadeOut = 1 - smoothstep(0.305, 0.355, sp);

  // Mid-deck cloud punch veil boost right as the vehicle pierces the troposphere (sp 0.24 -> 0.305)
  const punchVeil =
    sp >= 0.240 && sp <= 0.305
      ? Math.sin(((sp - 0.240) / 0.065) * Math.PI)
      : 0;

  ctx.save();

  for (let i = 0; i < CLOUDS.length; i++) {
    const c = CLOUDS[i];

    let y = 0;
    let alpha = c.baseAlpha * atmoFadeOut;

    if (c.layer === 0) {
      y = c.baseYOffset * h + climbProg * h * 1.45;
      alpha *= 1 - smoothstep(0.24, 0.31, sp);
    } else if (c.layer === 1) {
      y = c.baseYOffset * h + climbProg * h * 2.15;
      alpha *= 1 + punchVeil * 0.45;
    } else if (c.layer === 2) {
      y = c.baseYOffset * h + climbProg * h * 2.75;
    } else {
      // Layer 3: Stratospheric cloud sea horizon below
      if (sp < 0.235) continue;
      const seaIn = smoothstep(0.235, 0.275, sp);
      const seaDrop = smoothstep(0.235, 0.355, sp) * h * 0.35;
      y = c.baseYOffset * h + seaDrop;
      alpha = c.baseAlpha * seaIn * atmoFadeOut;
    }

    if (alpha < 0.01) continue;

    const cw = c.scaleW * unit;
    const ch = c.scaleH * unit;
    if (y - ch > h || y + ch < -ch) continue;

    const drift = reducedMotion ? 0 : Math.sin(t * 0.35 + i * 1.7) * unit * 0.45;
    const x = c.nx * w + drift - mouseX * (c.layer === 1 ? 18 : 10);

    ctx.globalAlpha = clamp(alpha, 0, 0.85);
    ctx.drawImage(sprite, x - cw * 0.5, y - ch * 0.5, cw, ch);
  }

  // Subtle misty white-blue punch flash as vehicle bursts out of the dense cloud deck
  if (punchVeil > 0.02) {
    const veilGrad = ctx.createRadialGradient(
      frame.vehicleAnchorX,
      h * 0.48,
      unit * 0.3,
      frame.vehicleAnchorX,
      h * 0.48,
      Math.max(w, h) * 0.55
    );
    veilGrad.addColorStop(0.0, `rgba(224, 242, 254, ${punchVeil * 0.18})`);
    veilGrad.addColorStop(1.0, 'rgba(224, 242, 254, 0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = veilGrad;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}
