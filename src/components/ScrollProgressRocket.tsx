import React, { useEffect, useState } from 'react';
import { Rocket } from 'lucide-react';

const SECTIONS = [
  { id: 'hero', name: 'Origin', color: 'rgba(139, 92, 246, 0.2)' },
  { id: 'about', name: 'Earth', color: 'rgba(56, 189, 248, 0.2)' },
  { id: 'skills', name: 'Orbit', color: 'rgba(245, 158, 11, 0.2)' },
  { id: 'projects', name: 'Galaxy', color: 'rgba(236, 72, 153, 0.2)' },
  { id: 'timeline', name: 'Flight Path', color: 'rgba(99, 102, 241, 0.2)' },
  { id: 'contact', name: 'Deep Space', color: 'rgba(249, 115, 22, 0.2)' },
];

export const ScrollProgressRocket: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll <= 0) return;
      const progress = Math.min(Math.max(window.scrollY / totalScroll, 0), 1);
      setScrollProgress(progress);

      // Determine active section based on scroll position
      const scrollY = window.scrollY + window.innerHeight * 0.35;
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const sec = document.getElementById(SECTIONS[i].id);
        if (sec && sec.offsetTop <= scrollY) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col items-center pointer-events-none select-none">
      
      {/* Label indicator */}
      <div className="mb-3 text-[10px] font-sans tracking-widest text-cream-300/70 uppercase">
        {SECTIONS.find((s) => s.id === activeSection)?.name || 'Cosmos'}
      </div>

      {/* Track Line */}
      <div className="relative w-1 h-44 rounded-full bg-cream-50/10 overflow-hidden">
        {/* Glowing progress fill */}
        <div
          className="w-full bg-gradient-to-b from-nebula-violet via-amber-400 to-nebula-orange rounded-full transition-all duration-100 ease-out shadow-[0_0_8px_#f97316]"
          style={{ height: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* Traveling Rocket */}
      <div
        className="absolute top-8 transition-transform duration-100 ease-out"
        style={{
          transform: `translateY(${scrollProgress * 176}px)`,
        }}
      >
        <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-space-900 border border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.6)]">
          <Rocket className="w-3.5 h-3.5 text-amber-300 rotate-45 transform" />
        </div>
      </div>
    </div>
  );
};
