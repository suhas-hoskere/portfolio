import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  pz: number;
  size: number;
  color: string;
}

interface Meteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  angle: number;
}

export const StarfieldCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Star configuration
    const numStars = Math.min(Math.floor((width * height) / 3200), 450);
    const stars: Star[] = [];
    const colors = ['#ffffff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#fef08a', '#c7d2fe'];

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 1.5,
        y: (Math.random() - 0.5) * height * 1.5,
        z: Math.random() * width,
        pz: width,
        size: Math.random() * 1.6 + 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Meteors
    const meteors: Meteor[] = [];
    const spawnMeteor = () => {
      if (Math.random() < 0.35 && meteors.length < 3) {
        meteors.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.4),
          length: Math.random() * 80 + 40,
          speed: Math.random() * 6 + 6,
          opacity: 1,
          angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
        });
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const speed = 0.65;
    let meteorTimer = 0;

    const render = () => {
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle celestial nebula dust gradients
      const cx = width / 2;
      const cy = height / 3;
      const gradient = ctx.createRadialGradient(cx, cy, 50, cx, cy, width * 0.8);
      gradient.addColorStop(0, 'rgba(30, 27, 75, 0.25)'); // deep indigo
      gradient.addColorStop(0.5, 'rgba(12, 74, 110, 0.12)'); // cyan void
      gradient.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const mouseX = mouseRef.current.active ? (mouseRef.current.x - width / 2) * 0.05 : 0;
      const mouseY = mouseRef.current.active ? (mouseRef.current.y - height / 2) * 0.05 : 0;

      // Render Stars with 3D projection
      const screenStars: { sx: number; sy: number; size: number; alpha: number }[] = [];

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.z -= speed;

        if (star.z <= 0) {
          star.z = width;
          star.pz = width;
          star.x = (Math.random() - 0.5) * width * 1.5;
          star.y = (Math.random() - 0.5) * height * 1.5;
        }

        const k = 180 / star.z;
        const px = (star.x - mouseX) * k + width / 2;
        const py = (star.y - mouseY) * k + height / 2;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const depthAlpha = Math.min(1, (1 - star.z / width) * 1.2);
          const currentSize = Math.max(0.6, star.size * (1 - star.z / width) * 2.2);

          ctx.beginPath();
          ctx.arc(px, py, currentSize, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = depthAlpha * 0.85;
          ctx.shadowBlur = currentSize > 1.4 ? 6 : 0;
          ctx.shadowColor = star.color;
          ctx.fill();
          ctx.shadowBlur = 0;

          if (depthAlpha > 0.4) {
            screenStars.push({ sx: px, sy: py, size: currentSize, alpha: depthAlpha });
          }
        }
      }

      // Constellation hover effect near mouse
      if (mouseRef.current.active) {
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        const connectRadius = 130;

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.lineWidth = 0.8;

        for (let i = 0; i < screenStars.length; i++) {
          const p1 = screenStars[i];
          const distMouse = Math.hypot(p1.sx - mx, p1.sy - my);
          if (distMouse < connectRadius) {
            // Line from star to mouse
            ctx.beginPath();
            ctx.moveTo(p1.sx, p1.sy);
            ctx.lineTo(mx, my);
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.35 * (1 - distMouse / connectRadius)})`;
            ctx.stroke();

            // Connect nearby stars to each other
            for (let j = i + 1; j < screenStars.length; j++) {
              const p2 = screenStars[j];
              const distStars = Math.hypot(p1.sx - p2.sx, p1.sy - p2.sy);
              if (distStars < 90) {
                ctx.beginPath();
                ctx.moveTo(p1.sx, p1.sy);
                ctx.lineTo(p2.sx, p2.sy);
                ctx.strokeStyle = `rgba(129, 140, 248, ${0.25 * (1 - distStars / 90)})`;
                ctx.stroke();
              }
            }
          }
        }
      }

      // Render Meteors
      meteorTimer++;
      if (meteorTimer % 180 === 0) {
        spawnMeteor();
      }

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed;
        m.opacity -= 0.012;

        if (m.opacity <= 0 || m.x > width || m.y > height) {
          meteors.splice(i, 1);
          continue;
        }

        const tailX = m.x - Math.cos(m.angle) * m.length;
        const tailY = m.y - Math.sin(m.angle) * m.length;

        const mGrad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        mGrad.addColorStop(0, `rgba(255, 255, 255, ${m.opacity})`);
        mGrad.addColorStop(0.3, `rgba(56, 189, 248, ${m.opacity * 0.7})`);
        mGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx.strokeStyle = mGrad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: '#030712' }}
    />
  );
};
