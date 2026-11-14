import React, { useState, useEffect } from 'react';
import { Radio, Volume2, VolumeX, Menu, X, Satellite, Compass } from 'lucide-react';
import { cosmicAudio } from '../utils/audio';

export const NavbarHUD: React.FC = () => {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [timeString, setTimeString] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('en-IN', {
          hour12: false,
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleAudio = () => {
    const nextState = !audioEnabled;
    setAudioEnabled(nextState);
    cosmicAudio.enabled = nextState;
    if (nextState) {
      cosmicAudio.playLockSound();
    }
  };

  const navItems = [
    { label: 'MISSION', href: '#mission' },
    { label: 'ARSENAL', href: '#arsenal' },
    { label: 'PAYLOADS', href: '#payloads' },
    { label: 'TRAJECTORY', href: '#trajectory' },
    { label: 'COMM-LINK', href: '#contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-space-950/80 backdrop-blur-md border-b border-cyan-500/20 text-xs font-mono">
      {/* Top Telemetry ticker bar */}
      <div className="hidden lg:flex items-center justify-between px-6 py-1 bg-space-900/60 border-b border-cyan-900/40 text-[11px] text-cyan-400/80">
        <div className="flex items-center space-x-6">
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '12s' }} />
            <span>GROUND STATION: BENGALURU [12.8468° N, 77.6749° E]</span>
          </span>
          <span className="text-slate-600">//</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>TELEMETRY: STABLE (99.8%)</span>
          </span>
          <span className="text-slate-600">//</span>
          <span className="text-slate-400">NODE: PESU EC CAMPUS</span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-cyan-300/90 font-mono tracking-wider">{timeString}</span>
          <span className="text-slate-600">//</span>
          <button
            onClick={toggleAudio}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 transition-colors text-cyan-300"
            title="Toggle telemetry audio feedback"
          >
            {audioEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>AUDIO ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">AUDIO OFF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a
          href="#mission"
          onClick={() => cosmicAudio.playTelemetryChirp()}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all">
            <Satellite className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform" />
          </div>
          <div>
            <span className="font-bold tracking-widest text-slate-100 group-hover:text-cyan-300 transition-colors text-sm">
              SUHAS HOSKERE
            </span>
            <span className="block text-[10px] text-cyan-400/70 tracking-widest uppercase">
              AI/ML // FULL-STACK
            </span>
          </div>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-1 lg:space-x-3">
          {navItems.map((item, idx) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => cosmicAudio.playTelemetryChirp(600 + idx * 60)}
              className="px-3 py-1.5 rounded text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-all tracking-wider text-xs flex items-center gap-1.5"
            >
              <span className="text-cyan-500 text-[10px]">0{idx + 1}.</span>
              <span>{item.label}</span>
            </a>
          ))}
          <a
            href="#contact"
            onClick={() => cosmicAudio.playLockSound()}
            className="ml-3 px-3.5 py-1.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 hover:border-cyan-300 hover:shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all tracking-wider flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-300" />
            <span>UPLINK</span>
          </a>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleAudio}
            className="p-1.5 rounded border border-cyan-500/30 text-cyan-300"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/20"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-space-900/95 border-b border-cyan-500/30 px-6 py-4 space-y-3 font-mono">
          <div className="text-[11px] text-cyan-400/70 pb-2 border-b border-cyan-900/40">
            PESU EC CAMPUS // 12.8468° N, 77.6749° E
          </div>
          {navItems.map((item, idx) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => {
                setMobileMenuOpen(false);
                cosmicAudio.playTelemetryChirp();
              }}
              className="block py-2 text-slate-200 hover:text-cyan-300 text-sm tracking-wider flex items-center justify-between"
            >
              <span>{item.label}</span>
              <span className="text-cyan-500 text-xs">0{idx + 1}</span>
            </a>
          ))}
          <a
            href="#contact"
            onClick={() => {
              setMobileMenuOpen(false);
              cosmicAudio.playLockSound();
            }}
            className="block text-center py-2.5 mt-2 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-bold"
          >
            ESTABLISH UPLINK
          </a>
        </div>
      )}
    </header>
  );
};
