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

interface FlightStep {
  sp: number;
  stage: number;
  launchStep: number;
  cooldownMs: number;
}

/**
 * 10 discrete 1-scroll = 1-action mission waypoints:
 * Each wheel scroll / swipe / arrow press advances or rewinds EXACTLY ONE action so
 * cards and launch/staging milestones never stack or skip simultaneously.
 */
const FLIGHT_STEPS: readonly FlightStep[] = [
  { sp: 0.000, stage: 0, launchStep: -1, cooldownMs: 460 }, // 0: Launch Pad — Hero
  { sp: 0.050, stage: 0, launchStep: 0, cooldownMs: 520 },  // 1: Step 01 — Main Engine Ignition
  { sp: 0.086, stage: 0, launchStep: 1, cooldownMs: 520 },  // 2: Step 02 — Clamps & Umbilical Release
  { sp: 0.122, stage: 0, launchStep: 2, cooldownMs: 540 },  // 3: Step 03 — Water Deluge & Trench Steam
  { sp: 0.200, stage: 0, launchStep: 3, cooldownMs: 650 },  // 4: Step 04 — Vertical Liftoff & Tower Clearance
  { sp: 0.395, stage: 1, launchStep: 3, cooldownMs: 880 },  // 5: Stage 01 — Davanagere Origins (Clouds & S200 Booster Sep)
  { sp: 0.645, stage: 2, launchStep: 3, cooldownMs: 920 },  // 6: Stage 02 — Bangalore & PES (Fairing Split & Satellite Deploy)
  { sp: 0.745, stage: 3, launchStep: 3, cooldownMs: 560 },  // 7: Stage 03 — Exploration Missions (4 Projects in LEO)
  { sp: 0.850, stage: 4, launchStep: 3, cooldownMs: 560 },  // 8: Stage 04 — Kannada Heritage (Karnataka Pass)
  { sp: 0.985, stage: 5, launchStep: 3, cooldownMs: 680 },  // 9: Stage 05 — Orbital Uplink (Enlarged Nadir Satellite & Downlink)
];

function findNearestStepIndex(fraction: number): number {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < FLIGHT_STEPS.length; i++) {
    const d = Math.abs(FLIGHT_STEPS[i].sp - fraction);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function canInnerContainerScroll(target: EventTarget | null, deltaY: number): boolean {
  let el = target as HTMLElement | null;
  while (el && el !== document.body) {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 2) {
      if (deltaY > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 2) return true;
      if (deltaY < 0 && el.scrollTop > 2) return true;
    }
    el = el.parentElement;
  }
  return false;
}

export const App: React.FC = () => {
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  // Discrete Choreographed Flight State
  const [showLoader, setShowLoader] = useState(true);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [launchStep, setLaunchStep] = useState(-1);
  const [uiScrollProgress, setUiScrollProgress] = useState(0);
  const [audioActive, setAudioActive] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  const [cameraMode, setCameraMode] = useState<'CINEMATIC' | 'BOOSTER' | 'CHASE'>('CINEMATIC');
  const [blueprintMode, setBlueprintMode] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  const handleLoaderComplete = useCallback(() => {
    setShowLoader(false);
  }, []);

  // Gently auto-start ambient soundtrack on first user gesture
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

  // High-performance mutable refs read directly inside the 2D Canvas render loop
  const scrollProgressRef = useRef(0);
  const flightProgressRef = useRef(0);
  const scrollSpeedRef = useRef(0);
  const programmaticJumpTargetRef = useRef<number | null>(null);
  const currentStepIdxRef = useRef(0);
  const lastStepTimeRef = useRef(0);
  const lastWheelEventTimeRef = useRef(0);
  const activeCooldownRef = useRef(460);
  const launchSequenceTimersRef = useRef<number[]>([]);
  const lastUiCommitTimeRef = useRef(0);
  const lastUiProgressRef = useRef(0);
  const trailingUiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playedCallouts = useRef<Set<string>>(new Set());

  const clearLaunchSequence = useCallback(() => {
    for (const id of launchSequenceTimersRef.current) {
      window.clearTimeout(id);
    }
    launchSequenceTimersRef.current = [];
  }, []);

  // Transitions cleanly to an exact step index (1 scroll = 1 action)
  const goToStep = useCallback(
    (nextIdx: number, fastSidebarJump = false) => {
      const clamped = Math.min(Math.max(nextIdx, 0), FLIGHT_STEPS.length - 1);
      const prevIdx = currentStepIdxRef.current;
      if (clamped === prevIdx && !fastSidebarJump) return;

      const step = FLIGHT_STEPS[clamped];
      const prevStep = FLIGHT_STEPS[prevIdx];
      currentStepIdxRef.current = clamped;
      activeCooldownRef.current = step.cooldownMs;
      lastStepTimeRef.current = performance.now();

      scrollProgressRef.current = step.sp;
      scrollSpeedRef.current = fastSidebarJump ? 1.8 : 1.0;
      programmaticJumpTargetRef.current = fastSidebarJump ? step.sp : null;

      // Crisp step acoustics
      if (!fastSidebarJump) {
        if (clamped === 0) {
          playedCallouts.current.clear();
        } else if (clamped === 2 && prevIdx < 2) {
          cosmicAudio.playClampRelease();
        } else if (clamped === 3 && prevIdx < 3) {
          cosmicAudio.playDelugeSound();
        } else if (step.stage !== prevStep.stage) {
          cosmicAudio.playStagingSound();
        }
      }

      setActiveStageIndex(step.stage);
      setLaunchStep(step.launchStep);
    },
    []
  );

  // Syncs HUD telemetry & audio smoothly to the live canvas flight position
  const updateUI = useCallback((progress: number) => {
    flightProgressRef.current = progress;
    const now = performance.now();
    const boundaryHit = progress <= 0.001 || progress >= 0.984;

    const commitUi = (p: number) => {
      lastUiCommitTimeRef.current = performance.now();
      lastUiProgressRef.current = p;
      cosmicAudio.updateFallIntensity(p);
      startTransition(() => {
        setUiScrollProgress(p);
      });
    };

    if (
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

  // Discrete 1-Scroll = 1-Action input controller (wheel, trackpad, touch swipe, keyboard)
  useEffect(() => {
    const isModalOrLoaderOpen = () => showLoader || isTerminalOpen || selectedProject !== null;

    const onWheel = (e: WheelEvent) => {
      if (isModalOrLoaderOpen()) return;
      if (canInnerContainerScroll(e.target, e.deltaY)) return;

      e.preventDefault();
      clearLaunchSequence();

      const now = performance.now();
      const absDelta = Math.abs(e.deltaY);
      const gapSinceLastEvent = now - lastWheelEventTimeRef.current;
      lastWheelEventTimeRef.current = now;

      // Ignore tiny trackpad residual drift
      if (absDelta < 10) return;

      // Cooldown prevents one wheel flick or trackpad inertia tail from firing multiple steps at once
      const elapsedSinceStep = now - lastStepTimeRef.current;
      if (elapsedSinceStep < activeCooldownRef.current) return;

      // Guard against long decaying trackpad inertia tail: if events are still streaming continuously
      // right after cooldown (< 95ms gap), require a stronger deliberate flick (>= 34px)
      if (gapSinceLastEvent < 95 && elapsedSinceStep < activeCooldownRef.current + 360 && absDelta < 34) {
        return;
      }

      const dir = e.deltaY > 0 ? 1 : -1;
      goToStep(currentStepIdxRef.current + dir, false);
    };

    let touchStartY: number | null = null;
    let touchStartX: number | null = null;

    const onTouchStart = (e: TouchEvent) => {
      if (isModalOrLoaderOpen() || e.touches.length !== 1) return;
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (isModalOrLoaderOpen() || touchStartY === null || touchStartX === null) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const dy = touchStartY - touch.clientY;
      const dx = Math.abs(touchStartX - touch.clientX);
      touchStartY = null;
      touchStartX = null;

      if (Math.abs(dy) < 36 || Math.abs(dy) < dx) return;
      if (canInnerContainerScroll(e.target, dy)) return;

      const now = performance.now();
      if (now - lastStepTimeRef.current < 420) return;

      clearLaunchSequence();
      goToStep(currentStepIdxRef.current + (dy > 0 ? 1 : -1), false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        setIsTerminalOpen((prev) => !prev);
        cosmicAudio.playTelemetryChirp(1200, 0.04);
        return;
      }
      if (e.key === 'Escape' && isTerminalOpen) {
        setIsTerminalOpen(false);
        return;
      }
      if (isModalOrLoaderOpen()) return;

      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        clearLaunchSequence();
        goToStep(currentStepIdxRef.current + 1, false);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        clearLaunchSequence();
        goToStep(currentStepIdxRef.current - 1, false);
      } else if (e.key === 'Home') {
        e.preventDefault();
        clearLaunchSequence();
        goToStep(0, true);
      } else if (e.key === 'End') {
        e.preventDefault();
        clearLaunchSequence();
        goToStep(FLIGHT_STEPS.length - 1, true);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
      if (trailingUiTimerRef.current) clearTimeout(trailingUiTimerRef.current);
      clearLaunchSequence();
    };
  }, [showLoader, isTerminalOpen, selectedProject, goToStep, clearLaunchSequence]);

  const handleToggleAudio = useCallback(() => {
    const active = cosmicAudio.toggle();
    setAudioActive(active);
  }, []);

  const handleOpenTerminal = useCallback(() => {
    setIsTerminalOpen(true);
  }, []);

  // Instant-response sidebar navigation: jumps straight to the target page's waypoint
  const handleJumpToStage = useCallback(
    (fraction: number) => {
      clearLaunchSequence();
      const targetIdx = findNearestStepIndex(fraction);
      goToStep(targetIdx, true);
    },
    [goToStep, clearLaunchSequence]
  );

  // "Ignite & Lift Off" button runs the 4 launchpad steps sequentially (Ignition -> Clamps -> Deluge -> Liftoff)
  const handleLaunch = useCallback(() => {
    clearLaunchSequence();
    if (cosmicAudio.isMuted && !cosmicAudio.userExplicitlyMuted) {
      cosmicAudio.unmute();
      setAudioActive(true);
    }
    cosmicAudio.playQuindarTone(true);
    cosmicAudio.playRadioCallout('Initiating liftoff sequence. Dual Vikas core ignited.');

    goToStep(1, false);
    launchSequenceTimersRef.current = [
      window.setTimeout(() => goToStep(2, false), 850),
      window.setTimeout(() => goToStep(3, false), 1700),
      window.setTimeout(() => goToStep(4, false), 2550),
    ];
  }, [goToStep, clearLaunchSequence]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#050505] text-white selection:bg-white selection:text-black">
      {/* Pure Monochrome Liftoff Loading Screen (unmounts cleanly after launch) */}
      {showLoader && <MonochromeLiftoffLoader onComplete={handleLoaderComplete} />}

      {/* Redesigned Hairy Vintage Feather Quill Cursor + Floating Micro-Particles */}
      <CustomCursor />

      {/* Ultra-lightweight 2.5D HTML5 Canvas Space Launch Engine */}
      <SpaceFlightCanvas2D
        scrollProgressRef={scrollProgressRef}
        scrollSpeedRef={scrollSpeedRef}
        programmaticJumpTargetRef={programmaticJumpTargetRef}
        onFlightProgress={updateUI}
        cameraMode={cameraMode}
        blueprintMode={blueprintMode}
      />

      {/* Immediate Dashboard & Flight HUD Overlays */}
      <div className="opacity-100 pointer-events-auto">
        <FlightHUD
          scrollProgress={uiScrollProgress}
          activeStageIndex={activeStageIndex}
          audioActive={audioActive}
          onToggleAudio={handleToggleAudio}
          onJumpToStage={handleJumpToStage}
          onOpenTerminal={handleOpenTerminal}
        />

        <FlightMissionOverlays
          activeStageIndex={activeStageIndex}
          launchStep={launchStep}
          onLaunch={handleLaunch}
          onSelectProject={setSelectedProject}
          entered={!showLoader}
        />
      </div>

      {/* Lazy Modals: Zero DOM or memory overhead until activated */}
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
