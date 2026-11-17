import {
  type Scene2DFrameContext,
  clamp,
  lerp,
  lerpRgb,
  smoothstep,
  mulberry32,
} from './types';

interface Star2D {
  nx: number; // Normalized [0..1]
  ny: number; // Normalized [0..1]
  radius: number;
  baseAlpha: number;
  color: string;
  twinkleSpeed: number;
  twinklePhase: number;
  depth: number; // Parallax & warp weight [0.3..1.0]
  hasSpikes: boolean;
}

const STAR_COLORS = [
  '#bfdbfe', // O/B blue-white
  '#e0f2fe', // B/A pale blue
  '#f8fafc', // A/F pure white
  '#f8fafc',
  '#fef3c7', // G solar warm white
  '#fed7aa', // K amber giant
];

let cachedStars: Star2D[] | null = null;

function getStars(): Star2D[] {
  if (cachedStars) return cachedStars;
  const rand = mulberry32(20260420);
  const stars: Star2D[] = [];
  const count = 210;

  for (let i = 0; i < count; i++) {
    const mag = Math.pow(rand(), 2.6); // Most stars dim, a few bright navigational beacons
    const radius = 0.55 + mag * 1.95;
    const baseAlpha = 0.28 + mag * 0.72;
    const color = STAR_COLORS[Math.floor(rand() * STAR_COLORS.length)];
    stars.push({
      nx: rand(),
      ny: rand(),
      radius,
      baseAlpha,
      color,
      twinkleSpeed: 1.1 + rand() * 2.8,
      twinklePhase: rand() * Math.PI * 2,
      depth: 0.35 + mag * 0.65,
      hasSpikes: i < 8,
    });
  }

  cachedStars = stars;
  return stars;
}

// Sky palette stops (RGB tuples for zero-allocation color blending)
const DAWN_TOP: readonly [number, number, number] = [10, 22, 48];
const DAWN_MID: readonly [number, number, number] = [42, 82, 128];
const DAWN_LOW: readonly [number, number, number] = [164, 114, 96];
const DAWN_HORIZON: readonly [number, number, number] = [238, 174, 108];

const STRAT_TOP: readonly [number, number, number] = [3, 8, 22];
const STRAT_MID: readonly [number, number, number] = [12, 34, 78];
const STRAT_LOW: readonly [number, number, number] = [36, 98, 168];
const STRAT_HORIZON: readonly [number, number, number] = [102, 168, 224];

const SPACE_TOP: readonly [number, number, number] = [2, 4, 11];
const SPACE_MID: readonly [number, number, number] = [3, 7, 17];
const SPACE_LOW: readonly [number, number, number] = [5, 11, 24];
const SPACE_HORIZON: readonly [number, number, number] = [7, 14, 30];

const MARS_TINT_LOW: readonly [number, number, number] = [18, 9, 14];
const DEEP_VOID: readonly [number, number, number] = [2, 3, 8];

export function renderSkyAndStars(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, scrollSpeed, t, mouseX, mouseY, reducedMotion } = frame;

  // 1. MULTI-STAGE ATMOSPHERIC SKY GRADIENT
  const toStrat = smoothstep(0.165, 0.275, sp);
  const toSpace = smoothstep(0.265, 0.365, sp);
  const marsFactor =
    smoothstep(0.70, 0.78, sp) * (1 - smoothstep(0.85, 0.91, sp));
  const deepVoidFactor = smoothstep(0.86, 0.94, sp);

  const blendStop = (
    dawn: readonly [number, number, number],
    strat: readonly [number, number, number],
    space: readonly [number, number, number],
    extraLowTint = false
  ): string => {
    const r1 = lerp(dawn[0], strat[0], toStrat);
    const g1 = lerp(dawn[1], strat[1], toStrat);
    const b1 = lerp(dawn[2], strat[2], toStrat);

    let r = lerp(r1, space[0], toSpace);
    let g = lerp(g1, space[1], toSpace);
    let b = lerp(b1, space[2], toSpace);

    if (extraLowTint && marsFactor > 0.001) {
      r = lerp(r, MARS_TINT_LOW[0], marsFactor * 0.65);
      g = lerp(g, MARS_TINT_LOW[1], marsFactor * 0.65);
      b = lerp(b, MARS_TINT_LOW[2], marsFactor * 0.65);
    }
    if (deepVoidFactor > 0.001) {
      r = lerp(r, DEEP_VOID[0], deepVoidFactor * 0.85);
      g = lerp(g, DEEP_VOID[1], deepVoidFactor * 0.85);
      b = lerp(b, DEEP_VOID[2], deepVoidFactor * 0.85);
    }
    return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
  };

  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0.0, blendStop(DAWN_TOP, STRAT_TOP, SPACE_TOP));
  skyGrad.addColorStop(0.42, blendStop(DAWN_MID, STRAT_MID, SPACE_MID));
  skyGrad.addColorStop(0.72, blendStop(DAWN_LOW, STRAT_LOW, SPACE_LOW, true));
  skyGrad.addColorStop(1.0, blendStop(DAWN_HORIZON, STRAT_HORIZON, SPACE_HORIZON, true));

  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. SUBTLE MILKY WAY NEBULA BAND IN DEEP SPACE (sp > 0.40)
  const nebulaAlpha = smoothstep(0.40, 0.56, sp) * 0.16;
  if (nebulaAlpha > 0.004) {
    ctx.save();
    ctx.translate(w * 0.62 - mouseX * 12, h * 0.46 - mouseY * 8);
    ctx.rotate(-0.48);
    const mwGrad = ctx.createLinearGradient(-w * 0.65, 0, w * 0.65, 0);
    mwGrad.addColorStop(0.0, 'rgba(56, 189, 248, 0)');
    mwGrad.addColorStop(0.32, `rgba(99, 102, 241, ${nebulaAlpha * 0.55})`);
    mwGrad.addColorStop(0.52, `rgba(56, 189, 248, ${nebulaAlpha})`);
    mwGrad.addColorStop(0.75, `rgba(147, 197, 253, ${nebulaAlpha * 0.45})`);
    mwGrad.addColorStop(1.0, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = mwGrad;
    ctx.fillRect(-w * 0.7, -h * 0.14, w * 1.4, h * 0.28);
    ctx.restore();
  }

  // 3. SPECTRAL STARFIELD (Visible faintly at dawn zenith, full brilliance above stratosphere)
  const starVisibility = lerp(0.18, 1.0, smoothstep(0.15, 0.34, sp));
  const stars = getStars();
  const scrollDriftY = sp * h * 1.65;
  const warpLength = reducedMotion
    ? 0
    : clamp(scrollSpeed, 0, 3.5) * 20 * smoothstep(0.24, 0.40, sp);

  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    // At dawn (sp < 0.22), only stars in the upper twilight sky peek through
    const dawnMask = sp < 0.24 ? smoothstep(0.58, 0.05, s.ny) : 1.0;
    const visibility = starVisibility * dawnMask;
    if (visibility < 0.03) continue;

    // Gentle parallax + upward flight drift
    const px = ((s.nx * w - mouseX * 14 * s.depth) % w + w) % w;
    const py = ((s.ny * h + scrollDriftY * s.depth - mouseY * 10 * s.depth) % h + h) % h;

    const twinkle = reducedMotion
      ? 1.0
      : 0.78 + 0.22 * Math.sin(t * s.twinkleSpeed + s.twinklePhase);
    const alpha = clamp(s.baseAlpha * visibility * twinkle, 0, 1);

    if (warpLength > 2.2) {
      // Crisp velocity warp streak
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = alpha * 0.78;
      ctx.lineWidth = Math.max(0.8, s.radius * 0.75);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, py - warpLength * s.depth);
      ctx.stroke();
    } else {
      ctx.fillStyle = s.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(px, py, s.radius, 0, Math.PI * 2);
      ctx.fill();

      // Subtle 4-point optical diffraction spikes on the 8 brightest navigational stars
      if (s.hasSpikes && alpha > 0.45 && sp > 0.28) {
        const spikeLen = s.radius * 4.4;
        ctx.strokeStyle = s.color;
        ctx.globalAlpha = alpha * 0.35;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(px - spikeLen, py);
        ctx.lineTo(px + spikeLen, py);
        ctx.moveTo(px, py - spikeLen);
        ctx.lineTo(px, py + spikeLen);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;

  // 4. SRIHARIKOTA RISING COASTAL MORNING SUN & RAYLEIGH DAWN GLOW (Stage 00 - Early Ascent)
  const dawnPresence = 1 - smoothstep(0.20, 0.33, sp);
  if (dawnPresence > 0.01) {
    const climbDrop = smoothstep(0.17, 0.33, sp) * h * 0.55;
    const sunX = w * 0.86 - mouseX * 10;
    const sunY = h * 0.56 + climbDrop - mouseY * 6;
    const glowR = Math.max(w, h) * 0.36;

    // Wide warm golden coastal atmospheric scattering aureole
    const outerGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, glowR);
    outerGlow.addColorStop(0.0, `rgba(255, 244, 214, ${0.42 * dawnPresence})`);
    outerGlow.addColorStop(0.16, `rgba(253, 198, 122, ${0.28 * dawnPresence})`);
    outerGlow.addColorStop(0.45, `rgba(234, 126, 78, ${0.12 * dawnPresence})`);
    outerGlow.addColorStop(1.0, 'rgba(234, 126, 78, 0)');
    ctx.fillStyle = outerGlow;
    ctx.fillRect(0, 0, w, h);

    // Crisp sunlit solar disc near the eastern Bay of Bengal horizon
    const discR = Math.min(w, h) * 0.032;
    const discGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, discR * 2.2);
    discGrad.addColorStop(0.0, `rgba(255, 253, 240, ${0.95 * dawnPresence})`);
    discGrad.addColorStop(0.45, `rgba(255, 232, 178, ${0.65 * dawnPresence})`);
    discGrad.addColorStop(1.0, 'rgba(255, 196, 120, 0)');
    ctx.fillStyle = discGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, discR * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. HIGH-ALTITUDE EARTH ATMOSPHERIC BLUE LIMB HAZE AT BOTTOM EDGE (Stage 01 exit)
  const limbHaze = smoothstep(0.24, 0.31, sp) * (1 - smoothstep(0.34, 0.40, sp));
  if (limbHaze > 0.01) {
    const limbGrad = ctx.createLinearGradient(0, h * 0.76, 0, h);
    limbGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    limbGrad.addColorStop(0.6, `rgba(56, 189, 248, ${0.14 * limbHaze})`);
    limbGrad.addColorStop(1, lerpRgb([14, 165, 233], [56, 189, 248], 0.5).replace('rgb', 'rgba').replace(')', `,${0.32 * limbHaze})`));
    ctx.fillStyle = limbGrad;
    ctx.fillRect(0, h * 0.76, w, h * 0.24);
  }
}
