import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Copy, Check, Radio } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from './Icons';
import { MagneticButton } from './CustomCursor';

export const ContactCosmic: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const emailAddress = "suhas.hoskere@example.com";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section id="contact" className="py-32 px-6 sm:px-12 relative z-10 border-t border-cream-200/10 overflow-hidden">
      
      {/* Pulsing Signal Ripple Center Animation */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
        <div className="relative flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border border-amber-400/20 animate-ping" style={{ animationDuration: '4s' }} />
          <div className="absolute w-96 h-96 rounded-full border border-violet-400/15 animate-ping" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          <div className="absolute w-[560px] h-[560px] rounded-full border border-cyan-400/10 animate-ping" style={{ animationDuration: '8s', animationDelay: '2s' }} />
        </div>
      </div>

      {/* Drifting Tiny Astronaut */}
      <motion.div
        animate={{
          y: [-12, 12, -12],
          rotate: [-3, 3, -3],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-16 right-8 sm:right-24 pointer-events-none opacity-80"
      >
        <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-cream-200/20 shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=200&q=80"
            alt="Drifting astronaut"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-space-950/60 to-transparent" />
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto text-center space-y-12 relative z-10">
        
        {/* Section Label */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-space-900 border border-amber-400/30 text-amber-300 font-sans text-xs tracking-wide">
          <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>OPEN FREQUENCY</span>
        </div>

        {/* Giant Editorial Headline */}
        <h2 className="text-5xl sm:text-7xl lg:text-8xl font-serif text-cream-50 tracking-tight leading-[0.95]">
          Let’s make <br />
          <span className="font-editorial-italic text-amber-300">contact.</span>
        </h2>

        <p className="text-lg sm:text-xl text-cream-200/90 font-sans max-w-xl mx-auto font-light leading-relaxed">
          I am always interested in discussing new AI research, speech pipelines, open-source projects, and engineering opportunities.
        </p>

        {/* Big Action Link Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-5 pt-4">
          
          {/* Email Button with Copy Option */}
          <MagneticButton>
            <a
              href={`mailto:${emailAddress}`}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-space-950 font-sans font-semibold text-sm tracking-wide shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-all transform hover:scale-[1.03]"
            >
              <Mail className="w-4 h-4" />
              <span>Send an email</span>
            </a>
          </MagneticButton>

          {/* GitHub Button */}
          <MagneticButton>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-space-900/90 hover:bg-space-850 border border-cream-200/20 hover:border-cream-100 text-cream-100 hover:text-white font-sans font-medium text-sm tracking-wide transition-all"
            >
              <GithubIcon className="w-4 h-4" />
              <span>Visit GitHub profile</span>
            </a>
          </MagneticButton>

          {/* LinkedIn Button */}
          <MagneticButton>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-space-900/90 hover:bg-space-850 border border-cream-200/20 hover:border-cream-100 text-cream-100 hover:text-white font-sans font-medium text-sm tracking-wide transition-all"
            >
              <LinkedinIcon className="w-4 h-4" />
              <span>Connect on LinkedIn</span>
            </a>
          </MagneticButton>

        </div>

        {/* Quick Email Copy Chip */}
        <div className="pt-6">
          <button
            onClick={handleCopyEmail}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-space-900/80 border border-cream-200/15 hover:border-amber-400/50 text-cream-300 font-sans text-xs transition-all"
          >
            <span>{emailAddress}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-cream-400" />
            )}
            <span className="text-cream-400/80 font-normal">
              {copied ? 'Copied to clipboard' : 'Click to copy'}
            </span>
          </button>
        </div>

      </div>
    </section>
  );
};
