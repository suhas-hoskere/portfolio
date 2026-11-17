import React from 'react';
import { MapPin, Rocket, ExternalLink, Flame, Unlock, Waves } from 'lucide-react';
import { GithubIcon } from './Icons';
import { cosmicAudio } from './AudioEngine';

interface Stage00ScrollCardsProps {
  scrollProgress: number;
  onLaunch: () => void;
}

const MILESTONES = [
  {
    min: 0.035,
    max: 0.080,
    step: 'STEP 01 // MAIN ENGINE IGNITION',
    time: 'T-00:03',
    Icon: Flame,
    title: 'Dual Vikas Core & Twin S200 Boosters',
    desc: 'Liquid Vikas core stage and strap-on solid boosters ignite simultaneously at ground zero. Combustion chamber pressure climbs to nominal operating limits.',
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
    title: 'Service Arms Decouple & Retract',
    desc: 'Cryogenic liquid supply lines cleanly decouple. Primary umbilical service arms pivot clear 55° away from the fuselage as hold-down clamps disengage.',
    metrics: [
      { label: 'UMBILICAL', value: 'RETRACTED' },
      { label: 'CLAMPS', value: 'DISENGAGED' },
      { label: 'CLEARANCE', value: '55° SWING' },
    ],
    hint: 'SCROLL FURTHER FOR WATER DELUGE & TRENCH STEAM',
  },
  {
    min: 0.125,
    max: 0.170,
    step: 'STEP 03 // WATER DELUGE & TRENCH STEAM',
    time: 'T-00:00',
    Icon: Waves,
    title: 'Acoustic Suppression Flood',
    desc: 'Over 3,200 L/s of water deluge flood the launch flame trench, dampening acoustic energy and sending billowing white steam clouds across the apron.',
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
    title: 'Positive Liftoff & Tower Clearance',
    desc: 'Thrust-to-weight ratio exceeds unity. The heavy-lift vehicle clears the launch tower vertically into the sky, commencing ascent to low Earth orbit.',
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
}) => {
  const activeMilestone = MILESTONES.find(
    (m) => scrollProgress >= m.min && scrollProgress < m.max
  );

  if (scrollProgress < 0.035) {
    return (
      <div className="space-y-3.5 sm:space-y-5 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-zinc-950/95 border border-white/25 text-white text-[11px] font-mono font-medium tracking-widest uppercase flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-zinc-300" />
            <span>INDIA LAUNCH COMPLEX // 00</span>
          </span>
          <span className="text-[11px] font-mono text-zinc-400">
            Karnataka &amp; Sriharikota
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-[clamp(2rem,5vw,4.75rem)] font-space font-bold text-white leading-[0.98] tracking-tight">
            Suhas Hoskere
          </h1>
          <div className="font-kannada text-sm sm:text-base font-medium text-zinc-300 tracking-wide">
            ಸುಹಾಸ್ ಹೊಸಕೆರೆ · ಬೆಂಗಳೂರು
          </div>
        </div>

        <p className="text-xs sm:text-base text-zinc-300 font-sans font-light leading-relaxed max-w-md">
          B.Tech in Artificial Intelligence &amp; Machine Learning at PES University, Bangalore. Architecting intelligent systems, voice pipelines, and deep software.
        </p>

        <div className="pt-1 flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              cosmicAudio.playStagingSound();
              onLaunch();
            }}
            className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg bg-white hover:bg-zinc-200 text-black font-space font-bold text-xs tracking-wider uppercase flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Rocket className="w-4 h-4 text-black" />
            <span>Ignite &amp; Lift Off</span>
          </button>

          <a
            href="https://github.com/suhashoskere"
            target="_blank"
            rel="noreferrer"
            onClick={() => cosmicAudio.playTelemetryChirp(1200, 0.05)}
            className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-zinc-950/95 hover:bg-zinc-900 border border-white/20 hover:border-white/50 text-zinc-200 hover:text-white font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <GithubIcon className="w-4 h-4" />
            <span className="hidden xs:inline">github.com/suhashoskere</span>
            <span className="xs:hidden">GitHub</span>
            <ExternalLink className="w-3 h-3 text-zinc-400" />
          </a>
        </div>

        <div className="pt-1 flex items-center gap-2 text-[11px] font-mono text-zinc-400">
          <span>▼</span>
          <span>SCROLL DOWN TO COMMENCE ENGINE IGNITION</span>
        </div>
      </div>
    );
  }

  if (!activeMilestone) return null;

  return (
    <div className="p-5 sm:p-6 rounded-xl bg-[#09090b]/95 border border-white/20 space-y-3 text-left">
      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-zinc-300">
        <span className="flex items-center gap-1.5">
          <activeMilestone.Icon className="w-3.5 h-3.5 text-white" />
          <span>{activeMilestone.step}</span>
        </span>
        <span className="text-white font-bold">{activeMilestone.time}</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-space text-white font-bold leading-tight tracking-tight">
        {activeMilestone.title}
      </h2>

      <p className="text-xs sm:text-sm text-zinc-300 font-sans font-light leading-relaxed">
        {activeMilestone.desc}
      </p>

      <div className="pt-2 grid grid-cols-3 gap-2 border-t border-white/10">
        {activeMilestone.metrics.map((m, idx) => (
          <div key={idx} className="p-2 rounded-lg bg-black border border-white/15">
            <div className="text-[10px] font-mono text-zinc-400">{m.label}</div>
            <div className="text-[11px] sm:text-xs font-mono text-white font-medium truncate">
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div className="text-[11px] font-mono text-zinc-400 pt-0.5 flex items-center gap-1.5">
        <span>▼</span>
        <span>{activeMilestone.hint}</span>
      </div>
    </div>
  );
};
