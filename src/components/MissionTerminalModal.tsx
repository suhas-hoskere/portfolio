import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X, CornerDownLeft } from 'lucide-react';
import { cosmicAudio } from './AudioEngine';

interface MissionTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  scrollProgress: number;
  activeStageIndex: number;
  cameraMode: 'CINEMATIC' | 'BOOSTER' | 'CHASE';
  onSetCameraMode: (mode: 'CINEMATIC' | 'BOOSTER' | 'CHASE') => void;
  blueprintMode: boolean;
  onToggleBlueprint: () => void;
}

interface CommandOutput {
  id: string;
  command: string;
  output: React.ReactNode;
  time: string;
}

export const MissionTerminalModal: React.FC<MissionTerminalModalProps> = ({
  isOpen,
  onClose,
  scrollProgress,
  activeStageIndex,
  cameraMode,
  onSetCameraMode,
  blueprintMode,
  onToggleBlueprint,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<CommandOutput[]>([
    {
      id: 'init-1',
      command: 'sys.init --telemetry --secure',
      output: (
        <div className="space-y-1 text-cyan-300/90 font-mono text-xs">
          <p className="text-emerald-400 font-bold">
            [OK] ISRO SDSC-SHAR TELEMETRY UPLINK ESTABLISHED.
          </p>
          <p>Flight Computer v4.2 // Dual Core Vikas & C25 Cryogenic Monitor</p>
          <p className="text-amber-400">
            Type <span className="text-white font-bold bg-white/10 px-1 rounded">help</span> for available mission commands or <span className="text-white font-bold bg-white/10 px-1 rounded">skills</span> to view technical stacks.
          </p>
        </div>
      ),
      time: new Date().toLocaleTimeString(),
    },
  ]);

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    cosmicAudio.playTelemetryChirp(1200, 0.04);
    const time = new Date().toLocaleTimeString();
    const lower = cmd.toLowerCase();

    let output: React.ReactNode = null;

    if (lower === 'help') {
      output = (
        <div className="space-y-1.5 text-xs font-mono">
          <p className="text-amber-300 font-semibold">AVAILABLE MISSION CONTROL COMMANDS:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-slate-300">
            <div><span className="text-cyan-400 font-bold">about</span> / <span className="text-cyan-400 font-bold">whoami</span> - Engineer profile & bio</div>
            <div><span className="text-cyan-400 font-bold">skills</span> - AI/ML, Speech, & Systems breakdown</div>
            <div><span className="text-cyan-400 font-bold">projects</span> - Live project missions & repos</div>
            <div><span className="text-cyan-400 font-bold">telemetry</span> - Real-time flight vector metrics</div>
            <div><span className="text-cyan-400 font-bold">camera [mode]</span> - Set: cinematic | booster | chase</div>
            <div><span className="text-cyan-400 font-bold">blueprint</span> - Toggle X-Ray holographic wireframe</div>
            <div><span className="text-cyan-400 font-bold">contact</span> - Direct comms & links</div>
            <div><span className="text-cyan-400 font-bold">clear</span> - Flush terminal buffer</div>
            <div><span className="text-cyan-400 font-bold">exit</span> - Return to 3D Flight Deck</div>
          </div>
        </div>
      );
    } else if (lower === 'about' || lower === 'whoami' || lower === 'bio') {
      output = (
        <div className="space-y-2 text-xs font-mono text-slate-200">
          <p className="text-white font-bold text-sm">
            SUHAS HOSKERE // ಸುಹಾಸ್ ಹೊಸಕೆರೆ
          </p>
          <p className="text-cyan-300">
            B.Tech in Artificial Intelligence & Machine Learning at PES University, Bangalore.
          </p>
          <p className="text-slate-300 leading-relaxed">
            Passionate about architecting end-to-end voice and speech pipelines, deep neural systems, high-concurrency backend microservices, and creative WebGL visual computing. Rooted in Karnataka with eyes set on interplanetary exploration.
          </p>
        </div>
      );
    } else if (lower === 'skills') {
      output = (
        <div className="space-y-3 text-xs font-mono">
          <div>
            <div className="text-amber-400 font-bold mb-1">MACHINE LEARNING & VOICE PIPELINES</div>
            <p className="text-slate-300">PyTorch · HuggingFace Transformers · Whisper ASR · FastSpeech · Mel-Spectrogram DSP · Vector Databases (Chroma/FAISS)</p>
          </div>
          <div>
            <div className="text-cyan-400 font-bold mb-1">SYSTEMS, ARCHITECTURE & CLOUD</div>
            <p className="text-slate-300">Python · TypeScript · C++ · Node.js / FastAPI · Docker · Kubernetes · Redis · PostgreSQL · WebSockets</p>
          </div>
          <div>
            <div className="text-emerald-400 font-bold mb-1">CREATIVE GRAPHICS & WEB COMPUTING</div>
            <p className="text-slate-300">Three.js · WebGL · GLSL Shaders · React · TailwindCSS · Framer Motion · Canvas 2D API</p>
          </div>
        </div>
      );
    } else if (lower === 'projects') {
      output = (
        <div className="space-y-2 text-xs font-mono">
          <p className="text-amber-400 font-bold">ACTIVE EXPLORATION MISSIONS:</p>
          <div className="space-y-2 text-slate-300">
            <div className="p-2 rounded bg-white/5 border border-white/10">
              <span className="text-cyan-300 font-bold">1. SpeechFlow AI</span> // Real-Time Low-Latency Neural Audio Pipeline
              <p className="text-[11px] text-slate-400">Streaming ASR + sub-180ms TTS synthesis with adaptive audio buffering.</p>
            </div>
            <div className="p-2 rounded bg-white/5 border border-white/10">
              <span className="text-cyan-300 font-bold">2. DeepCosmos 3D</span> // Physically Based Aerospace Orbital Simulator
              <p className="text-[11px] text-slate-400">Rayleigh atmospheric scattering, Keplerian orbital mechanics, and procedural terrain shaders.</p>
            </div>
            <div className="p-2 rounded bg-white/5 border border-white/10">
              <span className="text-cyan-300 font-bold">3. NeuralEdge Vision</span> // Distributed Edge Inference & Micro-Quantization
              <p className="text-[11px] text-slate-400">ONNX Runtime INT8 quantization for real-time edge embedded vision streams.</p>
            </div>
          </div>
        </div>
      );
    } else if (lower === 'telemetry') {
      output = (
        <div className="space-y-1 text-xs font-mono text-cyan-300">
          <p className="text-emerald-400 font-bold">LIVE ORBITAL TELEMETRY STATUS:</p>
          <p>SCROLL PROGRESS: {(scrollProgress * 100).toFixed(2)}%</p>
          <p>STAGE INDEX: {activeStageIndex} // PHASE {activeStageIndex === 0 ? 'GROUND ZERO' : activeStageIndex === 1 ? 'ATMOSPHERIC ASCENT' : activeStageIndex === 2 ? 'LOW EARTH ORBIT' : activeStageIndex === 3 ? 'LUNAR TRAJECTORY' : activeStageIndex === 4 ? 'MARS ENCOUNTER' : 'TERMINAL UPLINK'}</p>
          <p>CAMERA MODE: {cameraMode}</p>
          <p>HOLOGRAPHIC BLUEPRINT: {blueprintMode ? 'ENABLED [CYAN WIREFRAME]' : 'DISABLED [PBR REALISTIC]'}</p>
        </div>
      );
    } else if (lower.startsWith('camera')) {
      const parts = lower.split(' ');
      const mode = parts[1]?.toUpperCase();
      if (mode === 'CINEMATIC' || mode === 'BOOSTER' || mode === 'CHASE') {
        onSetCameraMode(mode as 'CINEMATIC' | 'BOOSTER' | 'CHASE');
        output = <p className="text-emerald-400 font-mono text-xs">CAMERA ANGLE SWITCHED TO: {mode}</p>;
      } else {
        output = <p className="text-orange-400 font-mono text-xs">Usage: camera cinematic | camera booster | camera chase</p>;
      }
    } else if (lower === 'blueprint') {
      onToggleBlueprint();
      output = (
        <p className="text-cyan-300 font-mono text-xs">
          Holographic X-Ray Blueprint mode toggled: {!blueprintMode ? 'ACTIVE' : 'INACTIVE'}
        </p>
      );
    } else if (lower === 'contact') {
      output = (
        <div className="space-y-1 text-xs font-mono">
          <p className="text-amber-400 font-bold">COMMUNICATION CHANNELS:</p>
          <p className="text-white">Email: <a href="mailto:suhashoskere@gmail.com" className="text-cyan-400 underline">suhashoskere@gmail.com</a></p>
          <p className="text-white">GitHub: <a href="https://github.com/suhashoskere" target="_blank" rel="noreferrer" className="text-cyan-400 underline">github.com/suhashoskere</a></p>
          <p className="text-white">LinkedIn: <a href="https://linkedin.com/in/suhashoskere" target="_blank" rel="noreferrer" className="text-cyan-400 underline">linkedin.com/in/suhashoskere</a></p>
        </div>
      );
    } else if (lower === 'clear') {
      setHistory([]);
      setInputVal('');
      return;
    } else if (lower === 'exit' || lower === 'quit') {
      onClose();
      setInputVal('');
      return;
    } else {
      output = (
        <p className="text-rose-400 font-mono text-xs">
          Command not recognized: &quot;{cmd}&quot;. Type <span className="text-white font-bold bg-white/10 px-1 rounded">help</span> for available commands.
        </p>
      );
    }

    setHistory((prev) => [
      ...prev,
      {
        id: `cmd-${Date.now()}`,
        command: cmd,
        output,
        time,
      },
    ]);
    setInputVal('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-2xl select-none"
        >
          <motion.div
            initial={{ scale: 0.94, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-3xl h-[80vh] max-h-[640px] rounded-2xl bg-[#090d16]/95 border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden font-mono"
          >
            {/* Terminal Header */}
            <div className="px-4 py-3 bg-[#0d1424] border-b border-cyan-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="font-bold tracking-wider">ISRO SDSC-SHAR // MISSION CONTROL TERMINAL</span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-[10px] text-cyan-300 border border-cyan-500/30">
                  LIVE
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  PRESS ESC OR TYPE EXIT TO CLOSE
                </span>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center border border-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Terminal Screen Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent">
              {history.map((h) => (
                <div key={h.id} className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="text-emerald-400">visitor@flight-deck:~$</span>
                    <span className="text-white font-semibold">{h.command}</span>
                    <span className="text-[10px] text-slate-500 ml-auto">{h.time}</span>
                  </div>
                  <div className="pl-4 border-l-2 border-cyan-500/25 py-0.5">
                    {h.output}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input Prompt */}
            <form
              onSubmit={handleCommand}
              className="p-3 bg-[#0c1220] border-t border-cyan-500/30 flex items-center gap-2.5"
            >
              <span className="text-emerald-400 text-xs font-bold whitespace-nowrap">
                visitor@flight-deck:~$
              </span>
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="type 'help', 'skills', 'projects', 'camera', or 'exit'..."
                className="flex-1 bg-transparent text-xs text-cyan-200 outline-none placeholder:text-slate-500 font-mono"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>SEND</span>
                <CornerDownLeft className="w-3 h-3" />
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
