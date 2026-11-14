import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Rocket, Mail, ExternalLink, Play, Sparkles, MapPin } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from './Icons';
import { cosmicAudio } from './AudioEngine';

export interface ProjectData {
  id: string;
  name: string;
  title: string;
  category: string;
  badge: string;
  description: string;
  metrics: { label: string; value: string }[];
  tags: string[];
  architecture: string[];
  tech: string[];
  github: string;
  demo: string;
  demoType: 'voice' | 'web' | 'desktop' | 'vision';
}

export const PROJECTS: ProjectData[] = [
  {
    id: 'voxstream-voice',
    name: 'VoxStream AI',
    title: 'Real-time Hybrid Voice Pipeline',
    category: 'SPEECH AI // PIPELINE',
    badge: 'v2.4 Active',
    description: 'Low-latency multi-engine speech recognition pipeline integrating Whisper, Vosk, and Moonshine with neural text-to-speech voice synthesis and edge deployment.',
    metrics: [
      { label: 'Vosk Latency', value: '< 42ms' },
      { label: 'Whisper Accuracy', value: '98.6%' },
      { label: 'Architecture', value: 'Asynchronous' },
    ],
    tags: ['Whisper', 'Vosk', 'Moonshine STT', 'Neural TTS', 'Python 3.12'],
    architecture: [
      'Dual-engine STT: Vosk for instant offline streaming ingestion + Whisper for high-precision contextual decoding',
      'Moonshine lightweight on-device speech model tailored for edge compute and resource-constrained nodes',
      'Asynchronous ring buffering with voice-activity detection (VAD) and non-blocking neural TTS audio synthesis'
    ],
    tech: ['Python 3.12', 'Whisper', 'Vosk Engine', 'Moonshine STT', 'FastAPI', 'PyAudio'],
    github: 'https://github.com/suhashoskere/voxstream-voice-engine',
    demo: 'https://voxstream-ai.vercel.app',
    demoType: 'voice',
  },
  {
    id: 'orbitstack-platform',
    name: 'OrbitStack Platform',
    title: 'Full-stack Distributed Web Platform',
    category: 'WEB ARCHITECTURE',
    badge: 'Production Ready',
    description: 'Production-grade web application built with Next.js 15, React 19, MongoDB, and Docker, featuring real-time data streaming and containerized cloud deployment.',
    metrics: [
      { label: 'SSR Speed', value: '< 110ms' },
      { label: 'Type Safety', value: '100% Strict' },
      { label: 'Deployment', value: 'Dockerized' },
    ],
    tags: ['Next.js 15', 'React 19', 'MongoDB', 'Docker', 'Tailwind CSS'],
    architecture: [
      'Next.js 15 App Router utilizing React Server Components with fine-grained caching strategies',
      'MongoDB document persistence layer with indexed aggregation pipelines and optimistic UI updates',
      'Containerized multi-stage Docker build pipeline optimized for reproducible cloud environments'
    ],
    tech: ['Next.js 15', 'React 19', 'TypeScript', 'MongoDB', 'Docker', 'Tailwind CSS'],
    github: 'https://github.com/suhashoskere/orbitstack-web-platform',
    demo: 'https://orbitstack-platform.vercel.app',
    demoType: 'web',
  },
  {
    id: 'aeropilot-desktop',
    name: 'AeroPilot Desktop',
    title: 'Native Asynchronous AI Workstation',
    category: 'NATIVE APPLICATION',
    badge: 'Desktop Client',
    description: 'Native multi-threaded desktop workstation tool designed with PyQt6 for managing local AI pipelines, weights quantization, and live hardware telemetry.',
    metrics: [
      { label: 'Frame Rate', value: '60 FPS' },
      { label: 'UI Latency', value: 'Zero-Lock' },
      { label: 'Threading', value: 'QThread Workers' },
    ],
    tags: ['PyQt6', 'QThread', 'Python 3.12', 'Hardware Monitor'],
    architecture: [
      'Isolated QThread asynchronous worker loops preventing UI thread freeze during heavy local neural inference',
      'Custom dark-mode hardware interface styled using dynamic Qt Style Sheets (QSS) and vector icons',
      'Direct hardware telemetry monitor tracking GPU VRAM, CPU load, and microphone input levels'
    ],
    tech: ['Python 3.12', 'PyQt6', 'QThread', 'Qt Designer', 'PyInstaller'],
    github: 'https://github.com/suhashoskere/aeropilot-desktop-client',
    demo: 'https://github.com/suhashoskere/aeropilot-desktop-client/releases',
    demoType: 'desktop',
  },
  {
    id: 'astrovision-ml',
    name: 'AstroVision ML',
    title: 'Spatial Computer Vision & LLM Pipeline',
    category: 'RESEARCH & INTELLIGENCE',
    badge: 'Benchmarked',
    description: 'Applied machine learning experiments integrating Large Language Models, spatial computer vision object tracking, and Scikit-learn predictive pipelines.',
    metrics: [
      { label: 'Vision Stream', value: '30+ FPS' },
      { label: 'Inference', value: 'GPU Accelerated' },
      { label: 'Tool Calling', value: 'Autonomous' },
    ],
    tags: ['LLMs', 'Computer Vision', 'Scikit-learn', 'OpenCV', 'Google Colab'],
    architecture: [
      'Real-time frame evaluation for spatial object detection, coordinate boundary tracking, and optical flow',
      'Scikit-learn predictive regression & classification pipelines evaluated and benchmarked on Colab GPU',
      'Autonomous LLM agent reasoning loop with structured prompt templates and vector context retrieval'
    ],
    tech: ['Python', 'OpenCV', 'Scikit-learn', 'LLMs', 'NumPy', 'Google Colab'],
    github: 'https://github.com/suhashoskere/astrovision-spatial-ml',
    demo: 'https://astrovision-research.streamlit.app',
    demoType: 'vision',
  },
];

interface FlightMissionOverlaysProps {
  activeStageIndex: number;
  onLaunch: () => void;
  onSelectProject: (proj: ProjectData) => void;
  onNextStage?: () => void;
  isLiftoffActive?: boolean;
}

const cardTransition = {
  duration: 0.32,
  ease: [0.16, 1, 0.3, 1] as const,
};

export const FlightMissionOverlays: React.FC<FlightMissionOverlaysProps> = ({
  activeStageIndex,
  onLaunch,
  onSelectProject,
  isLiftoffActive = false,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex items-end sm:items-center justify-start px-4 sm:px-8 md:px-12 lg:px-16 pb-6 sm:pb-0 select-none">
      <div className="w-full max-w-[92vw] sm:max-w-[480px] lg:max-w-[520px] pointer-events-auto">
        <AnimatePresence>
          {/* =========================================================================
              STAGE 0: GROUND ZERO — INDIA LAUNCH COMPLEX
             ========================================================================= */}
          {activeStageIndex === 0 && (
            <motion.div
              key="stage-0"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: isLiftoffActive ? 0 : 1, y: isLiftoffActive ? -14 : 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.98 }}
              transition={cardTransition}
              className={`space-y-4 sm:space-y-5 text-left transition-opacity duration-700 ${
                isLiftoffActive ? 'pointer-events-none' : 'pointer-events-auto'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-[#0e131f]/80 border border-orange-400/40 text-orange-400 text-xs font-mono font-medium tracking-widest uppercase flex items-center gap-1.5 shadow-[0_0_12px_rgba(249,115,22,0.2)]">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>INDIA LAUNCH COMPLEX // 00</span>
                </span>
                <span className="text-xs font-mono text-slate-300">
                  Karnataka & Sriharikota Coordinates
                </span>
              </div>

              <div className="space-y-1">
                <h1 className="text-[clamp(2.4rem,5.5vw,5.5rem)] font-space font-bold text-white leading-[0.95] tracking-tight whitespace-nowrap drop-shadow-[0_15px_45px_rgba(0,0,0,0.95)]">
                  Suhas Hoskere
                </h1>
                <div className="font-kannada text-sm sm:text-base font-semibold text-amber-400 tracking-wide">
                  ಸುಹಾಸ್ ಹೊಸಕೆರೆ · ಬೆಂಗಳೂರು
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-200 font-sans font-light leading-relaxed drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
                B.Tech in Artificial Intelligence & Machine Learning at PES University, Bangalore. Architecting intelligent systems, voice pipelines, and deep software.
              </p>

              <div className="pt-1 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    cosmicAudio.playStagingSound();
                    onLaunch();
                  }}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 via-amber-400 to-amber-500 hover:from-orange-400 hover:to-amber-300 text-slate-950 font-space font-bold text-xs tracking-wider uppercase flex items-center gap-2 shadow-[0_0_25px_rgba(249,115,22,0.45)] transition-all transform hover:scale-105 cursor-pointer"
                >
                  <Rocket className="w-4 h-4 text-slate-950" />
                  <span>Ignite & Lift Off From India</span>
                </button>

                <a
                  href="https://github.com/suhashoskere"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => cosmicAudio.playTelemetryChirp(1200, 0.05)}
                  className="px-4 py-3 rounded-xl bg-[#0e131f]/85 hover:bg-[#161c28] border border-white/15 hover:border-cyan-400 text-slate-200 hover:text-white font-mono text-xs flex items-center gap-2 backdrop-blur-md transition-all cursor-pointer shadow-lg"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>github.com/suhashoskere</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              STAGE 1: ATMOSPHERIC ASCENT & DAVANAGERE
             ========================================================================= */}
          {activeStageIndex === 1 && (
            <motion.div
              key="stage-1"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.98 }}
              transition={cardTransition}
              className="p-6 sm:p-7 rounded-2xl bg-[#0e131f]/80 backdrop-blur-xl border border-orange-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.12)] space-y-3.5 text-left"
            >
              <div className="flex items-center justify-between text-xs font-mono text-orange-400 uppercase tracking-widest">
                <span>STAGE 01 // ASCENT</span>
                <span>2020 ERA</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-space text-white font-bold leading-tight tracking-tight">
                Davanagere Origins
              </h2>

              <p className="text-sm sm:text-base text-slate-200 font-sans font-light leading-relaxed">
                Siddaganga PU College, Davanagere. Where deep curiosity for analytical mathematics, physics, and computer science first ignited. Laying the ground foundations for scalable software and machine intelligence.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-3 py-1 rounded-lg bg-[#161c28]/80 border border-orange-400/25 text-xs font-mono text-orange-300">
                  Mathematics & Physics
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#161c28]/80 border border-orange-400/25 text-xs font-mono text-orange-300">
                  Siddaganga PU College
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#161c28]/80 border border-orange-400/25 text-xs font-mono text-orange-300">
                  Davanagere, Karnataka
                </span>
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              STAGE 2: LOW EARTH ORBIT & BANGALORE
             ========================================================================= */}
          {activeStageIndex === 2 && (
            <motion.div
              key="stage-2"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.98 }}
              transition={cardTransition}
              className="p-6 sm:p-7 rounded-2xl bg-[#0e131f]/80 backdrop-blur-xl border border-cyan-400/30 shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.12)] space-y-3.5 text-left"
            >
              <div className="flex items-center justify-between text-xs font-mono text-cyan-400 uppercase tracking-widest">
                <span>STAGE 02 // ORBIT</span>
                <span>420 KM LEO</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-space text-white font-bold leading-tight tracking-tight">
                Bangalore & PES University
              </h2>

              <p className="text-sm sm:text-base text-slate-200 font-sans font-light leading-relaxed">
                Electronic City Campus, Bangalore. Pursuing B.Tech in Artificial Intelligence & Machine Learning. Engineering distributed architectures, deep learning models, and real-time speech systems.
              </p>

              <div className="pt-2 grid grid-cols-3 gap-2 border-t border-white/10">
                <div className="p-2.5 rounded-xl bg-[#080e1a]/80 border border-cyan-500/20">
                  <div className="text-[10px] font-mono text-cyan-400">ALTITUDE</div>
                  <div className="text-xs font-mono text-white font-medium">420 KM LEO</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#080e1a]/80 border border-cyan-500/20">
                  <div className="text-[10px] font-mono text-cyan-400">VELOCITY</div>
                  <div className="text-xs font-mono text-white font-medium">7.66 KM/S</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#080e1a]/80 border border-cyan-500/20">
                  <div className="text-[10px] font-mono text-cyan-400">GROUND TRACK</div>
                  <div className="text-xs font-mono text-white font-medium">BANGALORE</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              STAGE 3: LUNAR FLYBY & THE 4 EXPLORATION MISSIONS
             ========================================================================= */}
          {activeStageIndex === 3 && (
            <motion.div
              key="stage-3"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.98 }}
              transition={cardTransition}
              className="space-y-3 text-left max-h-[82vh] overflow-y-auto pr-1"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div>
                  <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">
                    STAGE 03 // LUNAR TRAJECTORY & EVA
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-space text-white font-bold leading-tight tracking-tight">
                    Exploration Missions
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-cyan-400">Click to test live demo</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PROJECTS.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => {
                      cosmicAudio.playTelemetryChirp(1380, 0.05);
                      onSelectProject(proj);
                    }}
                    className="p-3.5 sm:p-4 rounded-xl bg-[#0e131f]/85 backdrop-blur-xl border border-white/10 hover:border-cyan-400/50 shadow-lg space-y-2 cursor-pointer transition-all transform hover:-translate-y-0.5 group hover:shadow-[0_0_24px_-4px_rgba(6,182,212,0.3)]"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400">
                      <span className="font-semibold uppercase">{proj.name}</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-400/30 text-cyan-300">
                        {proj.badge}
                      </span>
                    </div>

                    <h3 className="text-sm font-space text-white font-bold group-hover:text-cyan-300 transition-colors flex items-center justify-between tracking-tight">
                      <span>{proj.title}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400" />
                    </h3>

                    <p className="text-[11px] text-slate-300 font-sans font-light leading-relaxed line-clamp-2">
                      {proj.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-white/10">
                      <div className="text-[10px] font-mono text-amber-400">
                        {proj.metrics[0].label}: {proj.metrics[0].value}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-cyan-400">
                        <Play className="w-2.5 h-2.5 fill-cyan-400" />
                        <span>Live Demo</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              STAGE 4: DEEP SPACE VOID & KANNADA HERITAGE
             ========================================================================= */}
          {activeStageIndex === 4 && (
            <motion.div
              key="stage-4"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.98 }}
              transition={cardTransition}
              className="p-6 sm:p-8 rounded-2xl bg-[#0e131f]/80 backdrop-blur-xl border border-orange-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.12)] space-y-3.5 text-left"
            >
              <div className="flex items-center justify-between text-xs font-mono text-orange-400 uppercase tracking-widest">
                <span>STAGE 04 // MARS ENCOUNTER</span>
                <span>225M KM // MANGALYAAN</span>
              </div>

              <div className="space-y-1">
                <span className="font-kannada text-2xl sm:text-3xl font-bold text-amber-400">
                  ಕನ್ನಡ ಕೂಟ
                </span>
                <h2 className="text-2xl sm:text-3xl font-space text-white font-bold leading-tight tracking-tight">
                  Kannada Koota Club · Content Writer
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-200 font-sans font-light leading-relaxed">
                Carrying roots across interplanetary horizons. From Karnataka's deep cultural history to India's Mars Orbiter Mission triumphs, blending analytical code with creative Kannada prose.
              </p>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="font-kannada text-sm font-semibold text-amber-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ, ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ</span>
                </span>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Cultural Column
                </span>
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              STAGE 5: DEEP SPACE UPLINK & CONTACT
             ========================================================================= */}
          {activeStageIndex === 5 && (
            <motion.div
              key="stage-5"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.98 }}
              transition={cardTransition}
              className="p-6 sm:p-8 rounded-2xl bg-[#0e131f]/85 backdrop-blur-2xl border border-cyan-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.12)] space-y-4 text-left"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-[11px] font-mono font-medium text-cyan-400 uppercase tracking-widest shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>TERMINAL VECTOR // 05</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-space text-white font-bold leading-tight tracking-tight">
                Establish Uplink.
              </h2>

              <p className="text-sm text-slate-200 font-sans font-light leading-relaxed">
                Open to technical collaborations, speech pipelines, open-source architectures, and engineering roles.
              </p>

              <div className="space-y-2.5 pt-1">
                <a
                  href="mailto:suhashoskere@gmail.com"
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-space font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(6,182,212,0.45)] transition-all transform hover:scale-[1.02] cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-slate-950" />
                  <span>suhashoskere@gmail.com</span>
                </a>

                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href="https://github.com/suhashoskere"
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-4 rounded-xl bg-[#080e1a]/85 border border-white/15 hover:border-cyan-400 text-slate-200 hover:text-white font-mono text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <GithubIcon className="w-4 h-4" />
                    <span>GitHub Profile</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  <a
                    href="https://linkedin.com/in/suhashoskere"
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-4 rounded-xl bg-[#080e1a]/85 border border-white/15 hover:border-cyan-400 text-slate-200 hover:text-white font-mono text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <LinkedinIcon className="w-4 h-4" />
                    <span>LinkedIn Link</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 text-xs font-kannada text-amber-400/90">
                ಸುಹಾಸ್ ಹೊಸಕೆರೆ · ಬೆಂಗಳೂರು
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
