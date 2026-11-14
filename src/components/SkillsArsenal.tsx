import React, { useState } from 'react';
import { 
  Cpu, 
  Mic, 
  Globe, 
  Terminal, 
  Layers, 
  CheckCircle2
} from 'lucide-react';
import { cosmicAudio } from '../utils/audio';

interface SkillCategory {
  id: string;
  codename: string;
  title: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  skills: {
    name: string;
    level: string;
    focus: string;
    badge?: string;
  }[];
}

const SUBSYSTEMS: SkillCategory[] = [
  {
    id: 'propulsion-ai',
    codename: 'SUBSYSTEM 01 // NEURAL',
    title: 'AI, ML & Computer Vision',
    description: 'Neural architectures, spatial vision models, and statistical machine learning engines.',
    icon: Cpu,
    accent: 'cyan',
    skills: [
      { name: 'Python', level: 'Core Propulsion', focus: 'Deep expertise & systems logic', badge: 'PRIMARY' },
      { name: 'Large Language Models (LLMs)', level: 'Advanced', focus: 'Prompt architecture & model pipelines' },
      { name: 'Computer Vision (CV)', level: 'Active Research', focus: 'Object detection, spatial tracking & feature maps' },
      { name: 'Scikit-learn', level: 'Proficient', focus: 'Statistical learning & regression pipelines' },
      { name: 'Google Colab', level: 'Workflow', focus: 'Cloud GPU acceleration & model experimentation' },
    ],
  },
  {
    id: 'voice-telemetry',
    codename: 'SUBSYSTEM 02 // ACOUSTIC',
    title: 'Voice & Speech Pipelines',
    description: 'End-to-end real-time speech recognition, local neural transcription, and synthesis engines.',
    icon: Mic,
    accent: 'indigo',
    skills: [
      { name: 'OpenAI Whisper', level: 'Specialist', focus: 'High-accuracy neural speech transcription', badge: 'SPECIALTY' },
      { name: 'Vosk Engine', level: 'Production', focus: 'Ultra-low latency offline speech recognition' },
      { name: 'Moonshine STT', level: 'Modern Edge', focus: 'Fast, lightweight edge speech-to-text models' },
      { name: 'TTS Engines', level: 'Integration', focus: 'Neural text-to-speech voice synthesis pipelines' },
      { name: 'Audio Signal Processing', level: 'Applied', focus: 'Sample rate buffering, noise thresholding' },
    ],
  },
  {
    id: 'orbital-web',
    codename: 'SUBSYSTEM 03 // INTERFACES',
    title: 'Full-Stack & Desktop Systems',
    description: 'Responsive user cockpits, client-server architectures, and native desktop command centers.',
    icon: Globe,
    accent: 'teal',
    skills: [
      { name: 'Next.js', level: 'Full-Stack', focus: 'App router, API endpoints, server rendered apps' },
      { name: 'React.js', level: 'Interactive UI', focus: 'Reactive components, hooks, state management' },
      { name: 'MongoDB', level: 'Persistence', focus: 'Document databases, schemas & queries' },
      { name: 'PyQt6', level: 'Desktop Native', focus: 'Python GUI dashboards & multi-threaded native tools', badge: 'NATIVE' },
      { name: 'Modern CSS / Tailwind', level: 'Aesthetic', focus: 'Aerospace HUDs, responsive layouts, glassmorphism' },
    ],
  },
  {
    id: 'mission-tooling',
    codename: 'SUBSYSTEM 04 // AVIONICS',
    title: 'Infrastructure & Open Source',
    description: 'Containerized deployment pipelines, version control protocols, and public code stewardship.',
    icon: Terminal,
    accent: 'violet',
    skills: [
      { name: 'Docker', level: 'Containerization', focus: 'Reproducible micro-environments & services' },
      { name: 'Git CLI', level: 'Command Mastery', focus: 'Branch orchestration, rebasing, remote sync' },
      { name: 'GitHub', level: 'Open Collaboration', focus: '100% public source code releases & CI/CD workflows', badge: 'OPEN SOURCE' },
      { name: 'Linux / Bash', level: 'Shell Protocol', focus: 'Scripting, process management & system telemetry' },
    ],
  },
];

export const SkillsArsenal: React.FC = () => {
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>(SUBSYSTEMS[0].id);

  const activeSystem = SUBSYSTEMS.find((s) => s.id === selectedSubsystem) || SUBSYSTEMS[0];

  return (
    <section id="arsenal" className="py-24 relative border-t border-cyan-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 font-mono text-xs">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>PAYLOAD SUBSYSTEMS & AVIONICS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            The Engineering Arsenal
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-light">
            Modular engineering components calibrated for intelligence, speed, and real-time reliability.
          </p>
        </div>

        {/* Subsystem Selector Buttons (HUD Navigation) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10 font-mono text-xs">
          {SUBSYSTEMS.map((sub) => {
            const Icon = sub.icon;
            const isSelected = sub.id === selectedSubsystem;
            return (
              <button
                key={sub.id}
                onClick={() => {
                  setSelectedSubsystem(sub.id);
                  cosmicAudio.playTelemetryChirp(520 + SUBSYSTEMS.indexOf(sub) * 80);
                }}
                className={`p-4 rounded-xl border text-left transition-all duration-300 relative overflow-hidden ${
                  isSelected
                    ? 'bg-space-900 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                    : 'bg-space-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 w-12 h-12 bg-cyan-400/10 rounded-bl-full pointer-events-none" />
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-cyan-500 font-bold">{sub.codename.split('//')[0]}</span>
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                </div>
                <div className="font-semibold text-white text-sm truncate">{sub.title}</div>
              </button>
            );
          })}
        </div>

        {/* Active Subsystem Panel */}
        <div className="glass-panel p-6 sm:p-10 rounded-2xl border border-cyan-500/25 relative overflow-hidden">
          {/* Top telemetry banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-cyan-950/80 font-mono text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                <activeSystem.icon className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <span className="text-cyan-400/80 text-[11px] block">{activeSystem.codename}</span>
                <h3 className="text-xl font-bold text-white">{activeSystem.title}</h3>
              </div>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md font-sans">
              {activeSystem.description}
            </p>
          </div>

          {/* Skill Matrix Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSystem.skills.map((skill, index) => (
              <div
                key={skill.name}
                className="p-4 rounded-xl bg-space-900/60 border border-slate-800/80 hover:border-cyan-500/30 hover:bg-space-850/80 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-mono text-cyan-400/80">NODE 0{index + 1}</span>
                  {skill.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      {skill.badge}
                    </span>
                  )}
                </div>
                <h4 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  {skill.name}
                </h4>
                <div className="mt-1 flex items-center gap-2 text-xs font-mono text-slate-300">
                  <span className="text-cyan-400">STATUS:</span>
                  <span>{skill.level}</span>
                </div>
                <p className="mt-2 text-xs text-slate-400 font-sans leading-relaxed">
                  {skill.focus}
                </p>
              </div>
            ))}
          </div>

          {/* Subsystem Telemetry Check */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>CALIBRATED // BENCHMARKED ON PESU LOCAL KERNELS</span>
            </div>
            <div className="text-cyan-400/70">
              INTEGRATION STATUS: 100% OPERATIONAL
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
