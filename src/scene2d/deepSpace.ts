import {
  type Scene2DFrameContext,
  lerp,
  smoothstep,
} from './types';

const MOON_CRATERS = [
  { x: 0.22, y: -0.26, r: 0.16 },
  { x: 0.40, y: 0.04, r: 0.12 },
  { x: 0.14, y: 0.24, r: 0.09 },
  { x: 0.34, y: -0.44, r: 0.07 },
  { x: -0.10, y: 0.42, r: 0.11 },
  { x: 0.04, y: -0.08, r: 0.14 },
];

/**
 * Pure monochrome Black & White Deep Space Encounters (zero radial gradients, <0.1ms):
 * - Stage 03 (0.46 -> 0.73): Crisp monochrome Lunar disc + distant Earth dot
 * - Stage 04 (0.70 -> 0.91): Crisp monochrome Martian disc with Valles Marineris & polar cap
 * - Stage 05 (0.86 -> 1.00): Minimalist pinpoint Sun + Voyager sunbeam line + Pale Blue Dot
 */
export function renderDeepSpaceEncounters(frame: Scene2DFrameContext): void {
  const { ctx, w, h, sp, mouseX, mouseY, unit } = frame;

  ctx.save();

  // =========================================================================
  // 1. STAGE 03: MONOCHROME LUNAR FLYBY (0.46 -> 0.73)
  // =========================================================================
  if (sp >= 0.46 && sp <= 0.73) {
    const u = (sp - 0.46) / 0.27;
    const harmonic = Math.sin(u * Math.PI);
    const alpha = smoothstep(0.0, 0.14, u) * (1 - smoothstep(0.86, 1.0, u));

    if (alpha > 0.01) {
      const r = unit * (0.42 + harmonic * 1.05);
      const mx = lerp(w * 0.86, w * 0.78, u) - mouseX * 10;
      const my = lerp(h * 0.24, h * 0.34, u) - mouseY * 7;

      ctx.globalAlpha = alpha;

      // Obsidian night body + crisp sunlit white hemisphere
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, Math.PI * 2);
      ctx.clip();

      // Sunlit crescent side
      ctx.fillStyle = '#e4e4e7';
      ctx.beginPath();
      ctx.arc(mx + r * 0.28, my - r * 0.16, r * 0.96, 0, Math.PI * 2);
      ctx.fill();

      // Crisp geometric crater outlines
      ctx.strokeStyle = 'rgba(9, 9, 11, 0.45)';
      ctx.lineWidth = 1.1;
      for (const c of MOON_CRATERS) {
        ctx.beginPath();
        ctx.arc(mx + c.x * r, my + c.y * r, c.r * r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Crisp white lunar rim outline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, Math.PI * 2);
      ctx.stroke();

      // Technical lunar callout
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.font = `600 ${Math.max(9, Math.round(unit * 0.075))}px "JetBrains Mono", monospace`;
      ctx.fillText('LUNA // 384,400 KM', mx - r * 0.45, my + r + 16);
    }
  }

  // =========================================================================
  // 2. STAGE 04: MONOCHROME MARS ENCOUNTER (0.70 -> 0.91)
  // =========================================================================
  if (sp >= 0.70 && sp <= 0.91) {
    const v = (sp - 0.70) / 0.21;
    const harmonic = Math.sin(v * Math.PI);
    const alpha = smoothstep(0.0, 0.14, v) * (1 - smoothstep(0.86, 1.0, v));

    if (alpha > 0.01) {
      const r = unit * (0.40 + harmonic * 1.12);
      const mx = lerp(w * 0.86, w * 0.78, v) - mouseX * 10;
      const my = lerp(h * 0.25, h * 0.35, v) - mouseY * 7;

      ctx.globalAlpha = alpha;

      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, Math.PI * 2);
      ctx.clip();

      // Sunlit silver-graphite Martian hemisphere
      ctx.fillStyle = '#d4d4d8';
      ctx.beginPath();
      ctx.arc(mx + r * 0.26, my - r * 0.16, r * 0.96, 0, Math.PI * 2);
      ctx.fill();

      // North Polar Ice Cap (pure white)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(mx + r * 0.05, my - r * 0.88, r * 0.34, r * 0.14, 0.08, 0, Math.PI * 2);
      ctx.fill();

      // Valles Marineris equatorial canyon scar line
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(mx - r * 0.25, my + r * 0.06);
      ctx.quadraticCurveTo(mx + r * 0.05, my + r * 0.14, mx + r * 0.32, my + r * 0.08);
      ctx.stroke();

      ctx.restore();

      // Double atmospheric rim ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.80)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(mx, my, r + 7, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.font = `600 ${Math.max(9, Math.round(unit * 0.075))}px "JetBrains Mono", monospace`;
      ctx.fillText('MARS // 225M KM', mx - r * 0.42, my + r + 18);
    }
  }

  // =========================================================================
  // 3. STAGE 05: DISTANT PINPOINT SUN & PALE BLUE DOT (0.86 -> 1.00)
  // =========================================================================
  if (sp >= 0.86) {
    const alpha = smoothstep(0.86, 0.93, sp);
    const sunX = w * 0.84 - mouseX * 6;
    const sunY = h * 0.22 - mouseY * 5;
    const dotX = sunX + unit * 0.68;
    const dotY = sunY + unit * 0.34;

    ctx.globalAlpha = alpha;

    // Minimal pinpoint Sun reticle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 13, 0, Math.PI * 2);
    ctx.stroke();

    // Subtle Voyager diagonal sunbeam line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(dotX - unit * 0.25, dotY - unit * 0.85);
    ctx.lineTo(dotX + unit * 0.25, dotY + unit * 0.85);
    ctx.stroke();

    // Pinpoint Earth dot + label
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.68)';
    ctx.font = `500 ${Math.max(8, Math.round(unit * 0.072))}px "JetBrains Mono", monospace`;
    ctx.fillText('PALE BLUE DOT', dotX + 12, dotY + 3);
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}
