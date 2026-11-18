import React, { useEffect, useState, useRef, useCallback, startTransition, Suspense, lazy } from 'react';
import { SpaceFlightCanvas2D } from './components/SpaceFlightCanvas2D';
import { FlightHUD } from './components/FlightHUD';
import { FlightMissionOverlays } from './components/FlightMissionOverlays';
import type { ProjectData } from './components/FlightMissionOverlays';
import { CustomCursor } from './components/CustomCursor';
import { MonochromeLiftoffLoader } from './components/MonochromeLiftoffLoader';
import { cosmicAudio } from './components/AudioEngine';

// Lazy-load modals so their heavy DOM and icon sets are never loaded until opened
const FlightMissionModal = lazy(() =>
  import('./components/FlightMissionModal').then((m) => ({ default: m.FlightMissionModal }))
);
const MissionTerminalModal = lazy(() =>
  import('./components/MissionTerminalModal').then((m) => ({ default: m.MissionTerminalModal }))
);
// STAGE_CONFIG removed

function stageForProgress(p: number): number {
  if (p >= 0.89) return 5;
  if (p >= 0.77) return 4;
  if (p >= 0.64) return 3;
  if (p >= 0.48) return 2;
  if (p >= 0.22) return 1;
  return 0;
}

function stepForProgress(p: number): number {
  if (p >= 0.140) return 3;
  if (p >= 0.104) return 2;
  if (p >= 0.068) return 1;
  if (p >= 0.032) return 0;
  return -1;
}

export const App: React.FC = () => {
  // Guarantee clean startup at Ground Zero (0 km, Stage 0) with zero accidental scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  // Discrete Stage State (Choreographed flight stage 0 to 5 + Stage 00 launch step -1..3)
  const [showLoader, setShowLoader] = useState(true);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [launchStep, setLaunchStep] = useState(-1);
  const [uiScrollProgress, setUiScrollProgress] = useState(0);
  const [audioActive, setAudioActive] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  const handleLoaderComplete = useCallback(() => {
    setShowLoader(false);
  }, []);

  // Gently auto-start the continuous satisfying ambient soundtrack on the user's very first interaction
  // (browsers block audio autoplay until a click/keypress; user can mute/unmute anytime via the AUDIO button)
  useEffect(() => {
    const startMusicOnce = () => {
      if (cosmicAudio.isMuted && !cosmicAudio.userExplicitlyMuted) {
        const started = cosmicAudio.unmute();
        if (started) setAudioActive(true);
      }
      window.removeEventListener('pointerdown', startMusicOnce);
      window.removeEventListener('keydown', startMusicOnce);
    };
    window.addEventListener('pointerdown', startMusicOnce, { passive: true });
    window.addEventListener('keydown', startMusicOnce, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', startMusicOnce);
      window.removeEventListener('keydown', startMusicOnce);
    };
  }, []);

  // Prevent accidental wheel scrolling while the liftoff loader plays
  useEffect(() => {
    if (showLoader) {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showLoader]);

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
  const flightProgressRef = useRef(0);
  const scrollSpeedRef = useRef(0);
  const programmaticJumpTargetRef = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(0);
  const scrollAnimRaf = useRef<number | null>(null);
  const lastStageRef = useRef<number>(0);
  const lastLaunchStepRef = useRef<number>(-1);
  const lastUiCommitTimeRef = useRef<number>(0);
  const lastUiProgressRef = useRef<number>(0);
  const trailingUiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Throttled UI State updater driven by the Canvas's velocity-paced cinematic flight timeline:
  // Keeps HUD telemetry, stage cards, sidebar active state & acoustics 100% locked to the rocket
  // using React 19 non-blocking startTransition so canvas frames NEVER hitch at station boundaries.
  const updateUI = useCallback((progress: number) => {
    flightProgressRef.current = progress;
    const isSidebarJump = programmaticJumpTargetRef.current !== null;

    let stageChanged = false;
    if (!isSidebarJump) {
      const stage = stageForProgress(progress);
      const step = stepForProgress(progress);

      stageChanged = stage !== lastStageRef.current;
      const stepChanged = step !== lastLaunchStepRef.current;

      if (stageChanged || stepChanged) {
        if (stageChanged) {
          cosmicAudio.playStagingSound();
          lastStageRef.current = stage;
        }
        if (stepChanged) {
          lastLaunchStepRef.current = step;
        }
        startTransition(() => {
          if (stageChanged) setActiveStageIndex(stage);
          if (stepChanged) setLaunchStep(step);
        });
      }

      // Acoustic triggers across expanded launch-to-orbit timeline
      if (progress < 0.02) {
        playedCallouts.current.clear();
      } else if (progress >= 0.032 && progress < 0.068 && !playedCallouts.current.has('ignition')) {
        playedCallouts.current.add('ignition');
      } else if (progress >= 0.068 && progress < 0.104 && !playedCallouts.current.has('umbilical')) {
        playedCallouts.current.add('umbilical');
        cosmicAudio.playClampRelease();
      } else if (progress >= 0.104 && progress < 0.140 && !playedCallouts.current.has('deluge')) {
        playedCallouts.current.add('deluge');
        cosmicAudio.playDelugeSound();
      } else if (progress >= 0.140 && progress < 0.220 && !playedCallouts.current.has('liftoff')) {
        playedCallouts.current.add('liftoff');
      } else if (progress >= 0.560 && !playedCallouts.current.has('orbit')) {
        playedCallouts.current.add('orbit');
      }
    }

    const now = performance.now();
    const boundaryHit = progress <= 0.001 || progress >= 0.999;
    const commitUi = (p: number) => {
      lastUiCommitTimeRef.current = performance.now();
      lastUiProgressRef.current = p;
      cosmicAudio.updateFallIntensity(p);
      startTransition(() => {
        setUiScrollProgress(p);
      });
    };

    if (
      stageChanged ||
      boundaryHit ||
      (now - lastUiCommitTimeRef.current >= 55 && Math.abs(progress - lastUiProgressRef.current) >= 0.002)
    ) {
      if (trailingUiTimerRef.current) {
        clearTimeout(trailingUiTimerRef.current);
        trailingUiTimerRef.current = null;
      }
      commitUi(progress);
    } else if (!trailingUiTimerRef.current) {
      trailingUiTimerRef.current = setTimeout(() => {
        trailingUiTimerRef.current = null;
        commitUi(flightProgressRef.current);
      }, 60);
    }
  }, []);

  // Lightweight native passive scroll listener (0% CPU when idle, no extra RAF loop)
  useEffect(() => {
    const cancelProgrammaticScroll = () => {
      programmaticJumpTargetRef.current = null;
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
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', cancelProgrammaticScroll, { passive: true });
    window.addEventListener('touchstart', cancelProgrammaticScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', cancelProgrammaticScroll);
      window.removeEventListener('touchstart', cancelProgrammaticScroll);
      if (scrollAnimRaf.current) cancelAnimationFrame(scrollAnimRaf.current);
      if (trailingUiTimerRef.current) clearTimeout(trailingUiTimerRef.current);
    };
  }, []);

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

  const handleToggleAudio = useCallback(() => {
    const active = cosmicAudio.toggle();
    setAudioActive(active);
  }, []);

  const handleOpenTerminal = useCallback(() => {
    setIsTerminalOpen(true);
  }, []);

  // Instant-response sidebar navigation: highlights destination & cross-fades card on frame 0
  // while smoothly sweeping the 2D canvas flight there in ~200-520ms (zero double-damping delay!)
  const handleJumpToStage = useCallback((fraction: number) => {
    if (!trackRef.current) return;
    if (scrollAnimRaf.current) {
      cancelAnimationFrame(scrollAnimRaf.current);
      scrollAnimRaf.current = null;
    }

    const maxScroll = Math.max(trackRef.current.scrollHeight - window.innerHeight, 1);
    const targetStage = stageForProgress(fraction);
    const targetStep = stepForProgress(fraction);

    programmaticJumpTargetRef.current = fraction;
    scrollProgressRef.current = fraction;
    lastStageRef.current = targetStage;
    lastLaunchStepRef.current = targetStep;
    setActiveStageIndex(targetStage);
    setLaunchStep(targetStep);

    window.scrollTo({ top: fraction * maxScroll, behavior: 'instant' as ScrollBehavior });
  }, []);

  const handleLaunch = useCallback(() => {
    if (!trackRef.current) return;
    programmaticJumpTargetRef.current = null;
    if (cosmicAudio.isMuted && !cosmicAudio.userExplicitlyMuted) {
      cosmicAudio.unmute();
      setAudioActive(true);
    }
    cosmicAudio.playQuindarTone(true);
    cosmicAudio.playRadioCallout('Initiating liftoff sequence. Dual Vikas core ignited.');

    const maxScroll = trackRef.current.scrollHeight - window.innerHeight;
    animateScrollTo(0.24 * maxScroll, 3200);
  }, [animateScrollTo]);

  return (
    <div
      ref={trackRef}
      className="relative min-h-[580vh] bg-[#050505] text-white overflow-x-hidden selection:bg-white selection:text-black"
    >
      {/* Pure Monochrome Liftoff Loading Screen (unmounts cleanly after launch) */}
      {showLoader && <MonochromeLiftoffLoader onComplete={handleLoaderComplete} />}

      {/* On-demand comet follower ring cursor */}
      <CustomCursor />

      {/* Ultra-lightweight 2.5D HTML5 Canvas Space Launch Engine (Zero WebGL / Three.js overhead) */}
      <SpaceFlightCanvas2D
        scrollProgressRef={scrollProgressRef}
        scrollSpeedRef={scrollSpeedRef}
        programmaticJumpTargetRef={programmaticJumpTargetRef}
        onFlightProgress={updateUI}
        cameraMode={cameraMode}
        blueprintMode={blueprintMode}
      />

      {/* Immediate Dashboard & Flight HUD Overlays (Instant Zero-Delay Paint) */}
      <div className="opacity-100 pointer-events-auto">
        {/* Minimalist Flight HUD & Clickable Sidebar */}
        <FlightHUD
          scrollProgress={uiScrollProgress}
          activeStageIndex={activeStageIndex}
          audioActive={audioActive}
          onToggleAudio={handleToggleAudio}
          onJumpToStage={handleJumpToStage}
          onOpenTerminal={handleOpenTerminal}
        />

        {/* Cinematic Pinned Narrative Storyboard on the Left (Zero scroll-tick re-renders!) */}
        <FlightMissionOverlays
          activeStageIndex={activeStageIndex}
          launchStep={launchStep}
          onLaunch={handleLaunch}
          onSelectProject={setSelectedProject}
          entered={!showLoader}
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
