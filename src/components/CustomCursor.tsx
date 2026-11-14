import React, { useEffect, useRef } from 'react';

// Ultra-lightweight cursor: Zero React re-renders on mousemove
// Uses direct GPU-accelerated transform via requestAnimationFrame
export const CustomCursor: React.FC = () => {
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Only show on devices with mouse/fine pointer
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let isHovering = false;
    let isVisible = false;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        if (ringRef.current) ringRef.current.style.opacity = '1';
        if (dotRef.current) dotRef.current.style.opacity = '1';
      }

      // Check hover
      const target = e.target as HTMLElement | null;
      if (target) {
        const clickable = target.closest('a, button, [role="button"], input, textarea, select, .cursor-pointer');
        isHovering = Boolean(clickable);
      }
    };

    const onMouseLeave = () => {
      isVisible = false;
      if (ringRef.current) ringRef.current.style.opacity = '0';
      if (dotRef.current) dotRef.current.style.opacity = '0';
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    // Smooth follower loop via direct style transform (0% React render overhead)
    const renderLoop = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;

      if (ringRef.current) {
        const scale = isHovering ? 1.5 : 1.0;
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${scale})`;
        ringRef.current.style.borderColor = isHovering ? '#4cd7f6' : 'rgba(6, 182, 212, 0.4)';
        ringRef.current.style.backgroundColor = isHovering ? 'rgba(6, 182, 212, 0.12)' : 'transparent';
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      }

      rafId = requestAnimationFrame(renderLoop);
    };

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* Smooth outer luminous follower ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-7 h-7 rounded-full border border-cyan-400/40 pointer-events-none z-50 transition-colors duration-150 will-change-transform opacity-0"
        style={{ transform: 'translate3d(-100px, -100px, 0)' }}
      />
      {/* Precise center starlight dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-cyan-400 pointer-events-none z-50 will-change-transform opacity-0 shadow-[0_0_8px_#06b6d4]"
        style={{ transform: 'translate3d(-100px, -100px, 0)' }}
      />
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
