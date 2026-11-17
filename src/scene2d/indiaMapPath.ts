/**
 * Authentic high-precision normalized vector silhouette of India
 * derived directly from real (longitude, latitude) coordinates:
 *   x = (lon - 80) / 14,  y = -(lat - 22) / 15
 * Keeps the Kashmir crown, Gujarat peninsulas, Deccan triangle,
 * Sriharikota coast, and Northeast unmistakably recognizable in pure monochrome.
 */
export const INDIA_OUTLINE: readonly [number, number][] = [
  [-0.29, -0.90], // Ladakh / Northern Kashmir crown
  [-0.04, -0.83], // Eastern Ladakh
  [-0.07, -0.60], // Himachal / Uttarakhand
  [0.07, -0.43],  // Western UP / Nepal border
  [0.36, -0.32],  // Bihar / Nepal border
  [0.61, -0.40],  // Sikkim
  [0.75, -0.32],  // Assam / Bhutan border
  [1.18, -0.43],  // Arunachal Pradesh east
  [1.06, -0.17],  // Nagaland / Manipur
  [0.91, 0.00],   // Mizoram south tip
  [0.80, -0.17],  // Tripura / Meghalaya
  [0.63, 0.01],   // West Bengal / Sundarbans
  [0.41, 0.15],   // Odisha coast
  [0.23, 0.29],   // Visakhapatnam / Andhra coast
  [0.06, 0.41],   // Krishna Delta
  [0.02, 0.55],   // Sriharikota (SHAR)
  [0.02, 0.60],   // Chennai / Coromandel coast
  [-0.05, 0.85],  // Rameshwaram / Palk Strait
  [-0.18, 0.93],  // Kanyakumari southern tip
  [-0.27, 0.80],  // Kerala Malabar coast
  [-0.37, 0.61],  // Mangalore / Karnataka coast
  [-0.44, 0.44],  // Goa / Konkan coast
  [-0.51, 0.19],  // Mumbai coast
  [-0.53, 0.03],  // Gulf of Khambhat
  [-0.68, 0.08],  // Saurashtra / Kathiawar south
  [-0.79, -0.02], // Dwarka west tip
  [-0.69, -0.06], // Gulf of Kutch
  [-0.82, -0.12], // Rann of Kutch
  [-0.71, -0.33], // Rajasthan Thar border
  [-0.39, -0.64], // Punjab border
  [-0.43, -0.83], // Jammu & Kashmir west
];

export const SRI_LANKA_OUTLINE: readonly [number, number][] = [
  [0.00, 0.84],
  [0.10, 0.90],
  [0.13, 1.00],
  [0.05, 1.07],
  [-0.02, 1.01],
  [-0.03, 0.90],
];

export const INDIA_LANDMARKS = {
  /** Satish Dhawan Space Centre, Sriharikota (13.72°N, 80.23°E) */
  sriharikota: [0.02, 0.55] as const,
  /** Bangalore / PES University (12.97°N, 77.59°E) */
  bangalore: [-0.17, 0.60] as const,
  /** Davanagere Origins (14.46°N, 75.92°E) */
  davanagere: [-0.29, 0.50] as const,
};

/** Helper to trace India + Sri Lanka cleanly at (cx, cy) with scale `s` */
export function drawIndiaSilhouette(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  fillStyle: string,
  strokeStyle: string,
  lineWidth = 1.25
): void {
  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';

  // Mainland India
  ctx.beginPath();
  for (let i = 0; i < INDIA_OUTLINE.length; i++) {
    const [nx, ny] = INDIA_OUTLINE[i];
    const x = cx + nx * s;
    const y = cy + ny * s;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Sri Lanka
  ctx.beginPath();
  for (let i = 0; i < SRI_LANKA_OUTLINE.length; i++) {
    const [nx, ny] = SRI_LANKA_OUTLINE[i];
    const x = cx + nx * s;
    const y = cy + ny * s;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
