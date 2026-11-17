import { type Scene2DFrameContext, smoothstep, mulberry32 } from './types';

type TreeSpecies = 'casuarina' | 'coconut' | 'palmyra' | 'tdef';

interface TreePlacement {
  species: TreeSpecies;
  /** Offset relative to vehicleAnchorX in `unit`s */
  offsetX: number;
  /** Depth layer: 0 = far horizon windbreak, 1 = mid grove, 2 = near flank */
  layer: 0 | 1 | 2;
  /** Height in `unit`s */
  scale: number;
  /** Horizontal flip for organic variety */
  flipX: boolean;
  /** Unique wind phase offset */
  phase: number;
  /** Slight lean angle in radians */
  lean: number;
}

interface ScrubTuft {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  shade: string;
}

interface FloraSpriteCache {
  casuarina: HTMLCanvasElement;
  coconut: HTMLCanvasElement;
  palmyra: HTMLCanvasElement;
  tdef: HTMLCanvasElement;
}

let cachedSprites: FloraSpriteCache | null = null;
let cachedTrees: TreePlacement[] | null = null;
let cachedScrub: ScrubTuft[] | null = null;

/**
 * Draws a single high-craft Casuarina Whispering Pine sprite (140x220).
 * Signature Sriharikota coastal windbreak: slender trunk, irregular branches,
 * and feathery drooping cladode needle clusters with warm eastern sunrise rim-light.
 */
function buildCasuarinaSprite(): HTMLCanvasElement {
  const w = 140;
  const h = 220;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(101);
  const cx = w * 0.5;

  // 1. Slender tapered woody trunk with bark highlight on east (+X) side
  const trunkGrad = ctx.createLinearGradient(cx - 5, 0, cx + 5, 0);
  trunkGrad.addColorStop(0, '#231812');
  trunkGrad.addColorStop(0.65, '#3b281d');
  trunkGrad.addColorStop(1, '#6b4932');
  ctx.fillStyle = trunkGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 4.5, h - 4);
  ctx.quadraticCurveTo(cx - 2.2, h * 0.55, cx - 0.8, 16);
  ctx.lineTo(cx + 0.8, 16);
  ctx.quadraticCurveTo(cx + 2.5, h * 0.55, cx + 4.8, h - 4);
  ctx.closePath();
  ctx.fill();

  // 2. Irregular lateral whorls & feathery drooping needle clusters
  const tiers = 16;
  for (let tier = 0; tier < tiers; tier++) {
    const f = tier / (tiers - 1); // 0 = top spire, 1 = lower canopy
    const y = 18 + f * (h - 68);
    // Natural conical-irregular coastal pine envelope
    const env = Math.sin(Math.pow(f, 0.72) * Math.PI * 0.88) * 48 + 8;

    for (const side of [-1, 1]) {
      const bLen = env * (0.68 + rand() * 0.48);
      const bEndX = cx + side * bLen;
      const bEndY = y - 6 + f * 12 + (rand() - 0.5) * 8;

      // Woody branchlet
      ctx.strokeStyle = side > 0 ? '#4d3525' : '#291c14';
      ctx.lineWidth = 1.6 - f * 0.4;
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.quadraticCurveTo(cx + side * bLen * 0.5, y - 4, bEndX, bEndY);
      ctx.stroke();

      // Drooping feathery needle tufts along each branch
      const tufts = 7 + Math.floor(bLen / 7);
      for (let k = 0; k < tufts; k++) {
        const u = 0.22 + (k / tufts) * 0.78;
        const bx = cx + (bEndX - cx) * u;
        const by = y + (bEndY - y) * u - 2 * Math.sin(u * Math.PI);

        // Draw 4 fine drooping needle strands per tuft
        for (let n = 0; n < 4; n++) {
          const spread = (rand() - 0.5) * 14;
          const droop = 10 + rand() * 16;
          const isSunlit = side > 0 && u > 0.55 && n === 0;
          if (isSunlit) {
            ctx.strokeStyle = 'rgba(134, 152, 86, 0.78)'; // Warm golden-olive dawn rim
          } else if (side > 0) {
            ctx.strokeStyle = n % 2 === 0 ? 'rgba(46, 82, 54, 0.88)' : 'rgba(62, 102, 66, 0.82)';
          } else {
            ctx.strokeStyle = n % 2 === 0 ? 'rgba(24, 48, 34, 0.92)' : 'rgba(34, 62, 42, 0.86)';
          }
          ctx.lineWidth = 1.35;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.quadraticCurveTo(bx + spread * 0.6, by + droop * 0.35, bx + spread, by + droop);
          ctx.stroke();
        }
      }
    }
  }

  return canvas;
}

/**
 * Draws a detailed South Indian Coconut Palm sprite (180x220):
 * Gently curved ringed trunk, cluster of coconuts under the crown,
 * and 10 arching pinnate fronds with individual drooping leaflets.
 */
function buildCoconutSprite(): HTMLCanvasElement {
  const w = 180;
  const h = 220;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(202);

  const baseX = w * 0.46;
  const baseY = h - 4;
  const ctrlX = w * 0.57;
  const ctrlY = h * 0.54;
  const topX = w * 0.52;
  const topY = 66;

  // 1. Curved tapering trunk using segmented rings for realistic palm bark
  const steps = 28;
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const pt = (u: number) => {
      const inv = 1 - u;
      return {
        x: inv * inv * baseX + 2 * inv * u * ctrlX + u * u * topX,
        y: inv * inv * baseY + 2 * inv * u * ctrlY + u * u * topY,
      };
    };
    const p0 = pt(t0);
    const p1 = pt(t1);
    const r0 = 6.8 * (1 - t0 * 0.56);
    const r1 = 6.8 * (1 - t1 * 0.56);

    const grad = ctx.createLinearGradient(p0.x - r0, p0.y, p0.x + r0, p0.y);
    grad.addColorStop(0, '#2a2018');
    grad.addColorStop(0.6, i % 2 === 0 ? '#4e3c2c' : '#433325');
    grad.addColorStop(1, '#7c5d3f'); // Warm dawn sun highlight on right edge

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(p0.x - r0, p0.y);
    ctx.lineTo(p1.x - r1, p1.y);
    ctx.lineTo(p1.x + r1, p1.y);
    ctx.lineTo(p0.x + r0, p0.y);
    ctx.closePath();
    ctx.fill();
  }

  // 2. Small cluster of coconuts nestled beneath the crownshaft
  const nuts = [
    { dx: -4, dy: 5, r: 3.4 },
    { dx: 3, dy: 6, r: 3.5 },
    { dx: 0, dy: 9, r: 3.2 },
  ];
  for (const nut of nuts) {
    ctx.fillStyle = '#5c4b23';
    ctx.beginPath();
    ctx.arc(topX + nut.dx, topY + nut.dy, nut.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Ten gracefully arching pinnate palm fronds with individual drooping leaflets
  const frondSpecs = [
    { angle: -2.75, len: 56, droop: 30, sunlit: false },
    { angle: -2.35, len: 64, droop: 24, sunlit: false },
    { angle: -1.95, len: 62, droop: 18, sunlit: false },
    { angle: -1.55, len: 54, droop: 10, sunlit: true },
    { angle: -1.15, len: 60, droop: 16, sunlit: true },
    { angle: -0.75, len: 68, droop: 22, sunlit: true },
    { angle: -0.35, len: 66, droop: 30, sunlit: true },
    { angle: 0.05, len: 58, droop: 36, sunlit: true },
    { angle: 2.95, len: 52, droop: 38, sunlit: false },
    { angle: 0.42, len: 48, droop: 40, sunlit: true },
  ];

  for (const f of frondSpecs) {
    const endX = topX + Math.cos(f.angle) * f.len;
    const endY = topY + Math.sin(f.angle) * f.len + f.droop;
    const midX = topX + Math.cos(f.angle) * f.len * 0.54;
    const midY = topY + Math.sin(f.angle) * f.len * 0.54 - 8;

    // Arching woody rachis spine
    ctx.strokeStyle = f.sunlit ? '#66532c' : '#354524';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();

    // 18 drooping blade leaflets along the spine
    const leaflets = 18;
    for (let k = 2; k < leaflets; k++) {
      const u = k / leaflets;
      const inv = 1 - u;
      const lx = inv * inv * topX + 2 * inv * u * midX + u * u * endX;
      const ly = inv * inv * topY + 2 * inv * u * midY + u * u * endY;
      const bladeLen = Math.sin(u * Math.PI) * 19 + 5;
      const tilt = Math.cos(f.angle) * 5;

      ctx.strokeStyle = f.sunlit
        ? k % 3 === 0
          ? 'rgba(138, 168, 74, 0.88)'
          : 'rgba(66, 114, 48, 0.92)'
        : k % 2 === 0
          ? 'rgba(30, 62, 32, 0.94)'
          : 'rgba(44, 82, 42, 0.90)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.quadraticCurveTo(
        lx + tilt * 0.5,
        ly + bladeLen * 0.45,
        lx + tilt + (rand() - 0.5) * 3,
        ly + bladeLen
      );
      ctx.stroke();
    }
  }

  return canvas;
}

/**
 * Draws a Palmyra Fan Palm sprite (150x230):
 * Tall columnar charcoal trunk, dry petiole skirt, and pleated fan-blade crown.
 */
function buildPalmyraSprite(): HTMLCanvasElement {
  const w = 150;
  const h = 230;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const cx = w * 0.5;
  const topY = 58;

  // 1. Tall straight charcoal trunk with sunlit eastern edge
  const trunkGrad = ctx.createLinearGradient(cx - 5, 0, cx + 5, 0);
  trunkGrad.addColorStop(0, '#1e1916');
  trunkGrad.addColorStop(0.65, '#342b24');
  trunkGrad.addColorStop(1, '#634c38');
  ctx.fillStyle = trunkGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 5.5, h - 4);
  ctx.lineTo(cx - 3.0, topY);
  ctx.lineTo(cx + 3.0, topY);
  ctx.lineTo(cx + 5.5, h - 4);
  ctx.closePath();
  ctx.fill();

  // 2. Dry drooping petiole skirt beneath crown
  ctx.strokeStyle = '#5c472a';
  ctx.lineWidth = 1.8;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 1.4, topY + 6);
    ctx.lineTo(cx + i * 4.5, topY + 24 + Math.abs(i) * 2);
    ctx.stroke();
  }

  // 3. Radiating pleated fan fronds
  const fans = [
    { angle: -2.6, stalk: 26, r: 22, sunlit: false },
    { angle: -2.05, stalk: 28, r: 24, sunlit: false },
    { angle: -1.55, stalk: 26, r: 24, sunlit: true },
    { angle: -1.05, stalk: 28, r: 24, sunlit: true },
    { angle: -0.5, stalk: 26, r: 22, sunlit: true },
    { angle: 0.12, stalk: 22, r: 20, sunlit: true },
    { angle: 3.02, stalk: 22, r: 20, sunlit: false },
  ];

  for (const fan of fans) {
    const fx = cx + Math.cos(fan.angle) * fan.stalk;
    const fy = topY + Math.sin(fan.angle) * fan.stalk;

    // Stiff stalk
    ctx.strokeStyle = '#47361f';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(fx, fy);
    ctx.stroke();

    // Pleated serrated fan blades
    const blades = 11;
    const span = 1.85;
    for (let b = 0; b < blades; b++) {
      const ba = fan.angle - span * 0.5 + (b / (blades - 1)) * span;
      const tipX = fx + Math.cos(ba) * fan.r;
      const tipY = fy + Math.sin(ba) * fan.r;
      ctx.strokeStyle = fan.sunlit
        ? b % 2 === 0
          ? '#4e8042'
          : '#849e4f'
        : b % 2 === 0
          ? '#244528'
          : '#315935';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
    }
  }

  return canvas;
}

/**
 * Draws a Tropical Dry Evergreen broadleaf shade tree sprite (180x170):
 * Gnarled forked trunk with layered organic dappled canopy clouds.
 */
function buildTdefSprite(): HTMLCanvasElement {
  const w = 180;
  const h = 170;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(404);
  const cx = w * 0.5;

  // 1. Gnarled woody trunk & forked limbs
  ctx.strokeStyle = '#332419';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, h - 4);
  ctx.quadraticCurveTo(cx - 3, h * 0.72, cx, h * 0.52);
  ctx.stroke();

  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, h * 0.58);
  ctx.lineTo(cx - 24, h * 0.36);
  ctx.moveTo(cx, h * 0.55);
  ctx.lineTo(cx + 26, h * 0.34);
  ctx.stroke();

  // 2. Layered dappled broadleaf clusters (deep shadow base -> sunlit crown rim)
  const puffs = [
    { x: cx - 34, y: h * 0.44, r: 28, c: '#1e3a24' },
    { x: cx + 32, y: h * 0.44, r: 28, c: '#294d2f' },
    { x: cx - 16, y: h * 0.36, r: 32, c: '#24462a' },
    { x: cx + 18, y: h * 0.34, r: 32, c: '#356139' },
    { x: cx, y: h * 0.28, r: 30, c: '#3e6e40' },
  ];

  for (const puff of puffs) {
    ctx.fillStyle = puff.c;
    ctx.beginPath();
    ctx.arc(puff.x, puff.y, puff.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Leaf-edge texture dabs & warm dawn sunlight kisses on upper-right leaves
  for (let i = 0; i < 65; i++) {
    const a = rand() * Math.PI * 2;
    const dist = Math.pow(rand(), 0.65) * 58;
    const lx = cx + Math.cos(a) * dist * 1.1;
    const ly = h * 0.36 + Math.sin(a) * dist * 0.62;
    const lr = 4 + rand() * 7;
    const sunlit = lx > cx - 4 && ly < h * 0.38;
    ctx.fillStyle = sunlit
      ? 'rgba(128, 154, 78, 0.58)'
      : lx < cx
        ? 'rgba(20, 42, 26, 0.65)'
        : 'rgba(46, 86, 48, 0.65)';
    ctx.beginPath();
    ctx.arc(lx, ly, lr, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

function getFloraSprites(): FloraSpriteCache {
  if (cachedSprites) return cachedSprites;
  cachedSprites = {
    casuarina: buildCasuarinaSprite(),
    coconut: buildCoconutSprite(),
    palmyra: buildPalmyraSprite(),
    tdef: buildTdefSprite(),
  };
  return cachedSprites;
}

function getTreePlacements(): TreePlacement[] {
  if (cachedTrees) return cachedTrees;
  const rand = mulberry32(777);
  const list: TreePlacement[] = [];

  // Far horizon Sriharikota Casuarina & Palmyra windbreak belt (spanning left to east coast)
  for (let i = 0; i < 28; i++) {
    const ox = -11.5 + i * 0.85 + (rand() - 0.5) * 0.35;
    // Leave clear central view right behind the launch apron flame trench
    if (Math.abs(ox) < 1.65) continue;
    const r = rand();
    const species: TreeSpecies =
      r < 0.55 ? 'casuarina' : r < 0.78 ? 'palmyra' : r < 0.92 ? 'coconut' : 'tdef';
    list.push({
      species,
      offsetX: ox,
      layer: 0,
      scale: 0.95 + rand() * 0.45,
      flipX: rand() > 0.5,
      phase: rand() * Math.PI * 2,
      lean: (rand() - 0.5) * 0.06,
    });
  }

  // Mid-ground coastal groves framing both flanks of the concrete apron
  const midOffsets = [
    -7.8, -6.5, -5.4, -4.3, -3.4, -2.55,
    2.45, 3.25, 4.15, 5.1, 6.2, 7.4,
  ];
  midOffsets.forEach((ox, idx) => {
    const species: TreeSpecies =
      idx % 4 === 0
        ? 'coconut'
        : idx % 4 === 1
          ? 'casuarina'
          : idx % 4 === 2
            ? 'tdef'
            : 'palmyra';
    list.push({
      species,
      offsetX: ox + (rand() - 0.5) * 0.25,
      layer: 1,
      scale: 1.25 + rand() * 0.42,
      flipX: ox > 0 ? rand() > 0.35 : rand() > 0.65,
      phase: rand() * Math.PI * 2,
      lean: (rand() - 0.5) * 0.08,
    });
  });

  // Foreground coastal palms & whispering pines on far flanks for rich parallax depth
  const nearOffsets = [-6.9, -4.8, -3.85, 3.7, 4.95, 6.5];
  nearOffsets.forEach((ox, idx) => {
    const species: TreeSpecies = idx % 2 === 0 ? 'coconut' : 'casuarina';
    list.push({
      species,
      offsetX: ox,
      layer: 2,
      scale: 1.55 + rand() * 0.35,
      flipX: idx % 2 === 1,
      phase: rand() * Math.PI * 2,
      lean: ox < 0 ? 0.04 : -0.05,
    });
  });

  // Sort back-to-front by layer
  list.sort((a, b) => a.layer - b.layer);
  cachedTrees = list;
  return list;
}

function getScrubTufts(): ScrubTuft[] {
  if (cachedScrub) return cachedScrub;
  const rand = mulberry32(909);
  const tufts: ScrubTuft[] = [];
  const shades = ['#253d28', '#314c2f', '#3d5a34', '#4e6338'];
  for (let i = 0; i < 36; i++) {
    const ox = -9.5 + (i / 35) * 19.0 + (rand() - 0.5) * 0.4;
    if (Math.abs(ox) < 1.85) continue;
    tufts.push({
      offsetX: ox,
      offsetY: (rand() - 0.3) * 0.18,
      width: 0.35 + rand() * 0.45,
      height: 0.14 + rand() * 0.16,
      shade: shades[i % shades.length],
    });
  }
  cachedScrub = tufts;
  return tufts;
}

/** Computes vertical drop of the ground plane during Step 04 liftoff & Stage 01 climb */
export function getLaunchPadDropPx(sp: number, h: number): number {
  if (sp < 0.170) return 0;
  const climb = smoothstep(0.170, 0.275, sp);
  return Math.pow(climb, 1.35) * h * 1.15;
}

export function renderSriharikotaTerrain(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, t, mouseX, vehicleAnchorX, groundY, unit, reducedMotion } = frame;

  // Unmount terrain smoothly once rocket is well above the launchpad
  if (sp > 0.275) return;

  const dropPx = getLaunchPadDropPx(sp, h);
  const horizonY = groundY + dropPx - unit * 0.32;
  const apronY = groundY + dropPx;

  if (horizonY > h + unit * 3) return;

  const sprites = getFloraSprites();
  const trees = getTreePlacements();
  const scrub = getScrubTufts();

  ctx.save();

  // 1. EASTERN BAY OF BENGAL COASTAL SEA HORIZON (Right half, shimmering in sunrise)
  const seaTop = horizonY - unit * 0.12;
  const seaH = unit * 0.48;
  const seaGrad = ctx.createLinearGradient(0, seaTop, 0, seaTop + seaH);
  seaGrad.addColorStop(0, '#365570');
  seaGrad.addColorStop(0.55, '#243c52');
  seaGrad.addColorStop(1, '#1a2c3d');
  ctx.fillStyle = seaGrad;
  ctx.fillRect(0, seaTop, w, seaH);

  // Subtle golden sunrise specular water ripples on the Bay of Bengal (east side)
  const shimmerX = w * 0.85 - mouseX * 10;
  for (let r = 0; r < 7; r++) {
    const ry = seaTop + 4 + r * (seaH * 0.11);
    const rw = (28 + r * 14) * (0.85 + 0.15 * Math.sin(t * 2.4 + r * 1.3));
    ctx.fillStyle = `rgba(255, 224, 160, ${0.32 - r * 0.035})`;
    ctx.fillRect(shimmerX - rw * 0.5, ry, rw, 1.6);
  }

  // 2. DISTANT SRIHARIKOTA BARRIER ISLAND RIDGE & COASTAL SAND SPIT
  const landGrad = ctx.createLinearGradient(0, horizonY, 0, h);
  landGrad.addColorStop(0.0, '#49583d'); // Coastal scrubland horizon
  landGrad.addColorStop(0.16, '#5c6648'); // Sandy coastal loam
  landGrad.addColorStop(0.38, '#3f4a3c'); // Deeper foreground scrub
  landGrad.addColorStop(1.0, '#19212a'); // Ground base shadow
  ctx.fillStyle = landGrad;
  ctx.beginPath();
  ctx.moveTo(0, horizonY + unit * 0.05);
  ctx.quadraticCurveTo(w * 0.25, horizonY - unit * 0.14, w * 0.52, horizonY - unit * 0.02);
  ctx.quadraticCurveTo(w * 0.76, horizonY + unit * 0.06, w, horizonY + unit * 0.14);
  ctx.lineTo(w, h + 10);
  ctx.lineTo(0, h + 10);
  ctx.closePath();
  ctx.fill();

  // Pale sandy coastal dune bank along the eastern shoreline
  ctx.fillStyle = 'rgba(196, 178, 146, 0.24)';
  ctx.beginPath();
  ctx.moveTo(vehicleAnchorX + unit * 1.5, horizonY + unit * 0.06);
  ctx.quadraticCurveTo(w * 0.82, horizonY + unit * 0.02, w, horizonY + unit * 0.16);
  ctx.lineTo(w, horizonY + unit * 0.34);
  ctx.lineTo(vehicleAnchorX + unit * 1.5, horizonY + unit * 0.24);
  ctx.closePath();
  ctx.fill();

  // 3. LAYER 0 FAR HORIZON TREE WINDBREAK (behind coastal mist)
  drawTreeLayer(ctx, trees, 0, sprites, vehicleAnchorX, horizonY + unit * 0.12, unit, t, mouseX, reducedMotion, 0.78);

  // 4. LOW MORNING COASTAL MIST BAND DRIFTING OVER THE TREELINE
  const mistDrift = reducedMotion ? 0 : Math.sin(t * 0.22) * unit * 0.35;
  const mistGrad = ctx.createLinearGradient(0, horizonY - unit * 0.15, 0, apronY + unit * 0.22);
  mistGrad.addColorStop(0, 'rgba(255, 232, 204, 0)');
  mistGrad.addColorStop(0.45, 'rgba(226, 236, 245, 0.16)');
  mistGrad.addColorStop(1, 'rgba(226, 236, 245, 0)');
  ctx.fillStyle = mistGrad;
  ctx.fillRect(mistDrift - w * 0.1, horizonY - unit * 0.15, w * 1.2, unit * 0.7);

  // 5. PAVED CONCRETE LAUNCH APRON (Perspective elliptical pad with radial joints & blast soot)
  const apronCx = vehicleAnchorX - mouseX * 14;
  const apronRx = unit * 2.85;
  const apronRy = unit * 0.42;

  const apronGrad = ctx.createRadialGradient(
    apronCx,
    apronY + unit * 0.04,
    unit * 0.1,
    apronCx,
    apronY + unit * 0.04,
    apronRx
  );
  apronGrad.addColorStop(0.0, '#64748b');
  apronGrad.addColorStop(0.68, '#475569');
  apronGrad.addColorStop(0.92, '#334155');
  apronGrad.addColorStop(1.0, 'rgba(51, 65, 85, 0)');
  ctx.fillStyle = apronGrad;
  ctx.beginPath();
  ctx.ellipse(apronCx, apronY + unit * 0.06, apronRx, apronRy, 0, 0, Math.PI * 2);
  ctx.fill();

  // Subtle concrete expansion joint lines & bilateral flame-trench soot streaks
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(apronCx, apronY + unit * 0.06, apronRx * 0.62, apronRy * 0.62, 0, 0, Math.PI * 2);
  ctx.stroke();

  const sootGrad = ctx.createLinearGradient(apronCx - apronRx, apronY, apronCx + apronRx, apronY);
  sootGrad.addColorStop(0.0, 'rgba(15, 23, 42, 0)');
  sootGrad.addColorStop(0.28, 'rgba(15, 23, 42, 0.42)');
  sootGrad.addColorStop(0.50, 'rgba(15, 23, 42, 0.18)');
  sootGrad.addColorStop(0.72, 'rgba(15, 23, 42, 0.42)');
  sootGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = sootGrad;
  ctx.fillRect(apronCx - apronRx, apronY - unit * 0.05, apronRx * 2, unit * 0.22);

  // 6. MID-GROUND & FOREGROUND SRIHARIKOTA PALM/PINE GROVES + COASTAL DUNE SCRUB
  drawTreeLayer(ctx, trees, 1, sprites, vehicleAnchorX, apronY + unit * 0.08, unit, t, mouseX, reducedMotion, 0.94);

  // Coastal sea-grass & dune scrub clumps anchoring tree bases
  for (let i = 0; i < scrub.length; i++) {
    const sc = scrub[i];
    const sx = vehicleAnchorX + sc.offsetX * unit - mouseX * 16;
    const sy = apronY + unit * 0.10 + sc.offsetY * unit;
    ctx.fillStyle = sc.shade;
    ctx.beginPath();
    ctx.ellipse(sx, sy, sc.width * unit * 0.5, sc.height * unit * 0.5, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  }

  drawTreeLayer(ctx, trees, 2, sprites, vehicleAnchorX, apronY + unit * 0.24, unit, t, mouseX, reducedMotion, 1.0);

  ctx.restore();
}

function drawTreeLayer(
  ctx: CanvasRenderingContext2D,
  trees: TreePlacement[],
  layer: 0 | 1 | 2,
  sprites: FloraSpriteCache,
  anchorX: number,
  baseY: number,
  unit: number,
  t: number,
  mouseX: number,
  reducedMotion: boolean,
  alpha: number
): void {
  const parallax = layer === 0 ? 6 : layer === 1 ? 12 : 20;
  ctx.globalAlpha = alpha;

  for (let i = 0; i < trees.length; i++) {
    const tr = trees[i];
    if (tr.layer !== layer) continue;

    const img = sprites[tr.species];
    const drawH = tr.scale * unit * 1.15;
    const drawW = drawH * (img.width / img.height);
    const tx = anchorX + tr.offsetX * unit - mouseX * parallax;
    const ty = baseY;

    // Gentle coastal sea-breeze sway pivoted cleanly at the tree's root base
    const sway = reducedMotion
      ? tr.lean
      : tr.lean + Math.sin(t * 1.25 + tr.phase) * 0.022;

    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(sway);
    if (tr.flipX) ctx.scale(-1, 1);
    ctx.drawImage(img, -drawW * 0.5, -drawH, drawW, drawH);
    ctx.restore();
  }

  ctx.globalAlpha = 1;
}
