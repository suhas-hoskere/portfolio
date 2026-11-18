import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Terminal,
  X,
  CornerDownLeft,
  ArrowUpRight,
  ExternalLink,
  Copy,
  Check,
  Download,
  Lock,
  Sparkles,
} from 'lucide-react';
import { cosmicAudio } from './AudioEngine';
import {
  EDUCATION,
  PERSONAL_QA,
  PROFILE,
  PROJECTS,
  SKILL_GROUPS,
  SOCIAL_LINKS,
  type ProjectData,
} from '../data/portfolioData';
import {
  CLI_AUTOCOMPLETE_TERMS,
  STARTER_PROMPTS,
  getTelemetryStageName,
  runMadhvaQuery,
  type MadhvaKind,
  type MadhvaReply,
} from '../utils/madhvaEngine';
import { GithubIcon, InstagramIcon, LinkedinIcon } from './Icons';

interface MissionTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  scrollProgress: number;
  activeStageIndex: number;
  cameraMode: 'CINEMATIC' | 'BOOSTER' | 'CHASE';
  onSetCameraMode: (mode: 'CINEMATIC' | 'BOOSTER' | 'CHASE') => void;
  blueprintMode: boolean;
  onToggleBlueprint: () => void;
  audioActive: boolean;
  onSetAudio: (enabled: boolean) => void;
  onJumpToStage: (stageIndex: number) => void;
  onSelectProject: (project: ProjectData) => void;
  onStartTour: () => void;
}

interface TerminalEntry {
  id: string;
  query: string;
  reply: MadhvaReply;
  time: string;
  animate?: boolean;
}

const VIRTUAL_FILES = [
  { name: 'about.md', cmd: 'cat about.md', kind: 'file' },
  { name: 'writing.md', cmd: 'cat writing.md', kind: 'file' },
  { name: 'projects/', cmd: 'projects', kind: 'dir' },
  { name: 'skills.json', cmd: 'cat skills.json', kind: 'file' },
  { name: 'education.log', cmd: 'cat education.log', kind: 'file' },
  { name: 'contact.txt', cmd: 'cat contact.txt', kind: 'file' },
  { name: 'resume.pdf', cmd: 'resume', kind: 'file' },
];

const INITIAL_WELCOME: MadhvaReply = {
  kind: 'greeting',
  headline: 'MADHVA // READY',
  lines: [
    `ನಮಸ್ಕಾರ! I'm Madhva — ${PROFILE.name}'s portfolio assistant.`,
    `Ask me anything in plain English or Kannada (even follow-ups like "tell me more" or "open it"), or run CLI commands like "neofetch", "ls", "goto writing", or "help".`,
  ],
  suggestions: STARTER_PROMPTS,
};

/** Fast crisp typewriter headline so Madhva feels alive without ever slowing readers down */
const TypewriterHeadline: React.FC<{ text: string; animate?: boolean }> = ({ text, animate }) => {
  const [shown, setShown] = useState(() => {
    if (!animate) return text.length;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return text.length;
    }
    return 0;
  });

  useEffect(() => {
    if (!animate || shown >= text.length) return;
    const step = Math.max(1, Math.ceil(text.length / 16));
    const timer = window.setTimeout(() => {
      setShown((prev) => Math.min(prev + step, text.length));
    }, 16);
    return () => window.clearTimeout(timer);
  }, [animate, shown, text]);

  return (
    <span>
      {text.slice(0, shown)}
      {shown < text.length && <span className="inline-block ml-0.5 animate-pulse">▍</span>}
    </span>
  );
};

export const MissionTerminalModal: React.FC<MissionTerminalModalProps> = ({
  isOpen,
  onClose,
  scrollProgress,
  activeStageIndex,
  cameraMode,
  onSetCameraMode,
  blueprintMode,
  onToggleBlueprint,
  audioActive,
  onSetAudio,
  onJumpToStage,
  onSelectProject,
  onStartTour,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyCursor, setHistoryCursor] = useState<number>(-1);
  const [entries, setEntries] = useState<TerminalEntry[]>(() => [
    {
      id: 'madhva-init',
      query: 'madhva --init',
      reply: INITIAL_WELCOME,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      animate: false,
    },
  ]);

  const lastKindRef = useRef<MadhvaKind | null>('greeting');
  const lastProjectIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Lock background page scroll while Madhva CLI is open + focus input
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const triggerResumeDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = PROFILE.resumePath;
    a.download = PROFILE.resumeFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const copyEmailToClipboard = useCallback(() => {
    cosmicAudio.playTelemetryChirp(1320, 0.04);
    navigator.clipboard?.writeText(PROFILE.email);
    setCopiedEmail(true);
    window.setTimeout(() => setCopiedEmail(false), 1800);
  }, []);

  const submitQuery = useCallback(
    (raw: string) => {
      const cleaned = raw.trim();
      if (!cleaned) return;

      cosmicAudio.playTelemetryChirp(1220, 0.04);
      setCmdHistory((prev) => (prev[prev.length - 1] === cleaned ? prev : [...prev.slice(-30), cleaned]));
      setHistoryCursor(-1);
      setInputVal('');

      const reply = runMadhvaQuery(cleaned, {
        scrollProgress,
        activeStageIndex,
        cameraMode,
        blueprintMode,
        audioActive,
        lastKind: lastKindRef.current,
        lastProjectId: lastProjectIdRef.current,
      });

      const effect = reply.sideEffect;
      if (effect) {
        switch (effect.type) {
          case 'clear':
            setEntries([]);
            lastKindRef.current = null;
            lastProjectIdRef.current = null;
            return;
          case 'exit':
            onClose();
            return;
          case 'copy-email':
            copyEmailToClipboard();
            break;
          case 'resume':
            triggerResumeDownload();
            break;
          case 'open-url':
            window.open(effect.url, '_blank', 'noopener,noreferrer');
            break;
          case 'camera':
            onSetCameraMode(effect.mode);
            break;
          case 'blueprint':
            onToggleBlueprint();
            break;
          case 'audio':
            if (effect.state === 'on') onSetAudio(true);
            else if (effect.state === 'off') onSetAudio(false);
            else onSetAudio(!audioActive);
            break;
          case 'goto':
            onClose();
            window.setTimeout(() => onJumpToStage(effect.stageIndex), 60);
            return;
          case 'open-project':
            lastProjectIdRef.current = effect.project.id;
            onClose();
            window.setTimeout(() => onSelectProject(effect.project), 60);
            return;
          case 'tour':
            onClose();
            window.setTimeout(() => onStartTour(), 80);
            return;
        }
      }

      lastKindRef.current = reply.kind;
      if (reply.project) {
        lastProjectIdRef.current = reply.project.id;
      }

      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setEntries((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          query: cleaned,
          reply,
          time,
          animate: true,
        },
      ]);
    },
    [
      activeStageIndex,
      audioActive,
      blueprintMode,
      cameraMode,
      copyEmailToClipboard,
      onClose,
      onJumpToStage,
      onSelectProject,
      onSetAudio,
      onSetCameraMode,
      onStartTour,
      onToggleBlueprint,
      scrollProgress,
      triggerResumeDownload,
    ]
  );

  // Inline Tab autocomplete suggestion
  const trimmedInput = inputVal.trimStart().toLowerCase();
  const tabMatch =
    trimmedInput.length >= 2
      ? CLI_AUTOCOMPLETE_TERMS.find((t) => t.startsWith(trimmedInput) && t !== trimmedInput) ?? null
      : null;

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && tabMatch) {
      e.preventDefault();
      setInputVal(tabMatch);
    } else if (e.key === 'ArrowUp') {
      if (cmdHistory.length === 0) return;
      e.preventDefault();
      const nextIdx = historyCursor === -1 ? cmdHistory.length - 1 : Math.max(0, historyCursor - 1);
      setHistoryCursor(nextIdx);
      setInputVal(cmdHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      if (historyCursor === -1) return;
      e.preventDefault();
      if (historyCursor >= cmdHistory.length - 1) {
        setHistoryCursor(-1);
        setInputVal('');
      } else {
        const nextIdx = historyCursor + 1;
        setHistoryCursor(nextIdx);
        setInputVal(cmdHistory[nextIdx]);
      }
    }
  };

  if (!isOpen) return null;

  const renderProjectCards = (list: ProjectData[], showPrivateBlock: boolean) => (
    <div className="space-y-2.5 text-xs font-mono">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {list.map((p) => (
          <div
            key={p.id}
            className="p-2.5 rounded-lg bg-black border border-white/15 flex flex-col justify-between gap-2"
          >
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-white font-bold">{p.name}</span>
                <span className="text-[10px] text-zinc-400">{p.badge}</span>
              </div>
              <p className="text-[11px] text-zinc-300 mt-0.5">{p.title}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/10">
              <button
                type="button"
                onClick={() => submitQuery(`open ${p.name.toLowerCase()}`)}
                className="px-2 py-0.5 rounded bg-white text-black font-bold text-[10px] hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Inspect
              </button>
              {p.demo && (
                <a
                  href={p.demo}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-0.5 rounded border border-white/25 hover:border-white text-zinc-200 hover:text-white text-[10px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Website</span>
                  <ArrowUpRight className="w-2.5 h-2.5" />
                </a>
              )}
              <a
                href={p.github}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-0.5 rounded border border-white/20 hover:border-white text-zinc-300 hover:text-white text-[10px] inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>GitHub</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {showPrivateBlock && (
        <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/15 text-[11px] text-zinc-300 flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
          <span>
            <span className="text-white font-semibold">Private Repositories (Active R&amp;D):</span>{' '}
            Voice pipelines using Neural TTS, Moonshine Voices &amp; Whisper engines plus unreleased AI/desktop builds. Walkthroughs available on request.
          </span>
        </div>
      )}
    </div>
  );

  const renderContactActions = (includeResume = false) => (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={PROFILE.gmailComposeUrl}
        target="_blank"
        rel="noreferrer"
        className="px-3 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-black font-bold text-[11px] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <span>{PROFILE.email}</span>
        <ExternalLink className="w-3 h-3" />
      </a>
      <button
        type="button"
        onClick={copyEmailToClipboard}
        className="px-2.5 py-1.5 rounded-md bg-black border border-white/25 hover:border-white text-zinc-200 hover:text-white text-[11px] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        {copiedEmail ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        <span>{copiedEmail ? 'Copied' : 'Copy Email'}</span>
      </button>
      {includeResume && (
        <button
          type="button"
          onClick={triggerResumeDownload}
          className="px-2.5 py-1.5 rounded-md bg-black border border-white/25 hover:border-white text-zinc-200 hover:text-white text-[11px] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3 h-3" />
          <span>Resume</span>
        </button>
      )}
      <a
        href={SOCIAL_LINKS.github.url}
        target="_blank"
        rel="noreferrer"
        className="px-2.5 py-1.5 rounded-md bg-black border border-white/20 hover:border-white text-zinc-200 hover:text-white text-[11px] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <GithubIcon className="w-3 h-3" />
        <span>GitHub</span>
      </a>
      <a
        href={SOCIAL_LINKS.linkedin.url}
        target="_blank"
        rel="noreferrer"
        className="px-2.5 py-1.5 rounded-md bg-black border border-white/20 hover:border-white text-zinc-200 hover:text-white text-[11px] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <LinkedinIcon className="w-3 h-3" />
        <span>LinkedIn</span>
      </a>
      <a
        href={SOCIAL_LINKS.instagramPersonal.url}
        target="_blank"
        rel="noreferrer"
        className="px-2.5 py-1.5 rounded-md bg-black border border-white/20 hover:border-white text-zinc-200 hover:text-white text-[11px] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <InstagramIcon className="w-3 h-3" />
        <span>{SOCIAL_LINKS.instagramPersonal.label}</span>
      </a>
    </div>
  );

  const renderReplyBody = (reply: MadhvaReply) => {
    switch (reply.kind) {
      case 'help':
        return (
          <div className="space-y-3 text-xs font-mono text-zinc-300">
            <p className="text-zinc-200">
              Ask any question naturally (e.g. &quot;What does he write about?&quot;, &quot;Is he open to internships?&quot;,
              &quot;Which projects are live?&quot;, &quot;Does he know Whisper?&quot;) or run a CLI command:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-zinc-400">
              <div><span className="text-white font-semibold">about</span> — Writer &amp; AIML profile</div>
              <div><span className="text-white font-semibold">writing</span> — Love, pain, Kannada Koota &amp; IG</div>
              <div><span className="text-white font-semibold">projects</span> — Public repos + Private R&amp;D</div>
              <div><span className="text-white font-semibold">open &lt;name&gt;</span> — Inspect project modal</div>
              <div><span className="text-white font-semibold">skills</span> — Stack &amp; voice pipelines</div>
              <div><span className="text-white font-semibold">education</span> — Diddige → PU → PESU</div>
              <div><span className="text-white font-semibold">goals</span> — Startup vision &amp; why AI/ML</div>
              <div><span className="text-white font-semibold">internships</span> — Online/free-time availability</div>
              <div><span className="text-white font-semibold">contact</span> / <span className="text-white font-semibold">copy email</span> — Direct links</div>
              <div><span className="text-white font-semibold">goto &lt;section&gt;</span> — Jump to any stage</div>
              <div><span className="text-white font-semibold">tour</span> — Hands-free auto-scroll journey</div>
              <div><span className="text-white font-semibold">audio on|off</span> — Ambient soundtrack</div>
              <div><span className="text-white font-semibold">neofetch</span> / <span className="text-white font-semibold">ls</span> — Profile card &amp; files</div>
              <div><span className="text-white font-semibold">camera [mode]</span> / <span className="text-white font-semibold">blueprint</span> — Flight modes</div>
              <div><span className="text-white font-semibold">resume</span> — Download resume PDF</div>
              <div><span className="text-white font-semibold">clear</span> / <span className="text-white font-semibold">exit</span> — Clear or close Madhva</div>
            </div>
          </div>
        );

      case 'neofetch':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-center text-xs font-mono">
            <pre className="text-[10px] leading-[1.2] text-white/90 select-none bg-black/70 border border-white/15 rounded-lg px-3 py-2.5">
{`      /\\
     /  \\    MADHVA
    | () |   ------
    | || |   SUHAS
   /| || |\\  BOT CLI
  /_| || |_\\
    /_||_\\
     *  *`}
            </pre>
            <div className="space-y-1 text-[11px] text-zinc-300">
              <p className="text-white font-bold font-kannada text-sm">
                {PROFILE.kannadaName}{' '}
                <span className="font-mono text-xs text-zinc-400 font-normal">({PROFILE.name})</span>
              </p>
              <p><span className="text-zinc-500">ROLE:</span> Writer · AIML Student · Open Source</p>
              <p><span className="text-zinc-500">WRITING:</span> Love &amp; Pain · Kannada Koota Club</p>
              <p><span className="text-zinc-500">GOAL:</span> Building a Startup</p>
              <p><span className="text-zinc-500">CAMPUS:</span> PES University, EC Campus (2025–2029)</p>
              <p><span className="text-zinc-500">VOICE AI:</span> Neural TTS · Moonshine · Whisper</p>
              <p><span className="text-zinc-500">INTERN:</span> Open (Online / Free Time with College)</p>
              <p><span className="text-zinc-500">STAGE:</span> 0{activeStageIndex} // {getTelemetryStageName(activeStageIndex)} ({(scrollProgress * 100).toFixed(0)}%)</p>
            </div>
          </div>
        );

      case 'ls':
        return (
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {VIRTUAL_FILES.map((f) => (
              <button
                key={f.name}
                type="button"
                onClick={() => submitQuery(f.cmd)}
                className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white hover:text-black border border-white/15 text-zinc-200 transition-colors cursor-pointer"
              >
                {f.kind === 'dir' ? <span className="font-bold">{f.name}</span> : f.name}
              </button>
            ))}
          </div>
        );

      case 'writing':
        return (
          <div className="space-y-3 text-xs font-mono text-zinc-300">
            <p className="leading-relaxed text-zinc-200">{PERSONAL_QA.writingThemes}</p>
            <p className="leading-relaxed text-zinc-400">
              He is also a <span className="text-white font-semibold">Content Writer at Kannada Koota Club</span>{' '}
              (PES University, Electronic City Campus). Read his pages directly:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href={SOCIAL_LINKS.instagramKannada.url}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-lg bg-black border border-white/20 hover:border-white flex items-center justify-between gap-2 transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-[10px] text-zinc-400 uppercase flex items-center gap-1.5">
                    <InstagramIcon className="w-3 h-3 text-white" />
                    <span>Kannada Writings</span>
                  </div>
                  <div className="text-white font-semibold truncate">{SOCIAL_LINKS.instagramKannada.label}</div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              </a>

              <a
                href={SOCIAL_LINKS.instagramEnglishTech.url}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-lg bg-black border border-white/20 hover:border-white flex items-center justify-between gap-2 transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-[10px] text-zinc-400 uppercase flex items-center gap-1.5">
                    <InstagramIcon className="w-3 h-3 text-white" />
                    <span>English &amp; Tech</span>
                  </div>
                  <div className="text-white font-semibold truncate">{SOCIAL_LINKS.instagramEnglishTech.label}</div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              </a>
            </div>
          </div>
        );

      case 'projects':
        return renderProjectCards(PROJECTS, true);

      case 'filtered-projects':
        return (
          <div className="space-y-2.5 text-xs font-mono text-zinc-300">
            {reply.lines?.map((l, i) => (
              <p key={i} className="text-zinc-200">{l}</p>
            ))}
            {reply.filteredProjects && renderProjectCards(reply.filteredProjects, false)}
          </div>
        );

      case 'project-detail':
        if (!reply.project) return null;
        return (
          <div className="space-y-2.5 text-xs font-mono text-zinc-300">
            {reply.lines && reply.lines.length > 0 ? (
              <ul className="space-y-1">
                {reply.lines.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-white shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="leading-relaxed">{reply.project.description}</p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {reply.project.tech.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded bg-white/5 border border-white/15 text-[10px] text-zinc-200"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.setTimeout(() => onSelectProject(reply.project!), 60);
                }}
                className="px-2.5 py-1 rounded bg-white hover:bg-zinc-200 text-black font-bold text-[11px] transition-colors cursor-pointer"
              >
                Open Full Specs
              </button>
              {reply.project.demo && (
                <a
                  href={reply.project.demo}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded border border-white/30 hover:border-white text-white text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Visit Website</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              )}
              <a
                href={reply.project.github}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded border border-white/25 hover:border-white text-zinc-200 hover:text-white text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <GithubIcon className="w-3 h-3" />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        );

      case 'skills':
        return (
          <div className="space-y-2.5 text-xs font-mono">
            {SKILL_GROUPS.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="text-[10px] text-zinc-400 tracking-wider">{group.label}</div>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="px-2 py-0.5 rounded bg-black border border-white/15 text-[11px] text-zinc-200"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'education':
        return (
          <div className="space-y-2 text-xs font-mono">
            {EDUCATION.map((edu) => (
              <div key={edu.institution} className="p-2.5 rounded-lg bg-black border border-white/15 space-y-0.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-400">
                  <span>{edu.period}</span>
                  <span>{edu.level}</span>
                </div>
                <div className="text-white font-semibold">{edu.institution}</div>
                <div className="text-[11px] text-zinc-400">{edu.location} — {edu.detail}</div>
              </div>
            ))}
          </div>
        );

      case 'availability':
        return (
          <div className="space-y-2.5 text-xs font-mono text-zinc-300 leading-relaxed">
            {reply.lines?.map((l, i) => (
              <p key={i} className={i === 0 ? 'text-zinc-200' : 'text-zinc-400'}>{l}</p>
            ))}
            {renderContactActions(true)}
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-2.5 text-xs font-mono text-zinc-300">
            <p>
              Open to online internships alongside college, open-source collaborations, AI/ML &amp; software
              projects, and creative writing conversations.
            </p>
            {renderContactActions(false)}
          </div>
        );

      case 'resume':
        return (
          <div className="space-y-2 text-xs font-mono text-zinc-300">
            {reply.lines?.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
            <button
              type="button"
              onClick={triggerResumeDownload}
              className="px-3 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-black font-bold text-[11px] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {PROFILE.resumeFilename}</span>
            </button>
          </div>
        );

      case 'telemetry':
        return (
          <div className="space-y-1 text-xs font-mono text-zinc-300">
            <p>SCROLL PROGRESS: <span className="text-white">{(scrollProgress * 100).toFixed(1)}%</span></p>
            <p>ACTIVE STAGE: <span className="text-white">0{activeStageIndex} // {getTelemetryStageName(activeStageIndex)}</span></p>
            <p>AUDIO ENGINE: <span className="text-white">{audioActive ? 'ACTIVE' : 'MUTED'}</span></p>
            <p>CAMERA MODE: <span className="text-white">{cameraMode}</span></p>
            <p>WIREFRAME MODE: <span className="text-white">{blueprintMode ? 'ENABLED' : 'DISABLED'}</span></p>
          </div>
        );

      default:
        return (
          <div className="space-y-1.5 text-xs font-mono text-zinc-300 leading-relaxed">
            {reply.lines?.map((line, i) => (
              <p key={i} className={i === 0 ? 'text-zinc-200' : 'text-zinc-400'}>
                {line}
              </p>
            ))}
          </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 pointer-events-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-modal-in w-full max-w-3xl h-[82vh] max-h-[660px] rounded-2xl bg-[#09090b] border border-white/25 flex flex-col overflow-hidden font-mono shadow-[0_24px_70px_rgba(0,0,0,0.95)]"
      >
        {/* Terminal Header */}
        <div className="px-4 py-3 bg-black border-b border-white/15 flex items-center justify-between gap-2 select-none">
          <div className="flex items-center gap-2 text-xs text-white min-w-0">
            <Terminal className="w-4 h-4 text-white shrink-0" />
            <span className="font-bold tracking-wider truncate">MADHVA // ASSISTANT CLI</span>
            <span className="px-1.5 py-0.5 rounded bg-white text-[10px] text-black font-bold shrink-0">
              READY
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-zinc-400 hidden sm:inline">
              TAB COMPLETE · ↑↓ HISTORY · ESC
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white flex items-center justify-center border border-white/15 transition-colors cursor-pointer"
              aria-label="Close Madhva CLI"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Conversation & Command Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 select-text">
          {entries.length === 0 && (
            <div className="space-y-3 py-4 text-xs text-zinc-400">
              <p>Terminal cleared. Ask Madhva anything about {PROFILE.name} or pick a prompt:</p>
              <div className="flex flex-wrap gap-1.5">
                {STARTER_PROMPTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => submitQuery(q)}
                    className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white hover:text-black border border-white/20 text-[11px] text-zinc-200 transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {entries.map((entry) => (
            <div key={entry.id} className="space-y-2 animate-stage-in">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="text-zinc-500">visitor@madhva:~$</span>
                <span className="text-white font-semibold break-words">{entry.query}</span>
                <span className="text-[10px] text-zinc-500 ml-auto shrink-0">{entry.time}</span>
              </div>

              <div className="pl-3.5 border-l border-white/25 space-y-2.5 py-0.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-white tracking-wider">
                  <Sparkles className="w-3 h-3 text-zinc-300 shrink-0" />
                  <TypewriterHeadline text={entry.reply.headline} animate={entry.animate} />
                </div>

                {renderReplyBody(entry.reply)}

                {entry.reply.suggestions && entry.reply.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {entry.reply.suggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => submitQuery(sug)}
                        className="px-2.5 py-1 rounded-full bg-black hover:bg-white hover:text-black border border-white/20 text-[10px] text-zinc-300 transition-colors cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input Prompt */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitQuery(inputVal);
          }}
          className="p-3 bg-black border-t border-white/15 flex items-center gap-2.5"
        >
          <span className="text-white text-xs font-bold whitespace-nowrap select-none">
            visitor@madhva:~$
          </span>
          <div className="relative flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                setHistoryCursor(-1);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Ask Madhva anything or type 'help'..."
              className="w-full bg-transparent text-xs text-white outline-none placeholder:text-zinc-500 font-mono"
              autoComplete="off"
              spellCheck={false}
            />
            {tabMatch && (
              <span className="hidden sm:inline absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 pointer-events-none">
                Tab → {tabMatch}
              </span>
            )}
          </div>
          <button
            type="submit"
            className="px-2.5 py-1 rounded bg-white hover:bg-zinc-200 text-black font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          >
            <span>ASK</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </form>
      </div>
    </div>
  );
};
