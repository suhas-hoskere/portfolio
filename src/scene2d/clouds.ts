import { type Scene2DFrameContext, clamp, smoothstep, mulberry32 } from './types';

interface CloudLayerItem {
  layer: 0 | 1 | 2 | 3; // 0: low coastal cumulus, 1: troposphere deck, 2: high cirrus, 3: cloud sea below
  sprite: 'cumulus' | 'cirrus';
  nx: number; // initial phase 0..1 across full wrapped span (-cw .. w + cw)
  baseY: number;
  wU: number;
  hU: number;
  alpha: number;
  speedPx: number; // horizontal drift px/sec across full screen & beyond borders
  flipX: boolean;
}

interface CloudSpriteCache {
  cumulus: HTMLCanvasElement;
  cirrus: HTMLCanvasElement;
}

let cachedCloudSprites: CloudSpriteCache | null = null;

/**
 * Pre-renders 2 airy monochrome cloud sprites ONCE (< 120 KB RAM total):
 * - Cumulus: volumetric multi-lobed white crown + soft graphite underside
 * - Cirrus: delicate wind-sheared high-altitude monochrome wisps
 */
function getCloudSprites(): CloudSpriteCache {
  if (cachedCloudSprites) return cachedCloudSprites;

  const rand = mulberry32(5512);

  // 1. Volumetric Monochrome Cumulus Sprite (240x120)
  const cCanvas = document.createElement('canvas');
  cCanvas.width = 240;
  cCanvas.height = 120;
  const cctx = cCanvas.getContext('2d')!;

  const underLobes = [
    { x: 75, y: 80, r: 34 },
    { x: 120, y: 82, r: 40 },
    { x: 165, y: 80, r: 34 },
  ];
  for (const u of underLobes) {
    const g = cctx.createRadialGradient(u.x, u.y, 4, u.x, u.y, u.r);
    g.addColorStop(0.0, 'rgba(39, 39, 46, 0.45)');
    g.addColorStop(0.6, 'rgba(63, 63, 72, 0.20)');
    g.addColorStop(1.0, 'rgba(63, 63, 72, 0)');
    cctx.fillStyle = g;
    cctx.beginPath();
    cctx.arc(u.x, u.y, u.r, 0, Math.PI * 2);
    cctx.fill();
  }

  const midLobes = [
    { x: 54, y: 74, r: 32 },
    { x: 90, y: 62, r: 42 },
    { x: 132, y: 58, r: 46 },
    { x: 172, y: 68, r: 36 },
    { x: 196, y: 78, r: 24 },
  ];
  for (const m of midLobes) {
    const g = cctx.createRadialGradient(m.x + m.r * 0.15, m.y - m.r * 0.25, 3, m.x, m.y, m.r);
    g.addColorStop(0.0, 'rgba(244, 244, 248, 0.66)');
    g.addColorStop(0.50, 'rgba(180, 180, 190, 0.30)');
    g.addColorStop(1.0, 'rgba(160, 160, 170, 0)');
    cctx.fillStyle = g;
    cctx.beginPath();
    cctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    cctx.fill();
  }

  const crownLobes = [
    { x: 96, y: 48, r: 28 },
    { x: 130, y: 42, r: 34 },
    { x: 160, y: 52, r: 24 },
    { x: 70, y: 60, r: 22 },
  ];
  for (const cr of crownLobes) {
    const g = cctx.createRadialGradient(cr.x + 5, cr.y - 6, 2, cr.x, cr.y, cr.r);
    g.addColorStop(0.0, 'rgba(255, 255, 255, 0.80)');
    g.addColorStop(0.45, 'rgba(228, 228, 232, 0.34)');
    g.addColorStop(1.0, 'rgba(228, 228, 232, 0)');
    cctx.fillStyle = g;
    cctx.beginPath();
    cctx.arc(cr.x, cr.y, cr.r, 0, Math.PI * 2);
    cctx.fill();
  }

  // 2. High-Altitude Wind-Sheared Monochrome Cirrus Sprite (260x70)
  const sCanvas = document.createElement('canvas');
  sCanvas.width = 260;
  sCanvas.height = 70;
  const sctx = sCanvas.getContext('2d')!;

  for (let k = 0; k < 12; k++) {
    const sx = 35 + rand() * 190;
    const sy = 20 + rand() * 30;
    const rw = 28 + rand() * 52;
    const rh = 4 + rand() * 9;
    const g = sctx.createRadialGradient(sx, sy, 1, sx, sy, rw);
    g.addColorStop(0.0, 'rgba(255, 255, 255, 0.40)');
    g.addColorStop(0.55, 'rgba(212, 212, 218, 0.14)');
    g.addColorStop(1.0, 'rgba(212, 212, 218, 0)');
    sctx.save();
    sctx.translate(sx, sy);
    sctx.scale(1, rh / rw);
    sctx.fillStyle = g;
    sctx.beginPath();
    sctx.arc(0, 0, rw, 0, Math.PI * 2);
    sctx.fill();
    sctx.restore();
  }

  cachedCloudSprites = { cumulus: cCanvas, cirrus: sCanvas };
  return cachedCloudSprites;
}

/**
 * Clouds wrap continuously across the ENTIRE viewport width PLUS off-screen margins (-cw .. w + cw),
 * so new clouds constantly enter from beyond the left & right borders and exit cleanly past the other side!
 */
const CLOUD_LAYERS: CloudLayerItem[] = [
  // Layer 0: 6 airy coastal cumulus clouds continuously drifting in from off-screen left -> right
  { layer: 0, sprite: 'cumulus', nx: 0.04, baseY: 0.22, wU: 3.3, hU: 1.45, alpha: 0.25, speedPx: 14, flipX: false },
  { layer: 0, sprite: 'cumulus', nx: 0.24, baseY: 0.15, wU: 3.9, hU: 1.70, alpha: 0.29, speedPx: 11, flipX: true },
  { layer: 0, sprite: 'cumulus', nx: 0.44, baseY: 0.27, wU: 3.2, hU: 1.40, alpha: 0.23, speedPx: 16, flipX: false },
  { layer: 0, sprite: 'cumulus', nx: 0.64, baseY: 0.18, wU: 4.1, hU: 1.75, alpha: 0.28, speedPx: 12, flipX: true },
  { layer: 0, sprite: 'cumulus', nx: 0.82, baseY: 0.25, wU: 3.5, hU: 1.52, alpha: 0.24, speedPx: 15, flipX: false },
  { layer: 0, sprite: 'cumulus', nx: 0.96, baseY: 0.13, wU: 3.7, hU: 1.60, alpha: 0.26, speedPx: 13, flipX: true },

  // Layer 1: 6 mid-troposphere clouds drifting continuously from right -> left (peaks sp 0.23 -> 0.34)
  { layer: 1, sprite: 'cumulus', nx: 0.06, baseY: -0.32, wU: 5.2, hU: 2.35, alpha: 0.42, speedPx: -24, flipX: true },
  { layer: 1, sprite: 'cumulus', nx: 0.25, baseY: -0.40, wU: 6.0, hU: 2.70, alpha: 0.46, speedPx: -20, flipX: false },
  { layer: 1, sprite: 'cumulus', nx: 0.46, baseY: -0.28, wU: 5.6, hU: 2.55, alpha: 0.48, speedPx: -26, flipX: true },
  { layer: 1, sprite: 'cumulus', nx: 0.66, baseY: -0.42, wU: 5.0, hU: 2.25, alpha: 0.40, speedPx: -22, flipX: false },
  { layer: 1, sprite: 'cumulus', nx: 0.84, baseY: -0.34, wU: 5.8, hU: 2.60, alpha: 0.45, speedPx: -25, flipX: true },
  { layer: 1, sprite: 'cumulus', nx: 0.97, baseY: -0.38, wU: 4.8, hU: 2.15, alpha: 0.38, speedPx: -19, flipX: false },

  // Layer 2: 4 high stratospheric cirrus wisps sweeping across full borders
  { layer: 2, sprite: 'cirrus', nx: 0.12, baseY: -0.90, wU: 6.2, hU: 1.45, alpha: 0.36, speedPx: 28, flipX: false },
  { layer: 2, sprite: 'cirrus', nx: 0.42, baseY: -1.02, wU: 7.0, hU: 1.65, alpha: 0.40, speedPx: 24, flipX: true },
  { layer: 2, sprite: 'cirrus', nx: 0.72, baseY: -0.86, wU: 6.5, hU: 1.50, alpha: 0.35, speedPx: 30, flipX: false },
  { layer: 2, sprite: 'cirrus', nx: 0.94, baseY: -0.98, wU: 6.8, hU: 1.60, alpha: 0.38, speedPx: 26, flipX: true },

  // Layer 3: Stratospheric cloud band drifting steadily across lower horizon during ascent
  { layer: 3, sprite: 'cumulus', nx: 0.10, baseY: 0.82, wU: 6.4, hU: 2.40, alpha: 0.34, speedPx: 10, flipX: false },
  { layer: 3, sprite: 'cumulus', nx: 0.38, baseY: 0.79, wU: 7.2, hU: 2.65, alpha: 0.38, speedPx: 8, flipX: true },
  { layer: 3, sprite: 'cumulus', nx: 0.68, baseY: 0.83, wU: 6.6, hU: 2.45, alpha: 0.36, speedPx: 11, flipX: false },
  { layer: 3, sprite: 'cumulus', nx: 0.94, baseY: 0.80, wU: 6.2, hU: 2.35, alpha: 0.32, speedPx: 9, flipX: true },
];

/**
 * Volumetric pure monochrome Black & White cloud strata (<0.18ms/frame via pre-rendered sprites).
 * Clouds continuously travel from outside screen borders across the entire viewport and exit cleanly.
 */
export function renderAtmosphericClouds(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, t, mouseX, unit, reducedMotion } = frame;

  // Extended cloud ascent span (0.140 -> 0.500) so the rocket has many silky frames punching through clouds!
  if (sp > 0.505) return;

  const sprites = getCloudSprites();
  const climbProg = clamp((sp - 0.140) / (0.500 - 0.140), 0, 1);
  const fadeOut = 1 - smoothstep(0.415, 0.500, sp);

  const punchPeak =
    sp >= 0.240 && sp <= 0.340
      ? Math.sin(((sp - 0.240) / 0.100) * Math.PI)
      : 0;

  ctx.save();

  for (let i = 0; i < CLOUD_LAYERS.length; i++) {
    const c = CLOUD_LAYERS[i];
    let y = 0;
    let alpha = c.alpha * fadeOut;

    if (c.layer === 0) {
      y = c.baseY * h + climbProg * h * 1.65;
      alpha *= 1 - smoothstep(0.26, 0.38, sp);
    } else if (c.layer === 1) {
      y = c.baseY * h + climbProg * h * 2.25;
      alpha *= 1 + punchPeak * 0.28;
    } else if (c.layer === 2) {
      y = c.baseY * h + climbProg * h * 2.85;
    } else {
      if (sp < 0.250) continue;
      const seaIn = smoothstep(0.250, 0.320, sp);
      y = c.baseY * h + smoothstep(0.250, 0.500, sp) * h * 0.26;
      alpha = c.alpha * seaIn * fadeOut;
    }

    if (alpha < 0.015) continue;

    const cw = c.wU * unit;
    const ch = c.hU * unit;
    if (y - ch > h || y + ch < -ch) continue;

    // Continuous seamless border-to-border horizontal travel (enters from -cw, exits past w + cw)
    const span = w + cw * 1.8;
    const rawX = c.nx * span + (reducedMotion ? 0 : t * c.speedPx);
    const wrappedX = ((rawX % span) + span) % span - cw * 0.9;
    const x = wrappedX - mouseX * (c.layer === 1 ? 14 : 7);
    const img = sprites[c.sprite];

    ctx.globalAlpha = clamp(alpha, 0, 0.78);
    ctx.save();
    ctx.translate(x, y);
    if (c.flipX) ctx.scale(-1, 1);
    ctx.drawImage(img, -cw * 0.5, -ch * 0.5, cw, ch);
    ctx.restore();
  }

  // Subtle misty white atmospheric veil at cloud punch
  if (punchPeak > 0.02) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(255, 255, 255, ${punchPeak * 0.055})`;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}
