import * as THREE from 'three';

// Procedural 2D Value / Gradient Noise for high-fidelity planetary geography
function createNoise2D(seed = 42) {
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  let s = seed;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  function fade(t: number) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  function lerp(a: number, b: number, t: number) {
    return a + t * (b - a);
  }
  function grad(hash: number, x: number, y: number) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  return function (x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const aa = perm[perm[X] + Y];
    const ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y];
    const bb = perm[perm[X + 1] + Y + 1];
    return lerp(
      lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
      lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
      v
    );
  };
}

const noiseA = createNoise2D(1337);
const noiseB = createNoise2D(9876);
const noiseC = createNoise2D(54321);

export function fbm(x: number, y: number, octaves = 5, lacunarity = 2.0, gain = 0.5): number {
  let sum = 0;
  let freq = 1.0;
  let amp = 0.5;
  let max = 0;
  for (let i = 0; i < octaves; i++) {
    sum += noiseA(x * freq, y * freq) * amp;
    max += amp;
    freq *= lacunarity;
    amp *= gain;
  }
  return sum / max;
}

// Subdivides straight polygon points into realistic fractal coastline curves
function traceFractalCoastline(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  w: number,
  h: number,
  roughness = 0.007
) {
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const steps = 10;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const x = p1[0] + (p2[0] - p1[0]) * t;
      const y = p1[1] + (p2[1] - p1[1]) * t;

      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      const disp = (noiseB(x * 35, y * 35) + noiseC(x * 70, y * 70) * 0.5) * roughness;
      const fx = (x + nx * disp) * w;
      const fy = (y + ny * disp) * h;

      if (i === 0 && s === 0) ctx.moveTo(fx, fy);
      else ctx.lineTo(fx, fy);
    }
  }
  ctx.closePath();
}

// ============================================================================
// 1. PHOTOREALISTIC 3D EARTH TEXTURES (Day + Night Lights + Specular + Clouds)
// ============================================================================
export interface EarthTextures {
  dayTexture: THREE.CanvasTexture;
  nightTexture: THREE.CanvasTexture;
  specularTexture: THREE.CanvasTexture;
  cloudTexture: THREE.CanvasTexture;
}

let cachedEarthTextures: EarthTextures | null = null;

export function getPhotorealisticEarthTextures(): EarthTextures {
  if (cachedEarthTextures) return cachedEarthTextures;

  const width = 512;
  const height = 256;

  // 1. Day Surface Canvas (Oceans, Bathymetry, Fractal Continents, Biomes, Himalayas)
  const dayCanvas = document.createElement('canvas');
  dayCanvas.width = width;
  dayCanvas.height = height;
  const dctx = dayCanvas.getContext('2d')!;

  // 2. Night Lights Canvas (Sodium-gold city clusters on the dark side of Earth)
  const nightCanvas = document.createElement('canvas');
  nightCanvas.width = width;
  nightCanvas.height = height;
  const nctx = nightCanvas.getContext('2d')!;

  // 3. Specular Canvas (Ocean reflects sunlight with mirror gloss; land is matte)
  const specCanvas = document.createElement('canvas');
  specCanvas.width = width;
  specCanvas.height = height;
  const sctx = specCanvas.getContext('2d')!;

  // 4. Cloud Canvas (Swirling storm systems, cyclonic arms, trade wind bands)
  const cloudCanvas = document.createElement('canvas');
  cloudCanvas.width = width;
  cloudCanvas.height = height;
  const cctx = cloudCanvas.getContext('2d')!;

  // A. Deep Oceanic Abyss & Marine Rayleigh Scattering
  const oceanGrad = dctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0.0, '#020b18'); // Arctic deep abyss
  oceanGrad.addColorStop(0.2, '#061a38'); // Northern temperate ocean
  oceanGrad.addColorStop(0.5, '#0a254d'); // Tropical azure abyss
  oceanGrad.addColorStop(0.8, '#061a38'); // Southern ocean
  oceanGrad.addColorStop(1.0, '#020b18'); // Antarctic abyss
  dctx.fillStyle = oceanGrad;
  dctx.fillRect(0, 0, width, height);

  // Specular: Ocean is glossy (pure white)
  sctx.fillStyle = '#ffffff';
  sctx.fillRect(0, 0, width, height);

  // Night lights background is pure black
  nctx.fillStyle = '#000000';
  nctx.fillRect(0, 0, width, height);

  // Helper to render realistic landmass with fractal coastlines and turquoise shelf
  function renderLandmass(
    points: [number, number][],
    biomeFill: string,
    shelfWidth = 14,
    roughness = 0.007
  ) {
    // 1. Turquoise Coastal Shelf (Sunlit shallow waters seen from orbit)
    dctx.save();
    dctx.strokeStyle = '#0891b2';
    dctx.lineWidth = shelfWidth * 1.8;
    dctx.lineJoin = 'round';
    traceFractalCoastline(dctx, points, width, height, roughness);
    dctx.stroke();

    dctx.strokeStyle = '#06b6d4';
    dctx.lineWidth = shelfWidth * 0.8;
    dctx.stroke();
    dctx.restore();

    // 2. Main Continental Landmass with fractal boundary
    dctx.save();
    dctx.fillStyle = biomeFill;
    traceFractalCoastline(dctx, points, width, height, roughness);
    dctx.fill();
    dctx.restore();

    // 3. Mark land in specular map as non-reflective matte
    sctx.save();
    sctx.fillStyle = '#080808';
    traceFractalCoastline(sctx, points, width, height, roughness);
    sctx.fill();
    sctx.restore();
  }

  // ==========================================================================
  // REAL CONTINENTAL MORPHOLOGY
  // ==========================================================================

  // 1. EURASIA (Europe, Russia, China, Southeast Asia)
  const eurasiaPoints: [number, number][] = [
    [0.46, 0.22], [0.52, 0.20], [0.60, 0.18], [0.72, 0.18], [0.85, 0.22],
    [0.92, 0.28], [0.88, 0.35], [0.82, 0.40], [0.76, 0.44], [0.72, 0.48],
    [0.68, 0.52], [0.64, 0.44], [0.58, 0.42], [0.52, 0.45], [0.48, 0.42],
    [0.44, 0.45], [0.42, 0.38], [0.44, 0.30], [0.46, 0.22],
  ];
  renderLandmass(eurasiaPoints, '#1f4e2b', 16, 0.008);

  // 2. ARABIAN PENINSULA (Golden desert dunes)
  const arabiaPoints: [number, number][] = [
    [0.58, 0.40], [0.63, 0.41], [0.65, 0.48], [0.62, 0.53], [0.58, 0.50],
    [0.56, 0.45], [0.58, 0.40],
  ];
  renderLandmass(arabiaPoints, '#c2884a', 10, 0.005);

  // 3. THE INDIAN SUBCONTINENT (Prominent in central view)
  const indiaPoints: [number, number][] = [
    [0.66, 0.36], // Himalayas / Kashmir / Ladakh
    [0.72, 0.37], // Nepal / Sikkim / Bhutan
    [0.74, 0.40], // Assam / Brahmaputra
    [0.73, 0.44], // Bengal Delta / Sundarbans
    [0.72, 0.48], // Odisha Coast
    [0.70, 0.53], // Andhra Coast / Chennai
    [0.678, 0.585], // Kanyakumari (Southernmost cape apex)
    [0.665, 0.54], // Kerala / Malabar Coast
    [0.655, 0.49], // Karnataka / Goa / Konkan Coast
    [0.648, 0.45], // Mumbai / Maharashtra Coast
    [0.635, 0.43], // Gujarat / Kathiawar Peninsula / Rann of Kutch
    [0.645, 0.38], // Rajasthan / Punjab / Indus Valley
    [0.66, 0.36],
  ];
  renderLandmass(indiaPoints, '#2d6a4f', 12, 0.006);

  // Western Ghats Tropical Rainforest Mountain Spine (Lush dark emerald green)
  dctx.save();
  dctx.strokeStyle = '#14532d';
  dctx.lineWidth = 14;
  dctx.lineCap = 'round';
  dctx.beginPath();
  dctx.moveTo(width * 0.655, height * 0.46);
  dctx.bezierCurveTo(
    width * 0.660, height * 0.50,
    width * 0.668, height * 0.54,
    width * 0.675, height * 0.575
  );
  dctx.stroke();
  dctx.restore();

  // Sri Lanka Teardrop Island
  const sriLankaPoints: [number, number][] = [
    [0.686, 0.575], [0.692, 0.585], [0.690, 0.598], [0.684, 0.592], [0.686, 0.575],
  ];
  renderLandmass(sriLankaPoints, '#1f5e3b', 6, 0.004);

  // 4. AFRICA (Sahara Desert ochre + Congo Rainforest emerald)
  const africaNorthPoints: [number, number][] = [
    [0.44, 0.42], [0.55, 0.41], [0.58, 0.48], [0.52, 0.56], [0.45, 0.55],
    [0.40, 0.50], [0.41, 0.44], [0.44, 0.42],
  ];
  renderLandmass(africaNorthPoints, '#b45309', 14, 0.007); // Sahara desert ochre

  const africaSouthPoints: [number, number][] = [
    [0.45, 0.54], [0.52, 0.56], [0.54, 0.65], [0.52, 0.74], [0.48, 0.78],
    [0.45, 0.72], [0.43, 0.62], [0.45, 0.54],
  ];
  renderLandmass(africaSouthPoints, '#14532d', 14, 0.007); // Congo & Southern Africa

  // Madagascar
  const madagascarPoints: [number, number][] = [
    [0.57, 0.68], [0.585, 0.70], [0.575, 0.78], [0.56, 0.75], [0.57, 0.68],
  ];
  renderLandmass(madagascarPoints, '#15803d', 8, 0.005);

  // 5. SOUTHEAST ASIA & AUSTRALIA
  const seAsiaPoints: [number, number][] = [
    [0.74, 0.44], [0.77, 0.48], [0.76, 0.56], [0.74, 0.54], [0.74, 0.44],
  ];
  renderLandmass(seAsiaPoints, '#166534', 8, 0.006);

  const indonesiaPoints: [number, number][] = [
    [0.74, 0.57], [0.82, 0.60], [0.88, 0.61], [0.82, 0.63], [0.75, 0.59], [0.74, 0.57],
  ];
  renderLandmass(indonesiaPoints, '#15803d', 10, 0.006);

  const australiaPoints: [number, number][] = [
    [0.80, 0.68], [0.86, 0.66], [0.90, 0.72], [0.88, 0.82], [0.80, 0.82],
    [0.76, 0.76], [0.80, 0.68],
  ];
  renderLandmass(australiaPoints, '#c2410c', 16, 0.008); // Red outback

  // 6. THE AMERICAS (North & South)
  const northAmericaPoints: [number, number][] = [
    [0.10, 0.22], [0.22, 0.20], [0.26, 0.32], [0.22, 0.44], [0.18, 0.48],
    [0.14, 0.44], [0.08, 0.34], [0.10, 0.22],
  ];
  renderLandmass(northAmericaPoints, '#1e3a24', 16, 0.008);

  const southAmericaPoints: [number, number][] = [
    [0.22, 0.52], [0.28, 0.55], [0.32, 0.62], [0.28, 0.78], [0.24, 0.84],
    [0.21, 0.72], [0.20, 0.58], [0.22, 0.52],
  ];
  renderLandmass(southAmericaPoints, '#0f4222', 16, 0.008);

  // 7. HIMALAYAN SNOW WALL & GLACIERS (Northern India / Tibet)
  dctx.save();
  dctx.strokeStyle = '#f8fafc';
  dctx.lineWidth = 12;
  dctx.lineCap = 'round';
  dctx.beginPath();
  dctx.moveTo(width * 0.655, height * 0.365);
  dctx.lineTo(width * 0.725, height * 0.385);
  dctx.stroke();

  // Mountain shadow on northern ridge
  dctx.strokeStyle = '#475569';
  dctx.lineWidth = 4;
  dctx.beginPath();
  dctx.moveTo(width * 0.655, height * 0.362);
  dctx.lineTo(width * 0.725, height * 0.382);
  dctx.stroke();
  dctx.restore();

  // 8. POLAR ICE CAPS (Antarctica & Greenland)
  dctx.fillStyle = '#f8fafc';
  dctx.fillRect(0, height * 0.88, width, height * 0.12);
  sctx.fillStyle = '#333333';
  sctx.fillRect(0, height * 0.88, width, height * 0.12);

  dctx.beginPath();
  dctx.ellipse(width * 0.36, height * 0.16, 80, 48, 0.2, 0, Math.PI * 2);
  dctx.fill();

  // ==========================================================================
  // NIGHT LIGHTS BIOLUMINESCENCE (Sodium-gold city clusters on night canvas)
  // ==========================================================================
  const majorCities = [
    // India Population Centers
    { x: width * 0.672, y: height * 0.535, r: 6.0, name: 'Bangalore' },
    { x: width * 0.664, y: height * 0.515, r: 4.5, name: 'Davanagere' },
    { x: width * 0.648, y: height * 0.465, r: 6.5, name: 'Mumbai' },
    { x: width * 0.665, y: height * 0.388, r: 6.5, name: 'Delhi' },
    { x: width * 0.675, y: height * 0.485, r: 5.2, name: 'Hyderabad' },
    { x: width * 0.685, y: height * 0.540, r: 5.5, name: 'Chennai' },
    { x: width * 0.725, y: height * 0.435, r: 5.8, name: 'Kolkata' },
    { x: width * 0.652, y: height * 0.480, r: 4.2, name: 'Pune' },
    // Global Metropolises
    { x: width * 0.865, y: height * 0.360, r: 6.5, name: 'Tokyo' },
    { x: width * 0.815, y: height * 0.420, r: 6.0, name: 'Shanghai' },
    { x: width * 0.485, y: height * 0.330, r: 6.2, name: 'London' },
    { x: width * 0.510, y: height * 0.355, r: 5.5, name: 'Paris' },
    { x: width * 0.550, y: height * 0.420, r: 5.0, name: 'Cairo' },
    { x: width * 0.615, y: height * 0.450, r: 5.2, name: 'Dubai' },
    { x: width * 0.755, y: height * 0.585, r: 5.0, name: 'Singapore' },
  ];

  majorCities.forEach((city) => {
    // 1. Core incandescent hotspot
    const radGrad = nctx.createRadialGradient(city.x, city.y, 0, city.x, city.y, city.r * 4.0);
    radGrad.addColorStop(0.0, 'rgba(255, 255, 230, 1.0)');
    radGrad.addColorStop(0.25, 'rgba(251, 191, 36, 0.95)'); // Bright warm gold
    radGrad.addColorStop(0.65, 'rgba(245, 158, 11, 0.50)'); // Amber halo
    radGrad.addColorStop(1.0, 'rgba(217, 119, 6, 0.0)');
    nctx.fillStyle = radGrad;
    nctx.beginPath();
    nctx.arc(city.x, city.y, city.r * 4.0, 0, Math.PI * 2);
    nctx.fill();

    // Subtle city light on day canvas as well (light urban footprint)
    dctx.fillStyle = 'rgba(253, 224, 71, 0.35)';
    dctx.beginPath();
    dctx.arc(city.x, city.y, city.r * 1.2, 0, Math.PI * 2);
    dctx.fill();
  });

  // Micro-town highway web connecting Indian cities
  nctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
  nctx.lineWidth = 1.2;
  nctx.beginPath();
  // Bangalore to Chennai
  nctx.moveTo(width * 0.672, height * 0.535);
  nctx.lineTo(width * 0.685, height * 0.540);
  // Bangalore to Davanagere to Pune to Mumbai
  nctx.lineTo(width * 0.664, height * 0.515);
  nctx.lineTo(width * 0.652, height * 0.480);
  nctx.lineTo(width * 0.648, height * 0.465);
  // Mumbai to Delhi
  nctx.lineTo(width * 0.665, height * 0.388);
  nctx.stroke();

  // ==========================================================================
  // REALISTIC CLOUD SYSTEMS (Bay of Bengal Cyclone, Trade Winds, Cirrus)
  // ==========================================================================
  cctx.clearRect(0, 0, width, height);

  // 1. Equatorial Trade Wind Cloud Streams
  cctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
  for (let i = 0; i < 48; i++) {
    const cx = (i * 44 + Math.sin(i * 1.5) * 30) % width;
    const cy = height * 0.48 + Math.sin(i * 0.8) * 45;
    const rx = 35 + (i % 6) * 12;
    const ry = 10 + (i % 4) * 4;
    cctx.beginPath();
    cctx.ellipse(cx, cy, rx, ry, Math.sin(i) * 0.2, 0, Math.PI * 2);
    cctx.fill();
  }

  // 2. Baroclinic Cyclones (Indian Ocean / Bay of Bengal tropical cyclone)
  function drawCyclone(cx: number, cy: number, radius: number) {
    cctx.save();
    cctx.translate(cx, cy);
    for (let arm = 0; arm < 3; arm++) {
      cctx.strokeStyle = 'rgba(255, 255, 255, 0.68)';
      cctx.lineWidth = radius * 0.22;
      cctx.lineCap = 'round';
      cctx.beginPath();
      for (let theta = 0; theta < Math.PI * 2.2; theta += 0.2) {
        const r = (theta / (Math.PI * 2.2)) * radius;
        const angle = theta + (arm * Math.PI * 2) / 3;
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);
        if (theta === 0) cctx.moveTo(x, y);
        else cctx.lineTo(x, y);
      }
      cctx.stroke();
    }
    cctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    cctx.beginPath();
    cctx.arc(0, 0, radius * 0.32, 0, Math.PI * 2);
    cctx.fill();
    cctx.restore();
  }

  drawCyclone(width * 0.71, height * 0.49, 80); // Bay of Bengal Cyclone
  drawCyclone(width * 0.62, height * 0.47, 65); // Arabian Sea Cyclone
  drawCyclone(width * 0.84, height * 0.38, 90); // Western Pacific Typhoon
  drawCyclone(width * 0.28, height * 0.39, 75); // North Atlantic Storm

  // 3. Delicate Wispy Cirrus Tendrils across temperate latitudes
  cctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  cctx.lineWidth = 14;
  for (let i = 0; i < 32; i++) {
    const startX = (i * 68) % width;
    const startY = height * 0.28 + (i % 5) * 22;
    cctx.beginPath();
    cctx.moveTo(startX, startY);
    cctx.bezierCurveTo(
      startX + 80, startY - 25,
      startX + 160, startY + 25,
      startX + 240, startY - 10
    );
    cctx.stroke();
  }

  // Convert canvases to Three.js textures
  const dayTexture = new THREE.CanvasTexture(dayCanvas);
  dayTexture.generateMipmaps = false;
  dayTexture.minFilter = THREE.LinearFilter;

  const nightTexture = new THREE.CanvasTexture(nightCanvas);
  nightTexture.generateMipmaps = false;
  nightTexture.minFilter = THREE.LinearFilter;

  const specularTexture = new THREE.CanvasTexture(specCanvas);
  specularTexture.generateMipmaps = false;
  specularTexture.minFilter = THREE.LinearFilter;

  const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
  cloudTexture.generateMipmaps = false;
  cloudTexture.minFilter = THREE.LinearFilter;

  cachedEarthTextures = { dayTexture, nightTexture, specularTexture, cloudTexture };
  return cachedEarthTextures;
}

// ============================================================================
// 2. PHOTOREALISTIC 3D MOON TEXTURES (Basaltic Maria + Regolith + Tycho Rays)
// ============================================================================
export interface MoonTextures {
  diffuse: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
}

let cachedMoonTextures: MoonTextures | null = null;

export function getPhotorealisticMoonTextures(): MoonTextures {
  if (cachedMoonTextures) return cachedMoonTextures;

  const width = 512;
  const height = 256;

  const diffuseCanvas = document.createElement('canvas');
  diffuseCanvas.width = width;
  diffuseCanvas.height = height;
  const dctx = diffuseCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bctx = bumpCanvas.getContext('2d')!;

  // 1. Lunar Anorthosite Regolith Highlands Base (Soft, textured silvery slate-gray)
  const highlandGrad = dctx.createLinearGradient(0, 0, width, height);
  highlandGrad.addColorStop(0.0, '#94a3b8');
  highlandGrad.addColorStop(0.3, '#cbd5e1');
  highlandGrad.addColorStop(0.6, '#94a3b8');
  highlandGrad.addColorStop(0.85, '#64748b');
  highlandGrad.addColorStop(1.0, '#94a3b8');
  dctx.fillStyle = highlandGrad;
  dctx.fillRect(0, 0, width, height);

  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, width, height);

  // High-frequency subtle regolith dust noise clusters across the lunar highlands
  dctx.save();
  for (let i = 0; i < 90; i++) {
    const x = (i * 37 + 13) % width;
    const y = (i * 43 + 29) % height;
    const rad = 50 + (i % 6) * 35;
    const g = dctx.createRadialGradient(x, y, 0, x, y, rad);
    const alpha = 0.07 + (i % 4) * 0.03;
    g.addColorStop(0, i % 2 === 0 ? `rgba(255,255,255,${alpha})` : `rgba(30,41,59,${alpha})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = g;
    dctx.beginPath();
    dctx.arc(x, y, rad, 0, Math.PI * 2);
    dctx.fill();
  }
  dctx.restore();

  // 2. Basaltic Lunar Maria (Photorealistic volcanic flood plains with silky-smooth feathered margins)
  // Replicating the authentic near-side "Man in the Moon" volcanic flood basalt layout
  function renderSoftMariaBasin(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    rot: number,
    intensity = 1.0
  ) {
    const maxR = Math.max(rx, ry);

    // Diffuse pass: deep basaltic titanium-rich volcanic lava lowlands
    const grad = dctx.createRadialGradient(0, 0, 0, 0, 0, maxR);
    grad.addColorStop(0.0, `rgba(32, 42, 56, ${0.85 * intensity})`); // Dark basalt core
    grad.addColorStop(0.45, `rgba(48, 60, 78, ${0.70 * intensity})`);
    grad.addColorStop(0.75, `rgba(75, 90, 112, ${0.38 * intensity})`);
    grad.addColorStop(1.0, 'rgba(148, 163, 184, 0)');

    dctx.save();
    dctx.translate(cx, cy);
    dctx.rotate(rot);
    dctx.scale(1.0, ry / rx);
    dctx.fillStyle = grad;
    dctx.beginPath();
    dctx.arc(0, 0, rx, 0, Math.PI * 2);
    dctx.fill();
    dctx.restore();

    // Bump map: Depressed basin elevation with soft mountain margins
    const bGrad = bctx.createRadialGradient(0, 0, 0, 0, 0, maxR);
    bGrad.addColorStop(0.0, '#363636'); // Depressed basin floor
    bGrad.addColorStop(0.65, '#525252');
    bGrad.addColorStop(0.90, '#989898'); // Raised mountain ridge margin
    bGrad.addColorStop(1.0, '#808080');

    bctx.save();
    bctx.translate(cx, cy);
    bctx.rotate(rot);
    bctx.scale(1.0, ry / rx);
    bctx.fillStyle = bGrad;
    bctx.beginPath();
    bctx.arc(0, 0, rx, 0, Math.PI * 2);
    bctx.fill();
    bctx.restore();
  }

  // Iconic Major Near-Side Lunar Maria Formations (Multi-lobed organic basalt flows)
  // 1. Oceanus Procellarum (Vast western flood plain)
  renderSoftMariaBasin(width * 0.38, height * 0.42, 270, 210, 0.15, 1.0);
  renderSoftMariaBasin(width * 0.34, height * 0.54, 210, 160, -0.10, 0.95);
  renderSoftMariaBasin(width * 0.42, height * 0.32, 190, 140, 0.20, 0.90);

  // 2. Mare Imbrium (Giant circular northern basin bordered by Montes Apenninus)
  renderSoftMariaBasin(width * 0.50, height * 0.35, 195, 165, -0.18, 1.0);
  renderSoftMariaBasin(width * 0.46, height * 0.42, 140, 110, 0.10, 0.85);

  // 3. Mare Serenitatis & Tranquillitatis (Apollo 11 landing zone)
  renderSoftMariaBasin(width * 0.62, height * 0.38, 135, 115, 0.12, 0.95);
  renderSoftMariaBasin(width * 0.64, height * 0.50, 155, 125, -0.08, 0.95);
  renderSoftMariaBasin(width * 0.68, height * 0.58, 120, 95, 0.15, 0.85);

  // 4. Mare Crisium (Isolated eastern circular basin)
  renderSoftMariaBasin(width * 0.78, height * 0.40, 95, 75, 0.18, 1.0);

  // 5. Mare Nubium & Humorum (Southern lowlands)
  renderSoftMariaBasin(width * 0.42, height * 0.62, 175, 125, 0.25, 0.90);
  renderSoftMariaBasin(width * 0.34, height * 0.66, 125, 95, -0.15, 0.85);

  // 3. Realistic Impact Craters with soft radial relief, raised rims & ejecta rays
  function renderImpactCrater(
    cx: number,
    cy: number,
    radius: number,
    hasRays = false
  ) {
    // 1. Crater Floor (Unweathered bright anorthosite for ray craters like Tycho, weathered slate for ancient basins)
    const floorGrad = dctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    if (hasRays) {
      floorGrad.addColorStop(0.0, '#ffffff'); // Brilliant white pulverized anorthosite
      floorGrad.addColorStop(0.40, '#f1f5f9');
      floorGrad.addColorStop(0.75, '#cbd5e1');
      floorGrad.addColorStop(1.0, 'rgba(148, 163, 184, 0)');
    } else {
      floorGrad.addColorStop(0.0, '#243040'); // Weathered ancient basalt basin
      floorGrad.addColorStop(0.65, '#3b4a5e');
      floorGrad.addColorStop(0.90, '#64748b');
      floorGrad.addColorStop(1.0, 'rgba(100, 116, 139, 0)');
    }

    dctx.fillStyle = floorGrad;
    dctx.beginPath();
    dctx.arc(cx, cy, radius, 0, Math.PI * 2);
    dctx.fill();

    // 2. Elevated Rim (Subtle highlight crescent on sunward side)
    const rimGrad = dctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius * 1.25);
    rimGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
    rimGrad.addColorStop(0.5, hasRays ? 'rgba(255, 255, 255, 0.70)' : 'rgba(241, 245, 249, 0.35)');
    rimGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

    dctx.fillStyle = rimGrad;
    dctx.beginPath();
    dctx.arc(cx, cy, radius * 1.25, 0, Math.PI * 2);
    dctx.fill();

    // 3. Bump Map: Depressed basin + raised annular rim + central peak
    const bCrater = bctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.30);
    bCrater.addColorStop(0.0, radius > 15 ? '#b8b8b8' : '#303030'); // Central peak
    bCrater.addColorStop(0.2, '#282828'); // Deep floor bowl
    bCrater.addColorStop(0.75, '#555555');
    bCrater.addColorStop(0.90, '#d8d8d8'); // Raised rim ridge
    bCrater.addColorStop(1.0, '#808080'); // Blends to base highland

    bctx.fillStyle = bCrater;
    bctx.beginPath();
    bctx.arc(cx, cy, radius * 1.30, 0, Math.PI * 2);
    bctx.fill();

    // 4. Feathery Ejecta Rays (Tycho & Copernicus)
    if (hasRays) {
      dctx.save();
      const numRays = radius > 20 ? 44 : 28;
      for (let i = 0; i < numRays; i++) {
        const a = (i / numRays) * Math.PI * 2 + (noiseA(i, cx) * 0.15);
        const rayLen = radius * (7 + (i * 5) % 18);

        const rayGrad = dctx.createLinearGradient(
          cx,
          cy,
          cx + Math.cos(a) * rayLen,
          cy + Math.sin(a) * rayLen
        );
        rayGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.40)');
        rayGrad.addColorStop(0.35, 'rgba(241, 245, 249, 0.18)');
        rayGrad.addColorStop(0.75, 'rgba(226, 232, 240, 0.06)');
        rayGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

        dctx.strokeStyle = rayGrad;
        dctx.lineWidth = 1.2 + (i % 3) * 0.8;
        dctx.beginPath();
        dctx.moveTo(cx, cy);
        dctx.lineTo(cx + Math.cos(a) * rayLen, cy + Math.sin(a) * rayLen);
        dctx.stroke();
      }
      dctx.restore();
    }
  }

  // Prominent Major Lunar Impact Formations
  renderImpactCrater(width * 0.50, height * 0.78, 28, true);  // Tycho (Glorious southern rays!)
  renderImpactCrater(width * 0.42, height * 0.45, 24, true);  // Copernicus (Oceanus Procellarum jewel)
  renderImpactCrater(width * 0.34, height * 0.47, 16, true);  // Kepler
  renderImpactCrater(width * 0.31, height * 0.36, 15, true);  // Aristarchus (Brightest plateau)
  renderImpactCrater(width * 0.54, height * 0.28, 22, false); // Aristoteles
  renderImpactCrater(width * 0.64, height * 0.55, 20, false); // Theophilus
  renderImpactCrater(width * 0.46, height * 0.58, 22, false); // Ptolemaeus
  renderImpactCrater(width * 0.70, height * 0.34, 22, false); // Posidonius

  // Secondary Natural Impact Basins (organic random distribution without mechanical repetition)
  for (let i = 0; i < 36; i++) {
    const cx = (i * 353 + 127) % width;
    const cy = 70 + (i * 269 + 71) % (height - 140);
    const r = 6 + (i % 4) * 3;
    renderImpactCrater(cx, cy, r, false);
  }

  const diffuse = new THREE.CanvasTexture(diffuseCanvas);
  diffuse.generateMipmaps = false;
  diffuse.minFilter = THREE.LinearFilter;

  const bump = new THREE.CanvasTexture(bumpCanvas);
  bump.generateMipmaps = false;
  bump.minFilter = THREE.LinearFilter;

  cachedMoonTextures = { diffuse, bump };
  return cachedMoonTextures;
}

// ============================================================================
// 3. PHOTOREALISTIC 3D MARS TEXTURES (Ferric Oxide + Valles Marineris + Olympus Mons)
// ============================================================================
export interface MarsTextures {
  diffuse: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
}

let cachedMarsTextures: MarsTextures | null = null;

export function getPhotorealisticMarsTextures(): MarsTextures {
  if (cachedMarsTextures) return cachedMarsTextures;

  const width = 512;
  const height = 256;

  const diffuseCanvas = document.createElement('canvas');
  diffuseCanvas.width = width;
  diffuseCanvas.height = height;
  const dctx = diffuseCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bctx = bumpCanvas.getContext('2d')!;

  // 1. Ferric Oxide Martian Rust-Red Base (Hemispheric dichotomy & desert dunes)
  const baseGrad = dctx.createLinearGradient(0, 0, 0, height);
  baseGrad.addColorStop(0.0, '#9a3412'); // Northern lowland ferric dust
  baseGrad.addColorStop(0.35, '#c2410c'); // Equatorial desert
  baseGrad.addColorStop(0.52, '#ea580c');
  baseGrad.addColorStop(0.70, '#9a3412'); // Southern ancient cratered highlands
  baseGrad.addColorStop(1.0, '#6c240d');
  dctx.fillStyle = baseGrad;
  dctx.fillRect(0, 0, width, height);

  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, width, height);

  // Subtle tonal dune waves across the Martian equatorial deserts
  dctx.save();
  for (let i = 0; i < 50; i++) {
    const x = (i * 57 + 31) % width;
    const y = (i * 61 + 47) % height;
    const rad = 100 + (i % 6) * 50;
    const g = dctx.createRadialGradient(x, y, 0, x, y, rad);
    const alpha = 0.10 + (i % 3) * 0.04;
    g.addColorStop(0, i % 2 === 0 ? `rgba(249, 115, 22, ${alpha})` : `rgba(108, 36, 13, ${alpha})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = g;
    dctx.beginPath();
    dctx.arc(x, y, rad, 0, Math.PI * 2);
    dctx.fill();
  }
  dctx.restore();

  // 2. Basaltic Dark Albedo Features (Syrtis Major, Acidalia Planitia, Sinus Sabaeus)
  // Soft, feathered wind-swept dust drifts that blend organically into the ferric oxide terrain
  const basalticAlbedo = [
    { cx: width * 0.72, cy: height * 0.48, rx: 240, ry: 150, rot: 0.18 }, // Syrtis Major Planum (Iconic dark shield)
    { cx: width * 0.52, cy: height * 0.58, rx: 210, ry: 100, rot: -0.15 }, // Sinus Sabaeus & Meridiani
    { cx: width * 0.32, cy: height * 0.34, rx: 190, ry: 120, rot: 0.25 }, // Acidalia Planitia
    { cx: width * 0.88, cy: height * 0.52, rx: 170, ry: 95, rot: 0.05 }, // Mare Tyrrhenum
  ];

  basalticAlbedo.forEach((l) => {
    // Gentle soft feathered gradient (ZERO sharp borders)
    const g = dctx.createRadialGradient(l.cx, l.cy, 0, l.cx, l.cy, Math.max(l.rx, l.ry));
    g.addColorStop(0.0, 'rgba(48, 17, 7, 0.70)'); // Deep warm umber basalt
    g.addColorStop(0.45, 'rgba(78, 30, 14, 0.40)');
    g.addColorStop(1.0, 'rgba(154, 52, 18, 0)');

    dctx.save();
    dctx.translate(l.cx, l.cy);
    dctx.rotate(l.rot);
    dctx.scale(1.0, l.ry / l.rx);
    dctx.fillStyle = g;
    dctx.beginPath();
    dctx.arc(0, 0, l.rx, 0, Math.PI * 2);
    dctx.fill();
    dctx.restore();

    // Bump map: Depressed wind-swept floor
    const bg = bctx.createRadialGradient(l.cx, l.cy, 0, l.cx, l.cy, Math.max(l.rx, l.ry));
    bg.addColorStop(0.0, '#555555');
    bg.addColorStop(0.7, '#6e6e6e');
    bg.addColorStop(1.0, '#808080');

    bctx.save();
    bctx.translate(l.cx, l.cy);
    bctx.rotate(l.rot);
    bctx.scale(1.0, l.ry / l.rx);
    bctx.fillStyle = bg;
    bctx.beginPath();
    bctx.arc(0, 0, l.rx, 0, Math.PI * 2);
    bctx.fill();
    bctx.restore();
  });

  // Hellas Planitia (Massive circular impact basin filled with pale morning dust frost)
  const hellasX = width * 0.65;
  const hellasY = height * 0.70;
  const hGrad = dctx.createRadialGradient(hellasX, hellasY, 0, hellasX, hellasY, 160);
  hGrad.addColorStop(0.0, '#ea8a50');
  hGrad.addColorStop(0.6, '#c2410c');
  hGrad.addColorStop(1.0, 'rgba(154, 52, 18, 0)');
  dctx.fillStyle = hGrad;
  dctx.beginPath();
  dctx.arc(hellasX, hellasY, 160, 0, Math.PI * 2);
  dctx.fill();

  // 3. PHOTOREALISTIC VALLES MARINERIS GRAND CANYON RIFT SYSTEM
  // Replaces crude vector lines with authentic multi-segmented tectonic rift chasmata:
  // Noctis Labyrinthus -> Melas / Candor / Ophir Chasmata -> Coprates Chasma
  const chasmSegments = [
    // Western head (Noctis Labyrinthus fracture zone)
    { x: width * 0.34, y: height * 0.52, rx: 42, ry: 18, rot: 0.10, depth: '#220803' },
    { x: width * 0.37, y: height * 0.53, rx: 50, ry: 24, rot: 0.08, depth: '#1e0702' },
    // Main central chasmata (Melas, Candor, Ophir - deepest canyon depression, 7 km deep)
    { x: width * 0.42, y: height * 0.55, rx: 75, ry: 34, rot: 0.05, depth: '#1a0602' },
    { x: width * 0.48, y: height * 0.54, rx: 85, ry: 38, rot: -0.04, depth: '#180501' },
    { x: width * 0.54, y: height * 0.53, rx: 70, ry: 28, rot: -0.08, depth: '#200702' },
    // Eastern gorge (Coprates Chasma tapering into Chryse outflow chaos)
    { x: width * 0.59, y: height * 0.51, rx: 60, ry: 20, rot: -0.12, depth: '#260a04' },
    { x: width * 0.63, y: height * 0.49, rx: 45, ry: 14, rot: -0.16, depth: '#2f1006' },
  ];

  chasmSegments.forEach((ch) => {
    // 1. Diffuse canyon depression with shadowed southern wall and sunlit northern wall
    const g = dctx.createRadialGradient(ch.x, ch.y, 0, ch.x, ch.y, ch.rx);
    g.addColorStop(0.0, ch.depth); // Shadowed abyss floor
    g.addColorStop(0.45, '#431407'); // Terraced sedimentary canyon walls
    g.addColorStop(0.75, '#7c2d12');
    g.addColorStop(1.0, 'rgba(154, 52, 18, 0)');

    dctx.save();
    dctx.translate(ch.x, ch.y);
    dctx.rotate(ch.rot);
    dctx.scale(1.0, ch.ry / ch.rx);
    dctx.fillStyle = g;
    dctx.beginPath();
    dctx.arc(0, 0, ch.rx, 0, Math.PI * 2);
    dctx.fill();
    dctx.restore();

    // 2. Bump map canyon trough
    const bg = bctx.createRadialGradient(ch.x, ch.y, 0, ch.x, ch.y, ch.rx);
    bg.addColorStop(0.0, '#1c1c1c'); // Deep canyon floor
    bg.addColorStop(0.55, '#404040');
    bg.addColorStop(0.85, '#a0a0a0'); // Raised canyon scarp rim
    bg.addColorStop(1.0, '#808080');

    bctx.save();
    bctx.translate(ch.x, ch.y);
    bctx.rotate(ch.rot);
    bctx.scale(1.0, ch.ry / ch.rx);
    bctx.fillStyle = bg;
    bctx.beginPath();
    bctx.arc(0, 0, ch.rx, 0, Math.PI * 2);
    bctx.fill();
    bctx.restore();
  });

  // 4. Olympus Mons & Tharsis Montes Shield Volcanoes (Soft relief domes)
  const volcanoes = [
    { x: width * 0.24, y: height * 0.38, r: 64, name: 'Olympus Mons' },
    { x: width * 0.29, y: height * 0.46, r: 34, name: 'Ascraeus Mons' },
    { x: width * 0.33, y: height * 0.54, r: 32, name: 'Pavonis Mons' },
    { x: width * 0.37, y: height * 0.62, r: 30, name: 'Arsia Mons' },
  ];

  volcanoes.forEach((v) => {
    // Gentle shield slope highlight
    const vGrad = dctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, v.r);
    vGrad.addColorStop(0.0, '#2e0f04'); // Summit caldera collapse pit
    vGrad.addColorStop(0.25, '#7c2d12');
    vGrad.addColorStop(0.65, '#c2410c');
    vGrad.addColorStop(1.0, 'rgba(234, 88, 12, 0)');

    dctx.fillStyle = vGrad;
    dctx.beginPath();
    dctx.arc(v.x, v.y, v.r, 0, Math.PI * 2);
    dctx.fill();

    const vbGrad = bctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, v.r);
    vbGrad.addColorStop(0.0, '#2a2a2a'); // Sunken caldera
    vbGrad.addColorStop(0.22, '#d4d4d4'); // High caldera rim
    vbGrad.addColorStop(0.65, '#a0a0a0'); // Massive shield volcano slope
    vbGrad.addColorStop(1.0, '#808080');

    bctx.fillStyle = vbGrad;
    bctx.beginPath();
    bctx.arc(v.x, v.y, v.r, 0, Math.PI * 2);
    bctx.fill();
  });

  // 5. Polar Ice Caps with Soft Sublimation Rims
  const polarNorth = dctx.createRadialGradient(width * 0.5, 30, 0, width * 0.5, 30, width * 0.22);
  polarNorth.addColorStop(0.0, '#ffffff');
  polarNorth.addColorStop(0.65, 'rgba(248, 250, 252, 0.85)');
  polarNorth.addColorStop(1.0, 'rgba(248, 250, 252, 0)');
  dctx.fillStyle = polarNorth;
  dctx.beginPath();
  dctx.ellipse(width * 0.5, 30, width * 0.22, 45, 0, 0, Math.PI * 2);
  dctx.fill();

  const polarSouth = dctx.createRadialGradient(width * 0.5, height - 30, 0, width * 0.5, height - 30, width * 0.18);
  polarSouth.addColorStop(0.0, '#ffffff');
  polarSouth.addColorStop(0.65, 'rgba(248, 250, 252, 0.85)');
  polarSouth.addColorStop(1.0, 'rgba(248, 250, 252, 0)');
  dctx.fillStyle = polarSouth;
  dctx.beginPath();
  dctx.ellipse(width * 0.5, height - 30, width * 0.18, 38, 0, 0, Math.PI * 2);
  dctx.fill();

  bctx.fillStyle = '#b8b8b8';
  bctx.beginPath();
  bctx.ellipse(width * 0.5, 30, width * 0.22, 45, 0, 0, Math.PI * 2);
  bctx.fill();
  bctx.beginPath();
  bctx.ellipse(width * 0.5, height - 30, width * 0.18, 38, 0, 0, Math.PI * 2);
  bctx.fill();

  const diffuse = new THREE.CanvasTexture(diffuseCanvas);
  diffuse.generateMipmaps = false;
  diffuse.minFilter = THREE.LinearFilter;

  const bump = new THREE.CanvasTexture(bumpCanvas);
  bump.generateMipmaps = false;
  bump.minFilter = THREE.LinearFilter;

  cachedMarsTextures = { diffuse, bump };
  return cachedMarsTextures;
}
