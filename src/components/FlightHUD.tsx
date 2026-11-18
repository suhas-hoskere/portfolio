import React, { useState, useMemo } from 'react';
import { VolumeX, ChevronUp, ChevronDown, Rocket, Terminal } from 'lucide-react';
import { cosmicAudio } from './AudioEngine';

export interface StageWaypoint {
  id: string;
  code: string;
  shortLabel: string;
  stageName: string;
  altitude: string;
  scrollFraction: number;
}

export const STAGES: StageWaypoint[] = [
  { id: 'pad', code: '00', shortLabel: 'Home', stageName: 'Launch Pad', altitude: '0 km // Ground Zero', scrollFraction: 0.0 },
  { id: 'ascent', code: '01', shortLabel: 'Origins', stageName: 'Davanagere Origins', altitude: '65 km // Ascent', scrollFraction: 0.395 },
  { id: 'missions', code: '02', shortLabel: 'Projects', stageName: 'Exploration Missions', altitude: '420 km // Payload Ops', scrollFraction: 0.745 },
  { id: 'heritage', code: '03', shortLabel: 'Heritage', stageName: 'Kannada Heritage', altitude: '420 km // BLR Pass', scrollFraction: 0.850 },
  { id: 'signal', code: '04', shortLabel: 'Uplink', stageName: 'Orbital Uplink', altitude: '420 km // Signal Lock', scrollFraction: 0.985 },
];

interface FlightHUDProps {
  scrollProgress: number;
  activeStageIndex: number;
  audioActive: boolean;
  onToggleAudio: () => void;
  onJumpToStage: (stageIndex: number) => void;
  onOpenTerminal?: () => void;
}

export const FlightHUD: React.FC<FlightHUDProps> = React.memo(({
  scrollProgress,
  activeStageIndex,
  audioActive,
  onToggleAudio,
  onJumpToStage,
  onOpenTerminal,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const telemetry = useMemo(() => {
    const sp = scrollProgress;
    if (sp < 0.032) {
      return {
        status: 'STANDBY // HOLD-DOWN ACTIVE',
        altitude: '0.0 KM',
        velocity: '0 M/S',
        dynPressure: '101.3 KPA',
        gForce: '1.00 G',
      };
    } else if (sp < 0.068) {
      return {
        status: 'STEP 01 // ENGINE IGNITION',
        altitude: '0.0 KM',
        velocity: '0 M/S',
        dynPressure: '101.3 KPA',
        gForce: '1.25 G',
      };
    } else if (sp < 0.104) {
      return {
        status: 'STEP 02 // CLAMPS RELEASE',
        altitude: '0.0 KM',
        velocity: '0 M/S',
        dynPressure: '101.3 KPA',
        gForce: '1.40 G',
      };
    } else if (sp < 0.140) {
      return {
        status: 'STEP 03 // WATER DELUGE',
        altitude: '0.0 KM',
        velocity: '0 M/S',
        dynPressure: '101.3 KPA',
        gForce: '1.50 G',
      };
    } else if (sp < 0.220) {
      const climbFrac = (sp - 0.140) / 0.080;
      return {
        status: 'STEP 04 // LIFTOFF CLIMB',
        altitude: `${(0.1 + climbFrac * 14.9).toFixed(1)} KM`,
        velocity: `${Math.round(climbFrac * 460)} M/S`,
        dynPressure: `${(101.3 - climbFrac * 48).toFixed(1)} KPA`,
        gForce: `${(1.62 + climbFrac * 0.42).toFixed(2)} G`,
      };
    } else if (sp < 0.500) {
      const ascFrac = (sp - 0.220) / 0.280;
      const isBoosterSep = sp >= 0.280 && sp < 0.390;
      const status = isBoosterSep
        ? 'STAGE 01 // S200 BOOSTER SEP'
        : sp < 0.280
          ? 'STAGE 01 // STRATOSPHERE CLIMB'
          : 'STAGE 01 // CORE ORBITAL INSERTION';
      return {
        status,
        altitude: `${Math.round(15 + ascFrac * 405)} KM`,
        velocity: `${(0.46 + ascFrac * 7.20).toFixed(2)} KM/S`,
        dynPressure: `${(53.3 * Math.exp(-ascFrac * 5.2)).toFixed(2)} KPA`,
        gForce: `${(2.05 + Math.sin(ascFrac * Math.PI) * 0.85).toFixed(2)} G`,
      };
    } else if (sp < 0.680) {
      const status =
        sp < 0.555
          ? 'STAGE 02 // FAIRING JETTISON & RELEASE'
          : sp < 0.625
            ? 'STAGE 02 // SOLAR ARRAY DEPLOY'
            : 'STAGE 02 // SATELLITE DEPLOYED (LEO)';
      return {
        status,
        altitude: '420 KM',
        velocity: '7.66 KM/S',
        dynPressure: '0.00 KPA',
        gForce: '0.00 G',
      };
    } else if (sp < 0.800) {
      return {
        status: 'STAGE 03 // ORBITAL PAYLOAD OPS',
        altitude: '420 KM',
        velocity: '7.66 KM/S',
        dynPressure: '0.00 KPA',
        gForce: '0.00 G',
      };
    } else if (sp < 0.900) {
      return {
        status: 'STAGE 04 // BANGALORE GROUND PASS',
        altitude: '420 KM',
        velocity: '7.66 KM/S',
        dynPressure: '0.00 KPA',
        gForce: '0.00 G',
      };
    } else {
      return {
        status: 'STAGE 05 // ORBITAL UPLINK LOCKED',
        altitude: '420 KM',
        velocity: '7.66 KM/S',
        dynPressure: '0.00 KPA',
        gForce: '0.00 G',
      };
    }
  }, [scrollProgress]);

  const jumpToIndex = (idx: number) => {
    const clamped = Math.min(Math.max(idx, 0), STAGES.length - 1);
    cosmicAudio.playTelemetryChirp(1120 + clamped * 55, 0.04);
    onJumpToStage(clamped);
  };

  return (
    <header className="fixed inset-0 pointer-events-none z-30 select-none">
      {/* ===== PURE MONOCHROME TOP BAR ===== */}
      <div className="absolute top-0 left-0 right-0 p-3.5 sm:p-6 flex items-center justify-between gap-2">
        {/* Identity (click to return to Launch Pad) */}
        <button
          type="button"
          onClick={() => jumpToIndex(0)}
          className="flex items-center gap-2.5 pointer-events-auto min-w-0 text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60 rounded-lg"
          aria-label="Return to Launch Pad"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-white text-black shrink-0 transition-transform duration-200 group-hover:scale-105">
            <Rocket className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-space text-sm sm:text-base font-bold text-white tracking-tight truncate">
                Suhas Hoskere
              </span>
              <span className="hidden sm:inline font-kannada text-xs font-medium text-zinc-400">
                ಸುಹಾಸ್ ಹೊಸಕೆರೆ
              </span>
            </div>
            <p className="text-[10px] font-mono text-zinc-400 tracking-wider uppercase truncate">
              PES University // Bangalore
            </p>
          </div>
        </button>

        {/* Flight Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
          {onOpenTerminal && (
            <button
              onClick={() => {
                cosmicAudio.playTelemetryChirp(1200, 0.04);
                onOpenTerminal();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#09090b]/95 border border-white/20 hover:border-white/50 text-zinc-300 hover:text-white font-mono text-[11px] transition-colors cursor-pointer"
              title="Open Mission Control Terminal (~ key)"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CLI</span>
            </button>
          )}

          <button
            onClick={onToggleAudio}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border font-mono text-[11px] transition-colors cursor-pointer ${
              audioActive
                ? 'bg-white border-white text-black font-semibold'
                : 'bg-[#09090b]/95 border-white/20 hover:border-white/50 text-zinc-300 hover:text-white'
            }`}
            aria-label="Toggle Sound"
          >
            {audioActive ? (
              <span className="inline-flex items-end gap-[2px] h-3 w-3.5 justify-center" aria-hidden="true">
                <span className="w-[2px] h-full bg-black rounded-full animate-eq-bar" style={{ animationDelay: '0ms' }} />
                <span className="w-[2px] h-full bg-black rounded-full animate-eq-bar" style={{ animationDelay: '180ms' }} />
                <span className="w-[2px] h-full bg-black rounded-full animate-eq-bar" style={{ animationDelay: '340ms' }} />
              </span>
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{audioActive ? 'AUDIO: ON' : 'AUDIO'}</span>
          </button>
        </div>
      </div>

      {/* ===== MOBILE QUICK-PAGE NAVIGATION BAR (< 640px) ===== */}
      <nav
        aria-label="Mobile page navigation"
        className="absolute top-[56px] left-3 right-3 flex sm:hidden justify-center pointer-events-none"
      >
        <div className="pointer-events-auto inline-flex items-center gap-0.5 p-1 rounded-lg bg-[#09090b]/92 border border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
          {STAGES.map((s, idx) => {
            const isActive = idx === activeStageIndex;
            const isPassed = idx < activeStageIndex;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => jumpToIndex(idx)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Navigate to ${s.stageName}`}
                className={`px-2 py-1 rounded-md font-mono text-[10px] transition-colors cursor-pointer flex items-center gap-1 ${
                  isActive
                    ? 'bg-white text-black font-semibold'
                    : isPassed
                      ? 'text-zinc-200 hover:bg-white/10'
                      : 'text-zinc-500 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{s.code}</span>
                {isActive && <span className="font-space tracking-tight">{s.shortLabel}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ===== CLICKABLE PAGE NAVIGATION SIDEBAR (Right Edge, Tablet & Desktop) ===== */}
      <nav
        aria-label="Page navigation sidebar"
        className="absolute right-3 sm:right-4 lg:right-5 top-1/2 -translate-y-1/2 hidden sm:flex flex-col pointer-events-auto"
      >
        <div className="bg-[#09090b]/92 border border-white/15 hover:border-white/30 rounded-xl p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.65)] transition-colors duration-200">
          {/* Header Counter (Desktop) */}
          <div className="hidden lg:flex items-center justify-between px-2 pt-1 pb-1.5 mb-1 border-b border-white/10">
            <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 uppercase">
              NAV
            </span>
            <span className="text-[9px] font-mono text-white font-semibold tabular-nums">
              {String(activeStageIndex + 1).padStart(2, '0')}/{String(STAGES.length).padStart(2, '0')}
            </span>
          </div>

          {/* Previous Page Stepper */}
          <button
            type="button"
            onClick={() => jumpToIndex(activeStageIndex - 1)}
            disabled={activeStageIndex === 0}
            aria-label="Previous page"
            title="Previous page"
            className="w-full py-1 mb-1 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          {/* Clickable Page Links + Live Progress Spine */}
          <div className="relative flex flex-col gap-0.5 pr-2">
            {/* Background & Active Vertical Flight Progress Track */}
            <div className="absolute right-0.5 top-2 bottom-2 w-[2px] rounded-full bg-white/12 overflow-hidden pointer-events-none">
              <div
                className="w-full bg-white rounded-full"
                style={{
                  height: `${Math.min(Math.max((scrollProgress / 0.98) * 100, 0), 100)}%`,
                }}
              />
            </div>

            {STAGES.map((s, idx) => {
              const isActive = idx === activeStageIndex;
              const isPassed = idx < activeStageIndex;
              const isHovered = hoveredIdx === idx;
              return (
                <div
                  key={s.id}
                  className="relative flex items-center"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Hover Detail Preview Pill (Appears cleanly to the left of sidebar) */}
                  {isHovered && (
                    <div className="absolute right-full mr-2.5 px-2.5 py-1.5 rounded-lg bg-[#09090b]/95 border border-white/25 text-right whitespace-nowrap pointer-events-none shadow-[0_8px_24px_rgba(0,0,0,0.7)]">
                      <div className="text-[11px] font-space font-semibold text-white tracking-tight">
                        {s.stageName}
                      </div>
                      <div className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">
                        {s.altitude}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => jumpToIndex(idx)}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={`Jump to ${s.stageName}`}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white ${
                      isActive
                        ? 'bg-white text-black font-semibold'
                        : isPassed
                          ? 'text-zinc-200 hover:bg-white/10 hover:text-white'
                          : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {/* Status Indicator Dot */}
                    <span
                      aria-hidden="true"
                      className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                        isActive
                          ? 'bg-black'
                          : isPassed
                            ? 'bg-white/80'
                            : 'bg-zinc-600'
                      }`}
                    />

                    {/* Stage Number */}
                    <span
                      className={`text-[10px] font-mono tabular-nums ${
                        isActive ? 'text-black/75' : 'text-zinc-500'
                      }`}
                    >
                      {s.code}
                    </span>

                    {/* Page Label (Always visible on desktop lg+) */}
                    <span className="hidden lg:inline text-[11px] font-space tracking-tight pr-1 whitespace-nowrap">
                      {s.shortLabel}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Next Page Stepper */}
          <button
            type="button"
            onClick={() => jumpToIndex(activeStageIndex + 1)}
            disabled={activeStageIndex === STAGES.length - 1}
            aria-label="Next page"
            title="Next page"
            className="w-full py-1 mt-1 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* ===== BOTTOM MONOCHROME TELEMETRY BAR ===== */}
      <div className="absolute bottom-3.5 sm:bottom-5 left-0 right-0 flex justify-center pointer-events-none px-3">
        {scrollProgress < 0.035 ? (
          <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-[0.2em] text-zinc-400 uppercase">
            <span>SCROLL TO LAUNCH</span>
            <ChevronDown className="w-3.5 h-3.5 text-white" />
          </div>
        ) : (
          <div className="px-3.5 py-1.5 rounded-lg bg-[#09090b]/95 border border-white/20 flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
              <span className="text-white font-semibold tracking-wider uppercase">
                {telemetry.status}
              </span>
            </div>

            <div className="h-3 w-[1px] bg-white/20 hidden sm:block" />

            <div className="flex items-center gap-2.5 text-zinc-400">
              <span>ALT <span className="text-white">{telemetry.altitude}</span></span>
              <span>VEL <span className="text-white">{telemetry.velocity}</span></span>
              <span className="hidden md:inline">Q <span className="text-white">{telemetry.dynPressure}</span></span>
              <span className="hidden md:inline">G <span className="text-white">{telemetry.gForce}</span></span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
});
