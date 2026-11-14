import React from 'react';
import { ArrowRight, Radio, Orbit } from 'lucide-react';
import { PlanetEarth, CrateredMoon, FloatingAstronaut, LaunchingRocketWidget } from './CosmicEntities';
import { cosmicAudio } from '../utils/audio';

export const CosmicHero: React.FC = () => {
  return (
    <section id="mission" className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
      
      {/* Visual Celestial Bodies in Background Orbit */}
      <div className="absolute top-12 right-4 lg:right-16 opacity-80 pointer-events-none z-0">
        <CrateredMoon size={160} />
      </div>

      <div className="absolute -bottom-10 -left-16 lg:left-8 opacity-75 pointer-events-none z-0">
        <PlanetEarth size={320} />
      </div>

      {/* Hero Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-400/40 text-cyan-300 font-mono text-xs shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <Orbit className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
            <span>PES UNIVERSITY EC CAMPUS // BANGALORE</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>SPACE MISSION ARCHITECTURE</span>
          </div>
        </div>

        {/* Main Grid: Headline & Visual Astronaut/Rocket showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text & Bio */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              Exploring <br />
              <span className="cosmic-gradient-text">Cosmic Frontiers</span> <br />
              with AI & Code.
            </h1>

            <p className="text-xl font-medium text-cyan-300 font-mono">
              Suhas Hoskere // AI/ML & Full-Stack Engineer
            </p>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-light">
              Crafting intelligent systems from Earth to Orbit. Specializing in <strong className="text-white font-medium">Large Language Models, Computer Vision, Voice Telemetry (Whisper, Vosk, Moonshine & TTS)</strong>, and <strong className="text-white font-medium">Full-Stack Web & Desktop Architectures (Next.js, React, MongoDB, PyQt6)</strong>.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2 font-mono text-xs">
              <a
                href="#payloads"
                onClick={() => cosmicAudio.playLockSound()}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold tracking-wider shadow-[0_0_25px_rgba(56,189,248,0.4)] transition-all transform hover:-translate-y-0.5"
              >
                <span>EXPLORE MISSIONS</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#contact"
                onClick={() => cosmicAudio.playTelemetryChirp()}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-space-900/80 hover:bg-space-850 text-cyan-300 border border-cyan-500/40 hover:border-cyan-300 tracking-wider transition-all"
              >
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>GROUND CONTROL UPLINK</span>
              </a>
            </div>

            {/* Quick stats pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-800 font-mono text-xs">
              <div className="p-3 rounded-xl bg-space-900/60 border border-cyan-500/20">
                <span className="text-cyan-400 text-[10px] block">PROPULSION</span>
                <span className="text-white font-bold">Python 3.12</span>
              </div>
              <div className="p-3 rounded-xl bg-space-900/60 border border-cyan-500/20">
                <span className="text-cyan-400 text-[10px] block">ACOUSTIC STT</span>
                <span className="text-white font-bold">Whisper / Vosk</span>
              </div>
              <div className="p-3 rounded-xl bg-space-900/60 border border-cyan-500/20">
                <span className="text-cyan-400 text-[10px] block">INTERFACES</span>
                <span className="text-white font-bold">Next.js / React</span>
              </div>
              <div className="p-3 rounded-xl bg-space-900/60 border border-cyan-500/20">
                <span className="text-cyan-400 text-[10px] block">STATION</span>
                <span className="text-emerald-400 font-bold">PESU Bangalore</span>
              </div>
            </div>

          </div>

          {/* Right Visual Stage: Floating Astronaut & Rocket Launch Widget */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-8 relative">
            
            {/* The Floating Astronaut */}
            <div className="relative">
              <FloatingAstronaut />
            </div>

            {/* The Rocket Launch Controller */}
            <div className="relative">
              <LaunchingRocketWidget />
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
