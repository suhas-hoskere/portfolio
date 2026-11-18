import React from 'react';
import {
  ArrowUpRight,
  Mail,
  ExternalLink,
  Play,
  Sparkles,
  MapPin,
  Rocket,
  Flame,
  Unlock,
  Waves,
} from 'lucide-react';
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
    description:
      'Low-latency multi-engine speech recognition pipeline integrating Whisper, Vosk, and Moonshine with neural text-to-speech voice synthesis and edge deployment.',
    metrics: [
      { label: 'Vosk Latency', value: '< 42ms' },
      { label: 'Whisper Accuracy', value: '98.6%' },
      { label: 'Architecture', value: 'Asynchronous' },
    ],
    tags: ['Whisper', 'Vosk', 'Moonshine STT', 'Neural TTS', 'Python 3.12'],
    architecture: [
      'Dual-engine STT: Vosk for instant offline streaming ingestion + Whisper for high-precision contextual decoding',
      'Moonshine lightweight on-device speech model tailored for edge compute and resource-constrained nodes',
      'Asynchronous ring buffering with voice-activity detection (VAD) and non-blocking neural TTS audio synthesis',
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
    description:
      'Production-grade web application built with Next.js 15, React 19, MongoDB, and Docker, featuring real-time data streaming and containerized cloud deployment.',
    metrics: [
      { label: 'SSR Speed', value: '< 110ms' },
      { label: 'Type Safety', value: '100% Strict' },
      { label: 'Deployment', value: 'Dockerized' },
    ],
    tags: ['Next.js 15', 'React 19', 'MongoDB', 'Docker', 'Tailwind CSS'],
    architecture: [
      'Next.js 15 App Router utilizing React Server Components with fine-grained caching strategies',
      'MongoDB document persistence layer with indexed aggregation pipelines and optimistic UI updates',
      'Containerized multi-stage Docker build pipeline optimized for reproducible cloud environments',
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
    description:
      'Native multi-threaded desktop workstation tool designed with PyQt6 for managing local AI pipelines, weights quantization, and live hardware telemetry.',
    metrics: [
      { label: 'Frame Rate', value: '60 FPS' },
      { label: 'UI Latency', value: 'Zero-Lock' },
      { label: 'Threading', value: 'QThread Workers' },
    ],
    tags: ['PyQt6', 'QThread', 'Python 3.12', 'Hardware Monitor'],
    architecture: [
      'Isolated QThread asynchronous worker loops preventing UI thread freeze during heavy local neural inference',
      'Custom dark-mode hardware interface styled using dynamic Qt Style Sheets (QSS) and vector icons',
      'Direct hardware telemetry monitor tracking GPU VRAM, CPU load, and microphone input levels',
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
    description:
      'Applied machine learning experiments integrating Large Language Models, spatial computer vision object tracking, and Scikit-learn predictive pipelines.',
    metrics: [
      { label: 'Vision Stream', value: '30+ FPS' },
      { label: 'Inference', value: 'GPU Accelerated' },
      { label: 'Tool Calling', value: 'Autonomous' },
    ],
    tags: ['LLMs', 'Computer Vision', 'Scikit-learn', 'OpenCV', 'Google Colab'],
    architecture: [
      'Real-time frame evaluation for spatial object detection, coordinate boundary tracking, and optical flow',
      'Scikit-learn predictive regression & classification pipelines evaluated and benchmarked on Colab GPU',
      'Autonomous LLM agent reasoning loop with structured prompt templates and vector context retrieval',
    ],
    tech: ['Python', 'OpenCV', 'Scikit-learn', 'LLMs', 'NumPy', 'Google Colab'],
    github: 'https://github.com/suhashoskere/astrovision-spatial-ml',
    demo: 'https://astrovision-research.streamlit.app',
    demoType: 'vision',
  },
];

const LAUNCH_STEPS = [
  {
    step: '01',
    time: 'T-00:03',
    Icon: Flame,
    title: 'Main Engine Ignition',
    detail: 'Dual Vikas core & twin S200 solid boosters ignite at 5.85 MPa chamber pressure.',
  },
  {
    step: '02',
    time: 'T-00:01',
    Icon: Unlock,
    title: 'Umbilical & Clamp Release',
    detail: 'Cryogenic supply lines decouple and service arms retract 55° clear of the fuselage.',
  },
  {
    step: '03',
    time: 'T-00:00',
    Icon: Waves,
    title: 'Water Deluge Suppression',
    detail: '3,200 L/s flood the flame trench, dampening acoustic energy into billowing steam.',
  },
  {
    step: '04',
    time: 'T+00:03',
    Icon: Rocket,
    title: 'Vertical Liftoff & Tower Clearance',
    detail: 'TWR reaches 1.62 G as the launch vehicle climbs vertically past the gantry tower.',
  },
];

interface FlightMissionOverlaysProps {
  onLaunch: () => void;
  onSelectProject: (proj: ProjectData) => void;
  entered?: boolean;
}

/**
 * Single Continuous Transparent Editorial Page:
 * - Zero solid opaque cards blocking the space flight canvas — pure high-contrast monochrome
 *   typography, delicate hairline dividers, and open transparent flow from Launch Pad to Orbit.
 * - Visitors scroll naturally and continuously down one unified document while the 2D Canvas
 *   plays the synchronized Sriharikota-to-LEO flight right beside & behind the text.
 */
export const FlightMissionOverlays: React.FC<FlightMissionOverlaysProps> = React.memo(
  ({ onLaunch, onSelectProject, entered = true }) => {
    const enterCls = entered ? 'animate-stage-in' : 'opacity-0';

    return (
      <main
        className="relative z-10 w-full pointer-events-none select-none"
        style={{ textShadow: '0 2px 18px rgba(0, 0, 0, 0.92), 0 1px 4px rgba(0, 0, 0, 0.95)' }}
      >
        <div className="w-full max-w-[92vw] sm:max-w-[500px] lg:max-w-[540px] pl-5 sm:pl-10 md:pl-14 lg:pl-20 pr-4 sm:pr-6">
          {/* ===== SECTION 00: LAUNCH PAD — HERO ===== */}
          <section
            id="section-pad"
            className="min-h-[100vh] flex flex-col justify-center py-24 pointer-events-auto"
          >
            <div className="space-y-4 sm:space-y-5 text-left">
              <div
                className={`flex flex-wrap items-center gap-2.5 ${enterCls}`}
                style={{ animationDelay: '0ms' }}
              >
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium tracking-[0.2em] uppercase text-white border-b border-white/35 pb-0.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-300" />
                  <span>INDIA LAUNCH COMPLEX // 00</span>
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  Karnataka &amp; Sriharikota
                </span>
              </div>

              <div className={`space-y-1.5 ${enterCls}`} style={{ animationDelay: '75ms' }}>
                <h1 className="text-[clamp(2.35rem,5.4vw,4.9rem)] font-space font-bold text-white leading-[0.96] tracking-tight">
                  Suhas Hoskere
                </h1>
                <div className="font-kannada text-sm sm:text-base font-medium text-zinc-300 tracking-wide">
                  ಸುಹಾಸ್ ಹೊಸಕೆರೆ · ಬೆಂಗಳೂರು
                </div>
              </div>

              <p
                className={`text-sm sm:text-base text-zinc-200 font-sans font-light leading-relaxed max-w-md ${enterCls}`}
                style={{ animationDelay: '140ms' }}
              >
                B.Tech in Artificial Intelligence &amp; Machine Learning at PES University, Bangalore.
                Architecting intelligent systems, voice pipelines, and deep software.
              </p>

              <div
                className={`pt-2 flex flex-wrap items-center gap-3 ${enterCls}`}
                style={{ animationDelay: '210ms' }}
              >
                <button
                  type="button"
                  onClick={() => {
                    cosmicAudio.playStagingSound();
                    onLaunch();
                  }}
                  className="px-5 py-3 rounded-lg bg-white hover:bg-zinc-200 text-black font-space font-bold text-xs tracking-wider uppercase flex items-center gap-2 transition-colors cursor-pointer"
                  style={{ textShadow: 'none' }}
                >
                  <Rocket className="w-4 h-4 text-black" />
                  <span>Ignite &amp; Lift Off</span>
                </button>

                <a
                  href="https://github.com/suhashoskere"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => cosmicAudio.playTelemetryChirp(1200, 0.05)}
                  className="px-4 py-3 rounded-lg bg-transparent hover:bg-white/10 border border-white/25 hover:border-white/60 text-zinc-100 hover:text-white font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span className="hidden xs:inline">github.com/suhashoskere</span>
                  <span className="xs:hidden">GitHub</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
              </div>

              <div
                className={`pt-2 flex items-center gap-2 text-[11px] font-mono tracking-[0.18em] text-zinc-400 uppercase ${enterCls}`}
                style={{ animationDelay: '280ms' }}
              >
                <span>▼</span>
                <span>SCROLL CONTINUOUSLY TO LAUNCH</span>
              </div>
            </div>
          </section>

          {/* ===== TRANSPARENT LAUNCH SEQUENCE TIMELINE (Ignition -> Clamps -> Deluge -> Liftoff) ===== */}
          <section
            aria-label="Launch sequence telemetry log"
            className="min-h-[65vh] flex flex-col justify-center py-10 pointer-events-auto"
          >
            <div className="border-l border-white/20 pl-5 sm:pl-6 space-y-6">
              <div className="text-[10px] font-mono tracking-[0.22em] text-zinc-400 uppercase">
                LAUNCH SEQUENCE // T-00:03 → T+00:03
              </div>
              {LAUNCH_STEPS.map(({ step, time, Icon, title, detail }) => (
                <div key={step} className="relative space-y-1">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[25px] sm:-left-[29px] top-1.5 w-2 h-2 rounded-full bg-white"
                  />
                  <div className="flex items-center gap-2.5 text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                    <Icon className="w-3 h-3 text-white" />
                    <span className="text-white font-semibold">STEP {step}</span>
                    <span>·</span>
                    <span>{time}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-space font-semibold text-white tracking-tight">
                    {title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300 font-sans font-light leading-relaxed max-w-md">
                    {detail}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ===== SECTION 01: ATMOSPHERIC ASCENT & DAVANAGERE ORIGINS ===== */}
          <section
            id="section-ascent"
            className="min-h-[125vh] flex flex-col justify-center py-20 pointer-events-auto"
          >
            <div className="space-y-4 text-left border-t border-white/15 pt-6">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 uppercase tracking-[0.2em]">
                <span>STAGE 01 // ASCENT</span>
                <span className="text-white">2020 ERA</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-space text-white font-bold leading-tight tracking-tight">
                Davanagere Origins
              </h2>

              <p className="text-sm sm:text-base text-zinc-200 font-sans font-light leading-relaxed">
                Siddaganga PU College, Davanagere. Where deep curiosity for analytical mathematics,
                physics, and computer science first ignited. Laying the ground foundations for
                scalable software and machine intelligence.
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-3 py-1 rounded-full border border-white/20 text-[11px] font-mono text-zinc-200">
                  Mathematics &amp; Physics
                </span>
                <span className="px-3 py-1 rounded-full border border-white/20 text-[11px] font-mono text-zinc-200">
                  Siddaganga PU College
                </span>
                <span className="px-3 py-1 rounded-full border border-white/20 text-[11px] font-mono text-zinc-200">
                  Davanagere, Karnataka
                </span>
              </div>
            </div>
          </section>

          {/* ===== SECTION 02: LOW EARTH ORBIT & BANGALORE ===== */}
          <section
            id="section-orbit"
            className="min-h-[100vh] flex flex-col justify-center py-20 pointer-events-auto"
          >
            <div className="space-y-4 text-left border-t border-white/15 pt-6">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 uppercase tracking-[0.2em]">
                <span>STAGE 02 // ORBIT</span>
                <span className="text-white">420 KM LEO</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-space text-white font-bold leading-tight tracking-tight">
                Bangalore &amp; PES University
              </h2>

              <p className="text-sm sm:text-base text-zinc-200 font-sans font-light leading-relaxed">
                Electronic City Campus, Bangalore. Pursuing B.Tech in Artificial Intelligence &amp;
                Machine Learning. Engineering distributed architectures, deep learning models, and
                real-time speech systems.
              </p>

              <div className="pt-4 grid grid-cols-3 gap-4 border-t border-white/15">
                <div>
                  <div className="text-[10px] font-mono text-zinc-400 tracking-widest">ALTITUDE</div>
                  <div className="text-sm font-mono text-white font-semibold mt-0.5">420 KM</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-zinc-400 tracking-widest">VELOCITY</div>
                  <div className="text-sm font-mono text-white font-semibold mt-0.5">7.66 KM/S</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-zinc-400 tracking-widest">STATION</div>
                  <div className="text-sm font-mono text-white font-semibold mt-0.5">BANGALORE</div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== SECTION 03: EXPLORATION MISSIONS (4 PROJECTS) ===== */}
          <section
            id="section-missions"
            className="min-h-[95vh] flex flex-col justify-center py-20 pointer-events-auto"
          >
            <div className="space-y-5 text-left border-t border-white/15 pt-6">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-[0.2em]">
                    STAGE 03 // ORBITAL PAYLOAD MISSIONS
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-space text-white font-bold leading-tight tracking-tight mt-1">
                    Exploration Missions
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider shrink-0">
                  Click for demo
                </span>
              </div>

              <div className="divide-y divide-white/15 border-y border-white/15">
                {PROJECTS.map((proj) => (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => {
                      cosmicAudio.playTelemetryChirp(1380, 0.05);
                      onSelectProject(proj);
                    }}
                    className="w-full py-4 px-2 -mx-2 rounded-lg text-left hover:bg-white/[0.06] transition-colors cursor-pointer group space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-zinc-400">
                      <span className="font-semibold uppercase text-white tracking-wider">
                        {proj.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full border border-white/20 text-zinc-200">
                        {proj.badge}
                      </span>
                    </div>

                    <div className="text-base sm:text-lg font-space text-white font-bold flex items-center justify-between gap-2 tracking-tight">
                      <span>{proj.title}</span>
                      <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                    </div>

                    <p className="text-xs sm:text-sm text-zinc-300 font-sans font-light leading-relaxed">
                      {proj.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] font-mono">
                      <span className="text-zinc-400">
                        {proj.metrics[0].label}:{' '}
                        <span className="text-white">{proj.metrics[0].value}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-white font-medium">
                        <Play className="w-2.5 h-2.5 fill-white" />
                        <span>Launch Demo</span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ===== SECTION 04: KARNATAKA PASS & KANNADA HERITAGE ===== */}
          <section
            id="section-heritage"
            className="min-h-[80vh] flex flex-col justify-center py-20 pointer-events-auto"
          >
            <div className="space-y-4 text-left border-t border-white/15 pt-6">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 uppercase tracking-[0.2em]">
                <span>STAGE 04 // KARNATAKA PASS</span>
                <span className="text-white">420 KM LEO</span>
              </div>

              <div className="space-y-1">
                <span className="font-kannada text-3xl sm:text-4xl font-bold text-white block">
                  ಕನ್ನಡ ಕೂಟ
                </span>
                <h2 className="text-xl sm:text-2xl font-space text-zinc-200 font-bold leading-tight tracking-tight">
                  Kannada Koota Club · Content Writer
                </h2>
              </div>

              <p className="text-sm sm:text-base text-zinc-200 font-sans font-light leading-relaxed">
                Carrying roots above the Indian horizon. Looking down over Karnataka and Bangalore
                from Low Earth Orbit, blending analytical engineering with creative Kannada prose.
              </p>

              <div className="pt-3 border-t border-white/15 flex items-center justify-between gap-2">
                <span className="font-kannada text-sm sm:text-base font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-zinc-300 shrink-0" />
                  <span>ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ, ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider shrink-0">
                  Cultural Column
                </span>
              </div>
            </div>
          </section>

          {/* ===== SECTION 05: ORBITAL UPLINK & CONTACT ===== */}
          <section
            id="section-signal"
            className="min-h-[100vh] flex flex-col justify-center pt-20 pb-28 pointer-events-auto"
          >
            <div className="space-y-5 text-left border-t border-white/20 pt-6">
              <div className="inline-flex items-center gap-2 text-[11px] font-mono font-medium text-white uppercase tracking-[0.22em]">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                <span>TERMINAL VECTOR // 05</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-space text-white font-bold leading-tight tracking-tight">
                Establish Uplink.
              </h2>

              <p className="text-sm sm:text-base text-zinc-200 font-sans font-light leading-relaxed max-w-md">
                Open to technical collaborations, speech pipelines, open-source architectures, and
                engineering roles.
              </p>

              <div className="space-y-2.5 pt-2 max-w-md">
                <a
                  href="mailto:suhashoskere@gmail.com"
                  className="w-full py-3.5 px-5 rounded-lg bg-white hover:bg-zinc-200 text-black font-space font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  style={{ textShadow: 'none' }}
                >
                  <Mail className="w-4 h-4 text-black" />
                  <span>suhashoskere@gmail.com</span>
                </a>

                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href="https://github.com/suhashoskere"
                    target="_blank"
                    rel="noreferrer"
                    className="py-3 px-4 rounded-lg bg-transparent hover:bg-white/10 border border-white/25 hover:border-white text-zinc-100 hover:text-white font-mono text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <GithubIcon className="w-4 h-4" />
                    <span>GitHub</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>

                  <a
                    href="https://linkedin.com/in/suhashoskere"
                    target="_blank"
                    rel="noreferrer"
                    className="py-3 px-4 rounded-lg bg-transparent hover:bg-white/10 border border-white/25 hover:border-white text-zinc-100 hover:text-white font-mono text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LinkedinIcon className="w-4 h-4" />
                    <span>LinkedIn</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>
                </div>
              </div>

              <div className="pt-4 border-t border-white/15 text-xs font-kannada text-zinc-300">
                ಸುಹಾಸ್ ಹೊಸಕೆರೆ · ಬೆಂಗಳೂರು
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }
);
