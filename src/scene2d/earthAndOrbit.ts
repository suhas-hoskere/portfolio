import {
  type Scene2DFrameContext,
  clamp,
  lerp,
  smoothstep,
  mulberry32,
} from './types';

interface OrbitalSatSpec {
  id: string;
  label: string;
  rxScale: number; // Semi-major axis multiplier of Earth radius
  ryScale: number; // Semi-minor axis (orbital inclination perspective)
  tiltRad: number; // Orbital plane tilt angle
  speed: number;
  phase: number;
  beaconColor: string;
  goldBus: boolean;
}

const CONSTELLATION: OrbitalSatSpec[] = [
  {
    id: 'cartosat',
    label: 'CARTOSAT-3',
    rxScale: 1.13,
    ryScale: 0.32,
    tiltRad: -0.22,
    speed: 0.24,
    phase: 0.85,
    beaconColor: '#38bdf8',
    goldBus: true,
  },
  {
    id: 'navic',
    label: 'NAVIC-1G',
    rxScale: 1.21,
    ryScale: 0.38,
    tiltRad: 0.19,
    speed: -0.19,
    phase: 2.35,
    beaconColor: '#f59e0b',
    goldBus: false,
  },
  {
    id: 'relay',
    label: 'IDRSS-RELAY',
    rxScale: 1.29,
    ryScale: 0.28,
    tiltRad: -0.09,
    speed: 0.16,
    phase: 4.15,
    beaconColor: '#10b981',
    goldBus: true,
  },
];

let cachedEarthDisc: HTMLCanvasElement | null = null;

/**
 * Lazily builds a crisp 440x440 pre-rendered 2.5D Earth hemisphere centered on India & the Indian Ocean:
 * - Sapphire ocean gradient with sunlit eastern specular glint
 * - Crisp Indian Subcontinent, Sri Lanka, Arabian Peninsula & Southeast Asia landmasses
 * - Snow-capped Himalayan arc + emerald Western Ghats + Deccan plateau relief
 * - Delicate swirling tropical cloud bands
 * - Realistic day/night solar terminator with glowing golden Indian metropolitan night lights
 */
function getEarthDiscCanvas(): HTMLCanvasElement {
  if (cachedEarthDisc) return cachedEarthDisc;

  const size = 440;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.46;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(19470815);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // 1. Deep Sapphire Indian Ocean with Oblique Sunlight Specular Glint (upper-right sun)
  const oceanGrad = ctx.createRadialGradient(
    cx + r * 0.34,
    cy - r * 0.32,
    r * 0.05,
    cx,
    cy,
    r * 1.15
  );
  oceanGrad.addColorStop(0.0, '#1d6fa5');
  oceanGrad.addColorStop(0.32, '#0d4a84');
  oceanGrad.addColorStop(0.68, '#082c5c');
  oceanGrad.addColorStop(1.0, '#04122b');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, size, size);

  // Subtle sun-glint sheen on the Bay of Bengal & Indian Ocean
  const glintGrad = ctx.createRadialGradient(
    cx + r * 0.28,
    cy - r * 0.16,
    0,
    cx + r * 0.28,
    cy - r * 0.16,
    r * 0.52
  );
  glintGrad.addColorStop(0.0, 'rgba(186, 230, 253, 0.24)');
  glintGrad.addColorStop(0.55, 'rgba(56, 189, 248, 0.07)');
  glintGrad.addColorStop(1.0, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = glintGrad;
  ctx.fillRect(0, 0, size, size);

  // Helper to draw organic geographic polygons in normalized globe space [-1..1]
  const drawLand = (pts: [number, number][], fill: string | CanvasGradient, stroke?: string) => {
    ctx.beginPath();
    pts.forEach(([nx, ny], idx) => {
      const x = cx + nx * r;
      const y = cy + ny * r;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }
  };

  // 2. Arabian Peninsula & Iran (Northwest sunlit arid landmass)
  const arabGrad = ctx.createLinearGradient(cx - r * 0.85, cy - r * 0.65, cx - r * 0.2, cy - r * 0.1);
  arabGrad.addColorStop(0, '#856b48');
  arabGrad.addColorStop(1, '#a9895b');
  drawLand(
    [
      [-0.86, -0.58],
      [-0.45, -0.68],
      [-0.24, -0.52],
      [-0.36, -0.32],
      [-0.56, -0.18],
      [-0.78, -0.32],
    ],
    arabGrad,
    'rgba(56, 189, 248, 0.22)'
  );

  // 3. Eurasian / Tibetan Plateau & Himalayan Northern Arc
  const asiaGrad = ctx.createLinearGradient(cx - r * 0.4, cy - r * 0.95, cx + r * 0.7, cy - r * 0.25);
  asiaGrad.addColorStop(0, '#5a634b');
  asiaGrad.addColorStop(0.45, '#7e795e');
  asiaGrad.addColorStop(1, '#3d6b47');
  drawLand(
    [
      [-0.48, -0.78],
      [-0.08, -0.95],
      [0.52, -0.84],
      [0.86, -0.45],
      [0.72, -0.18],
      [0.44, -0.28],
      [0.26, -0.46],
      [-0.18, -0.56],
    ],
    asiaGrad,
    'rgba(56, 189, 248, 0.18)'
  );

  // 4. INDIAN SUBCONTINENT (Hero geographic anchor — lush Western Ghats, Deccan plateau & coastal plains)
  const indiaGrad = ctx.createLinearGradient(cx - r * 0.15, cy - r * 0.55, cx + r * 0.25, cy + r * 0.15);
  indiaGrad.addColorStop(0.0, '#6a7a4a'); // Northern Indo-Gangetic fertile plains
  indiaGrad.addColorStop(0.42, '#7d7849'); // Deccan ochre highlands
  indiaGrad.addColorStop(0.75, '#3b7444'); // Lush Karnataka & Western Ghats
  indiaGrad.addColorStop(1.0, '#2e663b');  // Southern coastal green
  drawLand(
    [
      [-0.18, -0.56], // Gujarat / Rajasthan border
      [0.02, -0.64],  // Kashmir / Himachal
      [0.24, -0.52],  // Himalayan foothills / Nepal-Assam
      [0.34, -0.34],  // Bengal / Odisha coast
      [0.19, -0.16],  // Andhra / Sriharikota coast
      [0.11, 0.02],   // Tamil Nadu / Kanyakumari tip
      [0.02, 0.04],   // Southern Cape
      [-0.06, -0.14], // Kerala / Karnataka Malabar coast
      [-0.14, -0.34], // Maharashtra / Konkan coast
      [-0.24, -0.42], // Saurashtra / Gujarat peninsula
    ],
    indiaGrad,
    'rgba(125, 211, 252, 0.30)'
  );

  // Sri Lanka emerald teardrop island
  drawLand(
    [
      [0.14, 0.06],
      [0.19, 0.09],
      [0.17, 0.16],
      [0.12, 0.13],
    ],
    '#2f6f3e'
  );

  // Southeast Asia / Malay Peninsula & Sumatra arc (east rim)
  drawLand(
    [
      [0.44, -0.28],
      [0.64, -0.22],
      [0.62, 0.05],
      [0.52, 0.12],
      [0.46, -0.06],
    ],
    '#346b42',
    'rgba(56, 189, 248, 0.2)'
  );

  // Snow-capped Himalayan arc highlighting northern India
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.72)';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.05, cy - r * 0.62);
  ctx.quadraticCurveTo(cx + r * 0.16, cy - r * 0.56, cx + r * 0.36, cy - r * 0.44);
  ctx.stroke();

  // 5. Delicate swirling atmospheric cloud bands across the Indian Ocean & tropics
  ctx.fillStyle = 'rgba(248, 252, 255, 0.32)';
  for (let c = 0; c < 18; c++) {
    const bx = cx + (rand() - 0.5) * r * 1.65;
    const by = cy + (rand() - 0.5) * r * 1.45;
    const bw = 22 + rand() * 56;
    const bh = 5 + rand() * 11;
    const rot = (rand() - 0.5) * 0.45;

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(rot);
    const cg = ctx.createRadialGradient(0, 0, 2, 0, 0, bw * 0.6);
    cg.addColorStop(0.0, 'rgba(255, 255, 255, 0.42)');
    cg.addColorStop(0.6, 'rgba(230, 244, 255, 0.18)');
    cg.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.ellipse(0, 0, bw * 0.6, bh * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 6. Solar Terminator Shadow (Western limb fades softly into orbital night)
  const termGrad = ctx.createRadialGradient(
    cx + r * 0.42,
    cy - r * 0.36,
    r * 0.45,
    cx + r * 0.15,
    cy - r * 0.10,
    r * 1.25
  );
  termGrad.addColorStop(0.0, 'rgba(2, 6, 23, 0)');
  termGrad.addColorStop(0.58, 'rgba(2, 6, 23, 0.14)');
  termGrad.addColorStop(0.84, 'rgba(2, 6, 23, 0.66)');
  termGrad.addColorStop(1.0, 'rgba(2, 6, 23, 0.92)');
  ctx.fillStyle = termGrad;
  ctx.fillRect(0, 0, size, size);

  // 7. Subtle Warm Golden Metropolitan Night Lights along western India & Arabian coast
  const cities: [number, number, number][] = [
    [-0.12, -0.32, 3.2], // Mumbai
    [-0.02, -0.48, 3.0], // Delhi NCR
    [0.04, -0.14, 3.5],  // Bangalore
    [0.14, -0.14, 2.6],  // Chennai
    [0.06, -0.24, 2.5],  // Hyderabad
    [-0.52, -0.36, 2.6], // Dubai / Gulf
  ];
  for (const [nx, ny, cr] of cities) {
    const x = cx + nx * r;
    const y = cy + ny * r;
    const lg = ctx.createRadialGradient(x, y, 0, x, y, cr * 2.4);
    lg.addColorStop(0.0, 'rgba(255, 232, 158, 0.88)');
    lg.addColorStop(0.5, 'rgba(251, 191, 36, 0.32)');
    lg.addColorStop(1.0, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(x, y, cr * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 8. Inner Rayleigh Surface Atmospheric Rim Glow on sunlit top-right limb
  const rimGrad = ctx.createRadialGradient(cx, cy, r * 0.80, cx, cy, r);
  rimGrad.addColorStop(0.0, 'rgba(56, 189, 248, 0)');
  rimGrad.addColorStop(0.75, 'rgba(56, 189, 248, 0.28)');
  rimGrad.addColorStop(1.0, 'rgba(186, 230, 253, 0.72)');
  ctx.fillStyle = rimGrad;
  ctx.fillRect(0, 0, size, size);

  ctx.restore();
  cachedEarthDisc = canvas;
  return canvas;
}

/** Draws a miniature detailed Keplerian satellite (Cartosat / NavIC / Relay) */
function drawMiniSatellite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  sat: OrbitalSatSpec,
  t: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sat.tiltRad * 0.7);

  // Twin photovoltaic solar wings
  ctx.fillStyle = '#1d4ed8';
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 0.8;
  ctx.fillRect(-scale * 2.1, -scale * 0.42, scale * 1.45, scale * 0.84);
  ctx.strokeRect(-scale * 2.1, -scale * 0.42, scale * 1.45, scale * 0.84);
  ctx.fillRect(scale * 0.65, -scale * 0.42, scale * 1.45, scale * 0.84);
  ctx.strokeRect(scale * 0.65, -scale * 0.42, scale * 1.45, scale * 0.84);

  // Central MLI gold or white bus
  ctx.fillStyle = sat.goldBus ? '#f59e0b' : '#e2e8f0';
  ctx.fillRect(-scale * 0.52, -scale * 0.56, scale * 1.04, scale * 1.12);

  // Pulsing telemetry beacon LED
  const blink = 0.45 + 0.55 * Math.sin(t * 4.2 + sat.phase);
  const bg = ctx.createRadialGradient(0, -scale * 0.65, 0, 0, -scale * 0.65, scale * 1.4);
  bg.addColorStop(0.0, sat.beaconColor);
  bg.addColorStop(1.0, 'rgba(56, 189, 248, 0)');
  ctx.globalAlpha *= blink;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(0, -scale * 0.65, scale * 1.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Renders Stage 02 Low Earth Orbit (sp 0.320 -> 0.515):
 * - Majestic curved Earth horizon rising from below & receding before Stage 03 Moon
 * - Outer Rayleigh blue atmospheric limb halo
 * - Pulsing Bangalore ISRO Telemetry Ground Station Reticle (12.97° N, 77.59° E)
 * - 3 Keplerian Orbital Satellites with front/back depth-sorted orbital trace arcs
 */
export function renderEarthAndOrbit(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, t, mouseX, mouseY, vehicleAnchorX, unit, reducedMotion } = frame;

  // Strictly active in Stage 02 LEO window (0.315 -> 0.518) so zero RAM/CPU used elsewhere
  if (sp < 0.315 || sp > 0.518) return;

  // Smooth fade-in (0.315 -> 0.365) and depart fade-out (0.472 -> 0.518)
  const fadeIn = smoothstep(0.315, 0.365, sp);
  const fadeOut = 1 - smoothstep(0.472, 0.518, sp);
  const opacity = fadeIn * fadeOut;
  if (opacity < 0.008) return;

  // Majestic horizon rise from below viewport & smooth sink before Lunar flyby
  const earthR = Math.max(w, h) * 0.56;
  const centerX = lerp(w * 0.58, vehicleAnchorX + unit * 0.45, 0.55) - mouseX * 16;

  let centerY = h + earthR * 0.54;
  if (sp < 0.365) {
    centerY = lerp(h + earthR * 1.15, h + earthR * 0.54, fadeIn);
  } else if (sp > 0.472) {
    centerY = lerp(h + earthR * 0.54, h + earthR * 1.22, 1 - fadeOut);
  }
  centerY -= mouseY * 10;

  const earthCanvas = getEarthDiscCanvas();

  // Helper to compute satellite position along its tilted Keplerian ellipse
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

  // 1. BACK HALF OF KEPLERIAN ORBITAL TRACES & SATELLITES BEHIND EARTH
  for (const sat of CONSTELLATION) {
    ctx.save();
    ctx.translate(centerX, centerY - earthR * 0.24);
    ctx.rotate(sat.tiltRad);
    ctx.strokeStyle = sat.beaconColor;
    ctx.globalAlpha = opacity * 0.14;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.ellipse(0, 0, earthR * sat.rxScale, earthR * sat.ryScale, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const angle = sat.phase + (reducedMotion ? 0 : t * sat.speed);
    const pos = satPos(sat, angle);
    if (!pos.isFront) {
      ctx.globalAlpha = opacity * 0.75;
      drawMiniSatellite(ctx, pos.x, pos.y, Math.max(4.5, unit * 0.075), sat, t);
    }
  }

  // 2. OUTER RAYLEIGH SCATTERING ATMOSPHERIC HALO
  ctx.globalAlpha = opacity;
  const haloR = earthR * 1.14;
  const haloGrad = ctx.createRadialGradient(centerX, centerY, earthR * 0.94, centerX, centerY, haloR);
  haloGrad.addColorStop(0.0, 'rgba(56, 189, 248, 0.62)');
  haloGrad.addColorStop(0.35, 'rgba(14, 165, 233, 0.26)');
  haloGrad.addColorStop(0.75, 'rgba(3, 105, 161, 0.06)');
  haloGrad.addColorStop(1.0, 'rgba(3, 105, 161, 0)');
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, haloR, 0, Math.PI * 2);
  ctx.fill();

  // 3. PHOTOREALISTIC 2.5D EARTH GLOBE (Subtle slow planetary rotation)
  const drawSize = (earthR / 0.46) * 2;
  const rotAngle = reducedMotion ? 0 : Math.sin(t * 0.03) * 0.04;
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotAngle);
  ctx.globalAlpha = opacity;
  ctx.drawImage(earthCanvas, -drawSize * 0.5, -drawSize * 0.5, drawSize, drawSize);
  ctx.restore();

  // 4. BANGALORE ISRO TELEMETRY GROUND STATION RETICLE (12.97° N, 77.59° E)
  // Positioned right on Karnataka's sunlit Deccan coast on the upper visible Earth arc
  const blrX = centerX + earthR * 0.04;
  const blrY = centerY - earthR * 0.62;
  if (blrY < h + 40) {
    const pingWave = reducedMotion ? 0.35 : (t * 0.8) % 1.0;
    const pingR = unit * (0.09 + pingWave * 0.32);

    ctx.save();
    // Expanding radar telemetry ping ring
    ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - pingWave) * opacity * 0.85})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(blrX, blrY, pingR, 0, Math.PI * 2);
    ctx.stroke();

    // Precision inner target reticle ring + crosshairs
    ctx.strokeStyle = `rgba(125, 211, 252, ${opacity * 0.92})`;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.arc(blrX, blrY, unit * 0.085, 0, Math.PI * 2);
    ctx.stroke();

    const tick = unit * 0.14;
    ctx.beginPath();
    ctx.moveTo(blrX - tick, blrY);
    ctx.lineTo(blrX - unit * 0.05, blrY);
    ctx.moveTo(blrX + unit * 0.05, blrY);
    ctx.lineTo(blrX + tick, blrY);
    ctx.moveTo(blrX, blrY - tick);
    ctx.lineTo(blrX, blrY - unit * 0.05);
    ctx.moveTo(blrX, blrY + unit * 0.05);
    ctx.lineTo(blrX, blrY + tick);
    ctx.stroke();

    // Glowing Bangalore core pin
    ctx.fillStyle = `rgba(186, 230, 253, ${opacity})`;
    ctx.beginPath();
    ctx.arc(blrX, blrY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Crisp micro aerospace telemetry callout
    ctx.fillStyle = `rgba(186, 230, 253, ${opacity * 0.88})`;
    ctx.font = `600 ${Math.max(9, Math.round(unit * 0.085))}px "JetBrains Mono", monospace`;
    ctx.fillText('BLR // 12.97°N 77.59°E', blrX + unit * 0.16, blrY + 3);
    ctx.restore();
  }

  // 5. FRONT HALF OF KEPLERIAN ORBITAL TRACES & SATELLITES IN FRONT OF EARTH
  for (const sat of CONSTELLATION) {
    ctx.save();
    ctx.translate(centerX, centerY - earthR * 0.24);
    ctx.rotate(sat.tiltRad);
    ctx.strokeStyle = sat.beaconColor;
    ctx.globalAlpha = opacity * 0.28;
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.ellipse(0, 0, earthR * sat.rxScale, earthR * sat.ryScale, 0, 0, Math.PI);
    ctx.stroke();
    ctx.restore();

    const angle = sat.phase + (reducedMotion ? 0 : t * sat.speed);
    const pos = satPos(sat, angle);
    if (pos.isFront) {
      ctx.globalAlpha = clamp(opacity, 0, 1);
      drawMiniSatellite(ctx, pos.x, pos.y, Math.max(5.5, unit * 0.095), sat, t);
    }
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}
