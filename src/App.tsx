import React, { useEffect, useState, useRef, useCallback, Suspense, lazy } from 'react';
import { SpaceFlightCanvas2D } from './components/SpaceFlightCanvas2D';
import { FlightHUD } from './components/FlightHUD';
import { FlightMissionOverlays } from './components/FlightMissionOverlays';
import type { ProjectData } from './components/FlightMissionOverlays';
import { CustomCursor } from './components/CustomCursor';
import { cosmicAudio } from './components/AudioEngine';

// Lazy-load modals so their heavy DOM and icon sets are never loaded until opened
const FlightMissionModal = lazy(() =>
  import('./components/FlightMissionModal').then((m) => ({ default: m.FlightMissionModal }))
);
const MissionTerminalModal = lazy(() =>
  import('./components/MissionTerminalModal').then((m) => ({ default: m.MissionTerminalModal }))
);
// STAGE_CONFIG removed

export const App: React.FC = () => {
  // Guarantee clean startup at Ground Zero (0 km, Stage 0) with zero accidental scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  // Discrete Stage State (Choreographed flight stage 0 to 5)
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [uiScrollProgress, setUiScrollProgress] = useState(0);
  const [audioActive, setAudioActive] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  // Camera Perspective, Holographic Blueprint & CLI Terminal State
  const [cameraMode, setCameraMode] = useState<'CINEMATIC' | 'BOOSTER' | 'CHASE'>('CINEMATIC');
  const [blueprintMode, setBlueprintMode] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const playedCallouts = useRef<Set<string>>(new Set());

  // Global Keyboard Shortcuts (~ or ` toggles Terminal, Escape closes)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        setIsTerminalOpen((prev) => !prev);
        cosmicAudio.playTelemetryChirp(1200, 0.04);
      } else if (e.key === 'Escape' && isTerminalOpen) {
        setIsTerminalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTerminalOpen]);

  // High-performance mutable refs read directly inside the 2D Canvas render loop
  const scrollProgressRef = useRef(0);
  const scrollSpeedRef = useRef(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const rafThrottler = useRef<number | null>(null);
  const scrollAnimRaf = useRef<number | null>(null);
  const lastStageRef = useRef<number>(0);

  // Throttled UI State updater
  const updateUI = useCallback((progress: number) => {
    scrollProgressRef.current = progress;

    let stage = 0;
    if (progress >= 0.88) stage = 5;
    else if (progress >= 0.74) stage = 4;
    else if (progress >= 0.52) stage = 3;
    else if (progress >= 0.36) stage = 2;
    else if (progress >= 0.24) stage = 1;
    else stage = 0;

    if (stage !== lastStageRef.current) {
      cosmicAudio.playStagingSound();
      lastStageRef.current = stage;
    }

    // VHF Radio Voice Callouts & Acoustic Triggers at granular aerospace telemetry thresholds
    if (progress < 0.02) {
      playedCallouts.current.clear();
    } else if (progress >= 0.035 && progress < 0.080 && !playedCallouts.current.has('ignition')) {
      playedCallouts.current.add('ignition');
      cosmicAudio.playRadioCallout('Engine ignition confirmed. Full thrust nominal.');
    } else if (progress >= 0.080 && progress < 0.125 && !playedCallouts.current.has('umbilical')) {
      playedCallouts.current.add('umbilical');
      cosmicAudio.playClampRelease();
      cosmicAudio.playRadioCallout('Umbilical lines decoupled. Service arms clear.');
    } else if (progress >= 0.125 && progress < 0.170 && !playedCallouts.current.has('deluge')) {
      playedCallouts.current.add('deluge');
      cosmicAudio.playDelugeSound();
      cosmicAudio.playRadioCallout('Water deluge active. Acoustic dampening nominal.');
    } else if (progress >= 0.170 && progress < 0.220 && !playedCallouts.current.has('liftoff')) {
      playedCallouts.current.add('liftoff');
      cosmicAudio.playRadioCallout('Vehicle has cleared the tower. Trajectory is nominal.');
    } else if (progress >= 0.270 && progress < 0.320 && !playedCallouts.current.has('maxq')) {
      playedCallouts.current.add('maxq');
      cosmicAudio.playRadioCallout('Passing Max-Q. Aerodynamic pressures nominal.');
    } else if (progress >= 0.360 && progress < 0.420 && !playedCallouts.current.has('orbit')) {
      playedCallouts.current.add('orbit');
      cosmicAudio.playRadioCallout('Booster separation complete. Low Earth orbit insertion nominal.');
    } else if (progress >= 0.470 && progress < 0.515 && !playedCallouts.current.has('tli')) {
      playedCallouts.current.add('tli');
      cosmicAudio.playThrusterPulse();
    } else if (progress >= 0.880 && !playedCallouts.current.has('uplink')) {
      playedCallouts.current.add('uplink');
      cosmicAudio.playRadioCallout('Terminal uplink established. Carrier signal locked.');
    }

    setActiveStageIndex(stage);
    setUiScrollProgress(progress);
    cosmicAudio.updateFallIntensity(progress);
  }, []);

  // Lightweight native passive scroll listener (0% CPU when idle, no extra RAF loop)
  useEffect(() => {
    const cancelProgrammaticScroll = () => {
      if (scrollAnimRaf.current) {
        cancelAnimationFrame(scrollAnimRaf.current);
        scrollAnimRaf.current = null;
      }
    };

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const maxScroll = (trackRef.current?.scrollHeight || 8000) - window.innerHeight;
      const progress = Math.min(Math.max(scrollY / Math.max(maxScroll, 1), 0), 1);
      scrollProgressRef.current = progress;

      const now = performance.now();
      const dt = Math.max(now - lastScrollTime.current, 1);
      const dy = Math.abs(scrollY - lastScrollY.current);
      scrollSpeedRef.current = Math.min(dy / dt, 4.0);

      lastScrollY.current = scrollY;
      lastScrollTime.current = now;

      if (!rafThrottler.current) {
        rafThrottler.current = requestAnimationFrame(() => {
          updateUI(scrollProgressRef.current);
          rafThrottler.current = null;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', cancelProgrammaticScroll, { passive: true });
    window.addEventListener('touchstart', cancelProgrammaticScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', cancelProgrammaticScroll);
      window.removeEventListener('touchstart', cancelProgrammaticScroll);
      if (rafThrottler.current) cancelAnimationFrame(rafThrottler.current);
      if (scrollAnimRaf.current) cancelAnimationFrame(scrollAnimRaf.current);
    };
  }, [updateUI]);

  const animateScrollTo = useCallback((targetY: number, durationMs: number) => {
    if (scrollAnimRaf.current) cancelAnimationFrame(scrollAnimRaf.current);
    const startY = window.scrollY || window.pageYOffset || 0;
    const dist = targetY - startY;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / durationMs, 1);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      window.scrollTo(0, startY + dist * eased);
      if (t < 1) {
        scrollAnimRaf.current = requestAnimationFrame(step);
      } else {
        scrollAnimRaf.current = null;
      }
    };
    scrollAnimRaf.current = requestAnimationFrame(step);
  }, []);

  const handleToggleAudio = () => {
    const active = cosmicAudio.toggle();
    setAudioActive(active);
  };

  const handleJumpToStage = (fraction: number) => {
    if (!trackRef.current) return;
    const maxScroll = trackRef.current.scrollHeight - window.innerHeight;
    animateScrollTo(fraction * maxScroll, 1100);
  };

  const handleLaunch = () => {
    if (!trackRef.current) return;
    if (!audioActive) {
      cosmicAudio.unmute();
      setAudioActive(true);
    }
    cosmicAudio.playQuindarTone(true);
    cosmicAudio.playRadioCallout('Initiating liftoff sequence. Dual Vikas core ignited.');

    const maxScroll = trackRef.current.scrollHeight - window.innerHeight;
    animateScrollTo(0.25 * maxScroll, 2800);
  };

  // Background atmosphere color dynamically shifts from dawn sky to cosmic black
  const bgColors = [
    'bg-[#060b19]', // Stage 0: Dawn at India Launch Pad
    'bg-[#040816]', // Stage 1: Atmospheric Ascent
    'bg-[#030611]', // Stage 2: Low Earth Orbit
    'bg-[#02040b]', // Stage 3: Lunar Flyby
    'bg-[#080408]', // Stage 4: Mars Encounter (deep Martian interplanetary ambient)
    'bg-[#020206]', // Stage 5: Interstellar Uplink
  ];

  return (
    <div
      ref={trackRef}
      className={`relative min-h-[850vh] ${bgColors[activeStageIndex]} text-[#f4f2ed] overflow-x-hidden selection:bg-orange-500/30 selection:text-orange-200 transition-colors duration-700`}
    >
      {/* On-demand comet follower ring cursor */}
      <CustomCursor />

      {/* Ultra-lightweight 2.5D HTML5 Canvas Space Launch Engine (Zero WebGL / Three.js overhead) */}
      <SpaceFlightCanvas2D
        scrollProgressRef={scrollProgressRef}
        scrollSpeedRef={scrollSpeedRef}
        cameraMode={cameraMode}
        blueprintMode={blueprintMode}
      />

      {/* Immediate Dashboard & Flight HUD Overlays (Instant Zero-Delay Paint) */}
      <div className="opacity-100 pointer-events-auto">
        {/* Minimalist Flight HUD & Trajectory Pips */}
        <FlightHUD
          scrollProgress={uiScrollProgress}
          activeStageIndex={activeStageIndex}
          audioActive={audioActive}
          onToggleAudio={handleToggleAudio}
          onJumpToStage={handleJumpToStage}
          cameraMode={cameraMode}
          onSetCameraMode={setCameraMode}
          blueprintMode={blueprintMode}
          onToggleBlueprint={() => setBlueprintMode((prev) => !prev)}
          onOpenTerminal={() => setIsTerminalOpen(true)}
        />

        {/* Cinematic Pinned Narrative Storyboard on the Left */}
        <FlightMissionOverlays
          activeStageIndex={activeStageIndex}
          scrollProgress={uiScrollProgress}
          onLaunch={handleLaunch}
          onSelectProject={setSelectedProject}
        />
      </div>

      {/* Lazy Modals: Zero DOM or memory overhead until activated by the user */}
      <Suspense fallback={null}>
        {isTerminalOpen && (
          <MissionTerminalModal
            isOpen={isTerminalOpen}
            onClose={() => setIsTerminalOpen(false)}
            scrollProgress={uiScrollProgress}
            activeStageIndex={activeStageIndex}
            cameraMode={cameraMode}
            onSetCameraMode={setCameraMode}
            blueprintMode={blueprintMode}
            onToggleBlueprint={() => setBlueprintMode((prev) => !prev)}
          />
        )}

        {selectedProject && (
          <FlightMissionModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </Suspense>
    </div>
  );
};

export default App;
