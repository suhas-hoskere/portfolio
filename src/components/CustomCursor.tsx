import React, { useEffect, useRef } from 'react';

interface FeatherParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  rot: number;
  vRot: number;
  isWisp: boolean;
  swayPhase: number;
}

interface BarbStrand {
  d: string;
  width: number;
  opacity: number;
  color: string;
}

const PARTICLE_POOL_SIZE = 22;

/**
 * Generates an authentic, naturally hairy monochrome bird-feather plume ONCE at module load:
 * - Zero solid cut-out leaf outlines — built from ~68 fine curved barb strands flowing along
 *   a curved central rachis with natural bird-feather splits, wispy outer tips, and downy base fluff!
 */
function buildFeatherGeometry(): {
  upperBarbs: BarbStrand[];
  lowerBarbs: BarbStrand[];
  downyBarbs: BarbStrand[];
  softCorePath: string;
  rachisPath: string;
} {
  // Deterministic PRNG for natural, organic hair-length & curve variation (no flicker)
  let seed = 7391;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Graceful S-curved spine from bare quill transition (15.5, 47.5) to feather tip (59.5, 4.0)
  const spineAt = (u: number) => {
    const bow = Math.sin(u * Math.PI);
    const x = 15.5 + 44.0 * u - 3.6 * bow;
    const y = 47.5 - 43.5 * u - 3.4 * bow;
    // Tangent vector along spine
    const tx = 44.0 - 3.6 * Math.PI * Math.cos(u * Math.PI);
    const ty = -43.5 - 3.4 * Math.PI * Math.cos(u * Math.PI);
    const len = Math.hypot(tx, ty) || 1;
    const ux = tx / len;
    const uy = ty / len;
    // Left (upper-leading) normal and right (lower-trailing) normal
    return { x, y, ux, uy, nx: uy, ny: -ux };
  };

  const upperBarbs: BarbStrand[] = [];
  const lowerBarbs: BarbStrand[] = [];
  const downyBarbs: BarbStrand[] = [];

  // Natural feather splits (small air gaps separating barb clusters)
  const upperSplits = [0.33, 0.64];
  const lowerSplits = [0.24, 0.49, 0.72, 0.86];

  const splitGapFactor = (u: number, splits: number[]) => {
    for (const s of splits) {
      const d = Math.abs(u - s);
      if (d < 0.022) return 0.0; // clean natural split gap
      if (d < 0.048) return 0.72 + (d - 0.022) * 10;
    }
    return 1.0;
  };

  // Upper leading vane: 32 sleek curved hairs sweeping gently forward & out
  const upperCount = 32;
  for (let i = 0; i < upperCount; i++) {
    const u = 0.06 + (i / (upperCount - 1)) * 0.91;
    const gap = splitGapFactor(u, upperSplits);
    if (gap === 0) continue;

    const p = spineAt(u);
    const envelope = Math.pow(Math.sin(Math.pow(u, 0.78) * Math.PI), 0.72);
    const isStray = i % 4 === 1 || i === upperCount - 2;
    const jitter = 0.86 + rand() * 0.28 + (isStray ? 0.22 : 0);
    const barbLen = (3.4 + envelope * 11.4) * gap * jitter;

    // Swept aerodynamic angle along spine + outward normal
    const sweepFwd = 0.56 + u * 0.26;
    const out = 0.82 - u * 0.22;
    const dirX = p.ux * sweepFwd + p.nx * out;
    const dirY = p.uy * sweepFwd + p.ny * out;
    const dLen = Math.hypot(dirX, dirY) || 1;
    const bx = dirX / dLen;
    const by = dirY / dLen;

    const endX = p.x + bx * barbLen;
    const endY = p.y + by * barbLen;
    // Gentle outward-then-swept natural curve
    const curl = (rand() - 0.35) * 1.4;
    const ctrlX = p.x + (p.nx * 0.75 + p.ux * 0.35) * (barbLen * 0.58) + curl;
    const ctrlY = p.y + (p.ny * 0.75 + p.uy * 0.35) * (barbLen * 0.58) + curl;

    upperBarbs.push({
      d: `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`,
      width: isStray ? 0.62 : 0.78 + envelope * 0.28,
      opacity: isStray ? 0.74 : 0.84 + u * 0.14,
      color: u > 0.6 ? '#ffffff' : '#eef0f6',
    });
  }

  // Lower trailing vane: 38 fuller billowing curved hairs
  const lowerCount = 38;
  for (let i = 0; i < lowerCount; i++) {
    const u = 0.05 + (i / (lowerCount - 1)) * 0.92;
    const gap = splitGapFactor(u, lowerSplits);
    if (gap === 0) continue;

    const p = spineAt(u);
    const envelope = Math.pow(Math.sin(Math.pow(u, 0.72) * Math.PI), 0.68);
    const isStray = i % 5 === 2 || i === lowerCount - 2;
    const jitter = 0.84 + rand() * 0.30 + (isStray ? 0.24 : 0);
    const barbLen = (4.2 + envelope * 14.8) * gap * jitter;

    const sweepFwd = 0.50 + u * 0.30;
    const out = -(0.86 - u * 0.24);
    const dirX = p.ux * sweepFwd + p.nx * out;
    const dirY = p.uy * sweepFwd + p.ny * out;
    const dLen = Math.hypot(dirX, dirY) || 1;
    const bx = dirX / dLen;
    const by = dirY / dLen;

    const endX = p.x + bx * barbLen;
    const endY = p.y + by * barbLen;
    const curl = (rand() - 0.4) * 1.6;
    const ctrlX = p.x + (-p.nx * 0.78 + p.ux * 0.30) * (barbLen * 0.56) + curl;
    const ctrlY = p.y + (-p.ny * 0.78 + p.uy * 0.30) * (barbLen * 0.56) + curl;

    lowerBarbs.push({
      d: `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`,
      width: isStray ? 0.62 : 0.78 + envelope * 0.32,
      opacity: isStray ? 0.72 : 0.82 + u * 0.14,
      color: u > 0.65 ? '#f4f4fa' : '#d2d4de',
    });
  }

  // Soft downy plumulaceous fluff wisps at the base where plume meets bare quill barrel
  for (let i = 0; i < 8; i++) {
    const u = -0.02 + (i / 7) * 0.13;
    const side = i % 2 === 0 ? 1 : -1;
    const p = spineAt(Math.max(0, u));
    const baseShift = u < 0 ? u * 40 : 0;
    const sx = p.x + p.ux * baseShift;
    const sy = p.y + p.uy * baseShift;
    const len = 4.5 + rand() * 4.8;
    const angleSpread = side * (0.85 + rand() * 0.35);
    const ctrlX = sx + (p.nx * angleSpread - p.ux * 0.15) * (len * 0.55);
    const ctrlY = sy + (p.ny * angleSpread - p.uy * 0.15) * (len * 0.55);
    const endX = sx + (p.nx * angleSpread + p.ux * 0.25) * len;
    const endY = sy + (p.ny * angleSpread + p.uy * 0.25) * len;

    downyBarbs.push({
      d: `M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`,
      width: 0.58 + rand() * 0.18,
      opacity: 0.68 + rand() * 0.20,
      color: '#e4e4ec',
    });
  }

  // Soft wispy translucent inner core (no hard border — gives subtle fullness beneath the hairs)
  const softCorePath =
    'M 16.5 46.0 C 17.5 34.0 27.0 19.5 41.0 10.5 C 48.0 6.5 54.5 4.2 59.5 4.0 C 57.5 11.5 50.5 22.5 41.5 32.0 C 32.5 41.0 22.5 45.8 16.5 46.0 Z';

  // Tapered curved central rachis (thick ivory barrel tapering smoothly to a fine hair tip)
  const rachisPath =
    'M 8.0 54.8 C 14.5 47.6 24.5 36.8 35.5 25.8 C 45.2 16.2 53.6 8.8 59.8 3.6 C 53.8 9.4 45.6 17.0 36.2 26.6 C 25.4 37.8 15.6 48.6 9.4 56.0 Z';

  return { upperBarbs, lowerBarbs, downyBarbs, softCorePath, rachisPath };
}

const FEATHER_GEO = buildFeatherGeometry();

/**
 * Redesigned Naturally Hairy Vintage Feather Quill Cursor + Floating Micro-Particles:
 * - Anatomically layered plume built from ~78 fine curved barb hairs (no stiff solid leaf outline!)
 * - Soft floating monochrome motes & micro-wisps shedding smoothly out from the feather on glide,
 *   click, and as a whisper-subtle ambient trickle (zero extra canvas VRAM, 0% CPU when hidden)
 */
export const CustomCursor: React.FC = () => {
  const quillRef = useRef<HTMLDivElement | null>(null);
  const svgWrapRef = useRef<HTMLDivElement | null>(null);
  const particleElsRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let mouseX = -100;
    let mouseY = -100;
    let lastMouseX = -100;
    let lastMouseY = -100;
    let distSinceSpawn = 0;
    let ambientAccum = 0;
    let tiltDeg = 0;
    let targetTilt = 0;
    let isHovering = false;
    let isPressed = false;
    let isVisible = false;
    let rafId = 0;
    let lastTime = performance.now();
    let poolCursor = 0;

    const pool: FeatherParticle[] = Array.from({ length: PARTICLE_POOL_SIZE }, (_, idx) => ({
      active: false,
      x: -100,
      y: -100,
      vx: 0,
      vy: 0,
      age: 0,
      life: 0.9,
      rot: 0,
      vRot: 0,
      isWisp: idx % 3 === 0,
      swayPhase: idx * 1.43,
    }));

    const spawnParticle = (
      originX: number,
      originY: number,
      moveDx: number,
      moveDy: number,
      mode: 'glide' | 'ambient' | 'burst'
    ) => {
      if (reducedMotion || !isVisible) return;
      const p = pool[poolCursor];
      const idx = poolCursor;
      poolCursor = (poolCursor + 1) % PARTICLE_POOL_SIZE;

      // Spawn directly along the diagonal feathery plume (from lower fluff to wispy tip!)
      const along =
        mode === 'burst'
          ? 0.10 + Math.random() * 0.65
          : 0.24 + Math.random() * 0.68;
      const perp = (Math.random() - 0.5) * 14;

      p.active = true;
      p.x = originX + along * 38 + perp * 0.7;
      p.y = originY - along * 38 + perp * 0.7;

      const angle = Math.random() * Math.PI * 2;
      const speed =
        mode === 'burst'
          ? 28 + Math.random() * 38
          : mode === 'ambient'
            ? 8 + Math.random() * 14
            : 14 + Math.random() * 24;

      p.vx = Math.cos(angle) * speed - moveDx * 0.32 + (Math.random() - 0.4) * 12;
      p.vy = Math.sin(angle) * speed - moveDy * 0.32 - (14 + Math.random() * 16);
      p.age = 0;
      p.life =
        mode === 'burst'
          ? 0.62 + Math.random() * 0.32
          : mode === 'ambient'
            ? 0.95 + Math.random() * 0.45
            : 0.78 + Math.random() * 0.40;
      p.isWisp = idx % 3 === 0;
      p.rot = -45 + (Math.random() - 0.5) * 110;
      p.vRot = (Math.random() - 0.5) * 105;
      p.swayPhase = Math.random() * Math.PI * 2;
    };

    const applyTransform = () => {
      if (quillRef.current) {
        quillRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }
      if (svgWrapRef.current) {
        const hoverRot = isHovering ? -7 : 0;
        const pressRot = isPressed ? -10 : 0;
        const scale = isPressed ? 0.93 : isHovering ? 1.07 : 1.0;
        svgWrapRef.current.style.transform = `translate(-1.8px, -96.8%) rotate(${(tiltDeg + hoverRot + pressRot).toFixed(2)}deg) scale(${scale})`;
      }
    };

    const animLoop = (now: number) => {
      if (document.hidden || !isVisible) {
        rafId = 0;
        return;
      }

      const dt = Math.min(Math.max((now - lastTime) / 1000, 0.001), 0.05);
      lastTime = now;

      targetTilt *= Math.pow(0.06, dt);
      tiltDeg += (targetTilt - tiltDeg) * (1 - Math.exp(-15 * dt));
      applyTransform();

      // Gentle ambient trickle so small particles always softly drift out from the feather
      if (!reducedMotion) {
        ambientAccum += dt;
        if (ambientAccum >= 0.42) {
          ambientAccum = 0;
          spawnParticle(mouseX, mouseY, 0, 0, 'ambient');
        }
      }

      for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
        const p = pool[i];
        const el = particleElsRef.current[i];
        if (!p.active) continue;

        p.age += dt;
        if (p.age >= p.life) {
          p.active = false;
          if (el) el.style.opacity = '0';
          continue;
        }

        const drag = Math.pow(0.24, dt);
        p.vx *= drag;
        p.vy = p.vy * drag - 11 * dt;
        const sway = Math.sin(p.age * 6.8 + p.swayPhase) * 15;
        p.x += (p.vx + sway) * dt;
        p.y += p.vy * dt;
        p.rot += p.vRot * dt;

        const progress = p.age / p.life;
        const alpha =
          progress < 0.14
            ? progress / 0.14
            : Math.pow(1 - (progress - 0.14) / 0.86, 1.35);
        const scale = 1 - progress * 0.45;

        if (el) {
          el.style.opacity = (alpha * (p.isWisp ? 0.85 : 0.92)).toFixed(3);
          el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) rotate(${p.rot.toFixed(1)}deg) scale(${scale.toFixed(2)})`;
        }
      }

      rafId = requestAnimationFrame(animLoop);
    };

    const wakeLoop = () => {
      if (!rafId && isVisible && !document.hidden) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(animLoop);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        lastMouseX = mouseX;
        lastMouseY = mouseY;
        if (quillRef.current) quillRef.current.style.opacity = '1';
      }

      const dx = mouseX - lastMouseX;
      const dy = mouseY - lastMouseY;
      lastMouseX = mouseX;
      lastMouseY = mouseY;
      targetTilt = Math.max(-13, Math.min(13, dx * 0.40));

      const dist = Math.hypot(dx, dy);
      distSinceSpawn += dist;
      if (distSinceSpawn >= 9) {
        distSinceSpawn = 0;
        spawnParticle(mouseX, mouseY, dx, dy, 'glide');
      }

      const target = e.target as HTMLElement | null;
      if (target) {
        const clickable = target.closest(
          'a, button, [role="button"], input, textarea, select, .cursor-pointer'
        );
        isHovering = Boolean(clickable);
      }

      applyTransform();
      wakeLoop();
    };

    const onMouseDown = () => {
      isPressed = true;
      if (isVisible) {
        for (let k = 0; k < 4; k++) {
          spawnParticle(mouseX, mouseY, 0, 0, 'burst');
        }
      }
      applyTransform();
      wakeLoop();
    };

    const onMouseUp = () => {
      isPressed = false;
      applyTransform();
    };

    const onMouseLeave = () => {
      isVisible = false;
      isPressed = false;
      if (quillRef.current) quillRef.current.style.opacity = '0';
      for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
        pool[i].active = false;
        const el = particleElsRef.current[i];
        if (el) el.style.opacity = '0';
      }
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden && rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      } else if (!document.hidden && isVisible) {
        wakeLoop();
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* Floating Monochrome Feather Stardust & Delicate Micro-Wisp Particle Pool */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden"
      >
        {Array.from({ length: PARTICLE_POOL_SIZE }, (_, idx) => {
          const isWisp = idx % 3 === 0;
          return (
            <span
              key={idx}
              ref={(el) => {
                particleElsRef.current[idx] = el;
              }}
              className={
                isWisp
                  ? 'fixed top-0 left-0 w-[6px] h-[1.2px] rounded-full bg-white/95 will-change-transform opacity-0'
                  : 'fixed top-0 left-0 w-[2.6px] h-[2.6px] rounded-full bg-white will-change-transform opacity-0'
              }
              style={{
                transform: 'translate3d(-100px, -100px, 0)',
                boxShadow: '0 0 5px rgba(255, 255, 255, 0.7)',
              }}
            />
          );
        })}
      </div>

      {/* Anatomically Layered Hairy Vintage Feather Quill Cursor */}
      <div
        ref={quillRef}
        aria-hidden="true"
        className="fixed top-0 left-0 pointer-events-none z-[9999] will-change-transform opacity-0"
        style={{ transform: 'translate3d(-100px, -100px, 0)' }}
      >
        <div
          ref={svgWrapRef}
          className="will-change-transform"
          style={{
            transformOrigin: '1.8px 96.8%',
            transform: 'translate(-1.8px, -96.8%)',
            filter: 'drop-shadow(0 1.5px 4px rgba(0, 0, 0, 0.95))',
          }}
        >
          <svg
            width="54"
            height="54"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="softPlumeCore" x1="16" y1="46" x2="58" y2="5" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#a1a1aa" stopOpacity="0.18" />
                <stop offset="55%" stopColor="#e4e4ec" stopOpacity="0.34" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.40" />
              </linearGradient>
              <linearGradient id="rachisGrad" x1="8" y1="56" x2="60" y2="4" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#e4e4ec" />
                <stop offset="45%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f4f4f8" />
              </linearGradient>
            </defs>

            {/* 1. MISTY TRANSLUCENT INNER PLUME BODY (zero solid border so outer edge is 100% fine hairs!) */}
            <path d={FEATHER_GEO.softCorePath} fill="url(#softPlumeCore)" />

            {/* 2. LOWER TRAILING FEATHER BARB HAIRS (soft pearl-silver depth) */}
            <g fill="none" strokeLinecap="round">
              {FEATHER_GEO.lowerBarbs.map((b, i) => (
                <path
                  key={`lb-${i}`}
                  d={b.d}
                  stroke={b.color}
                  strokeWidth={b.width}
                  opacity={b.opacity}
                />
              ))}
            </g>

            {/* 3. UPPER LEADING FEATHER BARB HAIRS (bright luminous white) */}
            <g fill="none" strokeLinecap="round">
              {FEATHER_GEO.upperBarbs.map((b, i) => (
                <path
                  key={`ub-${i}`}
                  d={b.d}
                  stroke={b.color}
                  strokeWidth={b.width}
                  opacity={b.opacity}
                />
              ))}
            </g>

            {/* 4. SOFT DOWNY FLUFF TUFTS AT BASE OF PLUME */}
            <g fill="none" strokeLinecap="round">
              {FEATHER_GEO.downyBarbs.map((b, i) => (
                <path
                  key={`db-${i}`}
                  d={b.d}
                  stroke={b.color}
                  strokeWidth={b.width}
                  opacity={b.opacity}
                />
              ))}
            </g>

            {/* 5. TAPERED CURVED CENTRAL RACHIS (SPINE) & HOLLOW QUILL BARREL */}
            <path
              d={FEATHER_GEO.rachisPath}
              fill="url(#rachisGrad)"
              stroke="#09090b"
              strokeWidth="0.65"
              strokeLinejoin="round"
            />

            {/* 6. FINE CALLIGRAPHIC DIP-PEN NIB (pinpoint click tip at exact 2, 62) */}
            <path
              d="M 2.0 62.0 L 6.6 53.0 L 10.2 56.6 Z"
              fill="#18181b"
              stroke="#ffffff"
              strokeWidth="0.82"
              strokeLinejoin="round"
            />
            <line
              x1="2.4"
              y1="61.6"
              x2="6.7"
              y2="56.4"
              stroke="#ffffff"
              strokeWidth="0.6"
              strokeLinecap="round"
            />
            <circle cx="7.0" cy="56.0" r="0.78" fill="#ffffff" />
            <circle cx="2.0" cy="62.0" r="0.95" fill="#ffffff" />
          </svg>
        </div>
      </div>
    </>
  );
};

// Lightweight Magnetic Button wrapper for legacy components
export const MagneticButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  strength?: number;
}> = ({ children, className = '', onClick }) => {
  return (
    <div onClick={onClick} className={`inline-block cursor-pointer ${className}`}>
      {children}
    </div>
  );
};
