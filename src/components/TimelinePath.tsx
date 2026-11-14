import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MapPin, GraduationCap, PenTool } from 'lucide-react';

export const TimelinePath: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Track scroll through the timeline section to animate the flight path drawing
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 75%", "end 60%"],
  });

  const pathLength = useTransform(scrollYProgress, [0, 0.85], [0, 1]);

  return (
    <section
      id="timeline"
      ref={containerRef}
      className="py-28 px-6 sm:px-12 relative z-10 border-t border-cream-200/10"
    >
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Section Label */}
        <div className="flex items-center gap-3 text-amber-400 font-sans text-sm tracking-wider uppercase font-medium">
          <span>04</span>
          <span className="w-8 h-[1px] bg-amber-400/40"></span>
          <span>Flight Path & Journey</span>
        </div>

        {/* Section Headline */}
        <div className="max-w-2xl">
          <h2 className="text-4xl sm:text-6xl font-serif text-cream-50 leading-tight">
            From Davanagere <br />
            <span className="font-editorial-italic text-amber-300">to Bangalore.</span>
          </h2>
          <p className="mt-4 text-cream-200/80 font-sans text-base sm:text-lg font-light leading-relaxed">
            A curved path traced through education, creative writing, and software craft.
          </p>
        </div>

        {/* Minimal Map Flight Path Visualization */}
        <div className="relative rounded-3xl p-8 sm:p-12 bg-space-900/60 border border-cream-200/10 overflow-hidden shadow-2xl">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* Davanagere Beacon */}
            <div className="flex items-start gap-4">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 shrink-0">
                <MapPin className="w-5 h-5" />
                <span className="absolute -inset-1 rounded-full bg-amber-400/20 animate-ping" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-sans text-amber-400 font-semibold tracking-wider uppercase">
                  Point of Origin
                </div>
                <h4 className="text-2xl font-serif text-cream-50 font-bold">
                  Davanagere
                </h4>
                <p className="text-sm text-cream-300/80 font-sans">
                  Siddaganga Pre-University College • Roots in mathematics and science.
                </p>
              </div>
            </div>

            {/* Bangalore Beacon */}
            <div className="flex items-start gap-4 md:justify-end">
              <div className="space-y-1 md:text-right">
                <div className="text-xs font-sans text-amber-400 font-semibold tracking-wider uppercase">
                  Current Station
                </div>
                <h4 className="text-2xl font-serif text-cream-50 font-bold">
                  Bangalore
                </h4>
                <p className="text-sm text-cream-300/80 font-sans">
                  PES University Electronic City Campus • B.Tech in AI & ML.
                </p>
              </div>
              <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 shrink-0">
                <MapPin className="w-5 h-5" />
                <span className="absolute -inset-1 rounded-full bg-cyan-400/20 animate-ping" />
              </div>
            </div>

          </div>

          {/* Self-drawing SVG Flight Trajectory */}
          <div className="py-8 relative">
            <svg
              className="w-full h-24 overflow-visible"
              viewBox="0 0 800 100"
              fill="none"
              preserveAspectRatio="none"
            >
              {/* Dim guideline path */}
              <path
                d="M 50,50 Q 400,-20 750,50"
                stroke="rgba(244, 242, 237, 0.12)"
                strokeWidth="2"
                strokeDasharray="6 6"
              />

              {/* Animated glowing path drawing with scroll */}
              <motion.path
                d="M 50,50 Q 400,-20 750,50"
                stroke="url(#flightGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                style={{ pathLength }}
              />

              <defs>
                <linearGradient id="flightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
            </svg>
          </div>

        </div>

        {/* Milestone Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          
          {/* PES University */}
          <div className="p-8 rounded-3xl bg-space-900/60 border border-cream-200/10 space-y-4 hover:border-amber-400/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-sans bg-amber-400/10 text-amber-300 border border-amber-400/30">
                Present
              </span>
            </div>
            <h3 className="text-2xl font-serif text-cream-50 font-bold">
              PES University, Electronic City Campus
            </h3>
            <div className="text-sm text-amber-400/90 font-sans font-medium">
              B.Tech in Artificial Intelligence & Machine Learning
            </div>
            <p className="text-sm text-cream-300/80 font-sans leading-relaxed font-light">
              Deep research into speech telemetry, Large Language Model integration, computer vision feature tracking, and modern full-stack web platforms.
            </p>
          </div>

          {/* Kannada Koota Club */}
          <div className="p-8 rounded-3xl bg-space-900/60 border border-cream-200/10 space-y-4 hover:border-amber-400/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <PenTool className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-sans bg-violet-400/10 text-violet-300 border border-violet-400/30 font-kannada">
                ಕನ್ನಡ ಕೂಟ
              </span>
            </div>
            <h3 className="text-2xl font-serif text-cream-50 font-bold">
              Kannada Koota Club
            </h3>
            <div className="text-sm text-violet-300 font-sans font-medium">
              Content Writer (Active)
            </div>
            <p className="text-sm text-cream-300/80 font-sans leading-relaxed font-light">
              Crafting written narratives, essays, and cultural publications that celebrate Kannada linguistic heritage and connect student creativity with community storytelling.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
