import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import {
  getCachedSolarPanelTexture,
  getCachedGoldMliTexture,
  getCachedIsroBoosterTexture,
  getCachedIndiaBoosterTexture,
  getCachedChandrayaanFairingTexture,
} from './aerospaceTextures';

// ============================================================================
// INTRO CONFIGURATION: All strings, timings, colors, and session keys
// ============================================================================
export const INTRO_CONFIG = {
  strings: {
    nameEnglish: 'Suhas Hoskere',
    nameKannada: 'ಸುಹಾಸ್ ಹೊಸಕೆರೆ',
    subsystemTag: 'MISSION CONTROL // SRIHARIKOTA FLIGHT TELEMETRY',
    statusLines: [
      { id: 'nav', label: 'NAV SYSTEMS', result: 'OK' },
      { id: 'telemetry', label: 'TELEMETRY BUS', result: 'OK' },
      { id: 'propulsion', label: 'STAGE 00 PAD', result: 'OK' },
      { id: 'assets', label: 'SCENE ASSETS', pending: 'LOADING', done: 'READY' },
    ],
    skipButton: 'SKIP',
    countdown: ['T-3', 'T-2', 'T-1'],
  },
  timings: {
    totalDuration: 5.0, // Standard duration (seconds)
    reducedMotionDuration: 2.0, // For prefers-reduced-motion
    nameFadeStart: 0.0,
    nameFadeEnd: 0.8,
    statusTypingStart: 0.8,
    statusTypingEnd: 3.8,
    countdownStart: 3.8,
    countdownEnd: 4.5,
    overlayFadeStart: 4.5,
    overlayFadeEnd: 5.0,
  },
  colors: {
    bgNavy: '#030611',
    bgNavyBrightened: '#071026',
    cyanAccent: '#38bdf8', // existing cyan accent
    cyanGlow: 'rgba(56, 189, 248, 0.45)',
    emeraldOk: '#34d399',
    textCream: '#f4f2ed',
  },
  sessionKey: 'portfolio_intro_seen',
};

interface LaunchPreloaderProps {
  onShowDashboard?: () => void;
  onIgnition?: () => void;
  onComplete: () => void;
}

export const LaunchPreloader: React.FC<LaunchPreloaderProps> = ({
  onShowDashboard,
  onIgnition,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [skipRequested, setSkipRequested] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onShowDashboardRef = useRef(onShowDashboard);
  const onIgnitionRef = useRef(onIgnition);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onShowDashboardRef.current = onShowDashboard;
  }, [onShowDashboard]);

  useEffect(() => {
    onIgnitionRef.current = onIgnition;
  }, [onIgnition]);

  // Detect prefers-reduced-motion
  const prefersReduced = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ).current;

  // 1. REAL ASSET PRE-CACHING FOR STAGE 00 FIRST SCENE
  useEffect(() => {
    let mounted = true;

    const preloadFirstSceneAssets = async () => {
      try {
        // Kick off procedural texture generation in parallel while intro runs
        getCachedSolarPanelTexture();
        getCachedGoldMliTexture();
        getCachedIsroBoosterTexture();
        getCachedIndiaBoosterTexture();
        getCachedChandrayaanFairingTexture();
      } catch (err) {
        console.warn('Pre-cache warning:', err);
      }

      // Hook into Three.js DefaultLoadingManager
      let isQueueActive = false;
      THREE.DefaultLoadingManager.onStart = () => {
        isQueueActive = true;
      };
      THREE.DefaultLoadingManager.onLoad = () => {
        if (mounted) setAssetsLoaded(true);
      };

      // If no assets were queued by managers, mark ready after procedural textures generate
      setTimeout(() => {
        if (mounted && !isQueueActive) {
          setAssetsLoaded(true);
        }
      }, 400);
    };

    preloadFirstSceneAssets();

    // Failsafe: guarantee ready after 1.8s so user is never blocked
    const fallbackTimer = setTimeout(() => {
      if (mounted) setAssetsLoaded(true);
    }, 1800);

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
    };
  }, []);

  // 2. FAINT BACKGROUND 2D STARFIELD
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const starCount = 80;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 0.6 + Math.random() * 1.2,
      baseAlpha: 0.2 + Math.random() * 0.5,
      twinkleSpeed: 1.0 + Math.random() * 2.5,
      phase: Math.random() * Math.PI * 2,
    }));

    let animId: number;
    let t = 0;
    const renderStars = () => {
      ctx.clearRect(0, 0, width, height);
      t += 0.02;

      for (let i = 0; i < starCount; i++) {
        const s = stars[i];
        const alpha = s.baseAlpha * (0.6 + 0.4 * Math.sin(t * s.twinkleSpeed + s.phase));
        ctx.fillStyle = `rgba(244, 242, 237, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(renderStars);
    };

    renderStars();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 3. FRAME-ACCURATE TIMELINE CONTROLLER
  useEffect(() => {
    const totalDuration = prefersReduced
      ? INTRO_CONFIG.timings.reducedMotionDuration
      : INTRO_CONFIG.timings.totalDuration;

    let lastTime = performance.now();
    let currentElapsed = 0;
    let animFrame: number;

    const tick = (now: number) => {
      if (completedRef.current) return;

      const delta = (now - lastTime) / 1000;
      lastTime = now;
      const safeDelta = Math.min(Math.max(delta, 0), 0.1); // clamp against background tab stalls

      currentElapsed += safeDelta;

      // Handle Skip request: fast-forward past typing/countdown once assets are ready
      if (skipRequested) {
        if (assetsLoaded) {
          currentElapsed = Math.max(currentElapsed, INTRO_CONFIG.timings.overlayFadeStart);
        } else {
          // Hold just before fade out until assets finish loading
          currentElapsed = Math.min(currentElapsed, INTRO_CONFIG.timings.countdownStart);
        }
      } else {
        // If elapsed reaches countdown end (4.5s) but assets are still loading, hold until ready
        if (currentElapsed >= INTRO_CONFIG.timings.countdownEnd && !assetsLoaded) {
          currentElapsed = INTRO_CONFIG.timings.countdownEnd;
        }
      }

      setElapsed(currentElapsed);

      // Trigger hero dashboard reveal at 4.2s so it is ready under the fade-out
      if (currentElapsed >= 4.2 && onShowDashboardRef.current) {
        onShowDashboardRef.current();
      }

      // Trigger launchpad ignition at 4.5s
      if (currentElapsed >= 4.5 && onIgnitionRef.current) {
        onIgnitionRef.current();
      }

      // Completion: fade out finished at 5.0s
      if (currentElapsed >= totalDuration && assetsLoaded) {
        completedRef.current = true;
        setIsDone(true);

        try {
          sessionStorage.setItem(INTRO_CONFIG.sessionKey, 'true');
        } catch {
          // ignore storage failure in private mode
        }

        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
        return;
      }

      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [assetsLoaded, skipRequested, prefersReduced]);

  const handleSkip = useCallback(() => {
    setSkipRequested(true);
  }, []);

  if (isDone) return null;

  // 4. COMPUTED STAGE ANIMATION VALUES
  const { timings, strings } = INTRO_CONFIG;

  // Name opacity (0.0s to 0.8s)
  const nameProgress = Math.min(
    Math.max((elapsed - timings.nameFadeStart) / (timings.nameFadeEnd - timings.nameFadeStart), 0),
    1
  );
  const nameOpacity = prefersReduced ? 1 : nameProgress;
  const nameTranslateY = prefersReduced ? 0 : (1 - nameProgress) * 12;

  // Progress Bar (0.8s to 3.8s)
  const progressRaw = Math.min(
    Math.max((elapsed - timings.statusTypingStart) / (timings.statusTypingEnd - timings.statusTypingStart), 0),
    1
  );
  const progressBarPercent = prefersReduced
    ? Math.min((elapsed / 1.4) * 100, 100)
    : Math.min(progressRaw * 100, assetsLoaded ? 100 : 95);

  // Status Lines Typewriter Sequencing
  const typingSlotSec = (timings.statusTypingEnd - timings.statusTypingStart) / strings.statusLines.length; // 0.75s per line
  const typingElapsed = Math.max(elapsed - timings.statusTypingStart, 0);

  // Countdown (3.8s to 4.5s)
  const isCountdownActive = elapsed >= timings.countdownStart && elapsed < timings.overlayFadeStart;
  let countdownText = '';
  if (!prefersReduced && isCountdownActive) {
    const cdProgress = (elapsed - timings.countdownStart) / (timings.countdownEnd - timings.countdownStart);
    if (cdProgress < 0.33) countdownText = 'T-3';
    else if (cdProgress < 0.66) countdownText = 'T-2';
    else countdownText = 'T-1';
  }

  // Overlay Brightening (3.8s to 4.5s)
  const brightenOpacity = isCountdownActive
    ? Math.sin(((elapsed - timings.countdownStart) / 0.7) * Math.PI) * 0.28
    : 0;

  // Overall Fade-out (4.5s to 5.0s)
  const fadeOutProgress = Math.min(
    Math.max((elapsed - timings.overlayFadeStart) / (timings.overlayFadeEnd - timings.overlayFadeStart), 0),
    1
  );
  const overlayOpacity = Math.max(1 - fadeOutProgress, 0);

  return (
    <div
      style={{ opacity: overlayOpacity }}
      className="fixed inset-0 z-[200] bg-[#030611] text-[#f4f2ed] flex flex-col items-center justify-center p-6 select-none overflow-hidden transition-opacity duration-150 pointer-events-auto"
    >
      {/* 2D Canvas Starfield */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Ambient Radial Deep Navy Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.07)_0%,_rgba(3,6,17,0.92)_70%)] pointer-events-none" />

      {/* Subtle overlay brightening during countdown T-3 to T-1 */}
      <div
        style={{ opacity: brightenOpacity }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.25)_0%,_transparent_75%)] pointer-events-none transition-opacity duration-200"
      />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center text-center">
        {/* Subsystem Header Monospace Badge */}
        <div
          style={{ opacity: nameOpacity }}
          className="text-[10px] tracking-[0.28em] uppercase text-cyan-400/80 font-mono mb-6"
        >
          {strings.subsystemTag}
        </div>

        {/* Name Title (English + Kannada) */}
        <div
          style={{
            opacity: nameOpacity,
            transform: `translateY(${nameTranslateY}px)`,
          }}
          className="flex flex-col items-center gap-1.5 mb-10 transition-transform duration-75"
        >
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#f4f2ed] font-display">
            {strings.nameEnglish}
          </h1>
          <span className="text-base sm:text-lg text-cyan-400 font-kannada tracking-wide">
            {strings.nameKannada}
          </span>
        </div>

        {/* Monospace Status Subsystem Checklist */}
        <div className="w-full bg-[#050a18]/80 border border-white/10 rounded-xl p-4 sm:p-5 backdrop-blur-md mb-6 shadow-2xl">
          <div className="flex flex-col space-y-2.5 text-left font-mono text-xs sm:text-[13px]">
            {strings.statusLines.map((line, idx) => {
              if (prefersReduced) {
                return (
                  <div key={line.id} className="flex justify-between items-center text-white/90">
                    <span className="tracking-wider">{line.label}</span>
                    <span className="text-emerald-400 font-bold tracking-widest font-mono">
                      ... {line.done || line.result}
                    </span>
                  </div>
                );
              }

              const lineStart = idx * typingSlotSec;
              const lineTime = typingElapsed - lineStart;
              const isStarted = lineTime > 0;
              const isFinished = lineTime >= typingSlotSec;

              if (!isStarted) {
                return (
                  <div key={line.id} className="flex justify-between items-center text-white/20">
                    <span className="tracking-wider">{line.label}</span>
                    <span className="font-mono text-[11px] tracking-widest text-white/15">... PENDING</span>
                  </div>
                );
              }

              // Typing label
              const textLength = line.label.length;
              const typeCharCount = isFinished
                ? textLength
                : Math.min(Math.floor((lineTime / (typingSlotSec * 0.6)) * textLength), textLength);
              const typedText = line.label.slice(0, typeCharCount);

              // Status result
              let resultStr = '';
              let resultClass = 'text-emerald-400';
              if (line.id === 'assets') {
                if (assetsLoaded && (isFinished || elapsed >= timings.countdownStart)) {
                  resultStr = `... ${line.done}`;
                  resultClass = 'text-emerald-400 font-bold';
                } else {
                  resultStr = `... ${line.pending}`;
                  resultClass = 'text-amber-400 animate-pulse font-semibold';
                }
              } else {
                resultStr = isFinished ? `... ${line.result}` : '';
              }

              return (
                <div key={line.id} className="flex justify-between items-center text-white/90">
                  <span className="tracking-wider font-mono">
                    {typedText}
                    {!isFinished && <span className="inline-block w-1.5 h-3 ml-0.5 bg-cyan-400 animate-pulse" />}
                  </span>
                  <span className={`font-mono text-xs tracking-widest ${resultClass}`}>
                    {resultStr}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Thin Cyan Accent Progress Bar */}
          <div className="w-full mt-4 pt-3 border-t border-white/10 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-mono tracking-widest text-white/50 uppercase">
              <span>INITIALIZING SYSTEM BUS</span>
              <span className="text-cyan-400 font-bold">{progressBarPercent.toFixed(0)}%</span>
            </div>
            <div className="w-full h-[2.5px] bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-300 rounded-full transition-all duration-75 shadow-[0_0_10px_rgba(56,189,248,0.7)]"
                style={{ width: `${progressBarPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Countdown T-3, T-2, T-1 Display */}
        <div className="h-10 flex items-center justify-center font-mono font-bold tracking-widest text-xl sm:text-2xl text-cyan-300 drop-shadow-[0_0_16px_rgba(56,189,248,0.7)]">
          {countdownText && (
            <span className="animate-pulse">{countdownText}</span>
          )}
        </div>
      </div>

      {/* Small Minimalist Skip Button (Bottom Right) */}
      <button
        onClick={handleSkip}
        className="fixed bottom-6 right-6 z-20 font-mono text-[11px] tracking-[0.25em] uppercase text-white/50 hover:text-cyan-300 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-cyan-400/40 px-3.5 py-1.5 rounded-md backdrop-blur-sm transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
      >
        {strings.skipButton}
      </button>
    </div>
  );
};

export default LaunchPreloader;
