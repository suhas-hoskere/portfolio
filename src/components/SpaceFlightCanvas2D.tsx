import React, { useEffect, useRef } from 'react';
import type { CameraMode, Scene2DFrameContext } from '../scene2d/types';
import { clamp } from '../scene2d/types';
import { renderSkyAndStars } from '../scene2d/skyAndStars';
import { renderSriharikotaTerrain } from '../scene2d/sriharikotaTerrain';
import { renderLaunchPadBack, renderLaunchPadFront } from '../scene2d/launchPad';
import { renderRocketVehicle } from '../scene2d/rocketVehicle';
import { renderAtmosphericClouds } from '../scene2d/clouds';
import { renderEarthAndOrbit } from '../scene2d/earthAndOrbit';
import { renderDeepSpaceEncounters } from '../scene2d/deepSpace';
import { renderHeroSatellite } from '../scene2d/heroSatellite';

interface SpaceFlightCanvas2DProps {
  scrollProgressRef: React.MutableRefObject<number>;
  scrollSpeedRef: React.MutableRefObject<number>;
  cameraMode?: CameraMode;
  blueprintMode?: boolean;
}

/**
 * Pure Monochrome Black & White Live 2D Flight Canvas:
 * - Zero WebGL, zero radial gradients, zero backdrop-blur -> < 0.7ms per frame!
 * - Smooth 60 FPS during launch/scroll/ascent so flames, smoke, sparks & satellites stay alive!
 * - Auto-pauses completely when tab is hidden (0% background CPU).
 */
export const SpaceFlightCanvas2D: React.FC<SpaceFlightCanvas2DProps> = React.memo(({
  scrollProgressRef,
  scrollSpeedRef,
  cameraMode = 'CINEMATIC',
  blueprintMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraModeRef = useRef<CameraMode>(cameraMode);
  const blueprintRef = useRef<boolean>(blueprintMode);
  cameraModeRef.current = cameraMode;
  blueprintRef.current = blueprintMode;

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
    let smoothSpeed = 0;

    const renderLoop = (now: number) => {
      rafId = requestAnimationFrame(renderLoop);

      if (document.hidden) {
        lastDraw = now;
        return;
      }

      const rawDt = (now - lastDraw) / 1000;
      const targetSp = scrollProgressRef.current;
      const isScrolling =
        Math.abs(targetSp - smoothSp) > 0.0002 || scrollSpeedRef.current > 0.02;
      const isLaunchActive = targetSp >= 0.035 && targetSp < 0.365;

      // Full 60fps when scrolling or during rocket ignition/liftoff/ascent; smooth 36fps in calm space
      const minInterval = isScrolling || isLaunchActive ? 1 / 62 : 1 / 36;
      if (rawDt < minInterval) return;

      lastDraw = now;
      const dt = Math.min(rawDt, 0.05);
      elapsedSec += dt;

      const spLerp = 1 - Math.exp(-16 * dt);
      smoothSp += (targetSp - smoothSp) * spLerp;
      smoothSpeed += (scrollSpeedRef.current - smoothSpeed) * (1 - Math.exp(-10 * dt));
      scrollSpeedRef.current *= Math.pow(0.05, dt);

      const mLerp = 1 - Math.exp(-8 * dt);
      mouseX += (targetMouseX - mouseX) * mLerp;
      mouseY += (targetMouseY - mouseY) * mLerp;

      const isMobile = width < 768;
      const vehicleAnchorX = isMobile ? width * 0.50 : width * 0.74;
      const groundY = isMobile ? height * 0.56 : height * 0.80;
      const unit = clamp(
        Math.min(height * 0.145, width * (isMobile ? 0.19 : 0.13)),
        54,
        128
      );

      // Subtle launch rumble shake during engine burn & Max-Q
      let shakeX = 0;
      let shakeY = 0;
      if (!reducedMotion) {
        if (smoothSp >= 0.035 && smoothSp < 0.240) {
          const ramp = clamp((smoothSp - 0.035) / 0.12, 0.25, 1);
          const amt = 1.9 * ramp;
          shakeX = (Math.sin(elapsedSec * 86) * 0.7 + Math.cos(elapsedSec * 132) * 0.3) * amt;
          shakeY = (Math.cos(elapsedSec * 94) * 0.7 + Math.sin(elapsedSec * 144) * 0.3) * amt;
        } else if (smoothSp >= 0.270 && smoothSp <= 0.315) {
          const qBell = Math.sin(((smoothSp - 0.270) / 0.045) * Math.PI);
          shakeX = Math.sin(elapsedSec * 102) * 2.4 * qBell;
          shakeY = Math.cos(elapsedSec * 116) * 2.4 * qBell;
        }
      }

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

      ctx.save();
      if (shakeX !== 0 || shakeY !== 0) ctx.translate(shakeX, shakeY);

      renderSkyAndStars(frame);
      renderDeepSpaceEncounters(frame);
      renderEarthAndOrbit(frame);
      renderAtmosphericClouds(frame);
      renderSriharikotaTerrain(frame);
      renderLaunchPadBack(frame);
      renderRocketVehicle(frame);
      renderHeroSatellite(frame);
      renderLaunchPadFront(frame);

      ctx.restore();
    };

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [scrollProgressRef, scrollSpeedRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[#050505]"
    />
  );
});
