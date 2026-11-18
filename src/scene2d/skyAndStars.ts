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
  twinklePhase: number;
}

let cachedStars: MonoStar[] | null = null;
let cachedSunSprite: HTMLCanvasElement | null = null;
let cachedMoonSprite: HTMLCanvasElement | null = null;

function getStars(): MonoStar[] {
  if (cachedStars) return cachedStars;
  const rand = mulberry32(20260420);
  const stars: MonoStar[] = [];
  for (let i = 0; i < 140; i++) {
    const mag = Math.pow(rand(), 2.3);
    stars.push({
      nx: rand(),
      ny: rand(),
      size: 1 + Math.floor(mag * 2.2),
      alpha: 0.25 + mag * 0.75,
      depth: 0.35 + mag * 0.65,
      bright: i < 8,
      twinklePhase: rand() * Math.PI * 2,
    });
  }
  cachedStars = stars;
  return stars;
}

/**
 * Pre-renders a dazzling, photorealistic monochrome Sun sprite ONCE (260x260):
 * - Intense pure-white solar photosphere core
 * - Logarithmic multi-tier atmospheric corona bloom (zero harsh edge!)
 * - Delicate optical diffraction spikes + subtle anamorphic horizontal flare
 */
function getSunSprite(): HTMLCanvasElement {
  if (cachedSunSprite) return cachedSunSprite;
  const size = 260;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size * 0.5;

  // 1. Wide soft atmospheric outer corona
  const outer = ctx.createRadialGradient(c, c, 4, c, c, c);
  outer.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  outer.addColorStop(0.11, 'rgba(255, 255, 255, 0.96)');
  outer.addColorStop(0.19, 'rgba(248, 248, 252, 0.58)');
  outer.addColorStop(0.32, 'rgba(232, 232, 240, 0.22)');
  outer.addColorStop(0.55, 'rgba(210, 210, 222, 0.065)');
  outer.addColorStop(0.80, 'rgba(200, 200, 215, 0.018)');
  outer.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.arc(c, c, c, 0, Math.PI * 2);
  ctx.fill();

  // 2. Subtle cinema anamorphic horizontal flare bar
  const flareW = c * 0.96;
  const hFlare = ctx.createLinearGradient(c - flareW, c, c + flareW, c);
  hFlare.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
  hFlare.addColorStop(0.32, 'rgba(255, 255, 255, 0.10)');
  hFlare.addColorStop(0.50, 'rgba(255, 255, 255, 0.42)');
  hFlare.addColorStop(0.68, 'rgba(255, 255, 255, 0.10)');
  hFlare.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = hFlare;
  ctx.fillRect(c - flareW, c - 1.2, flareW * 2, 2.4);

  // 3. Fine 8-point optical lens diffraction spikes
  ctx.save();
  ctx.translate(c, c);
  for (let r = 0; r < 8; r++) {
    const angle = (r / 8) * Math.PI * 2;
    const isCardinal = r % 2 === 0;
    const len = isCardinal ? c * 0.72 : c * 0.40;
    const rg = ctx.createLinearGradient(0, 0, Math.cos(angle) * len, Math.sin(angle) * len);
    rg.addColorStop(0.0, isCardinal ? 'rgba(255, 255, 255, 0.55)' : 'rgba(255, 255, 255, 0.30)');
    rg.addColorStop(0.45, isCardinal ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.06)');
    rg.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
    ctx.strokeStyle = rg;
    ctx.lineWidth = isCardinal ? 1.25 : 0.75;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.restore();

  // 4. Crisp blazing pure-white photosphere disc (feathered 2px edge so it glows naturally)
  const core = ctx.createRadialGradient(c, c, 0, c, c, 21);
  core.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  core.addColorStop(0.76, 'rgba(255, 255, 255, 1.0)');
  core.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(c, c, 21, 0, Math.PI * 2);
  ctx.fill();

  cachedSunSprite = canvas;
  return canvas;
}

/**
 * Pre-renders a telescope-grade monochrome crescent/gibbous Moon sprite ONCE (128x128):
 * - Authentic lunar maria (dark basaltic plains) + bright highland craters & Tycho rays
 * - Smooth spherical terminator shadow + faint earthshine on the night side (no clunky oval cutout!)
 */
function getMoonSprite(): HTMLCanvasElement {
  if (cachedMoonSprite) return cachedMoonSprite;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size * 0.5;
  const r = 28;

  // 1. Soft silvery moonlight atmospheric aura
  const halo = ctx.createRadialGradient(c + 4, c - 3, r * 0.85, c, c, c);
  halo.addColorStop(0.0, 'rgba(240, 240, 248, 0.22)');
  halo.addColorStop(0.42, 'rgba(215, 215, 225, 0.065)');
  halo.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(c, c, c, 0, Math.PI * 2);
  ctx.fill();

  // 2. Render lunar globe inside circular clip
  ctx.save();
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.clip();

  // Base sunlit regolith gradient (lit from right/upper-right toward the Sun)
  const baseGrad = ctx.createRadialGradient(c + r * 0.42, c - r * 0.25, 2, c, c, r * 1.45);
  baseGrad.addColorStop(0.0, '#fafafa');
  baseGrad.addColorStop(0.48, '#dcdce2');
  baseGrad.addColorStop(0.82, '#9a9aa6');
  baseGrad.addColorStop(1.0, '#52525c');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(c - r, c - r, r * 2, r * 2);

  // Authentic lunar maria (Mare Tranquillitatis, Serenitatis, Imbrium, Crisium)
  const maria = [
    { x: -6, y: -8, rx: 10, ry: 8, rot: -0.3, a: 0.24 },
    { x: 5, y: -4, rx: 8.5, ry: 7, rot: 0.2, a: 0.22 },
    { x: 11, y: 4, rx: 6.5, ry: 5.5, rot: 0.4, a: 0.20 },
    { x: -10, y: 6, rx: 9, ry: 6.5, rot: -0.15, a: 0.22 },
    { x: 2, y: 9, rx: 6, ry: 4.5, rot: 0.1, a: 0.16 },
    { x: 15, y: -6, rx: 4, ry: 5, rot: 0.2, a: 0.24 },
  ];
  for (const m of maria) {
    ctx.save();
    ctx.translate(c + m.x, c + m.y);
    ctx.rotate(m.rot);
    const mg = ctx.createRadialGradient(0, 0, 1, 0, 0, m.rx);
    mg.addColorStop(0, `rgba(28, 28, 34, ${m.a})`);
    mg.addColorStop(0.75, `rgba(42, 42, 50, ${m.a * 0.55})`);
    mg.addColorStop(1, 'rgba(42, 42, 50, 0)');
    ctx.fillStyle = mg;
    ctx.scale(1, m.ry / m.rx);
    ctx.beginPath();
    ctx.arc(0, 0, m.rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Crisp bright highland impact craters with subtle shadow & sunlit rim
  const craters = [
    { x: 8, y: 12, cr: 3.4 }, // Tycho
    { x: -3, y: 2, cr: 2.8 }, // Copernicus
    { x: 13, y: -1, cr: 2.2 },
    { x: 4, y: -12, cr: 2.5 },
    { x: -8, y: -2, cr: 2.0 },
    { x: 10, y: 7, cr: 1.7 },
  ];
  for (const cr of craters) {
    ctx.fillStyle = 'rgba(20, 20, 24, 0.22)';
    ctx.beginPath();
    ctx.arc(c + cr.x - 0.5, c + cr.y + 0.4, cr.cr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(c + cr.x, c + cr.y, cr.cr, -Math.PI * 0.4, Math.PI * 0.5);
    ctx.stroke();
  }

  // Smooth spherical night-side terminator shading (waxing gibbous/crescent with realistic earthshine!)
  const term = ctx.createRadialGradient(
    c + r * 0.58,
    c - r * 0.14,
    r * 0.48,
    c + r * 0.38,
    c - r * 0.10,
    r * 1.18
  );
  term.addColorStop(0.0, 'rgba(8, 8, 12, 0)');
  term.addColorStop(0.58, 'rgba(8, 8, 12, 0.08)');
  term.addColorStop(0.76, 'rgba(8, 8, 12, 0.68)');
  term.addColorStop(0.92, 'rgba(7, 7, 10, 0.88)');
  term.addColorStop(1.0, 'rgba(6, 6, 9, 0.92)');
  ctx.fillStyle = term;
  ctx.fillRect(c - r, c - r, r * 2, r * 2);

  ctx.restore();

  // Delicate sunlit crescent edge specular highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(c, c, r - 0.4, -Math.PI * 0.52, Math.PI * 0.44);
  ctx.stroke();

  cachedMoonSprite = canvas;
  return canvas;
}

/**
 * Ultra-fast pure monochrome Black & White sky, crisp twinkling starfield,
 * luminous monochrome Sun, and continuously moving telescope-grade Moon crossing full borders.
 */
export function renderSkyAndStars(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, t, scrollSpeed, mouseX, mouseY, reducedMotion } = frame;

  // 1. Crisp monochrome background (subtle dark charcoal at ground zero -> pure obsidian in space)
  const spaceBlend = smoothstep(0.16, 0.36, sp);
  const bgLum = Math.round(lerp(13, 5, spaceBlend));
  ctx.fillStyle = `rgb(${bgLum},${bgLum},${bgLum + 1})`;
  ctx.fillRect(0, 0, w, h);

  // Subtle architectural grid lines in deep background
  const gridAlpha = lerp(0.036, 0.018, spaceBlend);
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

  // 2. Crisp monochrome starfield with gentle subtle atmospheric twinkle
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
    const twinkle = reducedMotion ? 1 : 0.84 + 0.16 * Math.sin(t * 2.2 + s.twinklePhase);
    const alpha = s.alpha * starVis * dawnMask * twinkle;
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
      ctx.fillRect(px | 0, py | 0, s.size, s.size);
      if (s.bright && sp > 0.28) {
        ctx.globalAlpha = alpha * 0.36;
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.moveTo(px - 5.5, py + 1);
        ctx.lineTo(px + 7.5, py + 1);
        ctx.moveTo(px + 1, py - 5.5);
        ctx.lineTo(px + 1, py + 7.5);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;

  // 3. LUMINOUS MONOCHROME SUN (upper-right sky, crisp photosphere + soft optical corona)
  const sunImg = getSunSprite();
  const sunX = w * 0.87 - mouseX * 4;
  const sunY = lerp(h * 0.22, h * 0.17, smoothstep(0.17, 0.48, sp)) - mouseY * 2.5;
  const sunPulse = reducedMotion ? 1 : 1 + Math.sin(t * 0.85) * 0.02;
  const sunSize = Math.min(w, h) * 0.28 * sunPulse;

  ctx.save();
  ctx.globalAlpha = lerp(0.94, 0.84, spaceBlend);
  ctx.drawImage(sunImg, sunX - sunSize * 0.5, sunY - sunSize * 0.5, sunSize, sunSize);
  ctx.restore();

  // 4. DISTANT CELESTIAL MOON (moves independently & calmly right-to-left, opposite the wind-blown clouds,
  //    so clouds clearly pass in front of the distant Moon while it glides on its own celestial arc!)
  const moonImg = getMoonSprite();
  const moonSize = Math.min(w, h) * 0.115;
  const moonSpan = w + moonSize * 2.4;
  const moonTravel = reducedMotion ? 0.42 : ((0.44 - t * 0.0024 - sp * 0.22) % 1 + 1) % 1;
  const moonX = moonTravel * moonSpan - moonSize * 1.2 - mouseX * 4;
  // Smooth high celestial arc well clear of the upper-right Sun
  const nearSunFactor = Math.exp(-Math.pow((moonX - sunX) / (w * 0.18), 2));
  const arcOffset = Math.sin(moonTravel * Math.PI) * h * 0.08;
  const moonY =
    lerp(h * 0.27, h * 0.22, spaceBlend) -
    arcOffset +
    nearSunFactor * h * 0.14 -
    mouseY * 2.5;

  ctx.save();
  ctx.globalAlpha = lerp(0.84, 0.96, spaceBlend);
  ctx.drawImage(moonImg, moonX - moonSize * 0.5, moonY - moonSize * 0.5, moonSize, moonSize);
  ctx.restore();
}
