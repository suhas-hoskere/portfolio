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

/** Crisp monochrome Casuarina pine sprite (110x180) — ink silhouette + white sunlit edge */
function buildCasuarinaSprite(): HTMLCanvasElement {
  const w = 110;
  const h = 180;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(101);
  const cx = w * 0.5;

  // Slender trunk
  ctx.fillStyle = '#27272a';
  ctx.beginPath();
  ctx.moveTo(cx - 3.5, h - 2);
  ctx.lineTo(cx - 0.8, 14);
  ctx.lineTo(cx + 0.8, 14);
  ctx.lineTo(cx + 3.5, h - 2);
  ctx.closePath();
  ctx.fill();

  const tiers = 13;
  for (let tier = 0; tier < tiers; tier++) {
    const f = tier / (tiers - 1);
    const y = 16 + f * (h - 52);
    const env = Math.sin(Math.pow(f, 0.72) * Math.PI * 0.88) * 38 + 6;

    for (const side of [-1, 1]) {
      const bLen = env * (0.7 + rand() * 0.45);
      const bEndX = cx + side * bLen;
      const bEndY = y - 4 + f * 9;

      ctx.strokeStyle = side > 0 ? '#52525b' : '#27272a';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(bEndX, bEndY);
      ctx.stroke();

      const tufts = 6 + Math.floor(bLen / 7);
      for (let k = 0; k < tufts; k++) {
        const u = 0.25 + (k / tufts) * 0.75;
        const bx = cx + (bEndX - cx) * u;
        const by = y + (bEndY - y) * u;
        const droop = 9 + rand() * 12;
        const spread = (rand() - 0.5) * 10;

        ctx.strokeStyle =
          side > 0 && u > 0.65
            ? 'rgba(228, 228, 231, 0.62)'
            : side > 0
              ? 'rgba(113, 113, 122, 0.82)'
              : 'rgba(39, 39, 42, 0.92)';
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + spread * 0.5, by + droop * 0.4, bx + spread, by + droop);
        ctx.stroke();
      }
    }
  }
  return canvas;
}

/** Crisp monochrome South Indian Coconut Palm sprite (140x180) */
function buildCoconutSprite(): HTMLCanvasElement {
  const w = 140;
  const h = 180;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const baseX = w * 0.46;
  const baseY = h - 2;
  const ctrlX = w * 0.56;
  const ctrlY = h * 0.54;
  const topX = w * 0.52;
  const topY = 52;

  // Curved palm trunk + crisp white rim on right edge
  ctx.strokeStyle = '#3f3f46';
  ctx.lineWidth = 6.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(ctrlX, ctrlY, topX, topY);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(228, 228, 231, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(baseX + 2.5, baseY);
  ctx.quadraticCurveTo(ctrlX + 2.2, ctrlY, topX + 1.8, topY);
  ctx.stroke();

  // Coconuts cluster
  ctx.fillStyle = '#52525b';
  ctx.beginPath();
  ctx.arc(topX - 3, topY + 5, 2.8, 0, Math.PI * 2);
  ctx.arc(topX + 3, topY + 6, 2.8, 0, Math.PI * 2);
  ctx.fill();

  // 9 arching pinnate fronds with drooping blade leaflets
  const fronds = [
    { a: -2.7, l: 44, d: 24, light: false },
    { a: -2.25, l: 50, d: 19, light: false },
    { a: -1.8, l: 48, d: 13, light: false },
    { a: -1.35, l: 44, d: 10, light: true },
    { a: -0.9, l: 52, d: 16, light: true },
    { a: -0.45, l: 52, d: 24, light: true },
    { a: 0.0, l: 46, d: 30, light: true },
    { a: 2.95, l: 40, d: 30, light: false },
    { a: 0.4, l: 38, d: 32, light: true },
  ];

  for (const f of fronds) {
    const endX = topX + Math.cos(f.a) * f.l;
    const endY = topY + Math.sin(f.a) * f.l + f.d;
    const midX = topX + Math.cos(f.a) * f.l * 0.54;
    const midY = topY + Math.sin(f.a) * f.l * 0.54 - 6;

    ctx.strokeStyle = f.light ? '#a1a1aa' : '#3f3f46';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();

    for (let k = 2; k < 14; k++) {
      const u = k / 14;
      const inv = 1 - u;
      const lx = inv * inv * topX + 2 * inv * u * midX + u * u * endX;
      const ly = inv * inv * topY + 2 * inv * u * midY + u * u * endY;
      const bl = Math.sin(u * Math.PI) * 14 + 4;

      ctx.strokeStyle = f.light ? 'rgba(212, 212, 216, 0.72)' : 'rgba(63, 63, 70, 0.90)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + Math.cos(f.a) * 3.5, ly + bl);
      ctx.stroke();
    }
  }
  return canvas;
}

/** Crisp monochrome Palmyra Fan Palm sprite (110x185) */
function buildPalmyraSprite(): HTMLCanvasElement {
  const w = 110;
  const h = 185;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const cx = w * 0.5;
  const topY = 46;

  ctx.fillStyle = '#27272a';
  ctx.beginPath();
  ctx.moveTo(cx - 4.2, h - 2);
  ctx.lineTo(cx - 2.2, topY);
  ctx.lineTo(cx + 2.2, topY);
  ctx.lineTo(cx + 4.2, h - 2);
  ctx.closePath();
  ctx.fill();

  const fans = [-2.55, -1.95, -1.5, -1.0, -0.45, 0.12, 3.0];
  for (const a of fans) {
    const fx = cx + Math.cos(a) * 20;
    const fy = topY + Math.sin(a) * 20;
    const light = a > -1.6 && a < 1.2;

    ctx.strokeStyle = light ? '#a1a1aa' : '#3f3f46';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(fx, fy);
    ctx.stroke();

    for (let b = 0; b < 9; b++) {
      const ba = a - 0.85 + (b / 8) * 1.7;
      ctx.strokeStyle = light ? 'rgba(228, 228, 231, 0.68)' : 'rgba(63, 63, 70, 0.9)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + Math.cos(ba) * 17, fy + Math.sin(ba) * 17);
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
    -7.4, -6.2, -5.1, -4.1, -3.2, -2.4,
    2.35, 3.15, 4.05, 5.0, 6.1, 7.2,
  ];
  offsets.forEach((ox, idx) => {
    const species: TreeSpecies =
      idx % 3 === 0 ? 'coconut' : idx % 3 === 1 ? 'casuarina' : 'palmyra';
    list.push({
      species,
      offsetX: ox + (rand() - 0.5) * 0.2,
      layer: idx % 2 === 0 ? 1 : 0,
      scale: 1.05 + rand() * 0.42,
      flipX: rand() > 0.5,
    });
  });

  list.sort((a, b) => a.layer - b.layer);
  cachedTrees = list;
  return list;
}

/** Computes vertical drop of the ground plane during Step 04 liftoff & Stage 01 climb */
export function getLaunchPadDropPx(sp: number, h: number): number {
  if (sp < 0.170) return 0;
  const climb = smoothstep(0.170, 0.275, sp);
  return Math.pow(climb, 1.35) * h * 1.15;
}

/**
 * Pure monochrome Black & White Sriharikota coastal horizon, concrete apron & ink flora silhouettes.
 * Zero radial gradients, zero heavy animation loops.
 */
export function renderSriharikotaTerrain(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, t, mouseX, vehicleAnchorX, groundY, unit, reducedMotion } = frame;
  if (sp > 0.275) return;

  const dropPx = getLaunchPadDropPx(sp, h);
  const horizonY = groundY + dropPx - unit * 0.28;
  const apronY = groundY + dropPx;

  if (horizonY > h + unit * 3) return;

  const sprites = getFloraSprites();
  const trees = getTreePlacements();

  ctx.save();

  // 1. Distant Sriharikota Coastal Treeline Ridge Silhouette (soft atmospheric depth behind pad)
  ctx.fillStyle = '#0d0d10';
  ctx.beginPath();
  ctx.moveTo(0, horizonY + unit * 0.04);
  ctx.quadraticCurveTo(w * 0.16, horizonY - unit * 0.14, w * 0.34, horizonY - unit * 0.03);
  ctx.quadraticCurveTo(w * 0.56, horizonY - unit * 0.10, w * 0.74, horizonY - unit * 0.01);
  ctx.quadraticCurveTo(w * 0.88, horizonY + unit * 0.04, w, horizonY + unit * 0.02);
  ctx.lineTo(w, h + 20);
  ctx.lineTo(0, h + 20);
  ctx.closePath();
  ctx.fill();

  // Ground plane fill below horizon
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, horizonY + unit * 0.02, w, h - horizonY + 20);

  // Crisp 1px coastal horizon datum line + Bay of Bengal gentle animated water ripples on east flank
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, horizonY + unit * 0.02);
  ctx.lineTo(w, horizonY + unit * 0.02);
  ctx.stroke();

  const seaX = w * 0.85 - mouseX * 6;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
  for (let r = 0; r < 6; r++) {
    const ry = horizonY + unit * 0.06 + r * 6.5;
    const pulse = reducedMotion ? 1 : 0.88 + 0.12 * Math.sin(t * 2.1 + r * 1.4);
    const rw = (22 + r * 13) * pulse;
    ctx.beginPath();
    ctx.moveTo(seaX - rw * 0.5, ry);
    ctx.lineTo(seaX + rw * 0.5, ry);
    ctx.stroke();
  }

  // 2. Monochrome Sriharikota Casuarina, Coconut & Palmyra Flora Groves (with subtle breeze sway)
  for (let i = 0; i < trees.length; i++) {
    const tr = trees[i];
    const img = sprites[tr.species];
    const drawH = tr.scale * unit * 1.14;
    const drawW = drawH * (img.width / img.height);
    const parallax = tr.layer === 0 ? 6 : 12;
    const tx = vehicleAnchorX + tr.offsetX * unit - mouseX * parallax;
    const ty = tr.layer === 0 ? horizonY + unit * 0.08 : apronY + unit * 0.08;
    const sway = reducedMotion ? 0 : Math.sin(t * 1.1 + i * 1.7) * 0.018;

    ctx.globalAlpha = tr.layer === 0 ? 0.62 : 0.92;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(sway);
    if (tr.flipX) ctx.scale(-1, 1);
    ctx.drawImage(img, -drawW * 0.5, -drawH, drawW, drawH);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // 3. Paved Concrete Launch Apron, Radial Expansion Joints & Bilateral Blast-Trench Exit Walls
  const apronCx = vehicleAnchorX - mouseX * 10;
  const apronRx = unit * 3.05;
  const apronRy = unit * 0.40;

  // Outer concrete blast berm apron
  ctx.fillStyle = '#141418';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.ellipse(apronCx, apronY + unit * 0.07, apronRx, apronRy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Concentric & radial concrete expansion slab joints
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.ellipse(apronCx, apronY + unit * 0.07, apronRx * 0.65, apronRy * 0.65, 0, 0, Math.PI * 2);
  ctx.stroke();

  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(apronCx + Math.cos(ang) * apronRx * 0.32, apronY + unit * 0.07 + Math.sin(ang) * apronRy * 0.32);
    ctx.lineTo(apronCx + Math.cos(ang) * apronRx, apronY + unit * 0.07 + Math.sin(ang) * apronRy);
    ctx.stroke();
  }

  // Bilateral angled concrete flame-trench exhaust exit channels (East & West)
  ctx.fillStyle = '#070709';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1;
  ctx.fillRect(apronCx - apronRx * 0.96, apronY + unit * 0.01, apronRx * 1.92, unit * 0.13);
  ctx.strokeRect(apronCx - apronRx * 0.96, apronY + unit * 0.01, apronRx * 1.92, unit * 0.13);

  // Access Crawlerway track leading in from the left horizon toward the pad
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.beginPath();
  ctx.moveTo(0, apronY + unit * 0.18);
  ctx.lineTo(apronCx - apronRx * 0.78, apronY + unit * 0.12);
  ctx.moveTo(0, apronY + unit * 0.26);
  ctx.lineTo(apronCx - apronRx * 0.78, apronY + unit * 0.18);
  ctx.stroke();

  ctx.restore();
}
