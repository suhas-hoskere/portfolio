import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// ============================================================================
// PROCEDURAL HIGH-RESOLUTION FOLIAGE & BARK TEXTURES
// ============================================================================

let cachedCasuarinaTexture: THREE.CanvasTexture | null = null;
function getCachedCasuarinaTexture(): THREE.CanvasTexture {
  if (cachedCasuarinaTexture) return cachedCasuarinaTexture;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  // Central woody branchlet
  ctx.strokeStyle = '#362215';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, 30);
  ctx.lineTo(cx, size - 30);
  ctx.stroke();

  // Fine drooping feathery needles (cladodes)
  for (let i = 0; i < 220; i++) {
    const y = 40 + (i / 220) * (size - 80);
    const side = i % 2 === 0 ? 1 : -1;
    const len = 40 + Math.sin((i / 220) * Math.PI) * 80 + ((i * 17) % 25);
    const droop = 20 + ((i * 13) % 40);

    const grad = ctx.createLinearGradient(cx, y, cx + side * len, y + droop);
    grad.addColorStop(0, '#2d4734');
    grad.addColorStop(0.65, '#3b5c42');
    grad.addColorStop(1, 'rgba(85, 125, 80, 0.7)');

    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.quadraticCurveTo(cx + side * (len * 0.5), y + droop * 0.25, cx + side * len, y + droop);
    ctx.stroke();
  }

  cachedCasuarinaTexture = new THREE.CanvasTexture(canvas);
  cachedCasuarinaTexture.wrapS = THREE.ClampToEdgeWrapping;
  cachedCasuarinaTexture.wrapT = THREE.ClampToEdgeWrapping;
  return cachedCasuarinaTexture;
}

let cachedCoconutFrondTexture: THREE.CanvasTexture | null = null;
function getCachedCoconutFrondTexture(): THREE.CanvasTexture {
  if (cachedCoconutFrondTexture) return cachedCoconutFrondTexture;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Central arching rachis
  const pts: [number, number][] = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const x = 30 + t * (size - 60);
    const y = size - 50 - Math.sin(t * Math.PI) * 220 + t * 90;
    pts.push([x, y]);
  }

  // Radiating drooping pinnate leaflets
  for (let i = 4; i < pts.length - 4; i++) {
    const t = i / pts.length;
    const [px, py] = pts[i];
    const dx = pts[i + 1][0] - pts[i - 1][0];
    const dy = pts[i + 1][1] - pts[i - 1][1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    const leafletLen = Math.sin(t * Math.PI) * 85 + 28;

    for (const side of [-1, 1]) {
      const tipX = px + nx * side * leafletLen;
      const tipY = py + ny * side * leafletLen + 35 * t;

      const grad = ctx.createLinearGradient(px, py, tipX, tipY);
      grad.addColorStop(0, '#2e6328');
      grad.addColorStop(0.7, '#428033');
      grad.addColorStop(1, 'rgba(85, 140, 55, 0.8)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px + nx * side * (leafletLen * 0.5), py + ny * side * (leafletLen * 0.3) + 10, tipX, tipY);
      ctx.stroke();
    }
  }

  // Draw main woody rachis spine
  ctx.strokeStyle = '#6d4c2a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.stroke();

  cachedCoconutFrondTexture = new THREE.CanvasTexture(canvas);
  return cachedCoconutFrondTexture;
}

let cachedPalmyraTexture: THREE.CanvasTexture | null = null;
function getCachedPalmyraTexture(): THREE.CanvasTexture {
  if (cachedPalmyraTexture) return cachedPalmyraTexture;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size - 40;

  // 36 Radiating pleated fan blade segments
  const segments = 36;
  const baseAngle = -Math.PI * 0.85;
  const totalAngle = Math.PI * 0.70;

  for (let s = 0; s < segments; s++) {
    const a = baseAngle + (s / segments) * totalAngle;
    const nextA = baseAngle + ((s + 0.95) / segments) * totalAngle;
    const r = 240 + Math.sin(s * 1.5) * 20;

    const x1 = cx + Math.cos(a) * r;
    const y1 = cy + Math.sin(a) * r;
    const x2 = cx + Math.cos(nextA) * r;
    const y2 = cy + Math.sin(nextA) * r;

    const grad = ctx.createLinearGradient(cx, cy, (x1 + x2) / 2, (y1 + y2) / 2);
    const isCrease = s % 2 === 0;
    grad.addColorStop(0, '#224a20');
    grad.addColorStop(0.5, isCrease ? '#2f632c' : '#3a7536');
    grad.addColorStop(0.9, isCrease ? '#447d3d' : '#57964e');
    grad.addColorStop(1, '#827838');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.fill();
  }

  // Stiff spiny hastula petiole base
  ctx.fillStyle = '#423118';
  ctx.beginPath();
  ctx.arc(cx, cy, 32, 0, Math.PI * 2);
  ctx.fill();

  cachedPalmyraTexture = new THREE.CanvasTexture(canvas);
  return cachedPalmyraTexture;
}

let cachedTdefTexture: THREE.CanvasTexture | null = null;
function getCachedTdefTexture(): THREE.CanvasTexture {
  if (cachedTdefTexture) return cachedTdefTexture;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Dense organic canopy cloud with dappled leaf clusters
  for (let i = 0; i < 320; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.pow(Math.random(), 0.65) * 210;
    const x = size / 2 + Math.cos(angle) * dist;
    const y = size / 2 + Math.sin(angle) * (dist * 0.75);

    const leafR = 14 + Math.random() * 22;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, leafR);
    const shade = (i % 4);
    if (shade === 0) {
      grad.addColorStop(0, 'rgba(46, 82, 38, 0.95)');
      grad.addColorStop(0.8, 'rgba(38, 68, 32, 0.8)');
    } else if (shade === 1) {
      grad.addColorStop(0, 'rgba(64, 115, 52, 0.92)');
      grad.addColorStop(0.8, 'rgba(50, 92, 42, 0.7)');
    } else if (shade === 2) {
      grad.addColorStop(0, 'rgba(88, 145, 68, 0.88)');
      grad.addColorStop(0.8, 'rgba(72, 122, 56, 0.65)');
    } else {
      grad.addColorStop(0, 'rgba(30, 55, 26, 0.98)');
      grad.addColorStop(0.8, 'rgba(24, 44, 20, 0.85)');
    }
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, leafR, 0, Math.PI * 2);
    ctx.fill();
  }

  cachedTdefTexture = new THREE.CanvasTexture(canvas);
  return cachedTdefTexture;
}

// ============================================================================
// TERRAIN ELEVATION ADAPTATION (Matches Stage00LaunchPad Ground Mesh exactly)
// ============================================================================

export function getGroundElevation(x: number, z: number): number {
  const dist = Math.hypot(x, z);
  if (dist <= 4.5) return -0.42;
  const falloff = Math.min((dist - 4.5) / 15.0, 1.0);
  const elev =
    (Math.sin(x * 0.12) * Math.cos(z * 0.14) * 0.35 +
      Math.sin(x * 0.28 - z * 0.22) * 0.18) *
    falloff;
  return -0.42 + elev;
}

// ============================================================================
// DEDICATED TRUNK & FOLIAGE GEOMETRY BUILDERS (Zero Alpha Discard on Trunks)
// ============================================================================

export function buildCasuarinaTrunkGeometry(): THREE.BufferGeometry {
  const trunk = new THREE.CylinderGeometry(0.045, 0.085, 4.8, 8, 4);
  trunk.translate(0, 2.4, 0);
  const pos = trunk.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const grad = 0.22 + (y / 4.8) * 0.08;
    cols[i * 3] = grad * 1.1;
    cols[i * 3 + 1] = grad * 0.9;
    cols[i * 3 + 2] = grad * 0.7;
  }
  trunk.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  trunk.computeVertexNormals();
  return trunk;
}

export function buildCasuarinaFoliageGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const tiers = [
    { y: 1.8, r: 0.62, len: 1.25, count: 9, droop: 0.75 },
    { y: 2.4, r: 0.54, len: 1.15, count: 9, droop: 0.70 },
    { y: 3.0, r: 0.45, len: 1.05, count: 8, droop: 0.65 },
    { y: 3.6, r: 0.35, len: 0.90, count: 7, droop: 0.60 },
    { y: 4.1, r: 0.24, len: 0.75, count: 6, droop: 0.55 },
    { y: 4.6, r: 0.14, len: 0.60, count: 5, droop: 0.50 },
  ];

  tiers.forEach((tr, tIdx) => {
    for (let n = 0; n < tr.count; n++) {
      const angle = (n / tr.count) * Math.PI * 2 + tIdx * 0.42;
      const quad = new THREE.PlaneGeometry(0.55, tr.len, 1, 2);
      quad.translate(0, -tr.len * 0.5, 0);

      const pos = quad.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const t = Math.abs(y) / tr.len;
        pos.setZ(i, pos.getZ(i) - t * t * tr.droop);
      }

      quad.rotateX(-0.45 - tr.droop * 0.3);
      quad.rotateY(angle);
      quad.translate(Math.cos(angle) * (tr.r * 0.25), tr.y, Math.sin(angle) * (tr.r * 0.25));

      const qCols = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        qCols[i * 3] = 0.95 + (n % 3) * 0.05;
        qCols[i * 3 + 1] = 1.0;
        qCols[i * 3 + 2] = 0.95;
      }
      quad.setAttribute('color', new THREE.BufferAttribute(qCols, 3));
      parts.push(quad.toNonIndexed());
    }
  });

  const merged = mergeGeometries(parts, false);
  merged.computeVertexNormals();
  return merged;
}

export function buildCoconutTrunkGeometry(): { trunkGeom: THREE.BufferGeometry; topPos: THREE.Vector3 } {
  const parts: THREE.BufferGeometry[] = [];
  const trunk = new THREE.CylinderGeometry(0.05, 0.09, 3.8, 8, 12);
  trunk.translate(0, 1.9, 0);
  const pos = trunk.attributes.position;
  const tColors = new Float32Array(pos.count * 3);

  let topX = 0, topZ = 0;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const h = y / 3.8;
    const curveX = Math.sin(h * 1.55) * 0.48;
    const curveZ = Math.sin(h * 1.15) * 0.18;
    pos.setX(i, pos.getX(i) + curveX);
    pos.setZ(i, pos.getZ(i) + curveZ);

    if (h > 0.95) {
      topX = pos.getX(i);
      topZ = pos.getZ(i);
    }

    const ring = Math.sin(y * 22.0) * 0.04;
    tColors[i * 3] = 0.42 + ring;
    tColors[i * 3 + 1] = 0.34 + ring;
    tColors[i * 3 + 2] = 0.26 + ring;
  }
  trunk.setAttribute('color', new THREE.BufferAttribute(tColors, 3));
  parts.push(trunk.toNonIndexed());

  // Coconut fruit cluster attached to trunk apex
  for (let c = 0; c < 5; c++) {
    const nut = new THREE.DodecahedronGeometry(0.08, 0);
    const na = (c / 5) * Math.PI * 2;
    nut.translate(topX + Math.cos(na) * 0.14, 3.65, topZ + Math.sin(na) * 0.14);
    const nCols = new Float32Array(nut.attributes.position.count * 3);
    for (let j = 0; j < nut.attributes.position.count; j++) {
      nCols[j * 3] = 0.36;
      nCols[j * 3 + 1] = 0.40;
      nCols[j * 3 + 2] = 0.22;
    }
    nut.setAttribute('color', new THREE.BufferAttribute(nCols, 3));
    parts.push(nut.toNonIndexed());
  }

  const merged = mergeGeometries(parts, false);
  merged.computeVertexNormals();
  return { trunkGeom: merged, topPos: new THREE.Vector3(topX, 3.75, topZ) };
}

export function buildCoconutFoliageGeometry(topPos: THREE.Vector3): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const numFronds = 16;
  for (let f = 0; f < numFronds; f++) {
    const angle = (f / numFronds) * Math.PI * 2 + (f % 2) * 0.15;
    const frondLen = 2.4 + (f % 3) * 0.25;
    const quad = new THREE.PlaneGeometry(0.68, frondLen, 1, 6);
    quad.translate(0, -frondLen * 0.5, 0);

    const fPos = quad.attributes.position;
    for (let i = 0; i < fPos.count; i++) {
      const y = fPos.getY(i);
      const t = Math.abs(y) / frondLen;
      fPos.setZ(i, fPos.getZ(i) - Math.pow(t, 1.7) * 0.85);
    }

    quad.rotateX(-0.55);
    quad.rotateY(angle);
    quad.translate(topPos.x, topPos.y, topPos.z);

    const fCols = new Float32Array(fPos.count * 3);
    for (let i = 0; i < fPos.count; i++) {
      fCols[i * 3] = 0.96 + (f % 4) * 0.03;
      fCols[i * 3 + 1] = 1.0;
      fCols[i * 3 + 2] = 0.94;
    }
    quad.setAttribute('color', new THREE.BufferAttribute(fCols, 3));
    parts.push(quad.toNonIndexed());
  }

  const merged = mergeGeometries(parts, false);
  merged.computeVertexNormals();
  return merged;
}

export function buildPalmyraTrunkGeometry(): THREE.BufferGeometry {
  const trunk = new THREE.CylinderGeometry(0.08, 0.12, 4.9, 8, 6);
  trunk.translate(0, 2.45, 0);
  const pos = trunk.attributes.position;
  const tColors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const ring = Math.sin(y * 18.0) * 0.03;
    tColors[i * 3] = 0.24 + ring;
    tColors[i * 3 + 1] = 0.23 + ring;
    tColors[i * 3 + 2] = 0.22 + ring;
  }
  trunk.setAttribute('color', new THREE.BufferAttribute(tColors, 3));
  trunk.computeVertexNormals();
  return trunk;
}

export function buildPalmyraFoliageGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const numFronds = 22;
  for (let f = 0; f < numFronds; f++) {
    const angle = (f / numFronds) * Math.PI * 2 + (f % 3) * 0.12;
    const pitch = 0.25 + ((f % 4) / 4) * 0.70;
    const fan = new THREE.PlaneGeometry(0.95, 1.25);
    fan.translate(0, 0.62, 0);

    fan.rotateX(pitch);
    fan.rotateY(angle);
    fan.translate(0, 4.85, 0);

    const fPos = fan.attributes.position;
    const fCols = new Float32Array(fPos.count * 3);
    for (let i = 0; i < fPos.count; i++) {
      fCols[i * 3] = 0.95;
      fCols[i * 3 + 1] = 1.0;
      fCols[i * 3 + 2] = 0.95;
    }
    fan.setAttribute('color', new THREE.BufferAttribute(fCols, 3));
    parts.push(fan.toNonIndexed());
  }

  // Dried hanging skirt fronds below crown
  for (let d = 0; d < 10; d++) {
    const da = (d / 10) * Math.PI * 2;
    const skirt = new THREE.PlaneGeometry(0.65, 0.90);
    skirt.translate(0, -0.45, 0);
    skirt.rotateX(-0.15);
    skirt.rotateY(da);
    skirt.translate(0, 4.70, 0);

    const sPos = skirt.attributes.position;
    const sCols = new Float32Array(sPos.count * 3);
    for (let i = 0; i < sPos.count; i++) {
      sCols[i * 3] = 0.45;
      sCols[i * 3 + 1] = 0.36;
      sCols[i * 3 + 2] = 0.22;
    }
    skirt.setAttribute('color', new THREE.BufferAttribute(sCols, 3));
    parts.push(skirt.toNonIndexed());
  }

  const merged = mergeGeometries(parts, false);
  merged.computeVertexNormals();
  return merged;
}

export function buildTdefTrunkGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const trunk = new THREE.CylinderGeometry(0.08, 0.13, 2.2, 7, 3);
  trunk.translate(0, 1.1, 0);
  const tPos = trunk.attributes.position;
  const tCols = new Float32Array(tPos.count * 3);
  for (let i = 0; i < tPos.count; i++) {
    tCols[i * 3] = 0.42;
    tCols[i * 3 + 1] = 0.40;
    tCols[i * 3 + 2] = 0.36;
  }
  trunk.setAttribute('color', new THREE.BufferAttribute(tCols, 3));
  parts.push(trunk.toNonIndexed());

  // 3 Primary spreading branches
  for (let b = 0; b < 3; b++) {
    const ba = (b / 3) * Math.PI * 2;
    const branch = new THREE.CylinderGeometry(0.045, 0.075, 1.8, 6, 2);
    branch.translate(0, 0.9, 0);
    branch.rotateZ(0.55);
    branch.rotateY(ba);
    branch.translate(0, 1.8, 0);

    const bPos = branch.attributes.position;
    const bCols = new Float32Array(bPos.count * 3);
    for (let i = 0; i < bPos.count; i++) {
      bCols[i * 3] = 0.40;
      bCols[i * 3 + 1] = 0.38;
      bCols[i * 3 + 2] = 0.34;
    }
    branch.setAttribute('color', new THREE.BufferAttribute(bCols, 3));
    parts.push(branch.toNonIndexed());
  }

  const merged = mergeGeometries(parts, false);
  merged.computeVertexNormals();
  return merged;
}

export function buildTdefFoliageGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let c = 0; c < 8; c++) {
    const ca = (c / 8) * Math.PI * 2;
    const cRadius = 1.0 + (c % 2) * 0.4;
    const cloud = new THREE.PlaneGeometry(2.4, 2.0);
    cloud.rotateX(0.35 + (c % 3) * 0.2);
    cloud.rotateY(ca);
    cloud.translate(Math.cos(ca) * (cRadius * 0.8), 3.2 + (c % 3) * 0.35, Math.sin(ca) * (cRadius * 0.8));

    const cPos = cloud.attributes.position;
    const cCols = new Float32Array(cPos.count * 3);
    for (let i = 0; i < cPos.count; i++) {
      cCols[i * 3] = 0.94 + (c % 3) * 0.05;
      cCols[i * 3 + 1] = 1.0;
      cCols[i * 3 + 2] = 0.92;
    }
    cloud.setAttribute('color', new THREE.BufferAttribute(cCols, 3));
    parts.push(cloud.toNonIndexed());
  }

  const merged = mergeGeometries(parts, false);
  merged.computeVertexNormals();
  return merged;
}

export function buildScrubGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 3; i++) {
    const quad = new THREE.PlaneGeometry(1.2, 0.85);
    quad.translate(0, 0.42, 0);
    quad.rotateY((i / 3) * Math.PI);
    parts.push(quad.toNonIndexed());
  }
  const merged = mergeGeometries(parts, false);
  merged.computeVertexNormals();
  return merged;
}

// ============================================================================
// MAIN COMPONENT & INSTANCED GROVES
// ============================================================================

interface SriharikotaVegetationProps {
  padDrop?: number;
}

export const SriharikotaVegetation: React.FC<SriharikotaVegetationProps> = ({ padDrop = 0 }) => {
  // Instanced mesh refs for Trunks (Solid standard bark)
  const casuarinaTrunkRef = useRef<THREE.InstancedMesh>(null);
  const coconutTrunkRef = useRef<THREE.InstancedMesh>(null);
  const palmyraTrunkRef = useRef<THREE.InstancedMesh>(null);
  const tdefTrunkRef = useRef<THREE.InstancedMesh>(null);

  // Instanced mesh refs for Foliage (Alpha-tested leafy textures)
  const casuarinaFoliageRef = useRef<THREE.InstancedMesh>(null);
  const coconutFoliageRef = useRef<THREE.InstancedMesh>(null);
  const palmyraFoliageRef = useRef<THREE.InstancedMesh>(null);
  const tdefFoliageRef = useRef<THREE.InstancedMesh>(null);
  const scrubRef = useRef<THREE.InstancedMesh>(null);

  // Materials: Solid bark for trunks, procedural alpha-cutouts for fronds/needles
  const materials = useMemo(() => {
    return {
      bark: new THREE.MeshStandardMaterial({
        color: '#423225',
        roughness: 0.88,
        metalness: 0.04,
        vertexColors: true,
      }),
      casuarina: new THREE.MeshStandardMaterial({
        map: getCachedCasuarinaTexture(),
        transparent: true,
        alphaTest: 0.16,
        side: THREE.DoubleSide,
        roughness: 0.78,
        metalness: 0.05,
        vertexColors: true,
      }),
      coconut: new THREE.MeshStandardMaterial({
        map: getCachedCoconutFrondTexture(),
        transparent: true,
        alphaTest: 0.16,
        side: THREE.DoubleSide,
        roughness: 0.65,
        metalness: 0.05,
        vertexColors: true,
      }),
      palmyra: new THREE.MeshStandardMaterial({
        map: getCachedPalmyraTexture(),
        transparent: true,
        alphaTest: 0.16,
        side: THREE.DoubleSide,
        roughness: 0.75,
        metalness: 0.04,
        vertexColors: true,
      }),
      tdef: new THREE.MeshStandardMaterial({
        map: getCachedTdefTexture(),
        transparent: true,
        alphaTest: 0.16,
        side: THREE.DoubleSide,
        roughness: 0.82,
        metalness: 0.04,
        vertexColors: true,
      }),
      scrub: new THREE.MeshStandardMaterial({
        map: getCachedTdefTexture(),
        transparent: true,
        alphaTest: 0.15,
        side: THREE.DoubleSide,
        roughness: 0.85,
        metalness: 0.02,
      }),
    };
  }, []);

  // Geometries
  const geoms = useMemo(() => {
    const coconutTrunkData = buildCoconutTrunkGeometry();
    return {
      casuarinaTrunk: buildCasuarinaTrunkGeometry(),
      casuarinaFoliage: buildCasuarinaFoliageGeometry(),
      coconutTrunk: coconutTrunkData.trunkGeom,
      coconutFoliage: buildCoconutFoliageGeometry(coconutTrunkData.topPos),
      palmyraTrunk: buildPalmyraTrunkGeometry(),
      palmyraFoliage: buildPalmyraFoliageGeometry(),
      tdefTrunk: buildTdefTrunkGeometry(),
      tdefFoliage: buildTdefFoliageGeometry(),
      scrub: buildScrubGeometry(),
    };
  }, []);

  // Instance distribution with exact terrain elevation anchoring
  const { casuarinaData, coconutData, palmyraData, tdefData, scrubData } = useMemo(() => {
    const dummy = new THREE.Object3D();

    // 1. Casuarina (36 trees: West grove, East windbreak, and Horizon belt)
    const cas: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];
    for (let i = 0; i < 4; i++) {
      let x = 0, z = 0;
      if (i < 14) {
        // West/Southwest flank grove (visible behind left cards)
        x = -5.2 - (i % 5) * 1.8 - Math.sin(i * 1.7) * 0.9;
        z = -6.5 - Math.floor(i / 5) * 3.2 - Math.cos(i * 2.1) * 1.1;
      } else if (i < 24) {
        // East coastal windbreak (framing right margin)
        x = 5.2 + ((i - 14) % 4) * 2.1 + Math.sin(i * 2.3) * 0.8;
        z = -5.5 - Math.floor((i - 14) / 4) * 3.4 - Math.cos(i * 1.8) * 0.9;
      } else {
        // Far horizon forest belt
        x = -18 + ((i - 24) / 12) * 36 + Math.sin(i * 1.9) * 1.5;
        z = -22 - Math.floor((i - 24) % 3) * 3.5;
      }

      const scale = 0.85 + (i % 4) * 0.12;
      const hScale = scale * (0.92 + (i % 3) * 0.18);
      const groundY = getGroundElevation(x, z) - 0.12;
      dummy.position.set(x, groundY, z);
      dummy.scale.set(scale, hScale, scale);
      dummy.rotation.set(0, (i * 1.6) % (Math.PI * 2), 0);
      dummy.updateMatrix();

      const tint = new THREE.Color(0.96 + (i % 3) * 0.04, 1.0, 0.95 + (i % 2) * 0.05);
      cas.push({ matrix: dummy.matrix.clone(), color: tint });
    }

    // 2. Coconut Palms (20 trees: leaning with sea breeze on East and West margins)
    const coc: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];
    for (let i = 0; i < 8; i++) {
      let x = 0, z = 0;
      if (i < 12) {
        // East coast stand (leaning towards Bay of Bengal)
        x = 4.8 + (i % 4) * 2.2 + Math.sin(i * 1.8) * 0.7;
        z = -4.8 - Math.floor(i / 4) * 3.2 - Math.cos(i * 2.4) * 0.8;
      } else {
        // West lagoon margin
        x = -4.6 - ((i - 12) % 3) * 2.4 - Math.sin(i * 2.1) * 0.8;
        z = -5.5 - Math.floor((i - 12) / 3) * 3.5;
      }

      const scale = 0.92 + (i % 3) * 0.12;
      const hScale = scale * (0.95 + (i % 4) * 0.15);
      const groundY = getGroundElevation(x, z) - 0.12;
      dummy.position.set(x, groundY, z);
      dummy.scale.set(scale, hScale, scale);
      dummy.rotation.set(0, (i * 2.1) % (Math.PI * 2), 0);
      dummy.updateMatrix();

      const tint = new THREE.Color(1.0, 1.0, 0.98);
      coc.push({ matrix: dummy.matrix.clone(), color: tint });
    }

    // 3. Palmyra Fan Palms (18 iconic trees)
    const pal: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];
    for (let i = 0; i < 6; i++) {
      let x = 0, z = 0;
      if (i < 8) {
        x = -6.2 - (i % 4) * 2.4 + Math.sin(i * 2.2) * 0.6;
        z = -8.2 - Math.floor(i / 4) * 3.8;
      } else if (i < 14) {
        x = 6.2 + ((i - 8) % 3) * 2.6 + Math.sin(i * 1.9) * 0.8;
        z = -7.5 - Math.floor((i - 8) / 3) * 3.6;
      } else {
        x = -12 + ((i - 14) / 4) * 24;
        z = -18 - (i % 2) * 3.0;
      }

      const scale = 0.90 + (i % 4) * 0.14;
      const hScale = scale * (0.95 + (i % 3) * 0.16);
      const groundY = getGroundElevation(x, z) - 0.12;
      dummy.position.set(x, groundY, z);
      dummy.scale.set(scale, hScale, scale);
      dummy.rotation.set(0, (i * 2.7) % (Math.PI * 2), 0);
      dummy.updateMatrix();

      const tint = new THREE.Color(0.98, 1.0, 0.96);
      pal.push({ matrix: dummy.matrix.clone(), color: tint });
    }

    // 4. Tropical Dry Evergreen Broadleaf Canopy (14 trees)
    const tdef: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];
    for (let i = 0; i < 4; i++) {
      let x = 0, z = 0;
      if (i < 6) {
        x = -5.8 - (i % 3) * 2.6 - Math.sin(i * 1.9) * 0.8;
        z = -5.5 - Math.floor(i / 3) * 4.2;
      } else if (i < 10) {
        x = 5.8 + ((i - 6) % 2) * 2.8 + Math.sin(i * 2.5) * 0.7;
        z = -6.8 - Math.floor((i - 6) / 2) * 4.0;
      } else {
        x = -14 + (i - 10) * 8.5;
        z = -20 - (i % 2) * 4.0;
      }

      const scale = 0.95 + (i % 3) * 0.15;
      const groundY = getGroundElevation(x, z) - 0.12;
      dummy.position.set(x, groundY, z);
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.set(0, (i * 1.8) % (Math.PI * 2), 0);
      dummy.updateMatrix();

      const tint = new THREE.Color(0.95 + (i % 2) * 0.05, 1.0, 0.94);
      tdef.push({ matrix: dummy.matrix.clone(), color: tint });
    }

    // 5. Ground Sand-Binding Scrub & Coastal Grass (42 clumps)
    const scb: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];
    for (let i = 0; i < 16; i++) {
      const angle = (i / 42) * Math.PI * 2 + Math.sin(i * 3.1) * 0.3;
      const radius = 5.2 + (i % 7) * 2.4 + Math.cos(i * 2.4) * 0.9;
      const x = Math.cos(angle) * (radius * 1.3);
      const z = -4.5 + Math.sin(angle) * radius;

      const scale = 0.65 + (i % 5) * 0.15;
      const groundY = getGroundElevation(x, z) - 0.04;
      dummy.position.set(x, groundY, z);
      dummy.scale.set(scale, scale * 0.85, scale);
      dummy.rotation.set(0, (i * 2.4) % (Math.PI * 2), 0);
      dummy.updateMatrix();

      const tint = new THREE.Color(0.92, 0.98, 0.88);
      scb.push({ matrix: dummy.matrix.clone(), color: tint });
    }

    return {
      casuarinaData: cas,
      coconutData: coc,
      palmyraData: pal,
      tdefData: tdef,
      scrubData: scb,
    };
  }, []);

  // Update instanced matrices
  useEffect(() => {
    // Casuarina
    if (casuarinaTrunkRef.current) {
      casuarinaData.forEach((d, i) => {
        casuarinaTrunkRef.current!.setMatrixAt(i, d.matrix);
      });
      casuarinaTrunkRef.current.instanceMatrix.needsUpdate = true;
    }
    if (casuarinaFoliageRef.current) {
      casuarinaData.forEach((d, i) => {
        casuarinaFoliageRef.current!.setMatrixAt(i, d.matrix);
        casuarinaFoliageRef.current!.setColorAt(i, d.color);
      });
      casuarinaFoliageRef.current.instanceMatrix.needsUpdate = true;
      if (casuarinaFoliageRef.current.instanceColor) casuarinaFoliageRef.current.instanceColor.needsUpdate = true;
    }

    // Coconut
    if (coconutTrunkRef.current) {
      coconutData.forEach((d, i) => {
        coconutTrunkRef.current!.setMatrixAt(i, d.matrix);
      });
      coconutTrunkRef.current.instanceMatrix.needsUpdate = true;
    }
    if (coconutFoliageRef.current) {
      coconutData.forEach((d, i) => {
        coconutFoliageRef.current!.setMatrixAt(i, d.matrix);
        coconutFoliageRef.current!.setColorAt(i, d.color);
      });
      coconutFoliageRef.current.instanceMatrix.needsUpdate = true;
      if (coconutFoliageRef.current.instanceColor) coconutFoliageRef.current.instanceColor.needsUpdate = true;
    }

    // Palmyra
    if (palmyraTrunkRef.current) {
      palmyraData.forEach((d, i) => {
        palmyraTrunkRef.current!.setMatrixAt(i, d.matrix);
      });
      palmyraTrunkRef.current.instanceMatrix.needsUpdate = true;
    }
    if (palmyraFoliageRef.current) {
      palmyraData.forEach((d, i) => {
        palmyraFoliageRef.current!.setMatrixAt(i, d.matrix);
        palmyraFoliageRef.current!.setColorAt(i, d.color);
      });
      palmyraFoliageRef.current.instanceMatrix.needsUpdate = true;
      if (palmyraFoliageRef.current.instanceColor) palmyraFoliageRef.current.instanceColor.needsUpdate = true;
    }

    // TDEF
    if (tdefTrunkRef.current) {
      tdefData.forEach((d, i) => {
        tdefTrunkRef.current!.setMatrixAt(i, d.matrix);
      });
      tdefTrunkRef.current.instanceMatrix.needsUpdate = true;
    }
    if (tdefFoliageRef.current) {
      tdefData.forEach((d, i) => {
        tdefFoliageRef.current!.setMatrixAt(i, d.matrix);
        tdefFoliageRef.current!.setColorAt(i, d.color);
      });
      tdefFoliageRef.current.instanceMatrix.needsUpdate = true;
      if (tdefFoliageRef.current.instanceColor) tdefFoliageRef.current.instanceColor.needsUpdate = true;
    }

    // Scrub
    if (scrubRef.current) {
      scrubData.forEach((d, i) => {
        scrubRef.current!.setMatrixAt(i, d.matrix);
        scrubRef.current!.setColorAt(i, d.color);
      });
      scrubRef.current.instanceMatrix.needsUpdate = true;
      if (scrubRef.current.instanceColor) scrubRef.current.instanceColor.needsUpdate = true;
    }
  }, [casuarinaData, coconutData, palmyraData, tdefData, scrubData]);

  return (
    <group position={[0, -padDrop, 0]}>
      {/* 1. Casuarina Whispering Pine Spire Windbreak (Solid Trunk + Drooping Needles) */}
      <instancedMesh
        ref={casuarinaTrunkRef}
        args={[geoms.casuarinaTrunk, materials.bark, casuarinaData.length]}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={casuarinaFoliageRef}
        args={[geoms.casuarinaFoliage, materials.casuarina, casuarinaData.length]}
        castShadow
        receiveShadow
      />

      {/* 2. South Indian Coconut Palms (Curved Solid Trunk + Arching Fronds) */}
      <instancedMesh
        ref={coconutTrunkRef}
        args={[geoms.coconutTrunk, materials.bark, coconutData.length]}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={coconutFoliageRef}
        args={[geoms.coconutFoliage, materials.coconut, coconutData.length]}
        castShadow
        receiveShadow
      />

      {/* 3. Palmyra Fan Palms (Columnar Charcoal Trunk + Fan Fronds & Skirt) */}
      <instancedMesh
        ref={palmyraTrunkRef}
        args={[geoms.palmyraTrunk, materials.bark, palmyraData.length]}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={palmyraFoliageRef}
        args={[geoms.palmyraFoliage, materials.palmyra, palmyraData.length]}
        castShadow
        receiveShadow
      />

      {/* 4. Tropical Dry Evergreen Shade Trees (Gnarled Solid Trunk + Umbrella Canopy) */}
      <instancedMesh
        ref={tdefTrunkRef}
        args={[geoms.tdefTrunk, materials.bark, tdefData.length]}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={tdefFoliageRef}
        args={[geoms.tdefFoliage, materials.tdef, tdefData.length]}
        castShadow
        receiveShadow
      />

      {/* 5. Coastal Dune Scrub & Grass */}
      <instancedMesh
        ref={scrubRef}
        args={[geoms.scrub, materials.scrub, scrubData.length]}
        receiveShadow
      />
    </group>
  );
};
