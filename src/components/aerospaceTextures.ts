import * as THREE from 'three';

let cachedSolarPanelTexture: THREE.CanvasTexture | null = null;
let cachedGoldMliTexture: THREE.CanvasTexture | null = null;
let cachedGoldMliBumpMap: THREE.CanvasTexture | null = null;
let cachedCarbonBackingTexture: THREE.CanvasTexture | null = null;
let cachedGenericBoosterTexture: THREE.CanvasTexture | null = null;
let cachedGenericFairingTexture: THREE.CanvasTexture | null = null;
let cachedGenericCoreTexture: THREE.CanvasTexture | null = null;
let cachedRocketBumpMap: THREE.CanvasTexture | null = null;

/**
 * Lightweight procedural Photovoltaic Solar Cell Array Texture
 */
export function getCachedSolarPanelTexture(): THREE.CanvasTexture {
  if (cachedSolarPanelTexture) return cachedSolarPanelTexture;

  const width = 256;
  const height = 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#060d17';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  const cols = 8;
  const rows = 4;
  const marginX = 9;
  const marginY = 9;
  const cellGap = 3;

  const totalGapX = (cols - 1) * cellGap;
  const totalGapY = (rows - 1) * cellGap;
  const cellW = (width - marginX * 2 - totalGapX) / cols;
  const cellH = (height - marginY * 2 - totalGapY) / rows;
  const chamfer = 3;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = marginX + c * (cellW + cellGap);
      const y = marginY + r * (cellH + cellGap);

      const cellGrad = ctx.createLinearGradient(x, y, x + cellW, y + cellH);
      cellGrad.addColorStop(0, '#1e40af');
      cellGrad.addColorStop(0.4, '#1d4ed8');
      cellGrad.addColorStop(1, '#0f2757');
      ctx.fillStyle = cellGrad;

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

      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.0;
      const numFingers = 5;
      const fingerStep = cellH / (numFingers + 1);
      ctx.beginPath();
      for (let f = 1; f <= numFingers; f++) {
        const fy = y + f * fingerStep;
        ctx.moveTo(x + 2, fy);
        ctx.lineTo(x + cellW - 2, fy);
      }
      ctx.stroke();

      const busbar1X = x + cellW * 0.33;
      const busbar2X = x + cellW * 0.67;

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(busbar1X - 1.2, y + 1, 2.4, cellH - 2);
      ctx.fillRect(busbar2X - 1.2, y + 1, 2.4, cellH - 2);
    }
  }

  const midX = width / 2;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(midX - 2, 6, 4, height - 12);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;

  cachedSolarPanelTexture = texture;
  return cachedSolarPanelTexture;
}

/**
 * Lightweight Procedural Crinkled Gold MLI Thermal Foil Texture
 */
export function getCachedGoldMliTexture(): THREE.CanvasTexture {
  if (cachedGoldMliTexture) return cachedGoldMliTexture;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const baseGrad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size);
  baseGrad.addColorStop(0, '#f59e0b');
  baseGrad.addColorStop(0.6, '#d97706');
  baseGrad.addColorStop(1, '#92400e');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  const pads = 8;
  const padSize = size / pads;

  for (let r = 0; r < pads; r++) {
    for (let c = 0; c < pads; c++) {
      const px = c * padSize;
      const py = r * padSize;
      const rad = padSize / 2;
      const g = ctx.createRadialGradient(px + rad, py + rad, 0, px + rad, py + rad, rad);
      g.addColorStop(0.0, 'rgba(254, 240, 138, 0.65)');
      g.addColorStop(0.6, 'rgba(245, 158, 11, 0.45)');
      g.addColorStop(1.0, 'rgba(180, 83, 9, 0.7)');
      ctx.fillStyle = g;
      ctx.fillRect(px + 1, py + 1, padSize - 2, padSize - 2);

      ctx.strokeStyle = 'rgba(255, 255, 220, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 2, py + padSize * 0.4);
      ctx.lineTo(px + padSize * 0.6, py + 3);
      ctx.lineTo(px + padSize - 3, py + padSize * 0.7);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.5;
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

  cachedGoldMliTexture = texture;
  return cachedGoldMliTexture;
}

export function getCachedGoldMliBumpMap(): THREE.CanvasTexture {
  if (cachedGoldMliBumpMap) return cachedGoldMliBumpMap;

  const size = 256;
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
      const rad = padSize / 2;
      const g = ctx.createRadialGradient(px + rad, py + rad, 0, px + rad, py + rad, rad);
      g.addColorStop(0.0, '#b8b8b8');
      g.addColorStop(0.7, '#949494');
      g.addColorStop(1.0, '#555555');
      ctx.fillStyle = g;
      ctx.fillRect(px + 1, py + 1, padSize - 2, padSize - 2);
    }
  }

  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 1.5;
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

export function getCachedCarbonBackingTexture(): THREE.CanvasTexture {
  if (cachedCarbonBackingTexture) return cachedCarbonBackingTexture;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, size, size);

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
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;

  cachedCarbonBackingTexture = texture;
  return cachedCarbonBackingTexture;
}

export function getCachedRocketBumpMap(): THREE.CanvasTexture {
  if (cachedRocketBumpMap) return cachedRocketBumpMap;

  const width = 256;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#505050';
  ctx.lineWidth = 2;
  [60, 140, 240, 340, 440].map(y => y / 2).forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  });

  [64, 128, 192].forEach((x) => {
    ctx.strokeStyle = '#606060';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  });

  cachedRocketBumpMap = new THREE.CanvasTexture(canvas);
  cachedRocketBumpMap.generateMipmaps = false;
  cachedRocketBumpMap.minFilter = THREE.LinearFilter;
  return cachedRocketBumpMap;
}

export function getCachedGenericCoreTexture(): THREE.CanvasTexture {
  if (cachedGenericCoreTexture) return cachedGenericCoreTexture;

  const width = 256;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const baseGrad = ctx.createLinearGradient(0, 0, width, 0);
  baseGrad.addColorStop(0.0, '#eaeff5');
  baseGrad.addColorStop(0.18, '#f8fafc');
  baseGrad.addColorStop(0.82, '#f1f5f9');
  baseGrad.addColorStop(1.0, '#e2e8f0');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(203, 213, 225, 0.14)';
  for (let x = 0; x < width; x += 32) {
    ctx.fillRect(x, 0, 16, height);
  }

  const jointYs = [140, 310, 490, 670, 860];
  jointYs.forEach((jy) => {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, jy - 4, width, 8);
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, jy - 2, width, 4);

    ctx.fillStyle = '#cbd5e1';
    for (let bx = 6; bx < width; bx += 12) {
      ctx.beginPath();
      ctx.arc(bx, jy - 6, 1.5, 0, Math.PI * 2);
      ctx.arc(bx, jy + 6, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  const frostGrad = ctx.createLinearGradient(0, 210, 0, 390);
  frostGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
  frostGrad.addColorStop(0.2, 'rgba(240, 249, 255, 0.55)');
  frostGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.70)');
  frostGrad.addColorStop(0.8, 'rgba(235, 248, 255, 0.50)');
  frostGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = frostGrad;
  ctx.fillRect(0, 210, width, 180);

  ctx.fillStyle = 'rgba(224, 242, 254, 0.22)';
  for (let sx = 10; sx < width; sx += 18) {
    const sw = 2 + (sx % 3);
    const sh = 90 + (sx % 45);
    ctx.fillRect(sx, 370, sw, sh);
  }

  const panels = [
    { y: 160, w: 40, h: 50 },
    { y: 550, w: 45, h: 60 },
    { y: 750, w: 38, h: 45 },
  ];
  panels.forEach((p) => {
    const px = (width - p.w) / 2;
    ctx.fillStyle = 'rgba(226, 232, 240, 0.95)';
    ctx.fillRect(px, p.y, p.w, p.h);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px, p.y, p.w, p.h);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  cachedGenericCoreTexture = texture;
  return cachedGenericCoreTexture;
}

export function getCachedGenericBoosterTexture(): THREE.CanvasTexture {
  if (cachedGenericBoosterTexture) return cachedGenericBoosterTexture;

  const width = 256;
  const height = 1024;
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
  for (let x = 0; x < width; x += 24) {
    ctx.fillRect(x, 0, 12, height);
  }

  const jointYs = [170, 360, 550, 740, 925];
  jointYs.forEach((jy) => {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, jy - 5, width, 10);
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, jy - 2, width, 4);

    ctx.fillStyle = '#e2e8f0';
    for (let bx = 6; bx < width; bx += 12) {
      ctx.beginPath();
      ctx.arc(bx, jy - 7, 1.5, 0, Math.PI * 2);
      ctx.arc(bx, jy + 7, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  const accessDoors = [
    { y: 260, w: 36, h: 48 },
    { y: 640, w: 42, h: 55 },
  ];
  accessDoors.forEach((door) => {
    const dx = (width - door.w) / 2;
    ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
    ctx.fillRect(dx, door.y, door.w, door.h);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(dx, door.y, door.w, door.h);
  });

  const frostGrad = ctx.createLinearGradient(0, 425, 0, 525);
  frostGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
  frostGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.45)');
  frostGrad.addColorStop(0.7, 'rgba(240, 249, 255, 0.40)');
  frostGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = frostGrad;
  ctx.fillRect(0, 425, width, 100);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  cachedGenericBoosterTexture = texture;
  return cachedGenericBoosterTexture;
}

export function getCachedGenericFairingTexture(): THREE.CanvasTexture {
  if (cachedGenericFairingTexture) return cachedGenericFairingTexture;

  const width = 256;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(203, 213, 225, 0.35)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
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

export function getCachedIsroBoosterTexture(): THREE.CanvasTexture {
  return getCachedGenericBoosterTexture();
}

export function getCachedIndiaBoosterTexture(): THREE.CanvasTexture {
  return getCachedGenericBoosterTexture();
}

export function getCachedChandrayaanFairingTexture(): THREE.CanvasTexture {
  return getCachedGenericFairingTexture();
}
