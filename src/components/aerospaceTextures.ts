import * as THREE from 'three';

let cachedSolarPanelTexture: THREE.CanvasTexture | null = null;
let cachedGoldMliTexture: THREE.CanvasTexture | null = null;
let cachedCarbonBackingTexture: THREE.CanvasTexture | null = null;

/**
 * High-fidelity procedural Photovoltaic Solar Cell Array Texture
 * Features:
 * - Deep space photovoltaic indigo-blue anti-reflective silicon cells
 * - Monocrystalline pseudo-square chamfered wafer geometry
 * - Fine horizontal silver conductive contact fingers
 * - Dual vertical metallic gold busbars with solder interconnections
 * - Carbon-composite titanium structural perimeter frame
 */
export function getCachedSolarPanelTexture(): THREE.CanvasTexture {
  if (cachedSolarPanelTexture) return cachedSolarPanelTexture;

  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Dark titanium substrate & structural frame
  ctx.fillStyle = '#060d17';
  ctx.fillRect(0, 0, width, height);

  // Outer frame bevel
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, width - 8, height - 8);

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // 2. Solar Cell Grid parameters
  const cols = 8;
  const rows = 4;
  const marginX = 18;
  const marginY = 18;
  const cellGap = 6;

  const totalGapX = (cols - 1) * cellGap;
  const totalGapY = (rows - 1) * cellGap;
  const cellW = (width - marginX * 2 - totalGapX) / cols;
  const cellH = (height - marginY * 2 - totalGapY) / rows;
  const chamfer = 7; // pseudo-square corner chamfer

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = marginX + c * (cellW + cellGap);
      const y = marginY + r * (cellH + cellGap);

      // Deep silicon wafer background with high contrast vibrant photovoltaic gradient
      const cellGrad = ctx.createLinearGradient(x, y, x + cellW, y + cellH);
      cellGrad.addColorStop(0, '#1e40af'); // Vibrant royal blue
      cellGrad.addColorStop(0.4, '#1d4ed8'); // Bright photovoltaic silicon
      cellGrad.addColorStop(1, '#0f2757'); // Deep anti-reflective base
      ctx.fillStyle = cellGrad;

      // Draw pseudo-square monocrystalline wafer (chamfered 45 deg corners)
      ctx.beginPath();
      ctx.moveTo(x + chamfer, y);
      ctx.lineTo(x + cellW - chamfer, y);
      ctx.lineTo(x + cellW, y + chamfer);
      ctx.lineTo(x + cellW, y + cellH - chamfer);
      ctx.lineTo(x + cellW - chamfer, y + cellH);
      ctx.lineTo(x + chamfer, y + cellH);
      ctx.lineTo(x, y + cellH - chamfer);
      ctx.lineTo(x, y + chamfer);
      ctx.closePath();
      ctx.fill();

      // Wafer border highlight
      ctx.strokeStyle = '#60a5fa'; // Bright cyan-blue edge
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Ultra-fine horizontal silver contact fingers (10 prominent fingers per cell)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.5;
      const numFingers = 10;
      const fingerStep = cellH / (numFingers + 1);
      ctx.beginPath();
      for (let f = 1; f <= numFingers; f++) {
        const fy = y + f * fingerStep;
        ctx.moveTo(x + 3, fy);
        ctx.lineTo(x + cellW - 3, fy);
      }
      ctx.stroke();

      // Dual vertical metallic gold collector busbars
      const busbar1X = x + cellW * 0.33;
      const busbar2X = x + cellW * 0.67;

      // Gold busbars
      ctx.fillStyle = '#f59e0b'; // Deep rich gold
      ctx.fillRect(busbar1X - 2.5, y + 1, 5, cellH - 2);
      ctx.fillRect(busbar2X - 2.5, y + 1, 5, cellH - 2);

      // Busbar specular bright core line
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(busbar1X - 1, y + 1, 2, cellH - 2);
      ctx.fillRect(busbar2X - 1, y + 1, 2, cellH - 2);

      // Solder connection pads at top and bottom
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(busbar1X, y + 5, 4.5, 0, Math.PI * 2);
      ctx.arc(busbar1X, y + cellH - 5, 4.5, 0, Math.PI * 2);
      ctx.arc(busbar2X, y + 5, 4.5, 0, Math.PI * 2);
      ctx.arc(busbar2X, y + cellH - 5, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(busbar1X, y + 5, 1.8, 0, Math.PI * 2);
      ctx.arc(busbar1X, y + cellH - 5, 1.8, 0, Math.PI * 2);
      ctx.arc(busbar2X, y + 5, 1.8, 0, Math.PI * 2);
      ctx.arc(busbar2X, y + cellH - 5, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Segment division line down the center with mechanical hinge brackets
  const midX = width / 2;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(midX - 4, 10, 8, height - 20);

  // Metallic hinge pins
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(midX - 3, 60, 6, 28);
  ctx.fillRect(midX - 3, height - 88, 6, 28);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(midX - 1, 64, 2, 20);
  ctx.fillRect(midX - 1, height - 84, 2, 20);

  // Gold grounding edge traces
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(14, 14, width - 28, height - 28);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;

  cachedSolarPanelTexture = texture;
  return cachedSolarPanelTexture;
}

/**
 * Procedural Crinkled Gold MLI Thermal Foil Texture (Chandrayaan / Mangalyaan aesthetic)
 */
export function getCachedGoldMliTexture(): THREE.CanvasTexture {
  if (cachedGoldMliTexture) return cachedGoldMliTexture;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base metallic amber/gold
  const baseGrad = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size);
  baseGrad.addColorStop(0, '#f59e0b');
  baseGrad.addColorStop(0.6, '#d97706');
  baseGrad.addColorStop(1, '#92400e');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  // Quilted thermal blanket seams (8x8 grid of hand-stitched foil pads)
  const pads = 8;
  const padSize = size / pads;

  for (let r = 0; r < pads; r++) {
    for (let c = 0; c < pads; c++) {
      const px = c * padSize;
      const py = r * padSize;

      // Slight individual pad shading variation
      const padBright = ((r * 7 + c * 11) % 5) - 2;
      ctx.fillStyle = `rgba(251, 191, 36, ${0.12 + padBright * 0.04})`;
      ctx.fillRect(px + 2, py + 2, padSize - 4, padSize - 4);

      // Crinkle / crease lines across foil
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 4, py + padSize * 0.4);
      ctx.lineTo(px + padSize * 0.6, py + 6);
      ctx.lineTo(px + padSize - 6, py + padSize * 0.7);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(120, 53, 15, 0.45)';
      ctx.beginPath();
      ctx.moveTo(px + padSize * 0.3, py + padSize - 4);
      ctx.lineTo(px + padSize * 0.7, py + padSize * 0.4);
      ctx.stroke();
    }
  }

  // Thermal tape seam lines
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 3;
  for (let i = 0; i <= pads; i++) {
    const pos = i * padSize;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, size);
    ctx.moveTo(0, pos);
    ctx.lineTo(size, pos);
    ctx.stroke();
  }

  // Silver grounding rivets at blanket junctions
  ctx.fillStyle = '#e2e8f0';
  for (let r = 0; r <= pads; r++) {
    for (let c = 0; c <= pads; c++) {
      ctx.beginPath();
      ctx.arc(c * padSize, r * padSize, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;

  cachedGoldMliTexture = texture;
  return cachedGoldMliTexture;
}

let cachedGoldMliBumpMap: THREE.CanvasTexture | null = null;
export function getCachedGoldMliBumpMap(): THREE.CanvasTexture {
  if (cachedGoldMliBumpMap) return cachedGoldMliBumpMap;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const pads = 8;
  const padSize = size / pads;

  for (let r = 0; r < pads; r++) {
    for (let c = 0; c < pads; c++) {
      const px = c * padSize;
      const py = r * padSize;

      // Pillow convexity bump in each quilted pad
      const rad = padSize / 2;
      const g = ctx.createRadialGradient(px + rad, py + rad, 0, px + rad, py + rad, rad);
      g.addColorStop(0.0, '#b8b8b8');
      g.addColorStop(0.7, '#949494');
      g.addColorStop(1.0, '#555555');
      ctx.fillStyle = g;
      ctx.fillRect(px + 2, py + 2, padSize - 4, padSize - 4);

      // Crinkle ridge cuts
      ctx.strokeStyle = '#d4d4d4';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px + 4, py + padSize * 0.4);
      ctx.lineTo(px + padSize * 0.6, py + 6);
      ctx.lineTo(px + padSize - 6, py + padSize * 0.7);
      ctx.stroke();

      ctx.strokeStyle = '#383838';
      ctx.beginPath();
      ctx.moveTo(px + padSize * 0.3, py + padSize - 4);
      ctx.lineTo(px + padSize * 0.7, py + padSize * 0.4);
      ctx.stroke();
    }
  }

  // Depressed seam lines
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 3;
  for (let i = 0; i <= pads; i++) {
    const pos = i * padSize;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, size);
    ctx.moveTo(0, pos);
    ctx.lineTo(size, pos);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;

  cachedGoldMliBumpMap = texture;
  return cachedGoldMliBumpMap;
}

/**
 * Procedural Carbon-Composite Honeycomb backing for solar panels
 */
export function getCachedCarbonBackingTexture(): THREE.CanvasTexture {
  if (cachedCarbonBackingTexture) return cachedCarbonBackingTexture;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, size, size);

  // Carbon weave honeycomb
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
  ctx.lineWidth = 1;
  const step = 8;
  for (let x = 0; x < size; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + size, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - size, size);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 2);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;

  cachedCarbonBackingTexture = texture;
  return cachedCarbonBackingTexture;
}

// ============================================================================
// CHANDRAYAAN-3 & LVM3 DECALS & AUTHENTIC MARKINGS
// High-resolution procedural textures for SDSC SHAR / ISRO Launch Vehicle
// ============================================================================

let cachedGenericBoosterTexture: THREE.CanvasTexture | null = null;
let cachedGenericFairingTexture: THREE.CanvasTexture | null = null;
let cachedRocketBumpMap: THREE.CanvasTexture | null = null;

export function getCachedRocketBumpMap(): THREE.CanvasTexture {
  if (cachedRocketBumpMap) return cachedRocketBumpMap;

  const width = 512;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#505050';
  ctx.lineWidth = 3;
  [120, 280, 480, 680, 880].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    ctx.fillStyle = '#a0a0a0';
    for (let x = 12; x < width; x += 24) {
      ctx.beginPath();
      ctx.arc(x, y - 6, 2, 0, Math.PI * 2);
      ctx.arc(x, y + 6, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  cachedRocketBumpMap = new THREE.CanvasTexture(canvas);
  cachedRocketBumpMap.generateMipmaps = true;
  return cachedRocketBumpMap;
}

export function getCachedGenericBoosterTexture(): THREE.CanvasTexture {
  if (cachedGenericBoosterTexture) return cachedGenericBoosterTexture;

  const width = 512;
  const height = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const baseGrad = ctx.createLinearGradient(0, 0, width, 0);
  baseGrad.addColorStop(0.0, '#e8ecf1');
  baseGrad.addColorStop(0.2, '#f8fafc');
  baseGrad.addColorStop(0.8, '#f1f5f9');
  baseGrad.addColorStop(1.0, '#e2e8f0');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(203, 213, 225, 0.12)';
  for (let x = 0; x < width; x += 48) {
    ctx.fillRect(x, 0, 24, height);
  }

  const jointYs = [340, 720, 1100, 1480, 1850];
  jointYs.forEach((jy) => {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, jy - 10, width, 20);
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, jy - 4, width, 8);

    ctx.fillStyle = '#e2e8f0';
    for (let bx = 12; bx < width; bx += 24) {
      ctx.beginPath();
      ctx.arc(bx, jy - 14, 3, 0, Math.PI * 2);
      ctx.arc(bx, jy + 14, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  const accessDoors = [
    { y: 520, w: 72, h: 96 },
    { y: 1280, w: 84, h: 110 },
  ];
  accessDoors.forEach((door) => {
    const dx = (width - door.w) / 2;
    ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
    ctx.fillRect(dx, door.y, door.w, door.h);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(dx, door.y, door.w, door.h);
  });

  const frostGrad = ctx.createLinearGradient(0, 850, 0, 1050);
  frostGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
  frostGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.45)');
  frostGrad.addColorStop(0.7, 'rgba(240, 249, 255, 0.40)');
  frostGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = frostGrad;
  ctx.fillRect(0, 850, width, 200);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  cachedGenericBoosterTexture = texture;
  return cachedGenericBoosterTexture;
}

export function getCachedGenericFairingTexture(): THREE.CanvasTexture {
  if (cachedGenericFairingTexture) return cachedGenericFairingTexture;

  const width = 1024;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(203, 213, 225, 0.35)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  cachedGenericFairingTexture = texture;
  return cachedGenericFairingTexture;
}

let cachedIsroBoosterTexture: THREE.CanvasTexture | null = null;
let cachedIndiaBoosterTexture: THREE.CanvasTexture | null = null;
let cachedChandrayaanFairingTexture: THREE.CanvasTexture | null = null;

/**
 * High-resolution Procedural Left S200 Booster Texture with vertical 'इसरो' and 'ISRO'
 * Authentic ISRO Livery:
 * - Pure aerospace white polyurethane booster finish
 * - Distinctive ISRO Safety Orange vertical central guide band
 * - Black segment joint ring stiffeners with fastener rivets
 * - High-contrast bilingual markings: Hindi Devanagari 'इसरो' and Latin 'ISRO'
 */
export function getCachedIsroBoosterTexture(): THREE.CanvasTexture {
  void _unusedOldIsro;
  return getCachedGenericBoosterTexture();
}

function _unusedOldIsro() {

  const width = 512;
  const height = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Pure aerospace white finish
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // Subtle metallic panel shading & segment texture
  const panelGrad = ctx.createLinearGradient(0, 0, width, 0);
  panelGrad.addColorStop(0.0, 'rgba(226, 232, 240, 0.35)');
  panelGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
  panelGrad.addColorStop(1.0, 'rgba(203, 213, 225, 0.35)');
  ctx.fillStyle = panelGrad;
  ctx.fillRect(0, 0, width, height);

  // Slim, elegant ISRO Safety Orange vertical stripe down center
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(width / 2 - 18, 0, 36, height);

  // Segment demarcation joint rings
  const jointYs = [340, 1850];
  jointYs.forEach((jy) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, jy - 8, width, 16);
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, jy - 3, width, 6);

    ctx.fillStyle = '#cbd5e1';
    for (let bx = 16; bx < width; bx += 32) {
      ctx.beginPath();
      ctx.arc(bx, jy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // SLIM, COMPACT VERTICAL WHITE LABEL PANEL (Narrowed horizontally)
  const panelW = 135;
  const panelY = 410;
  const panelH = 1360;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect((width - panelW) / 2, panelY, panelW, panelH);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  ctx.strokeRect((width - panelW) / 2, panelY, panelW, panelH);

  // Inner orange accent frame
  ctx.strokeStyle = '#ea580c';
  ctx.lineWidth = 2;
  ctx.strokeRect((width - panelW) / 2 + 4, panelY + 4, panelW - 8, panelH - 8);

  // Top Indian Tricolor Header Bar
  const triY = panelY + 14;
  const triW = panelW - 16;
  const triX = (width - triW) / 2;
  const triH = 22;
  ctx.fillStyle = '#ff9933';
  ctx.fillRect(triX, triY, triW, triH / 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(triX, triY + triH / 3, triW, triH / 3);
  ctx.fillStyle = '#138808';
  ctx.fillRect(triX, triY + (triH * 2) / 3, triW, triH / 3);

  // VERTICAL LATIN 'ISRO' (TALL & SLENDER CONDENSED TYPOGRAPHY)
  ctx.save();
  // Horizontally condensed letters (scale X by 0.72)
  ctx.scale(0.72, 1.0);
  const scaledCenterX = (width / 2) / 0.72;

  ctx.fillStyle = '#050814';
  ctx.font = '900 185px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const engLetters = ['I', 'S', 'R', 'O'];
  const startY = panelY + 195;
  const stepY = 285;
  engLetters.forEach((char, idx) => {
    ctx.fillText(char, scaledCenterX, startY + idx * stepY);
  });
  ctx.restore();

  // Bottom Indian Tricolor Ribbon
  const bTriY = panelY + panelH - 36;
  ctx.fillStyle = '#ff9933';
  ctx.fillRect(triX, bTriY, triW, triH / 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(triX, bTriY + triH / 3, triW, triH / 3);
  ctx.fillStyle = '#138808';
  ctx.fillRect(triX, bTriY + (triH * 2) / 3, triW, triH / 3);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  cachedIsroBoosterTexture = texture;
  return cachedIsroBoosterTexture;
}

export function getCachedIndiaBoosterTexture(): THREE.CanvasTexture {
  void _unusedOldIndia;
  return getCachedGenericBoosterTexture();
}

function _unusedOldIndia() {

  const width = 512;
  const height = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Pure aerospace white finish
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // Subtle metallic panel shading & segment texture
  const panelGrad = ctx.createLinearGradient(0, 0, width, 0);
  panelGrad.addColorStop(0.0, 'rgba(226, 232, 240, 0.35)');
  panelGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
  panelGrad.addColorStop(1.0, 'rgba(203, 213, 225, 0.35)');
  ctx.fillStyle = panelGrad;
  ctx.fillRect(0, 0, width, height);

  // Slim, elegant ISRO Safety Orange vertical stripe down center
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(width / 2 - 18, 0, 36, height);

  // Segment demarcation joint rings
  const jointYs = [340, 1850];
  jointYs.forEach((jy) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, jy - 8, width, 16);
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, jy - 3, width, 6);

    ctx.fillStyle = '#cbd5e1';
    for (let bx = 16; bx < width; bx += 32) {
      ctx.beginPath();
      ctx.arc(bx, jy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // SLIM, COMPACT VERTICAL WHITE LABEL PANEL (Narrowed horizontally)
  const panelW = 135;
  const panelY = 410;
  const panelH = 1360;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect((width - panelW) / 2, panelY, panelW, panelH);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  ctx.strokeRect((width - panelW) / 2, panelY, panelW, panelH);

  // Inner orange accent frame
  ctx.strokeStyle = '#ea580c';
  ctx.lineWidth = 2;
  ctx.strokeRect((width - panelW) / 2 + 4, panelY + 4, panelW - 8, panelH - 8);

  // Top Indian Tricolor Header Bar
  const triY = panelY + 14;
  const triW = panelW - 16;
  const triX = (width - triW) / 2;
  const triH = 22;
  ctx.fillStyle = '#ff9933';
  ctx.fillRect(triX, triY, triW, triH / 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(triX, triY + triH / 3, triW, triH / 3);
  ctx.fillStyle = '#138808';
  ctx.fillRect(triX, triY + (triH * 2) / 3, triW, triH / 3);

  // VERTICAL LATIN 'INDIA' (TALL & SLENDER CONDENSED TYPOGRAPHY)
  ctx.save();
  ctx.scale(0.72, 1.0);
  const scaledCenterX = (width / 2) / 0.72;

  ctx.fillStyle = '#050814';
  ctx.font = '900 160px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const engLetters = ['I', 'N', 'D', 'I', 'A'];
  const startY = panelY + 155;
  const stepY = 240;
  engLetters.forEach((char, idx) => {
    ctx.fillText(char, scaledCenterX, startY + idx * stepY);
  });
  ctx.restore();

  // Bottom Indian Tricolor Ribbon
  const bTriY = panelY + panelH - 36;
  ctx.fillStyle = '#ff9933';
  ctx.fillRect(triX, bTriY, triW, triH / 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(triX, bTriY + triH / 3, triW, triH / 3);
  ctx.fillStyle = '#138808';
  ctx.fillRect(triX, bTriY + (triH * 2) / 3, triW, triH / 3);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  cachedIndiaBoosterTexture = texture;
  return cachedIndiaBoosterTexture;
}

export function getCachedChandrayaanFairingTexture(): THREE.CanvasTexture {
  void _unusedOldFairing;
  return getCachedGenericFairingTexture();
}

function _unusedOldFairing() {

  const width = 1024;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Pure white base to blend seamlessly into rocket fairing
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // Horizontally compact Indian National Flag (Tiranga)
  const flagW = 340;
  const flagH = 210;
  const flagX = (width - flagW) / 2;
  const flagY = 120;
  const bandH = flagH / 3;

  // Saffron (Kesari)
  ctx.fillStyle = '#ff9933';
  ctx.fillRect(flagX, flagY, flagW, bandH);

  // White
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(flagX, flagY + bandH, flagW, bandH);

  // Green
  ctx.fillStyle = '#138808';
  ctx.fillRect(flagX, flagY + bandH * 2, flagW, bandH);

  // Flag Border
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.strokeRect(flagX, flagY, flagW, flagH);

  // Ashoka Chakra (Navy Blue 24-spoke wheel)
  const cx = flagX + flagW / 2;
  const cy = flagY + bandH * 1.5;
  const r = bandH * 0.44;

  ctx.strokeStyle = '#000080';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Central hub dot
  ctx.fillStyle = '#000080';
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 2.0;
  for (let i = 0; i < 24; i++) {
    const angle = (i * Math.PI) / 12;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    ctx.stroke();
  }

  // SLIM, PROPORTIONAL ENGLISH TYPOGRAPHY
  ctx.fillStyle = '#050814';
  ctx.font = '900 58px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CHANDRAYAAN - 3', width / 2, flagY + flagH + 95);

  // Vehicle & Agency designation
  ctx.font = '900 48px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText('LVM3 - M4', width / 2, flagY + flagH + 175);

  ctx.font = '900 44px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#ea580c';
  ctx.fillText('ISRO', width / 2, flagY + flagH + 250);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  cachedChandrayaanFairingTexture = texture;
  return cachedChandrayaanFairingTexture;
}
