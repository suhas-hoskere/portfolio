import React from 'react';

export interface TimelineWaypoint {
  id: string;
  label: string;
  sublabel?: string;
  kannada?: string;
  scrollFraction: number; // 0.0 to 1.0
  zPos: number;
}

export const WAYPOINTS: TimelineWaypoint[] = [
  { id: 'hero', label: 'Gargantua', sublabel: 'Singularity', scrollFraction: 0.0, zPos: 5 },
  { id: 'davanagere', label: '2020', sublabel: 'Davanagere', scrollFraction: 0.24, zPos: -10 },
  { id: 'bangalore', label: '2022', sublabel: 'PES University', scrollFraction: 0.31, zPos: -18 },
  { id: 'skills', label: 'Skills', sublabel: '10 Core Engines', scrollFraction: 0.52, zPos: -44 },
  { id: 'projects', label: 'Projects', sublabel: '4 Major Builds', scrollFraction: 0.78, zPos: -74 },
  { id: 'kannada', label: 'Culture', sublabel: 'ಕನ್ನಡ ಕೂಟ', kannada: 'ಕನ್ನಡ ಕೂಟ', scrollFraction: 0.93, zPos: -92 },
  { id: 'signal', label: 'Signal', sublabel: 'Transmission', scrollFraction: 0.99, zPos: -98 },
];

interface TimelineScrubberProps {
  scrollProgress: number; // 0.0 to 1.0
  onJumpTo: (fraction: number) => void;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  scrollProgress,
  onJumpTo,
}) => {
  // Find current waypoint
  let activeIndex = 0;
  for (let i = 0; i < WAYPOINTS.length; i++) {
    if (scrollProgress >= WAYPOINTS[i].scrollFraction - 0.04) {
      activeIndex = i;
    }
  }

  return (
    <aside
      aria-label="Cosmic Timeline Navigation"
      className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-end gap-3 select-none pointer-events-auto"
    >
      <div className="text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-cream-400/40 pr-2">
        Time Axis
      </div>

      <div className="relative flex flex-col gap-4 py-2 pr-1 border-r border-cream-200/10">
        {WAYPOINTS.map((wp, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={wp.id}
              onClick={() => onJumpTo(wp.scrollFraction)}
              className="group flex items-center gap-3 text-right cursor-pointer focus:outline-none transition-all"
            >
              <div
                className={`flex flex-col items-end transition-all duration-300 ${
                  isActive
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
                }`}
              >
                <span
                  className={`text-xs font-sans font-semibold tracking-wide ${
                    isActive ? 'text-amber-400' : 'text-cream-200'
                  }`}
                >
                  {wp.label}
                </span>
                {wp.sublabel && (
                  <span className="text-[10px] font-sans text-cream-400/70 font-light">
                    {wp.sublabel}
                  </span>
                )}
              </div>

              {/* Waypoint Indicator Dot */}
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-amber-400 ring-4 ring-amber-400/30 scale-125'
                      : 'bg-cream-400/30 group-hover:bg-cream-200 group-hover:scale-110'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
