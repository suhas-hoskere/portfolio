import {
  type Scene2DFrameContext,
  lerp,
  smoothstep,
  mulberry32,
} from './types';

let cachedMoonDisc: HTMLCanvasElement | null = null;
let cachedMarsDisc: HTMLCanvasElement | null = null;

/**
 * Lazily generates a crisp 280x280 2.5D Lunar disc (0 bytes RAM until Stage 03):
 * - Pale regolith base lit from the upper-right Sun
 * - Dark basaltic lunar maria (Imbrium, Serenitatis, Tranquillitatis, Procellarum)
 * - Sculpted craters with bright sunlit inner rims & crisp cast shadows + Tycho ray system
 * - Stark lunar vacuum terminator shadow
 */
function getMoonDiscCanvas(): HTMLCanvasElement {
  if (cachedMoonDisc) return cachedMoonDisc;

  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.46;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(19690720);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // 1. Sunlit lunar highland regolith base
  const baseGrad = ctx.createRadialGradient(
    cx + r * 0.36,
    cy - r * 0.32,
    r * 0.05,
    cx,
    cy,
    r * 1.15
  );
  baseGrad.addColorStop(0.0, '#f1f5f9');
  baseGrad.addColorStop(0.38, '#cbd5e1');
  baseGrad.addColorStop(0.75, '#7c8899');
  baseGrad.addColorStop(1.0, '#1e2532');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  // 2. Dark basaltic lunar maria basins
  const maria = [
    { x: -0.22, y: -0.26, rx: 0.32, ry: 0.26, rot: -0.3, a: 0.36 }, // Mare Imbrium
    { x: 0.16, y: -0.22, rx: 0.22, ry: 0.20, rot: 0.2, a: 0.32 },  // Mare Serenitatis
    { x: 0.28, y: 0.04, rx: 0.24, ry: 0.18, rot: -0.2, a: 0.34 },  // Mare Tranquillitatis
    { x: -0.38, y: 0.12, rx: 0.28, ry: 0.32, rot: 0.4, a: 0.30 },  // Oceanus Procellarum
    { x: 0.42, y: -0.10, rx: 0.14, ry: 0.12, rot: 0.1, a: 0.38 },  // Mare Crisium
  ];
  for (const m of maria) {
    ctx.save();
    ctx.translate(cx + m.x * r, cy + m.y * r);
    ctx.rotate(m.rot);
    const mg = ctx.createRadialGradient(0, 0, r * 0.04, 0, 0, m.rx * r);
    mg.addColorStop(0.0, `rgba(45, 55, 72, ${m.a})`);
    mg.addColorStop(0.7, `rgba(60, 72, 92, ${m.a * 0.72})`);
    mg.addColorStop(1.0, 'rgba(60, 72, 92, 0)');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.ellipse(0, 0, m.rx * r, m.ry * r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. Sculpted impact craters (dark shadow side + bright sunlit eastern rim)
  for (let i = 0; i < 42; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.pow(rand(), 0.58) * r * 0.88;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const cr = 2.2 + Math.pow(rand(), 2.2) * 14;

    // Crater depression shadow
    ctx.fillStyle = 'rgba(30, 41, 59, 0.34)';
    ctx.beginPath();
    ctx.arc(x, y, cr, 0, Math.PI * 2);
    ctx.fill();

    // Sunlit inner floor offset slightly toward lower-left opposite sun
    ctx.fillStyle = 'rgba(203, 213, 225, 0.38)';
    ctx.beginPath();
    ctx.arc(x - cr * 0.18, y + cr * 0.16, cr * 0.82, 0, Math.PI * 2);
    ctx.fill();

    // Bright upper-right rim catchlight
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.35)';
    ctx.lineWidth = Math.max(0.7, cr * 0.14);
    ctx.beginPath();
    ctx.arc(x, y, cr, -Math.PI * 0.85, Math.PI * 0.15);
    ctx.stroke();
  }

  // 4. Tycho Crater bright ejecta ray system in southern highlands
  const tychoX = cx - r * 0.08;
  const tychoY = cy + r * 0.54;
  ctx.strokeStyle = 'rgba(241, 245, 249, 0.24)';
  ctx.lineWidth = 1.4;
  for (let ray = 0; ray < 9; ray++) {
    const ra = -Math.PI * 0.9 + (ray / 8) * Math.PI * 1.4;
    const rl = r * (0.28 + (ray % 3) * 0.16);
    ctx.beginPath();
    ctx.moveTo(tychoX, tychoY);
    ctx.lineTo(tychoX + Math.cos(ra) * rl, tychoY + Math.sin(ra) * rl);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(248, 250, 252, 0.72)';
  ctx.beginPath();
  ctx.arc(tychoX, tychoY, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // 5. Stark vacuum solar terminator shadow across western limb
  const termGrad = ctx.createRadialGradient(
    cx + r * 0.44,
    cy - r * 0.34,
    r * 0.46,
    cx + r * 0.14,
    cy - r * 0.08,
    r * 1.18
  );
  termGrad.addColorStop(0.0, 'rgba(2, 6, 18, 0)');
  termGrad.addColorStop(0.62, 'rgba(2, 6, 18, 0.16)');
  termGrad.addColorStop(0.84, 'rgba(2, 6, 18, 0.78)');
  termGrad.addColorStop(1.0, 'rgba(2, 6, 18, 0.96)');
  ctx.fillStyle = termGrad;
  ctx.fillRect(0, 0, size, size);

  ctx.restore();
  cachedMoonDisc = canvas;
  return canvas;
}

/**
 * Lazily generates a crisp 280x280 2.5D Martian disc (0 bytes RAM until Stage 04):
 * - Warm iron-oxide ochre/terracotta regolith lit from upper-right
 * - Dark basaltic Syrtis Major & Acidalia albedo provinces
 * - Valles Marineris equatorial canyon rift + North Polar CO2/water ice cap
 * - Delicate amber-peach thin atmospheric scattering rim
 */
function getMarsDiscCanvas(): HTMLCanvasElement {
  if (cachedMarsDisc) return cachedMarsDisc;

  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.46;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(20140924); // Mangalyaan MOI date

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // 1. Iron-oxide ochre/terracotta planetary surface
  const baseGrad = ctx.createRadialGradient(
    cx + r * 0.34,
    cy - r * 0.30,
    r * 0.06,
    cx,
    cy,
    r * 1.16
  );
  baseGrad.addColorStop(0.0, '#fdba74');
  baseGrad.addColorStop(0.32, '#ea6a2a');
  baseGrad.addColorStop(0.70, '#9a3412');
  baseGrad.addColorStop(1.0, '#30100a');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  // 2. Dark basaltic albedo provinces (Syrtis Major, Acidalia, Margaritifer)
  const provinces = [
    { x: 0.22, y: 0.02, rx: 0.22, ry: 0.28, rot: -0.25, a: 0.36 },
    { x: -0.26, y: -0.28, rx: 0.28, ry: 0.22, rot: 0.35, a: 0.30 },
    { x: -0.10, y: 0.36, rx: 0.38, ry: 0.16, rot: -0.1, a: 0.34 },
  ];
  for (const p of provinces) {
    ctx.save();
    ctx.translate(cx + p.x * r, cy + p.y * r);
    ctx.rotate(p.rot);
    const pg = ctx.createRadialGradient(0, 0, 4, 0, 0, p.rx * r);
    pg.addColorStop(0.0, `rgba(67, 20, 7, ${p.a})`);
    pg.addColorStop(0.7, `rgba(92, 28, 12, ${p.a * 0.65})`);
    pg.addColorStop(1.0, 'rgba(92, 28, 12, 0)');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.rx * r, p.ry * r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. Valles Marineris equatorial canyon scar
  ctx.strokeStyle = 'rgba(54, 15, 6, 0.58)';
  ctx.lineWidth = 4.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.36, cy + r * 0.06);
  ctx.quadraticCurveTo(cx - r * 0.05, cy + r * 0.14, cx + r * 0.24, cy + r * 0.08);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(253, 186, 116, 0.35)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.35, cy + r * 0.085);
  ctx.quadraticCurveTo(cx - r * 0.05, cy + r * 0.165, cx + r * 0.23, cy + r * 0.105);
  ctx.stroke();

  // Subtle dusty texture mottling & impact basins
  for (let i = 0; i < 28; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.pow(rand(), 0.65) * r * 0.82;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const cr = 3 + rand() * 11;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(254, 215, 170, 0.14)' : 'rgba(67, 20, 7, 0.18)';
    ctx.beginPath();
    ctx.arc(x, y, cr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. North Polar Ice Cap (frosty white crescent at top pole)
  const iceGrad = ctx.createRadialGradient(cx + r * 0.06, cy - r * 0.92, 2, cx + r * 0.06, cy - r * 0.88, r * 0.32);
  iceGrad.addColorStop(0.0, 'rgba(255, 250, 245, 0.90)');
  iceGrad.addColorStop(0.55, 'rgba(254, 232, 214, 0.45)');
  iceGrad.addColorStop(1.0, 'rgba(254, 232, 214, 0)');
  ctx.fillStyle = iceGrad;
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.04, cy - r * 0.88, r * 0.34, r * 0.15, 0.08, 0, Math.PI * 2);
  ctx.fill();

  // 5. Solar terminator shadow across western Martian night side
  const termGrad = ctx.createRadialGradient(
    cx + r * 0.42,
    cy - r * 0.32,
    r * 0.45,
    cx + r * 0.12,
    cy - r * 0.08,
    r * 1.22
  );
  termGrad.addColorStop(0.0, 'rgba(12, 4, 6, 0)');
  termGrad.addColorStop(0.60, 'rgba(12, 4, 6, 0.14)');
  termGrad.addColorStop(0.84, 'rgba(12, 4, 6, 0.74)');
  termGrad.addColorStop(1.0, 'rgba(12, 4, 6, 0.94)');
  ctx.fillStyle = termGrad;
  ctx.fillRect(0, 0, size, size);

  // 6. Thin dusty amber-peach Martian atmospheric limb scatter
  const rimGrad = ctx.createRadialGradient(cx, cy, r * 0.84, cx, cy, r);
  rimGrad.addColorStop(0.0, 'rgba(251, 146, 60, 0)');
  rimGrad.addColorStop(0.75, 'rgba(251, 146, 60, 0.22)');
  rimGrad.addColorStop(1.0, 'rgba(254, 215, 170, 0.56)');
  ctx.fillStyle = rimGrad;
  ctx.fillRect(0, 0, size, size);

  ctx.restore();
  cachedMarsDisc = canvas;
  return canvas;
}

/**
 * Renders Deep Space Encounters behind the Hero Satellite:
 * - Stage 03 (0.46 -> 0.73): 2.5D Lunar Flyby in upper-right + distant Earth marble
 * - Stage 04 (0.70 -> 0.91): 2.5D Mars Encounter in upper-right with warm amber halo
 * - Stage 05 (0.86 -> 1.00): Distant Pinpoint Sun + Voyager Sunbeam & Pale Blue Dot Earth
 */
export function renderDeepSpaceEncounters(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, t, mouseX, mouseY, unit, reducedMotion } = frame;

  ctx.save();

  // =========================================================================
  // 1. STAGE 03: KEPLERIAN LUNAR FLYBY (0.46 -> 0.73)
  // =========================================================================
  if (sp >= 0.46 && sp <= 0.73) {
    const u = (sp - 0.46) / 0.27;
    const harmonic = Math.sin(u * Math.PI);
    const fadeIn = smoothstep(0.0, 0.14, u);
    const fadeOut = 1 - smoothstep(0.86, 1.0, u);
    const alpha = fadeIn * fadeOut;

    if (alpha > 0.008) {
      const moonCanvas = getMoonDiscCanvas();
      const moonR = unit * (0.42 + harmonic * 1.15);
      const drawSize = (moonR / 0.46) * 2;
      const mx = lerp(w * 0.86, w * 0.78, u) - mouseX * 14;
      const my = lerp(h * 0.24, h * 0.34, u) - mouseY * 10;

      // Subtle cool moonshine halo
      ctx.globalAlpha = alpha * 0.35;
      const halo = ctx.createRadialGradient(mx, my, moonR * 0.85, mx, my, moonR * 1.32);
      halo.addColorStop(0.0, 'rgba(226, 232, 240, 0.42)');
      halo.addColorStop(1.0, 'rgba(226, 232, 240, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(mx, my, moonR * 1.32, 0, Math.PI * 2);
      ctx.fill();

      // Lunar disc
      ctx.globalAlpha = alpha;
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(reducedMotion ? 0 : Math.sin(t * 0.04) * 0.03);
      ctx.drawImage(moonCanvas, -drawSize * 0.5, -drawSize * 0.5, drawSize, drawSize);
      ctx.restore();

      // Distant background Earth marble (looking back home from 384,400 km)
      const ex = w * 0.56 - mouseX * 6;
      const ey = h * 0.76 - mouseY * 5;
      const er = Math.max(7, unit * 0.13);
      const eg = ctx.createRadialGradient(ex + er * 0.35, ey - er * 0.3, 1, ex, ey, er * 2.2);
      eg.addColorStop(0.0, 'rgba(186, 230, 253, 0.95)');
      eg.addColorStop(0.35, 'rgba(56, 189, 248, 0.65)');
      eg.addColorStop(0.65, 'rgba(14, 165, 233, 0.18)');
      eg.addColorStop(1.0, 'rgba(14, 165, 233, 0)');
      ctx.globalAlpha = alpha * 0.85;
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(ex, ey, er * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // =========================================================================
  // 2. STAGE 04: MARS INTERPLANETARY ENCOUNTER (0.70 -> 0.91)
  // =========================================================================
  if (sp >= 0.70 && sp <= 0.91) {
    const v = (sp - 0.70) / 0.21;
    const harmonic = Math.sin(v * Math.PI);
    const fadeIn = smoothstep(0.0, 0.14, v);
    const fadeOut = 1 - smoothstep(0.86, 1.0, v);
    const alpha = fadeIn * fadeOut;

    if (alpha > 0.008) {
      const marsCanvas = getMarsDiscCanvas();
      const marsR = unit * (0.40 + harmonic * 1.22);
      const drawSize = (marsR / 0.46) * 2;
      const mx = lerp(w * 0.86, w * 0.78, v) - mouseX * 14;
      const my = lerp(h * 0.25, h * 0.36, v) - mouseY * 10;

      // Warm thin amber Martian atmospheric scattering halo
      ctx.globalAlpha = alpha * 0.55;
      const halo = ctx.createRadialGradient(mx, my, marsR * 0.88, mx, my, marsR * 1.38);
      halo.addColorStop(0.0, 'rgba(251, 146, 60, 0.45)');
      halo.addColorStop(0.5, 'rgba(234, 88, 12, 0.16)');
      halo.addColorStop(1.0, 'rgba(234, 88, 12, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(mx, my, marsR * 1.38, 0, Math.PI * 2);
      ctx.fill();

      // Martian disc
      ctx.globalAlpha = alpha;
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(reducedMotion ? 0 : Math.sin(t * 0.05) * 0.03);
      ctx.drawImage(marsCanvas, -drawSize * 0.5, -drawSize * 0.5, drawSize, drawSize);
      ctx.restore();
    }
  }

  // =========================================================================
  // 3. STAGE 05: DISTANT PINPOINT SUN & VOYAGER PALE BLUE DOT (0.86 -> 1.00)
  // =========================================================================
  if (sp >= 0.86) {
    const alpha = smoothstep(0.86, 0.93, sp);
    const sunX = w * 0.84 - mouseX * 8;
    const sunY = h * 0.22 - mouseY * 6;
    const dotX = sunX + unit * 0.72;
    const dotY = sunY + unit * 0.36;

    // Distant solar pinpoint corona
    ctx.globalAlpha = alpha;
    const coronaR = unit * 0.95;
    const sGrad = ctx.createRadialGradient(sunX, sunY, 1, sunX, sunY, coronaR);
    sGrad.addColorStop(0.0, 'rgba(255, 253, 240, 1.0)');
    sGrad.addColorStop(0.14, 'rgba(255, 240, 194, 0.72)');
    sGrad.addColorStop(0.45, 'rgba(253, 214, 138, 0.18)');
    sGrad.addColorStop(1.0, 'rgba(253, 214, 138, 0)');
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, coronaR, 0, Math.PI * 2);
    ctx.fill();

    // Subtle Voyager sunbeam ray passing through the Pale Blue Dot
    ctx.save();
    ctx.translate(dotX, dotY);
    ctx.rotate(0.32);
    const rayGrad = ctx.createLinearGradient(-unit * 0.16, 0, unit * 0.16, 0);
    rayGrad.addColorStop(0.0, 'rgba(253, 230, 138, 0)');
    rayGrad.addColorStop(0.5, `rgba(253, 230, 138, ${0.14 * alpha})`);
    rayGrad.addColorStop(1.0, 'rgba(253, 230, 138, 0)');
    ctx.fillStyle = rayGrad;
    ctx.fillRect(-unit * 0.16, -unit * 1.8, unit * 0.32, unit * 3.6);
    ctx.restore();

    // Tiny Pale Blue Dot (Earth) suspended in the sunbeam
    const dotGlow = ctx.createRadialGradient(dotX, dotY, 0.5, dotX, dotY, unit * 0.22);
    dotGlow.addColorStop(0.0, 'rgba(224, 242, 254, 1.0)');
    dotGlow.addColorStop(0.25, 'rgba(56, 189, 248, 0.78)');
    dotGlow.addColorStop(1.0, 'rgba(14, 165, 233, 0)');
    ctx.fillStyle = dotGlow;
    ctx.beginPath();
    ctx.arc(dotX, dotY, unit * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7dd3fc';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(148, 163, 184, ${alpha * 0.72})`;
    ctx.font = `500 ${Math.max(8, Math.round(unit * 0.075))}px "JetBrains Mono", monospace`;
    ctx.fillText('PALE BLUE DOT', dotX + 10, dotY + 3);
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}
