export type CameraMode = 'CINEMATIC' | 'BOOSTER' | 'CHASE';

export interface Scene2DFrameContext {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  /** Normalized scroll progress [0..1] */
  sp: number;
  /** Instantaneous scroll speed [0..4] */
  scrollSpeed: number;
  /** Elapsed time in seconds */
  t: number;
  /** Delta time in seconds (clamped <= 0.05) */
  dt: number;
  /** Normalized pointer offset [-1..1] for gentle parallax */
  mouseX: number;
  mouseY: number;
  /** Active aerospace camera framing */
  cameraMode: CameraMode;
  /** Holographic CAD blueprint wireframe overlay */
  blueprintMode: boolean;
  /** Horizontal anchor of the vehicle in CSS pixels (right half on desktop, center on mobile) */
  vehicleAnchorX: number;
  /** Vertical anchor of the launchpad ground plane in CSS pixels at sp=0 */
  groundY: number;
  /** Unified responsive scale unit (based on viewport height) */
  unit: number;
  /** Reduced motion preference */
  reducedMotion: boolean;
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const u = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return u * u * (3 - 2 * u);
}

export function easeOutCubic(t: number): number {
  const u = clamp(t, 0, 1);
  return 1 - Math.pow(1 - u, 3);
}

export function lerpRgb(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number
): string {
  const u = clamp(t, 0, 1);
  const r = Math.round(a[0] + (b[0] - a[0]) * u);
  const g = Math.round(a[1] + (b[1] - a[1]) * u);
  const bl = Math.round(a[2] + (b[2] - a[2]) * u);
  return `rgb(${r},${g},${bl})`;
}

/** Deterministic PRNG (Mulberry32) so flora, stars, and craters are reproducible and flicker-free */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
