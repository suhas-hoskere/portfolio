import { type Scene2DFrameContext, clamp, smoothstep, mulberry32 } from './types';

interface CloudLayerItem {
  layer: 0 | 1 | 2 | 3; // 0: low coastal cumulus, 1: dense troposphere punch deck, 2: high cirrus, 3: cloud sea below
  sprite: 'cumulus' | 'cirrus';
  nx: number;
  baseY: number;
  wU: number;
  hU: number;
  alpha: number;
  driftRate: number;
  flipX: boolean;
}

interface CloudSpriteCache {
  cumulus: HTMLCanvasElement;
  cirrus: HTMLCanvasElement;
}

let cachedCloudSprites: CloudSpriteCache | null = null;

/**
 * Pre-renders 2 crisp monochrome photographic cloud sprites ONCE (< 120 KB RAM total):
 * - Cumulus: volumetric multi-lobed cauliflower top (bright white) + shaded graphite underside
 * - Cirrus: delicate wind-sheared high-altitude monochrome ice-crystal wisps
 */
function getCloudSprites(): CloudSpriteCache {
  if (cachedCloudSprites) return cachedCloudSprites;

  const rand = mulberry32(5512);

  // 1. Volumetric Monochrome Cumulus Sprite (240x120)
  const cCanvas = document.createElement('canvas');
  cCanvas.width = 240;
  cCanvas.height = 120;
  const cctx = cCanvas.getContext('2d')!;

  // Soft dark-graphite shadowed cloud underside for realistic 3D volume
  const underLobes = [
    { x: 75, y: 80, r: 34 },
    { x: 120, y: 82, r: 40 },
    { x: 165, y: 80, r: 34 },
  ];
  for (const u of underLobes) {
    const g = cctx.createRadialGradient(u.x, u.y, 4, u.x, u.y, u.r);
    g.addColorStop(0.0, 'rgba(39, 39, 46, 0.55)');
    g.addColorStop(0.6, 'rgba(63, 63, 72, 0.25)');
    g.addColorStop(1.0, 'rgba(63, 63, 72, 0)');
    cctx.fillStyle = g;
    cctx.beginPath();
    cctx.arc(u.x, u.y, u.r, 0, Math.PI * 2);
    cctx.fill();
  }

  // Soft silver mid-cloud body lobes
  const midLobes = [
    { x: 54, y: 74, r: 32 },
    { x: 90, y: 62, r: 42 },
    { x: 132, y: 58, r: 46 },
    { x: 172, y: 68, r: 36 },
    { x: 196, y: 78, r: 24 },
  ];
  for (const m of midLobes) {
    const g = cctx.createRadialGradient(m.x + m.r * 0.15, m.y - m.r * 0.25, 3, m.x, m.y, m.r);
    g.addColorStop(0.0, 'rgba(244, 244, 248, 0.72)');
    g.addColorStop(0.50, 'rgba(180, 180, 190, 0.34)');
    g.addColorStop(1.0, 'rgba(160, 160, 170, 0)');
    cctx.fillStyle = g;
    cctx.beginPath();
    cctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    cctx.fill();
  }

  // Bright pure-white sunlit upper cauliflower crowns
  const crownLobes = [
    { x: 96, y: 48, r: 28 },
    { x: 130, y: 42, r: 34 },
    { x: 160, y: 52, r: 24 },
    { x: 70, y: 60, r: 22 },
  ];
  for (const cr of crownLobes) {
    const g = cctx.createRadialGradient(cr.x + 5, cr.y - 6, 2, cr.x, cr.y, cr.r);
    g.addColorStop(0.0, 'rgba(255, 255, 255, 0.85)');
    g.addColorStop(0.45, 'rgba(228, 228, 232, 0.38)');
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
    g.addColorStop(0.0, 'rgba(255, 255, 255, 0.42)');
    g.addColorStop(0.55, 'rgba(212, 212, 218, 0.16)');
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

const CLOUD_LAYERS: CloudLayerItem[] = [
  // Layer 0: Low morning coastal cumulus floating gently above Sriharikota horizon
  { layer: 0, sprite: 'cumulus', nx: 0.18, baseY: 0.20, wU: 3.4, hU: 1.55, alpha: 0.38, driftRate: 0.016, flipX: false },
  { layer: 0, sprite: 'cumulus', nx: 0.56, baseY: 0.14, wU: 4.1, hU: 1.80, alpha: 0.44, driftRate: 0.012, flipX: true },
  { layer: 0, sprite: 'cumulus', nx: 0.88, baseY: 0.24, wU: 3.6, hU: 1.60, alpha: 0.36, driftRate: 0.014, flipX: false },

  // Layer 1: Dense mid-troposphere cloud punch deck (peaks during Stage 01 climb sp 0.24-0.34)
  { layer: 1, sprite: 'cumulus', nx: 0.14, baseY: -0.34, wU: 5.4, hU: 2.50, alpha: 0.62, driftRate: -0.018, flipX: true },
  { layer: 1, sprite: 'cumulus', nx: 0.44, baseY: -0.40, wU: 6.2, hU: 2.85, alpha: 0.68, driftRate: -0.014, flipX: false },
  { layer: 1, sprite: 'cumulus', nx: 0.74, baseY: -0.30, wU: 5.8, hU: 2.70, alpha: 0.72, driftRate: -0.020, flipX: true },
  { layer: 1, sprite: 'cumulus', nx: 0.96, baseY: -0.44, wU: 4.8, hU: 2.25, alpha: 0.58, driftRate: -0.016, flipX: false },

  // Layer 2: High stratospheric ice-crystal cirrus wisps
  { layer: 2, sprite: 'cirrus', nx: 0.28, baseY: -0.92, wU: 6.4, hU: 1.55, alpha: 0.52, driftRate: 0.024, flipX: false },
  { layer: 2, sprite: 'cirrus', nx: 0.72, baseY: -1.04, wU: 7.2, hU: 1.75, alpha: 0.58, driftRate: 0.022, flipX: true },

  // Layer 3: Stratospheric cloud sea horizon receding below vehicle (sp 0.235 -> 0.385)
  { layer: 3, sprite: 'cumulus', nx: 0.20, baseY: 0.88, wU: 6.8, hU: 2.65, alpha: 0.56, driftRate: 0.008, flipX: false },
  { layer: 3, sprite: 'cumulus', nx: 0.55, baseY: 0.85, wU: 7.6, hU: 2.95, alpha: 0.64, driftRate: 0.006, flipX: true },
  { layer: 3, sprite: 'cumulus', nx: 0.88, baseY: 0.89, wU: 6.6, hU: 2.60, alpha: 0.54, driftRate: 0.009, flipX: false },
];

/**
 * Volumetric pure monochrome Black & White cloud strata (<0.15ms/frame via pre-rendered sprites).
 */
export function renderAtmosphericClouds(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, t, mouseX, unit, reducedMotion } = frame;

  if (sp > 0.395) return;

  const sprites = getCloudSprites();
  const climbProg = clamp((sp - 0.165) / (0.395 - 0.165), 0, 1);
  const fadeOut = 1 - smoothstep(0.330, 0.395, sp);

  // Soft misty monochrome veil right as the rocket pierces through the dense troposphere deck
  const punchPeak =
    sp >= 0.245 && sp <= 0.315
      ? Math.sin(((sp - 0.245) / 0.070) * Math.PI)
      : 0;

  ctx.save();

  for (let i = 0; i < CLOUD_LAYERS.length; i++) {
    const c = CLOUD_LAYERS[i];
    let y = 0;
    let alpha = c.alpha * fadeOut;

    if (c.layer === 0) {
      y = c.baseY * h + climbProg * h * 1.55;
      alpha *= 1 - smoothstep(0.24, 0.32, sp);
    } else if (c.layer === 1) {
      y = c.baseY * h + climbProg * h * 2.25;
      alpha *= 1 + punchPeak * 0.32;
    } else if (c.layer === 2) {
      y = c.baseY * h + climbProg * h * 2.85;
    } else {
      if (sp < 0.235) continue;
      const seaIn = smoothstep(0.235, 0.280, sp);
      y = c.baseY * h + smoothstep(0.235, 0.395, sp) * h * 0.36;
      alpha = c.alpha * seaIn * fadeOut;
    }

    if (alpha < 0.015) continue;

    const cw = c.wU * unit;
    const ch = c.hU * unit;
    if (y - ch > h || y + ch < -ch) continue;

    const drift = reducedMotion ? 0 : Math.sin(t * 0.25 + i * 1.9) * unit * 0.55;
    const x = c.nx * w + drift - mouseX * (c.layer === 1 ? 16 : 8);
    const img = sprites[c.sprite];

    ctx.globalAlpha = clamp(alpha, 0, 0.88);
    ctx.save();
    ctx.translate(x, y);
    if (c.flipX) ctx.scale(-1, 1);
    ctx.drawImage(img, -cw * 0.5, -ch * 0.5, cw, ch);
    ctx.restore();
  }

  // Subtle misty white atmospheric pass-through veil at cloud punch
  if (punchPeak > 0.02) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(255, 255, 255, ${punchPeak * 0.075})`;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}
