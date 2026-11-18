import { type Scene2DFrameContext, smoothstep, mulberry32 } from './types';

type TreeSpecies = 'casuarina' | 'coconut' | 'palmyra';

interface TreePlacement {
  species: TreeSpecies;
  offsetX: number;
  layer: 0 | 1;
  scale: number;
  flipX: boolean;
}

interface FloraSpriteCache {
  casuarina: HTMLCanvasElement;
  coconut: HTMLCanvasElement;
  palmyra: HTMLCanvasElement;
}

let cachedSprites: FloraSpriteCache | null = null;
let cachedTrees: TreePlacement[] | null = null;

/**
 * Refined monochrome Sriharikota Casuarina Coastal Pine (120x190):
 * Crisp organic silhouette with natural layered boughs & subtle sunlit silver edge (zero messy fuzz).
 */
function buildCasuarinaSprite(): HTMLCanvasElement {
  const w = 120;
  const h = 190;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(303);
  const cx = w * 0.5;

  // Tapered slender trunk
  ctx.fillStyle = '#1f1f24';
  ctx.beginPath();
  ctx.moveTo(cx - 3.6, h - 2);
  ctx.lineTo(cx - 0.9, 18);
  ctx.lineTo(cx + 0.9, 18);
  ctx.lineTo(cx + 3.6, h - 2);
  ctx.closePath();
  ctx.fill();

  // Sunlit right trunk hairline
  ctx.strokeStyle = 'rgba(212, 212, 220, 0.30)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx + 2.8, h - 2);
  ctx.lineTo(cx + 0.8, 22);
  ctx.stroke();

  // Layered organic pine silhouette boughs
  const tiers = 11;
  for (let tier = 0; tier < tiers; tier++) {
    const f = tier / (tiers - 1);
    const y = 20 + f * (h - 68);
    const halfSpan = (Math.sin(Math.pow(f, 0.72) * Math.PI * 0.86) * 34 + 7) * (0.88 + rand() * 0.24);
    const droop = 7 + f * 9;

    // Dark shaded pine crown mass
    ctx.fillStyle = '#1c1c21';
    ctx.beginPath();
    ctx.moveTo(cx, y - 5);
    ctx.quadraticCurveTo(cx - halfSpan * 0.55, y + 2, cx - halfSpan, y + droop);
    ctx.quadraticCurveTo(cx - halfSpan * 0.45, y + droop + 4, cx, y + droop * 0.65);
    ctx.quadraticCurveTo(cx + halfSpan * 0.45, y + droop + 4, cx + halfSpan, y + droop);
    ctx.quadraticCurveTo(cx + halfSpan * 0.55, y + 2, cx, y - 5);
    ctx.closePath();
    ctx.fill();

    // Subtle sunlit silver highlight along upper-right pine needles
    ctx.strokeStyle = 'rgba(220, 220, 228, 0.42)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(cx + 2, y - 3);
    ctx.quadraticCurveTo(cx + halfSpan * 0.52, y + 2, cx + halfSpan * 0.94, y + droop - 1);
    ctx.stroke();

    // Fine drooping feathery needle clusters
    ctx.strokeStyle = 'rgba(130, 130, 140, 0.38)';
    ctx.lineWidth = 0.9;
    for (let k = -3; k <= 3; k++) {
      if (k === 0) continue;
      const nx = cx + (k / 3.2) * halfSpan * 0.85;
      const ny = y + droop * (0.4 + Math.abs(k) * 0.16);
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(nx + (k > 0 ? 2 : -2), ny + 6 + rand() * 5);
      ctx.stroke();
    }
  }
  return canvas;
}

/**
 * Graceful monochrome South Indian Coconut Palm (160x195):
 * Smoothly curved ringed trunk + lush sweeping pinnate fronds with delicate sunlit leaflet edges.
 */
function buildCoconutSprite(): HTMLCanvasElement {
  const w = 160;
  const h = 195;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const baseX = w * 0.44;
  const baseY = h - 2;
  const ctrlX = w * 0.57;
  const ctrlY = h * 0.54;
  const topX = w * 0.53;
  const topY = 58;

  // Tapered graceful curved trunk
  const steps = 18;
  for (let i = 0; i < steps; i++) {
    const u0 = i / steps;
    const u1 = (i + 1) / steps;
    const pt = (u: number) => {
      const inv = 1 - u;
      return {
        x: inv * inv * baseX + 2 * inv * u * ctrlX + u * u * topX,
        y: inv * inv * baseY + 2 * inv * u * ctrlY + u * u * topY,
      };
    };
    const p0 = pt(u0);
    const p1 = pt(u1);
    ctx.strokeStyle = '#25252b';
    ctx.lineWidth = 6.8 * (1 - u0 * 0.58);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  }

  // Sunlit silver rim along right curve of trunk
  ctx.strokeStyle = 'rgba(220, 220, 228, 0.38)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(baseX + 2.8, baseY);
  ctx.quadraticCurveTo(ctrlX + 2.1, ctrlY, topX + 1.3, topY);
  ctx.stroke();

  // Small coconut cluster tucked under crown
  ctx.fillStyle = '#32323a';
  ctx.beginPath();
  ctx.arc(topX - 3, topY + 5, 2.8, 0, Math.PI * 2);
  ctx.arc(topX + 3, topY + 6, 2.8, 0, Math.PI * 2);
  ctx.arc(topX, topY + 8, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // 10 lush sweeping pinnate fronds with natural arch & drooping blade leaflets
  const fronds = [
    { a: -2.85, l: 48, d: 28, light: false },
    { a: -2.42, l: 56, d: 22, light: false },
    { a: -1.96, l: 54, d: 15, light: false },
    { a: -1.52, l: 48, d: 10, light: true },
    { a: -1.08, l: 56, d: 14, light: true },
    { a: -0.62, l: 60, d: 23, light: true },
    { a: -0.18, l: 54, d: 31, light: true },
    { a: 0.22, l: 44, d: 34, light: true },
    { a: 2.95, l: 44, d: 32, light: false },
    { a: -1.28, l: 38, d: 6, light: true },
  ];

  for (const f of fronds) {
    const endX = topX + Math.cos(f.a) * f.l;
    const endY = topY + Math.sin(f.a) * f.l + f.d;
    const midX = topX + Math.cos(f.a) * f.l * 0.56;
    const midY = topY + Math.sin(f.a) * f.l * 0.56 - 7;

    // Rachis (central frond spine)
    ctx.strokeStyle = f.light ? 'rgba(200, 200, 210, 0.72)' : 'rgba(62, 62, 70, 0.90)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();

    // Fine drooping pinnate leaflets along the frond curve
    for (let k = 2; k < 17; k++) {
      const u = k / 17;
      const inv = 1 - u;
      const lx = inv * inv * topX + 2 * inv * u * midX + u * u * endX;
      const ly = inv * inv * topY + 2 * inv * u * midY + u * u * endY;
      const bl = Math.sin(u * Math.PI) * 15 + 3.5;

      ctx.strokeStyle = f.light
        ? 'rgba(218, 218, 226, 0.55)'
        : 'rgba(54, 54, 62, 0.85)';
      ctx.lineWidth = 1.05;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.quadraticCurveTo(
        lx + Math.cos(f.a) * 2.5,
        ly + bl * 0.55,
        lx + Math.cos(f.a) * 4.5,
        ly + bl
      );
      ctx.stroke();
    }
  }
  return canvas;
}

/**
 * Authentic monochrome South Indian Palmyra Palm (130x195):
 * Tall stately tapered trunk + full, natural starburst crown of radiating fan fronds (no mushroom cap!).
 */
function buildPalmyraSprite(): HTMLCanvasElement {
  const w = 130;
  const h = 195;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const cx = w * 0.5;
  const topY = 58;

  // Tapered stately trunk
  ctx.fillStyle = '#222228';
  ctx.beginPath();
  ctx.moveTo(cx - 4.4, h - 2);
  ctx.lineTo(cx - 2.0, topY);
  ctx.lineTo(cx + 2.0, topY);
  ctx.lineTo(cx + 4.4, h - 2);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(216, 216, 224, 0.34)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(cx + 3.8, h - 2);
  ctx.lineTo(cx + 1.8, topY);
  ctx.stroke();

  // Full starburst of 11 radiating palmate fan stalks (360-degree natural tropical crown)
  const fans = [
    { a: -2.8, len: 22 },
    { a: -2.35, len: 26 },
    { a: -1.9, len: 27 },
    { a: -1.5, len: 25 },
    { a: -1.05, len: 27 },
    { a: -0.6, len: 26 },
    { a: -0.15, len: 24 },
    { a: 0.35, len: 21 },
    { a: 0.85, len: 18 },
    { a: 2.35, len: 18 },
    { a: 2.85, len: 21 },
  ];

  for (const f of fans) {
    const fx = cx + Math.cos(f.a) * f.len;
    const fy = topY + Math.sin(f.a) * f.len;
    const isLit = f.a > -1.65 && f.a < 0.8;

    ctx.strokeStyle = isLit ? 'rgba(180, 180, 190, 0.65)' : 'rgba(54, 54, 62, 0.88)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(fx, fy);
    ctx.stroke();

    // Jagged pleated palmate fan blades radiating from stalk tip
    for (let b = 0; b < 9; b++) {
      const frac = (b / 8) - 0.5;
      const ba = f.a + frac * 1.45;
      const bladeLen = 14 + (1 - Math.abs(frac) * 1.5) * 8;
      ctx.strokeStyle = isLit ? 'rgba(220, 220, 228, 0.58)' : 'rgba(64, 64, 72, 0.84)';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + Math.cos(ba) * bladeLen, fy + Math.sin(ba) * bladeLen);
      ctx.stroke();
    }
  }
  return canvas;
}

function getFloraSprites(): FloraSpriteCache {
  if (cachedSprites) return cachedSprites;
  cachedSprites = {
    casuarina: buildCasuarinaSprite(),
    coconut: buildCoconutSprite(),
    palmyra: buildPalmyraSprite(),
  };
  return cachedSprites;
}

function getTreePlacements(): TreePlacement[] {
  if (cachedTrees) return cachedTrees;
  const rand = mulberry32(777);
  const list: TreePlacement[] = [];

  const offsets = [
    -7.0, -5.6, -4.3, -3.2,
    2.9, 4.1, 5.4, 6.8,
  ];
  offsets.forEach((ox, idx) => {
    // Prioritize graceful Coconut palms & Casuarina pines with natural Palmyra accents
    const species: TreeSpecies =
      idx % 3 === 0 ? 'coconut' : idx % 3 === 1 ? 'casuarina' : 'palmyra';
    list.push({
      species,
      offsetX: ox + (rand() - 0.5) * 0.18,
      layer: idx % 2 === 0 ? 1 : 0,
      scale: 0.88 + rand() * 0.28,
      flipX: rand() > 0.5,
    });
  });

  list.sort((a, b) => a.layer - b.layer);
  cachedTrees = list;
  return list;
}

/**
 * Shared realistic camera zoom-out transform for ground pad, gantry & coastal flora:
 * On liftoff (sp >= 0.170), the pad & trees shrink cleanly onto Earth's receding horizon!
 */
export function getPadZoomTransform(
  sp: number,
  w: number,
  h: number,
  groundY: number,
  unit: number
): { scale: number; anchorY: number; alpha: number; horizonY: number } {
  const baseHorizonY = groundY - unit * 0.24;
  if (sp <= 0.170) {
    return { scale: 1, anchorY: groundY, alpha: 1, horizonY: baseHorizonY };
  }

  const baseEarthR = Math.max(w, h) * 0.56;
  const leoTopY = Math.max(h * 0.62, h - baseEarthR * 0.44);
  const zoomOut = smoothstep(0.170, 0.480, sp);
  const earthTopY = baseHorizonY + (leoTopY - baseHorizonY) * zoomOut;

  // Pad shrinks smoothly onto Earth's receding horizon and fades before curvature lifts outer edges
  const padZ = smoothstep(0.170, 0.295, sp);
  const scale = Math.max(0.06, 1 - Math.pow(padZ, 0.78) * 0.94);
  const anchorY = earthTopY + unit * 0.24 * scale;
  const alpha = 1 - smoothstep(0.215, 0.285, sp);

  return { scale, anchorY, alpha, horizonY: earthTopY };
}

/** Legacy drop offset retained for compatibility */
export function getLaunchPadDropPx(sp: number, h: number): number {
  if (sp < 0.170) return 0;
  return smoothstep(0.170, 0.315, sp) * h * 0.04;
}

/**
 * Refined, whisper-light monochrome Sriharikota coastal horizon, soft ground pad & natural palm/pine groves.
 * Trees gently hug Earth's curving horizon during early liftoff zoom-out so none ever float in mid-air!
 */
export function renderSriharikotaTerrain(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, t, mouseX, vehicleAnchorX, groundY, unit, reducedMotion } = frame;
  if (sp > 0.295) return;

  const { scale, anchorY, alpha, horizonY } = getPadZoomTransform(sp, w, h, groundY, unit);
  if (alpha < 0.01) return;

  const sprites = getFloraSprites();
  const trees = getTreePlacements();

  ctx.save();

  // 1. Flat ground plane & soft distant coastal treeline silhouette (hands off cleanly to Earth arc)
  const flatGroundFade = 1 - smoothstep(0.170, 0.215, sp);
  if (flatGroundFade > 0.01) {
    ctx.globalAlpha = flatGroundFade;

    ctx.fillStyle = '#0c0c10';
    ctx.beginPath();
    ctx.moveTo(0, horizonY + unit * 0.04);
    ctx.quadraticCurveTo(w * 0.18, horizonY - unit * 0.08 * scale, w * 0.38, horizonY - unit * 0.02 * scale);
    ctx.quadraticCurveTo(w * 0.65, horizonY - unit * 0.06 * scale, w, horizonY + unit * 0.02);
    ctx.lineTo(w, h + 20);
    ctx.lineTo(0, h + 20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, horizonY + unit * 0.02, w, h - horizonY + 20);

    // Whisper-light 1px coastal horizon datum line + subtle Bay of Bengal shimmer
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, horizonY + unit * 0.02);
    ctx.lineTo(w, horizonY + unit * 0.02);
    ctx.stroke();

    const seaX = w * 0.87 - mouseX * 5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    for (let r = 0; r < 4; r++) {
      const ry = horizonY + unit * 0.07 + r * 7;
      const pulse = reducedMotion ? 1 : 0.90 + 0.10 * Math.sin(t * 1.9 + r * 1.4);
      const rw = (18 + r * 11) * pulse;
      ctx.beginPath();
      ctx.moveTo(seaX - rw * 0.5, ry);
      ctx.lineTo(seaX + rw * 0.5, ry);
      ctx.stroke();
    }
  }

  // 2. Perspective zoom-out transform around pad anchor on Earth's receding horizon
  const padOriginX = vehicleAnchorX - mouseX * 8 * scale;
  const zoomOut = smoothstep(0.170, 0.480, sp);
  const baseEarthR = Math.max(w, h) * 0.56;
  const currentEarthR = baseEarthR * Math.pow(8.6, Math.pow(1 - zoomOut, 1.25));

  ctx.globalAlpha = alpha;
  ctx.translate(padOriginX, anchorY);
  ctx.scale(scale, scale);

  // Coastal trees fade slightly earlier than central pad & hug Earth's curvature sagitta (zero floating!)
  const treeAlpha = alpha * (1 - smoothstep(0.185, 0.255, sp));
  if (treeAlpha > 0.01) {
    for (let i = 0; i < trees.length; i++) {
      const tr = trees[i];
      const img = sprites[tr.species];
      const drawH = tr.scale * unit * 1.08;
      const drawW = drawH * (img.width / img.height);
      const tx = tr.offsetX * unit;
      // Curve drop along Earth's sphere so far-left/right trees stay firmly rooted on the curving limb
      const worldDx = tx * scale;
      const curveDrop = sp > 0.170 ? (worldDx * worldDx) / (2 * Math.max(currentEarthR, 400)) / scale : 0;
      const ty = (tr.layer === 0 ? -unit * 0.16 : unit * 0.05) + curveDrop;
      const sway = reducedMotion ? 0 : Math.sin(t * 1.0 + i * 1.7) * 0.014;

      ctx.save();
      ctx.globalAlpha = treeAlpha * (tr.layer === 0 ? 0.34 : 0.62);
      ctx.translate(tx, ty);
      ctx.rotate(sway);
      if (tr.flipX) ctx.scale(-1, 1);
      ctx.drawImage(img, -drawW * 0.5, -drawH, drawW, drawH);
      ctx.restore();
    }
  }

  // 3. Minimal clean ground pad oval shrinking smoothly with the launch site
  const apronRx = unit * 2.25;
  const apronRy = unit * 0.26;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#0f0f13';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.13)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, unit * 0.05, apronRx, apronRy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}
