/**
 * Midnight Felt Piano & Rain Engine (Web Audio API):
 * - Zero external audio files (0 KB download bloat, seamless infinite playback)
 * - Soft, muffled late-night felt piano chords (Am9 -> Fmaj7 -> Cmaj9 -> Em7 -> Dm9 -> Cadd9)
 * - Gentle warm rain atmosphere on Earth that softly fades into serene orbital stillness at high altitude
 * - Wide damped stereo reverb bus + tab-visibility ducking + clean Vite HMR disposal
 */
class CosmicAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private echoInput: GainNode | null = null;

  // Soft rain / atmospheric noise bed
  private noiseBuffer: AudioBuffer | null = null;
  private rainSource: AudioBufferSourceNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;

  // Gentle warm felt-pad floor (barely audible glue beneath the piano)
  private padOscA: OscillatorNode | null = null;
  private padOscB: OscillatorNode | null = null;
  private padFilter: BiquadFilterNode | null = null;
  private padGain: GainNode | null = null;

  // Sequencer state
  private chordTimer: ReturnType<typeof setInterval> | null = null;
  private pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
  private chordIndex = 0;
  private isRunning = false;
  private visibilityBound = false;

  public isMuted = true;
  public userExplicitlyMuted = false;

  // 6-chord late-night felt piano progression (warm, poetic, unhurried)
  private readonly CHORDS: {
    bass: number;
    notes: number[];
    echo?: number;
  }[] = [
    { bass: 110.0, notes: [220.0, 261.63, 329.63, 493.88], echo: 659.25 }, // Am9
    { bass: 87.31, notes: [174.61, 220.0, 261.63, 329.63] }, // Fmaj7
    { bass: 130.81, notes: [196.0, 246.94, 293.66, 329.63], echo: 587.33 }, // Cmaj9
    { bass: 82.41, notes: [164.81, 246.94, 293.66, 392.0] }, // Em7
    { bass: 146.83, notes: [174.61, 220.0, 261.63, 329.63], echo: 523.25 }, // Dm9
    { bass: 98.0, notes: [196.0, 246.94, 293.66, 392.0] }, // G6/sus
  ];

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this.createRainBuffer();
        this.buildReverbBus();
        this.bindVisibilityHandler();
      }
    }
  }

  /** Gently ducks audio when user switches tabs and swells back smoothly on return */
  private bindVisibilityHandler() {
    if (this.visibilityBound || typeof document === 'undefined') return;
    this.visibilityBound = true;
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx || !this.masterGain || this.isMuted) return;
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      if (document.hidden) {
        this.masterGain.gain.setTargetAtTime(0.0001, t, 0.35);
      } else {
        if (this.ctx.state === 'suspended') void this.ctx.resume();
        this.masterGain.gain.setTargetAtTime(1.0, t, 0.65);
      }
    });
  }

  /** Warm damped stereo space-reverb bus so each felt piano note blooms into silence */
  private buildReverbBus() {
    if (!this.ctx || !this.masterGain) return;

    const musicBus = this.ctx.createGain();
    musicBus.gain.setValueAtTime(0.92, this.ctx.currentTime);
    musicBus.connect(this.masterGain);
    this.musicBus = musicBus;

    const echoIn = this.ctx.createGain();
    echoIn.gain.setValueAtTime(0.5, this.ctx.currentTime);

    const delayL = this.ctx.createDelay(1.5);
    delayL.delayTime.setValueAtTime(0.41, this.ctx.currentTime);
    const delayR = this.ctx.createDelay(1.5);
    delayR.delayTime.setValueAtTime(0.62, this.ctx.currentTime);

    const echoFilter = this.ctx.createBiquadFilter();
    echoFilter.type = 'lowpass';
    echoFilter.frequency.setValueAtTime(1550, this.ctx.currentTime);

    const fbL = this.ctx.createGain();
    fbL.gain.setValueAtTime(0.42, this.ctx.currentTime);
    const fbR = this.ctx.createGain();
    fbR.gain.setValueAtTime(0.4, this.ctx.currentTime);

    const panL = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const panR = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (panL) panL.pan.setValueAtTime(-0.6, this.ctx.currentTime);
    if (panR) panR.pan.setValueAtTime(0.6, this.ctx.currentTime);

    echoIn.connect(echoFilter);
    echoFilter.connect(delayL);
    echoFilter.connect(delayR);

    delayL.connect(fbL);
    fbL.connect(delayR);
    delayR.connect(fbR);
    fbR.connect(delayL);

    if (panL && panR) {
      delayL.connect(panL);
      panL.connect(musicBus);
      delayR.connect(panR);
      panR.connect(musicBus);
    } else {
      delayL.connect(musicBus);
      delayR.connect(musicBus);
    }

    this.echoInput = echoIn;
  }

  /** Soft pink-noise stereo rain buffer */
  private createRainBuffer() {
    if (!this.ctx) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 3.5);
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.085;
        b6 = white * 0.115926;
      }
    }
    this.noiseBuffer = buffer;
  }

  public toggle(): boolean {
    this.init();
    if (!this.ctx || !this.masterGain) return false;

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    this.isMuted = !this.isMuted;
    this.userExplicitlyMuted = this.isMuted;
    const t = this.ctx.currentTime;

    if (!this.isMuted) {
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(0.001, t);
      this.masterGain.gain.linearRampToValueAtTime(1.0, t + 1.1);
      this.startSynthesizer();
    } else {
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(Math.max(this.masterGain.gain.value, 0.001), t);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, t + 0.5);
      const stopTimer = setTimeout(() => {
        if (this.isMuted) this.stopSynthesizer();
      }, 560);
      this.pendingTimeouts.push(stopTimer);
    }
    return !this.isMuted;
  }

  public unmute(): boolean {
    if (this.userExplicitlyMuted) return false;
    this.init();
    if (!this.ctx || !this.masterGain) return false;
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    this.isMuted = false;
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(Math.max(this.masterGain.gain.value, 0.001), t);
    this.masterGain.gain.linearRampToValueAtTime(1.0, t + 1.4);
    this.startSynthesizer();
    return true;
  }

  private clearPendingTimeouts() {
    for (const id of this.pendingTimeouts) {
      clearTimeout(id);
    }
    this.pendingTimeouts = [];
  }

  private stopSynthesizer() {
    this.clearPendingTimeouts();
    if (this.chordTimer) {
      clearInterval(this.chordTimer);
      this.chordTimer = null;
    }
    if (!this.isRunning) return;
    try {
      this.rainSource?.stop();
      this.rainSource?.disconnect();
      this.padOscA?.stop();
      this.padOscA?.disconnect();
      this.padOscB?.stop();
      this.padOscB?.disconnect();
    } catch {
      // Safe cleanup
    }
    this.rainSource = null;
    this.rainFilter = null;
    this.rainGain = null;
    this.padOscA = null;
    this.padOscB = null;
    this.padFilter = null;
    this.padGain = null;
    this.isRunning = false;
  }

  /** Synthesize one warm, muffled midnight felt-piano note */
  private triggerFeltPianoNote(
    freq: number,
    delaySec: number,
    velocity = 0.13,
    decaySec = 4.6,
    panValue = 0
  ) {
    if (!this.ctx || !this.musicBus || this.isMuted) return;
    const t = this.ctx.currentTime + delaySec;

    const bodyOsc = this.ctx.createOscillator();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(freq, t);

    const overtoneOsc = this.ctx.createOscillator();
    overtoneOsc.type = 'sine';
    overtoneOsc.frequency.setValueAtTime(freq * 2, t);

    const overtoneGain = this.ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.18, t);
    overtoneGain.gain.exponentialRampToValueAtTime(0.01, t + Math.min(decaySec * 0.45, 1.8));

    // Soft felt hammer low-pass filter sweep
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(freq * 3.2, 1050), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.15, 290), t + decaySec * 0.72);
    lp.Q.setValueAtTime(0.65, t);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(velocity, t + 0.036);
    env.gain.exponentialRampToValueAtTime(0.0006, t + decaySec);

    bodyOsc.connect(lp);
    overtoneOsc.connect(overtoneGain);
    overtoneGain.connect(lp);
    lp.connect(env);

    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(panValue, t);
      env.connect(panner);
      panner.connect(this.musicBus);
      if (this.echoInput) panner.connect(this.echoInput);
    } else {
      env.connect(this.musicBus);
      if (this.echoInput) env.connect(this.echoInput);
    }

    bodyOsc.start(t);
    overtoneOsc.start(t);
    bodyOsc.stop(t + decaySec + 0.15);
    overtoneOsc.stop(t + decaySec + 0.15);
  }

  private playCurrentBar() {
    if (!this.ctx || !this.isRunning || this.isMuted) return;
    const chord = this.CHORDS[this.chordIndex % this.CHORDS.length];
    this.chordIndex = (this.chordIndex + 1) % this.CHORDS.length;

    const t = this.ctx.currentTime;
    // Gently glide the barely-audible warm felt pad root with the chord
    if (this.padOscA && this.padOscB) {
      this.padOscA.frequency.setTargetAtTime(chord.bass, t, 1.1);
      this.padOscB.frequency.setTargetAtTime(chord.bass * 1.5, t, 1.1);
    }

    // Soft bass foundation note
    this.triggerFeltPianoNote(chord.bass, 0.0, 0.115, 5.1, -0.18);

    // Rolled poetic chord voicings with natural finger spacing
    chord.notes.forEach((freq, idx) => {
      const strumDelay = 0.12 + idx * 0.27;
      const pan = -0.25 + idx * 0.18;
      const vel = idx === 0 ? 0.13 : 0.095;
      this.triggerFeltPianoNote(freq, strumDelay, vel, 4.7, pan);
    });

    // Occasional delicate high-register single echo note (leaves space to breathe)
    if (chord.echo) {
      this.triggerFeltPianoNote(chord.echo, 2.35, 0.048, 3.8, 0.28);
    }
  }

  private startSynthesizer() {
    if (!this.ctx || !this.masterGain || !this.musicBus || this.isRunning) return;
    const t = this.ctx.currentTime;

    // 1. Soft stereo rain bed
    if (this.noiseBuffer) {
      const rainSrc = this.ctx.createBufferSource();
      rainSrc.buffer = this.noiseBuffer;
      rainSrc.loop = true;

      const rainFilter = this.ctx.createBiquadFilter();
      rainFilter.type = 'bandpass';
      rainFilter.frequency.setValueAtTime(1020, t);
      rainFilter.Q.setValueAtTime(0.55, t);

      const rainGain = this.ctx.createGain();
      rainGain.gain.setValueAtTime(0.001, t);
      rainGain.gain.linearRampToValueAtTime(0.115, t + 1.8);

      rainSrc.connect(rainFilter);
      rainFilter.connect(rainGain);
      rainGain.connect(this.masterGain);
      rainSrc.start(t);

      this.rainSource = rainSrc;
      this.rainFilter = rainFilter;
      this.rainGain = rainGain;
    }

    // 2. Whisper-quiet warm harmonic glue pad beneath the piano
    const padFilter = this.ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(280, t);

    const padGain = this.ctx.createGain();
    padGain.gain.setValueAtTime(0.001, t);
    padGain.gain.linearRampToValueAtTime(0.032, t + 2.4);

    const padOscA = this.ctx.createOscillator();
    padOscA.type = 'sine';
    padOscA.frequency.setValueAtTime(this.CHORDS[0].bass, t);

    const padOscB = this.ctx.createOscillator();
    padOscB.type = 'sine';
    padOscB.frequency.setValueAtTime(this.CHORDS[0].bass * 1.5, t);

    padOscA.connect(padFilter);
    padOscB.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(this.musicBus);

    padOscA.start(t);
    padOscB.start(t);

    this.padOscA = padOscA;
    this.padOscB = padOscB;
    this.padFilter = padFilter;
    this.padGain = padGain;

    this.isRunning = true;
    this.chordIndex = 0;

    // Begin first felt-piano bar right away, then breathe every 5.2 seconds
    this.playCurrentBar();
    this.chordTimer = setInterval(() => {
      if (!this.isMuted && !document.hidden) {
        this.playCurrentBar();
      }
    }, 5200);
  }

  /** Smoothly softens the rain as the user scrolls from Earth into serene high orbit */
  public updateFallIntensity(progress: number) {
    if (!this.ctx || !this.isRunning || this.isMuted) return;
    const t = this.ctx.currentTime;
    const p = Math.min(Math.max(progress, 0), 1);

    // Rain is cozy near Sriharikota ground/clouds and softly recedes in deep orbit
    const spaceFade = Math.min(Math.max((p - 0.12) / 0.55, 0), 1);
    if (this.rainGain && this.rainFilter) {
      const targetRainGain = lerpNum(0.115, 0.032, spaceFade);
      const targetRainFreq = lerpNum(1050, 620, spaceFade);
      this.rainGain.gain.setTargetAtTime(targetRainGain, t, 0.45);
      this.rainFilter.frequency.setTargetAtTime(targetRainFreq, t, 0.45);
    }

    // Subtle warm harmonic glow slightly blooms in orbit
    if (this.padGain && this.padFilter) {
      this.padGain.gain.setTargetAtTime(lerpNum(0.028, 0.044, p), t, 0.5);
      this.padFilter.frequency.setTargetAtTime(lerpNum(260, 360, p), t, 0.5);
    }
  }

  public update(flightProgress: number, _throttle: number, _altitude: number) {
    this.updateFallIntensity(flightProgress);
  }

  public playStagingSound() {
    if (this.isMuted) return;
    this.triggerFeltPianoNote(440.0, 0, 0.045, 2.2, 0.08);
  }

  public playClampRelease() {
    if (this.isMuted) return;
    this.triggerFeltPianoNote(329.63, 0, 0.04, 1.8, -0.08);
  }

  public playDelugeSound() {
    if (this.isMuted) return;
    this.triggerFeltPianoNote(261.63, 0, 0.04, 2.0, 0);
  }

  public playThrusterPulse() {
    if (this.isMuted) return;
    this.triggerFeltPianoNote(293.66, 0, 0.038, 1.6, 0);
  }

  public playTelemetryChirp(freq = 660, _duration = 0.08) {
    if (this.isMuted) return;
    // Map UI clicks softly onto a gentle Am pentatonic piano note
    const notes = [329.63, 392.0, 440.0, 493.88, 523.25];
    const idx = Math.abs(Math.round(freq)) % notes.length;
    this.triggerFeltPianoNote(notes[idx], 0, 0.032, 1.2, 0.05);
  }

  public stopImmediate() {
    this.isMuted = true;
    this.userExplicitlyMuted = true;
    this.stopSynthesizer();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
    this.masterGain = null;
    this.musicBus = null;
    this.echoInput = null;
  }

  public playQuindarTone(_isIntro = true) {
    // Silent so midnight felt piano & rain flow uninterrupted
  }

  public playRadioCallout(_calloutText: string) {
    // Silent so midnight felt piano & rain remain serene
  }
}

function lerpNum(x: number, y: number, t: number) {
  return (1 - t) * x + t * y;
}

export const cosmicAudio = new CosmicAudio();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cosmicAudio.stopImmediate();
  });
}
