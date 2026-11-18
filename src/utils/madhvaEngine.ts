import {
  EDUCATION,
  PROFILE,
  PROJECTS,
  SKILL_GROUPS,
  SOCIAL_LINKS,
  STAGES,
  type ProjectData,
} from '../data/portfolioData';

export type MadhvaSideEffect =
  | { type: 'goto'; stageIndex: number; label: string }
  | { type: 'open-project'; project: ProjectData }
  | { type: 'tour' }
  | { type: 'audio'; state: 'on' | 'off' | 'toggle' }
  | { type: 'camera'; mode: 'CINEMATIC' | 'BOOSTER' | 'CHASE' }
  | { type: 'blueprint' }
  | { type: 'copy-email' }
  | { type: 'resume' }
  | { type: 'clear' }
  | { type: 'exit' };

export type MadhvaKind =
  | 'greeting'
  | 'who-are-you'
  | 'about'
  | 'writing'
  | 'projects'
  | 'project-detail'
  | 'private-repos'
  | 'skills'
  | 'skill-check'
  | 'education'
  | 'contact'
  | 'resume'
  | 'telemetry'
  | 'neofetch'
  | 'ls'
  | 'help'
  | 'action'
  | 'thanks'
  | 'fallback';

export interface MadhvaReply {
  kind: MadhvaKind;
  headline: string;
  lines?: string[];
  project?: ProjectData;
  matchedSkill?: {
    queried: string;
    known: boolean;
    category?: string;
    relatedProjects: ProjectData[];
  };
  sideEffect?: MadhvaSideEffect;
  suggestions?: string[];
}

export interface MadhvaContext {
  scrollProgress: number;
  activeStageIndex: number;
  cameraMode: 'CINEMATIC' | 'BOOSTER' | 'CHASE';
  blueprintMode: boolean;
  audioActive: boolean;
}

export const CLI_AUTOCOMPLETE_TERMS = [
  'help',
  'about',
  'whoami',
  'writing',
  'projects',
  'skills',
  'education',
  'contact',
  'resume',
  'neofetch',
  'telemetry',
  'ls',
  'cat about.md',
  'cat writing.md',
  'cat skills.json',
  'cat education.log',
  'cat contact.txt',
  'open dlives',
  'open santypes',
  'open ntools',
  'open wisewatt.ai',
  'goto home',
  'goto origins',
  'goto pesu',
  'goto writing',
  'goto projects',
  'goto contact',
  'tour',
  'audio on',
  'audio off',
  'copy email',
  'camera cinematic',
  'camera booster',
  'camera chase',
  'blueprint',
  'clear',
  'exit',
];

export const STARTER_PROMPTS = [
  'Who is Suhas?',
  'Where can I read his writings?',
  'What projects has he built?',
  'Tell me about voice pipelines',
  'Where does he study?',
  'How can I contact him?',
  'neofetch',
  'help',
];

function normalize(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[?!.,;:'"()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Compact Levenshtein distance for typo-tolerant offline matching */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const al = a.length;
  const bl = b.length;
  if (Math.abs(al - bl) > 2) return 3;
  const prev = new Array<number>(bl + 1);
  const curr = new Array<number>(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;
  for (let i = 1; i <= al; i++) {
    curr[0] = i;
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= bl; j++) prev[j] = curr[j];
  }
  return prev[bl];
}

function tokenMatches(token: string, keyword: string): boolean {
  if (token === keyword) return true;
  if (keyword.length >= 4 && token.startsWith(keyword)) return true;
  if (token.length >= 4 && keyword.startsWith(token) && token.length >= keyword.length - 2) {
    return true;
  }
  const maxDist = keyword.length >= 7 ? 2 : keyword.length >= 4 ? 1 : 0;
  return maxDist > 0 && editDistance(token, keyword) <= maxDist;
}

function hasAnyKeyword(text: string, tokens: string[], keywords: string[]): boolean {
  for (const kw of keywords) {
    if (kw.includes(' ')) {
      if (text.includes(kw)) return true;
    } else if (tokens.some((t) => tokenMatches(t, kw))) {
      return true;
    }
  }
  return false;
}

const STAGE_LOOKUP: { idx: number; label: string; aliases: string[] }[] = [
  { idx: 0, label: 'Home', aliases: ['home', 'pad', 'top', 'start', 'intro', 'hero'] },
  { idx: 1, label: 'Origins', aliases: ['origins', 'roots', 'davanagere', 'school', 'diddige', 'pu'] },
  { idx: 2, label: 'PESU', aliases: ['pesu', 'pes', 'college', 'university', 'bangalore', 'orbit'] },
  { idx: 3, label: 'Writing', aliases: ['writing', 'writings', 'kannada', 'koota', 'heritage', 'culture'] },
  { idx: 4, label: 'Projects', aliases: ['projects', 'project', 'work', 'missions', 'repos', 'apps'] },
  { idx: 5, label: 'Contact', aliases: ['contact', 'uplink', 'signal', 'email', 'socials', 'links', 'bottom'] },
];

function findStageInText(text: string, tokens: string[]): { idx: number; label: string } | null {
  for (const s of STAGE_LOOKUP) {
    if (hasAnyKeyword(text, tokens, s.aliases)) {
      return { idx: s.idx, label: s.label };
    }
  }
  return null;
}

function findProjectInText(text: string, tokens: string[]): ProjectData | null {
  const matchers: { id: string; aliases: string[] }[] = [
    { id: 'dlives', aliases: ['dlives', 'dlive', 'dynamic island', 'glass pill', 'smtc', 'pyqt', 'pyqt6'] },
    { id: 'santypes', aliases: ['santypes', 'santype', 'san types', 'typing', 'typewriter', 'wpm', 'grapheme'] },
    {
      id: 'ntools',
      aliases: ['ntools', 'ntool', 'baraha', 'nudi', 'unicode', 'ascii', 'multiple tools', 'capacitor', 'appwidget'],
    },
    { id: 'wisewatt-ai', aliases: ['wisewatt', 'wisewatt.ai', 'energy', 'carbon', 'electricity', 'anomaly'] },
  ];
  for (const m of matchers) {
    if (hasAnyKeyword(text, tokens, m.aliases)) {
      const found = PROJECTS.find((p) => p.id === m.id);
      if (found) return found;
    }
  }
  return null;
}

const KNOWN_SKILLS_INDEX: { label: string; category: string; aliases: string[] }[] = [
  ...SKILL_GROUPS.flatMap((g) =>
    g.items.map((item) => ({
      label: item,
      category: g.label,
      aliases: [
        item.toLowerCase(),
        ...item
          .toLowerCase()
          .split(/[\s/&]+/)
          .filter((w) => w.length >= 2),
      ],
    }))
  ),
  { label: 'Voice Pipelines (Neural TTS, Moonshine, Whisper)', category: 'AI / ML & VOICE PIPELINES', aliases: ['whisper', 'moonshine', 'tts', 'speech', 'stt', 'asr', 'voice'] },
  { label: 'React 19', category: 'WEB, DESKTOP & MOBILE', aliases: ['react', 'reactjs', 'tsx'] },
  { label: 'TypeScript', category: 'LANGUAGES', aliases: ['typescript', 'ts'] },
  { label: 'JavaScript', category: 'LANGUAGES', aliases: ['javascript', 'js'] },
  { label: 'Python', category: 'LANGUAGES', aliases: ['python', 'py'] },
  { label: 'Scikit-learn', category: 'AI / ML & VOICE PIPELINES', aliases: ['sklearn', 'scikit'] },
  { label: 'Tailwind CSS', category: 'WEB, DESKTOP & MOBILE', aliases: ['tailwind', 'tailwindcss'] },
  { label: 'Capacitor Android', category: 'WEB, DESKTOP & MOBILE', aliases: ['android', 'mobile', 'capacitor'] },
];

const UNLISTED_TECH_TERMS = [
  'java',
  'rust',
  'golang',
  'ruby',
  'php',
  'swift',
  'kotlin',
  'flutter',
  'angular',
  'vue',
  'svelte',
  'django',
  'kubernetes',
  'docker',
  'aws',
  'azure',
  'gcp',
  'solidity',
  'blockchain',
  'unity',
  'unreal',
  'c++',
  'cpp',
  'csharp',
  'c#',
];

function checkSpecificSkillQuery(raw: string, text: string, tokens: string[]): MadhvaReply | null {
  const isQuestionAboutSkill =
    hasAnyKeyword(text, tokens, [
      'know',
      'use',
      'uses',
      'worked',
      'experience',
      'familiar',
      'good at',
      'does he',
      'do you',
      'have you',
      'built with',
    ]) || raw.trim().endsWith('?');

  if (!isQuestionAboutSkill) return null;

  // Check unlisted tech first for explicit exact mentions (avoid false positives on 'c')
  const rawLower = raw.toLowerCase();
  for (const tech of UNLISTED_TECH_TERMS) {
    const escaped = tech.replace(/[+#]/g, '\\$&');
    const re = new RegExp(`(^|[\\s?!.,])${escaped}($|[\\s?!.,])`, 'i');
    if (re.test(rawLower)) {
      return {
        kind: 'skill-check',
        headline: `${tech.toUpperCase()} // NOT IN CURRENT PORTFOLIO STACK`,
        lines: [
          `Suhas doesn't list ${tech} in his core portfolio stack right now.`,
          `His main languages are Python, C, TypeScript, JavaScript, and SQL — plus voice pipelines (Neural TTS, Moonshine Voices, Whisper), React 19, Flask, PyQt6, and Capacitor Android.`,
        ],
        matchedSkill: {
          queried: tech,
          known: false,
          relatedProjects: [],
        },
        suggestions: ['What skills does he have?', 'Show his projects', 'How can I contact him?'],
      };
    }
  }

  for (const entry of KNOWN_SKILLS_INDEX) {
    // Require exact match for short 1-2 char tokens like "c" or "ts" or "js" or "py"
    const matched = entry.aliases.some((alias) => {
      if (alias.length <= 2) {
        return tokens.includes(alias);
      }
      return tokens.some((t) => tokenMatches(t, alias)) || text.includes(alias);
    });

    if (matched) {
      const relatedProjects = PROJECTS.filter((p) => {
        const hay = `${p.name} ${p.title} ${p.description} ${p.tech.join(' ')} ${p.tags.join(' ')}`.toLowerCase();
        return entry.aliases.some((a) => (a.length <= 2 ? hay.split(/\W+/).includes(a) : hay.includes(a)));
      });
      return {
        kind: 'skill-check',
        headline: `YES // ${entry.label.toUpperCase()}`,
        lines: [
          `Yes — Suhas works with ${entry.label} (${entry.category}).`,
          relatedProjects.length > 0
            ? `You can see it in action across: ${relatedProjects.map((p) => p.name).join(', ')}.`
            : `He actively uses it across his voice pipeline experiments and private R&D builds.`,
        ],
        matchedSkill: {
          queried: entry.label,
          known: true,
          category: entry.category,
          relatedProjects,
        },
        suggestions:
          relatedProjects.length > 0
            ? [`open ${relatedProjects[0].name.toLowerCase()}`, 'Show full tech stack', 'What about private repos?']
            : ['Show full tech stack', 'What about private repos?', 'Show his projects'],
      };
    }
  }

  return null;
}

export function runMadhvaQuery(rawInput: string, ctx: MadhvaContext): MadhvaReply {
  const trimmed = rawInput.trim();
  const text = normalize(trimmed);
  const tokens = text ? text.split(' ') : [];

  if (!text) {
    return {
      kind: 'help',
      headline: 'MADHVA // READY',
      lines: ['Ask me anything about Suhas, or type "help" to see all commands.'],
      suggestions: STARTER_PROMPTS.slice(0, 4),
    };
  }

  // ===== 1. IMMEDIATE CONTROL COMMANDS =====
  if (text === 'clear' || text === 'cls') {
    return { kind: 'action', headline: 'CLEARED', sideEffect: { type: 'clear' } };
  }

  if (text === 'exit' || text === 'quit' || text === 'close' || text === 'bye' || text === 'goodbye') {
    return { kind: 'action', headline: 'CLOSING MADHVA', sideEffect: { type: 'exit' } };
  }

  if (text === 'help' || text === '?' || text === 'commands' || text === 'menu') {
    return {
      kind: 'help',
      headline: 'MADHVA // COMMANDS & NATURAL Q&A',
      suggestions: ['Who is Suhas?', 'His writings', 'Show projects', 'neofetch'],
    };
  }

  if (text === 'neofetch' || text === 'fetch' || text === 'sysinfo') {
    return {
      kind: 'neofetch',
      headline: 'MADHVA // SYSTEM PROFILE',
      suggestions: ['Show projects', 'His writings', 'Start auto journey'],
    };
  }

  if (text === 'ls' || text === 'dir' || text === 'ls la' || text === 'll') {
    return {
      kind: 'ls',
      headline: '~/suhas-hoskere/',
      suggestions: ['cat about.md', 'cat writing.md', 'projects', 'cat contact.txt'],
    };
  }

  // Virtual file reader: cat <filename>
  if (tokens[0] === 'cat' && tokens.length >= 2) {
    const file = tokens.slice(1).join(' ');
    if (file.includes('about') || file.includes('readme')) return buildAboutReply();
    if (file.includes('writ') || file.includes('kannada')) return buildWritingReply();
    if (file.includes('skill') || file.includes('stack')) return buildSkillsReply();
    if (file.includes('edu') || file.includes('school')) return buildEducationReply();
    if (file.includes('contact') || file.includes('social')) return buildContactReply();
    if (file.includes('resume')) {
      return {
        kind: 'resume',
        headline: 'RESUME // DOWNLOAD TRIGGERED',
        lines: [`Downloading ${PROFILE.resumeFilename} from ${PROFILE.resumePath}.`],
        sideEffect: { type: 'resume' },
        suggestions: ['Show education', 'Show projects', 'How to contact Suhas?'],
      };
    }
    const proj = findProjectInText(file, tokens.slice(1));
    if (proj) return buildProjectDetailReply(proj);
    return {
      kind: 'fallback',
      headline: `cat: ${trimmed.slice(4).trim()}: No such file`,
      lines: ['Try "ls" to list available portfolio files, or ask a question in plain English.'],
      suggestions: ['ls', 'cat about.md', 'cat writing.md', 'projects'],
    };
  }

  // Camera & Wireframe (power-user CLI modes)
  if (tokens[0] === 'camera' || hasAnyKeyword(text, tokens, ['camera angle', 'camera mode'])) {
    const modeMatch = text.includes('booster')
      ? 'BOOSTER'
      : text.includes('chase')
        ? 'CHASE'
        : text.includes('cinematic') || text.includes('default') || text.includes('normal')
          ? 'CINEMATIC'
          : null;
    if (modeMatch) {
      return {
        kind: 'action',
        headline: `CAMERA // ${modeMatch}`,
        lines: [`Switched live rocket camera framing to ${modeMatch}.`],
        sideEffect: { type: 'camera', mode: modeMatch },
        suggestions: ['camera booster', 'camera chase', 'camera cinematic', 'blueprint'],
      };
    }
    return {
      kind: 'action',
      headline: `CAMERA // CURRENT: ${ctx.cameraMode}`,
      lines: ['Usage: camera cinematic | camera booster | camera chase'],
      suggestions: ['camera cinematic', 'camera booster', 'camera chase'],
    };
  }

  if (hasAnyKeyword(text, tokens, ['blueprint', 'wireframe', 'cad mode'])) {
    return {
      kind: 'action',
      headline: `WIREFRAME BLUEPRINT // ${!ctx.blueprintMode ? 'ENABLED' : 'DISABLED'}`,
      lines: [`Toggled monochrome CAD wireframe overlay on the rocket & satellite.`],
      sideEffect: { type: 'blueprint' },
      suggestions: ['blueprint', 'telemetry', 'camera chase'],
    };
  }

  if (text === 'telemetry' || text === 'status' || hasAnyKeyword(text, tokens, ['flight status', 'altitude'])) {
    return {
      kind: 'telemetry',
      headline: 'FLIGHT DECK // LIVE TELEMETRY',
      suggestions: ['Start auto journey', 'blueprint', 'goto writing'],
    };
  }

  // Audio controls
  if (
    hasAnyKeyword(text, tokens, ['audio', 'music', 'sound', 'soundtrack', 'mute', 'unmute']) &&
    !hasAnyKeyword(text, tokens, ['voice', 'tts', 'whisper', 'moonshine', 'dlives', 'smtc'])
  ) {
    const turnOff = hasAnyKeyword(text, tokens, ['off', 'mute', 'stop', 'pause', 'quiet', 'silent']);
    const turnOn = hasAnyKeyword(text, tokens, ['on', 'unmute', 'play', 'start', 'enable']);
    const state: 'on' | 'off' | 'toggle' = turnOff ? 'off' : turnOn ? 'on' : 'toggle';
    const nextLabel = state === 'on' ? 'ON' : state === 'off' ? 'OFF' : !ctx.audioActive ? 'ON' : 'OFF';
    return {
      kind: 'action',
      headline: `AMBIENT SOUNDTRACK // ${nextLabel}`,
      lines: [
        nextLabel === 'ON'
          ? 'Ambient Web Audio space soundtrack enabled.'
          : 'Ambient Web Audio space soundtrack muted.',
      ],
      sideEffect: { type: 'audio', state },
      suggestions: [nextLabel === 'ON' ? 'audio off' : 'audio on', 'Start auto journey'],
    };
  }

  // Auto-Journey / Tour command
  if (
    text === 'tour' ||
    text === 'launch' ||
    hasAnyKeyword(text, tokens, ['explore journey', 'auto journey', 'auto scroll', 'start journey', 'start tour', 'take a tour'])
  ) {
    return {
      kind: 'action',
      headline: 'EXPLORE JOURNEY // LAUNCHING',
      lines: ['Closing Madhva and starting the hands-free slow reading cruise across the entire page.'],
      sideEffect: { type: 'tour' },
    };
  }

  // Copy email command
  if (
    text === 'copy email' ||
    (hasAnyKeyword(text, tokens, ['copy']) && hasAnyKeyword(text, tokens, ['email', 'mail', 'gmail']))
  ) {
    return {
      kind: 'action',
      headline: 'CLIPBOARD // EMAIL COPIED',
      lines: [`Copied ${PROFILE.email} to your clipboard.`],
      sideEffect: { type: 'copy-email' },
      suggestions: ['Show all contact links', 'Who is Suhas?'],
    };
  }

  // Navigation: goto / cd / jump / "take me to <section>"
  const wantsNav =
    tokens[0] === 'goto' ||
    tokens[0] === 'cd' ||
    tokens[0] === 'jump' ||
    hasAnyKeyword(text, tokens, ['take me to', 'go to', 'scroll to', 'jump to', 'navigate to']);
  if (wantsNav) {
    const stage = findStageInText(text, tokens);
    if (stage) {
      return {
        kind: 'action',
        headline: `NAVIGATING // ${stage.label.toUpperCase()}`,
        lines: [`Closing Madhva and gliding smoothly to Stage 0${stage.idx} (${stage.label}).`],
        sideEffect: { type: 'goto', stageIndex: stage.idx, label: stage.label },
      };
    }
  }

  // Open specific project modal: "open dlives" / "inspect santypes"
  const wantsOpen = tokens[0] === 'open' || tokens[0] === 'inspect' || tokens[0] === 'launch';
  if (wantsOpen) {
    const proj = findProjectInText(text, tokens);
    if (proj) {
      return {
        kind: 'project-detail',
        headline: `OPENING // ${proj.name}`,
        project: proj,
        sideEffect: { type: 'open-project', project: proj },
        suggestions: ['Show all projects', 'What about private repos?'],
      };
    }
  }

  // ===== 2. NATURAL-LANGUAGE CONVERSATIONAL INTENTS =====

  // Greetings (English + Kannada + Kanglish)
  if (
    hasAnyKeyword(text, tokens, [
      'hi',
      'hello',
      'hey',
      'helo',
      'namaskara',
      'namaste',
      'hola',
      'yo',
      'good morning',
      'good afternoon',
      'good evening',
      'ನಮಸ್ಕಾರ',
      'ಹಲೋ',
    ]) &&
    tokens.length <= 4
  ) {
    return {
      kind: 'greeting',
      headline: 'ನಮಸ್ಕಾರ // NAMASKARA — I AM MADHVA',
      lines: [
        `Welcome to ${PROFILE.name}'s portfolio! I'm Madhva, a 100% offline assistant running right in your browser with zero API keys.`,
        `Ask me anything about Suhas — his writings, projects, voice pipelines, PES University journey, or contact details.`,
      ],
      suggestions: ['Who is Suhas?', 'Where can I read his writings?', 'Show projects', 'How can I contact him?'],
    };
  }

  // Thanks
  if (hasAnyKeyword(text, tokens, ['thank', 'thanks', 'thx', 'dhanyavada', 'dhanyavadagalu', 'ಧನ್ಯವಾದ', 'appreciate', 'awesome', 'cool', 'nice'])) {
    return {
      kind: 'thanks',
      headline: 'YOU ARE WELCOME // ಧನ್ಯವಾದಗಳು',
      lines: [
        'Glad I could help! Feel free to ask another question, start the hands-free tour, or reach out to Suhas directly.',
      ],
      suggestions: ['Start auto journey', 'How can I contact him?', 'Show projects'],
    };
  }

  // Bot self-identity ("who are you?", "what is madhva?", "do you use api?")
  if (
    hasAnyKeyword(text, tokens, [
      'who are you',
      'what are you',
      'your name',
      'madhva',
      'api key',
      'apikey',
      'offline',
      'how do you work',
      'are you a bot',
      'are you ai',
    ])
  ) {
    return {
      kind: 'who-are-you',
      headline: 'MADHVA // OFFLINE PORTFOLIO ASSISTANT',
      lines: [
        `I'm Madhva — a lightweight, 100% client-side assistant built directly into ${PROFILE.name}'s portfolio.`,
        `Zero API keys, zero external servers, instant responses. You can ask natural questions in English/Kannada or run classic CLI commands like "neofetch", "ls", "goto writing", or "tour".`,
      ],
      suggestions: ['Who is Suhas?', 'Show projects', 'help', 'neofetch'],
    };
  }

  // Resume / CV
  if (hasAnyKeyword(text, tokens, ['resume', 'cv', 'download resume', 'biodata'])) {
    const triggerDownload = hasAnyKeyword(text, tokens, ['download', 'get', 'open', 'grab']) || text === 'resume' || text === 'cv';
    return {
      kind: 'resume',
      headline: triggerDownload ? 'RESUME // DOWNLOADING' : 'RESUME // AVAILABLE',
      lines: [
        triggerDownload
          ? `Triggered download for ${PROFILE.resumeFilename}.`
          : `You can download Suhas's resume directly using the button below or by typing "resume".`,
      ],
      sideEffect: triggerDownload ? { type: 'resume' } : undefined,
      suggestions: ['Show education', 'Show projects', 'Show tech stack'],
    };
  }

  // Specific Project Match (Dlives, santypes, ntools, wisewatt.ai)
  const matchedProj = findProjectInText(text, tokens);
  if (matchedProj) {
    return buildProjectDetailReply(matchedProj);
  }

  // Private Repositories / Ongoing R&D
  if (hasAnyKeyword(text, tokens, ['private', 'unreleased', 'secret', 'r&d', 'working on', 'upcoming', 'ongoing'])) {
    return {
      kind: 'private-repos',
      headline: 'PRIVATE REPOSITORIES // ACTIVE R&D',
      lines: [
        'Alongside his public open-source work, Suhas is actively building several private repositories:',
        '• Local & hybrid voice pipelines powered by Neural TTS, Moonshine Voices, and Whisper engines.',
        '• Unreleased AI tooling and native desktop experiments.',
        'Live demos and walkthroughs are available on request — reach out via email or LinkedIn!',
      ],
      suggestions: ['Show public projects', 'Show voice & AI stack', 'How can I contact him?'],
    };
  }

  // Specific Skill Check ("Does he know Python?", "Does Suhas use Whisper?")
  const skillCheck = checkSpecificSkillQuery(trimmed, text, tokens);
  if (skillCheck) return skillCheck;

  // Writing & Culture (Kannada Koota + Instagram pages)
  if (
    hasAnyKeyword(text, tokens, [
      'writing',
      'writings',
      'writer',
      'write',
      'writes',
      'kannada',
      'koota',
      'club',
      'culture',
      'mugulnage',
      'overthinker',
      'poetry',
      'poem',
      'articles',
      'blog',
      'story',
      'stories',
      'literature',
      'ಕನ್ನಡ',
      'ಬರಹ',
    ])
  ) {
    return buildWritingReply();
  }

  // Education / School / College / Roots
  if (
    hasAnyKeyword(text, tokens, [
      'education',
      'study',
      'studying',
      'studies',
      'college',
      'university',
      'pes',
      'pesu',
      'campus',
      'degree',
      'btech',
      'branch',
      'major',
      'school',
      'sslc',
      'pu',
      'siddaganga',
      'diddige',
      'jagalur',
      'davanagere',
      'hometown',
      'from',
      'roots',
      'origins',
      'year',
      'graduate',
      'graduation',
    ])
  ) {
    return buildEducationReply();
  }

  // Projects Overview
  if (
    hasAnyKeyword(text, tokens, [
      'projects',
      'project',
      'built',
      'build',
      'made',
      'create',
      'created',
      'apps',
      'repos',
      'repositories',
      'portfolio',
      'open source',
      'opensource',
      'work',
    ])
  ) {
    return {
      kind: 'projects',
      headline: 'SELECTED PROJECTS // OPEN SOURCE + PRIVATE R&D',
      suggestions: ['Tell me about Dlives', 'Tell me about santypes', 'Tell me about ntools', 'Private repos'],
    };
  }

  // Skills / Tech Stack / Voice Pipelines
  if (
    hasAnyKeyword(text, tokens, [
      'skills',
      'skill',
      'stack',
      'tech',
      'technologies',
      'tools',
      'languages',
      'frameworks',
      'voice',
      'pipeline',
      'pipelines',
      'tts',
      'neural',
      'moonshine',
      'whisper',
      'ai',
      'ml',
      'machine learning',
    ])
  ) {
    return buildSkillsReply();
  }

  // Contact / Socials / Links / Hire
  if (
    hasAnyKeyword(text, tokens, [
      'contact',
      'email',
      'mail',
      'gmail',
      'reach',
      'hire',
      'collaborate',
      'collab',
      'connect',
      'github',
      'linkedin',
      'instagram',
      'insta',
      'ig',
      'social',
      'socials',
      'links',
      'handle',
      'phone',
    ])
  ) {
    return buildContactReply();
  }

  // About / Who is Suhas
  if (
    hasAnyKeyword(text, tokens, [
      'about',
      'whoami',
      'who is',
      'suhas',
      'hoskere',
      'bio',
      'intro',
      'introduce',
      'profile',
      'summary',
      'yourself',
      'himself',
      'ಸುಹಾಸ್',
    ])
  ) {
    return buildAboutReply();
  }

  // Graceful Fallback (Honest & helpful)
  return {
    kind: 'fallback',
    headline: 'MADHVA // OUTSIDE MY OFFLINE KNOWLEDGE BASE',
    lines: [
      `I didn't find a direct match for "${trimmed}". Since I run 100% locally with zero API keys, I specialize in everything about ${PROFILE.name} and controlling this portfolio.`,
      `Try clicking one of the questions below or typing "help" to see all commands!`,
    ],
    suggestions: ['Who is Suhas?', 'His writings', 'What projects has he built?', 'How can I contact him?'],
  };
}

function buildAboutReply(): MadhvaReply {
  return {
    kind: 'about',
    headline: `${PROFILE.kannadaName} // ${PROFILE.name.toUpperCase()}`,
    lines: [
      PROFILE.roleLine,
      PROFILE.summary,
      `Based in ${PROFILE.location} (roots in Diddige & Davanagere, Karnataka).`,
    ],
    suggestions: ['Where can I read his writings?', 'What projects has he built?', 'Where does he study?', 'Contact links'],
  };
}

function buildWritingReply(): MadhvaReply {
  return {
    kind: 'writing',
    headline: 'WRITING & CULTURE // ಕನ್ನಡ ಕೂಟ',
    lines: [
      'Writing comes first for Suhas — he is a passionate creative writer in both Kannada and English, and a Content Writer at Kannada Koota Club (PES University, Electronic City Campus).',
      `Kannada Writings: ${SOCIAL_LINKS.instagramKannada.label}`,
      `English & Tech: ${SOCIAL_LINKS.instagramEnglishTech.label}`,
    ],
    suggestions: ['goto writing', 'Show his projects', 'Who is Suhas?'],
  };
}

function buildSkillsReply(): MadhvaReply {
  return {
    kind: 'skills',
    headline: 'TECH STACK & VOICE PIPELINES',
    suggestions: ['Does he know Python?', 'What about private repos?', 'Show his projects'],
  };
}

function buildEducationReply(): MadhvaReply {
  return {
    kind: 'education',
    headline: 'EDUCATION // ACADEMIC JOURNEY',
    lines: EDUCATION.map((e) => `${e.period} · ${e.institution} (${e.level})`),
    suggestions: ['Who is Suhas?', 'His writings', 'Show his projects'],
  };
}

function buildContactReply(): MadhvaReply {
  return {
    kind: 'contact',
    headline: 'ESTABLISH UPLINK // DIRECT LINKS',
    lines: ['Open to open-source collaborations, AI/ML & software projects, and creative writing conversations.'],
    suggestions: ['copy email', 'Download resume', 'Start auto journey'],
  };
}

function buildProjectDetailReply(project: ProjectData): MadhvaReply {
  return {
    kind: 'project-detail',
    headline: `${project.name} // ${project.title}`,
    project,
    suggestions: ['Show all projects', 'What about private repos?', 'How can I contact him?'],
  };
}

export function getTelemetryStageName(stageIndex: number): string {
  return STAGES[stageIndex]?.stageName ?? 'Orbit';
}
