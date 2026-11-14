import React, { useEffect, useRef } from 'react';

interface InfallingStreak {
  angle: number;
  radius: number;
  speed: number;
  length: number;
  color: string;
  width: number;
}

export const EnteringBlackHole: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const scrollRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const handleResize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Offset from center
      mouseRef.current.targetX = (e.clientX - width / 2) * 0.12;
      mouseRef.current.targetY = (e.clientY - height / 2) * 0.12;
    };

    const handleScroll = () => {
      // Track scroll progress for dive depth
      scrollRef.current = Math.min(window.scrollY / (window.innerHeight * 0.9), 1.5);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Infalling relativistic streaks
    const streakCount = 260;
    const streaks: InfallingStreak[] = [];
    const colors = ['#ffffff', '#fef08a', '#fde047', '#f59e0b', '#f97316', '#c084fc', '#818cf8'];

    const horizonBaseRadius = 90;
    const maxRadius = Math.max(width, height) * 0.85;

    for (let i = 0; i < streakCount; i++) {
      streaks.push({
        angle: Math.random() * Math.PI * 2,
        radius: horizonBaseRadius + Math.random() * (maxRadius - horizonBaseRadius),
        speed: Math.random() * 0.008 + 0.004,
        length: Math.random() * 40 + 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        width: Math.random() * 2 + 1,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.015;

      // Mouse smooth interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      const scrollDive = scrollRef.current;
      // As you scroll down, you dive in: horizon expands, perspective rushes inward
      const zoomFactor = 1 + scrollDive * 1.8;

      ctx.clearRect(0, 0, width, height);

      // Centered on the right-hand / central hero focal zone
      const isMobile = width < 768;
      const singularityX = isMobile ? width / 2 + mx : width * 0.65 + mx;
      const singularityY = isMobile ? height * 0.4 + my : height * 0.5 + my;
      const currentHorizonRadius = horizonBaseRadius * zoomFactor;

      ctx.save();
      ctx.translate(singularityX, singularityY);

      // --- 1. Background Gravitational Lensing Distortion (Warping Spacetime) ---
      const outerGlow = ctx.createRadialGradient(
        0, 0, currentHorizonRadius * 0.9,
        0, 0, currentHorizonRadius * 4.5
      );
      outerGlow.addColorStop(0, 'rgba(249, 115, 22, 0.45)');
      outerGlow.addColorStop(0.2, 'rgba(245, 158, 11, 0.28)');
      outerGlow.addColorStop(0.5, 'rgba(124, 58, 237, 0.16)');
      outerGlow.addColorStop(0.8, 'rgba(236, 72, 153, 0.06)');
      outerGlow.addColorStop(1, 'rgba(4, 5, 13, 0)');

      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(0, 0, currentHorizonRadius * 4.5, 0, Math.PI * 2);
      ctx.fill();

      // --- 2. Infalling Relativistic Streaks (Sucked toward the Singularity) ---
      for (let i = 0; i < streaks.length; i++) {
        const s = streaks[i];

        // Gravitational acceleration: inward velocity increases as radius decreases!
        const rNorm = Math.max(0.1, (s.radius - currentHorizonRadius) / maxRadius);
        const inwardSpeed = (3.5 / (rNorm + 0.15)) * (1 + scrollDive * 1.5);
        s.radius -= inwardSpeed;

        // Spiral rotation (frame-dragging / Lense-Thirring effect)
        s.angle += s.speed * (1.8 / (rNorm + 0.3));

        // When matter crosses the event horizon, respawn at outer boundary
        if (s.radius <= currentHorizonRadius) {
          s.radius = maxRadius * (Math.random() * 0.3 + 0.7);
          s.angle = Math.random() * Math.PI * 2;
        }

        // Draw relativistic stretched streak curve
        const tailRadius = s.radius + s.length * (1.2 / (rNorm + 0.5));
        const tailAngle = s.angle - 0.08;

        const headX = Math.cos(s.angle) * s.radius;
        const headY = Math.sin(s.angle) * s.radius;
        const tailX = Math.cos(tailAngle) * tailRadius;
        const tailY = Math.sin(tailAngle) * tailRadius;

        const streakGrad = ctx.createLinearGradient(headX, headY, tailX, tailY);
        // Head is blazing white/gold near horizon, tail fades
        streakGrad.addColorStop(0, '#ffffff');
        streakGrad.addColorStop(0.3, s.color);
        streakGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.strokeStyle = streakGrad;
        ctx.lineWidth = s.width * (1.5 - rNorm * 0.5);
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      }

      // --- 3. Lensed Accretion Torus (Curved Warped Light Rings) ---
      for (let ring = 0; ring < 4; ring++) {
        const ringRadius = currentHorizonRadius * (1.2 + ring * 0.35);
        const ringAlpha = (0.5 - ring * 0.1) * (1 - scrollDive * 0.3);

        ctx.save();
        ctx.rotate(time * (0.15 / (ring + 1)) * (ring % 2 === 0 ? 1 : -1));
        ctx.beginPath();
        ctx.ellipse(0, 0, ringRadius * 1.4, ringRadius * 0.45, -0.25, 0, Math.PI * 2);

        const ringGrad = ctx.createLinearGradient(-ringRadius, 0, ringRadius, 0);
        ringGrad.addColorStop(0, `rgba(255, 255, 255, ${ringAlpha * 1.5})`);
        ringGrad.addColorStop(0.25, `rgba(253, 224, 71, ${ringAlpha})`);
        ringGrad.addColorStop(0.7, `rgba(249, 115, 22, ${ringAlpha * 0.8})`);
        ringGrad.addColorStop(1, `rgba(139, 92, 246, ${ringAlpha * 0.3})`);

        ctx.strokeStyle = ringGrad;
        ctx.lineWidth = 14 - ring * 2.5;
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#f59e0b';
        ctx.stroke();
        ctx.restore();
      }

      // --- 4. The Event Horizon Void (Pure Absolute Black Hole) ---
      // Absorbs all light from behind
      ctx.beginPath();
      ctx.arc(0, 0, currentHorizonRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.shadowBlur = 40;
      ctx.shadowColor = '#000000';
      ctx.fill();

      // Deep internal shadow vignette
      const voidVignette = ctx.createRadialGradient(0, 0, 0, 0, 0, currentHorizonRadius);
      voidVignette.addColorStop(0, '#000000');
      voidVignette.addColorStop(0.85, '#000000');
      voidVignette.addColorStop(1, 'rgba(0,0,0,0.9)');
      ctx.fillStyle = voidVignette;
      ctx.fill();

      // --- 5. Innermost Photon Sphere Ring (Intensely luminous razor boundary) ---
      ctx.beginPath();
      ctx.arc(0, 0, currentHorizonRadius + 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 245, 0.95)';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#fef08a';
      ctx.stroke();

      // Secondary Einstein Lensing Ring
      ctx.beginPath();
      ctx.arc(0, 0, currentHorizonRadius * 1.08, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#f97316';
      ctx.stroke();

      ctx.restore();

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
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-0"
      aria-hidden="true"
    />
  );
};
