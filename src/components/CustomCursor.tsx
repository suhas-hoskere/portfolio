import React, { useEffect, useRef } from 'react';

/**
 * Vintage Calligraphic Writing Feather Quill Cursor (pure monochrome Black & White):
 * - Authentic old-age goose-feather dip-pen silhouette: sharp beveled nib with ink slit,
 *   exposed slender curved quill barrel, and deeply-notched asymmetric sweeping feather plume
 * - Razor-sharp nib tip pinned 1:1 to exact click coordinates (mouseX, mouseY) — zero lag
 * - Subtle organic writing sway while gliding & gentle dip-press on hover/click (0% idle CPU)
 */
export const CustomCursor: React.FC = () => {
  const quillRef = useRef<HTMLDivElement | null>(null);
  const svgWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let mouseX = -100;
    let mouseY = -100;
    let lastMouseX = -100;
    let tiltDeg = 0;
    let targetTilt = 0;
    let isHovering = false;
    let isPressed = false;
    let isVisible = false;
    let rafId = 0;

    const applyTransform = () => {
      if (quillRef.current) {
        quillRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }
      if (svgWrapRef.current) {
        const hoverRot = isHovering ? -7 : 0;
        const pressRot = isPressed ? -10 : 0;
        const scale = isPressed ? 0.93 : isHovering ? 1.07 : 1.0;
        svgWrapRef.current.style.transform = `translate(-1.5px, -97.5%) rotate(${(tiltDeg + hoverRot + pressRot).toFixed(2)}deg) scale(${scale})`;
      }
    };

    const settleLoop = () => {
      targetTilt *= 0.80;
      tiltDeg += (targetTilt - tiltDeg) * 0.22;
      applyTransform();

      if (Math.abs(tiltDeg) > 0.15 || Math.abs(targetTilt) > 0.15) {
        rafId = requestAnimationFrame(settleLoop);
      } else {
        tiltDeg = 0;
        targetTilt = 0;
        applyTransform();
        rafId = 0;
      }
    };

    const wakeLoop = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(settleLoop);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        lastMouseX = mouseX;
        if (quillRef.current) quillRef.current.style.opacity = '1';
      }

      const dx = mouseX - lastMouseX;
      lastMouseX = mouseX;
      targetTilt = Math.max(-13, Math.min(13, dx * 0.42));

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
      applyTransform();
    };

    const onMouseUp = () => {
      isPressed = false;
      applyTransform();
    };

    const onMouseLeave = () => {
      isVisible = false;
      isPressed = false;
      if (quillRef.current) quillRef.current.style.opacity = '0';
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
    <div
      ref={quillRef}
      aria-hidden="true"
      className="fixed top-0 left-0 pointer-events-none z-[9999] will-change-transform opacity-0"
      style={{ transform: 'translate3d(-100px, -100px, 0)' }}
    >
      {/* Pivot pinned to the razor-sharp nib tip at (1.5px, 97.5%) */}
      <div
        ref={svgWrapRef}
        className="will-change-transform"
        style={{
          transformOrigin: '1.5px 97.5%',
          transform: 'translate(-1.5px, -97.5%)',
          filter: 'drop-shadow(0 2px 5px rgba(0, 0, 0, 0.90))',
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="quillUpperVane" x1="16" y1="42" x2="58" y2="4" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#d4d4dc" />
              <stop offset="45%" stopColor="#f4f4f8" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
            <linearGradient id="quillLowerVane" x1="20" y1="46" x2="60" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#a1a1aa" />
              <stop offset="52%" stopColor="#d4d4dc" />
              <stop offset="100%" stopColor="#f4f4f6" />
            </linearGradient>
          </defs>

          {/* 1. UPPER LEADING FEATHER VANE (sleek aerodynamic top side with classic bird-feather splits) */}
          <path
            d="M 16.5 41.5
               C 16.2 35.5 18.6 29.0 23.0 23.5
               L 26.8 23.2
               L 24.4 21.0
               C 28.6 15.8 34.4 11.4 41.0 8.2
               L 42.6 10.6
               L 43.4 7.3
               C 49.0 4.9 54.6 3.5 60.4 3.4
               C 53.5 9.8 44.2 18.2 34.8 26.8
               C 27.2 33.8 21.2 38.6 16.5 41.5 Z"
            fill="url(#quillUpperVane)"
            stroke="#09090b"
            strokeWidth="1.35"
            strokeLinejoin="round"
          />

          {/* 2. LOWER TRAILING FEATHER VANE (wider billowing plume with 4 iconic deep quill notches!) */}
          <path
            d="M 18.8 43.4
               C 23.2 44.6 28.4 43.8 33.4 41.2
               L 30.2 38.2
               L 35.5 39.8
               C 39.8 37.2 43.8 33.6 47.2 29.4
               L 42.8 27.6
               L 48.6 27.4
               C 51.4 23.6 53.8 19.6 55.8 15.5
               L 51.6 14.8
               L 56.6 13.4
               C 58.4 9.8 59.8 6.4 60.4 3.4
               C 52.8 10.4 43.0 19.4 33.4 28.2
               C 26.6 34.5 21.8 39.6 18.8 43.4 Z"
            fill="url(#quillLowerVane)"
            stroke="#09090b"
            strokeWidth="1.35"
            strokeLinejoin="round"
          />

          {/* 3. FINE ORGANIC FEATHER BARB STRIATIONS radiating from shaft */}
          <path
            d="M 22.8 36.2 L 22.0 29.2
               M 27.4 31.8 L 27.2 24.4
               M 32.4 27.2 L 33.0 19.2
               M 37.8 22.2 L 39.0 14.2
               M 43.6 16.8 L 45.6 9.8
               M 49.4 11.8 L 52.2 6.8
               M 24.5 37.4 L 31.4 37.6
               M 29.4 32.8 L 37.2 33.4
               M 34.8 27.8 L 43.0 28.4
               M 40.4 22.6 L 48.4 23.0
               M 46.0 17.2 L 52.8 17.4
               M 51.2 12.2 L 56.4 11.8"
            stroke="#27272a"
            strokeWidth="0.72"
            strokeLinecap="round"
            opacity="0.58"
          />

          {/* 4. DELICATE DOWNY BASE FLUFF TUFTS where feather meets bare quill stem */}
          <path
            d="M 16.2 42.4 C 14.2 41.2 13.4 39.2 13.8 37.5
               M 17.8 44.2 C 19.6 45.6 21.8 46.2 23.6 45.4"
            stroke="#d4d4dc"
            strokeWidth="0.9"
            strokeLinecap="round"
          />

          {/* 5. EXPOSED SLENDER HOLLOW QUILL BARREL (CALAMUS) & CONTINUOUS CENTRAL RACHIS */}
          {/* Outer dark ink contour for razor visibility on white & black surfaces */}
          <path
            d="M 7.8 54.4 C 13.6 47.6 23.4 37.4 34.4 27.0 C 44.6 17.4 53.6 9.4 59.6 4.0"
            stroke="#09090b"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Ivory-white central shaft tapering smoothly toward feather tip */}
          <path
            d="M 8.2 54.0 C 13.8 47.4 23.4 37.4 34.4 27.0 C 44.6 17.4 53.6 9.4 59.4 4.2"
            stroke="#ffffff"
            strokeWidth="1.55"
            strokeLinecap="round"
          />

          {/* 6. AUTHENTIC HAND-CUT CALLIGRAPHIC DIP-PEN NIB (sharp point at exact 2, 62!) */}
          <path
            d="M 2.0 62.0 L 6.4 52.8 L 10.2 56.6 Z"
            fill="#18181b"
            stroke="#ffffff"
            strokeWidth="0.9"
            strokeLinejoin="round"
          />
          {/* Tiny ink-breather eyelet & calligraphic nib slit */}
          <line
            x1="2.4"
            y1="61.6"
            x2="6.6"
            y2="56.4"
            stroke="#ffffff"
            strokeWidth="0.65"
            strokeLinecap="round"
          />
          <circle cx="7.0" cy="56.0" r="0.85" fill="#ffffff" />
          {/* Pinpoint bright ink glint right at the writing tip */}
          <circle cx="2.0" cy="62.0" r="1.05" fill="#ffffff" />
        </svg>
      </div>
    </div>
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
