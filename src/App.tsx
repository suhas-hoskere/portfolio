import React, { useEffect, useState, useRef, useCallback } from 'react';
import Lenis from 'lenis';
import { AnimatePresence } from 'framer-motion';
import { CosmicFlightScene } from './components/CosmicFlightScene';
import { FlightHUD } from './components/FlightHUD';
import { FlightMissionOverlays } from './components/FlightMissionOverlays';
import type { ProjectData } from './components/FlightMissionOverlays';
import { FlightMissionModal } from './components/FlightMissionModal';
import { CustomCursor } from './components/CustomCursor';
import { LaunchPreloader } from './components/LaunchPreloader';
import { cosmicAudio } from './components/AudioEngine';
// STAGE_CONFIG removed

export const App: React.FC = () => {
  // Guarantee clean startup at Ground Zero (0 km, Stage 0) with zero accidental scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  // Pre-flight Launch Initialization State (Plays 5-second entrance intro on every load/reload)
  const [isPreloading, setIsPreloading] = useState(true);
  const [showDashboard, setShowDashboard] = useState(false);
  

  const handleShowDashboard = useCallback(() => {
    setShowDashboard(true);
  }, []);

  const handlePreloaderComplete = useCallback(() => {
    setShowDashboard(true);
    setIsPreloading(false);
  }, []);

  // Discrete Stage State (Choreographed flight stage 0 to 5)
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [uiScrollProgress, setUiScrollProgress] = useState(0);
  const [audioActive, setAudioActive] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  // High-performance mutable refs read directly inside Three.js useFrame
  const scrollProgressRef = useRef(0);
  const scrollSpeedRef = useRef(0);
  const lenisRef = useRef<Lenis | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const rafThrottler = useRef<number | null>(null);
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

    setActiveStageIndex(stage);
    setUiScrollProgress(progress);
    cosmicAudio.updateFallIntensity(progress);
  }, []);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.35,
      easing: (t: number) => 1 - Math.pow(1 - t, 3.5),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    lenis.on('scroll', (e: { scroll: number }) => {
      const maxScroll = (trackRef.current?.scrollHeight || 8000) - window.innerHeight;
      const progress = Math.min(Math.max(e.scroll / Math.max(maxScroll, 1), 0), 1);
      scrollProgressRef.current = progress;

      // Compute instantaneous speed for GPU warp shader without triggering re-render
      const now = Date.now();
      const dt = Math.max(now - lastScrollTime.current, 1);
      const dy = Math.abs(e.scroll - lastScrollY.current);
      const speed = Math.min(dy / dt, 4.0);
      scrollSpeedRef.current = speed;

      lastScrollY.current = e.scroll;
      lastScrollTime.current = now;

      // Throttled UI state sync
      if (!rafThrottler.current) {
        rafThrottler.current = requestAnimationFrame(() => {
          updateUI(progress);
          rafThrottler.current = null;
        });
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (rafThrottler.current) cancelAnimationFrame(rafThrottler.current);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [updateUI]);

  const handleToggleAudio = () => {
    const active = cosmicAudio.toggle();
    setAudioActive(active);
  };

  const handleJumpToStage = (fraction: number) => {
    if (!lenisRef.current || !trackRef.current) return;
    const maxScroll = trackRef.current.scrollHeight - window.innerHeight;
    lenisRef.current.scrollTo(fraction * maxScroll, {
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
  };

  const handleLaunch = () => {
    if (!lenisRef.current || !trackRef.current) return;
    const maxScroll = trackRef.current.scrollHeight - window.innerHeight;
    // Smoothly scroll forward through the liftoff sequence into Stage 01
    lenisRef.current.scrollTo(0.25 * maxScroll, {
      duration: 3.2,
      easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    });
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
      {/* Subtle comet follower ring cursor */}
      <CustomCursor />

      {/* Aerospace Mission Launch Countdown Preloader with Real-Time Telemetry Timer */}
      <AnimatePresence>
        {isPreloading && (
          <LaunchPreloader
            onShowDashboard={handleShowDashboard}
            onComplete={handlePreloaderComplete}
          />
        )}
      </AnimatePresence>

      {/* 3D Cosmic WebGL Scene (Framed cleanly on the right half of the screen) */}
      <CosmicFlightScene
        scrollProgressRef={scrollProgressRef}
        scrollSpeedRef={scrollSpeedRef}
        activeStageIndex={activeStageIndex}
        
        
        
      />

      {/* Dashboard Overlays: Reveal smoothly at T-3.00 seconds */}
      <div className={`transition-opacity duration-1000 ${
        showDashboard || !isPreloading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Minimalist Flight HUD & Trajectory Pips */}
        <FlightHUD
          scrollProgress={uiScrollProgress}
          activeStageIndex={activeStageIndex}
          audioActive={audioActive}
          onToggleAudio={handleToggleAudio}
          onJumpToStage={handleJumpToStage}
        />

        {/* Cinematic Pinned Narrative Storyboard on the Left */}
        <FlightMissionOverlays
          activeStageIndex={activeStageIndex}
          scrollProgress={uiScrollProgress}
          onLaunch={handleLaunch}
          onSelectProject={setSelectedProject}
        />
      </div>



      {/* Architectural Mission Details Modal */}
      <FlightMissionModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
};

export default App;
