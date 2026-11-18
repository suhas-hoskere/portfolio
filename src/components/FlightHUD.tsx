import React, { useState } from 'react';
import { VolumeX, ChevronDown, ArrowUp, ArrowDown, Terminal } from 'lucide-react';
import { cosmicAudio } from './AudioEngine';
import { STAGES } from '../data/portfolioData';
import { BrandLogo } from './Icons';

interface FlightHUDProps {
  scrollProgress: number;
  activeStageIndex: number;
  audioActive: boolean;
  isAutoTourActive?: boolean;
  onToggleAudio: () => void;
  onJumpToStage: (stageIndex: number) => void;
  onOpenTerminal?: () => void;
}

export const FlightHUD: React.FC<FlightHUDProps> = React.memo(({
  scrollProgress,
  activeStageIndex,
  audioActive,
  isAutoTourActive = false,
  onToggleAudio,
  onJumpToStage,
  onOpenTerminal,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

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
          className="flex items-center gap-2.5 pointer-events-auto min-w-0 text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60 rounded-lg px-2.5 py-1.5 bg-[#050505]/95 border border-white/15"
          aria-label="Return to Launch Pad"
        >
          <BrandLogo className="w-8 h-8 shrink-0 transition-transform duration-200 group-hover:scale-105" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-kannada text-sm sm:text-base font-bold text-white tracking-tight truncate">
                ಸುಹಾಸ್ ಹೊಸಕೆರೆ
              </span>
              <span className="hidden sm:inline font-space text-xs font-medium text-zinc-400">
                Suhas Hoskere
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
              type="button"
              onClick={() => {
                cosmicAudio.playTelemetryChirp(1200, 0.04);
                onOpenTerminal();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#09090b]/95 border border-white/25 hover:border-white text-zinc-200 hover:text-white font-mono text-[11px] transition-colors cursor-pointer"
              title="Ask Madhva — Offline Assistant CLI (~ key)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" aria-hidden="true" />
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">MADHVA</span>
            </button>
          )}

          <button
            type="button"
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
          <div className="hidden lg:flex items-center justify-between px-2 pt-1 pb-1.5 mb-1.5 border-b border-white/10">
            <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 uppercase">
              NAV
            </span>
            <span className="text-[9px] font-mono text-white font-semibold tabular-nums">
              {String(activeStageIndex + 1).padStart(2, '0')}/{String(STAGES.length).padStart(2, '0')}
            </span>
          </div>

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
        </div>
      </nav>

      {/* ===== INITIAL SCROLL PROMPT (fades out cleanly once flight or auto-tour begins) ===== */}
      {scrollProgress < 0.035 && !isAutoTourActive && (
        <div className="absolute bottom-3.5 sm:bottom-5 left-0 right-0 flex justify-center pointer-events-none px-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#050505]/95 border border-white/15 text-[10px] font-mono tracking-[0.2em] text-zinc-200 uppercase">
            <span>SCROLL TO LAUNCH</span>
            <ChevronDown className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      )}

      {/* ===== MINIMAL GO TO TOP / GO TO BOTTOM ARROW BUTTON ===== */}
      <button
        type="button"
        onClick={() => jumpToIndex(scrollProgress >= 0.5 ? 0 : STAGES.length - 1)}
        aria-label={scrollProgress >= 0.5 ? 'Go to top' : 'Go to bottom'}
        title={scrollProgress >= 0.5 ? 'Go to top' : 'Go to bottom'}
        className="absolute bottom-4 sm:bottom-5 right-3.5 sm:right-5 pointer-events-auto w-9 h-9 rounded-full bg-[#050505]/95 border border-white/25 hover:bg-white hover:text-black hover:border-white text-white flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.75)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
      >
        {scrollProgress >= 0.5 ? (
          <ArrowUp className="w-4 h-4" />
        ) : (
          <ArrowDown className="w-4 h-4" />
        )}
      </button>
    </header>
  );
});
