import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, X, ExternalLink } from 'lucide-react';
import { GithubIcon } from './Icons';

interface Project {
  id: string;
  title: string;
  subtitle: string;
  planetColor: string;
  atmosphereGlow: string;
  summary: string;
  architecture: string[];
  techStack: string[];
  highlights: string[];
  githubUrl: string;
  liveUrl?: string;
}

const PROJECTS: Project[] = [
  {
    id: 'voice-engine',
    title: 'Real-time voice engine',
    subtitle: 'Acoustic Speech Pipeline',
    planetColor: 'radial-gradient(circle at 35% 30%, #38bdf8 0%, #0284c7 40%, #0369a1 70%, #082f49 100%)',
    atmosphereGlow: 'rgba(56, 189, 248, 0.4)',
    summary: 'A low-latency speech recognition and synthesis pipeline uniting Whisper, Vosk, and Moonshine for real-time audio stream buffering and local neural voice transcription.',
    architecture: [
      'Dual-layer speech recognition: Vosk engine for instant offline transcription and Whisper for contextual accuracy',
      'Integrated Moonshine STT for lightweight edge compute environments',
      'Asynchronous audio stream buffering with neural Text-to-Speech synthesis response'
    ],
    techStack: ['Python', 'Whisper', 'Vosk', 'Moonshine', 'Neural TTS', 'DSP'],
    highlights: ['Sub-200ms latency', 'Zero cloud dependency option', 'Continuous stream parsing'],
    githubUrl: 'https://github.com',
  },
  {
    id: 'fullstack-web',
    title: 'Full-stack web platform',
    subtitle: 'Production Next.js Platform',
    planetColor: 'radial-gradient(circle at 35% 30%, #ec4899 0%, #db2777 40%, #9d174d 70%, #500724 100%)',
    atmosphereGlow: 'rgba(236, 72, 153, 0.4)',
    summary: 'A production-grade web application built with Next.js, React, and MongoDB, featuring real-time state synchronization, server-side rendering, and responsive fluid layout.',
    architecture: [
      'Next.js App Router with unified server components and client interactions',
      'MongoDB document persistence layer with indexed aggregation pipelines',
      'Containerized environment using Docker for unified local & cloud deployments'
    ],
    techStack: ['Next.js', 'React', 'MongoDB', 'Docker', 'Tailwind CSS', 'TypeScript'],
    highlights: ['Server-rendered performance', 'Optimized database queries', 'Accessible UI system'],
    githubUrl: 'https://github.com',
    liveUrl: '#',
  },
  {
    id: 'desktop-client',
    title: 'Desktop client',
    subtitle: 'Multi-threaded PyQt6 App',
    planetColor: 'radial-gradient(circle at 35% 30%, #f59e0b 0%, #d97706 40%, #b45309 70%, #451a03 100%)',
    atmosphereGlow: 'rgba(245, 158, 11, 0.4)',
    summary: 'A multi-threaded native desktop client developed in PyQt6 for orchestrating background AI pipelines, model weights, and hardware metrics without freezing the interface.',
    architecture: [
      'Custom QThread asynchronous workers to isolate computationally heavy ML models from the UI',
      'Tailored dark aesthetic utilizing refined Qt Style Sheets (QSS)',
      'Direct integration with local audio capture hardware and Python neural runtimes'
    ],
    techStack: ['Python', 'PyQt6', 'QThread', 'Qt Designer', 'Git CLI'],
    highlights: ['Zero UI stutter during inference', 'Native cross-platform package', 'Real-time telemetry'],
    githubUrl: 'https://github.com',
  },
  {
    id: 'aiml-research',
    title: 'AI/ML research',
    subtitle: 'LLMs & Computer Vision',
    planetColor: 'radial-gradient(circle at 35% 30%, #8b5cf6 0%, #7c3aed 40%, #5b21b6 70%, #2e1065 100%)',
    atmosphereGlow: 'rgba(139, 92, 246, 0.4)',
    summary: 'Applied machine learning experiments integrating Large Language Models, spatial computer vision object tracking, and Scikit-learn statistical predictive pipelines.',
    architecture: [
      'Spatial computer vision frame evaluation for boundary tracking and feature extraction',
      'Scikit-learn classification & regression models benchmarked on Google Colab GPU runtimes',
      'Structured prompt orchestration and document contextual retrieval with LLMs'
    ],
    techStack: ['Python', 'Scikit-learn', 'Computer Vision', 'LLMs', 'Google Colab'],
    highlights: ['Multi-frame tracking', 'Reproducible research notebooks', 'Optimized hyper-parameters'],
    githubUrl: 'https://github.com',
  },
];

// Interactive 3D Tilt Card Component
const ProjectCard: React.FC<{ project: Project; onSelect: () => void }> = ({ project, onSelect }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = (y - centerY) / 12;
    const tiltY = -(x - centerX) / 12;

    setTilt({ x: tiltX, y: tiltY });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.25,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onSelect}
      className="cursor-pointer group relative rounded-3xl p-8 bg-space-900/70 border border-cream-200/15 hover:border-amber-400/40 transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[460px] shadow-2xl"
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: tilt.x === 0 ? 'all 0.4s ease' : 'none',
      }}
    >
      {/* Dynamic Light Glare Overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}) 0%, transparent 60%)`,
        }}
      />

      {/* Top Details & Planet Avatar */}
      <div className="space-y-6 relative z-10">
        <div className="flex items-start justify-between">
          <div className="text-xs font-sans uppercase tracking-wider text-amber-400 font-medium">
            {project.subtitle}
          </div>
          
          {/* Celestial Sphere Planet Thumbnail */}
          <div
            className="w-14 h-14 rounded-full shadow-lg border border-white/20 transition-transform duration-500 group-hover:scale-110"
            style={{
              background: project.planetColor,
              boxShadow: `0 0 25px ${project.atmosphereGlow}`,
            }}
          />
        </div>

        <h3 className="text-2xl sm:text-3xl font-serif text-cream-50 font-bold group-hover:text-amber-200 transition-colors">
          {project.title}
        </h3>

        <p className="text-cream-200/80 font-sans text-sm leading-relaxed font-light line-clamp-3">
          {project.summary}
        </p>
      </div>

      {/* Bottom Tech Tags & View Button */}
      <div className="pt-6 border-t border-cream-200/10 space-y-4 relative z-10">
        <div className="flex flex-wrap gap-2">
          {project.techStack.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="px-2.5 py-1 rounded-md bg-space-950/80 border border-cream-200/10 text-cream-200 font-sans text-xs"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs font-sans font-medium text-cream-300 group-hover:text-amber-300 transition-colors pt-1">
          <span>View project details</span>
          <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};

export const ProjectsCosmic: React.FC = () => {
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  return (
    <section id="projects" className="py-28 px-6 sm:px-12 relative z-10 border-t border-cream-200/10">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Section Label */}
        <div className="flex items-center gap-3 text-amber-400 font-sans text-sm tracking-wider uppercase font-medium">
          <span>03</span>
          <span className="w-8 h-[1px] bg-amber-400/40"></span>
          <span>Selected Projects</span>
        </div>

        {/* Section Headline */}
        <div className="max-w-2xl">
          <h2 className="text-4xl sm:text-6xl font-serif text-cream-50 leading-tight">
            Planetary worlds <br />
            <span className="font-editorial-italic text-amber-300">of code and logic.</span>
          </h2>
          <p className="mt-4 text-cream-200/80 font-sans text-base sm:text-lg font-light leading-relaxed">
            Every project represents a deep-dive exploration into speech processing, web systems, or native application performance.
          </p>
        </div>

        {/* 2x2 Grid of 3D Tilting Planetary Project Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PROJECTS.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={() => setActiveProject(project)}
            />
          ))}
        </div>

      </div>

      {/* Smooth Shared-Element Project Detail Modal */}
      <AnimatePresence>
        {activeProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-space-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl rounded-3xl p-8 sm:p-10 bg-space-900 border border-amber-400/40 shadow-[0_0_50px_rgba(245,158,11,0.2)] max-h-[90vh] overflow-y-auto space-y-6"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveProject(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-space-950 border border-cream-200/20 text-cream-200 hover:text-white transition-colors"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full shadow-lg border border-white/20 shrink-0"
                  style={{
                    background: activeProject.planetColor,
                    boxShadow: `0 0 30px ${activeProject.atmosphereGlow}`,
                  }}
                />
                <div>
                  <div className="text-xs font-sans uppercase tracking-wider text-amber-400 font-semibold">
                    {activeProject.subtitle}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-serif text-cream-50 font-bold">
                    {activeProject.title}
                  </h3>
                </div>
              </div>

              {/* Summary */}
              <p className="text-cream-200/90 font-sans text-base leading-relaxed font-light">
                {activeProject.summary}
              </p>

              {/* Architecture Points */}
              <div className="space-y-3 pt-4 border-t border-cream-200/10">
                <h4 className="text-sm font-sans font-semibold text-cream-50 uppercase tracking-wide">
                  Key Architecture & Systems
                </h4>
                <div className="space-y-2">
                  {activeProject.architecture.map((item, i) => (
                    <div key={i} className="text-sm text-cream-300 flex items-start gap-2.5 font-sans">
                      <span className="text-amber-400 mt-1">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Stack */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-sans uppercase tracking-wider text-cream-400 font-semibold">
                  Technologies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activeProject.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 rounded-full bg-space-950 border border-cream-200/15 text-cream-100 font-sans text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-6 border-t border-cream-200/10 flex flex-wrap items-center gap-4">
                <a
                  href={activeProject.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 rounded-full bg-cream-50 hover:bg-white text-space-950 font-sans font-semibold text-xs tracking-wide transition-all shadow-md flex items-center gap-2"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>Open code repository</span>
                </a>

                {activeProject.liveUrl && (
                  <a
                    href={activeProject.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 rounded-full border border-cream-200/20 hover:border-amber-400 text-cream-100 font-sans text-xs tracking-wide transition-all flex items-center gap-2"
                  >
                    <span>View live project</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
