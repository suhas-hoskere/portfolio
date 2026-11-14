import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { MagneticButton } from './CustomCursor';
import { EnteringBlackHole } from './EnteringBlackHole';
import { ArrowUpRight } from 'lucide-react';

const HERO_NAME = "Suhas Hoskere";

export const HeroCinematic: React.FC = () => {
  // Letter reveal stagger variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2,
      },
    },
  };

  const letterVariants: Variants = {
    hidden: { opacity: 0, y: 40, rotateX: 60 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center pt-28 pb-20 px-6 sm:px-12 overflow-hidden"
    >
      {/* Full-bleed Entering Black Hole Gravitational Tunnel */}
      <EnteringBlackHole />

      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10 pointer-events-none">
        
        {/* Left Column: Big Editorial Typography (Pointer events auto for links/buttons) */}
        <div className="lg:col-span-7 space-y-8 text-left pointer-events-auto">
          
          {/* Kannada Cultural Signature */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="flex items-center gap-3 text-cream-300/80 font-sans text-sm"
          >
            <span className="font-kannada text-amber-400 font-semibold text-base tracking-wide">
              ಸುಹಾಸ್ ಹೊಸಕೆರೆ
            </span>
            <span className="text-cream-400/40">•</span>
            <span className="tracking-wide">AI/ML & Full-Stack Developer</span>
          </motion.div>

          {/* Giant Staggered Hero Name */}
          <div className="overflow-hidden">
            <motion.h1
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-bold font-serif tracking-tight text-cream-50 leading-[0.95] drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
            >
              {HERO_NAME.split("").map((char, index) => (
                <motion.span
                  key={index}
                  variants={letterVariants}
                  className="inline-block"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </motion.h1>
          </div>

          {/* Confident Tagline and Story Intro */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.7 }}
            className="text-lg sm:text-xl text-cream-200/90 max-w-xl font-sans font-light leading-relaxed drop-shadow-[0_4px_15px_rgba(0,0,0,0.7)]"
          >
            I build intelligent systems and web architectures. Currently studying Artificial Intelligence and Machine Learning at <span className="text-cream-50 font-normal">PES University, Electronic City Campus, Bangalore</span>.
          </motion.p>

          {/* Magnetic CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.9 }}
            className="flex flex-wrap items-center gap-5 pt-4"
          >
            <MagneticButton>
              <a
                href="#projects"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-space-950 font-sans font-semibold text-sm tracking-wide shadow-[0_0_35px_rgba(249,115,22,0.5)] transition-all transform hover:scale-[1.03]"
              >
                <span>View projects</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </MagneticButton>

            <MagneticButton>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-space-950/60 hover:bg-space-900 border border-cream-200/25 hover:border-cream-100 text-cream-100 hover:text-white font-sans font-medium text-sm tracking-wide backdrop-blur-md transition-all shadow-lg"
              >
                <span>Send an email</span>
              </a>
            </MagneticButton>
          </motion.div>

        </div>

        {/* Right Column: Visual breathing space so the Singularity Vortex shines through */}
        <div className="lg:col-span-5 hidden lg:block" />

      </div>

      {/* Downward Inward Descent Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-cream-400/60 font-sans text-xs tracking-widest uppercase pointer-events-none">
        <span>DESCEND INTO EVENT HORIZON</span>
        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-amber-400 to-transparent animate-pulse" />
      </div>

    </section>
  );
};
