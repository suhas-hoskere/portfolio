import React, { useEffect, useRef } from 'react';

export const BlackHole: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 520;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const horizonRadius = 68;

    // Accretion disk particles
    interface Particle {
      radius: number;
      angle: number;
      speed: number;
      size: number;
      alpha: number;
      color: string;
    }

    const colors = ['#ffffff', '#fef08a', '#fde047', '#f59e0b', '#f97316', '#ea580c'];
    const particles: Particle[] = [];
    for (let i = 0; i < 110; i++) {
      const r = horizonRadius * 1.15 + Math.random() * (horizonRadius * 1.9);
      particles.push({
        radius: r,
        angle: Math.random() * Math.PI * 2,
        speed: (0.018 + (1 / r) * 1.2) * (Math.random() * 0.4 + 0.8),
        size: Math.random() * 2 + 0.8,
        alpha: Math.random() * 0.7 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const my = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      mouseRef.current.targetX = mx * 10;
      mouseRef.current.targetY = my * 10;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    let time = 0;

    const render = () => {
      time += 0.02;

      // Mouse smooth interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.06;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.06;
      const tiltX = mouseRef.current.x;
      const tiltY = mouseRef.current.y;

      ctx.clearRect(0, 0, size, size);

      ctx.save();
      ctx.translate(cx + tiltX, cy + tiltY);
      const baseRotation = -0.22; // -12.6 degrees
      ctx.rotate(baseRotation);

      // --- 1. Background Gravitational Distortion Ambient Glow ---
      const bgGlow = ctx.createRadialGradient(0, 0, horizonRadius * 0.8, 0, 0, horizonRadius * 3.4);
      bgGlow.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
      bgGlow.addColorStop(0.35, 'rgba(234, 88, 12, 0.2)');
      bgGlow.addColorStop(0.65, 'rgba(124, 58, 237, 0.08)');
      bgGlow.addColorStop(1, 'rgba(4, 5, 13, 0)');
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(0, 0, horizonRadius * 3.4, 0, Math.PI * 2);
      ctx.fill();

      // --- 2. Upper Gravitational Lensing Arc (Bending over the top of the event horizon) ---
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, -horizonRadius * 0.35, horizonRadius * 2.2, horizonRadius * 1.55, 0, Math.PI, Math.PI * 2);
      const upperGrad = ctx.createRadialGradient(0, -horizonRadius * 0.35, horizonRadius * 0.9, 0, -horizonRadius * 0.35, horizonRadius * 2.3);
      upperGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      upperGrad.addColorStop(0.25, 'rgba(253, 224, 71, 0.7)');
      upperGrad.addColorStop(0.6, 'rgba(249, 115, 22, 0.45)');
      upperGrad.addColorStop(0.9, 'rgba(234, 88, 12, 0.15)');
      upperGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.strokeStyle = upperGrad;
      ctx.lineWidth = 32;
      ctx.shadowBlur = 35;
      ctx.shadowColor = '#f59e0b';
      ctx.stroke();
      ctx.restore();

      // --- 3. Lower Gravitational Lensing Arc (Bending under the horizon) ---
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, horizonRadius * 0.25, horizonRadius * 1.9, horizonRadius * 1.15, 0, 0, Math.PI);
      const lowerGrad = ctx.createRadialGradient(0, horizonRadius * 0.25, horizonRadius * 0.9, 0, horizonRadius * 0.25, horizonRadius * 2.0);
      lowerGrad.addColorStop(0, 'rgba(253, 224, 71, 0.6)');
      lowerGrad.addColorStop(0.4, 'rgba(249, 115, 22, 0.35)');
      lowerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.strokeStyle = lowerGrad;
      ctx.lineWidth = 22;
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#ea580c';
      ctx.stroke();
      ctx.restore();

      // --- 4. Back Accretion Disk (Passes BEHIND the black hole) ---
      ctx.save();
      // Only draw the top half of the ellipse (y < 0)
      ctx.beginPath();
      ctx.rect(-size, -size, size * 2, size);
      ctx.clip();

      for (let r = horizonRadius * 2.5; r >= horizonRadius * 1.1; r -= 4) {
        const factor = (r - horizonRadius * 1.1) / (horizonRadius * 1.4);
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.3, 0, 0, Math.PI * 2);

        // Relativistic Doppler beaming: left side (x < 0) is approaching and hotter/brighter!
        const diskGrad = ctx.createLinearGradient(-r, 0, r, 0);
        diskGrad.addColorStop(0, `rgba(255, 255, 255, ${0.85 * (1 - factor * 0.6)})`);
        diskGrad.addColorStop(0.3, `rgba(253, 224, 71, ${0.75 * (1 - factor * 0.7)})`);
        diskGrad.addColorStop(0.7, `rgba(249, 115, 22, ${0.5 * (1 - factor * 0.8)})`);
        diskGrad.addColorStop(1, `rgba(194, 65, 12, ${0.2 * (1 - factor * 0.9)})`);

        ctx.strokeStyle = diskGrad;
        ctx.lineWidth = 5;
        ctx.stroke();
      }
      ctx.restore();

      // --- 5. Pure Black Event Horizon (The Singularity Void) ---
      // This completely covers the back disk with razor-sharp shadow!
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, horizonRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#000000';
      ctx.fill();

      // Photon Ring (Innermost Orbit)
      ctx.beginPath();
      ctx.arc(0, 0, horizonRadius + 1.2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 240, 0.95)';
      ctx.lineWidth = 2.2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#fde047';
      ctx.stroke();
      ctx.restore();

      // --- 6. Front Accretion Disk (Passes IN FRONT of the black hole) ---
      ctx.save();
      // Clip to only the bottom half of the ellipse (y > 0)
      ctx.beginPath();
      ctx.rect(-size, 0, size * 2, size);
      ctx.clip();

      for (let r = horizonRadius * 2.5; r >= horizonRadius * 1.1; r -= 4) {
        const factor = (r - horizonRadius * 1.1) / (horizonRadius * 1.4);
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.3, 0, 0, Math.PI * 2);

        const frontGrad = ctx.createLinearGradient(-r, 0, r, 0);
        frontGrad.addColorStop(0, `rgba(255, 255, 255, ${0.95 * (1 - factor * 0.5)})`);
        frontGrad.addColorStop(0.3, `rgba(254, 240, 138, ${0.85 * (1 - factor * 0.6)})`);
        frontGrad.addColorStop(0.7, `rgba(249, 115, 22, ${0.65 * (1 - factor * 0.7)})`);
        frontGrad.addColorStop(1, `rgba(234, 88, 12, ${0.3 * (1 - factor * 0.8)})`);

        ctx.strokeStyle = frontGrad;
        ctx.lineWidth = 5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#f59e0b';
        ctx.stroke();
      }
      ctx.restore();

      // --- 7. Swirling Orbiting Plasma Particles ---
      ctx.save();
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.angle += p.speed;

        const px = Math.cos(p.angle) * p.radius;
        const py = Math.sin(p.angle) * (p.radius * 0.3);

        // If particle is behind black hole (py < 0) and within horizon x radius, don't draw
        const isBehindHorizon = py < 0 && Math.hypot(px, py) < horizonRadius;

        if (!isBehindHorizon) {
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * (py > 0 ? 1 : 0.6); // Front particles are brighter
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.fill();
        }
      }
      ctx.restore();

      ctx.restore(); // restore rotation & translation

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Canvas rendering Gargantua Black Hole */}
      <canvas
        ref={canvasRef}
        className="w-[320px] h-[320px] sm:w-[440px] sm:h-[440px] select-none pointer-events-none drop-shadow-[0_0_40px_rgba(245,158,11,0.35)]"
      />
    </div>
  );
};
