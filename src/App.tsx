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

const SECTION_IDS = [
  'section-pad',
  'section-ascent',
  'section-orbit',
  'section-missions',
  'section-heritage',
  'section-signal',
] as const;

function computeActiveStageFromDOM(): number {
  const viewportMid = window.innerHeight * 0.5;
  let bestIdx = 0;
  let bestDist = Infinity;

  for (let i = 0; i < SECTION_IDS.length; i++) {
    const el = document.getElementById(SECTION_IDS[i]);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    const center = rect.top + rect.height * 0.5;
    const dist = Math.abs(center - viewportMid);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export const App: React.FC = () => {
  // Guarantee clean startup at Ground Zero (top of page)
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  const [showLoader, setShowLoader] = useState(true);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
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

  // Prevent accidental scrolling while the intro liftoff loader plays
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
  const lastStageRef = useRef(0);
  const lastUiCommitTimeRef = useRef(0);
  const lastUiProgressRef = useRef(0);
  const trailingUiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playedCallouts = useRef<Set<string>>(new Set());

  // Throttled HUD & acoustics updater driven by the Canvas's velocity-paced flight timeline
  const updateUI = useCallback((progress: number) => {
    flightProgressRef.current = progress;
    const isSidebarJump = programmaticJumpTargetRef.current !== null;

    if (!isSidebarJump) {
      if (progress < 0.02) {
        playedCallouts.current.clear();
      } else if (progress >= 0.068 && progress < 0.104 && !playedCallouts.current.has('umbilical')) {
        playedCallouts.current.add('umbilical');
        cosmicAudio.playClampRelease();
      } else if (progress >= 0.104 && progress < 0.140 && !playedCallouts.current.has('deluge')) {
        playedCallouts.current.add('deluge');
        cosmicAudio.playDelugeSound();
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

  // Native continuous passive scroll listener (0% CPU when idle, zero scroll-hijacking)
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
      const maxScroll = Math.max(
        (trackRef.current?.scrollHeight || document.documentElement.scrollHeight) - window.innerHeight,
        1
      );
      const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
      scrollProgressRef.current = progress;

      const now = performance.now();
      const dt = Math.max(now - lastScrollTime.current, 1);
      const dy = Math.abs(scrollY - lastScrollY.current);
      scrollSpeedRef.current = Math.min(dy / dt, 4.0);
      lastScrollY.current = scrollY;
      lastScrollTime.current = now;

      // Sync sidebar active page highlight cleanly to whichever transparent section is in view
      if (programmaticJumpTargetRef.current === null) {
        const visibleStage = computeActiveStageFromDOM();
        if (visibleStage !== lastStageRef.current) {
          lastStageRef.current = visibleStage;
          cosmicAudio.playStagingSound();
          startTransition(() => {
            setActiveStageIndex(visibleStage);
          });
        }
      }
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

  const animateScrollTo = useCallback((targetY: number, durationMs: number, easeOutOnly = false) => {
    if (scrollAnimRaf.current) cancelAnimationFrame(scrollAnimRaf.current);
    const startY = window.scrollY || window.pageYOffset || 0;
    const dist = targetY - startY;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / durationMs, 1);
      const eased = easeOutOnly
        ? 1 - Math.pow(1 - t, 3)
        : t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
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

  // Crisp sidebar click jump: scrolls directly to the exact transparent section anchor
  const handleJumpToStage = useCallback(
    (stageIndex: number) => {
      const clampedIdx = Math.min(Math.max(stageIndex, 0), SECTION_IDS.length - 1);
      const maxScroll = Math.max(
        (trackRef.current?.scrollHeight || document.documentElement.scrollHeight) - window.innerHeight,
        1
      );

      let targetY = 0;
      if (clampedIdx === 0) {
        targetY = 0;
      } else if (clampedIdx === SECTION_IDS.length - 1) {
        targetY = maxScroll;
      } else {
        const el = document.getElementById(SECTION_IDS[clampedIdx]);
        if (el) {
          targetY = Math.min(
            Math.max(el.offsetTop + (el.offsetHeight - window.innerHeight) * 0.5, 0),
            maxScroll
          );
        }
      }

      const targetFraction = targetY / maxScroll;
      programmaticJumpTargetRef.current = targetFraction;
      lastStageRef.current = clampedIdx;
      setActiveStageIndex(clampedIdx);

      const distFrac = Math.abs(targetFraction - scrollProgressRef.current);
      const durationMs = Math.max(360, Math.min(680, Math.round(320 + distFrac * 420)));
      animateScrollTo(targetY, durationMs, true);
    },
    [animateScrollTo]
  );

  // "Ignite & Lift Off" button smoothly launches down past the launch sequence into Stage 01 Ascent
  const handleLaunch = useCallback(() => {
    programmaticJumpTargetRef.current = null;
    if (cosmicAudio.isMuted && !cosmicAudio.userExplicitlyMuted) {
      cosmicAudio.unmute();
      setAudioActive(true);
    }
    cosmicAudio.playQuindarTone(true);
    cosmicAudio.playRadioCallout('Initiating liftoff sequence. Dual Vikas core ignited.');

    const maxScroll = Math.max(
      (trackRef.current?.scrollHeight || document.documentElement.scrollHeight) - window.innerHeight,
      1
    );
    const ascentEl = document.getElementById('section-ascent');
    const targetY = ascentEl
      ? Math.min(
          Math.max(ascentEl.offsetTop + (ascentEl.offsetHeight - window.innerHeight) * 0.5, 0),
          maxScroll
        )
      : maxScroll * 0.34;
    animateScrollTo(targetY, 2800, false);
  }, [animateScrollTo]);

  return (
    <div
      ref={trackRef}
      className="relative min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-white selection:text-black"
    >
      {/* Pure Monochrome Liftoff Loading Screen (unmounts cleanly after launch) */}
      {showLoader && <MonochromeLiftoffLoader onComplete={handleLoaderComplete} />}

      {/* Redesigned Hairy Vintage Feather Quill Cursor + Floating Micro-Particles */}
      <CustomCursor />

      {/* Fixed Full-Viewport 2.5D HTML5 Canvas Space Launch Engine */}
      <SpaceFlightCanvas2D
        scrollProgressRef={scrollProgressRef}
        scrollSpeedRef={scrollSpeedRef}
        programmaticJumpTargetRef={programmaticJumpTargetRef}
        onFlightProgress={updateUI}
        cameraMode={cameraMode}
        blueprintMode={blueprintMode}
      />

      {/* Fixed Minimalist Monochrome HUD & Clickable Page Sidebar */}
      <FlightHUD
        scrollProgress={uiScrollProgress}
        activeStageIndex={activeStageIndex}
        audioActive={audioActive}
        onToggleAudio={handleToggleAudio}
        onJumpToStage={handleJumpToStage}
        onOpenTerminal={handleOpenTerminal}
      />

      {/* Single Continuous Transparent Scrollable Editorial Page */}
      <FlightMissionOverlays
        onLaunch={handleLaunch}
        onSelectProject={setSelectedProject}
        entered={!showLoader}
      />

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
