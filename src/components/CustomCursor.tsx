import React, { useEffect, useRef } from 'react';

/**
 * Vintage Writing Feather Quill Cursor (pure monochrome Black & White):
 * - Razor-sharp quill nib aligned 1:1 to exact pointer hotspot (mouseX, mouseY) — zero input lag!
 * - Subtle organic writing tilt while gliding & gentle dip-press on click/hover
 * - On-demand RAF loop sleeps at 0% CPU when pointer is still
 */
export const CustomCursor: React.FC = () => {
  const quillRef = useRef<HTMLDivElement | null>(null);
  const svgWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Only show custom feather cursor on fine-pointer desktop devices
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
        // Position exact bottom-left nib tip directly on (mouseX, mouseY)
        quillRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }
      if (svgWrapRef.current) {
        const hoverRot = isHovering ? -8 : 0;
        const pressRot = isPressed ? -11 : 0;
        const scale = isPressed ? 0.92 : isHovering ? 1.08 : 1.0;
        svgWrapRef.current.style.transform = `translate(0, -100%) rotate(${(tiltDeg + hoverRot + pressRot).toFixed(2)}deg) scale(${scale})`;
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
      targetTilt = Math.max(-14, Math.min(14, dx * 0.45));

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
      {/* Pivot origin is bottom-left (0% 100%), exact quill nib writing point */}
      <div
        ref={svgWrapRef}
        className="will-change-transform"
        style={{
          transformOrigin: '0% 100%',
          transform: 'translate(0, -100%)',
          filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.85))',
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Classic old-age writing feather plume with natural vintage notches */}
          <path
            d="M7.5 28.5
               C6.8 23.2 9.2 16.5 14.5 11.0
               C18.5 6.8 24.4 3.6 32.8 2.6
               C31.8 7.0 29.9 11.0 27.3 14.5
               L23.5 15.8
               L26.2 16.6
               C24.2 19.2 21.8 21.5 19.2 23.4
               L16.2 23.8
               L18.1 24.9
               C15.0 26.8 11.4 28.0 7.5 28.5 Z"
            fill="#f4f4f6"
            stroke="#09090b"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Shaded lower feather vane for crisp 3D monochrome depth */}
          <path
            d="M8.0 28.0
               C12.2 23.2 18.8 15.6 31.8 3.4
               C30.4 8.6 27.9 13.0 24.4 16.8
               C20.0 21.8 14.6 26.4 8.0 28.0 Z"
            fill="#d4d4dc"
            opacity="0.72"
          />

          {/* Delicate vintage feather barb striations */}
          <path
            d="M14.5 16.0 L18.0 11.5 M18.5 13.2 L22.5 8.5 M22.8 10.0 L26.5 6.0 M13.2 22.8 L17.8 21.4 M17.5 18.8 L22.2 17.5 M21.4 14.6 L25.5 13.4"
            stroke="#27272a"
            strokeWidth="0.7"
            strokeLinecap="round"
            opacity="0.55"
          />

          {/* Curved central quill shaft (rachis) tapering all the way to the sharp ink nib at (1, 35) */}
          <path
            d="M1.2 34.8 C5.8 29.8 12.2 22.4 20.0 14.2 C24.2 9.8 28.2 6.0 31.8 3.2"
            stroke="#09090b"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M1.4 34.6 C5.8 29.8 12.2 22.4 20.0 14.2 C24.2 9.8 28.2 6.0 31.8 3.2"
            stroke="#ffffff"
            strokeWidth="1.05"
            strokeLinecap="round"
          />

          {/* Sharp hand-cut dip-pen nib tip & ink slit at exact (0.8, 35.2) click hotspot */}
          <path
            d="M0.6 35.4 L3.4 30.6 L5.6 32.8 Z"
            fill="#18181b"
            stroke="#ffffff"
            strokeWidth="0.7"
            strokeLinejoin="round"
          />
          <circle cx="1.0" cy="35.0" r="0.9" fill="#ffffff" />
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
