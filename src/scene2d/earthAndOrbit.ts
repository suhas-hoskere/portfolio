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

// Wide orbital trajectories so satellites sweep cleanly across and beyond viewport edges
const CONSTELLATION: OrbitalSatSpec[] = [
  { rxScale: 1.24, ryScale: 0.32, tiltRad: -0.20, phase: 0.72 },
  { rxScale: 1.38, ryScale: 0.38, tiltRad: 0.16, phase: 2.35 },
  { rxScale: 1.52, ryScale: 0.28, tiltRad: -0.07, phase: 4.15 },
];

let cachedEarthSprite: HTMLCanvasElement | null = null;
const EARTH_SPRITE_SIZE = 780;
const EARTH_SPRITE_R = 328; // leaves 62px silky outer atmospheric glow margin on all sides!

/**
 * Pre-renders a photorealistic monochrome LEO Earth globe sprite ONCE (780x780, 0ms per-frame cost!):
 * - Silky zero-banding radial atmospheric limb glow
 * - Spherical sunlit-to-night obsidian lighting matching the upper-right Sun
 * - High-fidelity Indian Subcontinent, Sri Lanka, Arabian Peninsula & SE Asia coastlines
 * - Swirling monochrome orbital cloud bands across Indian Ocean & Bay of Bengal
 * - Subtle illuminated Indian metro city-light clusters (BLR, MAA, BOM, HYD, DEL, SHAR)
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
  const halo = ctx.createRadialGradient(c, c, r - 3, c, c, r + 58);
  halo.addColorStop(0.0, 'rgba(255, 255, 255, 0.72)');
  halo.addColorStop(0.10, 'rgba(244, 244, 250, 0.34)');
  halo.addColorStop(0.28, 'rgba(218, 218, 230, 0.13)');
  halo.addColorStop(0.58, 'rgba(190, 190, 210, 0.035)');
  halo.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(c, c, r + 58, 0, Math.PI * 2);
  ctx.fill();

  // 2. Clipped spherical planetary body
  ctx.save();
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.clip();

  // Deep orbital ocean shading (sunlit charcoal-silver upper-right -> deep obsidian lower-left)
  const ocean = ctx.createRadialGradient(c + r * 0.32, c - r * 0.58, r * 0.08, c, c, r * 1.22);
  ocean.addColorStop(0.0, '#202028');
  ocean.addColorStop(0.38, '#121218');
  ocean.addColorStop(0.75, '#0a0a0e');
  ocean.addColorStop(1.0, '#050507');
  ctx.fillStyle = ocean;
  ctx.fillRect(c - r, c - r, r * 2, r * 2);

  // Delicate latitude & longitude orbital graticule
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.055)';
  ctx.lineWidth = 1;
  for (let lat = -3; lat <= 3; lat++) {
    const ly = c + (lat / 4) * r;
    ctx.beginPath();
    ctx.moveTo(c - r, ly);
    ctx.lineTo(c + r, ly);
    ctx.stroke();
  }
  for (let lon = -3; lon <= 3; lon++) {
    const rx = Math.abs((lon / 4) * r);
    ctx.beginPath();
    ctx.ellipse(c, c, Math.max(8, rx), r, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Helper to trace geographic polygons normalized to [-1..1] globe coordinates
  const drawLand = (pts: [number, number][], fillA: number, strokeA: number) => {
    ctx.fillStyle = `rgba(235, 235, 242, ${fillA})`;
    ctx.strokeStyle = `rgba(255, 255, 255, ${strokeA})`;
    ctx.lineWidth = 1.15;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pts.forEach(([nx, ny], idx) => {
      const x = c + nx * r;
      const y = c + ny * r;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  // Accurate high-detail Indian Subcontinent & Himalayan Arc (framed cleanly in visible upper LEO arc)
  const indiaPts: [number, number][] = [
    [-0.10, -0.98], // Ladakh / Kashmir NW
    [-0.01, -0.99], // Karakoram
    [0.06, -0.95],  // Himachal / Uttarakhand
    [0.14, -0.91],  // Nepal border
    [0.23, -0.89],  // Sikkim / Bhutan
    [0.32, -0.90],  // Arunachal
    [0.35, -0.86],  // Nagaland / Manipur
    [0.30, -0.82],  // Mizoram / Tripura
    [0.24, -0.83],  // Meghalaya
    [0.21, -0.79],  // West Bengal / Sundarbans
    [0.16, -0.74],  // Odisha coast
    [0.12, -0.69],  // Visakhapatnam / Andhra
    [0.09, -0.64],  // Sriharikota / Chennai coast
    [0.07, -0.58],  // Tamil Nadu / Rameshwaram
    [0.03, -0.54],  // Kanyakumari tip
    [-0.01, -0.58], // Kerala / Kochi
    [-0.04, -0.64], // Mangalore / Karnataka coast
    [-0.07, -0.70], // Goa / Konkan
    [-0.09, -0.76], // Mumbai
    [-0.13, -0.78], // Gulf of Khambhat / Saurashtra
    [-0.19, -0.80], // Gujarat / Kutch
    [-0.16, -0.84], // Rajasthan Thar
    [-0.13, -0.90], // Punjab
    [-0.14, -0.94], // Jammu
  ];
  drawLand(indiaPts, 0.14, 0.56);

  // Sri Lanka
  const sriLankaPts: [number, number][] = [
    [0.08, -0.55],
    [0.11, -0.52],
    [0.10, -0.48],
    [0.07, -0.49],
    [0.06, -0.52],
  ];
  drawLand(sriLankaPts, 0.15, 0.52);

  // Subtle Arabian Peninsula flank (west limb context)
  const arabiaPts: [number, number][] = [
    [-0.64, -0.82],
    [-0.46, -0.84],
    [-0.35, -0.77],
    [-0.39, -0.66],
    [-0.53, -0.62],
    [-0.68, -0.70],
  ];
  drawLand(arabiaPts, 0.06, 0.22);

  // Subtle Myanmar / Malay Peninsula flank (east limb context)
  const seAsiaPts: [number, number][] = [
    [0.34, -0.83],
    [0.49, -0.79],
    [0.55, -0.65],
    [0.47, -0.55],
    [0.42, -0.63],
    [0.36, -0.72],
  ];
  drawLand(seAsiaPts, 0.06, 0.22);

  // Swirling monochrome orbital cloud bands across Indian Ocean, Bay of Bengal & Himalayas
  for (let cl = 0; cl < 26; cl++) {
    const cxPos = c + (rand() - 0.5) * r * 1.55;
    const cyPos = c - r * 0.35 - rand() * r * 0.62;
    const rw = 26 + rand() * 68;
    const rh = 7 + rand() * 18;
    const rot = (rand() - 0.5) * 0.65;
    const a = 0.07 + rand() * 0.13;

    ctx.save();
    ctx.translate(cxPos, cyPos);
    ctx.rotate(rot);
    const cg = ctx.createRadialGradient(0, 0, 1, 0, 0, rw);
    cg.addColorStop(0.0, `rgba(255, 255, 255, ${a})`);
    cg.addColorStop(0.55, `rgba(220, 220, 228, ${a * 0.45})`);
    cg.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
    ctx.scale(1, rh / rw);
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, 0, rw, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Subtle glowing city-light clusters across India (Bangalore, Chennai, Sriharikota, Mumbai, Hyderabad, Delhi)
  const cities: [number, number, number][] = [
    [0.03, -0.64, 3.0],  // Bangalore
    [0.08, -0.64, 2.4],  // Chennai
    [0.09, -0.66, 2.0],  // Sriharikota
    [0.04, -0.70, 2.4],  // Hyderabad
    [-0.08, -0.75, 2.8], // Mumbai
    [-0.01, -0.88, 3.0], // Delhi NCR
    [0.19, -0.79, 2.4],  // Kolkata
    [-0.02, -0.67, 1.7], // Davanagere
  ];
  for (const [nx, ny, cr] of cities) {
    const lx = c + nx * r;
    const ly = c + ny * r;
    const lg = ctx.createRadialGradient(lx, ly, 0.4, lx, ly, cr * 4.2);
    lg.addColorStop(0.0, 'rgba(255, 255, 255, 0.85)');
    lg.addColorStop(0.35, 'rgba(240, 240, 248, 0.30)');
    lg.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(lx, ly, cr * 4.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft spherical limb inner atmospheric scatter (brightens the sunlit upper edge naturally)
  const innerRim = ctx.createRadialGradient(c, c, r * 0.80, c, c, r);
  innerRim.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
  innerRim.addColorStop(0.72, 'rgba(220, 220, 232, 0.06)');
  innerRim.addColorStop(0.94, 'rgba(255, 255, 255, 0.24)');
  innerRim.addColorStop(1.0, 'rgba(255, 255, 255, 0.58)');
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
 * Pure Monochrome Continuous Earth-to-Orbit Horizon (sp 0.162 -> 1.000):
 * - Smoothly zooms out from flat Sriharikota ground into a cached photorealistic monochrome LEO Earth globe
 *   (accurate India coastline, swirling clouds, twinkling city lights, silky zero-banding atmosphere glow).
 * - Earth stays ALWAYS visible beneath the vehicle from 0% to 100%!
 */
export function renderEarthAndOrbit(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, t, mouseX, mouseY, vehicleAnchorX, groundY, unit, reducedMotion } = frame;

  if (sp < 0.162) return;

  const baseHorizonY = groundY - unit * 0.24;
  const baseEarthR = Math.max(w, h) * 0.56;
  const leoTopY = Math.max(h * 0.62, h - baseEarthR * 0.44);

  const zoomOut = smoothstep(0.170, 0.480, sp);
  const earthFadeIn = smoothstep(0.162, 0.195, sp);

  // Smooth exponential curvature zoom-out from near-flat ground -> full orbital Earth curve
  const earthR = baseEarthR * Math.pow(8.6, Math.pow(1 - zoomOut, 1.25));
  const terminalDrop = smoothstep(0.84, 1.0, sp) * baseEarthR * 0.06;
  const topLimbY = lerp(baseHorizonY, leoTopY, zoomOut) + terminalDrop - mouseY * (2 + 4 * zoomOut);

  const leoCenterX = lerp(w * 0.58, vehicleAnchorX + unit * 0.35, 0.52);
  const centerX = lerp(vehicleAnchorX, leoCenterX, zoomOut) - mouseX * (5 + 5 * zoomOut);
  const centerY = topLimbY + earthR;

  const atmoGlow = smoothstep(0.19, 0.42, sp);
  const globeDetailAlpha = smoothstep(0.24, 0.44, sp);
  const blrReticleAlpha = smoothstep(0.32, 0.46, sp);
  const orbitRingAlpha = smoothstep(0.34, 0.48, sp);

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

  // 2. Seamless early-ascent dark Earth horizon arc (visible from 0.162 -> 0.46 while sprite cross-fades in)
  if (globeDetailAlpha < 0.99) {
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthR, 0, Math.PI * 2);
    ctx.fill();

    // Soft atmospheric rim line intensifying smoothly before cached globe takes over
    ctx.strokeStyle = `rgba(255, 255, 255, ${lerp(0.16, 0.72, atmoGlow)})`;
    ctx.lineWidth = lerp(1.0, 1.5, zoomOut);
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthR, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  }

  // 3. Cached Photorealistic Monochrome LEO Earth Globe Sprite (0ms per-frame cost, zero banding!)
  if (globeDetailAlpha > 0.01) {
    const earthImg = getEarthSprite();
    const drawScale = earthR / EARTH_SPRITE_R;
    const drawSize = EARTH_SPRITE_SIZE * drawScale;
    ctx.save();
    ctx.globalAlpha = earthFadeIn * globeDetailAlpha;
    ctx.drawImage(earthImg, centerX - drawSize * 0.5, centerY - drawSize * 0.5, drawSize, drawSize);
    ctx.restore();
  }

  // 4. BANGALORE ISRO GROUND STATION RETICLE (12.97° N, 77.59° E) + PULSING RADAR PING
  if (blrReticleAlpha > 0.01) {
    const blrX = centerX + earthR * 0.03;
    const blrY = centerY - earthR * 0.64;
    if (blrY < h + 40 && blrY > topLimbY) {
      ctx.save();
      ctx.globalAlpha = earthFadeIn * blrReticleAlpha;
      const pingWave = reducedMotion ? 0.35 : (t * 0.78) % 1.0;

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(blrX, blrY, unit * 0.08, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - pingWave) * 0.72})`;
      ctx.beginPath();
      ctx.arc(blrX, blrY, unit * (0.08 + pingWave * 0.26), 0, Math.PI * 2);
      ctx.stroke();

      const tick = unit * 0.13;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(blrX - tick, blrY);
      ctx.lineTo(blrX - unit * 0.042, blrY);
      ctx.moveTo(blrX + unit * 0.042, blrY);
      ctx.lineTo(blrX + tick, blrY);
      ctx.moveTo(blrX, blrY - tick);
      ctx.lineTo(blrX, blrY - unit * 0.042);
      ctx.moveTo(blrX, blrY + unit * 0.042);
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

  // 5. Front orbital trace arcs & wide-sweeping monochrome Keplerian satellites
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
