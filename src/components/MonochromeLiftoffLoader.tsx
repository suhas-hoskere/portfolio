import React, { useEffect, useRef, useState } from 'react';
import { Rocket } from 'lucide-react';
import { cosmicAudio } from './AudioEngine';

interface MonochromeLiftoffLoaderProps {
  onComplete: () => void;
}

const PREFLIGHT_CHECKS = [
  { at: 15, code: 'SYS-01', label: 'AVIONICS & TELEMETRY BUS', status: 'NOMINAL' },
  { at: 42, code: 'CRYO-02', label: 'LOX / LH2 PROPELLANT LOAD', status: '100%' },
  { at: 68, code: 'PAD-03', label: 'UMBILICALS & CLAMPS', status: 'RELEASED' },
  { at: 86, code: 'ENG-04', label: 'DUAL VIKAS + S200 THRUST', status: 'LIFTOFF' },
];

interface LoaderSmoke {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  age: number;
  life: number;
}

interface LoaderSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
}

/**
 * Pure Black & White Animated Liftoff Loading Page:
 * Runs a crisp live 150x220 2D Canvas launch animation (cryo vent -> umbilical retract ->
 * roaring flickering ignition -> billowing monochrome trench smoke -> accelerating liftoff!)
 * with < 0.2ms/frame cost and instant Skip.
 */
export const MonochromeLiftoffLoader: React.FC<MonochromeLiftoffLoaderProps> = ({
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      setProgress(100);
      const fastTimer = setTimeout(() => onComplete(), 350);
      return () => clearTimeout(fastTimer);
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d') ?? null;
    const cw = 150;
    const ch = 220;
    if (canvas && ctx) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Live monochrome smoke & spark pools (tiny fixed arrays, zero per-frame allocations)
    const smokes: LoaderSmoke[] = Array.from({ length: 18 }, (_, i) => ({
      x: cw * 0.5,
      y: ch - 18,
      vx: (i % 2 === 0 ? 1 : -1) * (24 + (i % 5) * 10),
      vy: -(6 + (i % 4) * 5),
      r: 4 + (i % 4) * 2,
      age: (i / 18) * 0.8,
      life: 0.55 + (i % 5) * 0.12,
    }));

    const sparks: LoaderSpark[] = Array.from({ length: 14 }, (_, i) => ({
      x: cw * 0.5,
      y: ch - 18,
      vx: (i % 2 === 0 ? 1 : -1) * (35 + (i % 5) * 14),
      vy: -(25 + (i % 4) * 16),
      age: (i / 14) * 0.45,
      life: 0.35 + (i % 4) * 0.08,
    }));

    const totalMs = 2300;
    const start = performance.now();
    let lastNow = start;
    let lastPct = -1;
    let rafId = 0;
    let fadeTriggered = false;
    let doneTimer: ReturnType<typeof setTimeout> | null = null;

    const tick = (now: number) => {
      const dt = Math.min((now - lastNow) / 1000, 0.05);
      lastNow = now;
      const elapsed = now - start;
      const tSec = elapsed / 1000;
      const norm = Math.min(elapsed / totalMs, 1);

      // Progress reaches 100% around 78% of total timeline, leaving last ~0.5s for accelerating liftoff climb
      const pct = Math.min(Math.round((norm / 0.78) * 100), 100);
      if (pct !== lastPct) {
        lastPct = pct;
        setProgress(pct);
      }

      // Draw live monochrome liftoff sequence on mini canvas
      if (ctx) {
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, cw, ch);

        // Subtle vertical altitude scale ticks on right edge
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        for (let ty = 16; ty < ch - 20; ty += 16) {
          ctx.beginPath();
          ctx.moveTo(cw - 8, ty);
          ctx.lineTo(cw - 3, ty);
          ctx.stroke();
        }

        const padY = ch - 18;
        const cx = cw * 0.5 + 4;

        // Gantry tower (left of rocket)
        const tx = cx - 34;
        ctx.strokeStyle = 'rgba(255,255,255,0.32)';
        ctx.lineWidth = 1;
        ctx.strokeRect(tx - 6, padY - 118, 12, 118);
        for (let b = 0; b < 6; b++) {
          const y0 = padY - b * 19;
          const y1 = y0 - 19;
          ctx.beginPath();
          ctx.moveTo(tx - 6, y0);
          ctx.lineTo(tx + 6, y1);
          ctx.moveTo(tx + 6, y0);
          ctx.lineTo(tx - 6, y1);
          ctx.stroke();
        }
        // Blinking beacon on gantry top
        if (Math.sin(tSec * 10) > 0) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(tx, padY - 124, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Retracting umbilical arms (swing smoothly clear between norm 0.42 -> 0.62)
        const armRetract = Math.min(Math.max((norm - 0.42) / 0.20, 0), 1);
        const armEase = 1 - Math.pow(1 - armRetract, 3);
        for (const ay of [padY - 48, padY - 76]) {
          ctx.save();
          ctx.translate(tx + 6, ay);
          ctx.rotate(-armEase * 0.65);
          ctx.strokeStyle = 'rgba(255,255,255,0.75)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(20 * (1 - armEase * 0.45), 0);
          ctx.stroke();
          ctx.restore();
        }

        // Launch pad baseline + MLP blocks
        ctx.fillStyle = '#27272a';
        ctx.fillRect(10, padY, cw - 20, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 26, padY - 3, 14, 3);
        ctx.fillRect(cx + 12, padY - 3, 14, 3);

        // Physics: Engine Ignition (norm >= 0.48), Liftoff acceleration (norm >= 0.66)
        const ignitionRamp = Math.min(Math.max((norm - 0.46) / 0.16, 0), 1);
        const liftoffFrac = Math.min(Math.max((norm - 0.64) / 0.36, 0), 1);
        const liftPx = Math.pow(liftoffFrac, 2.5) * 210;

        // Smooth rock-steady liftoff ascent (zero shaking!)
        const rx = cx;
        const ry = padY - 6 - liftPx;

        // Roaring flickering monochrome supersonic flames
        if (ignitionRamp > 0.02) {
          const flick1 = 0.86 + Math.sin(tSec * 68) * 0.14 + Math.cos(tSec * 112) * 0.08;
          const flick2 = 0.88 + Math.cos(tSec * 74) * 0.12;
          const coreLen = (24 + liftoffFrac * 42) * ignitionRamp * flick1;
          const sideLen = (20 + liftoffFrac * 34) * ignitionRamp * flick2;

          // Outer translucent white exhaust cone
          ctx.fillStyle = 'rgba(255,255,255,0.28)';
          ctx.beginPath();
          ctx.moveTo(rx - 14, ry + 2);
          ctx.lineTo(rx, ry + coreLen * 1.35);
          ctx.lineTo(rx + 14, ry + 2);
          ctx.closePath();
          ctx.fill();

          // Core white-hot flame + twin booster flames
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(rx - 5, ry + 2);
          ctx.lineTo(rx, ry + coreLen);
          ctx.lineTo(rx + 5, ry + 2);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(rx - 14, ry);
          ctx.lineTo(rx - 11, ry + sideLen);
          ctx.lineTo(rx - 8, ry);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(rx + 8, ry);
          ctx.lineTo(rx + 11, ry + sideLen);
          ctx.lineTo(rx + 14, ry);
          ctx.closePath();
          ctx.fill();
        }

        // Draw crisp Black & White LVM3 rocket body (sleek taller & slimmer silhouette)
        ctx.save();
        ctx.translate(rx, ry);

        // Left & Right S200 Boosters
        for (const side of [-1, 1]) {
          const bx = side * 8.5;
          ctx.fillStyle = side > 0 ? '#e4e4e7' : '#c4c4cc';
          ctx.strokeStyle = 'rgba(24,24,27,0.5)';
          ctx.lineWidth = 0.85;
          ctx.beginPath();
          ctx.moveTo(bx - 2.6, -44);
          ctx.lineTo(bx, -58);
          ctx.lineTo(bx + 2.6, -44);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillRect(bx - 2.6, -44, 5.2, 42);
          ctx.fillStyle = '#27272a';
          ctx.fillRect(bx - 2.6, -41, 5.2, 2.5);
          ctx.fillRect(bx - 2.6, -20, 5.2, 2.2);
          ctx.strokeRect(bx - 2.6, -44, 5.2, 42);
        }

        // Core Stack: Ogive Fairing + C25 + Interstage + L110
        ctx.fillStyle = '#ececef';
        ctx.strokeStyle = 'rgba(24,24,27,0.5)';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(-5.2, -68);
        ctx.quadraticCurveTo(-4.8, -88, 0, -100);
        ctx.quadraticCurveTo(4.8, -88, 5.2, -68);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillRect(-5.2, -68, 10.4, 20);
        ctx.fillStyle = '#1f1f23';
        ctx.fillRect(-5.2, -48, 10.4, 5);
        ctx.fillStyle = '#e4e4e7';
        ctx.fillRect(-5.2, -43, 10.4, 42);
        ctx.fillStyle = '#27272a';
        ctx.fillRect(-5.2, -16, 10.4, 2.5);
        ctx.strokeStyle = 'rgba(24,24,27,0.5)';
        ctx.strokeRect(-5.2, -68, 10.4, 67);

        ctx.restore();

        // Live Cryogenic Vapour Rings (standby norm < 0.48)
        if (norm < 0.50) {
          for (let v = 0; v < 3; v++) {
            const vp = (tSec * 0.9 + v * 0.33) % 1;
            const vx = rx + 8 + vp * 26;
            const vy = ry - 52 - vp * 10;
            ctx.strokeStyle = `rgba(255,255,255,${(1 - vp) * 0.42})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(vx, vy, 2 + vp * 6, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // Live Billowing Monochrome Trench Smoke & Sparks (ignition -> liftoff!)
        if (ignitionRamp > 0.05) {
          for (let i = 0; i < smokes.length; i++) {
            const s = smokes[i];
            s.age += dt;
            if (s.age >= s.life) {
              s.age = 0;
              const dir = i % 2 === 0 ? 1 : -1;
              s.x = cx + dir * (4 + (i % 4) * 3);
              s.y = padY - 2;
              s.vx = dir * (28 + (i % 5) * 12);
              s.vy = -(8 + (i % 4) * 7);
            } else {
              s.x += s.vx * dt;
              s.y += s.vy * dt;
              s.vx *= Math.pow(0.25, dt);
              s.vy -= 18 * dt;
            }
            const lf = s.age / s.life;
            const alpha = Math.sin(lf * Math.PI) * 0.62 * ignitionRamp;
            const rad = s.r + lf * 16;
            // Soft volumetric 2-lobe smoke puff (no hard soap-bubble outline)
            ctx.fillStyle = `rgba(212,212,218,${alpha * 0.35})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, rad, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(255,255,255,${alpha * 0.45})`;
            ctx.beginPath();
            ctx.arc(s.x + rad * 0.16, s.y - rad * 0.18, rad * 0.62, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = '#ffffff';
          for (let i = 0; i < sparks.length; i++) {
            const spk = sparks[i];
            spk.age += dt;
            if (spk.age >= spk.life) {
              spk.age = 0;
              const dir = i % 2 === 0 ? 1 : -1;
              spk.x = cx + dir * 6;
              spk.y = padY - 4;
              spk.vx = dir * (38 + (i % 5) * 16);
              spk.vy = -(28 + (i % 4) * 18);
            } else {
              spk.x += spk.vx * dt;
              spk.y += spk.vy * dt;
              spk.vy += 120 * dt;
            }
            const lf = spk.age / spk.life;
            ctx.globalAlpha = (1 - lf) * ignitionRamp;
            ctx.fillRect(spk.x, spk.y, 2, 2);
          }
          ctx.globalAlpha = 1;
        }
      }

      if (norm < 1) {
        rafId = requestAnimationFrame(tick);
      } else if (!fadeTriggered) {
        fadeTriggered = true;
        setIsFadingOut(true);
        doneTimer = setTimeout(() => onComplete(), 280);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, [onComplete]);

  const handleInstantEnter = () => {
    cosmicAudio.playTelemetryChirp(1200, 0.04);
    setIsFadingOut(true);
    setTimeout(onComplete, 180);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        setIsFadingOut(true);
        setTimeout(onComplete, 160);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onComplete]);

  const countdownLabel =
    progress < 30
      ? 'T-00:03'
      : progress < 58
        ? 'T-00:02'
        : progress < 86
          ? 'T-00:01 // IGNITION'
          : 'T-00:00 // LIFTOFF';

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#050505] text-white flex flex-col items-center justify-center px-5 select-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top mission stamp */}
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between text-[10px] sm:text-xs font-mono text-zinc-400 uppercase tracking-widest">
        <span>SHAR // SRIHARIKOTA PAD-02</span>
        <button
          onClick={handleInstantEnter}
          className="px-2.5 py-1 rounded border border-white/20 hover:border-white text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          SKIP [ENTER]
        </button>
      </div>

      {/* Main Liftoff Center Panel */}
      <div className="relative z-10 w-full max-w-xl grid grid-cols-1 sm:grid-cols-[156px_1fr] gap-6 sm:gap-8 items-center">
        {/* Left: Live Animated 2D Canvas Rocket Liftoff Bay */}
        <div className="relative mx-auto w-[150px] h-[220px] rounded-xl border border-white/20 overflow-hidden bg-[#09090b]">
          <canvas
            ref={canvasRef}
            className="w-[150px] h-[220px] block"
            aria-label="Rocket liftoff animation"
          />
        </div>

        {/* Right: Crisp Monochrome Liftoff Telemetry Checklist */}
        <div className="space-y-4 text-left">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 tracking-widest uppercase">
              <Rocket className="w-3.5 h-3.5 text-white" />
              <span>PRE-FLIGHT SEQUENCE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-space font-bold text-white tracking-tight">
              Suhas Hoskere
            </h1>
            <div className="font-kannada text-xs sm:text-sm text-zinc-400">
              ಸುಹಾಸ್ ಹೊಸಕೆರೆ · ಬೆಂಗಳೂರು
            </div>
          </div>

          <div className="space-y-1.5 border-y border-white/15 py-3 font-mono text-[11px]">
            {PREFLIGHT_CHECKS.map((item) => {
              const ready = progress >= item.at;
              return (
                <div key={item.code} className="flex items-center justify-between gap-2">
                  <span className={ready ? 'text-zinc-200' : 'text-zinc-600'}>
                    <span className="text-zinc-500 mr-2">{item.code}</span>
                    {item.label}
                  </span>
                  <span className={`font-semibold ${ready ? 'text-white' : 'text-zinc-700'}`}>
                    {ready ? item.status : '...'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-white font-semibold tracking-wider">{countdownLabel}</span>
              <span className="text-zinc-300">{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 border border-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-[width] duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 text-[10px] font-mono text-zinc-500 tracking-[0.22em] uppercase">
        13.7199° N · 80.2304° E // LAUNCH SEQUENCE ACTIVE
      </div>
    </div>
  );
};
