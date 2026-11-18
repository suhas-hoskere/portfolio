import React, { useEffect } from 'react';
import { X, ArrowUpRight, ExternalLink } from 'lucide-react';
import { GithubIcon } from './Icons';
import type { ProjectData } from '../data/portfolioData';
import { cosmicAudio } from './AudioEngine';
import { trackLinkClicked } from '../utils/visitorLogger';

interface FlightMissionModalProps {
  project: ProjectData | null;
  onClose: () => void;
}

export const FlightMissionModal: React.FC<FlightMissionModalProps> = ({ project, onClose }) => {
  useEffect(() => {
    if (!project) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 pointer-events-auto">
      <div onClick={onClose} className="absolute inset-0 bg-black/85" />

      {/* Compact single-screen modal: non-scrollable on desktop, safe fallback on tiny short screens */}
      <div className="animate-modal-in relative w-full max-w-2xl max-h-[92vh] overflow-y-auto sm:overflow-hidden rounded-2xl bg-[#09090b] border border-white/25 p-4 sm:p-6 space-y-3 sm:space-y-4 text-left selection:bg-white selection:text-black shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-white text-black text-xs font-mono font-bold tracking-wide">
              {project.name}
            </span>
            <span className="text-[11px] font-mono text-zinc-400 uppercase">{project.category}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close project modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Concise Summary */}
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-space font-bold text-white leading-tight tracking-tight">
            {project.title}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 font-sans font-light leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Compact Highlights Row */}
        <div className="grid grid-cols-3 gap-2">
          {project.metrics.map((m) => (
            <div key={m.label} className="px-3 py-2 rounded-lg bg-black border border-white/15">
              <div className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">
                {m.label}
              </div>
              <div className="text-xs font-mono font-semibold text-white mt-0.5 truncate">
                {m.value}
              </div>
            </div>
          ))}
        </div>

        {/* Concise Architecture & Tech Stack */}
        <div className="p-4 rounded-xl bg-black border border-white/15 space-y-3">
          <ul className="space-y-1.5">
            {project.architecture.map((bullet, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs text-zinc-300 font-sans font-light leading-snug"
              >
                <span className="mt-1.5 w-1 h-1 rounded-full bg-white shrink-0" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2.5 border-t border-white/10 flex flex-wrap gap-1.5">
            {project.tech.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded bg-white/5 border border-white/15 text-[10px] font-mono text-zinc-200"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Immediate Action Buttons: Visit Website & GitHub */}
        <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
          {project.demo && (
            <a
              href={project.demo}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                cosmicAudio.playTelemetryChirp(1320, 0.05);
                trackLinkClicked(`${project.name} Live`);
              }}
              className="px-4 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-space font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Visit Website</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          )}

          <a
            href={project.github}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              cosmicAudio.playTelemetryChirp(1180, 0.05);
              trackLinkClicked(`${project.name} GitHub`);
            }}
            className={`px-4 py-2.5 rounded-lg font-mono text-xs inline-flex items-center gap-2 transition-colors cursor-pointer ${
              project.demo
                ? 'bg-black hover:bg-white/10 border border-white/25 hover:border-white text-white'
                : 'bg-white hover:bg-zinc-200 text-black font-space font-bold uppercase tracking-wider'
            }`}
          >
            <GithubIcon className="w-4 h-4" />
            <span>View on GitHub</span>
            <ExternalLink className={`w-3.5 h-3.5 ${project.demo ? 'text-zinc-400' : 'text-black'}`} />
          </a>
        </div>
      </div>
    </div>
  );
};
