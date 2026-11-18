/**
 * Deep Space Cinema Swells Engine (Interstellar-Inspired Pipe Organ & Orbital Drone — Web Audio API):
 * - Zero external audio files (0 KB download bloat, seamless infinite playback)
 * - Majestic slow-breathing pipe-organ harmonic swells (Am9 -> Fmaj7 -> Cadd9 -> Em7/G, 11.5s per chord)
 * - Zero repetitive melody or plucky arpeggio — pure warm cathedral organ, sub-pedal & ethereal space shimmer
 * - Altitude-reactive filter bloom & gentle sub-bass engine warmth during liftoff/ascent
 */
class CosmicAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private echoInput: GainNode | null = null;

  // Pipe-organ & drone nodes
  private organOscs: OscillatorNode[] = [];
  private pedalOsc: OscillatorNode | null = null;
  private shimmerOsc: OscillatorNode | null = null;
  private shimmerGain: GainNode | null = null;
  private organFilter: BiquadFilterNode | null = null;
  private organGain: GainNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private swellLfoOsc: OscillatorNode | null = null;
  private chordTimer: ReturnType<typeof setInterval> | null = null;

  // Subtle liftoff engine warmth layers
  private noiseBuffer: AudioBuffer | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private noiseGain: GainNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private subGain: GainNode | null = null;

  private isRunning = false;
  private chordIndex = 0;
  private visibilityBound = false;
  public isMuted = true;
  public userExplicitlyMuted = false;

  // Slow cinematic minor-key pipe-organ swells (Interstellar / Hans Zimmer inspired)
  // Am(add9) -> Fmaj7 -> C(add9) -> Em7/G
  private readonly CHORDS: { pedal: number; voices: number[]; shimmer: number }[] = [
    {
      pedal: 55.0, // A1
      voices: [110.0, 164.81, 246.94, 261.63, 329.63], // A2 E3 B3 C4 E4
      shimmer: 659.25, // E5
    },
    {
      pedal: 43.65, // F1
      voices: [87.31, 130.81, 174.61, 220.0, 329.63], // F2 C3 F3 A3 E4
      shimmer: 523.25, // C5
    },
    {
      pedal: 65.41, // C2
      voices: [130.81, 196.0, 261.63, 293.66, 329.63], // C3 G3 C4 D4 E4
      shimmer: 587.33, // D5
    },
    {
      pedal: 49.0, // G1
      voices: [98.0, 146.83, 196.0, 246.94, 329.63], // G2 D3 G3 B3 E4
      shimmer: 493.88, // B4
    },
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
        this.createNoiseBuffer();
        this.buildSpaceReverbBus();
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
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.masterGain.gain.setTargetAtTime(1.0, t, 0.65);
      }
    });
  }

  /** Wide damped cathedral/space stereo echo bus for weightless cinematic depth */
  private buildSpaceReverbBus() {
    if (!this.ctx || !this.masterGain) return;

    const musicBus = this.ctx.createGain();
    musicBus.gain.setValueAtTime(0.92, this.ctx.currentTime);
    musicBus.connect(this.masterGain);
    this.musicBus = musicBus;

    const echoIn = this.ctx.createGain();
    echoIn.gain.setValueAtTime(0.55, this.ctx.currentTime);

    const delayL = this.ctx.createDelay(1.5);
    delayL.delayTime.setValueAtTime(0.58, this.ctx.currentTime);
    const delayR = this.ctx.createDelay(1.5);
    delayR.delayTime.setValueAtTime(0.87, this.ctx.currentTime);

    const echoFilter = this.ctx.createBiquadFilter();
    echoFilter.type = 'lowpass';
    echoFilter.frequency.setValueAtTime(1120, this.ctx.currentTime);

    const fbL = this.ctx.createGain();
    fbL.gain.setValueAtTime(0.46, this.ctx.currentTime);
    const fbR = this.ctx.createGain();
    fbR.gain.setValueAtTime(0.44, this.ctx.currentTime);

    const panL = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const panR = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (panL) panL.pan.setValueAtTime(-0.65, this.ctx.currentTime);
    if (panR) panR.pan.setValueAtTime(0.65, this.ctx.currentTime);

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
    this.userExplicitlyMuted = this.isMuted;
    const t = this.ctx.currentTime;

    if (!this.isMuted) {
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(0.001, t);
      this.masterGain.gain.linearRampToValueAtTime(1.0, t + 1.4);
      this.startSynthesizer();
    } else {
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(Math.max(this.masterGain.gain.value, 0.001), t);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, t + 0.55);
      setTimeout(() => {
        if (this.isMuted) this.stopSynthesizer();
      }, 620);
    }
    return !this.isMuted;
  }

  public unmute(): boolean {
    if (this.userExplicitlyMuted) return false;
    this.init();
    if (!this.ctx || !this.masterGain) return false;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isMuted = false;
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(Math.max(this.masterGain.gain.value, 0.001), t);
    this.masterGain.gain.linearRampToValueAtTime(1.0, t + 1.8);
    this.startSynthesizer();
    return true;
  }

  private stopSynthesizer() {
    if (!this.isRunning) return;
    if (this.chordTimer) {
      clearInterval(this.chordTimer);
      this.chordTimer = null;
    }
    try {
      this.pedalOsc?.stop();
      this.pedalOsc?.disconnect();
      this.shimmerOsc?.stop();
      this.shimmerOsc?.disconnect();
      this.subOsc?.stop();
      this.subOsc?.disconnect();
      this.noiseSource?.stop();
      this.noiseSource?.disconnect();
      this.lfoOsc?.stop();
      this.lfoOsc?.disconnect();
      this.swellLfoOsc?.stop();
      this.swellLfoOsc?.disconnect();
      for (const osc of this.organOscs) {
        osc.stop();
        osc.disconnect();
      }
    } catch {
      // Safe cleanup
    }
    this.pedalOsc = null;
    this.shimmerOsc = null;
    this.shimmerGain = null;
    this.subOsc = null;
    this.noiseSource = null;
    this.lfoOsc = null;
    this.swellLfoOsc = null;
    this.organOscs = [];
    this.isRunning = false;
  }

  /** Smoothly glides the pipe-organ & pedal harmonics into the next cinema chord over ~2.6s */
  private glideOrganToChord(chordIdx: number) {
    if (!this.ctx || this.organOscs.length === 0) return;
    const t = this.ctx.currentTime;
    const chord = this.CHORDS[chordIdx];

    if (this.pedalOsc) {
      this.pedalOsc.frequency.setTargetAtTime(chord.pedal, t, 1.8);
    }
    if (this.shimmerOsc) {
      this.shimmerOsc.frequency.setTargetAtTime(chord.shimmer, t, 2.2);
    }

    for (let i = 0; i < chord.voices.length; i++) {
      const f = chord.voices[i];
      const oscA = this.organOscs[i * 2];
      const oscB = this.organOscs[i * 2 + 1];
      if (oscA) oscA.frequency.setTargetAtTime(f - 0.28, t, 1.9);
      if (oscB) oscB.frequency.setTargetAtTime(f + 0.28, t, 1.9);
    }
  }

  /** Whisper-soft warm organ harmonic chime for subtle UI interactions (never harsh or plucky) */
  private triggerSoftSwellChime(freq: number, velocity = 0.024, duration = 1.6) {
    if (!this.ctx || !this.musicBus || !this.echoInput || this.isMuted) return;
    const t = this.ctx.currentTime;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(velocity, t + 0.09);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(freq * 2.2, 1300), t);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    osc.connect(lp);
    lp.connect(gain);
    gain.connect(this.musicBus);
    gain.connect(this.echoInput);

    osc.start(t);
    osc.stop(t + duration + 0.08);
  }

  private startSynthesizer() {
    if (!this.ctx || !this.masterGain || !this.musicBus || this.isRunning) return;
    this.isRunning = true;
    const t = this.ctx.currentTime;
    const initial = this.CHORDS[this.chordIndex];

    // 1. WARM BREATHING SPACE PIPE-ORGAN FILTER & AMPLITUDE SWELL
    const organFilter = this.ctx.createBiquadFilter();
    organFilter.type = 'lowpass';
    organFilter.frequency.setValueAtTime(420, t);
    organFilter.Q.setValueAtTime(0.7, t);

    // Ultra-slow 18-second filter breath LFO (0.055 Hz)
    const lfoOsc = this.ctx.createOscillator();
    lfoOsc.type = 'sine';
    lfoOsc.frequency.setValueAtTime(0.055, t);
    const lfoDepth = this.ctx.createGain();
    lfoDepth.gain.setValueAtTime(165, t);
    lfoOsc.connect(lfoDepth);
    lfoDepth.connect(organFilter.frequency);
    lfoOsc.start(t);
    this.lfoOsc = lfoOsc;

    const organGain = this.ctx.createGain();
    organGain.gain.setValueAtTime(0.001, t);
    organGain.gain.linearRampToValueAtTime(0.082, t + 2.8);

    // Gentle secondary breathing swell on amplitude (13-second ocean-like swell)
    const swellLfoOsc = this.ctx.createOscillator();
    swellLfoOsc.type = 'sine';
    swellLfoOsc.frequency.setValueAtTime(0.075, t);
    const swellDepth = this.ctx.createGain();
    swellDepth.gain.setValueAtTime(0.018, t);
    swellLfoOsc.connect(swellDepth);
    swellDepth.connect(organGain.gain);
    swellLfoOsc.start(t);
    this.swellLfoOsc = swellLfoOsc;

    organFilter.connect(organGain);
    organGain.connect(this.musicBus);
    if (this.echoInput) organGain.connect(this.echoInput);
    this.organFilter = organFilter;
    this.organGain = organGain;

    // 2. DEEP 16' CATHEDRAL PEDAL DRONE (warm felt sub-harmonic foundation)
    const pedalOsc = this.ctx.createOscillator();
    pedalOsc.type = 'sine';
    pedalOsc.frequency.setValueAtTime(initial.pedal, t);
    const pedalGain = this.ctx.createGain();
    pedalGain.gain.setValueAtTime(0.052, t);
    pedalOsc.connect(pedalGain);
    pedalGain.connect(this.musicBus);
    pedalOsc.start(t);
    this.pedalOsc = pedalOsc;

    // 3. 10 DETUNED PIPE-ORGAN VOICES (warm sawtooth + triangle pairs for Interstellar reed-pipe texture)
    this.organOscs = [];
    for (let i = 0; i < initial.voices.length; i++) {
      const f = initial.voices[i];
      const weight = i === 0 ? 0.24 : i === 1 ? 0.18 : 0.12;
      for (let dIdx = 0; dIdx < 2; dIdx++) {
        const detuneHz = dIdx === 0 ? -0.28 : 0.28;
        const osc = this.ctx.createOscillator();
        // Mix mellow triangle & filtered sawtooth for rich analog organ pipes
        osc.type = dIdx === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(f + detuneHz, t);

        const voiceGain = this.ctx.createGain();
        voiceGain.gain.setValueAtTime(dIdx === 0 ? weight * 0.55 : weight, t);

        osc.connect(voiceGain);
        voiceGain.connect(organFilter);
        osc.start(t);
        this.organOscs.push(osc);
      }
    }

    // 4. WEIGHTLESS ORBITAL SHIMMER HARMONIC (floats gently through stereo space reverb)
    const shimmerOsc = this.ctx.createOscillator();
    shimmerOsc.type = 'sine';
    shimmerOsc.frequency.setValueAtTime(initial.shimmer, t);
    const shimmerGain = this.ctx.createGain();
    shimmerGain.gain.setValueAtTime(0.0001, t);
    shimmerGain.gain.linearRampToValueAtTime(0.011, t + 4.0);
    shimmerOsc.connect(shimmerGain);
    if (this.echoInput) shimmerGain.connect(this.echoInput);
    shimmerGain.connect(this.musicBus);
    shimmerOsc.start(t);
    this.shimmerOsc = shimmerOsc;
    this.shimmerGain = shimmerGain;

    // 5. SLOW MAJESTIC CHORD EVOLUTION (every 11.5s — zero repetitive melody!)
    this.chordTimer = setInterval(() => {
      if (!this.isRunning || this.isMuted) return;
      if (typeof document !== 'undefined' && document.hidden) return;
      this.chordIndex = (this.chordIndex + 1) % this.CHORDS.length;
      this.glideOrganToChord(this.chordIndex);
    }, 11500);

    // 6. SUBTLE SUB-BASS ENGINE WARMTH (only rises softly during liftoff/ascent, silent in orbit)
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(42, t);
    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.0001, t);
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(t);
    this.subOsc = subOsc;
    this.subGain = subGain;

    // 7. SOFT FILTERED ATMOSPHERIC THRUST RUMBLE
    if (this.noiseBuffer) {
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = this.noiseBuffer;
      noiseSource.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(100, t);
      noiseFilter.Q.setValueAtTime(1.2, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, t);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noiseSource.start(t);

      this.noiseSource = noiseSource;
      this.noiseFilter = noiseFilter;
      this.noiseGain = noiseGain;
    }
  }

  // Smoothly blooms the space pipe-organ warmth & orbital shimmer as the rocket climbs into orbit
  public updateFallIntensity(flightProgress: number) {
    if (!this.ctx || !this.isRunning) return;
    const t = this.ctx.currentTime;

    if (flightProgress < 0.032) {
      this.subGain?.gain.setTargetAtTime(0.0001, t, 0.15);
      this.noiseGain?.gain.setTargetAtTime(0.0001, t, 0.15);
      this.organFilter?.frequency.setTargetAtTime(380, t, 0.6);
      this.organGain?.gain.setTargetAtTime(0.075, t, 0.6);
      this.shimmerGain?.gain.setTargetAtTime(0.008, t, 0.8);
    } else if (flightProgress < 0.140) {
      const r = (flightProgress - 0.032) / 0.108;
      this.subGain?.gain.setTargetAtTime(lerpNum(0.008, 0.026, r), t, 0.15);
      this.noiseFilter?.frequency.setTargetAtTime(lerpNum(100, 175, r), t, 0.15);
      this.noiseGain?.gain.setTargetAtTime(lerpNum(0.005, 0.018, r), t, 0.15);
      this.organFilter?.frequency.setTargetAtTime(lerpNum(380, 560, r), t, 0.5);
      this.organGain?.gain.setTargetAtTime(lerpNum(0.075, 0.095, r), t, 0.5);
    } else if (flightProgress < 0.510) {
      const r = (flightProgress - 0.140) / 0.370;
      const bell = Math.sin(r * Math.PI);
      this.subGain?.gain.setTargetAtTime(lerpNum(0.012, 0.030, bell), t, 0.15);
      this.noiseFilter?.frequency.setTargetAtTime(lerpNum(125, 210, bell), t, 0.15);
      this.noiseGain?.gain.setTargetAtTime(lerpNum(0.006, 0.020, bell), t, 0.15);
      this.organFilter?.frequency.setTargetAtTime(lerpNum(560, 780, r), t, 0.6);
      this.organGain?.gain.setTargetAtTime(0.098, t, 0.5);
      this.shimmerGain?.gain.setTargetAtTime(lerpNum(0.010, 0.018, r), t, 0.8);
    } else {
      // Serene orbital vacuum: engines silent, deep Interstellar organ & orbital shimmer bloom wide
      this.subGain?.gain.setTargetAtTime(0.0001, t, 0.35);
      this.noiseGain?.gain.setTargetAtTime(0.0001, t, 0.35);
      this.organFilter?.frequency.setTargetAtTime(840, t, 0.8);
      this.organGain?.gain.setTargetAtTime(0.092, t, 0.6);
      this.shimmerGain?.gain.setTargetAtTime(0.020, t, 0.9);
    }
  }

  public playCountdownBeep(isTZero = false) {
    if (this.isMuted) return;
    this.triggerSoftSwellChime(isTZero ? 440.0 : 329.63, 0.024, 1.4);
  }

  public playStagingSound() {
    if (this.isMuted) return;
    this.triggerSoftSwellChime(440.0, 0.022, 1.9);
  }

  public playClampRelease() {
    if (this.isMuted) return;
    this.triggerSoftSwellChime(329.63, 0.020, 1.5);
  }

  public playDelugeSound() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;
      const t = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(260, t);
      filter.frequency.exponentialRampToValueAtTime(440, t + 0.55);
      filter.Q.setValueAtTime(1.2, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.018, t + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      src.start(t);
      src.stop(t + 1.25);
    } catch {
      // Safe fallback
    }
  }

  public playThrusterPulse() {
    if (this.isMuted) return;
    this.triggerSoftSwellChime(293.66, 0.018, 1.4);
  }

  public playTelemetryChirp(freq = 660, _duration = 0.08) {
    if (this.isMuted) return;
    // Map clicks softly into a gentle organ harmonic range (330..587 Hz)
    const mellowFreq = 330 + ((Math.max(freq, 440) - 440) % 260);
    this.triggerSoftSwellChime(mellowFreq, 0.016, 0.9);
  }

  public playQuindarTone(_isIntro = true) {
    // Silent so deep space swells flow uninterrupted
  }

  public playRadioCallout(_calloutText: string) {
    // Silent so cinema organ swells remain serene
  }
}

function lerpNum(x: number, y: number, t: number) {
  return (1 - t) * x + t * y;
}

export const cosmicAudio = new CosmicAudio();
