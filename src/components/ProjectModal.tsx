import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, Cpu } from 'lucide-react';
import { GithubIcon } from './Icons';
import type { Milestone } from './TesseractLattice';

interface ProjectModalProps {
  project: Milestone | null;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (project) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, onClose]);

  if (!project || !project.projectDetails) return null;

  const { details } = { details: project.projectDetails };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 pointer-events-auto">
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
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-black/95 border border-amber-400/40 p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.25)] space-y-6 text-left selection:bg-amber-500/30"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-cream-200/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-[11px] font-sans font-semibold text-amber-300 uppercase tracking-widest">
                {project.year}
              </span>
              <span className="text-xs font-sans text-cream-400/70 uppercase tracking-wider">
                Space-Time Milestone
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-cream-200/5 hover:bg-cream-200/15 text-cream-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Close project modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-cream-50 leading-tight">
              {project.title}
            </h2>
            <p className="text-sm sm:text-base text-cream-200/90 font-sans font-light leading-relaxed">
              {details.summary}
            </p>
          </div>

          {/* Architectural Blueprint */}
          <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-space-900/40 border border-cream-200/10">
            <div className="flex items-center gap-2 text-xs font-sans font-semibold text-amber-400 uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Architectural Systems</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-cream-200/80 font-sans font-light">
              {details.architecture.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-amber-400 font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech Stack Chips */}
          <div className="space-y-2">
            <div className="text-xs font-sans font-medium text-cream-400/70 uppercase tracking-wider">
              Integrated Technologies
            </div>
            <div className="flex flex-wrap gap-2">
              {details.tech.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-400/25 text-xs font-sans text-amber-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-cream-200/10">
            <a
              href={details.github}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-space-950 font-sans font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] shadow-lg"
            >
              <GithubIcon className="w-4 h-4" />
              <span>View Source on GitHub</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            {details.demo && details.demo !== '#' && (
              <a
                href={details.demo}
                target="_blank"
                rel="noreferrer"
                className="py-3 px-5 rounded-xl bg-space-900 border border-cream-200/20 hover:border-cream-100 text-cream-200 hover:text-white font-sans text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Live Deployment</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-cream-400" />
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
