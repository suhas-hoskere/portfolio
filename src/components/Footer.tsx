import React from 'react';
import { ArrowUp, Satellite } from 'lucide-react';
import { cosmicAudio } from '../utils/audio';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    cosmicAudio.playTelemetryChirp(1100);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative border-t border-cyan-950/70 bg-space-950/90 text-slate-400 font-mono text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-cyan-950">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Satellite className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-white font-bold tracking-wider text-sm">
                SUHAS HOSKERE
              </div>
              <div className="text-[11px] text-cyan-400/80">
                AI/ML Engineer & Systems Developer // PESU Bangalore
              </div>
            </div>
          </div>

          <div className="text-center md:text-right space-y-1">
            <div className="text-cyan-300 font-medium">
              GROUND TRACK: 12.8468° N, 77.6749° E
            </div>
            <div className="text-slate-500 text-[11px]">
              ORBITAL VELOCITY: 7.66 km/s (LEO Simulation)
            </div>
          </div>

        </div>

        {/* Bottom row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div className="flex flex-wrap items-center gap-3 text-slate-400">
            <span>© {new Date().getFullYear()} Suhas Hoskere. All systems operational.</span>
            <span className="hidden sm:inline text-slate-600">//</span>
            <span className="text-cyan-400/80 tracking-wide font-sans">
              ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ, ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ
            </span>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-space-900 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/10 transition-all group"
          >
            <span>RETURN TO APOGEE</span>
            <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

      </div>
    </footer>
  );
};
