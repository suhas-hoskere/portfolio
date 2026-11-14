import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowUpRight,
  Cpu,
  Play,
  Pause,
  ExternalLink,
  Sliders,
  Database,
  Terminal,
  Activity,
  CheckCircle2,
  Volume2
} from 'lucide-react';
import { GithubIcon } from './Icons';
import type { ProjectData } from './FlightMissionOverlays';
import { cosmicAudio } from './AudioEngine';

interface FlightMissionModalProps {
  project: ProjectData | null;
  onClose: () => void;
}

export const FlightMissionModal: React.FC<FlightMissionModalProps> = ({ project, onClose }) => {
  const [activeTab, setActiveTab] = useState<'demo' | 'architecture'>('demo');

  // Interactive Demo States
  const [voiceRunning, setVoiceRunning] = useState(true);
  const [selectedEngine, setSelectedEngine] = useState<'vosk' | 'whisper' | 'moonshine'>('vosk');
  const [dbQueryRunning, setDbQueryRunning] = useState(false);
  const [dbResponse, setDbResponse] = useState<string | null>(null);
  const [desktopThreads, setDesktopThreads] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.85);
  const dbTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (project) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (dbTimerRef.current) {
        clearTimeout(dbTimerRef.current);
        dbTimerRef.current = null;
      }
    };
  }, [project, onClose]);

  if (!project) return null;

  const handleSimulateDbQuery = () => {
    setDbQueryRunning(true);
    setDbResponse(null);
    if (dbTimerRef.current) clearTimeout(dbTimerRef.current);
    dbTimerRef.current = setTimeout(() => {
      setDbRunningResult();
    }, 600);
  };

  const setDbRunningResult = () => {
    setDbRunning(false);
    setDbResponse(
      JSON.stringify(
        {
          status: 200,
          latency: '38ms',
          cluster: 'mongodb-primary-shard-01',
          documentCount: 14208,
          activeReplicas: 3,
          dockerContainer: 'healthy',
        },
        null,
        2
      )
    );
  };

  function setDbRunning(val: boolean) {
    setDbQueryRunning(val);
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 pointer-events-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0e131f]/95 border border-cyan-500/40 p-6 sm:p-8 shadow-[0_0_70px_rgba(6,182,212,0.25),inset_0_1px_0_0_rgba(255,255,255,0.12)] space-y-6 text-left selection:bg-cyan-500/30"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-xs font-mono font-semibold text-cyan-300 uppercase tracking-widest shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                {project.name}
              </span>
              <span className="text-xs font-mono text-slate-300 uppercase">
                {project.category}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Close project modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Heading & Summary */}
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-space font-bold text-white leading-tight tracking-tight">
              {project.title}
            </h2>
            <p className="text-sm text-slate-200 font-sans font-light leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* View Mode Toggle: Interactive Demo vs Architecture Blueprint */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-[#080e1a]/80 border border-white/10 w-fit">
            <button
              onClick={() => setActiveTab('demo')}
              className={`px-4 py-1.5 rounded-lg text-xs font-space font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'demo'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Interactive Live Demo</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-4 py-1.5 rounded-lg text-xs font-space font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'architecture'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Architecture & Systems</span>
            </button>
          </div>

          {/* =========================================================================
              TAB 1: INTERACTIVE LIVE DEMO CONSOLE
             ========================================================================= */}
          {activeTab === 'demo' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-[#080e1a]/90 border border-cyan-500/25 space-y-4">
              {/* 1. VOXSTREAM AI DEMO */}
              {project.demoType === 'voice' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
                        Real-time Audio Stream Buffer
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        cosmicAudio.playTelemetryChirp(1100, 0.04);
                        setVoiceRunning(!voiceRunning);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer border border-cyan-400/40 transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                    >
                      {voiceRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      <span>{voiceRunning ? 'Pause Stream' : 'Start Stream'}</span>
                    </button>
                  </div>

                  {/* Dancing Audio Equalizer Bars */}
                  <div className="h-16 flex items-end justify-center gap-1 bg-[#030712] p-3 rounded-xl border border-white/10 overflow-hidden shadow-inner">
                    {[18, 35, 60, 42, 85, 95, 65, 45, 80, 50, 70, 90, 40, 25, 75, 55, 30, 68, 88, 48].map((h, i) => (
                      <motion.div
                        key={i}
                        animate={
                          voiceRunning
                            ? {
                                height: [
                                  `${h * 0.3}%`,
                                  `${Math.min(h * 1.1, 100)}%`,
                                  `${h * 0.5}%`,
                                ],
                              }
                            : { height: '8%' }
                        }
                        transition={{
                          repeat: Infinity,
                          duration: 0.6 + (i % 5) * 0.1,
                          ease: 'easeInOut',
                        }}
                        className="w-2 rounded-t bg-gradient-to-t from-cyan-600 via-sky-400 to-amber-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                      />
                    ))}
                  </div>

                  {/* Engine Selector */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">Active Engine:</span>
                    {[
                      { id: 'vosk', label: 'Vosk (Offline · 38ms)' },
                      { id: 'whisper', label: 'Whisper (Context · 98.6%)' },
                      { id: 'moonshine', label: 'Moonshine (Edge STT)' },
                    ].map((eng) => (
                      <button
                        key={eng.id}
                        onClick={() => {
                          cosmicAudio.playTelemetryChirp(1280, 0.05);
                          setSelectedEngine(eng.id as 'vosk' | 'whisper' | 'moonshine');
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                          selectedEngine === eng.id
                            ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                        }`}
                      >
                        {eng.label}
                      </button>
                    ))}
                  </div>

                  {/* Simulated Output Log */}
                  <div className="p-3.5 rounded-xl bg-[#030712] border border-cyan-500/20 font-mono text-xs text-slate-200 space-y-1">
                    <div className="text-[10px] text-cyan-400/90 tracking-wider">INCOMING TRANSCRIPTION FEED:</div>
                    <div className="text-emerald-400">
                      {selectedEngine === 'vosk' && '>> [Vosk Instant Stream]: "Telemetry online. Orbital vectors aligned for stage separation."'}
                      {selectedEngine === 'whisper' && '>> [Whisper Context Pass]: "Initiating telemetry verification sequence. All subsystems report nominal."'}
                      {selectedEngine === 'moonshine' && '>> [Moonshine Edge Node]: "Micro-buffer parsed in 41ms. Ready for voice synthesis."'}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. ORBITSTACK PLATFORM DEMO */}
              {project.demoType === 'web' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
                        MongoDB Cloud & Next.js Cluster
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        cosmicAudio.playTelemetryChirp(1350, 0.06);
                        handleSimulateDbQuery();
                      }}
                      disabled={dbQueryRunning}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer border border-cyan-400/40 transition-all disabled:opacity-50 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                    >
                      <Activity className={`w-3.5 h-3.5 ${dbQueryRunning ? 'animate-spin' : ''}`} />
                      <span>{dbQueryRunning ? 'Executing...' : 'Run Aggregation Query'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl bg-[#030712] border border-white/10 text-center">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">SSR RENDER</div>
                      <div className="text-sm font-mono font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 84ms
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#030712] border border-white/10 text-center">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">DOCKER CONTAINER</div>
                      <div className="text-sm font-mono font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#030712] border border-white/10 text-center">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">CACHE HIT RATIO</div>
                      <div className="text-sm font-mono font-bold text-cyan-400 mt-0.5">99.4%</div>
                    </div>
                  </div>

                  {dbResponse && (
                    <div className="p-3.5 rounded-xl bg-[#030712] border border-cyan-500/30 font-mono text-xs text-cyan-300 overflow-x-auto shadow-inner">
                      <div className="text-[10px] text-slate-400 mb-1">AGGREGATION RESPONSE PAYLOAD:</div>
                      <pre className="text-xs">{dbResponse}</pre>
                    </div>
                  )}
                </div>
              )}

              {/* 3. AEROPILOT DESKTOP WORKSTATION DEMO */}
              {project.demoType === 'desktop' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
                        PyQt6 Native Cockpit & QThread Engine
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        cosmicAudio.playTelemetryChirp(1150, 0.05);
                        setDesktopThreads(!desktopThreads);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                    >
                      <Activity className="w-3 h-3" />
                      <span>{desktopThreads ? 'QThread: Active' : 'QThread: Paused'}</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-[#030712] border border-white/10 space-y-3 font-mono text-xs shadow-inner">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-slate-400">Worker Loop Status:</span>
                      <span className={desktopThreads ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                        {desktopThreads ? '● Non-blocking QThread Loop Running' : '○ Idle'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">GPU VRAM ALLOCATION</div>
                        <div className="w-full bg-white/10 rounded-full h-2 mt-1.5 overflow-hidden">
                          <div className="bg-gradient-to-r from-cyan-500 to-sky-400 h-full rounded-full" style={{ width: '42%' }} />
                        </div>
                        <div className="text-[11px] text-slate-200 mt-1">3.36 GB / 8.00 GB</div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">UI THREAD FRAME RATE</div>
                        <div className="w-full bg-white/10 rounded-full h-2 mt-1.5 overflow-hidden">
                          <div className="bg-emerald-400 h-full rounded-full" style={{ width: '100%' }} />
                        </div>
                        <div className="text-[11px] text-emerald-400 mt-1">60.0 FPS (Zero-Lock)</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. ASTROVISION ML DEMO */}
              {project.demoType === 'vision' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
                        Spatial Vision Object Detection
                      </span>
                    </div>
                    <span className="text-xs font-mono text-cyan-300">
                      Confidence: {Math.round(confidenceThreshold * 100)}%
                    </span>
                  </div>

                  {/* Simulated Object Detection Canvas Frame */}
                  <div className="relative h-44 rounded-xl bg-[#030712] border border-cyan-500/25 overflow-hidden flex items-center justify-center shadow-inner">
                    <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />

                    {/* Target Bounding Box 1 */}
                    <div className="absolute left-1/4 top-1/4 w-36 h-24 border-2 border-amber-400 bg-amber-400/10 rounded flex flex-col justify-between p-1.5 shadow-[0_0_15px_rgba(251,191,36,0.25)]">
                      <div className="flex items-center justify-between text-[10px] font-mono text-amber-300 font-bold">
                        <span>LAUNCH_VEHICLE</span>
                        <span>0.96</span>
                      </div>
                      <div className="text-[9px] font-mono text-amber-200/90">
                        [X: 184, Y: 112] · 7.8 km/s
                      </div>
                    </div>

                    {/* Target Bounding Box 2 */}
                    <div className="absolute right-1/4 bottom-1/4 w-28 h-18 border-2 border-cyan-400 bg-cyan-400/10 rounded flex flex-col justify-between p-1.5 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                      <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300 font-bold">
                        <span>SOLAR_PANEL</span>
                        <span>0.91</span>
                      </div>
                      <div className="text-[9px] font-mono text-cyan-200/90">
                        [X: 420, Y: 310] · Orbit
                      </div>
                    </div>
                  </div>

                  {/* Slider Control */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400">Confidence Threshold:</span>
                    <input
                      type="range"
                      min="0.5"
                      max="0.99"
                      step="0.01"
                      value={confidenceThreshold}
                      onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                      className="flex-1 accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 2: ARCHITECTURE & SYSTEMS
             ========================================================================= */}
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="space-y-3 p-5 rounded-2xl bg-[#080e1a]/90 border border-white/10 shadow-inner">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Subsystem Specifications & Engineering Blueprint</span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200 font-sans font-light">
                  {project.architecture.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-cyan-400 font-bold mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tech Stack Chips */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Engineered Stack & Dependencies
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-400/25 text-xs font-mono text-cyan-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions & Verified External Links */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/10">
            <a
              href={project.demo}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-space font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-slate-950" />
              <span>Launch Live Deployment ({project.name})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            <a
              href={project.github}
              target="_blank"
              rel="noreferrer"
              className="py-3 px-5 rounded-xl bg-[#080e1a]/85 border border-white/15 hover:border-cyan-400 text-slate-200 hover:text-white font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <GithubIcon className="w-4 h-4" />
              <span>GitHub Repository</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
