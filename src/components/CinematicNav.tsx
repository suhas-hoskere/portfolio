import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { MagneticButton } from './CustomCursor';

export const CinematicNav: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Skills', href: '#skills' },
    { label: 'Projects', href: '#projects' },
    { label: 'Journey', href: '#timeline' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 font-sans ${
        scrolled
          ? 'bg-space-950/80 backdrop-blur-md py-4 border-b border-cream-200/10'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 sm:px-12 flex items-center justify-between">
        
        {/* Brand Name */}
        <a href="#hero" className="flex items-center gap-2 group">
          <span className="font-serif text-2xl font-bold text-cream-50 group-hover:text-amber-300 transition-colors">
            Suhas Hoskere
          </span>
          <span className="font-kannada text-xs text-amber-400 font-medium px-2 py-0.5 rounded-full bg-space-900 border border-amber-400/25">
            ಸುಹಾಸ್
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-cream-200 font-medium">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-amber-300 transition-colors"
            >
              {link.label}
            </a>
          ))}

          <MagneticButton>
            <a
              href="#contact"
              className="px-5 py-2.5 rounded-full bg-cream-50 hover:bg-white text-space-950 font-semibold text-xs tracking-wide transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Get in touch</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </MagneticButton>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-full border border-cream-200/20 text-cream-200 hover:text-white"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-space-950/95 border-b border-cream-200/10 px-8 py-6 space-y-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-lg font-serif text-cream-100 hover:text-amber-300 transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-center py-3 rounded-full bg-amber-400 text-space-950 font-sans font-semibold text-sm"
          >
            Get in touch
          </a>
        </div>
      )}
    </nav>
  );
};
