import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  baseZ: number;
  size: number;
  opacity: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
  decay: number;
}

export const CosmicBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollSpeedRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Color palette for cosmic stars
    const starColors = ['#ffffff', '#f4f2ed', '#e0e7ff', '#fed7aa', '#fbcfe8', '#38bdf8'];
    const starCount = Math.min(Math.floor((width * height) / 3600), 500);
    const stars: Star[] = [];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 2 + 0.3, // depth layer
        baseZ: Math.random() * 2 + 0.3,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.7 + 0.3,
        color: starColors[Math.floor(Math.random() * starColors.length)],
      });
    }

    const shootingStars: ShootingStar[] = [];

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX - width / 2) * 0.04;
      mouseRef.current.targetY = (e.clientY - height / 2) * 0.04;
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = Math.abs(currentScrollY - lastScrollYRef.current);
      lastScrollYRef.current = currentScrollY;
      // Boost warp speed during fast scroll
      scrollSpeedRef.current = Math.min(delta * 0.45, 28);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    let tick = 0;

    const render = () => {
      tick++;

      // Smooth dampening of warp scroll speed
      scrollSpeedRef.current *= 0.92;
      const warp = scrollSpeedRef.current;

      // Mouse parallax smooth interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Deep space base fill
      ctx.fillStyle = '#04050d';
      ctx.fillRect(0, 0, width, height);

      // Organic drifting nebula clouds in background
      const nebula1X = width * 0.35 + Math.sin(tick * 0.003) * 60 - mx * 0.5;
      const nebula1Y = height * 0.3 + Math.cos(tick * 0.002) * 40 - my * 0.5;
      const g1 = ctx.createRadialGradient(nebula1X, nebula1Y, 50, nebula1X, nebula1Y, width * 0.55);
      g1.addColorStop(0, 'rgba(124, 58, 237, 0.12)'); // violet
      g1.addColorStop(0.5, 'rgba(236, 72, 153, 0.06)'); // magenta
      g1.addColorStop(1, 'rgba(4, 5, 13, 0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, width, height);

      const nebula2X = width * 0.75 + Math.cos(tick * 0.0025) * 50 - mx * 0.3;
      const nebula2Y = height * 0.65 + Math.sin(tick * 0.0035) * 45 - my * 0.3;
      const g2 = ctx.createRadialGradient(nebula2X, nebula2Y, 30, nebula2X, nebula2Y, width * 0.45);
      g2.addColorStop(0, 'rgba(249, 115, 22, 0.08)'); // warm orange glow
      g2.addColorStop(0.6, 'rgba(139, 92, 246, 0.04)');
      g2.addColorStop(1, 'rgba(4, 5, 13, 0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);

      // Render Stars with Warp Streaks when scrolling
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Parallax offset
        const px = star.x - mx * star.z;
        const py = star.y - my * star.z;

        // Twinkle factor
        const twinkle = Math.sin(tick * 0.04 + star.x) * 0.25 + 0.75;
        const alpha = Math.min(1, star.opacity * twinkle);

        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha;

        if (warp > 1.2) {
          // Warp Streak Mode!
          const streakLength = warp * star.z * 1.8;
          ctx.strokeStyle = star.color;
          ctx.lineWidth = star.size * 0.8;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px, py + streakLength);
          ctx.stroke();
        } else {
          // Normal Celestial Point
          ctx.beginPath();
          ctx.arc(px, py, star.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Spontaneous shooting star generator
      if (Math.random() < 0.015 && shootingStars.length < 2) {
        shootingStars.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.4),
          vx: (Math.random() + 0.6) * 12,
          vy: (Math.random() + 0.4) * 8,
          length: Math.random() * 90 + 50,
          alpha: 1,
          decay: 0.016,
        });
      }

      // Render Shooting Stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= s.decay;

        if (s.alpha <= 0 || s.x > width || s.y > height) {
          shootingStars.splice(i, 1);
          continue;
        }

        const tailX = s.x - (s.vx / 14) * s.length;
        const tailY = s.y - (s.vy / 14) * s.length;

        const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${s.alpha})`);
        grad.addColorStop(0.3, `rgba(249, 115, 22, ${s.alpha * 0.8})`);
        grad.addColorStop(1, 'rgba(139, 92, 246, 0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: '#04050d' }}
      aria-hidden="true"
    />
  );
};
