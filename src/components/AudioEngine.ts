/**
 * Continuous Satisfying Ambient Space Soundtrack + Subtle Flight Acoustics Engine (Web Audio API):
 * - Zero external audio file downloads (0 KB bundle bloat, infinite seamless playback!)
 * - Lush, warm evolving harmonic space pads (Cadd9 -> Am9 -> Fmaj7#11 -> G6sus4)
 * - Gentle, deeply satisfying felt-piano / celesta arpeggio notes drifting through warm stereo space echo
 * - Subtle low-end engine warmth during liftoff that blends cleanly under the music without overpowering it
 */
class CosmicAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private echoInput: GainNode | null = null;
  private noiseGain: GainNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private subGain: GainNode | null = null;
  private padOscs: OscillatorNode[] = [];
  private padFilter: BiquadFilterNode | null = null;
  private padGain: GainNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private isRunning = false;
  private chordIndex = 0;
  private arpStep = 0;
  public isMuted = true;
  public userExplicitlyMuted = false;

  // Lush, deeply calming space-cinema chord progression (Interstellar / Brian Eno inspired):
  // Cadd9 -> Am9 -> Fmaj7#11 -> G6sus4 (warm, peaceful, uplifting, infinitely loopable!)
  private readonly CHORDS: { pad: number[]; arp: number[] }[] = [
    {
      // Cadd9 (C3, G3, D4, E4)
      pad: [130.81, 196.0, 293.66, 329.63],
      arp: [261.63, 329.63, 392.0, 587.33, 523.25, 392.0, 659.25, 587.33],
    },
    {
      // Am9 (A2, E3, B3, C4)
      pad: [110.0, 164.81, 246.94, 261.63],
      arp: [220.0, 329.63, 392.0, 493.88, 523.25, 493.88, 659.25, 392.0],
    },
    {
      // Fmaj7#11 (F2, C3, E3, A3, B3)
      pad: [87.31, 130.81, 196.0, 220.0],
      arp: [174.61, 261.63, 329.63, 440.0, 493.88, 523.25, 440.0, 329.63],
    },
    {
      // G6sus4 (G2, D3, A3, B3)
      pad: [98.0, 146.83, 220.0, 246.94],
      arp: [196.0, 293.66, 392.0, 440.0, 493.88, 587.33, 493.88, 392.0],
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
        this.buildMusicEchoBus();
      }
    }
  }

  /** Warm stereo space-echo reverb bus so every ambient note blooms softly */
  private buildMusicEchoBus() {
    if (!this.ctx || !this.masterGain) return;

    const musicBus = this.ctx.createGain();
    musicBus.gain.setValueAtTime(0.85, this.ctx.currentTime);
    musicBus.connect(this.masterGain);
    this.musicBus = musicBus;

    const echoIn = this.ctx.createGain();
    echoIn.gain.setValueAtTime(0.45, this.ctx.currentTime);

    const delayL = this.ctx.createDelay(1.0);
    delayL.delayTime.setValueAtTime(0.42, this.ctx.currentTime);
    const delayR = this.ctx.createDelay(1.0);
    delayR.delayTime.setValueAtTime(0.63, this.ctx.currentTime);

    const echoFilter = this.ctx.createBiquadFilter();
    echoFilter.type = 'lowpass';
    echoFilter.frequency.setValueAtTime(1450, this.ctx.currentTime);

    const fbL = this.ctx.createGain();
    fbL.gain.setValueAtTime(0.38, this.ctx.currentTime);
    const fbR = this.ctx.createGain();
    fbR.gain.setValueAtTime(0.35, this.ctx.currentTime);

    const panL = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const panR = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (panL) panL.pan.setValueAtTime(-0.55, this.ctx.currentTime);
    if (panR) panR.pan.setValueAtTime(0.55, this.ctx.currentTime);

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
      this.masterGain.gain.linearRampToValueAtTime(1.0, t + 0.9);
      this.startSynthesizer();
    } else {
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(Math.max(this.masterGain.gain.value, 0.001), t);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, t + 0.45);
      setTimeout(() => {
        if (this.isMuted) this.stopSynthesizer();
      }, 500);
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
    this.masterGain.gain.linearRampToValueAtTime(1.0, t + 1.1);
    this.startSynthesizer();
    return true;
  }

  private stopSynthesizer() {
    if (!this.isRunning) return;
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    try {
      this.subOsc?.stop();
      this.subOsc?.disconnect();
      this.noiseSource?.stop();
      this.noiseSource?.disconnect();
      this.lfoOsc?.stop();
      this.lfoOsc?.disconnect();
      for (const osc of this.padOscs) {
        osc.stop();
        osc.disconnect();
      }
    } catch {
      // Safe cleanup
    }
    this.subOsc = null;
    this.noiseSource = null;
    this.lfoOsc = null;
    this.padOscs = [];
    this.isRunning = false;
  }

  /** Plays a single silky felt-piano / soft celestial bell note into the stereo echo bus */
  private triggerFeltPianoNote(freq: number, velocity = 0.065, duration = 3.2) {
    if (!this.ctx || !this.musicBus || !this.echoInput || this.isMuted) return;
    const t = this.ctx.currentTime;

    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, t);
    // Silky soft felt-hammer attack (no harsh click!) + long warm decay
    noteGain.gain.linearRampToValueAtTime(velocity, t + 0.032);
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.28, t + duration * 0.35);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(freq * 4.2, 2400), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.4, 480), t + duration * 0.8);

    // Warm fundamental sine + gentle octave triangle harmonic for rich acoustic felt-piano timbre
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, t);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, t);
    const harmGain = this.ctx.createGain();
    harmGain.gain.setValueAtTime(0.14, t);

    osc1.connect(lp);
    osc2.connect(harmGain);
    harmGain.connect(lp);
    lp.connect(noteGain);

    noteGain.connect(this.musicBus);
    noteGain.connect(this.echoInput);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + duration + 0.05);
    osc2.stop(t + duration + 0.05);
  }

  /** Smoothly glides the 4 lush space-pad oscillators to the next harmonic chord */
  private glidePadToChord(chordIdx: number) {
    if (!this.ctx || this.padOscs.length === 0) return;
    const t = this.ctx.currentTime;
    const freqs = this.CHORDS[chordIdx].pad;
    for (let i = 0; i < freqs.length; i++) {
      const f = freqs[i];
      // Paired slightly detuned voices (+/- 0.35Hz) for lush wide chorus warmth
      const oscA = this.padOscs[i * 2];
      const oscB = this.padOscs[i * 2 + 1];
      if (oscA) oscA.frequency.setTargetAtTime(f - 0.32, t, 1.35);
      if (oscB) oscB.frequency.setTargetAtTime(f + 0.32, t, 1.35);
    }
  }

  private startSynthesizer() {
    if (!this.ctx || !this.masterGain || !this.musicBus || this.isRunning) return;
    this.isRunning = true;
    const t = this.ctx.currentTime;

    // 1. WARM BREATHING SPACE HARMONIC PAD (8 silky detuned voices through breathing low-pass filter)
    const padFilter = this.ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(520, t);
    padFilter.Q.setValueAtTime(0.8, t);

    // Gentle 0.09Hz slow breathing LFO on the pad warmth filter
    const lfoOsc = this.ctx.createOscillator();
    lfoOsc.type = 'sine';
    lfoOsc.frequency.setValueAtTime(0.09, t);
    const lfoDepth = this.ctx.createGain();
    lfoDepth.gain.setValueAtTime(160, t);
    lfoOsc.connect(lfoDepth);
    lfoDepth.connect(padFilter.frequency);
    lfoOsc.start(t);
    this.lfoOsc = lfoOsc;

    const padGain = this.ctx.createGain();
    padGain.gain.setValueAtTime(0.001, t);
    padGain.gain.linearRampToValueAtTime(0.062, t + 2.2);

    padFilter.connect(padGain);
    padGain.connect(this.musicBus);
    if (this.echoInput) padGain.connect(this.echoInput);
    this.padFilter = padFilter;
    this.padGain = padGain;

    this.padOscs = [];
    const initialPad = this.CHORDS[this.chordIndex].pad;
    for (let i = 0; i < initialPad.length; i++) {
      const f = initialPad[i];
      for (const detuneHz of [-0.32, 0.32]) {
        const osc = this.ctx.createOscillator();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f + detuneHz, t);
        const voiceGain = this.ctx.createGain();
        voiceGain.gain.setValueAtTime(i === 0 ? 0.36 : 0.18, t);
        osc.connect(voiceGain);
        voiceGain.connect(padFilter);
        osc.start(t);
        this.padOscs.push(osc);
      }
    }

    // 2. CONTINUOUS SATISFYING AMBIENT FELT-PIANO ARPEGGIO SEQUENCER (smooth 920ms pulse!)
    const playNextBeat = () => {
      if (!this.isRunning || this.isMuted) return;
      if (typeof document !== 'undefined' && document.hidden) return;

      const chord = this.CHORDS[this.chordIndex];
      const noteIdx = this.arpStep % chord.arp.length;
      const freq = chord.arp[noteIdx];

      // Accent root & fifth gently; occasional sparkling upper-octave harmonic
      const vel = noteIdx === 0 ? 0.068 : noteIdx % 2 === 0 ? 0.052 : 0.038;
      this.triggerFeltPianoNote(freq, vel, 3.4);

      if (noteIdx === 4) {
        // Gentle high crystalline shimmer fifth every bar
        this.triggerFeltPianoNote(freq * 2, 0.018, 2.8);
      }

      this.arpStep += 1;
      if (this.arpStep >= chord.arp.length) {
        this.arpStep = 0;
        this.chordIndex = (this.chordIndex + 1) % this.CHORDS.length;
        this.glidePadToChord(this.chordIndex);
      }
    };

    // Play opening gentle note immediately, then flow seamlessly every 920ms
    playNextBeat();
    this.musicTimer = setInterval(playNextBeat, 920);

    // 3. SUBTLE SUB-BASS ENGINE WARMTH (only rises softly during liftoff/ascent, silent on standby/orbit)
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(44, t);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.0001, t);
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(t);
    this.subOsc = subOsc;
    this.subGain = subGain;

    // 4. SOFT FILTERED THRUST RUMBLE LAYER (subtle under the music during ignition & climb)
    if (this.noiseBuffer) {
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = this.noiseBuffer;
      noiseSource.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(110, t);
      noiseFilter.Q.setValueAtTime(1.4, t);

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

  // Smoothly blends subtle engine acoustics & space-pad brightness with flight altitude
  public updateFallIntensity(flightProgress: number) {
    if (!this.ctx || !this.isRunning) return;
    const t = this.ctx.currentTime;

    if (flightProgress < 0.032) {
      this.subGain?.gain.setTargetAtTime(0.0001, t, 0.12);
      this.noiseGain?.gain.setTargetAtTime(0.0001, t, 0.12);
      this.padFilter?.frequency.setTargetAtTime(520, t, 0.4);
      this.padGain?.gain.setTargetAtTime(0.062, t, 0.4);
    } else if (flightProgress < 0.140) {
      const r = (flightProgress - 0.032) / 0.108;
      this.subGain?.gain.setTargetAtTime(lerpNum(0.008, 0.026, r), t, 0.12);
      this.noiseFilter?.frequency.setTargetAtTime(lerpNum(110, 190, r), t, 0.12);
      this.noiseGain?.gain.setTargetAtTime(lerpNum(0.006, 0.022, r), t, 0.12);
      this.padFilter?.frequency.setTargetAtTime(lerpNum(520, 680, r), t, 0.4);
    } else if (flightProgress < 0.510) {
      const r = (flightProgress - 0.140) / 0.370;
      const bell = Math.sin(r * Math.PI);
      this.subGain?.gain.setTargetAtTime(lerpNum(0.014, 0.032, bell), t, 0.12);
      this.noiseFilter?.frequency.setTargetAtTime(lerpNum(140, 230, bell), t, 0.12);
      this.noiseGain?.gain.setTargetAtTime(lerpNum(0.008, 0.024, bell), t, 0.12);
      this.padFilter?.frequency.setTargetAtTime(lerpNum(680, 880, r), t, 0.5);
      this.padGain?.gain.setTargetAtTime(0.070, t, 0.4);
    } else {
      // Serene orbital vacuum: engines silent, lush glowing space soundtrack blooms!
      this.subGain?.gain.setTargetAtTime(0.0001, t, 0.25);
      this.noiseGain?.gain.setTargetAtTime(0.0001, t, 0.25);
      this.padFilter?.frequency.setTargetAtTime(920, t, 0.6);
      this.padGain?.gain.setTargetAtTime(0.075, t, 0.5);
    }
  }

  public playCountdownBeep(isTZero = false) {
    if (this.isMuted) return;
    this.triggerFeltPianoNote(isTZero ? 523.25 : 392.0, isTZero ? 0.06 : 0.03, 1.4);
  }

  public playStagingSound() {
    if (this.isMuted) return;
    // Soft harmonious chime on stage milestone (never harsh!)
    this.triggerFeltPianoNote(587.33, 0.045, 2.4);
  }

  public playClampRelease() {
    if (this.isMuted) return;
    this.triggerFeltPianoNote(440.0, 0.035, 1.8);
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
      filter.frequency.setValueAtTime(320, t);
      filter.frequency.exponentialRampToValueAtTime(520, t + 0.5);
      filter.Q.setValueAtTime(1.4, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.022, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      src.start(t);
      src.stop(t + 1.15);
    } catch {
      // Safe fallback
    }
  }

  public playThrusterPulse() {
    if (this.isMuted) return;
    this.triggerFeltPianoNote(329.63, 0.03, 1.5);
  }

  public playTelemetryChirp(freq = 880, _duration = 0.08) {
    if (this.isMuted) return;
    // Soft musical harmonic ping instead of harsh electronic beep
    this.triggerFeltPianoNote(Math.min(freq, 784), 0.028, 0.9);
  }

  public playQuindarTone(_isIntro = true) {
    // Keep silent so continuous music flows peacefully uninterrupted
  }

  public playRadioCallout(_calloutText: string) {
    // Keep robotic browser TTS silent so the continuous ambient music stays serene & satisfying
  }
}

function lerpNum(x: number, y: number, t: number) {
  return (1 - t) * x + t * y;
}

export const cosmicAudio = new CosmicAudio();
