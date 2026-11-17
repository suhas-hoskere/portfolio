class CosmicAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseGain: GainNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private subGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private isRunning: boolean = false;
  public isMuted: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this.createNoiseBuffer();
      }
    }
  }

  // Pre-generate 2.5 seconds of authentic pink/brown turbulence combustion noise
  private createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    this.noiseBuffer = buffer;
  }

  public toggle(): boolean {
    this.init();
    if (!this.ctx || !this.masterGain) return false;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isMuted = !this.isMuted;
    const t = this.ctx.currentTime;

    if (!this.isMuted) {
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(0.001, t);
      this.masterGain.gain.linearRampToValueAtTime(1.0, t + 0.3);
      this.startSynthesizer();
      this.playTelemetryChirp(960, 0.09);
    } else {
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, t + 0.3);
      setTimeout(() => this.stopSynthesizer(), 350);
    }
    return !this.isMuted;
  }

  public unmute(): boolean {
    this.init();
    if (!this.ctx || !this.masterGain) return false;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isMuted = false;
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(0.001, t);
    this.masterGain.gain.linearRampToValueAtTime(1.0, t + 0.3);
    this.startSynthesizer();
    this.playTelemetryChirp(960, 0.09);
    return true;
  }

  private stopSynthesizer() {
    if (!this.isRunning) return;
    try {
      this.subOsc?.stop();
      this.subOsc?.disconnect();
      this.noiseSource?.stop();
      this.noiseSource?.disconnect();
      this.droneOsc1?.stop();
      this.droneOsc1?.disconnect();
      this.droneOsc2?.stop();
      this.droneOsc2?.disconnect();
    } catch {
      // Safe cleanup
    }
    this.subOsc = null;
    this.noiseSource = null;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.isRunning = false;
  }

  private startSynthesizer() {
    if (!this.ctx || !this.masterGain || this.isRunning) return;
    this.isRunning = true;
    const t = this.ctx.currentTime;

    // 1. SUB-BASS ROCKET ENGINE RESONANCE (42Hz ISRO S200 Solid Rocket Motor fundamental)
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(42, t);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.04, t);
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(t);
    this.subOsc = subOsc;
    this.subGain = subGain;

    // 2. COMBUSTION TURBULENCE NOISE LOOP
    if (this.noiseBuffer) {
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = this.noiseBuffer;
      noiseSource.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(140, t);
      noiseFilter.Q.setValueAtTime(2.2, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.035, t);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noiseSource.start(t);

      this.noiseSource = noiseSource;
      this.noiseFilter = noiseFilter;
      this.noiseGain = noiseGain;
    }

    // 3. ETHEREAL DEEP SPACE HARMONIC DRONE (108Hz & 162Hz Perfect Fifth)
    const droneOsc1 = this.ctx.createOscillator();
    droneOsc1.type = 'sine';
    droneOsc1.frequency.setValueAtTime(108, t);

    const droneOsc2 = this.ctx.createOscillator();
    droneOsc2.type = 'sine';
    droneOsc2.frequency.setValueAtTime(162, t);

    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.001, t); // Starts silent at ground zero

    droneOsc1.connect(droneGain);
    droneOsc2.connect(droneGain);
    droneGain.connect(this.masterGain);

    droneOsc1.start(t);
    droneOsc2.start(t);
    this.droneOsc1 = droneOsc1;
    this.droneOsc2 = droneOsc2;
    this.droneGain = droneGain;
  }

  // Real-time aerodynamic flight acoustics tracking synchronized to granular scroll milestones
  public updateFallIntensity(flightProgress: number) {
    if (!this.ctx || !this.isRunning) return;
    const t = this.ctx.currentTime;

    // Phase 0: Standby at Launch Pad (0.0 to 0.035) - Silent engines, serene coastal wind
    if (flightProgress < 0.035) {
      this.subGain?.gain.setTargetAtTime(0.0001, t, 0.08);
      this.noiseFilter?.frequency.setTargetAtTime(90, t, 0.08);
      this.noiseGain?.gain.setTargetAtTime(0.002, t, 0.08);
      this.droneGain?.gain.setTargetAtTime(0.0001, t, 0.08);
    }
    // Phase 1: Ignition & Trench Water Deluge (0.035 to 0.170)
    else if (flightProgress < 0.170) {
      const ignitionRatio = (flightProgress - 0.035) / 0.135;
      const subVol = THREE_Math_lerp(0.015, 0.055, ignitionRatio);
      this.subOsc?.frequency.setTargetAtTime(42, t, 0.08);
      this.subGain?.gain.setTargetAtTime(subVol, t, 0.08);

      const filterFreq = THREE_Math_lerp(120, 240, ignitionRatio);
      const noiseVol = THREE_Math_lerp(0.015, 0.050, ignitionRatio);
      this.noiseFilter?.frequency.setTargetAtTime(filterFreq, t, 0.08);
      this.noiseGain?.gain.setTargetAtTime(noiseVol, t, 0.08);
      this.droneGain?.gain.setTargetAtTime(0.0001, t, 0.08);
    }
    // Phase 2: Atmospheric Ascent & Transonic Max-Q (0.170 to 0.360)
    else if (flightProgress < 0.360) {
      const ascentRatio = (flightProgress - 0.170) / 0.190;
      const subFreq = 42 + Math.sin(ascentRatio * Math.PI) * 14;
      this.subOsc?.frequency.setTargetAtTime(subFreq, t, 0.08);

      const subVol = THREE_Math_lerp(0.055, 0.075, Math.sin(ascentRatio * Math.PI));
      this.subGain?.gain.setTargetAtTime(subVol, t, 0.08);

      const filterFreq = THREE_Math_lerp(240, 320, Math.sin(ascentRatio * Math.PI));
      this.noiseFilter?.frequency.setTargetAtTime(filterFreq, t, 0.08);
      this.noiseGain?.gain.setTargetAtTime(0.052, t, 0.08);
      this.droneGain?.gain.setTargetAtTime(0.001, t, 0.1);
    }
    // Phase 3: Low Earth Orbit & Translunar Trajectory (0.360 to 0.740) - Vacuum silence & cosmic resonance
    else if (flightProgress < 0.740) {
      const spaceRatio = (flightProgress - 0.360) / 0.380;
      this.noiseGain?.gain.setTargetAtTime(0.001, t, 0.15);
      this.subGain?.gain.setTargetAtTime(0.005, t, 0.15);

      const droneVol = THREE_Math_lerp(0.008, 0.028, spaceRatio);
      this.droneGain?.gain.setTargetAtTime(droneVol, t, 0.15);
    }
    // Phase 4: Mars Encounter & Deep Space Terminal Uplink (0.740 to 1.0)
    else {
      this.noiseGain?.gain.setTargetAtTime(0.0005, t, 0.15);
      this.subGain?.gain.setTargetAtTime(0.003, t, 0.15);
      this.droneGain?.gain.setTargetAtTime(0.034, t, 0.15);
    }
  }

  // Countdown radar pulse (T-5, T-4, T-3, T-2, T-1, T-0)
  public playCountdownBeep(isTZero = false) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;

      if (isTZero) {
        // T-00.00: Blinding Ignition & Liftoff confirmation triad chord (F# major: 739.99Hz, 1108.73Hz, 1479.98Hz)
        [739.99, 1108.73, 1479.98].forEach((freq, idx) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);

          gain.gain.setValueAtTime(0.06, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45 + idx * 0.05);

          osc.connect(gain);
          gain.connect(this.masterGain!);

          osc.start(t);
          osc.stop(t + 0.55);
        });
      } else {
        // T-5 through T-1: Crisp 980Hz radar telemetry pips
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(980, t);

        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.075);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Staging event audio cue (S200 booster separation, Fairing jettison)
  public playStagingSound() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;

      // Deep mechanical pyrotechnic separation impulse
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.16);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.20);

      // High-pitched avionics confirmation blip
      this.playTelemetryChirp(1420, 0.06);
    } catch {
      // Fallback
    }
  }

  // Step 02: Pneumatic Umbilical Disconnect & Clamp Release Acoustic Cue
  public playClampRelease() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;

      // High-pressure pneumatic QD decoupling purge
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(58, t + 0.12);

      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.15);

      // Mechanical latch click
      this.playTelemetryChirp(1640, 0.035);
    } catch {
      // Fallback
    }
  }

  // Step 03: Acoustic Suppression High-Flow Water Deluge Flood & Steam Rush
  public playDelugeSound() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;

      if (this.noiseBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(380, t);
        filter.frequency.exponentialRampToValueAtTime(850, t + 0.4);
        filter.frequency.exponentialRampToValueAtTime(280, t + 1.1);
        filter.Q.setValueAtTime(1.8, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.055, t + 0.18);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        src.start(t);
        src.stop(t + 1.25);
      }
    } catch {
      // Fallback
    }
  }

  // Hypergolic Reaction Control (RCS) or TLI Thruster Acoustic Pulse
  public playThrusterPulse() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.18);

      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.20);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.22);

      this.playTelemetryChirp(1150, 0.04);
    } catch {
      // Fallback
    }
  }

  // Micro-interaction UI chirp for buttons, tabs, and modals
  public playTelemetryChirp(freq = 880, duration = 0.08) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.35, t + duration);

      gain.gain.setValueAtTime(0.03, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + duration);
    } catch {
      // Fallback
    }
  }

  // Authentic Aerospace Quindar Telemetry Tone (2524Hz Intro, 2475Hz Outro)
  public playQuindarTone(isIntro = true) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isIntro ? 2524 : 2475, t);

      gain.gain.setValueAtTime(0.035, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.05);
    } catch {
      // Fallback
    }
  }

  // Authentic Mission Control VHF Radio Callout with Quindar Beep
  private lastCalloutTime = 0;
  public playRadioCallout(calloutText: string) {
    if (this.isMuted) return;
    const now = Date.now();
    if (now - this.lastCalloutTime < 3200) return; // Prevent overlapping speech
    this.lastCalloutTime = now;

    this.playQuindarTone(true);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(calloutText);
        utter.rate = 1.08;
        utter.pitch = 0.92;
        utter.volume = 0.85;

        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(
          (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('David'))
        );
        if (voice) utter.voice = voice;

        utter.onend = () => {
          this.playQuindarTone(false);
        };

        window.speechSynthesis.speak(utter);
      } catch {
        // Fallback
      }
    }
  }
}

function THREE_Math_lerp(x: number, y: number, t: number) {
  return (1 - t) * x + t * y;
}

export const cosmicAudio = new CosmicAudio();
