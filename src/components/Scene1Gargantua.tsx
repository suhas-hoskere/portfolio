import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Volume2, VolumeX } from 'lucide-react';

interface Scene1Props {
  scrollProgress: number; // 0.0 (rest) to 1.0 (crossing horizon)
  audioActive: boolean;
  onToggleAudio: () => void;
}

export const Scene1Gargantua: React.FC<Scene1Props> = ({
  scrollProgress,
  audioActive,
  onToggleAudio,
}) => {
  // Time dilation style transforms based on scroll
  const textOpacity = Math.max(0, 1 - scrollProgress * 1.8);
  const textScaleX = 1 + scrollProgress * 0.6;
  const textLetterSpacing = `${scrollProgress * 0.4}em`;

  return (
    <div className="relative min-h-[220vh] w-full">
      {/* Sticky Hero Viewport */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between p-8 sm:p-14 z-10 pointer-events-none select-none">
        
        {/* Top Header / Audio Toggle */}
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <span className="font-kannada text-amber-400 font-semibold text-sm tracking-wide">
              ಸುಹಾಸ್ ಹೊಸಕೆರೆ
            </span>
            <span className="text-cream-400/30">•</span>
            <span className="text-xs font-sans text-cream-200/80 tracking-wider">
              PES UNIVERSITY EC CAMPUS, BANGALORE
            </span>
          </div>

          <button
            onClick={onToggleAudio}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-cream-200/20 hover:border-amber-400 text-cream-200 hover:text-white font-sans text-xs backdrop-blur-md transition-all pointer-events-auto cursor-pointer"
            aria-label="Toggle gravitational rumble sound"
          >
            {audioActive ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-amber-300">Rumble: On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-cream-400" />
                <span className="text-cream-400">Rumble: Off</span>
              </>
            )}
          </button>
        </div>

        {/* Center: Hero Name that FITS ON ONE LINE across every screen size */}
        <div
          className="my-auto w-full max-w-7xl mx-auto text-left space-y-4 transition-all duration-75"
          style={{
            opacity: textOpacity,
            transform: `scaleX(${textScaleX})`,
            letterSpacing: textLetterSpacing,
          }}
        >
          <div className="overflow-hidden">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-[clamp(2.2rem,6.8vw,7.4rem)] font-serif font-bold text-cream-50 leading-none whitespace-nowrap tracking-tight drop-shadow-[0_10px_40px_rgba(0,0,0,0.9)]"
            >
              Suhas Hoskere
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-xl lg:text-2xl text-cream-200/90 font-sans font-light max-w-2xl leading-relaxed drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
          >
            I build intelligent systems and web architectures.
          </motion.p>
        </div>

        {/* Bottom Call To Action: "Scroll to fall in" */}
        <div
          className="flex flex-col items-center justify-center gap-2 transition-opacity duration-150"
          style={{ opacity: textOpacity }}
        >
          <span className="text-xs font-sans tracking-[0.25em] text-cream-300/80 uppercase">
            Scroll to fall in
          </span>
          <ChevronDown className="w-4 h-4 text-amber-400 animate-bounce" />
        </div>

      </div>
    </div>
  );
};
