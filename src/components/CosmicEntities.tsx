import React, { useState } from 'react';
import { Rocket as RocketIcon } from 'lucide-react';
import { cosmicAudio } from '../utils/audio';

// Visual 3D Planet Earth with atmospheric glow
export const PlanetEarth: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 280 }) => {
  return (
    <div
      className={`relative rounded-full select-none pointer-events-none group ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer Atmospheric Aura */}
      <div 
        className="absolute -inset-4 rounded-full bg-cyan-400/20 blur-xl animate-pulse-subtle"
        style={{ animationDuration: '4s' }}
      />
      
      {/* Planetary Sphere Container */}
      <div 
        className="relative w-full h-full rounded-full overflow-hidden shadow-[inset_-25px_-20px_50px_rgba(0,0,0,0.85),0_0_35px_rgba(56,189,248,0.4)] border border-cyan-400/30"
        style={{
          background: 'radial-gradient(circle at 35% 30%, #38bdf8 0%, #0369a1 40%, #082f49 70%, #020617 100%)',
        }}
      >
        {/* Real Earth Texture Overlay */}
        <img
          src="https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=800&q=80"
          alt="Planet Earth"
          className="w-full h-full object-cover mix-blend-screen opacity-90 scale-110"
        />

        {/* Sunlight Specular Rim */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-cyan-400/10 to-white/40 pointer-events-none" />

        {/* Night side Shadow terminator */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-transparent to-black/80 pointer-events-none" />
      </div>

      {/* Orbiting Satellite Indicator */}
      <div className="absolute inset-[-18px] rounded-full border border-dashed border-cyan-400/25 animate-radar pointer-events-none" style={{ animationDuration: '24s' }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_12px_#38bdf8] flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></div>
        </div>
      </div>
    </div>
  );
};

// Visual Detailed Moon with craters
export const CrateredMoon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 180 }) => {
  return (
    <div
      className={`relative rounded-full select-none pointer-events-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Lunar Ambient Glow */}
      <div className="absolute -inset-3 rounded-full bg-slate-200/15 blur-lg" />

      {/* Moon Body */}
      <div 
        className="relative w-full h-full rounded-full overflow-hidden shadow-[inset_-20px_-15px_40px_rgba(0,0,0,0.9),0_0_25px_rgba(226,232,240,0.25)] border border-slate-400/20"
        style={{
          background: 'radial-gradient(circle at 40% 35%, #f1f5f9 0%, #cbd5e1 45%, #64748b 80%, #0f172a 100%)',
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1532693322450-2cb5c511067d?auto=format&fit=crop&w=600&q=80"
          alt="The Moon"
          className="w-full h-full object-cover mix-blend-multiply opacity-85"
        />
        {/* Soft lunar surface rim lighting */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-transparent to-white/30 pointer-events-none" />
      </div>

      {/* Lunar Coordinates Tag */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] text-slate-400 bg-space-950/80 px-2 py-0.5 rounded border border-slate-800">
        MOON // 384,400 KM
      </div>
    </div>
  );
};

// Floating Spacewalking Astronaut in Zero Gravity
export const FloatingAstronaut: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative group cursor-pointer ${className}`}>
      {/* Zero-G Float Container */}
      <div className="animate-float">
        
        {/* Tether line drifting to mother ship */}
        <svg
          className="absolute -top-16 -left-12 w-24 h-24 pointer-events-none stroke-cyan-400/40"
          fill="none"
          viewBox="0 0 100 100"
        >
          <path
            d="M 10,10 Q 50,40 85,85"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        </svg>

        {/* Astronaut Photo Card with Glass Helmet Ring */}
        <div className="relative w-48 sm:w-56 h-48 sm:h-56 rounded-2xl overflow-hidden glass-panel border-2 border-cyan-400/40 shadow-[0_0_30px_rgba(56,189,248,0.25)] transition-all duration-300 group-hover:scale-105 group-hover:border-cyan-300">
          <img
            src="https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80"
            alt="Astronaut in Spacewalk"
            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
          />

          {/* Helmet Visor Cosmic Reflection Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-space-950/90 via-transparent to-cyan-500/10 pointer-events-none" />

          {/* Astronaut Badge */}
          <div className="absolute bottom-3 left-3 right-3 p-2 rounded-lg bg-space-950/85 backdrop-blur-md border border-cyan-500/30 flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold">SUHAS // EVA-01</span>
            </div>
            <span className="text-slate-400 text-[10px]">O₂ 98%</span>
          </div>
        </div>

      </div>
    </div>
  );
};

// Interactive Rocket Launchpad
export const LaunchingRocketWidget: React.FC = () => {
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunch = () => {
    if (isLaunching) return;
    setIsLaunching(true);
    cosmicAudio.playLockSound();
    setTimeout(() => {
      setIsLaunching(false);
    }, 4500);
  };

  return (
    <div className="relative inline-block">
      {/* Rocket Launch Animation Container */}
      <div 
        className={`relative transition-all duration-[3500ms] ease-in-out ${
          isLaunching ? '-translate-y-[600px] scale-75 opacity-0' : 'translate-y-0 scale-100 opacity-100'
        }`}
      >
        {/* Rocket Image Display */}
        <div className="w-36 h-48 sm:w-44 sm:h-56 rounded-2xl overflow-hidden glass-panel border border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.25)] relative group">
          <img
            src="https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=600&q=80"
            alt="Rocket Launch"
            className="w-full h-full object-cover object-bottom group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-transparent to-transparent pointer-events-none" />
          
          <div className="absolute bottom-2.5 left-2.5 right-2.5 p-1.5 rounded bg-space-950/90 border border-amber-500/30 text-[10px] font-mono text-amber-300 text-center">
            {isLaunching ? '🚀 PROPULSION MAXIMUM' : 'VEHICLE READY FOR LAUNCH'}
          </div>
        </div>

        {/* Dynamic Fiery Thruster Exhaust Plume when launching */}
        {isLaunching && (
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
            <div className="w-8 h-20 bg-gradient-to-b from-amber-300 via-orange-500 to-transparent blur-md rounded-full animate-pulse" />
            <div className="w-16 h-16 bg-orange-500/40 blur-xl rounded-full -mt-10" />
          </div>
        )}
      </div>

      {/* Launch Control Button */}
      <div className="mt-4 text-center">
        <button
          onClick={handleLaunch}
          disabled={isLaunching}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-space-950 font-bold font-mono text-xs tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
        >
          <RocketIcon className={`w-4 h-4 ${isLaunching ? 'animate-bounce' : ''}`} />
          <span>{isLaunching ? 'ASCENDING TO ORBIT...' : 'TRIGGER ROCKET LAUNCH'}</span>
        </button>
      </div>
    </div>
  );
};
