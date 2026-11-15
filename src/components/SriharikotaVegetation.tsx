import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// ============================================================================
// PROCEDURAL HIGH-RESOLUTION FOLIAGE & BARK TEXTURES
// ============================================================================

let cachedCasuarinaTexture: THREE.CanvasTexture | null = null;
function getCachedCasuarinaTexture(): THREE.CanvasTexture {
  if (cachedCasuarinaTexture) return cachedCasuarinaTexture;
  const size = 512;
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
  const size = 512;
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

  // Draw golden-green rachis on top
  ctx.strokeStyle = '#9eb545';
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
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size - 70;

  // Petiole
  ctx.strokeStyle = '#5a4f32';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(cx, size);
  ctx.lineTo(cx, cy);
  ctx.stroke();

  // Radiating pleated segments
  const segs = 34;
  for (let s = 0; s < segs; s++) {
    const angle = Math.PI * 0.14 + (s / (segs - 1)) * (Math.PI * 0.72);
    const segLen = 195 + Math.sin((s / segs) * Math.PI) * 85;
    const tipX = cx + Math.cos(angle) * segLen;
    const tipY = cy - Math.sin(angle) * segLen;

    const da = 0.022;
    const p1x = cx + Math.cos(angle - da) * (segLen * 0.28);
    const p1y = cy - Math.sin(angle - da) * (segLen * 0.28);
    const p2x = cx + Math.cos(angle + da) * (segLen * 0.28);
    const p2y = cy - Math.sin(angle + da) * (segLen * 0.28);

    const grad = ctx.createLinearGradient(cx, cy, tipX, tipY);
    grad.addColorStop(0, '#224426');
    grad.addColorStop(0.7, '#2f5732');
    grad.addColorStop(1, '#5a6e38');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(p1x, p1y);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(p2x, p2y);
    ctx.closePath();
    ctx.fill();

    // Central crease line
    ctx.strokeStyle = '#1b3820';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
  }

  cachedPalmyraTexture = new THREE.CanvasTexture(canvas);
  return cachedPalmyraTexture;
}

let cachedTdefTexture: THREE.CanvasTexture | null = null;
function getCachedTdefTexture(): THREE.CanvasTexture {
  if (cachedTdefTexture) return cachedTdefTexture;
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;

  // Dappled organic leaf cluster
  for (let i = 0; i < 90; i++) {
    const angle = (i / 90) * Math.PI * 2 + ((i * 19) % 5);
    const r = Math.sin((i / 90) * Math.PI * 3.5) * 160 + 50;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    const leafR = 25 + ((i * 7) % 25);

    const grad = ctx.createRadialGradient(x, y, 0, x, y, leafR);
    grad.addColorStop(0, 'rgba(42, 85, 45, 0.95)');
    grad.addColorStop(0.6, 'rgba(32, 68, 35, 0.85)');
    grad.addColorStop(1, 'rgba(25, 55, 30, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, leafR, 0, Math.PI * 2);
    ctx.fill();
  }

  cachedTdefTexture = new THREE.CanvasTexture(canvas);
  return cachedTdefTexture;
}

// ============================================================================
// 3D GEOMETRY BUILDERS
// ============================================================================

export function buildCasuarinaGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  // Trunk: Slender dark woody trunk, lower 35% clean
  const trunk = new THREE.CylinderGeometry(0.04, 0.075, 4.8, 7, 3);
  trunk.translate(0, 2.4, 0);
  const tPos = trunk.attributes.position;
  const tCols = new Float32Array(tPos.count * 3);
  for (let i = 0; i < tPos.count; i++) {
    const y = tPos.getY(i);
    const grad = 0.18 + (y / 4.8) * 0.08;
    tCols[i * 3] = grad * 1.1;
    tCols[i * 3 + 1] = grad * 0.9;
    tCols[i * 3 + 2] = grad * 0.7;
  }
  trunk.setAttribute('color', new THREE.BufferAttribute(tCols, 3));
  parts.push(trunk.toNonIndexed());

  // 6 Descending Tiers of Feathery Drooping Needle Sprays
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

      // Droop curvature
      const pos = quad.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const t = Math.abs(y) / tr.len;
        pos.setZ(i, pos.getZ(i) - t * t * tr.droop);
      }

      // Rotate around trunk
      quad.rotateX(-0.45 - tr.droop * 0.3);
      quad.rotateY(angle);
      quad.translate(Math.cos(angle) * (tr.r * 0.25), tr.y, Math.sin(angle) * (tr.r * 0.25));

      // Vertex color modulation
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

export function buildCoconutGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  // Curved fibrous trunk with coastal lean
  const trunk = new THREE.CylinderGeometry(0.045, 0.085, 3.8, 8, 12);
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
    tColors[i * 3] = 0.40 + ring;
    tColors[i * 3 + 1] = 0.32 + ring;
    tColors[i * 3 + 2] = 0.24 + ring;
  }
  trunk.setAttribute('color', new THREE.BufferAttribute(tColors, 3));
  parts.push(trunk.toNonIndexed());

  // 16 Arching, Drooping Textured Fronds
  const numFronds = 16;
  for (let f = 0; f < numFronds; f++) {
    const angle = (f / numFronds) * Math.PI * 2 + (f % 2) * 0.15;
    const frondLen = 2.4 + (f % 3) * 0.25;
    const quad = new THREE.PlaneGeometry(0.68, frondLen, 1, 6);
    quad.translate(0, -frondLen * 0.5, 0);

    // Natural arching curve
    const fPos = quad.attributes.position;
    for (let i = 0; i < fPos.count; i++) {
      const y = fPos.getY(i);
      const t = Math.abs(y) / frondLen;
      fPos.setZ(i, fPos.getZ(i) - Math.pow(t, 1.7) * 0.85);
    }

    quad.rotateX(-0.55);
    quad.rotateY(angle);
    quad.translate(topX, 3.75, topZ);

    const fCols = new Float32Array(fPos.count * 3);
    for (let i = 0; i < fPos.count; i++) {
      fCols[i * 3] = 0.96 + (f % 4) * 0.03;
      fCols[i * 3 + 1] = 1.0;
      fCols[i * 3 + 2] = 0.94;
    }
    quad.setAttribute('color', new THREE.BufferAttribute(fCols, 3));
    parts.push(quad.toNonIndexed());
  }

  // Coconut cluster
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
  return merged;
}

export function buildPalmyraGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  // Stout columnar dark charcoal trunk
  const trunk = new THREE.CylinderGeometry(0.08, 0.11, 4.9, 8, 6);
  trunk.translate(0, 2.45, 0);
  const pos = trunk.attributes.position;
  const tColors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const ring = Math.sin(y * 18.0) * 0.03;
    tColors[i * 3] = 0.22 + ring;
    tColors[i * 3 + 1] = 0.21 + ring;
    tColors[i * 3 + 2] = 0.20 + ring;
  }
  trunk.setAttribute('color', new THREE.BufferAttribute(tColors, 3));
  parts.push(trunk.toNonIndexed());

  // 22 Radiating Fan Leaves forming dense spherical crown
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

  // Dried hanging skirt fronds below green crown
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

export function buildTdefGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  // Dividing mottled trunk
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

  // Intersecting organic canopy cloud planes
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

export const SriharikotaVegetation: React.FC<SriharikotaVegetationProps> = ({
  padDrop = 0,
}) => {
  const casuarinaRef = useRef<THREE.InstancedMesh>(null);
  const coconutRef = useRef<THREE.InstancedMesh>(null);
  const palmyraRef = useRef<THREE.InstancedMesh>(null);
  const tdefRef = useRef<THREE.InstancedMesh>(null);
  const scrubRef = useRef<THREE.InstancedMesh>(null);

  // Materials with authentic procedural foliage textures & alpha-cutout
  const materials = useMemo(() => {
    return {
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
    return {
      casuarina: buildCasuarinaGeometry(),
      coconut: buildCoconutGeometry(),
      palmyra: buildPalmyraGeometry(),
      tdef: buildTdefGeometry(),
      scrub: buildScrubGeometry(),
    };
  }, []);

  // Instance distribution across authentic Sriharikota zones
  const { casuarinaData, coconutData, palmyraData, tdefData, scrubData } = useMemo(() => {
    const dummy = new THREE.Object3D();

    // 1. Casuarina (36 trees: West grove, East windbreak, and Horizon belt)
    const cas: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];
    for (let i = 0; i < 36; i++) {
      let x = 0, z = 0;
      if (i < 14) {
        // West/Southwest flank grove (visible behind left cards)
        x = -4.8 - (i % 5) * 1.8 - Math.sin(i * 1.7) * 0.9;
        z = -6.0 - Math.floor(i / 5) * 3.2 - Math.cos(i * 2.1) * 1.1;
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
      dummy.position.set(x, -0.42, z);
      dummy.scale.set(scale, hScale, scale);
      dummy.rotation.set(0, (i * 1.6) % (Math.PI * 2), 0);
      dummy.updateMatrix();

      const tint = new THREE.Color(0.96 + (i % 3) * 0.04, 1.0, 0.95 + (i % 2) * 0.05);
      cas.push({ matrix: dummy.matrix.clone(), color: tint });
    }

    // 2. Coconut Palms (20 trees: leaning with sea breeze on East and West margins)
    const coc: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];
    for (let i = 0; i < 20; i++) {
      let x = 0, z = 0;
      if (i < 12) {
        // East coast stand (leaning towards Bay of Bengal)
        x = 4.5 + (i % 4) * 2.2 + Math.sin(i * 1.8) * 0.7;
        z = -4.5 - Math.floor(i / 4) * 3.2 - Math.cos(i * 2.4) * 0.8;
      } else {
        // West lagoon margin
        x = -4.2 - ((i - 12) % 3) * 2.4 - Math.sin(i * 2.1) * 0.8;
        z = -5.0 - Math.floor((i - 12) / 3) * 3.5;
      }

      const scale = 0.92 + (i % 3) * 0.12;
      const hScale = scale * (0.95 + (i % 4) * 0.15);
      dummy.position.set(x, -0.42, z);
      dummy.scale.set(scale, hScale, scale);
      dummy.rotation.set(0, (i * 2.1) % (Math.PI * 2), 0);
      dummy.updateMatrix();

      const tint = new THREE.Color(1.0, 1.0, 0.98);
      coc.push({ matrix: dummy.matrix.clone(), color: tint });
    }

    // 3. Palmyra Fan Palms (18 iconic trees)
    const pal: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];
    for (let i = 0; i < 18; i++) {
      let x = 0, z = 0;
      if (i < 8) {
        x = -6.0 - (i % 4) * 2.4 + Math.sin(i * 2.2) * 0.6;
        z = -8.0 - Math.floor(i / 4) * 3.8;
      } else if (i < 14) {
        x = 6.2 + ((i - 8) % 3) * 2.6 + Math.sin(i * 1.9) * 0.8;
        z = -7.5 - Math.floor((i - 8) / 3) * 3.6;
      } else {
        x = -12 + ((i - 14) / 4) * 24;
        z = -18 - (i % 2) * 3.0;
      }

      const scale = 0.90 + (i % 4) * 0.14;
      const hScale = scale * (0.95 + (i % 3) * 0.16);
      dummy.position.set(x, -0.42, z);
      dummy.scale.set(scale, hScale, scale);
      dummy.rotation.set(0, (i * 1.7) % (Math.PI * 2), 0);
      dummy.updateMatrix();

      const tint = new THREE.Color(0.98, 1.0, 0.96);
      pal.push({ matrix: dummy.matrix.clone(), color: tint });
    }

    // 4. Tropical Dry Evergreen Forest (TDEF) Broadleaf Trees (14 trees)
    const tdef: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];
    for (let i = 0; i < 14; i++) {
      let x = 0, z = 0;
      if (i < 7) {
        x = -7.5 - (i % 3) * 2.8 - Math.sin(i * 2.1) * 0.8;
        z = -9.0 - Math.floor(i / 3) * 4.0;
      } else {
        x = 7.8 + ((i - 7) % 3) * 2.8 + Math.sin(i * 2.5) * 0.8;
        z = -9.5 - Math.floor((i - 7) / 3) * 4.0;
      }

      const scale = 0.95 + (i % 3) * 0.15;
      dummy.position.set(x, -0.42, z);
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.set(0, (i * 1.9) % (Math.PI * 2), 0);
      dummy.updateMatrix();

      const tint = new THREE.Color(0.95 + (i % 2) * 0.05, 1.0, 0.96);
      tdef.push({ matrix: dummy.matrix.clone(), color: tint });
    }

    // 5. Coastal Dune Scrub & Grass Tufts (32 instances around apron)
    const scb: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2 + ((i * 7) % 5);
      const r = 4.2 + (i % 4) * 1.8 + Math.sin(i * 1.5) * 0.6;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r - 2.5;

      const scale = 0.70 + (i % 3) * 0.35;
      dummy.position.set(x, -0.42, z);
      dummy.scale.set(scale, scale * 0.8, scale);
      dummy.rotation.set(0, (i * 1.8) % (Math.PI * 2), 0);
      dummy.updateMatrix();

      scb.push({ matrix: dummy.matrix.clone(), color: new THREE.Color(1, 1, 1) });
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
    if (casuarinaRef.current) {
      casuarinaData.forEach((d, i) => {
        casuarinaRef.current!.setMatrixAt(i, d.matrix);
        casuarinaRef.current!.setColorAt(i, d.color);
      });
      casuarinaRef.current.instanceMatrix.needsUpdate = true;
      if (casuarinaRef.current.instanceColor) casuarinaRef.current.instanceColor.needsUpdate = true;
    }
    if (coconutRef.current) {
      coconutData.forEach((d, i) => {
        coconutRef.current!.setMatrixAt(i, d.matrix);
        coconutRef.current!.setColorAt(i, d.color);
      });
      coconutRef.current.instanceMatrix.needsUpdate = true;
      if (coconutRef.current.instanceColor) coconutRef.current.instanceColor.needsUpdate = true;
    }
    if (palmyraRef.current) {
      palmyraData.forEach((d, i) => {
        palmyraRef.current!.setMatrixAt(i, d.matrix);
        palmyraRef.current!.setColorAt(i, d.color);
      });
      palmyraRef.current.instanceMatrix.needsUpdate = true;
      if (palmyraRef.current.instanceColor) palmyraRef.current.instanceColor.needsUpdate = true;
    }
    if (tdefRef.current) {
      tdefData.forEach((d, i) => {
        tdefRef.current!.setMatrixAt(i, d.matrix);
        tdefRef.current!.setColorAt(i, d.color);
      });
      tdefRef.current.instanceMatrix.needsUpdate = true;
      if (tdefRef.current.instanceColor) tdefRef.current.instanceColor.needsUpdate = true;
    }
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
      {/* 1. Casuarina Spire Windbreak */}
      <instancedMesh
        ref={casuarinaRef}
        args={[geoms.casuarina, materials.casuarina, casuarinaData.length]}
        castShadow
        receiveShadow
      />

      {/* 2. South Indian Coconut Palms */}
      <instancedMesh
        ref={coconutRef}
        args={[geoms.coconut, materials.coconut, coconutData.length]}
        castShadow
        receiveShadow
      />

      {/* 3. Palmyra Fan Palms */}
      <instancedMesh
        ref={palmyraRef}
        args={[geoms.palmyra, materials.palmyra, palmyraData.length]}
        castShadow
        receiveShadow
      />

      {/* 4. Tropical Dry Evergreen Shade Trees */}
      <instancedMesh
        ref={tdefRef}
        args={[geoms.tdef, materials.tdef, tdefData.length]}
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
