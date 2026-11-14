import React, { useState } from 'react';
import { 
  Rocket, 
  ExternalLink, 
  Activity
} from 'lucide-react';
import { GithubIcon } from './Icons';
import { cosmicAudio } from '../utils/audio';

interface Project {
  id: string;
  codename: string;
  name: string;
  category: 'Voice AI' | 'Vision & ML' | 'Full-Stack' | 'Desktop';
  description: string;
  missionBadge: string;
  imageUrl: string;
  architecture: string[];
  technologies: string[];
  metrics: { label: string; value: string };
  githubUrl: string;
  demoUrl?: string;
  status: 'DEPLOYED' | 'OPERATIONAL' | 'BETA';
}

const PROJECTS: Project[] = [
  {
    id: 'voice-pipeline',
    codename: 'MISSION-VOX-01',
    name: 'AetherVoice // Real-Time Acoustic Pipeline',
    category: 'Voice AI',
    missionBadge: 'ACOUSTIC PAYLOAD',
    imageUrl: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?auto=format&fit=crop&w=600&q=80',
    description: 'An advanced, modular speech processing pipeline integrating Whisper, Vosk, and Moonshine for low-latency offline speech-to-text with integrated neural TTS voice synthesis.',
    architecture: [
      'Dual-engine STT: Offline Vosk model for instant audio ingestion & Whisper/Moonshine for deep context',
      'Asynchronous audio stream buffering and neural text-to-speech feedback',
      'Configurable noise thresholding and low-latency voice-activity detection'
    ],
    technologies: ['Python', 'Whisper', 'Vosk', 'Moonshine STT', 'TTS Engines', 'Audio DSP'],
    metrics: { label: 'LATENCY', value: '< 180ms' },
    githubUrl: 'https://github.com',
    status: 'OPERATIONAL'
  },
  {
    id: 'computer-vision',
    codename: 'MISSION-VIS-02',
    name: 'SpectraVision // Spatial Perception & Tracking',
    category: 'Vision & ML',
    missionBadge: 'ORBITAL SCANNER',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    description: 'Computer vision framework trained for multi-frame feature extraction, spatial object classification, and boundary vector tracking under varying atmospheric conditions.',
    architecture: [
      'Edge detection and convolutional feature maps with Scikit-learn classification',
      'Google Colab GPU accelerated model training and hyperparameter optimization',
      'Real-time frame ingestion with bounding-box telemetry overlay'
    ],
    technologies: ['Python', 'Computer Vision', 'Scikit-learn', 'Google Colab', 'NumPy'],
    metrics: { label: 'PRECISION', value: '96.4%' },
    githubUrl: 'https://github.com',
    status: 'OPERATIONAL'
  },
  {
    id: 'fullstack-web',
    codename: 'MISSION-ORB-03',
    name: 'NovaPortal // Full-Stack Mission Platform',
    category: 'Full-Stack',
    missionBadge: 'LUNAR COMMAND',
    imageUrl: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?auto=format&fit=crop&w=600&q=80',
    description: 'A responsive full-stack telemetry and management portal built with Next.js and React, featuring MongoDB document persistence and containerized Docker architecture.',
    architecture: [
      'Next.js server-side and client-side rendering with reactive Tailwind HUD styling',
      'MongoDB database layer with structured collections and real-time updates',
      'Docker containerized deployment pipeline for unified local & cloud hosting'
    ],
    technologies: ['Next.js', 'React', 'MongoDB', 'Docker', 'Tailwind CSS', 'TypeScript'],
    metrics: { label: 'UPTIME', value: '99.9%' },
    githubUrl: 'https://github.com',
    demoUrl: '#',
    status: 'DEPLOYED'
  },
  {
    id: 'pyqt-desktop',
    codename: 'MISSION-DSK-04',
    name: 'CosmoDesk // PyQt6 Desktop Command Center',
    category: 'Desktop',
    missionBadge: 'AVIONICS COCKPIT',
    imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80',
    description: 'A native multi-threaded desktop workstation tool designed with PyQt6 for managing local background AI pipelines, model weights, and hardware metrics.',
    architecture: [
      'Multi-threaded QThread background workers to eliminate UI thread blocking',
      'Modern dark-mode aerospace styling using custom Qt Style Sheets (QSS)',
      'Direct integration with local Python voice and computer vision inference loops'
    ],
    technologies: ['Python 3.12', 'PyQt6', 'Multithreading', 'Qt Designer', 'Git CLI'],
    metrics: { label: 'THREADS', value: 'Async QThread' },
    githubUrl: 'https://github.com',
    status: 'OPERATIONAL'
  },
];

const CATEGORIES = ['ALL', 'Voice AI', 'Vision & ML', 'Full-Stack', 'Desktop'] as const;

export const ProjectsManifest: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const filteredProjects = activeCategory === 'ALL'
    ? PROJECTS
    : PROJECTS.filter((p) => p.category === activeCategory);

  return (
    <section id="payloads" className="py-24 relative border-t border-cyan-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 font-mono text-xs">
            <Rocket className="w-3.5 h-3.5 text-cyan-400" />
            <span>SPACE MISSION PAYLOADS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Missions & Payloads
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-light">
            Engineered for high-throughput space telemetry, offline voice intelligence, and full-stack reliability. 100% open source on GitHub.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12 font-mono text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                cosmicAudio.playTelemetryChirp();
              }}
              className={`px-4 py-2 rounded-lg border transition-all ${
                activeCategory === cat
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                  : 'bg-space-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Projects Grid with Rich Visual Images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="glass-panel rounded-2xl border border-cyan-500/25 hover:border-cyan-400/60 transition-all duration-300 group flex flex-col justify-between overflow-hidden shadow-xl"
            >
              <div>
                {/* Visual Header Image with Space Theme */}
                <div className="relative h-48 overflow-hidden border-b border-cyan-500/20">
                  <img
                    src={project.imageUrl}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/40 to-transparent" />
                  
                  {/* Floating Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 font-mono text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-space-950/80 border border-cyan-400/40 text-cyan-300 text-[11px] font-bold">
                      {project.codename}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-400/40 text-amber-300 text-[11px]">
                      {project.missionBadge}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-mono text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{project.status}</span>
                  </div>
                </div>

                <div className="p-6 sm:p-7">
                  {/* Project Title */}
                  <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {project.name}
                  </h3>

                  {/* Description */}
                  <p className="mt-3 text-slate-300 text-sm leading-relaxed font-light">
                    {project.description}
                  </p>

                  {/* Architecture Highlights */}
                  <div className="mt-4 space-y-2 border-l-2 border-cyan-500/30 pl-3">
                    {project.architecture.map((arch, i) => (
                      <div key={i} className="text-xs text-slate-400 flex items-start gap-1.5 font-mono">
                        <span className="text-cyan-400 select-none">›</span>
                        <span>{arch}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tech Pills */}
                  <div className="mt-6 flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 rounded-md bg-space-950 border border-cyan-900/50 text-cyan-300/90 font-mono text-[11px]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-6 pt-0 flex items-center justify-between font-mono text-xs border-t border-slate-800/60 mt-4">
                <div className="flex items-center gap-2 text-slate-400 pt-4">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-400">{project.metrics.label}:</span>
                  <span className="text-white font-bold">{project.metrics.value}</span>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => cosmicAudio.playTelemetryChirp()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-space-850 hover:bg-space-800 border border-cyan-500/30 hover:border-cyan-400 text-slate-200 hover:text-cyan-300 transition-all"
                  >
                    <GithubIcon className="w-3.5 h-3.5" />
                    <span>SOURCE</span>
                  </a>
                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => cosmicAudio.playLockSound()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>DEMO</span>
                    </a>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Space Exploration Mission Badge Banner */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-space-900 via-space-850 to-space-900 border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shrink-0">
              <Rocket className="w-8 h-8 animate-pulse text-cyan-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs">
                <span>OPEN SOURCE REPOSITORY ARCHIVE</span>
              </div>
              <h3 className="text-xl font-bold text-white">
                All Telemetry & Software Payloads Open Sourced
              </h3>
              <p className="text-slate-400 text-sm max-w-xl">
                Explore voice recognition pipelines, Scikit-learn computer vision notebooks, and full-stack web applications on GitHub.
              </p>
            </div>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            onClick={() => cosmicAudio.playLockSound()}
            className="px-6 py-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 hover:border-cyan-300 font-mono text-xs tracking-wider flex items-center gap-2 whitespace-nowrap shadow-[0_0_20px_rgba(56,189,248,0.2)] transition-all"
          >
            <GithubIcon className="w-4 h-4" />
            <span>OPEN GITHUB PROFILE</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </section>
  );
};
