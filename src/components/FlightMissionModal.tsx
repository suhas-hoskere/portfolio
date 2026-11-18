import React, { useEffect } from 'react';
import { X, ArrowUpRight, Cpu, ExternalLink } from 'lucide-react';
import { GithubIcon } from './Icons';
import type { ProjectData } from './FlightMissionOverlays';
import { cosmicAudio } from './AudioEngine';

interface FlightMissionModalProps {
  project: ProjectData | null;
  onClose: () => void;
}

export const FlightMissionModal: React.FC<FlightMissionModalProps> = ({ project, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (project) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 pointer-events-auto">
      <div onClick={onClose} className="absolute inset-0 bg-black/85" />

      <div className="animate-modal-in relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#09090b] border border-white/25 p-6 sm:p-8 space-y-6 text-left selection:bg-white selection:text-black">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-white/15 pb-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-md bg-white text-black text-xs font-mono font-bold uppercase tracking-widest">
              {project.name}
            </span>
            <span className="text-xs font-mono text-zinc-400 uppercase">{project.category}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close project modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Heading & Summary */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-space font-bold text-white leading-tight tracking-tight">
            {project.title}
          </h2>
          <p className="text-sm text-zinc-300 font-sans font-light leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Key Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {project.metrics.map((m) => (
            <div key={m.label} className="p-3 rounded-xl bg-black border border-white/15">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                {m.label}
              </div>
              <div className="text-sm font-mono font-semibold text-white mt-0.5">{m.value}</div>
            </div>
          ))}
        </div>

        {/* Architecture & Features */}
        <div className="p-5 sm:p-6 rounded-xl bg-black border border-white/15 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-white uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>Key Capabilities &amp; Architecture</span>
          </div>

          <ul className="space-y-2.5">
            {project.architecture.map((bullet, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-xs sm:text-sm text-zinc-300 font-sans font-light leading-relaxed"
              >
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <div className="pt-3 border-t border-white/10 space-y-2">
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
              Technologies &amp; Modules
            </div>
            <div className="flex flex-wrap gap-1.5">
              {project.tech.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-md bg-white/5 border border-white/15 text-[11px] font-mono text-zinc-200"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Links */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {project.demo && (
            <a
              href={project.demo}
              target="_blank"
              rel="noreferrer"
              onClick={() => cosmicAudio.playTelemetryChirp(1320, 0.05)}
              className="px-5 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-space font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Open Live App</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          )}

          <a
            href={project.github}
            target="_blank"
            rel="noreferrer"
            onClick={() => cosmicAudio.playTelemetryChirp(1180, 0.05)}
            className="px-5 py-2.5 rounded-lg bg-black hover:bg-white/10 border border-white/25 hover:border-white text-white font-mono text-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <GithubIcon className="w-4 h-4" />
            <span>View Source on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </a>
        </div>
      </div>
    </div>
  );
};
