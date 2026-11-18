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
  { id: 'ascent', stageName: 'Outer Atmosphere', altitude: '65 km (Ascent)', scrollFraction: 0.34 },
  { id: 'orbit', stageName: 'Satellite Deploy', altitude: '420 km (LEO)', scrollFraction: 0.60 },
  { id: 'missions', stageName: 'Orbital Missions', altitude: '420 km (Payload)', scrollFraction: 0.74 },
  { id: 'heritage', stageName: 'Karnataka Pass', altitude: '420 km (BLR Track)', scrollFraction: 0.85 },
  { id: 'signal', stageName: 'Orbital Uplink', altitude: '420 km (Signal Lock)', scrollFraction: 0.95 },
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

export const FlightHUD: React.FC<FlightHUDProps> = React.memo(({
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
    } else if (sp < 0.560) {
      const ascFrac = (sp - 0.220) / 0.340;
      const isBoosterSep = sp >= 0.280 && sp < 0.385;
      const isFairingSep = sp >= 0.485;
      const status = isFairingSep
        ? 'STAGE 01 // FAIRING JETTISON'
        : isBoosterSep
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
    } else if (sp < 0.700) {
      const status =
        sp < 0.610
          ? 'STAGE 02 // STAGE SEP & SATELLITE RELEASE'
          : sp < 0.680
            ? 'STAGE 02 // SOLAR ARRAY DEPLOY'
            : 'STAGE 02 // SATELLITE DEPLOYED (LEO)';
      return {
        status,
        altitude: '420 KM',
        velocity: '7.66 KM/S',
        dynPressure: '0.00 KPA',
        gForce: '0.00 G',
      };
    } else if (sp < 0.810) {
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

  return (
    <header className="fixed inset-0 pointer-events-none z-30 select-none">
      {/* ===== PURE MONOCHROME TOP BAR ===== */}
      <div className="absolute top-0 left-0 right-0 p-3.5 sm:p-6 flex items-center justify-between gap-2">
        {/* Identity */}
        <div className="flex items-center gap-2.5 pointer-events-auto min-w-0">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-white text-black shrink-0">
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
        </div>

        {/* Flight Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
          {onSetCameraMode && (
            <div className="hidden md:flex items-center p-0.5 rounded-md bg-[#09090b]/95 border border-white/20 gap-0.5">
              <Camera className="w-3 h-3 text-zinc-400 mx-1.5" />
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
                    className={`px-2 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-white text-black font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {cam.label}
                  </button>
                );
              })}
            </div>
          )}

          {onToggleBlueprint && (
            <button
              onClick={() => {
                cosmicAudio.playTelemetryChirp(1380, 0.04);
                onToggleBlueprint();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border font-mono text-[11px] transition-colors cursor-pointer ${
                blueprintMode
                  ? 'bg-white border-white text-black font-semibold'
                  : 'bg-[#09090b]/95 border-white/20 hover:border-white/50 text-zinc-300 hover:text-white'
              }`}
              title="Toggle Structural Wireframe Mode"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WIREFRAME</span>
            </button>
          )}

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
            {audioActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{audioActive ? 'AUDIO: ON' : 'AUDIO'}</span>
          </button>
        </div>
      </div>

      {/* ===== VERTICAL FLIGHT RAIL (Right Margin, Desktop & Tablet) ===== */}
      <nav
        aria-label="Flight trajectory navigation"
        className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 hidden sm:flex flex-col items-center pointer-events-auto py-3 px-1.5"
      >
        <div className="relative flex flex-col items-center justify-between h-44">
          <div className="absolute top-1 bottom-1 w-[1px] bg-white/15" />
          <div
            className="absolute w-[2px] bg-white"
            style={{
              top: '4px',
              height: `${Math.min(Math.max((scrollProgress / 0.95) * 100, 0), 100)}%`,
            }}
          />

          {STAGES.map((s, idx) => {
            const isActive = idx === activeStageIndex;
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={s.id}
                className="relative flex items-center justify-center cursor-pointer py-1"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => {
                  cosmicAudio.playTelemetryChirp(1200, 0.04);
                  onJumpToStage(s.scrollFraction);
                }}
              >
                {(isHovered || (isActive && hoveredIdx === null)) && (
                  <div
                    className={`absolute right-6 px-2.5 py-1 rounded-md border text-right whitespace-nowrap pointer-events-none ${
                      isActive
                        ? 'bg-[#09090b]/95 border-white/40 text-white'
                        : 'bg-[#09090b]/95 border-white/15 text-zinc-300'
                    }`}
                  >
                    <div className="text-[10px] font-space font-semibold tracking-tight">
                      {s.stageName}
                    </div>
                    <div className="text-[9px] font-mono text-zinc-400">
                      {s.altitude}
                    </div>
                  </div>
                )}

                <button
                  aria-label={`Jump to ${s.stageName}`}
                  className={`rounded-full transition-transform cursor-pointer ${
                    isActive
                      ? 'w-2.5 h-2.5 bg-white ring-4 ring-white/20'
                      : 'w-2 h-2 bg-zinc-600 hover:bg-white'
                  }`}
                />
              </div>
            );
          })}
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
