import React, { useEffect, useState } from 'react';
import { Rocket } from 'lucide-react';
import { cosmicAudio } from './AudioEngine';

interface MonochromeLiftoffLoaderProps {
  onComplete: () => void;
}

const PREFLIGHT_CHECKS = [
  { at: 15, code: 'SYS-01', label: 'AVIONICS & TELEMETRY BUS', status: 'NOMINAL' },
  { at: 45, code: 'CRYO-02', label: 'LOX / LH2 PROPELLANT LOAD', status: '100%' },
  { at: 75, code: 'PAD-03', label: 'UMBILICALS & HOLD-DOWN CLAMPS', status: 'ARMED' },
  { at: 96, code: 'ENG-04', label: 'DUAL VIKAS + S200 IGNITERS', status: 'IGNITION' },
];

/**
 * Ultra-lightweight Pure Black & White Liftoff Loading Screen (<4KB, zero framer-motion, zero lag).
 * Runs a crisp ~1.8s pre-flight countdown & monochrome rocket liftoff reveal, with instant Skip/Enter.
 */
export const MonochromeLiftoffLoader: React.FC<MonochromeLiftoffLoaderProps> = ({
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [isLiftingOff, setIsLiftingOff] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      setProgress(100);
      const fastTimer = setTimeout(() => onComplete(), 350);
      return () => clearTimeout(fastTimer);
    }

    const durationMs = 1750;
    const start = performance.now();
    let rafId = 0;
    let fadeTimer: ReturnType<typeof setTimeout> | null = null;
    let doneTimer: ReturnType<typeof setTimeout> | null = null;

    const tick = (now: number) => {
      const elapsed = now - start;
      const raw = Math.min(elapsed / durationMs, 1);
      // Smooth slight acceleration toward T-00 ignition
      const eased = raw < 0.7 ? raw * 0.92 : 0.644 + ((raw - 0.7) / 0.3) * 0.356;
      const pct = Math.min(Math.round(eased * 100), 100);
      setProgress(pct);

      if (raw < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setIsLiftingOff(true);
        fadeTimer = setTimeout(() => {
          setIsFadingOut(true);
        }, 380);
        doneTimer = setTimeout(() => {
          onComplete();
        }, 720);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      if (fadeTimer) clearTimeout(fadeTimer);
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, [onComplete]);

  const handleInstantEnter = () => {
    cosmicAudio.playTelemetryChirp(1200, 0.04);
    setIsLiftingOff(true);
    setIsFadingOut(true);
    setTimeout(onComplete, 200);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        setIsLiftingOff(true);
        setIsFadingOut(true);
        setTimeout(onComplete, 180);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onComplete]);

  const countdownLabel =
    progress < 30
      ? 'T-00:03'
      : progress < 60
        ? 'T-00:02'
        : progress < 92
          ? 'T-00:01'
          : 'T-00:00 // LIFTOFF';

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#050505] text-white flex flex-col items-center justify-center px-5 select-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Subtle monochrome architectural crosshair grid backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      {/* Top minimal mission stamp */}
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
      <div className="relative z-10 w-full max-w-xl grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-6 sm:gap-8 items-center">
        {/* Left: Crisp Pure Monochrome SVG LVM3 Rocket Launching */}
        <div className="relative mx-auto w-28 sm:w-32 h-44 sm:h-56 flex items-end justify-center overflow-hidden border border-white/15 rounded-xl bg-[#09090b]">
          {/* Pad datum baseline */}
          <div className="absolute bottom-3 left-3 right-3 h-[1px] bg-white/30" />

          {/* Animated SVG Rocket climbing out on T-00 Liftoff */}
          <svg
            viewBox="0 0 100 170"
            className="w-20 h-40 mb-3 transition-transform duration-500 ease-in will-change-transform"
            style={{
              transform: isLiftingOff
                ? 'translateY(-150px)'
                : progress >= 85
                  ? `translateY(${-((progress - 85) * 0.4)}px)`
                  : 'translateY(0px)',
            }}
            aria-hidden="true"
          >
            {/* Ignition Monochrome Exhaust Plume (appears >= 75%) */}
            {progress >= 72 && (
              <g>
                <polygon
                  points="43,132 57,132 50,168"
                  fill="#ffffff"
                  opacity={isLiftingOff ? 0.95 : 0.72}
                />
                <polygon
                  points="24,128 34,128 29,158"
                  fill="#ffffff"
                  opacity={isLiftingOff ? 0.85 : 0.55}
                />
                <polygon
                  points="66,128 76,128 71,158"
                  fill="#ffffff"
                  opacity={isLiftingOff ? 0.85 : 0.55}
                />
              </g>
            )}

            {/* Left S200 Booster */}
            <path d="M23 70 L29 52 L35 70 Z" fill="#ffffff" stroke="#09090b" strokeWidth="1.5" />
            <rect x="23" y="70" width="12" height="54" fill="#d4d4d8" stroke="#09090b" strokeWidth="1.5" />
            <rect x="23" y="74" width="12" height="5" fill="#09090b" />
            <rect x="23" y="102" width="12" height="4" fill="#09090b" />
            <polygon points="25,124 33,124 35,130 23,130" fill="#27272a" stroke="#ffffff" strokeWidth="1" />

            {/* Right S200 Booster */}
            <path d="M65 70 L71 52 L77 70 Z" fill="#ffffff" stroke="#09090b" strokeWidth="1.5" />
            <rect x="65" y="70" width="12" height="54" fill="#ffffff" stroke="#09090b" strokeWidth="1.5" />
            <rect x="65" y="74" width="12" height="5" fill="#09090b" />
            <rect x="65" y="102" width="12" height="4" fill="#09090b" />
            <polygon points="67,124 75,124 77,130 65,130" fill="#27272a" stroke="#ffffff" strokeWidth="1" />

            {/* Core Stack: Ogive Fairing + C25 + Interstage + L110 */}
            <path
              d="M38 42 Q39 20 50 8 Q61 20 62 42 Z"
              fill="#ffffff"
              stroke="#09090b"
              strokeWidth="1.5"
            />
            <rect x="38" y="42" width="24" height="24" fill="#ffffff" stroke="#09090b" strokeWidth="1.5" />
            <rect x="38" y="48" width="24" height="3.5" fill="#09090b" />
            <rect x="38" y="66" width="24" height="8" fill="#09090b" stroke="#ffffff" strokeWidth="1" />
            <rect x="38" y="74" width="24" height="52" fill="#ffffff" stroke="#09090b" strokeWidth="1.5" />
            {/* Apollo-style Black Roll Checkers */}
            <rect x="38" y="104" width="12" height="14" fill="#09090b" />
            <rect x="50" y="90" width="12" height="14" fill="#09090b" />
            {/* Twin Vikas Bells */}
            <polygon points="41,126 48,126 49,133 40,133" fill="#27272a" stroke="#ffffff" strokeWidth="1" />
            <polygon points="52,126 59,126 60,133 51,133" fill="#27272a" stroke="#ffffff" strokeWidth="1" />
          </svg>
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

          {/* Checklist */}
          <div className="space-y-1.5 border-y border-white/15 py-3 font-mono text-[11px]">
            {PREFLIGHT_CHECKS.map((item) => {
              const ready = progress >= item.at;
              return (
                <div
                  key={item.code}
                  className="flex items-center justify-between gap-2"
                >
                  <span className={ready ? 'text-zinc-200' : 'text-zinc-600'}>
                    <span className="text-zinc-500 mr-2">{item.code}</span>
                    {item.label}
                  </span>
                  <span
                    className={`font-semibold ${
                      ready ? 'text-white' : 'text-zinc-700'
                    }`}
                  >
                    {ready ? item.status : '...'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress Bar + T-Countdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-white font-semibold tracking-wider">
                {countdownLabel}
              </span>
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

      {/* Bottom minimalist coordinate stamp */}
      <div className="absolute bottom-5 text-[10px] font-mono text-zinc-500 tracking-[0.22em] uppercase">
        13.7199° N · 80.2304° E // INITIALIZING FLIGHT TRAJECTORY
      </div>
    </div>
  );
};
