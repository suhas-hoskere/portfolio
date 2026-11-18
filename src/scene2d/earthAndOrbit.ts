import {
  type Scene2DFrameContext,
  lerp,
  smoothstep,
  mulberry32,
} from './types';

interface OrbitalSatSpec {
  rxScale: number;
  ryScale: number;
  tiltRad: number;
  phase: number;
}

const CONSTELLATION: OrbitalSatSpec[] = [
  { rxScale: 1.24, ryScale: 0.32, tiltRad: -0.20, phase: 0.72 },
  { rxScale: 1.38, ryScale: 0.38, tiltRad: 0.16, phase: 2.35 },
  { rxScale: 1.52, ryScale: 0.28, tiltRad: -0.07, phase: 4.15 },
];

let cachedEarthSprite: HTMLCanvasElement | null = null;
const EARTH_SPRITE_SIZE = 820;
const EARTH_SPRITE_R = 344; // leaves 66px silky outer atmospheric glow margin

/**
 * Real geographic (lon°E, lat°N) -> normalized globe coordinates [-1..1]
 * Centered on India (81.5°E, 21.0°N) and positioned cleanly in the visible upper crown of Earth!
 */
function projectGeoToGlobe(lon: number, lat: number): [number, number] {
  const lon0 = 81.5;
  const lat0 = 20.5;
  const scale = 0.0132;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const nx = (lon - lon0) * cosLat * scale + 0.03;
  // Gentle spherical curvature compression near northern limb
  const dLat = lat - lat0;
  const ny = -0.75 - dLat * scale * (1 - Math.max(0, dLat) * 0.004);
  return [nx, ny];
}

// Accurate real-world WGS84 longitude/latitude outline of India (68°E..97.4°E, 8.08°N..36.8°N)
const INDIA_LON_LAT: [number, number][] = [
  // Jammu, Kashmir & Ladakh Crown
  [74.2, 32.8],
  [73.7, 34.1],
  [73.8, 35.1],
  [74.6, 36.8], // Gilgit / Northernmost tip
  [76.0, 36.2],
  [77.6, 35.5], // Karakoram / Siachen
  [79.2, 34.7], // Aksai Chin
  [79.8, 33.8],
  [78.9, 32.7], // Ladakh South
  [78.5, 31.3], // Himachal border
  // Uttarakhand & Nepal Border
  [80.2, 30.5],
  [80.9, 30.2],
  [80.1, 29.0],
  [81.3, 28.1],
  [83.8, 27.4],
  [86.5, 26.5],
  [88.1, 26.6],
  // Sikkim & Siliguri / Bhutan Border
  [88.1, 27.9], // Sikkim peak
  [88.9, 27.8],
  [88.9, 27.1],
  [89.9, 26.8],
  [91.6, 26.9],
  // Northeast Seven Sisters (Arunachal, Nagaland, Manipur, Mizoram, Tripura, Meghalaya)
  [91.7, 27.8], // Tawang / Arunachal West
  [93.6, 28.6],
  [95.5, 29.3], // Arunachal North
  [97.3, 28.2], // Kibithu / Easternmost tip
  [96.8, 27.2],
  [95.4, 26.8], // Nagaland
  [94.7, 25.6],
  [94.4, 24.4], // Manipur
  [93.3, 23.8],
  [93.1, 22.0], // Mizoram South tip
  [92.5, 22.4],
  [92.3, 23.9], // Tripura
  [91.7, 23.0],
  [91.2, 23.8],
  [91.8, 24.9], // Meghalaya
  [90.0, 25.2],
  [89.8, 26.2], // Siliguri Chicken's Neck
  [88.8, 26.3],
  // West Bengal & East Coast (Bay of Bengal)
  [88.4, 25.2],
  [88.9, 22.4],
  [88.8, 21.6], // Sundarbans
  [87.6, 21.6],
  [87.0, 20.8], // Odisha
  [86.5, 19.9], // Puri
  [85.2, 19.4], // Chilika
  [84.0, 18.3],
  [83.3, 17.7], // Visakhapatnam
  [82.2, 16.8], // Kakinada
  [81.1, 16.0], // Machilipatnam
  [80.2, 15.1], // Ongole
  [80.23, 13.72], // Sriharikota (SHAR)
  [80.28, 13.08], // Chennai
  [79.85, 11.9], // Pondicherry
  [79.86, 10.3], // Point Calimere
  [79.25, 9.28], // Rameshwaram
  [78.2, 8.75], // Tuticorin
  [77.55, 8.08], // Kanyakumari Southernmost tip
  // West Coast (Arabian Sea)
  [76.9, 8.5], // Thiruvananthapuram
  [76.25, 9.95], // Kochi
  [75.7, 11.3], // Kozhikode
  [74.85, 12.9], // Mangalore
  [74.1, 14.8], // Karwar
  [73.8, 15.4], // Goa
  [73.25, 17.0], // Ratnagiri
  [72.85, 19.07], // Mumbai
  [72.8, 20.9], // Surat
  // Gujarat (Gulf of Khambhat -> Saurashtra/Kathiawar -> Gulf of Kutch -> Rann of Kutch)
  [72.5, 22.3], // Gulf of Khambhat top
  [72.15, 21.6], // Bhavnagar
  [71.1, 20.75], // Diu / Veraval
  [69.6, 21.6], // Porbandar
  [68.96, 22.24], // Dwarka
  [70.35, 22.9], // Gulf of Kutch indent
  [69.4, 22.85],
  [68.45, 23.6], // Westernmost Kutch tip
  [68.9, 24.3], // Rann of Kutch
  [70.8, 24.6],
  // Rajasthan & Punjab (Western Border)
  [70.5, 25.7], // Barmer
  [69.5, 26.9], // Jaisalmer bulge
  [70.8, 27.9],
  [72.8, 29.1], // Bikaner
  [73.9, 30.1], // Ganganagar
  [74.5, 31.1], // Ferozepur
  [74.8, 32.0], // Amritsar
];

const SRI_LANKA_LON_LAT: [number, number][] = [
  [80.05, 9.8],
  [80.85, 8.9],
  [81.65, 7.7],
  [81.85, 6.9],
  [81.1, 6.05],
  [80.2, 5.95],
  [79.85, 6.95],
  [79.8, 8.2],
  [79.95, 9.2],
];

/**
 * Pre-renders a photorealistic monochrome LEO Earth globe sprite ONCE (820x820, 0ms per-frame cost!):
 * - ZERO wireframe grid lines!
 * - Silky zero-banding radial atmospheric limb glow
 * - Geographically accurate India & Sri Lanka coastlines (real WGS84 coordinates!)
 * - Soft swirling orbital cloud cover + glowing Indian metro city lights
 */
function getEarthSprite(): HTMLCanvasElement {
  if (cachedEarthSprite) return cachedEarthSprite;

  const size = EARTH_SPRITE_SIZE;
  const r = EARTH_SPRITE_R;
  const c = size * 0.5;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(42026);

  // 1. Silky continuous outer atmospheric halo (zero banding!)
  const halo = ctx.createRadialGradient(c, c, r - 3, c, c, r + 62);
  halo.addColorStop(0.0, 'rgba(255, 255, 255, 0.72)');
  halo.addColorStop(0.10, 'rgba(244, 244, 250, 0.34)');
  halo.addColorStop(0.28, 'rgba(218, 218, 230, 0.13)');
  halo.addColorStop(0.58, 'rgba(190, 190, 210, 0.035)');
  halo.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(c, c, r + 62, 0, Math.PI * 2);
  ctx.fill();

  // 2. Clipped spherical planetary body
  ctx.save();
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.clip();

  // Deep orbital ocean shading (sunlit charcoal-silver upper-right -> obsidian lower-left, zero grid!)
  const ocean = ctx.createRadialGradient(c + r * 0.32, c - r * 0.58, r * 0.08, c, c, r * 1.22);
  ocean.addColorStop(0.0, '#22222b');
  ocean.addColorStop(0.36, '#131319');
  ocean.addColorStop(0.75, '#0a0a0e');
  ocean.addColorStop(1.0, '#050507');
  ctx.fillStyle = ocean;
  ctx.fillRect(c - r, c - r, r * 2, r * 2);

  // Helper to trace real-coordinate geographic polygons smoothly onto the globe
  const drawGeoPolygon = (
    lonLatPts: [number, number][],
    fillA: number,
    strokeA: number,
    lineW = 1.25
  ) => {
    ctx.fillStyle = `rgba(235, 235, 244, ${fillA})`;
    ctx.strokeStyle = `rgba(255, 255, 255, ${strokeA})`;
    ctx.lineWidth = lineW;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    lonLatPts.forEach(([lon, lat], idx) => {
      const [nx, ny] = projectGeoToGlobe(lon, lat);
      const x = c + nx * r;
      const y = c + ny * r;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  // Accurate India + Sri Lanka!
  drawGeoPolygon(INDIA_LON_LAT, 0.16, 0.68, 1.3);
  drawGeoPolygon(SRI_LANKA_LON_LAT, 0.17, 0.62, 1.15);

  // Subtle soft orbital cloud wisps across the Indian Ocean & Bay of Bengal (keeping India clearly legible!)
  for (let cl = 0; cl < 20; cl++) {
    const cxPos = c + (rand() - 0.5) * r * 1.50;
    const cyPos = c - r * 0.42 - rand() * r * 0.52;
    const rw = 24 + rand() * 58;
    const rh = 6 + rand() * 14;
    const rot = (rand() - 0.5) * 0.55;
    const a = 0.05 + rand() * 0.09;

    ctx.save();
    ctx.translate(cxPos, cyPos);
    ctx.rotate(rot);
    const cg = ctx.createRadialGradient(0, 0, 1, 0, 0, rw);
    cg.addColorStop(0.0, `rgba(255, 255, 255, ${a})`);
    cg.addColorStop(0.55, `rgba(220, 220, 228, ${a * 0.4})`);
    cg.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
    ctx.scale(1, rh / rw);
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, 0, rw, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Real-coordinate Indian metro city-light clusters
  const cities: [number, number, number][] = [
    [77.59, 12.97, 2.8], // Bangalore
    [80.27, 13.08, 2.2], // Chennai
    [80.23, 13.72, 1.8], // Sriharikota
    [75.92, 14.46, 1.6], // Davanagere
    [78.48, 17.38, 2.2], // Hyderabad
    [72.88, 19.07, 2.6], // Mumbai
    [77.21, 28.61, 2.8], // Delhi NCR
    [88.36, 22.57, 2.2], // Kolkata
  ];
  for (const [lon, lat, cr] of cities) {
    const [nx, ny] = projectGeoToGlobe(lon, lat);
    const lx = c + nx * r;
    const ly = c + ny * r;
    const lg = ctx.createRadialGradient(lx, ly, 0.4, lx, ly, cr * 4.0);
    lg.addColorStop(0.0, 'rgba(255, 255, 255, 0.85)');
    lg.addColorStop(0.35, 'rgba(240, 240, 248, 0.28)');
    lg.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(lx, ly, cr * 4.0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft spherical limb inner atmospheric scatter
  const innerRim = ctx.createRadialGradient(c, c, r * 0.82, c, c, r);
  innerRim.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
  innerRim.addColorStop(0.74, 'rgba(220, 220, 232, 0.06)');
  innerRim.addColorStop(0.94, 'rgba(255, 255, 255, 0.24)');
  innerRim.addColorStop(1.0, 'rgba(255, 255, 255, 0.56)');
  ctx.fillStyle = innerRim;
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // End globe clip

  // Crisp 1.4px glowing atmospheric horizon line on top arc
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(c, c, r, Math.PI * 1.04, Math.PI * 1.96);
  ctx.stroke();

  cachedEarthSprite = canvas;
  return canvas;
}

function drawMonoMiniSat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  tiltRad: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tiltRad * 0.7);
  ctx.fillStyle = '#09090b';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
  ctx.lineWidth = 0.9;
  ctx.fillRect(-scale * 2.0, -scale * 0.38, scale * 1.4, scale * 0.76);
  ctx.strokeRect(-scale * 2.0, -scale * 0.38, scale * 1.4, scale * 0.76);
  ctx.fillRect(scale * 0.6, -scale * 0.38, scale * 1.4, scale * 0.76);
  ctx.strokeRect(scale * 0.6, -scale * 0.38, scale * 1.4, scale * 0.76);

  ctx.fillStyle = '#e4e4e7';
  ctx.fillRect(-scale * 0.45, -scale * 0.50, scale * 0.90, scale * 1.0);
  ctx.restore();
}

/**
 * Pure Monochrome Photorealistic Earth-to-Orbit Globe (sp 0.215 -> 1.000):
 * - Smoothly reveals the full shaded monochrome Earth globe (soft glowing atmosphere, ocean depth,
 *   accurate WGS84 India & Sri Lanka, orbital clouds, city lights) right below the climbing rocket
 *   as the launchpad recedes — ZERO bare wireframe horizon line cutting through trees or gantry!
 */
export function renderEarthAndOrbit(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, t, mouseX, mouseY, vehicleAnchorX, unit, reducedMotion } = frame;

  // Enters smoothly right as the rocket clears the launchpad & climbs above the coastal ground
  if (sp < 0.215) return;

  const baseEarthR = Math.max(w, h) * 0.58;
  // Keeps Earth's upper illuminated hemisphere + ALL of India generously visible above bottom HUD
  const leoTopY = Math.max(h * 0.56, h - baseEarthR * 0.48);

  const climbCurve = smoothstep(0.215, 0.480, sp);
  const earthFadeIn = smoothstep(0.215, 0.310, sp);

  // Smooth natural altitude zoom-out from wide upper-troposphere limb -> full 420 km LEO globe
  const earthR = baseEarthR * Math.pow(3.2, Math.pow(1 - climbCurve, 1.25));
  const terminalDrop = smoothstep(0.84, 1.0, sp) * baseEarthR * 0.06;
  // Starts cleanly low below the receding pad & rises smoothly into LEO framing
  const topLimbY = lerp(h * 0.86, leoTopY, climbCurve) + terminalDrop - mouseY * (2 + 4 * climbCurve);

  const leoCenterX = lerp(w * 0.62, vehicleAnchorX + unit * 0.15, 0.55);
  const centerX = lerp(vehicleAnchorX, leoCenterX, climbCurve) - mouseX * (5 + 5 * climbCurve);
  const centerY = topLimbY + earthR;

  const blrReticleAlpha = smoothstep(0.35, 0.47, sp);
  const orbitRingAlpha = smoothstep(0.36, 0.48, sp);

  const orbitAdvance = (sp - 0.35) * 3.0 + (reducedMotion ? 0 : t * 0.20);

  const satPos = (sat: OrbitalSatSpec, angle: number) => {
    const lx = Math.cos(angle) * earthR * sat.rxScale;
    const ly = Math.sin(angle) * earthR * sat.ryScale;
    const cosT = Math.cos(sat.tiltRad);
    const sinT = Math.sin(sat.tiltRad);
    return {
      x: centerX + lx * cosT - ly * sinT,
      y: centerY - earthR * 0.24 + lx * sinT + ly * cosT,
      isFront: Math.sin(angle) >= 0,
    };
  };

  ctx.save();
  ctx.globalAlpha = earthFadeIn;

  // 1. Back orbital trace arcs
  if (orbitRingAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = earthFadeIn * orbitRingAlpha;
    ctx.setLineDash([4, 4]);
    for (const sat of CONSTELLATION) {
      ctx.save();
      ctx.translate(centerX, centerY - earthR * 0.24);
      ctx.rotate(sat.tiltRad);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, earthR * sat.rxScale, earthR * sat.ryScale, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 2. Full Cached Photorealistic Monochrome Earth Globe Sprite (silky glowing atmosphere + shaded ocean + India!)
  const earthImg = getEarthSprite();
  const drawScale = earthR / EARTH_SPRITE_R;
  const drawSize = EARTH_SPRITE_SIZE * drawScale;
  ctx.drawImage(earthImg, centerX - drawSize * 0.5, centerY - drawSize * 0.5, drawSize, drawSize);

  // 4. BANGALORE ISRO GROUND STATION RETICLE (exact projected 12.97° N, 77.59° E!)
  if (blrReticleAlpha > 0.01) {
    const [blrNx, blrNy] = projectGeoToGlobe(77.59, 12.97);
    const blrX = centerX + blrNx * earthR;
    const blrY = centerY + blrNy * earthR;
    if (blrY < h - 32 && blrY > topLimbY) {
      ctx.save();
      ctx.globalAlpha = earthFadeIn * blrReticleAlpha;
      const pingWave = reducedMotion ? 0.35 : (t * 0.78) % 1.0;

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(blrX, blrY, unit * 0.075, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - pingWave) * 0.72})`;
      ctx.beginPath();
      ctx.arc(blrX, blrY, unit * (0.075 + pingWave * 0.24), 0, Math.PI * 2);
      ctx.stroke();

      const tick = unit * 0.12;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(blrX - tick, blrY);
      ctx.lineTo(blrX - unit * 0.04, blrY);
      ctx.moveTo(blrX + unit * 0.04, blrY);
      ctx.lineTo(blrX + tick, blrY);
      ctx.moveTo(blrX, blrY - tick);
      ctx.lineTo(blrX, blrY - unit * 0.04);
      ctx.moveTo(blrX, blrY + unit * 0.04);
      ctx.lineTo(blrX, blrY + tick);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(blrX, blrY, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = `600 ${Math.max(9, Math.round(unit * 0.08))}px "JetBrains Mono", monospace`;
      ctx.fillText('BLR // 12.97°N 77.59°E', blrX + unit * 0.15, blrY + 3);
      ctx.restore();
    }
  }

  // 5. Front orbital trace arcs & monochrome Keplerian satellites
  if (orbitRingAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = earthFadeIn * orbitRingAlpha;
    for (let i = 0; i < CONSTELLATION.length; i++) {
      const sat = CONSTELLATION[i];
      ctx.save();
      ctx.translate(centerX, centerY - earthR * 0.24);
      ctx.rotate(sat.tiltRad);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, earthR * sat.rxScale, earthR * sat.ryScale, 0, 0, Math.PI);
      ctx.stroke();
      ctx.restore();

      const angle = sat.phase + (i % 2 === 0 ? orbitAdvance : -orbitAdvance * 0.85);
      const pos = satPos(sat, angle);
      if (pos.isFront) {
        drawMonoMiniSat(ctx, pos.x, pos.y, Math.max(5, unit * 0.082), sat.tiltRad);
      }
    }
    ctx.restore();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}
