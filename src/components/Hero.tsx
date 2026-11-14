import React, { useState, useEffect } from 'react';
import { Terminal, ArrowRight, ShieldCheck, Cpu, Radio, Orbit } from 'lucide-react';
import { cosmicAudio } from '../utils/audio';

const BOOT_LOGS = [
  'Establishing telemetry link with Ground Station Bangalore...',
  'Station coordinates verified: 12.8468° N, 77.6749° E [PESU EC]',
  'Loading Python neural kernels & Scikit-learn runtime... [OK]',
  'Mounting speech telemetry: Whisper + Vosk + Moonshine STT... [ONLINE]',
  'Initializing Computer Vision & feature extraction pipelines... [READY]',
  'Spinning up Next.js / React reactive control surface... [SYNCHRONIZED]',
  'Verifying Open Source payload signatures... 100% VERIFIED',
  'All avionics green. Mission Commander Suhas Hoskere active.',
];

export const Hero: React.FC = () => {
  const [activeLogIndex, setActiveLogIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveLogIndex((prev) => (prev < BOOT_LOGS.length - 1 ? prev + 1 : prev));
    }, 600);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="mission" className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-600/15 via-indigo-600/15 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Mission Briefing */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Status chip */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="tracking-widest uppercase">PES UNIVERSITY EC CAMPUS // AI/ML MISSION</span>
            </div>

            {/* Hero Main Heading */}
            <div className="space-y-2">
              <p className="font-mono text-xs text-cyan-400 tracking-widest uppercase">
                // MISSION COMMANDER & SYSTEMS DEVELOPER
              </p>
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Architecting <br className="hidden sm:inline" />
                <span className="cosmic-gradient-text">Intelligent Horizons</span> <br />
                from Earth to Orbit.
              </h1>
            </div>

            {/* Biography */}
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-light">
              Hi, I am <strong className="text-white font-medium">Suhas Hoskere</strong>. I engineer high-performance systems at the intersection of <span className="text-cyan-300 font-normal">Artificial Intelligence, Speech & Voice Pipelines, and Modern Full-Stack Web Platforms</span>. Grounded in Bangalore, driven by the limitless expanse of space exploration and autonomous computation.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2 font-mono text-xs">
              <a
                href="#payloads"
                onClick={() => cosmicAudio.playLockSound()}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold tracking-wider shadow-[0_0_25px_rgba(56,189,248,0.35)] transition-all transform hover:-translate-y-0.5"
              >
                <span>EXPLORE MISSIONS</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#contact"
                onClick={() => cosmicAudio.playTelemetryChirp()}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-space-900/80 hover:bg-space-850 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 tracking-wider transition-all"
              >
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>OPEN TRANSMISSION</span>
              </a>
            </div>

            {/* Subsystem Telemetry Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-800/80 font-mono text-xs">
              <div className="p-2.5 rounded bg-space-900/40 border border-cyan-500/15">
                <span className="text-cyan-400/70 text-[10px] block">PROPULSION</span>
                <span className="font-semibold text-slate-200">Python 3.12</span>
              </div>
              <div className="p-2.5 rounded bg-space-900/40 border border-cyan-500/15">
                <span className="text-cyan-400/70 text-[10px] block">VOICE TELEMETRY</span>
                <span className="font-semibold text-slate-200">Whisper / Vosk</span>
              </div>
              <div className="p-2.5 rounded bg-space-900/40 border border-cyan-500/15">
                <span className="text-cyan-400/70 text-[10px] block">ORBITAL INTERFACE</span>
                <span className="font-semibold text-slate-200">Next.js / React</span>
              </div>
              <div className="p-2.5 rounded bg-space-900/40 border border-cyan-500/15">
                <span className="text-cyan-400/70 text-[10px] block">SOURCE STATUS</span>
                <span className="font-semibold text-emerald-400">100% Open</span>
              </div>
            </div>

          </div>

          {/* Right Column: Mission Control Terminal & Telemetry HUD */}
          <div className="lg:col-span-5">
            <div className="relative rounded-xl border border-cyan-500/30 bg-space-900/90 shadow-2xl overflow-hidden glass-panel">
              
              {/* Terminal Window Bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-space-950/90 border-b border-cyan-500/20 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                  <span className="ml-2 text-slate-400 text-[11px] flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>orb-telemetry // bash</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-cyan-400/80 text-[10px]">
                  <Orbit className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
                  <span>LEO_TRACK</span>
                </div>
              </div>

              {/* Console Output Area */}
              <div className="p-5 font-mono text-xs space-y-2.5 min-h-[300px] max-h-[360px] overflow-y-auto">
                {BOOT_LOGS.slice(0, activeLogIndex + 1).map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-300">
                    <span className="text-cyan-400 select-none">›</span>
                    <span className={idx === activeLogIndex ? 'text-cyan-200' : 'text-slate-400'}>
                      {log}
                    </span>
                  </div>
                ))}
                {activeLogIndex < BOOT_LOGS.length - 1 && (
                  <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
                    <span>›</span>
                    <span className="inline-block w-2 h-4 bg-cyan-400"></span>
                  </div>
                )}
              </div>

              {/* Terminal Status Footer */}
              <div className="p-3 bg-space-950/70 border-t border-cyan-900/30 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>SUBSYSTEMS NORMAL</span>
                </div>
                <div className="flex items-center gap-1.5 text-cyan-300">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>THREAD COUNT: OPTIMAL</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
