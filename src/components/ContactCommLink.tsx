import React, { useState } from 'react';
import { 
  Radio, 
  Send, 
  Mail, 
  Copy, 
  Check, 
  FileText, 
  Terminal,
  ShieldCheck,
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from './Icons';
import { cosmicAudio } from '../utils/audio';

export const ContactCommLink: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [formData, setFormData] = useState({
    sender: '',
    email: '',
    frequency: 'GENERAL TELEMETRY',
    payload: '',
  });

  const emailAddress = 'suhas.hoskere@example.com'; // User can customize this

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailAddress);
    setCopied(true);
    cosmicAudio.playTelemetryChirp(950);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cosmicAudio.playLockSound();
    setFormSent(true);
    setTimeout(() => {
      setFormSent(false);
      setFormData({ sender: '', email: '', frequency: 'GENERAL TELEMETRY', payload: '' });
    }, 4000);
  };

  return (
    <section id="contact" className="py-24 relative border-t border-cyan-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 font-mono text-xs">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>GROUND CONTROL // DIRECT TRANSMISSION</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Establish Uplink
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-light">
            Have a project, collaboration, research inquiry, or opportunity? Transmit your telemetry below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Direct Comms & Channels */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyan-500/20 space-y-6">
              <div>
                <span className="font-mono text-xs text-cyan-400 tracking-wider uppercase block mb-1">
                  COMM-CHANNELS // ACTIVE BEACONS
                </span>
                <h3 className="text-2xl font-bold text-white">Direct Coordinates</h3>
                <p className="text-slate-400 text-sm mt-1">
                  Always open for technical collaboration, AI research discussions, and open-source contributions.
                </p>
              </div>

              {/* Coordinates block */}
              <div className="p-4 rounded-xl bg-space-950/70 border border-cyan-900/40 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span>GROUND STATION:</span>
                  <span className="text-white font-semibold">Bengaluru, India</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>COORDINATES:</span>
                  <span className="text-cyan-300">12.8468° N, 77.6749° E</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>PRIMARY LINK:</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    ONLINE
                  </span>
                </div>
              </div>

              {/* Action Links */}
              <div className="space-y-3 font-mono text-xs">
                {/* Email Copy Box */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-space-900 border border-slate-800 hover:border-cyan-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-cyan-400" />
                    <span className="text-slate-300 select-all truncate max-w-[200px]">
                      {emailAddress}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyEmail}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 transition-all"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>COPY</span>
                      </>
                    )}
                  </button>
                </div>

                {/* GitHub Link */}
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => cosmicAudio.playTelemetryChirp()}
                  className="flex items-center justify-between p-3 rounded-xl bg-space-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <GithubIcon className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span>GITHUB REPOSITORIES</span>
                  </div>
                  <span className="text-cyan-400 text-[11px]">VISIT ›</span>
                </a>

                {/* LinkedIn Link */}
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => cosmicAudio.playTelemetryChirp()}
                  className="flex items-center justify-between p-3 rounded-xl bg-space-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <LinkedinIcon className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span>LINKEDIN NETWORK</span>
                  </div>
                  <span className="text-cyan-400 text-[11px]">CONNECT ›</span>
                </a>

                {/* Resume Download / View */}
                <a
                  href="#resume"
                  onClick={(e) => {
                    e.preventDefault();
                    cosmicAudio.playLockSound();
                    alert('Resume docket will link to your downloadable PDF!');
                  }}
                  className="flex items-center justify-between p-3 rounded-xl bg-cyan-500/10 border border-cyan-400/30 hover:border-cyan-400 text-cyan-300 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold">MISSION DOSSIER (RESUME)</span>
                  </div>
                  <span className="text-[11px] font-bold">DOWNLOAD PDF</span>
                </a>
              </div>

            </div>

          </div>

          {/* Right Column: High-Tech Transmission Console */}
          <div className="lg:col-span-7">
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyan-500/25">
              
              <div className="flex items-center justify-between border-b border-cyan-950 pb-4 mb-6 font-mono text-xs text-slate-400">
                <div className="flex items-center gap-2 text-cyan-300">
                  <Terminal className="w-4 h-4" />
                  <span>TRANSMISSION_UPLINK.SH</span>
                </div>
                <div className="text-[10px] text-cyan-400/80">ENCRYPTION: 256-BIT COSMIC</div>
              </div>

              {formSent ? (
                <div className="p-8 text-center space-y-4 font-mono">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-bold text-white">TRANSMISSION DISPATCHED</h4>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto">
                    Payload received by Ground Station Bangalore. Telemetry response will be transmitted shortly.
                  </p>
                  <div className="text-xs text-cyan-400 pt-2">STATUS: ACK_RECEIVED (200 OK)</div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 mb-1.5 font-mono">IDENTIFIER (NAME)</label>
                      <input
                        type="text"
                        required
                        placeholder="Dr. Vikram / Flight Director"
                        value={formData.sender}
                        onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-space-950 border border-slate-700 focus:border-cyan-400 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1.5 font-mono">RETURN FREQUENCY (EMAIL)</label>
                      <input
                        type="email"
                        required
                        placeholder="command@horizon.space"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-space-950 border border-slate-700 focus:border-cyan-400 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1.5 font-mono">TRANSMISSION FREQUENCY</label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-space-950 border border-slate-700 focus:border-cyan-400 text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors"
                    >
                      <option value="GENERAL TELEMETRY">GENERAL INQUIRY // COLLABORATION</option>
                      <option value="AI / VOICE PROJECT">AI / VOICE PIPELINE PROJECT</option>
                      <option value="FULL-STACK PLATFORM">FULL-STACK WEB / MOBILE ARCHITECTURE</option>
                      <option value="OPEN SOURCE SPRINT">OPEN SOURCE CONTRIBS / HACKATHON</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1.5 font-mono">PAYLOAD MESSAGE</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Input flight parameters, project specifications, or collaboration details..."
                      value={formData.payload}
                      onChange={(e) => setFormData({ ...formData, payload: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-space-950 border border-slate-700 focus:border-cyan-400 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)] flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>DISPATCH TRANSMISSION</span>
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
