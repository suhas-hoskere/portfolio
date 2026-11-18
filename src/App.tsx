import React, { useEffect, useState, useRef, useCallback, startTransition, Suspense, lazy } from 'react';
import { SpaceFlightCanvas2D } from './components/SpaceFlightCanvas2D';
import { FlightHUD } from './components/FlightHUD';
import { FlightMissionOverlays } from './components/FlightMissionOverlays';
import type { ProjectData } from './data/portfolioData';
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
  'section-education',
  'section-heritage',
  'section-stack',
  'section-missions',
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
  const [isAutoTourActive, setIsAutoTourActive] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  const [cameraMode, setCameraMode] = useState<'CINEMATIC' | 'BOOSTER' | 'CHASE'>('CINEMATIC');
  const [blueprintMode, setBlueprintMode] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  const handleLoaderComplete = useCallback(() => {
    setShowLoader(false);
  }, []);

  // Gently auto-start ambient soundtrack on first user gesture
  useEffect(() => {
    const startMusicOnce = (e: Event) => {
      window.removeEventListener('pointerdown', startMusicOnce);
      window.removeEventListener('keydown', startMusicOnce);
      // Let the AUDIO button's own onClick handle toggling cleanly
      if (e.target instanceof Element && e.target.closest('[aria-label="Toggle Sound"]')) {
        return;
      }
      if (cosmicAudio.isMuted && !cosmicAudio.userExplicitlyMuted) {
        const started = cosmicAudio.unmute();
        if (started) setAudioActive(true);
      }
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
      setIsAutoTourActive(false);
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

    const handleScrollKeyCancel = (e: KeyboardEvent) => {
      if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === 'PageDown' ||
        e.key === 'PageUp' ||
        e.key === 'Home' ||
        e.key === 'End' ||
        e.key === ' '
      ) {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        cancelProgrammaticScroll();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', cancelProgrammaticScroll, { passive: true });
    window.addEventListener('touchstart', cancelProgrammaticScroll, { passive: true });
    window.addEventListener('keydown', handleScrollKeyCancel, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', cancelProgrammaticScroll);
      window.removeEventListener('touchstart', cancelProgrammaticScroll);
      window.removeEventListener('keydown', handleScrollKeyCancel);
      if (scrollAnimRaf.current) cancelAnimationFrame(scrollAnimRaf.current);
      if (trailingUiTimerRef.current) clearTimeout(trailingUiTimerRef.current);
    };
  }, []);

  const animateScrollTo = useCallback((targetY: number, durationMs: number, easeOutOnly = false) => {
    if (scrollAnimRaf.current) cancelAnimationFrame(scrollAnimRaf.current);
    const startY = window.scrollY || window.pageYOffset || 0;
    const dist = targetY - startY;
    const maxScroll = Math.max(
      (trackRef.current?.scrollHeight || document.documentElement.scrollHeight) - window.innerHeight,
      1
    );
    let startTime: number | null = null;

    const step = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsed = Math.max(0, now - startTime);
      const t = Math.min(elapsed / Math.max(durationMs, 1), 1);
      const eased = easeOutOnly
        ? 1 - Math.pow(1 - t, 2.2)
        : t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const nextY = startY + dist * eased;
      window.scrollTo({ top: nextY, behavior: 'instant' as ScrollBehavior });
      scrollProgressRef.current = Math.min(Math.max(nextY / maxScroll, 0), 1);
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

  const handleSetAudio = useCallback((enabled: boolean) => {
    if (enabled && cosmicAudio.isMuted) {
      setAudioActive(cosmicAudio.toggle());
    } else if (!enabled && !cosmicAudio.isMuted) {
      setAudioActive(cosmicAudio.toggle());
    }
  }, []);

  const stopAutoTour = useCallback(() => {
    if (scrollAnimRaf.current) {
      cancelAnimationFrame(scrollAnimRaf.current);
      scrollAnimRaf.current = null;
    }
    setIsAutoTourActive(false);
  }, []);

  const handleOpenTerminal = useCallback(() => {
    stopAutoTour();
    setIsTerminalOpen(true);
  }, [stopAutoTour]);

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
      setIsAutoTourActive(false);
      programmaticJumpTargetRef.current = targetFraction;
      lastStageRef.current = clampedIdx;
      setActiveStageIndex(clampedIdx);

      const distFrac = Math.abs(targetFraction - scrollProgressRef.current);
      const durationMs = Math.max(1100, Math.min(2400, Math.round(950 + distFrac * 1450)));
      animateScrollTo(targetY, durationMs, true);
    },
    [animateScrollTo]
  );

  const handleSelectProject = useCallback(
    (proj: ProjectData) => {
      stopAutoTour();
      setSelectedProject(proj);
    },
    [stopAutoTour]
  );

  // "Explore Journey" button: hands-free slow reading cruise across the entire page (~88 px/sec)
  // so visitors can read every section & watch the entire launch-to-orbit flight without touching scroll!
  const handleLaunch = useCallback(() => {
    if (scrollAnimRaf.current) {
      cancelAnimationFrame(scrollAnimRaf.current);
      scrollAnimRaf.current = null;
    }
    programmaticJumpTargetRef.current = null;
    if (cosmicAudio.isMuted && !cosmicAudio.userExplicitlyMuted) {
      cosmicAudio.unmute();
      setAudioActive(true);
    }

    const getMaxScroll = () =>
      Math.max(
        (trackRef.current?.scrollHeight || document.documentElement.scrollHeight) - window.innerHeight,
        1
      );
    let currentY = window.scrollY || window.pageYOffset || 0;
    if (currentY >= getMaxScroll() - 10) {
      currentY = 0;
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }

    const basePxPerSec = 88; // Comfortable hands-free reading & cinematic launch pace
    let lastNow: number | null = null;
    let elapsedSec = 0;
    setIsAutoTourActive(true);

    const cruiseStep = (now: number) => {
      if (lastNow === null) lastNow = now;
      const dt = Math.min(Math.max((now - lastNow) / 1000, 0), 0.05);
      lastNow = now;
      elapsedSec += dt;

      const maxScroll = getMaxScroll();
      const remaining = maxScroll - currentY;
      if (remaining <= 0.5) {
        window.scrollTo({ top: maxScroll, behavior: 'instant' as ScrollBehavior });
        scrollProgressRef.current = 1;
        scrollAnimRaf.current = null;
        setIsAutoTourActive(false);
        return;
      }

      // Gentle 0.9s ramp-up at takeoff + soft 180px feather-stop at the bottom
      const rampIn = Math.min(elapsedSec / 0.9, 1);
      const rampOut = Math.min(remaining / 180, 1);
      const speed = basePxPerSec * (0.25 + 0.75 * rampIn) * (0.22 + 0.78 * rampOut);

      currentY = Math.min(currentY + speed * dt, maxScroll);
      window.scrollTo({ top: currentY, behavior: 'instant' as ScrollBehavior });
      scrollProgressRef.current = Math.min(Math.max(currentY / maxScroll, 0), 1);

      scrollAnimRaf.current = requestAnimationFrame(cruiseStep);
    };

    scrollAnimRaf.current = requestAnimationFrame(cruiseStep);
  }, []);

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
        isAutoTourActive={isAutoTourActive}
        onToggleAudio={handleToggleAudio}
        onJumpToStage={handleJumpToStage}
        onOpenTerminal={handleOpenTerminal}
      />

      {/* Minimal Hands-Free Auto-Tour Pause Pill */}
      {isAutoTourActive && (
        <div className="fixed bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
          <button
            type="button"
            onClick={stopAutoTour}
            className="px-3.5 py-1.5 rounded-full bg-[#050505]/95 border border-white/25 hover:border-white text-[10px] font-mono tracking-[0.18em] text-zinc-200 hover:text-white uppercase flex items-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.8)] transition-colors cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>Auto Journey · Click or Scroll to Pause</span>
          </button>
        </div>
      )}

      {/* Single Continuous Transparent Scrollable Editorial Page */}
      <FlightMissionOverlays
        onLaunch={handleLaunch}
        onSelectProject={handleSelectProject}
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
            audioActive={audioActive}
            onSetAudio={handleSetAudio}
            onJumpToStage={handleJumpToStage}
            onSelectProject={handleSelectProject}
            onStartTour={handleLaunch}
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
