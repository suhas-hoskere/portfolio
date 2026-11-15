/**
 * Deep Cosmos Flight & Celestial Stage Configuration
 * Centralized tunable parameters for all 6 flight stages, lighting, camera paths,
 * planet rendering, starfield layers, and spacecraft materials.
 */

export interface StageConfig {
  // Global Viewport & Performance
  global: {
    dprMin: number;
    dprMax: number;
    toneMappingExposure: number;
    adaptiveQualityTargetMs: number;
    enableStarStreaksOnTransit: boolean;
    starLayers: {
      distantCount: number;
      midCount: number;
      nearDustCount: number;
      twinkleSpeed: number;
    };
  };

  // Stage 00: Launch Pad & Cinematic Liftoff Sequence
  stage00_launchPad: {
    sunPosition: [number, number, number];
    sunColor: string;
    sunIntensity: number;
    ambientColor: string;
    ambientIntensity: number;
    groundHazeDensity: number;
    groundHazeColor: string;
    cryoVentRate: number;
    cryoVentOpacity: number;
    heatShimmerIntensity: number;
    beaconStrobeHz: number;
    ignitionFlashIntensity: number;
    ignitionSmokeScale: number;
    padCameraShake: number;
    liftoffMilestones: {
      totalDuration: number;
      reducedMotionDuration: number;
      ignitionStart: number;
      ignitionEnd: number;
      buildupStart: number;
      buildupEnd: number;
      releaseStart: number;
      releaseEnd: number;
      climbStart: number;
      climbEnd: number;
    };
    cameraShakeCurve: {
      idle: number;
      ignition: number;
      buildupPeak: number;
      release: number;
      climb: number;
    };
    fireAndSmoke: {
      maxFlameParticles: number;
      maxSmokeParticles: number;
      maxSparks: number;
      lateralTrenchVelocity: number;
      smokeDissipationRate: number;
    };
    environment: {
      treeCount: number;
      groundMistOpacity: number;
      groundElevationScale: number;
      apronRadius: number;
    };
  };

  // Stage 01: Atmospheric Ascent (Max-Q, Booster Separation)
  stage01_ascent: {
    skyColorGround: string;
    skyColorMid: string;
    skyColorSpace: string;
    plumeCoreColor: string;
    plumeGlowColor: string;
    plumeLengthMax: number;
    plumeExpansionMax: number;
    maxQScrollRange: [number, number];
    maxQShakeIntensity: number;
    maxQVapourParticleCount: number;
    boosterSeparationScroll: number;
    boosterFlashDurationSec: number;
    stagingPauseSec: number;
    curvedHorizonFadeStart: number;
  };

  // Stage 02: Low Earth Orbit (420 km)
  stage02_orbit: {
    earthRadius: number;
    earthPosition: [number, number, number];
    axialTiltDeg: number; // 23.5 degrees
    indiaCenterLatLong: [number, number]; // [12.97, 77.59] Bangalore
    sunPosition: [number, number, number];
    sunIntensity: number;
    terminatorSoftness: number;
    twilightBandColor: string;
    nightCityLightsIntensity: number;
    oceanSpecularPower: number;
    cloudShellRadiusRatio: number; // 1.003
    cloudOpacity: number;
    cloudShadowIntensity: number;
    atmosphereFresnelPower: number; // 3.8
    atmosphereFresnelRadiusRatio: number; // 1.028
    atmosphereColor: string;
    orbitalSunriseProgress: number; // ~0.38
    orbitalSunriseFlareIntensity: number;
  };

  // Stage 03: Lunar Flyby (384,400 km)
  stage03_moon: {
    moonRadius: number;
    moonClosestZ: number;
    moonApproachRange: [number, number];
    sunPosition: [number, number, number]; // Grazing sunlight angle
    sunIntensity: number;
    grazingShadowDepth: number;
    craterDisplacementScale: number;
    highlandsAlbedo: number;
    mariaAlbedo: number;
    earthshineIntensity: number;
    backgroundEarthScale: number;
    backgroundEarthPosition: [number, number, number];
  };

  // Stage 04: Mars Encounter (225M km)
  stage04_mars: {
    marsRadius: number;
    marsClosestZ: number;
    marsApproachRange: [number, number];
    sunPosition: [number, number, number];
    sunIntensity: number; // Dimmer solar flux at 1.52 AU
    sunColor: string;
    polarCapColor: string;
    vallesMarinerisDepth: number;
    atmosphereHazeColor: string;
    atmosphereHazeThickness: number;
    dustStormOpacity: number;
    phobosEnabled: boolean;
    phobosScale: number;
  };

  // Stage 05: Deep Space Uplink
  stage05_uplink: {
    voidColor: string;
    milkyWayOpacity: number;
    distantSunPosition: [number, number, number];
    distantSunIntensity: number;
    distantEarthScale: number;
    dataBeamColor: string;
    dataPacketCount: number;
    dataPacketSpeed: number;
    signalRingsCount: number;
    signalExpansionRate: number;
  };

  // Spacecraft Avionics & Materials (Stages 02-05)
  spacecraft: {
    goldFoilRoughness: number;
    goldFoilMetalness: number;
    solarPanelReflectivity: number;
    ledStatusBlinkHz: number;
    thrusterPuffFrequencySec: number;
    rimLightIntensity: number;
  };
}

export const STAGE_CONFIG: StageConfig = {
  global: {
    dprMin: 1.0,
    dprMax: 1.75,
    toneMappingExposure: 1.15,
    adaptiveQualityTargetMs: 20.0,
    enableStarStreaksOnTransit: true,
    starLayers: {
      distantCount: 2200,
      midCount: 1400,
      nearDustCount: 280,
      twinkleSpeed: 1.8,
    },
  },

  stage00_launchPad: {
    sunPosition: [18, 6.5, 6],
    sunColor: '#fff0db',
    sunIntensity: 3.2,
    ambientColor: '#bae6fd',
    ambientIntensity: 0.55,
    groundHazeDensity: 0.016,
    groundHazeColor: '#253446',
    cryoVentRate: 1.2,
    cryoVentOpacity: 0.42,
    heatShimmerIntensity: 0.35,
    beaconStrobeHz: 3.8,
    ignitionFlashIntensity: 14.0,
    ignitionSmokeScale: 1.4,
    padCameraShake: 0.0035,
    liftoffMilestones: {
      totalDuration: 10.0,
      reducedMotionDuration: 3.0,
      ignitionStart: 0.0,
      ignitionEnd: 1.5,
      buildupStart: 1.5,
      buildupEnd: 4.5,
      releaseStart: 4.5,
      releaseEnd: 6.0,
      climbStart: 6.0,
      climbEnd: 10.0,
    },
    cameraShakeCurve: {
      idle: 0.0003,
      ignition: 0.0022,
      buildupPeak: 0.0068,
      release: 0.0082,
      climb: 0.0038,
    },
    fireAndSmoke: {
      maxFlameParticles: 320,
      maxSmokeParticles: 420,
      maxSparks: 60,
      lateralTrenchVelocity: 4.2,
      smokeDissipationRate: 0.28,
    },
    environment: {
      treeCount: 96,
      groundMistOpacity: 0.25,
      groundElevationScale: 0.15,
      apronRadius: 4.5,
    },
  },

  stage01_ascent: {
    skyColorGround: '#1e3852',
    skyColorMid: '#07162c',
    skyColorSpace: '#030712',
    plumeCoreColor: '#ffffff',
    plumeGlowColor: '#ff6a00',
    plumeLengthMax: 7.2,
    plumeExpansionMax: 3.4,
    maxQScrollRange: [0.27, 0.31],
    maxQShakeIntensity: 0.0055,
    maxQVapourParticleCount: 120,
    boosterSeparationScroll: 0.32,
    boosterFlashDurationSec: 0.28,
    stagingPauseSec: 0.15,
    curvedHorizonFadeStart: 0.25,
  },

  stage02_orbit: {
    earthRadius: 13.8,
    earthPosition: [0, -14.2, -4.5],
    axialTiltDeg: 23.44,
    indiaCenterLatLong: [12.97, 77.59],
    sunPosition: [22, 10, 6],
    sunIntensity: 3.4,
    terminatorSoftness: 0.22,
    twilightBandColor: '#ff621f',
    nightCityLightsIntensity: 2.2,
    oceanSpecularPower: 42.0,
    cloudShellRadiusRatio: 1.0035,
    cloudOpacity: 0.88,
    cloudShadowIntensity: 0.45,
    atmosphereFresnelPower: 3.8,
    atmosphereFresnelRadiusRatio: 1.032,
    atmosphereColor: '#1d88f5',
    orbitalSunriseProgress: 0.38,
    orbitalSunriseFlareIntensity: 3.8,
  },

  stage03_moon: {
    moonRadius: 1.85,
    moonClosestZ: -24.0,
    moonApproachRange: [0.45, 0.73],
    sunPosition: [-16, 2.8, -18], // Grazing side sun
    sunIntensity: 3.1,
    grazingShadowDepth: 0.94,
    craterDisplacementScale: 0.12,
    highlandsAlbedo: 0.88,
    mariaAlbedo: 0.32,
    earthshineIntensity: 0.045,
    backgroundEarthScale: 0.35,
    backgroundEarthPosition: [-8.5, -2.5, -65],
  },

  stage04_mars: {
    marsRadius: 2.1,
    marsClosestZ: -26.0,
    marsApproachRange: [0.70, 0.92],
    sunPosition: [14, 4.5, -12],
    sunIntensity: 2.3, // Solar flux at 1.5 AU is ~43% of Earth
    sunColor: '#fff5ea',
    polarCapColor: '#ffffff',
    vallesMarinerisDepth: 0.18,
    atmosphereHazeColor: '#d97d52',
    atmosphereHazeThickness: 1.018,
    dustStormOpacity: 0.18,
    phobosEnabled: true,
    phobosScale: 0.08,
  },

  stage05_uplink: {
    voidColor: '#03050c',
    milkyWayOpacity: 0.38,
    distantSunPosition: [-35, 12, -120],
    distantSunIntensity: 1.4,
    distantEarthScale: 0.12,
    dataBeamColor: '#06b6d4',
    dataPacketCount: 65,
    dataPacketSpeed: 2.4,
    signalRingsCount: 5,
    signalExpansionRate: 1.6,
  },

  spacecraft: {
    goldFoilRoughness: 0.28,
    goldFoilMetalness: 0.92,
    solarPanelReflectivity: 0.85,
    ledStatusBlinkHz: 1.2,
    thrusterPuffFrequencySec: 3.5,
    rimLightIntensity: 1.25,
  },
};
