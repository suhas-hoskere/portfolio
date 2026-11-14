import React, { useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export const SoundToggle: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);

  const toggleSound = () => {
    if (!isPlaying) {
      // Start ambient cosmic synthesizer drone
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
        masterGain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 1.5);
        masterGain.connect(ctx.destination);
        gainNodeRef.current = masterGain;

        // Warm lowpass filter for deep space hum
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(220, ctx.currentTime);
        filter.connect(masterGain);

        // Oscillator 1: 110Hz (A2 fundamental)
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(110, ctx.currentTime);
        osc1.connect(filter);
        osc1.start();
        osc1Ref.current = osc1;

        // Oscillator 2: 165Hz (E3 gentle fifth) detuned
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(165.2, ctx.currentTime);
        osc2.connect(filter);
        osc2.start();
        osc2Ref.current = osc2;

        setIsPlaying(true);
      } catch {
        // Fallback
      }
    } else {
      // Stop ambient sound smoothly
      if (gainNodeRef.current && audioCtxRef.current) {
        gainNodeRef.current.gain.exponentialRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 0.5);
        setTimeout(() => {
          osc1Ref.current?.stop();
          osc2Ref.current?.stop();
          audioCtxRef.current?.close();
          setIsPlaying(false);
        }, 500);
      } else {
        setIsPlaying(false);
      }
    }
  };

  return (
    <button
      onClick={toggleSound}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full bg-space-900/90 hover:bg-space-850 border border-cream-200/20 hover:border-amber-400 text-cream-200 hover:text-white font-sans text-xs shadow-xl backdrop-blur-md transition-all"
      aria-label="Toggle ambient space audio"
    >
      {isPlaying ? (
        <>
          <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="text-amber-300 font-medium">Cosmic audio: On</span>
        </>
      ) : (
        <>
          <VolumeX className="w-3.5 h-3.5 text-cream-400" />
          <span className="text-cream-400">Cosmic audio: Off</span>
        </>
      )}
    </button>
  );
};
