import React, { useState } from 'react';
import {
  ArrowUpRight,
  Mail,
  ExternalLink,
  Sparkles,
  MapPin,
  Rocket,
  Download,
  Code2,
  Lock,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Feather,
} from 'lucide-react';
import { GithubIcon, LinkedinIcon, InstagramIcon } from './Icons';
import { cosmicAudio } from './AudioEngine';
import { KANNADA_WRITINGS, PROJECTS, SKILL_GROUPS, type ProjectData } from '../data/portfolioData';

const KANNADA_DIGITS = ['೦', '೧', '೨', '೩', '೪', '೫', '೬', '೭', '೮', '೯'] as const;
const toKannadaNumber = (n: number) =>
  String(n)
    .padStart(2, '0')
    .replace(/\d/g, (d) => KANNADA_DIGITS[Number(d)]);

interface FlightMissionOverlaysProps {
  onLaunch: () => void;
  onSelectProject: (proj: ProjectData) => void;
  entered?: boolean;
}

/**
 * Single Continuous Scrollable Portfolio Page with high-contrast dark text surfaces
 * floating cleanly over the locked Earth-to-Orbit 2D space-launch canvas.
 */
export const FlightMissionOverlays: React.FC<FlightMissionOverlaysProps> = React.memo(
  ({ onLaunch, onSelectProject, entered = true }) => {
    const [copiedEmail, setCopiedEmail] = useState(false);
    const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
    const [quoteDirection, setQuoteDirection] = useState<'next' | 'prev'>('next');
    const enterCls = entered ? 'animate-stage-in' : 'opacity-0';

    const showPrevQuote = () => {
      cosmicAudio.playTelemetryChirp(1180, 0.04);
      setQuoteDirection('prev');
      setActiveQuoteIndex((prev) => (prev - 1 + KANNADA_WRITINGS.length) % KANNADA_WRITINGS.length);
    };

    const showNextQuote = () => {
      cosmicAudio.playTelemetryChirp(1260, 0.04);
      setQuoteDirection('next');
      setActiveQuoteIndex((prev) => (prev + 1) % KANNADA_WRITINGS.length);
    };

    const handleCopyEmail = () => {
      cosmicAudio.playTelemetryChirp(1320, 0.04);
      navigator.clipboard?.writeText('suhashoskere@gmail.com');
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 1800);
    };
    const textWell =
      'bg-[#050505]/92 border border-white/15 rounded-2xl px-5 py-6 sm:px-8 sm:py-7 shadow-[0_14px_44px_rgba(0,0,0,0.85)]';

    return (
      <>
        {/* Soft continuous feathered dark reading scrim behind the left editorial column */}
        <div
          aria-hidden="true"
          className="fixed inset-y-0 left-0 z-[5] w-full md:w-[62vw] lg:w-[62vw] xl:w-[960px] pointer-events-none bg-gradient-to-r from-[#050505]/95 via-[#050505]/78 to-transparent"
        />

        <main
          className="relative z-10 w-full pointer-events-none"
          style={{ textShadow: '0 2px 14px rgba(0, 0, 0, 0.90)' }}
        >
          <div className="w-full max-w-[92vw] sm:max-w-[540px] md:max-w-[54vw] lg:max-w-[55vw] xl:max-w-[860px] pl-5 sm:pl-10 md:pl-14 lg:pl-20 pr-4 sm:pr-6">
            {/* ===== SECTION 00: HOME — INTRO ===== */}
            <section
              id="section-pad"
              className="min-h-[100vh] flex flex-col justify-center py-24 pointer-events-auto"
            >
              <div className={`${textWell} space-y-4 sm:space-y-5 text-left`}>
                <div
                  className={`flex flex-wrap items-center gap-2.5 ${enterCls}`}
                  style={{ animationDelay: '0ms' }}
                >
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium tracking-[0.18em] uppercase text-white border-b border-white/35 pb-0.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-300" />
                    <span>WRITER · AIML STUDENT · OPEN-SOURCE CONTRIBUTOR</span>
                  </span>
                </div>

                <div className={`space-y-1.5 ${enterCls}`} style={{ animationDelay: '75ms' }}>
                  <h1 className="text-[clamp(2.2rem,5vw,4.35rem)] font-kannada font-bold text-white leading-[1.15] tracking-tight">
                    ಸುಹಾಸ್ ಹೊಸಕೆರೆ
                  </h1>
                  <div className="font-space text-base sm:text-lg font-medium text-zinc-300 tracking-wide">
                    Suhas Hoskere · Bangalore
                  </div>
                </div>

                <p
                  className={`text-sm sm:text-base lg:text-[17px] text-zinc-200 font-sans font-light leading-relaxed max-w-2xl ${enterCls}`}
                  style={{ animationDelay: '140ms' }}
                >
                  A <span className="text-white font-medium">passionate writer</span> crafting{' '}
                  <span className="text-white font-medium">
                    poems, stories, lyrics, and raw reflections
                  </span>{' '}
                  in Kannada and English — exploring love, memory, and pain through words. Alongside
                  writing, an{' '}
                  <span className="text-white font-medium">
                    AI &amp; Machine Learning student at PES University
                  </span>{' '}
                  and open-source contributor building voice pipelines (Neural TTS, Moonshine,
                  Whisper), desktop utilities, and web apps.
                </p>

                <div
                  className={`pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3 ${enterCls}`}
                  style={{ animationDelay: '210ms' }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      cosmicAudio.playStagingSound();
                      onLaunch();
                    }}
                    className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg bg-white hover:bg-zinc-200 text-black font-space font-bold text-xs tracking-wider uppercase flex items-center gap-2 transition-colors cursor-pointer"
                    style={{ textShadow: 'none' }}
                  >
                    <Rocket className="w-4 h-4 text-black" />
                    <span>Explore Journey</span>
                  </button>

                  <a
                    href="/resume.pdf"
                    download="Suhas_Hoskere_Resume.pdf"
                    onClick={() => cosmicAudio.playTelemetryChirp(1260, 0.05)}
                    className="px-4 py-2.5 sm:py-3 rounded-lg bg-black/70 hover:bg-white/10 border border-white/30 hover:border-white text-white font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Resume</span>
                  </a>

                  <a
                    href="https://github.com/suhas-hoskere"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => cosmicAudio.playTelemetryChirp(1200, 0.05)}
                    className="px-4 py-2.5 sm:py-3 rounded-lg bg-transparent hover:bg-white/10 border border-white/20 hover:border-white/60 text-zinc-200 hover:text-white font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <GithubIcon className="w-4 h-4" />
                    <span>suhas-hoskere</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>

                  <a
                    href="https://www.linkedin.com/in/suhas-hoskere/"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => cosmicAudio.playTelemetryChirp(1240, 0.05)}
                    className="px-4 py-2.5 sm:py-3 rounded-lg bg-transparent hover:bg-white/10 border border-white/20 hover:border-white/60 text-zinc-200 hover:text-white font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LinkedinIcon className="w-4 h-4" />
                    <span>LinkedIn</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>
                </div>
              </div>
            </section>

            {/* ===== SECTION 01: UNIFIED EDUCATION TIMELINE ===== */}
            <section
              id="section-education"
              className="min-h-[175vh] flex flex-col justify-center py-20 pointer-events-auto"
            >
              <div className={`${textWell} space-y-5 text-left`}>
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 uppercase tracking-[0.2em]">
                  <span>STAGE 01 // EDUCATION</span>
                  <span className="text-white">2012 – 2029</span>
                </div>

                <div className="space-y-1">
                  <h2 className="font-kannada text-3xl sm:text-4xl font-bold text-white leading-tight">
                    ಶಿಕ್ಷಣ
                  </h2>
                  <div className="font-space text-base sm:text-lg font-medium text-zinc-300 tracking-wide">
                    Education
                  </div>
                </div>

                <div className="border-l border-white/20 pl-5 space-y-5">
                  <div className="relative space-y-1">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[25px] top-1.5 w-2 h-2 rounded-full bg-white"
                    />
                    <div className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                      2025 – 2029 · B.TECH AI &amp; MACHINE LEARNING
                    </div>
                    <h3 className="text-lg font-space font-bold text-white tracking-tight">
                      PES University, Electronic City Campus, Bangalore
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-300 font-sans font-light leading-relaxed">
                      Pursuing B.Tech in Artificial Intelligence &amp; Machine Learning — independently
                      building projects spanning voice pipelines, native Windows tools, Android
                      utilities, multi-script web apps, and applied ML dashboards while contributing
                      to open source.
                    </p>
                  </div>

                  <div className="relative space-y-1">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[25px] top-1.5 w-2 h-2 rounded-full bg-white/80"
                    />
                    <div className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                      2023 – 2025 · PRE-UNIVERSITY (PU)
                    </div>
                    <h3 className="text-lg font-space font-bold text-white tracking-tight">
                      Shree Siddaganga PU College, Davanagere
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-300 font-sans font-light leading-relaxed">
                      Completed Pre-University education in Davanagere, Karnataka, strengthening
                      analytical foundations in mathematics, physics, and computer science.
                    </p>
                  </div>

                  <div className="relative space-y-1">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[25px] top-1.5 w-2 h-2 rounded-full bg-white/60"
                    />
                    <div className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                      2012 – 2023 · UKG – SSLC
                    </div>
                    <h3 className="text-lg font-space font-bold text-white tracking-tight">
                      Rural Public School, Diddige
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-300 font-sans font-light leading-relaxed">
                      Jagalur Taluk, Davanagere District, Karnataka. Studied from UKG through SSLC
                      (passed out 2023), where early curiosity for engineering and writing first
                      began.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ===== SECTION 02: WRITINGS (ಬರಹಗಳು — 100% Kannada) ===== */}
            <section
              id="section-heritage"
              className="min-h-[95vh] flex flex-col justify-center py-20 pointer-events-auto"
            >
              <div className={`${textWell} space-y-4 text-left`}>
                <div className="flex items-center justify-between text-xs font-kannada text-zinc-400">
                  <span>ಹಂತ ೦೨ // ಬರಹಗಳು</span>
                  <span className="text-white">ಕನ್ನಡ · ಇಂಗ್ಲಿಷ್</span>
                </div>

                <div className="space-y-1">
                  <h2 className="font-kannada text-3xl sm:text-4xl font-bold text-white leading-tight">
                    ಬರಹಗಳು
                  </h2>
                  <div className="font-kannada text-base sm:text-lg font-medium text-zinc-300">
                    ಬರಹಗಾರ · ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್
                  </div>
                </div>

                <p className="font-kannada text-sm sm:text-base text-zinc-200 leading-[1.85]">
                  ಪ್ರೀತಿ, ನೆನಪು ಮತ್ತು ನೋವಿನ ನೈಜ ಭಾವನೆಗಳನ್ನು ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಅಕ್ಷರಗಳಿಗಿಳಿಸುವ ಸ್ವತಂತ್ರ ಬರಹಗಾರ.
                </p>

                {/* Card-by-Card Kannada Writings Deck (100% Kannada) */}
                <div className="rounded-xl bg-black/85 border border-white/20 p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-center justify-between gap-2 text-xs font-kannada text-zinc-400">
                    <span className="inline-flex items-center gap-1.5 text-zinc-200 font-medium">
                      <Feather className="w-3.5 h-3.5 text-white shrink-0 -translate-y-[1px]" />
                      <span>ಆಯ್ದ ಬರಹಗಳು</span>
                    </span>
                    <span className="tabular-nums text-white font-semibold">
                      {toKannadaNumber(activeQuoteIndex + 1)} /{' '}
                      {toKannadaNumber(KANNADA_WRITINGS.length)}
                    </span>
                  </div>

                  <div className="min-h-[104px] sm:min-h-[116px] flex items-center py-1 overflow-hidden">
                    <blockquote
                      key={activeQuoteIndex}
                      className={`${
                        quoteDirection === 'next' ? 'animate-quote-next' : 'animate-quote-prev'
                      } font-kannada text-sm sm:text-base lg:text-[17px] leading-[1.9] text-white/95 whitespace-pre-line`}
                    >
                      &ldquo;{KANNADA_WRITINGS[activeQuoteIndex]}&rdquo;
                    </blockquote>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                    <span className="font-kannada text-xs text-zinc-400 shrink-0">
                      — ಸುಹಾಸ್ ಹೊಸಕೆರೆ
                    </span>

                    <div
                      className="hidden sm:flex items-center gap-1"
                      role="tablist"
                      aria-label="Select writing card"
                    >
                      {KANNADA_WRITINGS.map((_, idx) => {
                        const active = idx === activeQuoteIndex;
                        return (
                          <button
                            key={idx}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            aria-label={`Read quote ${idx + 1}`}
                            onClick={() => {
                              cosmicAudio.playTelemetryChirp(1220, 0.03);
                              setQuoteDirection(idx < activeQuoteIndex ? 'prev' : 'next');
                              setActiveQuoteIndex(idx);
                            }}
                            className={`h-1.5 rounded-full transition-all cursor-pointer ${
                              active ? 'w-5 bg-white' : 'w-1.5 bg-white/25 hover:bg-white/60'
                            }`}
                          />
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={showPrevQuote}
                        aria-label="ಹಿಂದಿನ ಬರಹ"
                        title="ಹಿಂದಿನ ಬರಹ"
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white hover:text-black border border-white/20 text-zinc-200 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={showNextQuote}
                        aria-label="ಮುಂದಿನ ಬರಹ"
                        title="ಮುಂದಿನ ಬರಹ"
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white hover:text-black border border-white/20 text-zinc-200 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subtle Club Contribution Note (below the writings card — in Kannada) */}
                <div className="px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-kannada">
                  <span className="text-zinc-300">
                    <span className="text-white font-medium">ಕನ್ನಡ ಕೂಟ ಕ್ಲಬ್‌ನಲ್ಲಿ</span> ಬರಹಗಾರನಾಗಿ ಕೊಡುಗೆ ನೀಡುತ್ತಿದ್ದೇನೆ
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    ಪಿಇಎಸ್ ವಿಶ್ವವಿದ್ಯಾಲಯ · ಇಸಿ ಕ್ಯಾಂಪಸ್
                  </span>
                </div>

                {/* Writing Instagram Pages */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href="https://www.instagram.com/mugulnage_manasu_10/"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => cosmicAudio.playTelemetryChirp(1240, 0.05)}
                    className="p-3.5 rounded-xl bg-black/75 border border-white/15 hover:border-white/55 hover:bg-white/[0.06] transition-colors cursor-pointer group flex items-start justify-between gap-2"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-kannada text-zinc-400">
                        <InstagramIcon className="w-3.5 h-3.5 text-white shrink-0" />
                        <span>ಕನ್ನಡ ಬರಹಗಳು</span>
                      </div>
                      <div className="text-sm font-mono font-semibold text-white truncate">
                        @mugulnage_manasu_10
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-white shrink-0 mt-0.5" />
                  </a>

                  <a
                    href="https://www.instagram.com/unofficial_overthinker_/"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => cosmicAudio.playTelemetryChirp(1280, 0.05)}
                    className="p-3.5 rounded-xl bg-black/75 border border-white/15 hover:border-white/55 hover:bg-white/[0.06] transition-colors cursor-pointer group flex items-start justify-between gap-2"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-kannada text-zinc-400">
                        <InstagramIcon className="w-3.5 h-3.5 text-white shrink-0" />
                        <span>ಇಂಗ್ಲಿಷ್ ಮತ್ತು ತಂತ್ರಜ್ಞಾನ</span>
                      </div>
                      <div className="text-sm font-mono font-semibold text-white truncate">
                        @unofficial_overthinker_
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-white shrink-0 mt-0.5" />
                  </a>
                </div>

                <div className="pt-6 sm:pt-7 border-t border-white/15 flex items-center justify-center text-center">
                  <span className="font-kannada text-sm sm:text-base font-semibold text-white inline-flex items-center justify-center gap-2 leading-none">
                    <Sparkles className="w-4 h-4 text-zinc-300 shrink-0 -translate-y-[1.5px]" />
                    <span>ಜೀವ, ಜೀವನ ಎರಡೂ ಕನ್ನಡದ್ದೇ</span>
                  </span>
                </div>
              </div>
            </section>

            {/* ===== SECTION 03: TECHNICAL STACK & TOOLING ===== */}
            <section
              id="section-stack"
              aria-label="Technical skills and stack"
              className="min-h-[85vh] flex flex-col justify-center py-20 pointer-events-auto"
            >
              <div className={`${textWell} space-y-5 text-left`}>
                <div className="flex items-center justify-between text-[11px] font-mono tracking-[0.2em] text-zinc-400 uppercase">
                  <span className="inline-flex items-center gap-2 text-white">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>STAGE 03 // TECH STACK &amp; MODULES</span>
                  </span>
                  <span>AI-ASSISTED DEV</span>
                </div>

                <div className="space-y-1">
                  <h2 className="font-kannada text-3xl sm:text-4xl font-bold text-white leading-tight">
                    ತಂತ್ರಜ್ಞಾನ
                  </h2>
                  <div className="font-space text-base sm:text-lg font-medium text-zinc-300 tracking-wide">
                    Tech Stack
                  </div>
                </div>

                <div className="space-y-4">
                  {SKILL_GROUPS.map((group) => (
                    <div key={group.label} className="space-y-2">
                      <div className="text-[10px] font-mono tracking-[0.2em] text-zinc-400 uppercase">
                        {group.label}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.map((item) => (
                          <span
                            key={item}
                            className="px-2.5 py-1 rounded-md bg-black/75 border border-white/15 text-[11px] font-mono text-zinc-200"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ===== SECTION 04: REAL OPEN-SOURCE PROJECTS ===== */}
            <section
              id="section-missions"
              className="min-h-[95vh] flex flex-col justify-center py-20 pointer-events-auto"
            >
              <div className={`${textWell} space-y-5 text-left`}>
                <div className="flex items-end justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-[0.2em]">
                      STAGE 04 // SELECTED WORK
                    </span>
                    <h2 className="font-kannada text-3xl sm:text-4xl font-bold text-white leading-tight pt-0.5">
                      ಯೋಜನೆಗಳು
                    </h2>
                    <div className="font-space text-base sm:text-lg font-medium text-zinc-300 tracking-wide">
                      Projects
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider shrink-0">
                    Click for details
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-2 border-t border-white/15 pt-2">
                  {PROJECTS.map((proj) => (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => {
                        cosmicAudio.playTelemetryChirp(1380, 0.05);
                        onSelectProject(proj);
                      }}
                      className="w-full py-4 px-2.5 -mx-2.5 rounded-lg border-b border-white/15 text-left hover:bg-white/[0.06] transition-colors cursor-pointer group flex flex-col justify-between gap-2"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-zinc-400">
                          <span className="font-semibold text-white tracking-wide">
                            {proj.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-black/70 border border-white/20 text-zinc-200">
                            {proj.badge}
                          </span>
                        </div>

                        <div className="text-base font-space text-white font-bold flex items-center justify-between gap-2 tracking-tight">
                          <span>{proj.title}</span>
                          <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                        </div>

                        <p className="text-xs text-zinc-300 font-sans font-light leading-relaxed">
                          {proj.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[10px] font-mono">
                        <span className="text-zinc-400">
                          {proj.metrics[0].label}:{' '}
                          <span className="text-white">{proj.metrics[0].value}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-white font-medium">
                          <span>{proj.demo ? 'Live App & Specs' : 'View Specs'}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Private Repositories / Ongoing R&D Showcase */}
                <div className="p-4 rounded-xl bg-black/75 border border-white/15 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold text-white uppercase tracking-widest">
                      <Lock className="w-3.5 h-3.5 text-zinc-300" />
                      <span>Private Repositories // Active R&amp;D</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-mono text-zinc-200">
                      In Development
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300 font-sans font-light leading-relaxed">
                    Also actively developing several private repositories — including local voice
                    pipelines built with <span className="text-white">Neural TTS</span>,{' '}
                    <span className="text-white">Moonshine Voices</span>, and{' '}
                    <span className="text-white">Whisper engines</span>, along with unreleased AI
                    &amp; desktop experiments. Available for live walkthroughs upon request.
                  </p>
                </div>
              </div>
            </section>

            {/* ===== SECTION 05: CONTACT & LINKS ===== */}
            <section
              id="section-signal"
              className="min-h-[100vh] flex flex-col justify-center pt-20 pb-28 pointer-events-auto"
            >
              <div className={`${textWell} space-y-5 text-left`}>
                <div className="inline-flex items-center gap-2 text-[11px] font-mono font-medium text-white uppercase tracking-[0.22em]">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>CONNECT // 05</span>
                </div>

                <div className="space-y-1.5">
                  <h2 className="font-kannada text-3xl sm:text-5xl font-bold text-white leading-tight">
                    ಸಂಪರ್ಕಿಸಿ
                  </h2>
                  <div className="font-space text-lg sm:text-2xl font-semibold text-zinc-300 tracking-tight">
                    Connect Now
                  </div>
                </div>

                <p className="text-sm sm:text-base text-zinc-200 font-sans font-light leading-relaxed max-w-xl">
                  Open to open-source collaborations, AI/ML &amp; software projects, and creative
                  writing conversations.
                </p>

                <div className="space-y-2.5 pt-2 max-w-lg">
                  <div className="flex items-stretch gap-2">
                    <a
                      href="https://mail.google.com/mail/?view=cm&fs=1&to=suhashoskere@gmail.com&su=Hello%20Suhas"
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => cosmicAudio.playTelemetryChirp(1260, 0.05)}
                      className="flex-1 py-3.5 px-5 rounded-lg bg-white hover:bg-zinc-200 text-black font-space font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      style={{ textShadow: 'none' }}
                    >
                      <Mail className="w-4 h-4 text-black shrink-0" />
                      <span className="truncate">suhashoskere@gmail.com</span>
                      <ExternalLink className="w-3.5 h-3.5 text-black/70 shrink-0" />
                    </a>

                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      aria-label="Copy email address"
                      title="Copy email address"
                      className="px-3.5 rounded-lg bg-black/75 hover:bg-white/10 border border-white/25 hover:border-white text-zinc-200 hover:text-white font-mono text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      {copiedEmail ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <a
                      href="https://github.com/suhas-hoskere"
                      target="_blank"
                      rel="noreferrer"
                      className="py-3 px-4 rounded-lg bg-black/70 hover:bg-white/10 border border-white/25 hover:border-white text-zinc-100 hover:text-white font-mono text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <GithubIcon className="w-4 h-4 shrink-0" />
                      <span>GitHub</span>
                      <ExternalLink className="w-3 h-3 text-zinc-400 shrink-0" />
                    </a>

                    <a
                      href="https://www.linkedin.com/in/suhas-hoskere/"
                      target="_blank"
                      rel="noreferrer"
                      className="py-3 px-4 rounded-lg bg-black/70 hover:bg-white/10 border border-white/25 hover:border-white text-zinc-100 hover:text-white font-mono text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LinkedinIcon className="w-4 h-4 shrink-0" />
                      <span>LinkedIn</span>
                      <ExternalLink className="w-3 h-3 text-zinc-400 shrink-0" />
                    </a>

                    <a
                      href="https://www.instagram.com/suhas__112123/"
                      target="_blank"
                      rel="noreferrer"
                      className="py-3 px-4 rounded-lg bg-black/70 hover:bg-white/10 border border-white/25 hover:border-white text-zinc-100 hover:text-white font-mono text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <InstagramIcon className="w-4 h-4 shrink-0" />
                      <span>Instagram</span>
                      <ExternalLink className="w-3 h-3 text-zinc-400 shrink-0" />
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </>
    );
  }
);
