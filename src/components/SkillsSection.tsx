import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Mic, Eye, Layers } from 'lucide-react';

interface SkillItem {
  name: string;
  role: string;
  detail: string;
}

interface SkillDomain {
  id: string;
  number: string;
  title: string;
  accent: string;
  glowColor: string;
  icon: React.ElementType;
  description: string;
  skills: SkillItem[];
}

const DOMAINS: SkillDomain[] = [
  {
    id: 'ai-ml',
    number: '01',
    title: 'Neural Computation & LLMs',
    accent: '#f59e0b', // amber
    glowColor: 'rgba(245, 158, 11, 0.15)',
    icon: Cpu,
    description: 'Statistical machine learning, large language model reasoning, and GPU-accelerated experimentation.',
    skills: [
      { name: 'Python', role: 'Primary Language', detail: 'Core propulsion for data pipelines, AI models, and algorithmic logic.' },
      { name: 'LLM Integration', role: 'Reasoning Systems', detail: 'Context-aware prompt orchestration, embeddings, and autonomous agent loops.' },
      { name: 'Scikit-learn', role: 'Machine Learning', detail: 'Classification, regression, dimensional reduction, and predictive modeling.' },
      { name: 'Google Colab', role: 'GPU Workflows', detail: 'Cloud-accelerated notebook experimentation and model benchmarking.' },
    ],
  },
  {
    id: 'voice-speech',
    number: '02',
    title: 'Speech & Acoustic Pipelines',
    accent: '#38bdf8', // cyan
    glowColor: 'rgba(56, 189, 248, 0.15)',
    icon: Mic,
    description: 'High-throughput real-time voice processing, offline speech-to-text, and neural synthesis engines.',
    skills: [
      { name: 'OpenAI Whisper', role: 'Neural STT', detail: 'High-fidelity multilingual speech-to-text with contextual decoding.' },
      { name: 'Vosk Engine', role: 'Offline Speed', detail: 'Ultra-low latency offline speech recognition with zero cloud latency.' },
      { name: 'Moonshine STT', role: 'Edge Models', detail: 'Lightweight on-device speech transcription optimized for edge hardware.' },
      { name: 'Neural TTS Engines', role: 'Voice Synthesis', detail: 'Low-latency natural acoustic voice generation and stream buffering.' },
    ],
  },
  {
    id: 'computer-vision',
    number: '03',
    title: 'Computer Vision & Perception',
    accent: '#8b5cf6', // violet
    glowColor: 'rgba(139, 92, 246, 0.15)',
    icon: Eye,
    description: 'Multi-frame visual feature extraction, spatial object classification, and boundary vector tracking.',
    skills: [
      { name: 'Computer Vision', role: 'Spatial Optics', detail: 'Feature extraction, edge detection, and boundary coordinate mapping.' },
      { name: 'Object Tracking', role: 'Frame Analysis', detail: 'Continuous bounding-box classification and motion vector estimation.' },
      { name: 'OpenCV / NumPy', role: 'Matrix Math', detail: 'High-speed image matrix manipulation, masking, and threshold filtering.' },
    ],
  },
  {
    id: 'fullstack-native',
    number: '04',
    title: 'Full-Stack & Desktop Systems',
    accent: '#ec4899', // magenta
    glowColor: 'rgba(236, 72, 153, 0.15)',
    icon: Layers,
    description: 'Production-ready web platforms, database persistence, and multi-threaded desktop GUI workstations.',
    skills: [
      { name: 'Next.js', role: 'Full-Stack Web', detail: 'App router architecture, server components, and optimized production builds.' },
      { name: 'React', role: 'Reactive UI', detail: 'Declarative component design, custom hooks, and modern fluid layouts.' },
      { name: 'MongoDB', role: 'Data Layer', detail: 'Document data modeling, schema indexes, and aggregation pipelines.' },
      { name: 'PyQt6', role: 'Desktop Native', detail: 'Multi-threaded native applications with non-blocking QThread worker loops.' },
    ],
  },
];

export const SkillsSection: React.FC = () => {
  const [activeSkill, setActiveSkill] = useState<SkillItem | null>(null);

  return (
    <section id="skills" className="py-28 px-6 sm:px-12 relative z-10 border-t border-cream-200/10">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Section Label */}
        <div className="flex items-center gap-3 text-amber-400 font-sans text-sm tracking-wider uppercase font-medium">
          <span>02</span>
          <span className="w-8 h-[1px] bg-amber-400/40"></span>
          <span>Technical Capabilities</span>
        </div>

        {/* Section Headline */}
        <div className="max-w-2xl">
          <h2 className="text-4xl sm:text-6xl font-serif text-cream-50 leading-tight">
            Tools calibrated for <br />
            <span className="font-editorial-italic text-amber-300">intelligence & scale.</span>
          </h2>
          <p className="mt-4 text-cream-200/80 font-sans text-base sm:text-lg font-light leading-relaxed">
            Spanning statistical machine learning, acoustic pipelines, and full-stack software development.
          </p>
        </div>

        {/* 2x2 Clean Editorial Grid of Skill Domains */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {DOMAINS.map((domain) => {
            const Icon = domain.icon;
            return (
              <div
                key={domain.id}
                className="relative rounded-3xl p-8 sm:p-10 bg-space-900/60 border border-cream-200/10 hover:border-cream-200/25 transition-all duration-300 space-y-6 group overflow-hidden shadow-xl"
              >
                {/* Subtle Ambient Glow in background */}
                <div
                  className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 opacity-20 group-hover:opacity-40"
                  style={{ background: domain.accent }}
                />

                {/* Domain Header */}
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-3 rounded-2xl border"
                      style={{
                        background: domain.glowColor,
                        borderColor: `${domain.accent}40`,
                        color: domain.accent,
                      }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-sans font-semibold tracking-wider uppercase text-cream-400/80">
                        Domain {domain.number}
                      </div>
                      <h3 className="text-2xl font-serif text-cream-50 font-bold group-hover:text-cream-100 transition-colors">
                        {domain.title}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Domain Summary */}
                <p className="text-cream-300/80 font-sans text-sm leading-relaxed font-light relative z-10">
                  {domain.description}
                </p>

                {/* Skill Nodes List */}
                <div className="space-y-3 pt-2 relative z-10">
                  {domain.skills.map((skill) => {
                    const isSelected = activeSkill?.name === skill.name;
                    return (
                      <div
                        key={skill.name}
                        onClick={() => setActiveSkill(isSelected ? null : skill)}
                        className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-space-850/90 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : 'bg-space-950/70 border-cream-200/10 hover:border-cream-200/30 hover:bg-space-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-sans font-medium text-cream-100 text-sm">
                            {skill.name}
                          </span>
                          <span
                            className="text-xs font-sans px-2.5 py-0.5 rounded-full"
                            style={{
                              background: `${domain.accent}15`,
                              color: domain.accent,
                            }}
                          >
                            {skill.role}
                          </span>
                        </div>

                        {/* Expandable Detail Note */}
                        {isSelected && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-2 text-xs text-cream-200/80 font-sans font-light leading-relaxed pt-2 border-t border-cream-200/10"
                          >
                            {skill.detail}
                          </motion.p>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>

        {/* Open Source Mindset Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-space-900 via-space-850 to-space-900 border border-cream-200/15 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-xl font-serif text-cream-50 font-bold">
              100% Open Source Engineering
            </h4>
            <p className="text-sm text-cream-300 font-sans font-light max-w-xl">
              All my codebases, voice pipeline experiments, neural models, and GUI tools are public on GitHub.
            </p>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-full bg-cream-50 hover:bg-white text-space-950 font-sans font-semibold text-xs tracking-wide transition-all shadow-md whitespace-nowrap"
          >
            Explore GitHub repositories
          </a>
        </div>

      </div>
    </section>
  );
};
