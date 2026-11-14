import React, { useState } from 'react';
import { Volume2, VolumeX, ChevronDown, Rocket } from 'lucide-react';
import { cosmicAudio } from './AudioEngine';

export interface StageWaypoint {
  id: string;
  stageName: string;
  altitude: string;
  scrollFraction: number;
}

export const STAGES: StageWaypoint[] = [
  { id: 'pad', stageName: 'Launch Pad', altitude: '0 km (Ground Zero)', scrollFraction: 0.0 },
  { id: 'ascent', stageName: 'Ascent (Max-Q)', altitude: '14 km (Atmosphere)', scrollFraction: 0.20 },
  { id: 'orbit', stageName: 'Low Earth Orbit', altitude: '420 km (LEO & EVA)', scrollFraction: 0.40 },
  { id: 'moon', stageName: 'Lunar Flyby', altitude: '384,400 km (Lunar)', scrollFraction: 0.60 },
  { id: 'mars', stageName: 'Mars Encounter', altitude: '225M km (Mangalyaan)', scrollFraction: 0.78 },
  { id: 'signal', stageName: 'Uplink Transmission', altitude: 'Deep Space (Terminal)', scrollFraction: 0.95 },
];

interface FlightHUDProps {
  scrollProgress: number;
  activeStageIndex: number;
  audioActive: boolean;
  onToggleAudio: () => void;
  onJumpToStage: (fraction: number) => void;
}

export const FlightHUD: React.FC<FlightHUDProps> = ({
  scrollProgress,
  activeStageIndex,
  audioActive,
  onToggleAudio,
  onJumpToStage,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const currentStage = STAGES[activeStageIndex] || STAGES[0];

  return (
    <header className="fixed inset-0 pointer-events-none z-30 select-none">
      {/* ===== REFINED TOP BAR ===== */}
      <div className="absolute top-0 left-0 right-0 p-5 sm:p-7 flex items-center justify-between">
        {/* Identity & Heritage */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-400/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Rocket className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-space text-sm sm:text-base font-bold text-white tracking-tight">
                Suhas Hoskere
              </span>
              <span className="font-kannada text-xs font-semibold text-amber-400">
                ಸುಹಾಸ್ ಹೊಸಕೆರೆ
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">
              PES University // Bangalore · AI & ML
            </p>
          </div>
        </div>

        {/* Minimal Audio Toggle */}
        <button
          onClick={onToggleAudio}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e131f]/80 border border-white/15 hover:border-cyan-400/60 text-slate-200 hover:text-white font-mono text-xs backdrop-blur-md transition-all pointer-events-auto cursor-pointer shadow-sm"
          aria-label="Toggle Rocket Acoustic Sound"
        >
          {audioActive ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="text-cyan-300 text-[11px] font-mono font-medium">ACOUSTICS: ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 text-[11px] font-mono">ACOUSTICS: OFF</span>
            </>
          )}
        </button>
      </div>

      {/* ===== SLEEK MINIMAL VERTICAL FLIGHT RAIL (Right Margin) ===== */}
      <nav
        aria-label="Flight trajectory navigation"
        className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 hidden sm:flex flex-col items-center gap-3 pointer-events-auto py-3 px-1.5"
      >
        <div className="relative flex flex-col items-center justify-between h-48">
          {/* Subtle connecting track line */}
          <div className="absolute top-1 bottom-1 w-[1.5px] bg-white/10 rounded-full" />

          {/* Active progress indicator pip */}
          <div
            className="absolute w-[2px] bg-gradient-to-b from-cyan-400 via-sky-400 to-amber-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
            style={{
              top: '4px',
              height: `${Math.min(Math.max((scrollProgress / 0.95) * 100, 0), 100)}%`,
            }}
          />

          {/* Waypoint Pips */}
          {STAGES.map((s, idx) => {
            const isActive = idx === activeStageIndex;
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={s.id}
                className="relative flex items-center justify-center cursor-pointer group py-1"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => {
                  cosmicAudio.playTelemetryChirp(1200, 0.04);
                  onJumpToStage(s.scrollFraction);
                }}
              >
                {/* Floating tooltip only on hover or active */}
                {(isHovered || (isActive && hoveredIdx === null)) && (
                  <div
                    className={`absolute right-7 px-3 py-1.5 rounded-lg backdrop-blur-xl border text-right whitespace-nowrap transition-all duration-200 pointer-events-none ${
                      isActive
                        ? 'bg-[#0e131f]/95 border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.25)] opacity-100 scale-100'
                        : 'bg-[#080e1a]/95 border-white/15 opacity-90 scale-95'
                    }`}
                  >
                    <div className="text-[11px] font-space font-semibold text-white tracking-tight">
                      {s.stageName}
                    </div>
                    <div className="text-[9px] font-mono text-cyan-300/90 tracking-wider">
                      {s.altitude}
                    </div>
                  </div>
                )}

                {/* Minimalist 6px Pip */}
                <button
                  aria-label={`Jump to ${s.stageName}`}
                  className={`w-2 h-2 rounded-full transition-all duration-300 focus:outline-none cursor-pointer ${
                    isActive
                      ? 'w-2.5 h-2.5 bg-cyan-400 ring-4 ring-cyan-400/30 shadow-[0_0_12px_rgba(6,182,212,0.8)] scale-125'
                      : 'bg-white/30 hover:bg-cyan-200 hover:scale-125'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </nav>

      {/* ===== BOTTOM STATUS BADGE & SCROLL PROMPT ===== */}
      <div className="absolute bottom-5 left-0 right-0 flex flex-col items-center justify-center gap-1.5 pointer-events-none">
        {scrollProgress < 0.08 && (
          <div className="flex flex-col items-center gap-1 animate-bounce opacity-85">
            <span className="text-[10px] font-mono tracking-[0.2em] text-slate-300 uppercase font-medium">
              SCROLL // OR PRESS IGNITION TO LAUNCH
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
          </div>
        )}

        {scrollProgress >= 0.08 && (
          <div className="px-3.5 py-1.5 rounded-full bg-[#0e131f]/85 backdrop-blur-xl border border-cyan-500/30 flex items-center gap-2 shadow-[0_0_18px_rgba(6,182,212,0.2)]">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono text-cyan-200/90 tracking-wider uppercase font-medium">
              LIVE TELEMETRY // {currentStage.altitude}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
