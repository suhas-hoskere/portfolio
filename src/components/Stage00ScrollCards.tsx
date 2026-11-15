import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Rocket, ExternalLink, Flame, Unlock, Waves } from 'lucide-react';
import { GithubIcon } from './Icons';
import { cosmicAudio } from './AudioEngine';

interface Stage00ScrollCardsProps {
  scrollProgress: number;
  onLaunch: () => void;
  cardTransition: { duration: number; ease: readonly [number, number, number, number] };
}

const MILESTONES = [
  {
    min: 0.035,
    max: 0.080,
    step: 'STEP 01 // MAIN ENGINE IGNITION',
    time: 'T-00:03',
    Icon: Flame,
    border: 'border-orange-500/40',
    text: 'text-orange-400',
    title: 'Dual Vikas Core & Twin S200 Boosters',
    desc: 'Liquid Vikas core stage and strap-on solid boosters ignite simultaneously at ground zero. Combustion chamber pressure climbs rapidly to nominal operating limits.',
    metrics: [
      { label: 'THRUST', value: '100% NOMINAL' },
      { label: 'CHAMBER', value: '5.85 MPA' },
      { label: 'HOLD-DOWN', value: 'ENGAGED' },
    ],
    hint: 'SCROLL FURTHER TO RELEASE UMBILICAL LOCKS',
  },
  {
    min: 0.080,
    max: 0.125,
    step: 'STEP 02 // UMBILICAL & CLAMP RELEASE',
    time: 'T-00:01',
    Icon: Unlock,
    border: 'border-cyan-500/40',
    text: 'text-cyan-400',
    title: 'Service Arms Decouple & Retract',
    desc: 'Cryogenic liquid supply lines cleanly decouple. Primary umbilical service arms pivot clear 55 degrees away from the vehicle fuselage as hold-down clamps open.',
    metrics: [
      { label: 'UMBILICAL', value: 'RETRACTED' },
      { label: 'CLAMPS', value: 'DISENGAGED' },
      { label: 'CLEARANCE', value: '55° SWING' },
    ],
    hint: 'SCROLL FURTHER FOR WATER DELUGE & TRENCH SMOKE',
  },
  {
    min: 0.125,
    max: 0.170,
    step: 'STEP 03 // WATER DELUGE & TRENCH SMOKE',
    time: 'T-00:00',
    Icon: Waves,
    border: 'border-sky-400/40',
    text: 'text-sky-400',
    title: 'Acoustic Suppression Flood',
    desc: 'Over 3,000 liters per second of water deluge inundate the launch flame trench, absorbing acoustic energy and sending vast billowing clouds of white steam across the apron.',
    metrics: [
      { label: 'WATER FLOW', value: '3,200 L/S' },
      { label: 'ACOUSTICS', value: 'DAMPENED' },
      { label: 'TRENCH', value: 'BILLOWING' },
    ],
    hint: 'SCROLL FURTHER FOR VERTICAL LIFTOFF CLEARANCE',
  },
  {
    min: 0.170,
    max: 1.000,
    step: 'STEP 04 // VERTICAL LIFTOFF',
    time: 'T+00:03',
    Icon: Rocket,
    border: 'border-emerald-400/40',
    text: 'text-emerald-400',
    title: 'Positive Liftoff & Tower Clearance',
    desc: 'Thrust-to-weight ratio exceeds unity. The heavy-lift vehicle clears the launch support structure vertically into the coastal morning sky, beginning ascent to low Earth orbit.',
    metrics: [
      { label: 'TWR', value: '1.62 G' },
      { label: 'ALTITUDE', value: 'CLIMBING' },
      { label: 'TOWER', value: 'CLEARED' },
    ],
    hint: 'CONTINUE SCROLLING FOR STAGE 01: ATMOSPHERIC ASCENT',
  },
];

export const Stage00ScrollCards: React.FC<Stage00ScrollCardsProps> = ({
  scrollProgress,
  onLaunch,
  cardTransition,
}) => {
  const activeMilestone = MILESTONES.find(
    (m) => scrollProgress >= m.min && scrollProgress < m.max
  );

  return (
    <AnimatePresence mode="wait">
      {scrollProgress < 0.035 && (
        <motion.div
          key="stage-0-standby"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={cardTransition}
          className="space-y-4 sm:space-y-5 text-left"
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

          <div className="pt-2 flex items-center gap-2 text-xs font-mono text-cyan-400 animate-pulse">
            <span>▼</span>
            <span>SCROLL DOWN TO COMMENCE ENGINE IGNITION</span>
          </div>
        </motion.div>
      )}

      {activeMilestone && (
        <motion.div
          key={activeMilestone.step}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={cardTransition}
          className={`p-6 sm:p-7 rounded-2xl bg-[#0e131f]/85 backdrop-blur-xl border ${activeMilestone.border} shadow-[0_8px_32px_rgba(0,0,0,0.6)] space-y-3.5 text-left`}
        >
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest">
            <span className={`flex items-center gap-1.5 ${activeMilestone.text}`}>
              <activeMilestone.Icon className="w-3.5 h-3.5 animate-pulse" />
              <span>{activeMilestone.step}</span>
            </span>
            <span className="text-white font-bold">{activeMilestone.time}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-space text-white font-bold leading-tight tracking-tight">
            {activeMilestone.title}
          </h2>

          <p className="text-sm sm:text-base text-slate-200 font-sans font-light leading-relaxed">
            {activeMilestone.desc}
          </p>

          <div className="pt-2 grid grid-cols-3 gap-2 border-t border-white/10">
            {activeMilestone.metrics.map((m, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-[#080e1a]/80 border border-white/10">
                <div className={`text-[10px] font-mono ${activeMilestone.text}`}>{m.label}</div>
                <div className="text-xs font-mono text-white font-medium">{m.value}</div>
              </div>
            ))}
          </div>

          <div className={`text-xs font-mono ${activeMilestone.text} pt-1 flex items-center gap-1.5`}>
            <span>▼</span>
            <span>{activeMilestone.hint}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
