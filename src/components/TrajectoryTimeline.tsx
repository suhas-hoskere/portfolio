import React from 'react';
import { 
  Compass, 
  GraduationCap, 
  MapPin, 
  Flame, 
  PenTool
} from 'lucide-react';

interface Waypoint {
  id: string;
  stageName: string;
  celestialZone: string;
  title: string;
  location: string;
  period: string;
  tag: string;
  icon: React.ElementType;
  description: string;
  keyTakeaways: string[];
}

const WAYPOINTS: Waypoint[] = [
  {
    id: 'pesu',
    stageName: 'STAGE 02 // ORBITAL INSERTION',
    celestialZone: 'Low Earth Orbit (LEO)',
    title: 'PES University, Electronic City Campus',
    location: 'Bangalore, Karnataka [12.8468° N, 77.6749° E]',
    period: 'Present',
    tag: 'B.Tech / AI & ML',
    icon: GraduationCap,
    description: 'Specializing in Artificial Intelligence and Machine Learning while architecting production-grade full-stack web platforms and desktop systems.',
    keyTakeaways: [
      'Research & deployment in LLM integration, Computer Vision, and Scikit-learn models',
      'Engineering low-latency voice telemetry with Whisper, Vosk, and Moonshine engines',
      'Building reactive interfaces with Next.js, React, and multi-threaded PyQt6 clients'
    ]
  },
  {
    id: 'kannada-koota',
    stageName: 'STAGE 03 // CULTURAL TRANSMISSION',
    celestialZone: 'Community & Heritage',
    title: 'Kannada Koota Club (ಕನ್ನಡ ಕೂಟ)',
    location: 'PES University EC Campus',
    period: 'Active Role',
    tag: 'Content Writer',
    icon: PenTool,
    description: 'Serving as a core Content Writer for the campus cultural body, crafting narratives that bridge technical innovation with regional heritage and community identity.',
    keyTakeaways: [
      'Authoring engaging editorial content, event narratives, and cultural communiqués',
      'Connecting literature and creative storytelling with modern student dialogues',
      'Fostering vibrant cultural resonance across campus communities'
    ]
  },
  {
    id: 'hackathon',
    stageName: 'STAGE 04 // THE CRUCIBLE',
    celestialZone: 'High-G Prototype Sprint',
    title: 'Competitive Engineering Hackathon',
    location: 'Bangalore Tech Circuit',
    period: 'Milestone',
    tag: 'Resilience & Speed',
    icon: Flame,
    description: 'Competed in high-pressure hackathon sprints against top collegiate teams. While we didn\'t take the podium, the intense pressure forged invaluable systems-building speed, debugging under fire, and relentless engineering grit.',
    keyTakeaways: [
      'Rapid prototype scaffolding from scratch in continuous 24-36 hour cycles',
      'Telemetry of failure: extracting decisive lessons to build stronger architectures',
      'Team synchronization and ruthless prioritization under strict deadlines'
    ]
  },
  {
    id: 'siddaganga',
    stageName: 'STAGE 01 // EARTH LAUNCHPAD',
    celestialZone: 'Surface Launchpad',
    title: 'Siddaganga Pre-University College',
    location: 'Davanagere, Karnataka',
    period: 'Pre-University (PU)',
    tag: 'Foundational Physics & Math',
    icon: MapPin,
    description: 'Completed foundational Pre-University education in Davanagere with focus on physical sciences, mathematics, and analytical logic—igniting the passion for computation and exploration.',
    keyTakeaways: [
      'Rigorous foundation in advanced mathematics, physics, and computational thinking',
      'Early self-directed curiosity into algorithmic problem-solving and programming logic',
      'The initial trajectory that led to Bangalore\'s technological frontier'
    ]
  },
];

export const TrajectoryTimeline: React.FC = () => {
  return (
    <section id="trajectory" className="py-24 relative border-t border-cyan-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 font-mono text-xs">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>FLIGHT TRAJECTORY // EARTH TO ORBIT</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Journey & Trajectory
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-light">
            From the Earth launchpad in Davanagere to the orbital research labs at PES University Bangalore.
          </p>
        </div>

        {/* Timeline Container */}
        <div className="relative border-l-2 border-cyan-500/30 ml-4 md:ml-32 space-y-12">
          {WAYPOINTS.map((wp) => {
            const Icon = wp.icon;
            return (
              <div
                key={wp.id}
                className="relative pl-8 md:pl-10 group"
              >
                {/* Node Beacon */}
                <div className="absolute -left-[17px] top-1.5 w-8 h-8 rounded-full bg-space-950 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.5)] group-hover:scale-110 transition-transform">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
                </div>

                {/* Waypoint Card */}
                <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyan-500/25 hover:border-cyan-400/50 transition-all duration-300">
                  
                  {/* Waypoint Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-bold tracking-wider">{wp.stageName}</span>
                      <span className="text-slate-600">//</span>
                      <span className="text-amber-300/90">{wp.celestialZone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-space-900 border border-cyan-500/30 text-cyan-300 text-[11px]">
                        {wp.tag}
                      </span>
                      <span className="text-slate-500">//</span>
                      <span className="text-slate-400">{wp.period}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mt-1">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {wp.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400/80 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{wp.location}</span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-slate-300 text-sm leading-relaxed font-light">
                    {wp.description}
                  </p>

                  {/* Highlights */}
                  <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
                    {wp.keyTakeaways.map((item, i) => (
                      <div key={i} className="text-xs text-slate-300 flex items-start gap-2 font-mono">
                        <span className="text-cyan-400 select-none">›</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
