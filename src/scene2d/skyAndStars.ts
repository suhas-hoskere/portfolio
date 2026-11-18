import {
  type Scene2DFrameContext,
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
 * Ultra-fast pure monochrome Black & White sky, crisp twinkling starfield,
 * and luminous monochrome Sun.
 */
export function renderSkyAndStars(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, t, mouseX, mouseY, reducedMotion } = frame;

  // 1. Monochrome sky with soft pre-dawn coastal horizon mist at Ground Zero -> pure obsidian in space
  const spaceBlend = smoothstep(0.15, 0.46, sp);
  const bgLum = Math.round(lerp(10, 5, spaceBlend));
  ctx.fillStyle = `rgb(${bgLum},${bgLum},${bgLum + 1})`;
  ctx.fillRect(0, 0, w, h);

  // Whisper-soft lower horizon atmospheric depth glow on the launch pad (fades out climbing to space)
  const atmoHaze = 1 - smoothstep(0.14, 0.34, sp);
  if (atmoHaze > 0.01) {
    const horizonTop = h * 0.42;
    const horizonBot = h * 0.84;
    const hazeGrad = ctx.createLinearGradient(0, horizonTop, 0, horizonBot);
    hazeGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
    hazeGrad.addColorStop(0.68, `rgba(210, 212, 224, ${0.045 * atmoHaze})`);
    hazeGrad.addColorStop(1.0, `rgba(230, 232, 242, ${0.085 * atmoHaze})`);
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, horizonTop, w, horizonBot - horizonTop);
  }

  // 2. Crisp monochrome starfield with gentle subtle twinkle (clean pinpoints, zero rain/warp streaks!)
  const starVis = lerp(0.24, 1.0, smoothstep(0.16, 0.44, sp));
  const stars = getStars();
  const driftY = sp * h * 1.45;

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';

  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    const dawnMask = sp < 0.30 ? smoothstep(0.62, 0.08, s.ny) : 1.0;
    const twinkle = reducedMotion ? 1 : 0.84 + 0.16 * Math.sin(t * 2.2 + s.twinklePhase);
    const alpha = s.alpha * starVis * dawnMask * twinkle;
    if (alpha < 0.05) continue;

    const px = ((s.nx * w - mouseX * 10 * s.depth) % w + w) % w;
    const py = ((s.ny * h + driftY * s.depth - mouseY * 7 * s.depth) % h + h) % h;

    ctx.globalAlpha = alpha;
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

  // 4. RARE SUBTLE MONOCHROME SHOOTING STAR IN DEEP ORBIT (sp >= 0.48, streaks silently every ~8.5s)
  if (sp >= 0.48 && !reducedMotion) {
    const orbitVis = smoothstep(0.48, 0.58, sp);
    const period = 8.5;
    const cycleIdx = Math.floor(t / period);
    const localT = t % period;
    const streakDur = 0.65;

    if (localT < streakDur) {
      const p = localT / streakDur;
      const fade = Math.sin(p * Math.PI) * orbitVis;
      // Deterministic pseudo-random start coordinates per meteor cycle (kept in upper sky)
      const seedA = Math.sin(cycleIdx * 12.9898) * 43758.5453;
      const seedB = Math.sin(cycleIdx * 78.233) * 24634.6345;
      const rx = 0.14 + (seedA - Math.floor(seedA)) * 0.56;
      const ry = 0.08 + (seedB - Math.floor(seedB)) * 0.24;

      const startX = rx * w;
      const startY = ry * h;
      const dx = w * 0.16;
      const dy = h * 0.095;
      const headX = startX + dx * p;
      const headY = startY + dy * p;
      const tailLen = 0.28;
      const tailP = Math.max(0, p - tailLen);
      const tailX = startX + dx * tailP;
      const tailY = startY + dy * tailP;

      ctx.save();
      const sg = ctx.createLinearGradient(tailX, tailY, headX, headY);
      sg.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
      sg.addColorStop(0.7, `rgba(244, 244, 250, ${0.32 * fade})`);
      sg.addColorStop(1.0, `rgba(255, 255, 255, ${0.88 * fade})`);
      ctx.strokeStyle = sg;
      ctx.lineWidth = 1.25;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(headX, headY);
      ctx.stroke();

      ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * fade})`;
      ctx.beginPath();
      ctx.arc(headX, headY, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
