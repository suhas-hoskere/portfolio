import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, ShieldCheck, Terminal, Radio, Cpu, Sparkles, FastForward, Flame } from 'lucide-react';
import { cosmicAudio } from './AudioEngine';

interface LaunchPreloaderProps {
  onShowDashboard?: () => void;
  onIgnition?: () => void;
  onComplete: () => void;
}

export const LaunchPreloader: React.FC<LaunchPreloaderProps> = ({ onShowDashboard, onIgnition, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [tMinus, setTMinus] = useState('05.00');
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isDashboardRevealed, setIsDashboardRevealed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const completedRef = useRef(false);
  const showDashboardTriggered = useRef(false);
  const ignitionTriggered = useRef(false);
  const lastBeepSecRef = useRef(6);
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

  const checklistSteps = [
    { id: 1, label: 'SDSC SHAR LAUNCH COMPLEX // SECOND LAUNCH PAD', status: 'READY' },
    { id: 2, label: 'CRYOGENIC LH2 / LOX DEWAR MANIFOLDS & UMBILICAL TOWER', status: 'PRESSURIZED' },
    { id: 3, label: 'THREE.JS GPU RENDER PIPELINE & RAYLEIGH ATMOSPHERE', status: 'COMPILED' },
    { id: 4, label: 'DASHBOARD TELEMETRY & CHANDRAYAAN-3 STACK', status: 'ONLINE' },
    { id: 5, label: 'SOLID ROCKET BOOSTER IGNITION ARMING SEQUENCE', status: 'ARMED' },
    { id: 6, label: 'MISSION FLIGHT DIRECTOR // SUHAS HOSKERE PORTFOLIO', status: 'GO FOR LAUNCH' },
  ];

  const handleSkip = useCallback(() => {
    if (!completedRef.current) {
      completedRef.current = true;
      setProgress(100);
      setTMinus('00.00');
      cosmicAudio.playCountdownBeep(true);
      if (onShowDashboardRef.current) onShowDashboardRef.current();
      if (onIgnitionRef.current) onIgnitionRef.current();
      setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          onCompleteRef.current();
        }, 350);
      }, 700);
    }
  }, []);

  // Frame-rate independent, lag-resistant countdown ticker (Guarantees smooth 5.00s countdown)
  useEffect(() => {
    const totalDurationSec = 5.0; // Exact 5.00s mission countdown
    let elapsedSec = 0;
    let lastTime = performance.now();
    let rafId: number;

    const tick = (now: number) => {
      if (completedRef.current) return;

      const rawDeltaSec = (now - lastTime) / 1000;
      lastTime = now;

      // Anti-hang clamping: clamp maximum step to 0.10s to stay accurate to real time without skipping
      const safeDelta = Math.min(Math.max(rawDeltaSec, 0), 0.10);
      elapsedSec += safeDelta;

      const rawProgress = Math.min(elapsedSec / totalDurationSec, 1.0);
      const remainingSec = Math.max(totalDurationSec - elapsedSec, 0);

      setProgress(rawProgress * 100);

      // Countdown display: 05.00 down to 00.00
      const sec = Math.floor(remainingSec);
      const ms = Math.floor((remainingSec % 1) * 100);
      const secStr = sec.toString().padStart(2, '0');
      const msStr = ms.toString().padStart(2, '0');
      setTMinus(`${secStr}.${msStr}`);

      // Play authentic radar telemetry beeps on each second
      if (sec !== lastBeepSecRef.current && sec <= 5 && remainingSec > 0.05) {
        lastBeepSecRef.current = sec;
        cosmicAudio.playCountdownBeep(false);
      }

      // At T-03.00: Reveal dashboard telemetry while countdown continues smoothly
      if (remainingSec <= 3.0 && !showDashboardTriggered.current) {
        showDashboardTriggered.current = true;
        setIsDashboardRevealed(true);
        if (onShowDashboardRef.current) onShowDashboardRef.current();
      }

      // Active checklist milestone
      const stepIdx = Math.min(Math.floor(rawProgress * checklistSteps.length), checklistSteps.length - 1);
      setActiveStepIndex(stepIdx);

      // At T-00.00: Ignition & Liftoff!
      if (rawProgress >= 1.0) {
        completedRef.current = true;
        setTMinus('00.00');
        if (lastBeepSecRef.current !== 0) {
          lastBeepSecRef.current = 0;
          cosmicAudio.playCountdownBeep(true);
        }
        if (onShowDashboardRef.current) onShowDashboardRef.current();
        if (!ignitionTriggered.current) {
          ignitionTriggered.current = true;
          if (onIgnitionRef.current) onIgnitionRef.current();
        }
        // Keep countdown badge visible for 0.85s after liftoff so user clearly sees the 00.00 ignition event
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            onCompleteRef.current();
          }, 350);
        }, 850);
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [checklistSteps.length]);

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none select-none font-mono">
      {/* 1. PRE-FLIGHT TELEMETRY INTRO OVERLAY (Frames the left 50%, leaving the 3D rocket visible on the right from T-5!) */}
      <AnimatePresence>
        {!isDashboardRevealed && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -25, transition: { duration: 0.7, ease: 'easeInOut' } }}
            className="absolute inset-0 bg-gradient-to-r from-[#030611] via-[#030611]/85 to-transparent flex flex-col justify-between p-6 sm:p-10 pointer-events-auto"
          >
            {/* Background Grid & Star Accents */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4 max-w-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                  <Rocket className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs tracking-[0.25em] text-white/50 uppercase">ISRO // SDSC SHAR SRIHARIKOTA</div>
                  <div className="text-sm font-semibold tracking-wider text-white">CHANDRAYAAN-3 LAUNCH SEQUENCE</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>PAD TELEMETRY: NOMINAL</span>
                </div>
                <button
                  onClick={handleSkip}
                  className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  <span>SKIP TO IGNITION</span>
                  <FastForward className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Center Checklist & Progress (Left-aligned, leaving the rocket fully visible on the right) */}
            <div className="relative z-10 max-w-lg lg:max-w-xl my-auto pt-16 pb-4 space-y-4">
              {/* Progress Bar */}
              <div className="w-full space-y-2">
                <div className="flex justify-between items-center text-xs tracking-wider">
                  <span className="text-white/60 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>SYSTEM INITIALIZATION & PAD PRESSURIZATION</span>
                  </span>
                  <span className="text-cyan-400 font-bold">{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 border border-white/10 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.6)] transition-all duration-75"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Subsystem Telemetry Checklist */}
              <div className="w-full bg-black/60 border border-white/10 rounded-xl p-4 sm:p-5 backdrop-blur-md space-y-2">
                <div className="text-[10px] tracking-[0.25em] text-white/40 uppercase mb-1 flex items-center gap-2">
                  <Terminal className="w-3 h-3 text-white/50" />
                  <span>PRE-FLIGHT TELEMETRY VERIFICATION</span>
                </div>
                {checklistSteps.map((step, idx) => {
                  const isDone = idx <= activeStepIndex;
                  const isCurrent = idx === activeStepIndex;
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center justify-between text-xs transition-colors duration-150 ${
                        isDone ? 'text-white' : 'text-white/25'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                          isDone ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-white/5 text-white/30'
                        }`}>
                          {isDone ? '✓' : idx + 1}
                        </span>
                        <span className={`truncate ${isCurrent ? 'text-cyan-300 font-semibold' : ''}`}>
                          {step.label}
                        </span>
                      </div>
                      <span className={`text-[11px] font-bold tracking-wider shrink-0 ${
                        isDone ? 'text-emerald-400' : 'text-white/20'
                      }`}>
                        {isDone ? step.status : 'PENDING'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-white/40 border-t border-white/10 pt-4 gap-2 max-w-xl">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>ALL CRITICAL SYSTEMS VERIFIED · SDSC SHAR SECOND LAUNCH PAD</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>SUHAS HOSKERE // PORTFOLIO MISSION</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. PROMINENT FLOATING COUNTDOWN TIMER (Always 100% visible, centered at top, zero clipping) */}
      <AnimatePresence>
        {!isExiting && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.35 } }}
            className="fixed top-4 sm:top-5 left-1/2 -translate-x-1/2 z-[120] pointer-events-auto"
          >
            <div className={`px-5 py-2.5 sm:px-7 sm:py-3 rounded-2xl bg-[#030611]/92 border ${
              tMinus === '00.00' ? 'border-emerald-500/80 shadow-[0_0_50px_rgba(16,185,129,0.5)]' : 'border-orange-500/60 shadow-[0_0_40px_rgba(249,115,22,0.4)]'
            } backdrop-blur-xl text-center flex flex-col items-center transition-colors duration-300`}>
              <div className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-semibold mb-0.5 flex items-center justify-center gap-2">
                {tMinus === '00.00' ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <Rocket className="w-3.5 h-3.5 animate-bounce" />
                    <span>LIFTOFF // CHANDRAYAAN-3</span>
                  </span>
                ) : isDashboardRevealed ? (
                  <span className="text-amber-400 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                    <span>ARMED // MAIN ENGINE IGNITION</span>
                  </span>
                ) : (
                  <span className="text-orange-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-orange-400 animate-spin" />
                    <span>LAUNCH COUNTDOWN CLOCK</span>
                  </span>
                )}
              </div>

              <div className="text-3xl sm:text-5xl font-black tracking-tight text-white font-mono drop-shadow-[0_0_25px_rgba(249,115,22,0.7)]">
                T-MINUS <span className={tMinus === '00.00' ? 'text-emerald-400' : 'text-orange-400'}>{tMinus}</span>
              </div>

              <div className="text-[9px] sm:text-[10px] text-white/70 tracking-widest uppercase font-medium mt-0.5">
                {tMinus === '00.00'
                  ? 'SOLID ROCKET BOOSTER IGNITION CONFIRMED'
                  : isDashboardRevealed
                  ? 'DASHBOARD ONLINE · IGNITION AT T-00.00'
                  : 'AUTONOMOUS FLIGHT CONTROLLER SEQUENCE'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};