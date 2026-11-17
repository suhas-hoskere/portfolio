import React from 'react';
import { ArrowUpRight, Mail, ExternalLink, Play, Sparkles } from 'lucide-react';
import { Stage00ScrollCards } from './Stage00ScrollCards';
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
  scrollProgress?: number;
  onLaunch: () => void;
  onSelectProject: (proj: ProjectData) => void;
  onNextStage?: () => void;
  isLiftoffActive?: boolean;
}

export const FlightMissionOverlays: React.FC<FlightMissionOverlaysProps> = ({
  activeStageIndex,
  scrollProgress = 0,
  onLaunch,
  onSelectProject,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex items-end md:items-center justify-start px-4 sm:px-8 md:px-12 lg:px-16 pb-16 md:pb-0 select-none">
      <div className="w-full max-w-[96vw] sm:max-w-[460px] lg:max-w-[500px] pointer-events-auto">
        {/* STAGE 0: GROUND ZERO — INDIA LAUNCH COMPLEX */}
        {activeStageIndex === 0 && (
          <Stage00ScrollCards
            scrollProgress={scrollProgress}
            onLaunch={onLaunch}
          />
        )}

        {/* STAGE 1: ATMOSPHERIC ASCENT & DAVANAGERE */}
        {activeStageIndex === 1 && (
          <div className="p-5 sm:p-7 rounded-xl bg-[#09090b]/95 border border-white/20 space-y-3 text-left">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 uppercase tracking-widest">
              <span>STAGE 01 // ASCENT</span>
              <span className="text-white">2020 ERA</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-space text-white font-bold leading-tight tracking-tight">
              Davanagere Origins
            </h2>

            <p className="text-xs sm:text-base text-zinc-300 font-sans font-light leading-relaxed">
              Siddaganga PU College, Davanagere. Where deep curiosity for analytical mathematics, physics, and computer science first ignited. Laying the ground foundations for scalable software and machine intelligence.
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2.5 py-1 rounded-md bg-black border border-white/15 text-[11px] font-mono text-zinc-200">
                Mathematics &amp; Physics
              </span>
              <span className="px-2.5 py-1 rounded-md bg-black border border-white/15 text-[11px] font-mono text-zinc-200">
                Siddaganga PU College
              </span>
              <span className="px-2.5 py-1 rounded-md bg-black border border-white/15 text-[11px] font-mono text-zinc-200">
                Davanagere, Karnataka
              </span>
            </div>
          </div>
        )}

        {/* STAGE 2: LOW EARTH ORBIT & BANGALORE */}
        {activeStageIndex === 2 && (
          <div className="p-5 sm:p-7 rounded-xl bg-[#09090b]/95 border border-white/20 space-y-3 text-left">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 uppercase tracking-widest">
              <span>STAGE 02 // ORBIT</span>
              <span className="text-white">420 KM LEO</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-space text-white font-bold leading-tight tracking-tight">
              Bangalore &amp; PES University
            </h2>

            <p className="text-xs sm:text-base text-zinc-300 font-sans font-light leading-relaxed">
              Electronic City Campus, Bangalore. Pursuing B.Tech in Artificial Intelligence &amp; Machine Learning. Engineering distributed architectures, deep learning models, and real-time speech systems.
            </p>

            <div className="pt-2 grid grid-cols-3 gap-2 border-t border-white/10">
              <div className="p-2 rounded-lg bg-black border border-white/15">
                <div className="text-[10px] font-mono text-zinc-400">ALTITUDE</div>
                <div className="text-xs font-mono text-white font-medium">420 KM</div>
              </div>
              <div className="p-2 rounded-lg bg-black border border-white/15">
                <div className="text-[10px] font-mono text-zinc-400">VELOCITY</div>
                <div className="text-xs font-mono text-white font-medium">7.66 KM/S</div>
              </div>
              <div className="p-2 rounded-lg bg-black border border-white/15">
                <div className="text-[10px] font-mono text-zinc-400">STATION</div>
                <div className="text-xs font-mono text-white font-medium">BANGALORE</div>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 3: LUNAR FLYBY & THE 4 EXPLORATION MISSIONS */}
        {activeStageIndex === 3 && (
          <div className="space-y-2.5 text-left max-h-[68vh] md:max-h-[78vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between border-b border-white/15 pb-2">
              <div>
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">
                  STAGE 03 // LUNAR TRAJECTORY
                </span>
                <h2 className="text-xl sm:text-2xl font-space text-white font-bold leading-tight tracking-tight">
                  Exploration Missions
                </h2>
              </div>
              <span className="text-[10px] font-mono text-zinc-300">Click for live demo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PROJECTS.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => {
                    cosmicAudio.playTelemetryChirp(1380, 0.05);
                    onSelectProject(proj);
                  }}
                  className="p-3.5 rounded-xl bg-[#09090b]/95 border border-white/15 hover:border-white/60 space-y-1.5 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-300">
                    <span className="font-semibold uppercase text-white">{proj.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-zinc-200">
                      {proj.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-space text-white font-bold flex items-center justify-between tracking-tight">
                    <span>{proj.title}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white shrink-0" />
                  </h3>

                  <p className="text-[11px] text-zinc-400 font-sans font-light leading-relaxed line-clamp-2">
                    {proj.description}
                  </p>

                  <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
                    <div className="text-[10px] font-mono text-zinc-300">
                      {proj.metrics[0].label}: <span className="text-white">{proj.metrics[0].value}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-mono font-medium text-white">
                      <Play className="w-2.5 h-2.5 fill-white" />
                      <span>Demo</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STAGE 4: MARS ENCOUNTER & KANNADA HERITAGE */}
        {activeStageIndex === 4 && (
          <div className="p-5 sm:p-7 rounded-xl bg-[#09090b]/95 border border-white/20 space-y-3 text-left">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 uppercase tracking-widest">
              <span>STAGE 04 // MARS ENCOUNTER</span>
              <span className="text-white">225M KM</span>
            </div>

            <div className="space-y-1">
              <span className="font-kannada text-2xl sm:text-3xl font-bold text-white">
                ಕನ್ನಡ ಕೂಟ
              </span>
              <h2 className="text-xl sm:text-2xl font-space text-zinc-200 font-bold leading-tight tracking-tight">
                Kannada Koota Club · Content Writer
              </h2>
            </div>

            <p className="text-xs sm:text-base text-zinc-300 font-sans font-light leading-relaxed">
              Carrying roots across interplanetary horizons. From Karnataka&apos;s deep cultural history to India&apos;s Mars Orbiter Mission triumphs, blending analytical code with creative Kannada prose.
            </p>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
              <span className="font-kannada text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-zinc-300 shrink-0" />
                <span>ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ, ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider shrink-0">
                Cultural Column
              </span>
            </div>
          </div>
        )}

        {/* STAGE 5: DEEP SPACE UPLINK & CONTACT */}
        {activeStageIndex === 5 && (
          <div className="p-5 sm:p-7 rounded-xl bg-[#09090b]/95 border border-white/25 space-y-3.5 text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 border border-white/20 text-[11px] font-mono font-medium text-white uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
              <span>TERMINAL VECTOR // 05</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-space text-white font-bold leading-tight tracking-tight">
              Establish Uplink.
            </h2>

            <p className="text-xs sm:text-sm text-zinc-300 font-sans font-light leading-relaxed">
              Open to technical collaborations, speech pipelines, open-source architectures, and engineering roles.
            </p>

            <div className="space-y-2 pt-1">
              <a
                href="mailto:suhashoskere@gmail.com"
                className="w-full py-3 px-5 rounded-lg bg-white hover:bg-zinc-200 text-black font-space font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Mail className="w-4 h-4 text-black" />
                <span>suhashoskere@gmail.com</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href="https://github.com/suhashoskere"
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 rounded-lg bg-black border border-white/20 hover:border-white text-zinc-200 hover:text-white font-mono text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>GitHub</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>

                <a
                  href="https://linkedin.com/in/suhashoskere"
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 rounded-lg bg-black border border-white/20 hover:border-white text-zinc-200 hover:text-white font-mono text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LinkedinIcon className="w-4 h-4" />
                  <span>LinkedIn</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 text-xs font-kannada text-zinc-300">
              ಸುಹಾಸ್ ಹೊಸಕೆರೆ · ಬೆಂಗಳೂರು
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
