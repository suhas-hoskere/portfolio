import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun } from 'lucide-react';

interface Skill {
  name: string;
  category: string;
  description: string;
}

const RING_1_SKILLS: Skill[] = [
  { name: 'Python', category: 'Core Language', description: 'Primary language for AI pipelines, systems programming, and high-performance algorithms.' },
  { name: 'LLM integration', category: 'Reasoning', description: 'Contextual prompt engineering, embedding pipelines, and autonomous agent systems.' },
  { name: 'Whisper', category: 'Neural Speech', description: 'OpenAI Whisper integration for robust, high-accuracy multilingual speech transcription.' },
];

const RING_2_SKILLS: Skill[] = [
  { name: 'Computer Vision', category: 'Perception', description: 'Spatial feature detection, frame-by-frame video classification, and boundary tracking.' },
  { name: 'Scikit-learn', category: 'Machine Learning', description: 'Regression, clustering, classification pipelines, and statistical modeling.' },
  { name: 'Vosk', category: 'Offline Speech', description: 'Ultra-low latency offline speech recognition engine for instant local processing.' },
  { name: 'Moonshine', category: 'Edge STT', description: 'Lightweight on-device speech-to-text models optimized for resource-constrained edge hardware.' },
];

const RING_3_SKILLS: Skill[] = [
  { name: 'Next.js', category: 'Full-Stack Web', description: 'Modern React framework with App Router, server actions, and optimized rendering.' },
  { name: 'React', category: 'Frontend', description: 'Declarative component architecture, custom hooks, and reactive user interfaces.' },
  { name: 'PyQt6', category: 'Desktop Apps', description: 'Multi-threaded native desktop client applications with custom GUI workflows.' },
];

export const SkillsOrbit: React.FC = () => {
  const [hoveredSkill, setHoveredSkill] = useState<Skill | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  return (
    <section id="skills" className="py-28 px-6 sm:px-12 relative z-10 border-t border-cream-200/10 overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Section Label */}
        <div className="flex items-center gap-3 text-amber-400 font-sans text-sm tracking-wider uppercase font-medium">
          <span>02</span>
          <span className="w-8 h-[1px] bg-amber-400/40"></span>
          <span>Technical Orbit</span>
        </div>

        {/* Section Headline */}
        <div className="max-w-2xl">
          <h2 className="text-4xl sm:text-6xl font-serif text-cream-50 leading-tight">
            Skills revolving around <br />
            <span className="font-editorial-italic text-amber-300">a central core.</span>
          </h2>
          <p className="mt-4 text-cream-200/80 font-sans text-base sm:text-lg font-light leading-relaxed">
            Hover over any planet or satellite skill to pause the orbit and inspect its application in my work.
          </p>
        </div>

        {/* Concentric Rotating Orbit Container (Desktop View) */}
        <div className="relative min-h-[640px] flex items-center justify-center select-none hidden md:flex">
          
          {/* Central Sun / Star Core */}
          <div className="relative z-20 flex flex-col items-center justify-center w-28 h-28 rounded-full bg-gradient-to-tr from-amber-500 via-orange-400 to-yellow-200 shadow-[0_0_60px_#f59e0b,0_0_100px_rgba(249,115,22,0.6)]">
            <Sun className="w-8 h-8 text-space-950 animate-spin-slow" style={{ animationDuration: '30s' }} />
            <span className="text-[11px] font-sans font-bold text-space-950 uppercase tracking-wider mt-1">
              CORE SUN
            </span>
          </div>

          {/* Ring 1 (Inner Orbit) */}
          <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="absolute w-[290px] h-[290px] rounded-full border border-amber-400/20"
            style={{
              animation: 'spin 35s linear infinite',
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          >
            {RING_1_SKILLS.map((skill, i) => {
              const angle = (i / RING_1_SKILLS.length) * 2 * Math.PI;
              const x = 145 + 145 * Math.cos(angle);
              const y = 145 + 145 * Math.sin(angle);
              return (
                <div
                  key={skill.name}
                  onMouseEnter={() => setHoveredSkill(skill)}
                  onMouseLeave={() => setHoveredSkill(null)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: `translate(-50%, -50%) scale(${hoveredSkill?.name === skill.name ? 1.25 : 1})`,
                  }}
                >
                  <div className="px-3.5 py-1.5 rounded-full bg-space-900/90 border border-amber-400/40 text-cream-50 font-sans font-medium text-xs hover:border-amber-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] whitespace-nowrap shadow-lg">
                    {skill.name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ring 2 (Middle Orbit) */}
          <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="absolute w-[470px] h-[470px] rounded-full border border-violet-400/20"
            style={{
              animation: 'spin 50s linear infinite reverse',
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          >
            {RING_2_SKILLS.map((skill, i) => {
              const angle = (i / RING_2_SKILLS.length) * 2 * Math.PI;
              const x = 235 + 235 * Math.cos(angle);
              const y = 235 + 235 * Math.sin(angle);
              return (
                <div
                  key={skill.name}
                  onMouseEnter={() => setHoveredSkill(skill)}
                  onMouseLeave={() => setHoveredSkill(null)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: `translate(-50%, -50%) scale(${hoveredSkill?.name === skill.name ? 1.25 : 1})`,
                  }}
                >
                  <div className="px-3.5 py-1.5 rounded-full bg-space-900/90 border border-violet-400/40 text-cream-100 font-sans font-medium text-xs hover:border-violet-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] whitespace-nowrap shadow-lg">
                    {skill.name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ring 3 (Outer Orbit) */}
          <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="absolute w-[650px] h-[650px] rounded-full border border-cyan-400/15"
            style={{
              animation: 'spin 65s linear infinite',
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          >
            {RING_3_SKILLS.map((skill, i) => {
              const angle = (i / RING_3_SKILLS.length) * 2 * Math.PI;
              const x = 325 + 325 * Math.cos(angle);
              const y = 325 + 325 * Math.sin(angle);
              return (
                <div
                  key={skill.name}
                  onMouseEnter={() => setHoveredSkill(skill)}
                  onMouseLeave={() => setHoveredSkill(null)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: `translate(-50%, -50%) scale(${hoveredSkill?.name === skill.name ? 1.25 : 1})`,
                  }}
                >
                  <div className="px-4 py-1.5 rounded-full bg-space-900/90 border border-cyan-400/30 text-cream-100 font-sans font-medium text-xs hover:border-cyan-300 hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] whitespace-nowrap shadow-lg">
                    {skill.name}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Dynamic Detail Focus Card when Hovering */}
        <div className="min-h-[90px] flex items-center justify-center">
          {hoveredSkill ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-space-900/90 border border-amber-400/40 max-w-lg text-center space-y-1 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
            >
              <div className="text-amber-400 font-sans text-xs tracking-wider uppercase font-semibold">
                {hoveredSkill.category}
              </div>
              <div className="text-xl font-serif text-cream-50 font-bold">
                {hoveredSkill.name}
              </div>
              <p className="text-sm text-cream-200/90 font-sans font-light">
                {hoveredSkill.description}
              </p>
            </motion.div>
          ) : (
            <div className="text-sm text-cream-400/60 font-sans italic text-center">
              Hover over a skill node to inspect details
            </div>
          )}
        </div>

        {/* Mobile Grid Fallback for clean touch accessibility */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:hidden">
          {[...RING_1_SKILLS, ...RING_2_SKILLS, ...RING_3_SKILLS].map((skill) => (
            <div
              key={skill.name}
              className="p-4 rounded-xl bg-space-900/80 border border-cream-200/10 space-y-1"
            >
              <div className="text-[10px] text-amber-400 font-sans tracking-wide uppercase">
                {skill.category}
              </div>
              <div className="font-sans font-medium text-cream-50 text-sm">
                {skill.name}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
