import { type Scene2DFrameContext, smoothstep, mulberry32 } from './types';

type TreeSpecies = 'casuarina' | 'coconut' | 'banyan';

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
  banyan: HTMLCanvasElement;
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
 * Majestic monochrome Indian Banyan Tree (220x185):
 * Wide gnarled spreading trunk, sweeping arched boughs, iconic hanging aerial prop roots
 * reaching down to the ground, and a lush multi-domed sunlit canopy silhouette!
 */
function buildBanyanSprite(): HTMLCanvasElement {
  const w = 220;
  const h = 185;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const cx = w * 0.5;
  const groundLine = h - 2;

  // 1. Thick gnarled main trunk with wide grounded buttress roots
  ctx.fillStyle = '#1e1e23';
  ctx.beginPath();
  ctx.moveTo(cx - 18, groundLine);
  ctx.quadraticCurveTo(cx - 10, h - 28, cx - 9, h - 66);
  ctx.lineTo(cx + 9, h - 66);
  ctx.quadraticCurveTo(cx + 11, h - 28, cx + 19, groundLine);
  ctx.closePath();
  ctx.fill();

  // Subtle sunlit highlight on right bark edge
  ctx.strokeStyle = 'rgba(216, 216, 224, 0.30)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(cx + 17, groundLine);
  ctx.quadraticCurveTo(cx + 10, h - 30, cx + 8.5, h - 66);
  ctx.stroke();

  // 2. Wide sweeping arched primary boughs spreading left & right
  const boughs = [
    { ex: cx - 64, ey: h - 94, ctrlX: cx - 34, ctrlY: h - 86, lw: 6.5 },
    { ex: cx + 66, ey: h - 96, ctrlX: cx + 36, ctrlY: h - 88, lw: 6.5 },
    { ex: cx - 38, ey: h - 114, ctrlX: cx - 22, ctrlY: h - 98, lw: 5.0 },
    { ex: cx + 40, ey: h - 116, ctrlX: cx + 22, ctrlY: h - 98, lw: 5.0 },
    { ex: cx, ey: h - 122, ctrlX: cx + 3, ctrlY: h - 94, lw: 5.5 },
  ];
  ctx.lineCap = 'round';
  for (const b of boughs) {
    ctx.strokeStyle = '#202026';
    ctx.lineWidth = b.lw;
    ctx.beginPath();
    ctx.moveTo(cx, h - 64);
    ctx.quadraticCurveTo(b.ctrlX, b.ctrlY, b.ex, b.ey);
    ctx.stroke();
  }

  // 3. Lush broad multi-domed Banyan leaf canopy (clean silhouette, zero hanging vertical lines!)
  const canopyMass = [
    { x: cx - 66, y: h - 106, rx: 32, ry: 22 },
    { x: cx - 38, y: h - 122, rx: 40, ry: 28 },
    { x: cx, y: h - 134, rx: 46, ry: 32 },
    { x: cx + 40, y: h - 122, rx: 40, ry: 28 },
    { x: cx + 68, y: h - 108, rx: 32, ry: 22 },
    { x: cx - 50, y: h - 98, rx: 30, ry: 18 },
    { x: cx + 52, y: h - 100, rx: 30, ry: 18 },
    { x: cx, y: h - 106, rx: 48, ry: 22 },
  ];
  for (const dome of canopyMass) {
    ctx.fillStyle = '#19191f';
    ctx.beginPath();
    ctx.ellipse(dome.x, dome.y, dome.rx, dome.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft sunlit silver-gray upper foliage clusters (gives rich botanical leaf texture!)
  const litCrowns = [
    { x: cx - 32, y: h - 132, rx: 28, ry: 17, a: 0.24 },
    { x: cx + 4, y: h - 144, rx: 34, ry: 20, a: 0.34 },
    { x: cx + 42, y: h - 130, rx: 30, ry: 18, a: 0.42 },
    { x: cx + 68, y: h - 114, rx: 22, ry: 14, a: 0.38 },
    { x: cx - 62, y: h - 112, rx: 20, ry: 13, a: 0.18 },
  ];
  for (const lc of litCrowns) {
    const lg = ctx.createRadialGradient(lc.x + 6, lc.y - 5, 2, lc.x, lc.y, lc.rx);
    lg.addColorStop(0.0, `rgba(232, 232, 240, ${lc.a})`);
    lg.addColorStop(0.60, `rgba(148, 148, 160, ${lc.a * 0.42})`);
    lg.addColorStop(1.0, 'rgba(60, 60, 70, 0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.ellipse(lc.x, lc.y, lc.rx, lc.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Crisp sunlit upper leaf rim arc along right-facing crown
  ctx.strokeStyle = 'rgba(226, 226, 234, 0.42)';
  ctx.lineWidth = 1.05;
  ctx.beginPath();
  ctx.arc(cx + 6, h - 134, 34, -Math.PI * 0.62, -Math.PI * 0.08);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 44, h - 122, 27, -Math.PI * 0.55, 0.05);
  ctx.stroke();

  return canvas;
}

function getFloraSprites(): FloraSpriteCache {
  if (cachedSprites) return cachedSprites;
  cachedSprites = {
    casuarina: buildCasuarinaSprite(),
    coconut: buildCoconutSprite(),
    banyan: buildBanyanSprite(),
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
    const species: TreeSpecies =
      idx % 3 === 0 ? 'coconut' : idx % 3 === 1 ? 'casuarina' : 'banyan';
    list.push({
      species,
      offsetX: ox + (rand() - 0.5) * 0.18,
      layer: idx % 2 === 0 ? 1 : 0,
      scale: species === 'banyan' ? 1.05 + rand() * 0.22 : 0.88 + rand() * 0.28,
      flipX: rand() > 0.5,
    });
  });

  list.sort((a, b) => a.layer - b.layer);
  cachedTrees = list;
  return list;
}

/**
 * Camera-tracking launchpad transform:
 * - On liftoff (0.170 -> 0.220): Pad stays natural scale on the ground while the rocket physically climbs past the gantry!
 * - During climb (0.210 -> 0.305): Camera pans up following the ascending rocket so the pad & trees glide cleanly downward
 *   while Earth's curved horizon remains visible beneath the rocket (no toy shrinking-background illusion!).
 */
export function getPadZoomTransform(
  sp: number,
  _w: number,
  h: number,
  groundY: number,
  unit: number
): { scale: number; anchorY: number; alpha: number; horizonY: number } {
  const baseHorizonY = groundY - unit * 0.24;
  if (sp <= 0.140) {
    const dolly = smoothstep(0.0, 0.140, sp);
    return {
      scale: 1 + dolly * 0.032,
      anchorY: groundY + dolly * unit * 0.04,
      alpha: 1,
      horizonY: baseHorizonY + dolly * unit * 0.025,
    };
  }

  // Gentle natural parallax drop as the camera pans up tracking the rising rocket across many frames
  const panUp = smoothstep(0.148, 0.310, sp);
  const dropPx = Math.pow(panUp, 1.55) * (h * 0.62 + unit * 1.4);
  const scale = 1.032 - panUp * 0.252;
  const anchorY = groundY + unit * 0.04 + dropPx;
  const horizonY = baseHorizonY + unit * 0.025 + dropPx * 0.65;
  const alpha = 1 - smoothstep(0.240, 0.305, sp);

  return { scale, anchorY, alpha, horizonY };
}

/** Legacy drop offset retained for compatibility */
export function getLaunchPadDropPx(sp: number, h: number): number {
  if (sp < 0.140) return 0;
  return smoothstep(0.140, 0.310, sp) * h * 0.04;
}

/**
 * Refined, whisper-light monochrome Sriharikota coastal horizon, soft ground pad & natural groves.
 */
export function renderSriharikotaTerrain(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, t, mouseX, vehicleAnchorX, groundY, unit, reducedMotion } = frame;
  if (sp > 0.315) return;

  const { scale, anchorY, alpha, horizonY } = getPadZoomTransform(sp, w, h, groundY, unit);
  if (alpha < 0.01) return;

  const sprites = getFloraSprites();
  const trees = getTreePlacements();

  ctx.save();

  // 1. Flat coastal ground plane & distant treeline ridge (pans down smoothly with the launchpad)
  const flatGroundFade = alpha;
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

  // 2. Transform around pad anchor on the receding ground plane
  const padOriginX = vehicleAnchorX - mouseX * 8 * scale;

  ctx.globalAlpha = alpha;
  ctx.translate(padOriginX, anchorY);
  ctx.scale(scale, scale);

  // Coastal trees stay firmly rooted on the receding ground plane
  if (alpha > 0.01) {
    for (let i = 0; i < trees.length; i++) {
      const tr = trees[i];
      const img = sprites[tr.species];
      const drawH = tr.scale * unit * 1.08;
      const drawW = drawH * (img.width / img.height);
      const tx = tr.offsetX * unit;
      const ty = tr.layer === 0 ? -unit * 0.16 : unit * 0.05;
      const sway = reducedMotion ? 0 : Math.sin(t * 1.0 + i * 1.7) * 0.014;

      ctx.save();
      ctx.globalAlpha = alpha * (tr.layer === 0 ? 0.34 : 0.62);
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

  // 4. Tiny distant coastal birds gliding calmly across the horizon (scatter gently away on engine ignition!)
  if (sp < 0.095 && !reducedMotion) {
    const scatter = smoothstep(0.032, 0.092, sp);
    const birdFade = (1 - smoothstep(0.068, 0.095, sp)) * alpha;
    if (birdFade > 0.02) {
      const birds = [
        { ox: -3.9, oy: -1.18, speed: 0.18, wingRate: 5.4, dir: -1, sz: 0.075 },
        { ox: -3.45, oy: -1.32, speed: 0.16, wingRate: 6.1, dir: -1, sz: 0.062 },
        { ox: -2.95, oy: -1.12, speed: 0.20, wingRate: 5.8, dir: -1, sz: 0.068 },
        { ox: 2.85, oy: -1.26, speed: 0.15, wingRate: 5.2, dir: 1, sz: 0.064 },
      ];
      ctx.strokeStyle = `rgba(228, 228, 236, ${0.34 * birdFade})`;
      ctx.lineWidth = 1.0;
      ctx.lineCap = 'round';
      for (let b = 0; b < birds.length; b++) {
        const bd = birds[b];
        const glideX = ((t * bd.speed + b * 0.9) % 4.5) - 2.25;
        const scatterX = bd.dir * scatter * 2.6;
        const scatterY = -scatter * (1.2 + b * 0.25);
        const bx = (bd.ox + glideX * 0.35 + scatterX) * unit;
        const by = (bd.oy + Math.sin(t * 1.4 + b) * 0.05 + scatterY) * unit;
        const wing = bd.sz * unit;
        const flap = Math.sin(t * (bd.wingRate + scatter * 7.5) + b * 1.7) * wing * 0.48;
        ctx.beginPath();
        ctx.moveTo(bx - wing, by - flap);
        ctx.quadraticCurveTo(bx - wing * 0.4, by - wing * 0.32, bx, by);
        ctx.quadraticCurveTo(bx + wing * 0.4, by - wing * 0.32, bx + wing, by - flap);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}
