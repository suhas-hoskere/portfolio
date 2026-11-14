import React from 'react';
import { ArrowUp } from 'lucide-react';

export const CosmicFooter: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="py-12 px-6 sm:px-12 border-t border-cream-200/10 relative z-10 text-cream-300/80 font-sans text-xs">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        
        {/* Left: Copyright & Name */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <span className="font-serif text-cream-100 text-sm font-semibold">
            Suhas Hoskere
          </span>
          <span className="hidden sm:inline text-cream-400/40">•</span>
          <span>B.Tech AI & ML, PES University Bangalore</span>
        </div>

        {/* Center: Cultural Homage */}
        <div className="font-kannada text-amber-300 text-sm tracking-wide">
          ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ, ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ
        </div>

        {/* Right: Return to top */}
        <button
          onClick={scrollToTop}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cream-200/15 hover:border-amber-400/50 text-cream-200 hover:text-white transition-all group"
        >
          <span>Return to top</span>
          <ArrowUp className="w-3.5 h-3.5 transform group-hover:-translate-y-0.5 transition-transform" />
        </button>

      </div>
    </footer>
  );
};
