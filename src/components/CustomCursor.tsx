import React, { useEffect, useRef } from 'react';

interface FeatherParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  rot: number;
  vRot: number;
  isWisp: boolean;
  swayPhase: number;
}

const PARTICLE_POOL_SIZE = 16;

/**
 * Redesigned Hairy Vintage Feather Quill Cursor + Floating Micro-Particles (pure monochrome B&W):
 * - Organic layered feather plume with delicate curved barb strands, wispy stray outer hairs,
 *   soft downy base fluff, curved ivory rachis, and pinpoint beveled calligraphic nib
 * - Zero-allocation pool of 16 lightweight monochrome motes & tiny feather wisps drifting out
 *   from the plume as you glide or click (0% CPU when mouse is still, zero extra canvas VRAM)
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
      life: 0.7,
      size: 2,
      rot: 0,
      vRot: 0,
      isWisp: idx % 3 === 0,
      swayPhase: idx * 1.37,
    }));

    const spawnParticle = (originX: number, originY: number, moveDx: number, moveDy: number, burst = false) => {
      if (reducedMotion) return;
      const p = pool[poolCursor];
      const idx = poolCursor;
      poolCursor = (poolCursor + 1) % PARTICLE_POOL_SIZE;

      // Emit along the feather plume (upper-right diagonal from nib tip at originX, originY)
      const along = burst ? 0.12 + Math.random() * 0.55 : 0.22 + Math.random() * 0.68;
      const jitterX = (Math.random() - 0.5) * 8;
      const jitterY = (Math.random() - 0.5) * 8;

      p.active = true;
      p.x = originX + along * 34 + jitterX;
      p.y = originY - along * 34 + jitterY;

      // Soft outward drift opposing glide direction + gentle buoyant breeze
      const angle = Math.random() * Math.PI * 2;
      const speed = burst ? 26 + Math.random() * 34 : 10 + Math.random() * 20;
      p.vx = Math.cos(angle) * speed - moveDx * 0.35 + (Math.random() - 0.35) * 10;
      p.vy = Math.sin(angle) * speed - moveDy * 0.35 - (12 + Math.random() * 14);
      p.age = 0;
      p.life = burst ? 0.50 + Math.random() * 0.28 : 0.58 + Math.random() * 0.36;
      p.isWisp = idx % 3 === 0;
      p.size = p.isWisp ? 3.5 + Math.random() * 2.2 : 1.5 + Math.random() * 1.5;
      p.rot = -45 + (Math.random() - 0.5) * 110;
      p.vRot = (Math.random() - 0.5) * 95;
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
        svgWrapRef.current.style.transform = `translate(-1.6px, -97.2%) rotate(${(tiltDeg + hoverRot + pressRot).toFixed(2)}deg) scale(${scale})`;
      }
    };

    const animLoop = (now: number) => {
      const dt = Math.min(Math.max((now - lastTime) / 1000, 0.001), 0.05);
      lastTime = now;

      targetTilt *= Math.pow(0.06, dt);
      tiltDeg += (targetTilt - tiltDeg) * (1 - Math.exp(-15 * dt));
      applyTransform();

      let anyParticleActive = false;
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

        anyParticleActive = true;
        const drag = Math.pow(0.22, dt);
        p.vx *= drag;
        p.vy = p.vy * drag - 10 * dt; // delicate feather-light upward float
        const sway = Math.sin(p.age * 7.5 + p.swayPhase) * 14;
        p.x += (p.vx + sway) * dt;
        p.y += p.vy * dt;
        p.rot += p.vRot * dt;

        const progress = p.age / p.life;
        // Soft fade-in then graceful feather fade-out
        const alpha = progress < 0.14 ? progress / 0.14 : Math.pow(1 - (progress - 0.14) / 0.86, 1.45);
        const scale = 1 - progress * 0.42;

        if (el) {
          el.style.opacity = (alpha * (p.isWisp ? 0.78 : 0.88)).toFixed(3);
          el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) rotate(${p.rot.toFixed(1)}deg) scale(${scale.toFixed(2)})`;
        }
      }

      if (anyParticleActive || Math.abs(tiltDeg) > 0.12 || Math.abs(targetTilt) > 0.12) {
        rafId = requestAnimationFrame(animLoop);
      } else {
        tiltDeg = 0;
        targetTilt = 0;
        applyTransform();
        rafId = 0;
      }
    };

    const wakeLoop = () => {
      if (!rafId) {
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
      if (distSinceSpawn >= 14) {
        distSinceSpawn = 0;
        spawnParticle(mouseX, mouseY, dx, dy, false);
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
        for (let k = 0; k < 3; k++) {
          spawnParticle(mouseX, mouseY, 0, 0, true);
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

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* Lightweight Floating Monochrome Feather Dust & Tiny Micro-Wisp Particle Pool */}
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
                  ? 'fixed top-0 left-0 w-[5px] h-[1.2px] rounded-full bg-white/90 will-change-transform opacity-0'
                  : 'fixed top-0 left-0 w-[2.4px] h-[2.4px] rounded-full bg-white will-change-transform opacity-0'
              }
              style={{
                transform: 'translate3d(-100px, -100px, 0)',
                boxShadow: '0 0 4px rgba(255, 255, 255, 0.55)',
              }}
            />
          );
        })}
      </div>

      {/* Redesigned Hairy Organic Vintage Feather Quill Cursor */}
      <div
        ref={quillRef}
        aria-hidden="true"
        className="fixed top-0 left-0 pointer-events-none z-[9999] will-change-transform opacity-0"
        style={{ transform: 'translate3d(-100px, -100px, 0)' }}
      >
        {/* Pivot pinned to the razor-sharp nib tip at (1.6px, 97.2%) */}
        <div
          ref={svgWrapRef}
          className="will-change-transform"
          style={{
            transformOrigin: '1.6px 97.2%',
            transform: 'translate(-1.6px, -97.2%)',
            filter: 'drop-shadow(0 2px 5px rgba(0, 0, 0, 0.88))',
          }}
        >
          <svg
            width="52"
            height="52"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="quillUpperVane" x1="15" y1="44" x2="58" y2="4" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#cfcfd8" />
                <stop offset="48%" stopColor="#f2f2f7" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
              <linearGradient id="quillLowerVane" x1="18" y1="47" x2="59" y2="10" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#9d9da8" />
                <stop offset="50%" stopColor="#d4d4de" />
                <stop offset="100%" stopColor="#f4f4f8" />
              </linearGradient>
            </defs>

            {/* 1. FINE WISPY OUTER FEATHER HAIRS (tasteful airy halo of curved barbs extending past the vane) */}
            <g stroke="#e4e4ec" strokeLinecap="round" fill="none" opacity="0.88">
              {/* Upper-left sweeping barb wisps */}
              <path d="M 18.2 38.6 Q 14.2 33.4 15.2 28.0" strokeWidth="0.72" />
              <path d="M 20.6 34.4 Q 16.6 28.2 18.4 22.8" strokeWidth="0.76" />
              <path d="M 24.4 29.0 Q 21.0 22.4 23.8 17.6" strokeWidth="0.78" />
              <path d="M 29.2 23.4 Q 26.8 16.8 30.2 12.6" strokeWidth="0.76" />
              <path d="M 34.8 17.8 Q 33.6 11.4 37.8 8.0" strokeWidth="0.74" />
              <path d="M 41.2 12.6 Q 41.6 7.0 46.2 4.6" strokeWidth="0.70" />
              <path d="M 48.0 8.2 Q 50.2 4.0 54.8 2.8" strokeWidth="0.64" />
              {/* Lower-right trailing barb wisps */}
              <path d="M 21.6 42.6 Q 27.6 46.2 33.0 44.2" strokeWidth="0.74" />
              <path d="M 26.6 39.2 Q 33.8 42.4 39.4 39.8" strokeWidth="0.78" />
              <path d="M 32.0 34.8 Q 39.6 37.2 45.2 34.0" strokeWidth="0.78" />
              <path d="M 37.6 29.6 Q 45.2 31.2 50.2 27.4" strokeWidth="0.76" />
              <path d="M 43.2 23.8 Q 50.2 24.6 54.6 20.4" strokeWidth="0.72" />
              <path d="M 48.2 18.0 Q 54.2 17.8 57.8 13.6" strokeWidth="0.68" />
              <path d="M 52.6 12.2 Q 57.6 11.2 60.4 7.4" strokeWidth="0.62" />
              {/* Delicate wispy plume tip strands */}
              <path d="M 56.2 6.8 Q 59.6 4.4 62.0 2.4" strokeWidth="0.65" />
              <path d="M 54.4 8.0 Q 57.8 3.8 60.2 1.6" strokeWidth="0.58" />
            </g>

            {/* 2. UPPER LEADING FEATHER VANE (deeply parted natural bird-feather clusters) */}
            <path
              d="M 16.4 41.8
                 C 15.8 36.2 17.6 30.2 21.4 24.8
                 L 25.8 25.0
                 L 22.8 22.4
                 C 26.0 17.8 30.2 13.8 35.2 10.6
                 L 38.4 12.4
                 L 37.2 9.4
                 C 41.8 6.8 46.6 5.0 51.4 4.0
                 L 51.8 6.4
                 L 53.6 3.7
                 C 56.2 3.3 58.6 3.2 60.8 3.3
                 C 53.8 9.8 44.2 18.4 34.8 27.0
                 C 27.0 34.0 21.0 38.8 16.4 41.8 Z"
              fill="url(#quillUpperVane)"
              stroke="#09090b"
              strokeWidth="0.95"
              strokeLinejoin="round"
            />

            {/* 3. LOWER TRAILING FEATHER VANE (gracefully notched billowing barbs) */}
            <path
              d="M 18.6 43.2
                 C 22.8 44.6 27.8 44.0 32.4 41.6
                 L 29.0 38.8
                 L 34.4 40.4
                 C 38.2 38.2 41.8 35.2 44.8 31.6
                 L 40.6 30.2
                 L 46.2 29.8
                 C 49.0 26.4 51.4 22.8 53.4 19.0
                 L 49.0 18.6
                 L 54.4 17.0
                 C 56.2 13.8 57.8 10.6 58.8 7.6
                 L 55.6 8.2
                 L 59.6 5.8
                 C 60.1 4.8 60.5 4.0 60.8 3.3
                 C 53.0 10.4 43.0 19.6 33.4 28.4
                 C 26.6 34.6 21.6 39.6 18.6 43.2 Z"
              fill="url(#quillLowerVane)"
              stroke="#09090b"
              strokeWidth="0.95"
              strokeLinejoin="round"
            />

            {/* 4. INTERNAL FINE FEATHER BARB TEXTURE (dense curved strands radiating from the shaft) */}
            <g stroke="#18181b" strokeLinecap="round" fill="none" opacity="0.52">
              {/* Upper vane barb lines */}
              <path d="M 20.4 38.6 Q 19.2 33.8 19.8 29.6" strokeWidth="0.65" />
              <path d="M 23.6 35.6 Q 22.6 30.2 23.6 25.8" strokeWidth="0.65" />
              <path d="M 27.2 32.2 Q 26.6 26.4 28.0 21.4" strokeWidth="0.65" />
              <path d="M 31.2 28.4 Q 31.0 22.4 33.0 17.2" strokeWidth="0.65" />
              <path d="M 35.4 24.4 Q 35.8 18.4 38.2 13.2" strokeWidth="0.62" />
              <path d="M 40.0 20.2 Q 41.0 14.4 43.8 9.6" strokeWidth="0.60" />
              <path d="M 44.8 15.8 Q 46.4 10.6 49.4 6.8" strokeWidth="0.58" />
              <path d="M 49.8 11.4 Q 52.0 7.4 55.0 4.8" strokeWidth="0.55" />
              {/* Lower vane barb lines */}
              <path d="M 22.2 40.0 Q 26.6 41.0 30.4 40.2" strokeWidth="0.65" />
              <path d="M 25.8 36.8 Q 30.8 37.8 35.4 36.8" strokeWidth="0.65" />
              <path d="M 29.8 33.0 Q 35.4 34.0 40.2 32.6" strokeWidth="0.65" />
              <path d="M 34.2 29.0 Q 40.0 29.8 44.8 28.0" strokeWidth="0.62" />
              <path d="M 38.8 24.6 Q 44.6 25.2 49.2 23.2" strokeWidth="0.60" />
              <path d="M 43.4 20.2 Q 49.0 20.4 53.0 18.0" strokeWidth="0.58" />
              <path d="M 48.0 15.6 Q 53.0 15.4 56.4 12.8" strokeWidth="0.55" />
              <path d="M 52.4 11.2 Q 56.2 10.4 58.6 8.2" strokeWidth="0.52" />
            </g>

            {/* 5. SOFT DOWNY BASE FLUFF HAIRS (delicate curved tufts where plume meets bare quill barrel) */}
            <g stroke="#e4e4ec" strokeLinecap="round" fill="none" opacity="0.88">
              <path d="M 16.4 42.4 Q 13.0 40.6 12.2 37.4" strokeWidth="0.72" />
              <path d="M 15.2 44.0 Q 11.6 43.0 10.4 40.2" strokeWidth="0.68" />
              <path d="M 14.2 45.6 Q 11.0 45.4 9.6 43.2" strokeWidth="0.62" />
              <path d="M 18.0 44.2 Q 20.6 47.0 24.0 46.8" strokeWidth="0.72" />
              <path d="M 16.6 45.8 Q 19.2 48.6 22.6 48.8" strokeWidth="0.66" />
              <path d="M 15.4 47.2 Q 17.6 49.6 20.4 50.0" strokeWidth="0.58" />
            </g>

            {/* 6. SLENDER CURVED CENTRAL SHAFT (RACHIS) & EXPOSED QUILL BARREL (CALAMUS) */}
            <path
              d="M 7.8 54.4 C 13.6 47.6 23.4 37.4 34.4 27.0 C 44.6 17.4 53.6 9.4 59.8 3.8"
              stroke="#09090b"
              strokeWidth="2.9"
              strokeLinecap="round"
            />
            <path
              d="M 8.2 54.0 C 13.8 47.4 23.4 37.4 34.4 27.0 C 44.6 17.4 53.6 9.4 59.6 4.0"
              stroke="#ffffff"
              strokeWidth="1.45"
              strokeLinecap="round"
            />

            {/* 7. CALLIGRAPHIC HAND-CUT DIP-PEN NIB (pinpoint click tip at exact 2, 62!) */}
            <path
              d="M 2.0 62.0 L 6.4 52.8 L 10.2 56.6 Z"
              fill="#18181b"
              stroke="#ffffff"
              strokeWidth="0.88"
              strokeLinejoin="round"
            />
            <line
              x1="2.4"
              y1="61.6"
              x2="6.6"
              y2="56.4"
              stroke="#ffffff"
              strokeWidth="0.65"
              strokeLinecap="round"
            />
            <circle cx="7.0" cy="56.0" r="0.82" fill="#ffffff" />
            <circle cx="2.0" cy="62.0" r="1.0" fill="#ffffff" />
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
