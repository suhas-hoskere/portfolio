import React, { useState, useMemo } from 'react';
import { Volume2, VolumeX, ChevronDown, Rocket, Terminal, Layers, Camera } from 'lucide-react';
import { cosmicAudio } from './AudioEngine';

export interface StageWaypoint {
  id: string;
  stageName: string;
  altitude: string;
  scrollFraction: number;
}

export const STAGES: StageWaypoint[] = [
  { id: 'pad', stageName: 'Launch Pad', altitude: '0 km (Ground Zero)', scrollFraction: 0.0 },
  { id: 'ascent', stageName: 'Ascent (Max-Q)', altitude: '14 km (Atmosphere)', scrollFraction: 0.27 },
  { id: 'orbit', stageName: 'Low Earth Orbit', altitude: '420 km (LEO & EVA)', scrollFraction: 0.39 },
  { id: 'moon', stageName: 'Lunar Flyby', altitude: '384,400 km (Lunar)', scrollFraction: 0.58 },
  { id: 'mars', stageName: 'Mars Encounter', altitude: '225M km (Mangalyaan)', scrollFraction: 0.78 },
  { id: 'signal', stageName: 'Uplink Transmission', altitude: 'Deep Space (Terminal)', scrollFraction: 0.94 },
];

interface FlightHUDProps {
  scrollProgress: number;
  activeStageIndex: number;
  audioActive: boolean;
  onToggleAudio: () => void;
  onJumpToStage: (fraction: number) => void;
  cameraMode?: 'CINEMATIC' | 'BOOSTER' | 'CHASE';
  onSetCameraMode?: (mode: 'CINEMATIC' | 'BOOSTER' | 'CHASE') => void;
  blueprintMode?: boolean;
  onToggleBlueprint?: () => void;
  onOpenTerminal?: () => void;
}

export const FlightHUD: React.FC<FlightHUDProps> = ({
  scrollProgress,
  activeStageIndex,
  audioActive,
  onToggleAudio,
  onJumpToStage,
  cameraMode = 'CINEMATIC',
  onSetCameraMode,
  blueprintMode = false,
  onToggleBlueprint,
  onOpenTerminal,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Dynamic Aerospace Telemetry Computer
  const telemetry = useMemo(() => {
    const sp = scrollProgress;
    if (sp < 0.035) {
      return {
        status: 'STANDBY // HOLD-DOWN ACTIVE',
        altitude: '0.0 KM',
        velocity: '0 M/S',
        dynPressure: '101.3 KPA',
        gForce: '1.00 G',
      };
    } else if (sp < 0.080) {
      return {
        status: 'STEP 01 // MAIN ENGINE IGNITION',
        altitude: '0.0 KM',
        velocity: '0 M/S',
        dynPressure: '101.3 KPA',
        gForce: '1.25 G',
      };
    } else if (sp < 0.125) {
      return {
        status: 'STEP 02 // UMBILICAL CLAMPS RELEASE',
        altitude: '0.0 KM',
        velocity: '0 M/S',
        dynPressure: '101.3 KPA',
        gForce: '1.40 G',
      };
    } else if (sp < 0.170) {
      return {
        status: 'STEP 03 // WATER DELUGE & TRENCH SMOKE',
        altitude: '0.0 KM',
        velocity: '0 M/S',
        dynPressure: '101.3 KPA',
        gForce: '1.50 G',
      };
    } else if (sp < 0.240) {
      const climbFrac = (sp - 0.170) / 0.070;
      return {
        status: 'STEP 04 // POSITIVE LIFTOFF CLIMB',
        altitude: `${(0.1 + climbFrac * 11.9).toFixed(1)} KM`,
        velocity: `${Math.round(climbFrac * 420)} M/S`,
        dynPressure: `${(101.3 - climbFrac * 45).toFixed(1)} KPA`,
        gForce: `${(1.62 + climbFrac * 0.4).toFixed(2)} G`,
      };
    } else if (sp < 0.360) {
      const ascFrac = (sp - 0.240) / 0.120;
      const isMaxQ = sp >= 0.270 && sp <= 0.315;
      const isBoosterSep = sp > 0.315 && sp < 0.340;
      const isFairingSep = sp >= 0.340;
      const status = isFairingSep
        ? 'STAGE 01 // FAIRING JETTISON'
        : isBoosterSep
          ? 'STAGE 01 // S200 BOOSTER SEP'
          : isMaxQ
            ? 'STAGE 01 // TRANSONIC MAX-Q'
            : 'STAGE 01 // ATMOSPHERIC ASCENT';
      return {
        status,
        altitude: `${Math.round(12 + ascFrac * 173)} KM`,
        velocity: `${(0.42 + ascFrac * 7.24).toFixed(2)} KM/S`,
        dynPressure: isMaxQ ? '35.8 KPA (MAX-Q)' : `${(56.3 * Math.exp(-ascFrac * 4.5)).toFixed(2)} KPA`,
        gForce: `${(2.10 + Math.sin(ascFrac * Math.PI) * 0.85).toFixed(2)} G`,
      };
    } else if (sp < 0.520) {
      const isTliBurn = sp >= 0.470 && sp <= 0.515;
      return {
        status: isTliBurn ? 'STAGE 02 // TLI HYPERGOLIC BURN' : 'STAGE 02 // LOW EARTH ORBIT (LEO)',
        altitude: '420 KM (CIRCULAR)',
        velocity: isTliBurn ? '10.82 KM/S (TLI)' : '7.66 KM/S (ORBITAL)',
        dynPressure: '0.00 KPA (HARD VACUUM)',
        gForce: isTliBurn ? '1.15 G (TLI BURN)' : '0.00 G (MICROGRAVITY)',
      };
    } else if (sp < 0.740) {
      const moonFrac = (sp - 0.520) / 0.220;
      return {
        status: 'STAGE 03 // TRANSLUNAR TRAJECTORY',
        altitude: `${Math.round(420 + moonFrac * 384000).toLocaleString()} KM`,
        velocity: '10.82 KM/S (TLI)',
        dynPressure: '0.00 KPA',
        gForce: '0.00 G',
      };
    } else if (sp < 0.880) {
      const marsFrac = (sp - 0.740) / 0.140;
      return {
        status: 'STAGE 04 // MARS TRANSFER TRAJECTORY',
        altitude: `${Math.round(384400 + marsFrac * 224600000).toLocaleString()} KM`,
        velocity: '32.40 KM/S (HELIOCENTRIC)',
        dynPressure: '0.00 KPA',
        gForce: '0.00 G',
      };
    } else {
      return {
        status: 'STAGE 05 // DEEP SPACE TERMINAL',
        altitude: '> 225M KM (DEEP SPACE)',
        velocity: '17.20 KM/S (SOLAR ESCAPE)',
        dynPressure: '0.00 KPA',
        gForce: '0.00 G',
      };
    }
  }, [scrollProgress]);

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

        {/* Aerospace Flight Controls Action Station */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Multi-Angle Camera Switcher */}
          {onSetCameraMode && (
            <div className="hidden md:flex items-center p-1 rounded-lg bg-[#0e131f]/85 border border-white/15 backdrop-blur-md gap-1">
              <Camera className="w-3 h-3 text-slate-400 ml-1.5 mr-0.5" />
              {(
                [
                  { id: 'CINEMATIC', label: 'MISSION' },
                  { id: 'BOOSTER', label: 'BOOSTER' },
                  { id: 'CHASE', label: 'CHASE' },
                ] as const
              ).map((cam) => {
                const isActive = cameraMode === cam.id;
                return (
                  <button
                    key={cam.id}
                    onClick={() => {
                      cosmicAudio.playTelemetryChirp(1180, 0.04);
                      onSetCameraMode(cam.id);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/25 border border-cyan-400/50 text-cyan-300 font-semibold shadow-[0_0_8px_rgba(6,182,212,0.35)]'
                        : 'text-slate-400 hover:text-white border border-transparent'
                    }`}
                    title={`Switch camera to ${cam.label} perspective`}
                  >
                    {cam.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Holographic X-Ray Blueprint Toggle */}
          {onToggleBlueprint && (
            <button
              onClick={() => {
                cosmicAudio.playTelemetryChirp(1380, 0.04);
                onToggleBlueprint();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-mono text-[11px] backdrop-blur-md transition-all cursor-pointer shadow-sm ${
                blueprintMode
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-[#0e131f]/80 border-white/15 hover:border-cyan-400/60 text-slate-300 hover:text-white'
              }`}
              title="Toggle Holographic Structural Blueprint Mode"
            >
              <Layers className={`w-3.5 h-3.5 ${blueprintMode ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">BLUEPRINT</span>
            </button>
          )}

          {/* Mission Terminal CLI Modal Trigger */}
          {onOpenTerminal && (
            <button
              onClick={() => {
                cosmicAudio.playTelemetryChirp(1200, 0.04);
                onOpenTerminal();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0e131f]/80 border border-white/15 hover:border-emerald-400/60 text-slate-300 hover:text-emerald-300 font-mono text-[11px] backdrop-blur-md transition-all cursor-pointer shadow-sm group"
              title="Open Mission Control Terminal (~ key)"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400 group-hover:animate-pulse" />
              <span className="hidden sm:inline">CLI</span>
              <kbd className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-slate-400 group-hover:text-emerald-300">~</kbd>
            </button>
          )}

          {/* Minimal Audio Toggle */}
          <button
            onClick={onToggleAudio}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e131f]/80 border border-white/15 hover:border-cyan-400/60 text-slate-200 hover:text-white font-mono text-xs backdrop-blur-md transition-all cursor-pointer shadow-sm"
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

      {/* ===== BOTTOM AEROSPACE TELEMETRY HUD BAR ===== */}
      <div className="absolute bottom-5 left-0 right-0 flex flex-col items-center justify-center gap-1.5 pointer-events-none px-4">
        {scrollProgress < 0.035 ? (
          <div className="flex flex-col items-center gap-1 animate-bounce opacity-90">
            <span className="text-[10px] font-mono tracking-[0.25em] text-amber-300 uppercase font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              SCROLL DOWN TO COMMENCE ENGINE IGNITION // STEP 01
            </span>
            <ChevronDown className="w-4 h-4 text-orange-400 animate-pulse" />
          </div>
        ) : (
          <div className="px-4 py-2 rounded-xl bg-[#0e131f]/90 backdrop-blur-xl border border-cyan-500/35 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 shadow-[0_0_24px_rgba(6,182,212,0.25)]">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${scrollProgress < 0.24 ? 'bg-orange-400' : 'bg-cyan-400'} animate-ping`} />
              <span className={`text-[10px] font-mono ${scrollProgress < 0.24 ? 'text-orange-300' : 'text-cyan-300'} font-semibold tracking-wider uppercase`}>
                {telemetry.status}
              </span>
            </div>

            <div className="h-3 w-[1px] bg-white/20 hidden sm:block" />

            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="text-slate-400">ALT: <span className="text-white font-medium">{telemetry.altitude}</span></span>
              <span className="text-slate-400">VEL: <span className="text-white font-medium">{telemetry.velocity}</span></span>
              <span className="text-slate-400 hidden md:inline">Q: <span className="text-cyan-300 font-medium">{telemetry.dynPressure}</span></span>
              <span className="text-slate-400 hidden md:inline">ACCEL: <span className="text-amber-300 font-medium">{telemetry.gForce}</span></span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
