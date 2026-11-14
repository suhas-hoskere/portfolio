export const blackHoleVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

export const blackHoleFragmentShader = `
  uniform float uTime;
  uniform float uAspect;
  uniform vec2 uMouse;
  uniform float uScroll; // 0.0 to 1.0 (infall progress)
  uniform float uWarp;   // 0.0 to 1.0 (blinding whiteout flash)

  varying vec2 vUv;

  #define PI 3.14159265359

  // Fast pseudo-random hash
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // Smooth 2D noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  // Multi-octave turbulence noise for swirling accretion plasma
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.55;
    mat2 rot = mat2(cos(0.55), sin(0.55), -sin(0.55), cos(0.55));
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = rot * p * 2.1 + vec2(uTime * 0.35, -uTime * 0.25);
      a *= 0.48;
    }
    return v;
  }

  // Background starfield with relativistic aberration
  vec3 getStarfield(vec3 rayDir, float stretch) {
    // Normalised celestial coordinates
    vec2 uv = vec2(atan(rayDir.z, rayDir.x) / (2.0 * PI) + 0.5, acos(clamp(rayDir.y, -1.0, 1.0)) / PI);
    
    // Slow drift + warp streak stretch on infall
    uv.y += rayDir.z * stretch * 0.08;
    uv.x += uTime * 0.003;

    vec2 starGrid = uv * 320.0;
    float n = hash(floor(starGrid));
    float star = 0.0;
    if (n > 0.980) {
      vec2 f = fract(starGrid) - 0.5;
      float d = length(f);
      float twinkle = sin(uTime * 4.0 + n * 40.0) * 0.35 + 0.65;
      star = smoothstep(0.18, 0.0, d) * (n - 0.980) * 85.0 * twinkle;
    }
    vec3 col = vec3(star);
    // Warm vs cool star temperatures
    col *= mix(vec3(0.75, 0.88, 1.0), vec3(1.0, 0.85, 0.55), hash(floor(starGrid) + 7.0));
    return col;
  }

  // Active rotating accretion disk calculation
  vec4 getAccretionDisk(vec3 pos, float r, float r_s) {
    float innerR = r_s * 1.35;
    float outerR = r_s * 5.2;

    if (r < innerR || r > outerR) {
      return vec4(0.0);
    }

    // Disk thickness profile (thin gaseous accretion disk at y=0)
    float heightProfile = exp(-abs(pos.y) * 22.0 / r_s);

    // Radial intensity bell curve
    float radialNorm = (r - innerR) / (outerR - innerR);
    float radialProfile = sin(radialNorm * PI);

    // Keplerian differential rotation: matter near the center spins much faster!
    float orbitalSpeed = 2.4 / (sqrt(r) + 0.1);
    float angle = atan(pos.z, pos.x) + uTime * orbitalSpeed;

    // Swirling turbulent plasma filaments
    vec2 plasmaCoords = vec2(r * 5.0 - uTime * 0.8, angle * 4.0);
    float plasmaTurbulence = fbm(plasmaCoords);

    // Relativistic Doppler Beaming:
    // Approaching side (left) is blue-shifted & blindingly brighter; receding side (right) is dimmer & redder
    float doppler = 1.0 + (pos.x / r) * 0.95;
    float intensity = heightProfile * radialProfile * (0.65 + 0.55 * plasmaTurbulence) * doppler;

    // Luminous temperature gradient:
    // Core white-hot (10,000K) -> electric gold -> deep orange plasma -> infrared dust
    vec3 col = vec3(0.0);
    if (radialNorm < 0.22) {
      col = mix(vec3(1.0, 0.98, 0.95), vec3(1.0, 0.84, 0.35), radialNorm / 0.22);
    } else if (radialNorm < 0.65) {
      col = mix(vec3(1.0, 0.84, 0.35), vec3(0.98, 0.44, 0.08), (radialNorm - 0.22) / 0.43);
    } else {
      col = mix(vec3(0.98, 0.44, 0.08), vec3(0.55, 0.08, 0.02), (radialNorm - 0.65) / 0.35);
    }

    col *= intensity * 4.2;
    return vec4(col, intensity);
  }

  void main() {
    // Perfectly centered UV coordinates independent of device pixel ratio
    vec2 uv = (vUv - 0.5) * vec2(uAspect, 1.0);

    // Dynamic mouse parallax tilt
    vec2 mouse = uMouse * 0.4;

    // Infall plunge on scroll (camera accelerates toward event horizon)
    float fall = clamp(uScroll * 2.4, 0.0, 1.0);
    float dive = pow(fall, 2.8);

    // Camera trajectory in curved spacetime
    vec3 camStart = vec3(mouse.x * 0.7, 0.95 + mouse.y * 0.4, 4.8);
    vec3 camEnd   = vec3(0.0, 0.02, 0.40);
    vec3 camPos   = mix(camStart, camEnd, dive);

    vec3 forward = normalize(vec3(0.0, 0.0, 0.0) - camPos);
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
    vec3 up = cross(forward, right);

    vec3 rayDir = normalize(uv.x * right + uv.y * up + 1.25 * forward);

    float r_s = 0.54; // Schwarzschild radius of Gargantua
    vec3 rayPos = camPos;
    vec3 accumulatedColor = vec3(0.0);
    float accumulatedAlpha = 0.0;

    const int STEPS = 75;
    float stepSize = 0.085;
    bool hitHorizon = false;

    // Raymarching through Einstein gravitational curvature
    for (int i = 0; i < STEPS; i++) {
      float r = length(rayPos);

      // Hit Event Horizon: total blackness
      if (r < r_s) {
        hitHorizon = true;
        break;
      }

      // Einstein gravitational deflection: light bends toward the central singularity
      vec3 gravForce = -rayPos * (1.75 * r_s / (r * r * r));
      rayDir = normalize(rayDir + gravForce * stepSize * 2.2);

      // Sample volumetric plasma in the accretion disk
      vec4 diskSample = getAccretionDisk(rayPos, r, r_s);
      if (diskSample.a > 0.001) {
        accumulatedColor += (1.0 - accumulatedAlpha) * diskSample.rgb;
        accumulatedAlpha += (1.0 - accumulatedAlpha) * diskSample.a * 0.65;
        if (accumulatedAlpha > 0.98) break;
      }

      rayPos += rayDir * stepSize;
    }

    vec3 finalColor = accumulatedColor;

    // Background starfield if ray escaped the black hole's gravity well
    if (!hitHorizon) {
      vec3 stars = getStarfield(rayDir, fall);
      finalColor += (1.0 - accumulatedAlpha) * stars;
    }

    // Photon Ring (the razor-sharp innermost circular orbit of light at r ~ 1.28 r_s)
    float minR = length(rayPos);
    if (minR > r_s && minR < r_s * 1.30) {
      float ringGlow = smoothstep(r_s * 1.30, r_s, minR);
      finalColor += vec3(1.0, 0.96, 0.85) * ringGlow * 1.2;
    }

    // Infall flash: accretion plasma expands and burns white-orange as camera dives in
    if (fall > 0.35) {
      float flashProgress = smoothstep(0.35, 0.92, fall);
      vec3 warpColor = mix(vec3(1.0, 0.65, 0.15), vec3(1.0, 0.98, 0.94), smoothstep(0.70, 1.0, fall));
      finalColor = mix(finalColor, warpColor * 3.2, flashProgress);
    }

    // Blinding white crossing the horizon into the Tesseract
    if (uWarp > 0.0) {
      finalColor = mix(finalColor, vec3(1.0, 1.0, 1.0), uWarp);
    }

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
