import React, { useState, useRef, useEffect } from 'react';
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
        <div className="space-y-1 text-zinc-300 font-mono text-xs">
          <p className="text-white font-bold">
            [OK] SDSC-SHAR ORBITAL TELEMETRY UPLINK ESTABLISHED.
          </p>
          <p className="text-zinc-400">Flight Computer v4.2 // Dual Core Vikas &amp; C25 Cryogenic Monitor</p>
          <p className="text-zinc-300">
            Type <span className="text-black font-bold bg-white px-1.5 rounded">help</span> for commands or <span className="text-black font-bold bg-white px-1.5 rounded">skills</span> to view technical stacks.
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
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  if (!isOpen) return null;

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
          <p className="text-white font-semibold">AVAILABLE MISSION CONTROL COMMANDS:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-zinc-400">
            <div><span className="text-white font-bold">about</span> / <span className="text-white font-bold">whoami</span> - Engineer profile &amp; bio</div>
            <div><span className="text-white font-bold">skills</span> - AI/ML, Speech, &amp; Systems breakdown</div>
            <div><span className="text-white font-bold">projects</span> - Live project missions &amp; repos</div>
            <div><span className="text-white font-bold">telemetry</span> - Real-time flight vector metrics</div>
            <div><span className="text-white font-bold">camera [mode]</span> - Set: cinematic | booster | chase</div>
            <div><span className="text-white font-bold">blueprint</span> - Toggle monochrome wireframe</div>
            <div><span className="text-white font-bold">contact</span> - Direct comms &amp; links</div>
            <div><span className="text-white font-bold">clear</span> - Flush terminal buffer</div>
            <div><span className="text-white font-bold">exit</span> - Return to Flight Deck</div>
          </div>
        </div>
      );
    } else if (lower === 'about' || lower === 'whoami' || lower === 'bio') {
      output = (
        <div className="space-y-2 text-xs font-mono text-zinc-300">
          <p className="text-white font-bold text-sm">
            SUHAS HOSKERE // ಸುಹಾಸ್ ಹೊಸಕೆರೆ
          </p>
          <p className="text-zinc-200">
            B.Tech in Artificial Intelligence &amp; Machine Learning at PES University, Bangalore.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            Architecting end-to-end voice and speech pipelines, deep neural systems, high-concurrency backend microservices, and high-performance visual computing.
          </p>
        </div>
      );
    } else if (lower === 'skills') {
      output = (
        <div className="space-y-3 text-xs font-mono">
          <div>
            <div className="text-white font-bold mb-1">MACHINE LEARNING &amp; VOICE PIPELINES</div>
            <p className="text-zinc-400">PyTorch · HuggingFace Transformers · Whisper ASR · FastSpeech · Mel-Spectrogram DSP · Vector Databases (Chroma/FAISS)</p>
          </div>
          <div>
            <div className="text-white font-bold mb-1">SYSTEMS, ARCHITECTURE &amp; CLOUD</div>
            <p className="text-zinc-400">Python · TypeScript · C++ · Node.js / FastAPI · Docker · Kubernetes · Redis · PostgreSQL · WebSockets</p>
          </div>
          <div>
            <div className="text-white font-bold mb-1">GRAPHICS &amp; WEB COMPUTING</div>
            <p className="text-zinc-400">HTML5 Canvas 2D · React · TailwindCSS · TypeScript · Web Audio API</p>
          </div>
        </div>
      );
    } else if (lower === 'projects') {
      output = (
        <div className="space-y-2 text-xs font-mono">
          <p className="text-white font-bold">ACTIVE EXPLORATION MISSIONS:</p>
          <div className="space-y-2 text-zinc-300">
            <div className="p-2 rounded bg-white/5 border border-white/15">
              <span className="text-white font-bold">1. VoxStream AI</span> // Real-Time Hybrid Voice Pipeline
              <p className="text-[11px] text-zinc-400">Streaming Vosk + Whisper ASR and Moonshine edge STT with neural TTS synthesis.</p>
            </div>
            <div className="p-2 rounded bg-white/5 border border-white/15">
              <span className="text-white font-bold">2. OrbitStack Platform</span> // Full-Stack Distributed Web Platform
              <p className="text-[11px] text-zinc-400">Next.js 15, React 19, MongoDB, and Dockerized real-time data pipelines.</p>
            </div>
            <div className="p-2 rounded bg-white/5 border border-white/15">
              <span className="text-white font-bold">3. AeroPilot Desktop</span> // Native Asynchronous AI Workstation
              <p className="text-[11px] text-zinc-400">Multi-threaded PyQt6 desktop client with QThread workers and live GPU telemetry.</p>
            </div>
          </div>
        </div>
      );
    } else if (lower === 'telemetry') {
      const phases = [
        'GROUND ZERO',
        'ATMOSPHERIC ASCENT',
        'SATELLITE DEPLOY (LEO)',
        'ORBITAL MISSIONS',
        'KARNATAKA PASS',
        'ORBITAL UPLINK',
      ];
      output = (
        <div className="space-y-1 text-xs font-mono text-zinc-300">
          <p className="text-white font-bold">LIVE ORBITAL TELEMETRY STATUS:</p>
          <p>SCROLL PROGRESS: {(scrollProgress * 100).toFixed(2)}%</p>
          <p>STAGE INDEX: {activeStageIndex} // {phases[activeStageIndex] ?? 'LEO'}</p>
          <p>CAMERA MODE: {cameraMode}</p>
          <p>WIREFRAME MODE: {blueprintMode ? 'ENABLED [MONOCHROME]' : 'DISABLED [STANDARD]'}</p>
        </div>
      );
    } else if (lower.startsWith('camera')) {
      const parts = lower.split(' ');
      const mode = parts[1]?.toUpperCase();
      if (mode === 'CINEMATIC' || mode === 'BOOSTER' || mode === 'CHASE') {
        onSetCameraMode(mode as 'CINEMATIC' | 'BOOSTER' | 'CHASE');
        output = <p className="text-white font-mono text-xs">CAMERA ANGLE SWITCHED TO: {mode}</p>;
      } else {
        output = <p className="text-zinc-400 font-mono text-xs">Usage: camera cinematic | camera booster | camera chase</p>;
      }
    } else if (lower === 'blueprint') {
      onToggleBlueprint();
      output = (
        <p className="text-white font-mono text-xs">
          Wireframe Blueprint mode toggled: {!blueprintMode ? 'ACTIVE' : 'INACTIVE'}
        </p>
      );
    } else if (lower === 'contact') {
      output = (
        <div className="space-y-1 text-xs font-mono">
          <p className="text-white font-bold">COMMUNICATION CHANNELS:</p>
          <p className="text-zinc-300">Email: <a href="mailto:suhashoskere@gmail.com" className="text-white underline">suhashoskere@gmail.com</a></p>
          <p className="text-zinc-300">GitHub: <a href="https://github.com/suhashoskere" target="_blank" rel="noreferrer" className="text-white underline">github.com/suhashoskere</a></p>
          <p className="text-zinc-300">LinkedIn: <a href="https://linkedin.com/in/suhashoskere" target="_blank" rel="noreferrer" className="text-white underline">linkedin.com/in/suhashoskere</a></p>
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
        <p className="text-zinc-300 font-mono text-xs">
          Command not recognized: &quot;{cmd}&quot;. Type <span className="text-black font-bold bg-white px-1.5 rounded">help</span> for available commands.
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 select-none">
      <div className="animate-modal-in w-full max-w-3xl h-[80vh] max-h-[640px] rounded-2xl bg-[#09090b] border border-white/25 flex flex-col overflow-hidden font-mono">
        {/* Terminal Header */}
        <div className="px-4 py-3 bg-black border-b border-white/15 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-white">
            <Terminal className="w-4 h-4 text-white" />
            <span className="font-bold tracking-wider">SDSC-SHAR // MISSION CONTROL TERMINAL</span>
            <span className="px-1.5 py-0.5 rounded bg-white text-[10px] text-black font-bold">
              LIVE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 hidden sm:inline">
              PRESS ESC OR TYPE EXIT
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white flex items-center justify-center border border-white/15 transition-colors cursor-pointer"
              aria-label="Close terminal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Terminal Screen Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
          {history.map((h) => (
            <div key={h.id} className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="text-zinc-300">visitor@flight-deck:~$</span>
                <span className="text-white font-semibold">{h.command}</span>
                <span className="text-[10px] text-zinc-500 ml-auto">{h.time}</span>
              </div>
              <div className="pl-4 border-l border-white/25 py-0.5">
                {h.output}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input Prompt */}
        <form
          onSubmit={handleCommand}
          className="p-3 bg-black border-t border-white/15 flex items-center gap-2.5"
        >
          <span className="text-white text-xs font-bold whitespace-nowrap">
            visitor@flight-deck:~$
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="type 'help', 'skills', 'projects', 'camera', or 'exit'..."
            className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-zinc-500 font-mono"
          />
          <button
            type="submit"
            className="px-2.5 py-1 rounded bg-white hover:bg-zinc-200 text-black font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>SEND</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </form>
      </div>
    </div>
  );
};
