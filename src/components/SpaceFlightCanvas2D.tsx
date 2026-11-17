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

    // Gentle damped pointer parallax
    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / Math.max(width, 1)) * 2 - 1;
      targetMouseY = (e.clientY / Math.max(height, 1)) * 2 - 1;
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    let rafId = 0;
    let lastDrawTime = performance.now();
    let elapsedSec = 0;
    let smoothSp = scrollProgressRef.current;
    let smoothSpeed = 0;

    const drawFrame = (now: number) => {
      rafId = requestAnimationFrame(drawFrame);

      // Pause rendering completely when tab is hidden (0% background CPU/RAM wakeups)
      if (document.hidden) {
        lastDrawTime = now;
        return;
      }

      const rawDt = (now - lastDrawTime) / 1000;
      const targetSp = scrollProgressRef.current;
      const isScrolling = Math.abs(targetSp - smoothSp) > 0.00025 || scrollSpeedRef.current > 0.03;
      const isHighAction =
        (targetSp >= 0.035 && targetSp < 0.365) ||
        (targetSp >= 0.470 && targetSp <= 0.515);

      // Adaptive Frame Pacing: silky 60fps when scrolling/igniting, ultra-light 30fps when idle
      const minIntervalSec = isScrolling || isHighAction ? 1 / 62 : 1 / 30;
      if (rawDt < minIntervalSec) return;

      lastDrawTime = now;
      const dt = Math.min(rawDt, 0.05);
      elapsedSec += dt;

      // Smooth inertial interpolation of scroll progress, speed & mouse parallax
      const spLerp = 1 - Math.exp(-14 * dt);
      smoothSp += (targetSp - smoothSp) * spLerp;
      smoothSpeed += (scrollSpeedRef.current - smoothSpeed) * (1 - Math.exp(-8 * dt));
      scrollSpeedRef.current *= Math.pow(0.08, dt);

      const mLerp = 1 - Math.exp(-6 * dt);
      mouseX += (targetMouseX - mouseX) * mLerp;
      mouseY += (targetMouseY - mouseY) * mLerp;

      const isMobile = width < 768;
      // Desktop: anchor rocket & spacecraft cleanly on the right (x = 72%), leaving left half clear for cards
      // Mobile: center cleanly in upper viewport above bottom story cards
      const vehicleAnchorX = isMobile ? width * 0.50 : width * 0.72;
      const groundY = isMobile ? height * 0.62 : height * 0.80;
      const unit = clamp(Math.min(height * 0.145, width * (isMobile ? 0.21 : 0.135)), 62, 132);

      // Subtle camera rumble during Ground Zero Ignition (0.035–0.240) & Max-Q (0.270–0.315)
      let shakeX = 0;
      let shakeY = 0;
      if (!reducedMotion) {
        if (smoothSp >= 0.035 && smoothSp < 0.240) {
          const ramp = clamp((smoothSp - 0.035) / 0.14, 0.2, 1.0);
          const amt = 2.4 * ramp;
          shakeX = (Math.sin(elapsedSec * 82) * 0.7 + Math.cos(elapsedSec * 128) * 0.3) * amt;
          shakeY = (Math.cos(elapsedSec * 94) * 0.7 + Math.sin(elapsedSec * 142) * 0.3) * amt;
        } else if (smoothSp >= 0.270 && smoothSp <= 0.315) {
          const qBell = Math.sin(((smoothSp - 0.270) / 0.045) * Math.PI);
          const amt = 3.0 * qBell;
          shakeX = (Math.sin(elapsedSec * 96) * 0.7 + Math.cos(elapsedSec * 148) * 0.3) * amt;
          shakeY = (Math.cos(elapsedSec * 108) * 0.7 + Math.sin(elapsedSec * 164) * 0.3) * amt;
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
      if (shakeX !== 0 || shakeY !== 0) {
        ctx.translate(shakeX, shakeY);
      }

      // Painter's order composition: Sky -> Deep Space -> Earth -> Clouds -> Pad Back -> Vehicle/Satellite -> Pad Front
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

    rafId = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [scrollProgressRef, scrollSpeedRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[#030611]"
    />
  );
});
