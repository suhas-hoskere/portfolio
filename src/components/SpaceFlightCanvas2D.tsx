import React, { useEffect, useRef } from 'react';
import type { CameraMode, Scene2DFrameContext } from '../scene2d/types';
import { clamp, lerp, smoothstep } from '../scene2d/types';
import { renderSkyAndStars, warmSkySprites } from '../scene2d/skyAndStars';
import { renderSriharikotaTerrain } from '../scene2d/sriharikotaTerrain';
import { renderLaunchPadBack, renderLaunchPadFront } from '../scene2d/launchPad';
import { renderRocketVehicle } from '../scene2d/rocketVehicle';
import { renderAtmosphericClouds } from '../scene2d/clouds';
import { renderEarthAndOrbit, warmEarthSprite } from '../scene2d/earthAndOrbit';
import { renderHeroSatellite } from '../scene2d/heroSatellite';

interface SpaceFlightCanvas2DProps {
  scrollProgressRef: React.MutableRefObject<number>;
  scrollSpeedRef: React.MutableRefObject<number>;
  programmaticJumpTargetRef?: React.MutableRefObject<number | null>;
  onFlightProgress?: (smoothProgress: number) => void;
  cameraMode?: CameraMode;
  blueprintMode?: boolean;
}

/**
 * Single silky monotonic speed curve (scroll-fraction / sec) with ZERO braking dips at stations:
 * - Smoothly rises from 0.145/s during launch & staging to 0.215/s in open LEO orbit
 * - Prevents rapid flick-scrolling from skipping ignition, liftoff, booster sep, fairing split, or satellite deploy
 * - Never feels sticky or slow at Origins, Bangalore, Projects, Heritage, or Uplink
 */
function getCinematicMaxRate(sp: number): number {
  return lerp(0.15, 0.22, smoothstep(0.0, 0.72, sp));
}

/**
 * Pure Monochrome Black & White Earth-to-Orbit 2D Flight Canvas:
 * - Zero WebGL, zero camera shake, pure Launch -> Outer Atmosphere -> Satellite in LEO.
 * - Velocity-paced cinematic flight controller ensures rapid scrolling never skips staging events.
 */
export const SpaceFlightCanvas2D: React.FC<SpaceFlightCanvas2DProps> = React.memo(({
  scrollProgressRef,
  scrollSpeedRef,
  programmaticJumpTargetRef,
  onFlightProgress,
  cameraMode = 'CINEMATIC',
  blueprintMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraModeRef = useRef<CameraMode>(cameraMode);
  const blueprintRef = useRef<boolean>(blueprintMode);
  const onFlightProgressRef = useRef(onFlightProgress);
  useEffect(() => {
    cameraModeRef.current = cameraMode;
    blueprintRef.current = blueprintMode;
    onFlightProgressRef.current = onFlightProgress;
  }, [cameraMode, blueprintMode, onFlightProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      if (reducedMotion) return;
      targetMouseX = (e.clientX / Math.max(width, 1)) * 2 - 1;
      targetMouseY = (e.clientY / Math.max(height, 1)) * 2 - 1;
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    let rafId = 0;
    let lastDraw = performance.now();
    let elapsedSec = 0;
    let smoothSp = scrollProgressRef.current;
    let lastReportedSp = smoothSp;
    let spVel = 0;
    let smoothSpeed = 0;

    // 1:1 VSync-locked native refresh loop (zero artificial frame-skipping judder, 0% CPU when tab hidden)
    const renderLoop = (now: number) => {
      rafId = requestAnimationFrame(renderLoop);

      if (document.hidden) {
        lastDraw = now;
        return;
      }

      const rawDt = (now - lastDraw) / 1000;
      lastDraw = now;
      // Guard against zero/spike dt so animations never stutter or teleport
      if (rawDt <= 0) return;
      const dt = Math.min(rawDt, 0.033);
      elapsedSec += dt;

      // Velocity-paced cinematic flight timeline:
      // - Small scroll nudges track snappily and responsively
      // - Rapid flick-scrolling smoothly caps speed across critical milestones (ignition, clamps, deluge,
      //   liftoff, S200 booster sep, fairing split, satellite solar deploy, nadir lock) so nothing is ever skipped
      // - Sidebar click jumps glide swiftly in fast-forward timelapse (~2.6x) without teleporting
      const targetSp = scrollProgressRef.current;
      const diff = targetSp - smoothSp;
      const jumpTarget = programmaticJumpTargetRef?.current ?? null;
      const isJumping = jumpTarget !== null;

      if (reducedMotion) {
        smoothSp = targetSp;
        spVel = 0;
        if (programmaticJumpTargetRef) programmaticJumpTargetRef.current = null;
      } else if (Math.abs(diff) < 0.00002 && Math.abs(spVel) < 0.00008) {
        smoothSp = targetSp;
        spVel = 0;
        if (isJumping && Math.abs(smoothSp - jumpTarget) < 0.004 && programmaticJumpTargetRef) {
          programmaticJumpTargetRef.current = null;
        }
      } else {
        const baseMaxRate = getCinematicMaxRate(smoothSp);
        const dirMultiplier = diff < 0 ? 1.65 : 1.0;
        const effectiveMaxRate = isJumping ? 2.4 : baseMaxRate * dirMultiplier;

        // Critically-damped (zeta ~ 1.02) soft-saturated velocity controller:
        // - Slow discrete wheel notches / gentle drags respond crisply (~170ms) with ZERO overshoot/snap
        // - Fast continuous scrolling smoothly saturates at effectiveMaxRate via tanh (C-infinity smooth)
        // - Sidebar clicks glide swiftly at 2.4/s with zero bounce
        const omega = isJumping ? 15.0 : 12.0;
        const desiredVel = effectiveMaxRate * Math.tanh((diff * omega) / effectiveMaxRate);
        const accelRate = omega * 4.2;
        const accelLerp = 1 - Math.exp(-accelRate * dt);
        spVel += (desiredVel - spVel) * accelLerp;

        smoothSp = clamp(smoothSp + spVel * dt, 0, 1);

        if (isJumping && Math.abs(smoothSp - jumpTarget) < 0.004 && programmaticJumpTargetRef) {
          programmaticJumpTargetRef.current = null;
        }
      }

      const activeMotionSpeed = Math.max(scrollSpeedRef.current, Math.min(Math.abs(spVel) * 7.5, 2.0));
      smoothSpeed += (activeMotionSpeed - smoothSpeed) * (1 - Math.exp(-10 * dt));
      scrollSpeedRef.current *= Math.pow(0.05, dt);

      const mLerp = 1 - Math.exp(-9 * dt);
      mouseX += (targetMouseX - mouseX) * mLerp;
      mouseY += (targetMouseY - mouseY) * mLerp;

      const isMobile = width < 768;
      const vehicleAnchorX = isMobile ? width * 0.50 : width * 0.74;
      const groundY = isMobile ? height * 0.52 : height * 0.80;
      const unit = isMobile
        ? clamp(Math.min(height * 0.098, width * 0.175), 42, 78)
        : clamp(Math.min(height * 0.145, width * 0.13), 54, 128);

      const frame: Scene2DFrameContext = {
        ctx,
        w: width,
        h: height,
        sp: smoothSp,
        scrollSpeed: smoothSpeed,
        t: elapsedSec,
        dt,
        mouseX: reducedMotion ? 0 : mouseX,
        mouseY: reducedMotion ? 0 : mouseY,
        cameraMode: cameraModeRef.current,
        blueprintMode: blueprintRef.current,
        vehicleAnchorX,
        groundY,
        unit,
        reducedMotion,
      };

      // Clean steady camera — paint entire 2D canvas frame BEFORE notifying React HUD!
      renderSkyAndStars(frame);
      renderEarthAndOrbit(frame);
      renderAtmosphericClouds(frame);
      renderSriharikotaTerrain(frame);
      renderLaunchPadBack(frame);
      renderRocketVehicle(frame);
      renderHeroSatellite(frame);
      renderLaunchPadFront(frame);

      // Sync HUD, stage cards, sidebar & acoustics AFTER canvas frame is submitted
      if (
        onFlightProgressRef.current &&
        (Math.abs(smoothSp - lastReportedSp) >= 0.00025 ||
          (smoothSp === targetSp && lastReportedSp !== smoothSp))
      ) {
        lastReportedSp = smoothSp;
        onFlightProgressRef.current(smoothSp);
      }
    };

    // Pre-warm offscreen Earth & Milky Way sprites while the intro loader runs so crossing into
    // Origins (0.255) & Bangalore (0.44) never pauses the main thread for offscreen canvas painting.
    const warmTimer = window.setTimeout(() => {
      warmSkySprites();
      warmEarthSprite();
    }, 220);

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      window.clearTimeout(warmTimer);
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [scrollProgressRef, scrollSpeedRef, programmaticJumpTargetRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[#050505]"
    />
  );
});
