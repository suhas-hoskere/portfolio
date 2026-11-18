export const PROFILE = {
  name: 'Suhas Hoskere',
  kannadaName: 'ಸುಹಾಸ್ ಹೊಸಕೆರೆ',
  location: 'Bangalore, Karnataka',
  email: 'suhashoskere@gmail.com',
  gmailComposeUrl:
    'https://mail.google.com/mail/?view=cm&fs=1&to=suhashoskere@gmail.com&su=Hello%20Suhas',
  resumePath: '/resume.pdf',
  resumeFilename: 'Suhas_Hoskere_Resume.pdf',
  roleLine: 'Passionate Writer · AI & ML Student at PES University · Open-Source Contributor',
  summary:
    'A passionate writer and B.Tech AI & Machine Learning student at PES University (Electronic City Campus, Bangalore). Open-source contributor building voice pipelines (Neural TTS, Moonshine Voices, Whisper engines), desktop utilities, multi-script web apps, and applied ML tools.',
} as const;

export const SOCIAL_LINKS = {
  github: { label: 'suhas-hoskere', url: 'https://github.com/suhas-hoskere' },
  linkedin: { label: 'suhas-hoskere', url: 'https://www.linkedin.com/in/suhas-hoskere/' },
  instagramPersonal: { label: '@suhas__112123', url: 'https://www.instagram.com/suhas__112123/' },
  instagramKannada: {
    label: '@mugulnage_manasu_10',
    title: 'Kannada Writings',
    url: 'https://www.instagram.com/mugulnage_manasu_10/',
  },
  instagramEnglishTech: {
    label: '@unofficial_overthinker_',
    title: 'English & Tech',
    url: 'https://www.instagram.com/unofficial_overthinker_/',
  },
} as const;

export const EDUCATION = [
  {
    period: '2025 – 2029',
    level: 'B.Tech AI & Machine Learning',
    institution: 'PES University, Electronic City Campus',
    location: 'Bangalore, Karnataka',
    detail:
      'Pursuing B.Tech in Artificial Intelligence & Machine Learning while building open-source tools, voice pipelines, and writing for Kannada Koota Club.',
  },
  {
    period: '2023 – 2025',
    level: 'Pre-University (PU)',
    institution: 'Shree Siddaganga PU College',
    location: 'Davanagere, Karnataka',
    detail: 'Strengthened foundations in mathematics, physics, and computer science.',
  },
  {
    period: '2012 – 2023',
    level: 'UKG – SSLC',
    institution: 'Rural Public School, Diddige',
    location: 'Jagalur Taluk, Davanagere District, Karnataka',
    detail: 'Passed out in 2023 — where early curiosity for engineering and writing began.',
  },
] as const;

export const PERSONAL_QA = {
  whyMadhva: 'Madhva is Suhas’s favorite name — so he named his personal offline portfolio assistant after it.',
  writingThemes:
    'He mostly writes about love — and pain, of course. He loves pain as a raw, honest lens for creative expression in both Kannada and English.',
  whyAiMl:
    'He chose Artificial Intelligence & Machine Learning because he believes it is the future — and backs it up by building voice pipelines (Neural TTS, Moonshine Voices, Whisper) and applied ML apps.',
  futureGoal:
    'He is aiming to build his own startup — blending real-world AI/ML engineering, product design, and storytelling.',
  availability:
    'Yes — Suhas is open to internships alongside college at PES University, available online/remotely or during his free time, as well as open-source and writing collaborations.',
} as const;

export interface StageWaypoint {
  id: string;
  code: string;
  shortLabel: string;
  stageName: string;
  altitude: string;
}

export const STAGES: StageWaypoint[] = [
  { id: 'pad', code: '00', shortLabel: 'Home', stageName: 'Suhas Hoskere', altitude: 'Writer · AIML · OSS' },
  { id: 'ascent', code: '01', shortLabel: 'Origins', stageName: 'Davanagere Roots', altitude: '2012 – 2025 // School & PU' },
  { id: 'orbit', code: '02', shortLabel: 'PESU', stageName: 'PES University, BLR', altitude: '2025 – 2029 // B.Tech AIML' },
  { id: 'heritage', code: '03', shortLabel: 'Writing', stageName: 'Kannada Koota & Writing', altitude: 'PESU EC Campus' },
  { id: 'missions', code: '04', shortLabel: 'Projects', stageName: 'Open-Source & Private R&D', altitude: 'Dlives · santypes · ntools' },
  { id: 'signal', code: '05', shortLabel: 'Contact', stageName: 'Establish Uplink', altitude: 'Email · GitHub · LinkedIn' },
];

export interface ProjectData {
  id: string;
  name: string;
  title: string;
  category: string;
  badge: string;
  description: string;
  metrics: { label: string; value: string }[];
  tags: string[];
  architecture: string[];
  tech: string[];
  github: string;
  demo?: string;
}

export const PROJECTS: ProjectData[] = [
  {
    id: 'dlives',
    name: 'Dlives',
    title: 'Dynamic Island for Windows 10 & 11',
    category: 'DESKTOP APPLICATION // PYTHON',
    badge: 'Live App',
    description:
      'Apple-inspired translucent glass pill resting at the edge of the Windows desktop — invisible when focused, alive on hover with native SMTC media controls, volume/brightness sliders, system diagnostics, alarms, Pomodoro, clipboard shelf, and local plain-text notes.',
    metrics: [
      { label: 'Platform', value: 'Windows 10/11' },
      { label: 'Core Stack', value: 'Python · PyQt6' },
      { label: 'Modules', value: '9+ Built-in Suites' },
    ],
    tags: ['Python', 'PyQt6', 'Windows SMTC', 'CoreAudio', 'PyInstaller'],
    architecture: [
      'Native Windows SMTC integration via winmedia-controller for Spotify, YouTube, Chrome & Apple Music plus CoreAudio (pycaw) volume and display brightness controls',
      'Real-time CPU, RAM, Wi-Fi & battery diagnostics via psutil with one-click temporary cache cleanup and drag-and-drop clipboard/file shelf',
      'Multi-note scratchpad auto-saving plain .txt files locally in %AppData%\\DLives\\notes\\ alongside calendar, alarms, timetable & Pomodoro focus timer',
    ],
    tech: [
      'Python',
      'PyQt6',
      'psutil',
      'pycaw',
      'comtypes',
      'winmedia-controller',
      'screen-brightness-control',
      'pynput',
      'PyInstaller',
    ],
    github: 'https://github.com/suhas-hoskere/Dlives',
    demo: 'https://dlives.vercel.app/',
  },
  {
    id: 'santypes',
    name: 'santypes',
    title: 'Typing Practice Platform',
    category: 'WEB PLATFORM // TYPESCRIPT',
    badge: 'Live App',
    description:
      'Keyboard-first, zero-framework TypeScript & Vite typing trainer running 100% locally in the browser with sub-millisecond keystroke timing, Indic grapheme-cluster segmentation (English, Kannada & Hindi), live analytics charts, and adaptive weak-keys drills.',
    metrics: [
      { label: 'Scripts', value: 'EN · KN · HI' },
      { label: 'Runtime', value: '100% Local' },
      { label: 'Quality', value: 'Vitest + Oxlint' },
    ],
    tags: ['TypeScript', 'Vite', 'Indic Graphemes', 'Vitest', 'Privacy-First'],
    architecture: [
      'Multilingual grapheme-cluster engine supporting English, Kannada (Native & Kanglish), and Hindi (Devanagari & Hinglish) with structured touch-typing chapters',
      'Zero-framework TypeScript architecture with self-hosted @fontsource typography (zero external font CDN beacons) and Global Privacy Control (GPC) support',
      'Local session analytics dashboard with velocity timelines, WPM bracket distribution, adaptive weak-key drills, and full JSON backup/erasure',
    ],
    tech: [
      'TypeScript',
      'Vite',
      'Three.js',
      'Vitest',
      'Oxlint',
      '@fontsource/noto-sans-kannada',
      '@fontsource/noto-sans-devanagari',
    ],
    github: 'https://github.com/suhas-hoskere/santypes',
    demo: 'https://san-types.web.app/',
  },
  {
    id: 'ntools',
    name: 'ntools',
    title: 'Multiple Tools in One App',
    category: 'CROSS-PLATFORM // ANDROID & WEB',
    badge: 'Open Source',
    description:
      'All-in-one pitch-black productivity suite and Kannada text conversion platform built with React 19, TypeScript & Capacitor Android — featuring real-time Kannada Unicode ↔ ASCII (Baraha/Nudi) conversion, PDF toolkit, lockscreen alarms, and Android AppWidgets.',
    metrics: [
      { label: 'Platform', value: 'Android + Web' },
      { label: 'Converter', value: 'Unicode ↔ ASCII' },
      { label: 'Framework', value: 'React 19 · Cap 7' },
    ],
    tags: ['React 19', 'TypeScript', 'Capacitor Android', 'Tailwind CSS', 'pdf-lib'],
    architecture: [
      'Real-time two-way converter between Kannada Unicode and popular ASCII fonts (Baraha, Nudi) with case transforms, word counts & direct file export',
      'Offline document & PDF suite built with pdf-lib and jsPDF supporting merge, split, compress, watermark, text extraction, and PDF-to-image conversion',
      'Native Capacitor Android features including full-screen lockscreen alarm overlays, VIP-filtered Zen focus mode, Karnataka holiday calendar & Home Screen AppWidgets',
    ],
    tech: [
      'React 19',
      'TypeScript',
      'Vite',
      'Tailwind CSS',
      'Capacitor 7',
      'pdf-lib',
      'jsPDF',
      'JSZip',
      'Vitest',
    ],
    github: 'https://github.com/suhas-hoskere/ntools',
  },
  {
    id: 'wisewatt-ai',
    name: 'wisewatt.ai',
    title: 'AI Energy Prediction & Carbon Dashboard',
    category: 'MACHINE LEARNING // PYTHON',
    badge: 'Open Source',
    description:
      'AI-based energy consumption prediction web dashboard built with Python, Flask, and Scikit-learn — providing ML consumption forecasting, anomaly detection, electricity cost & carbon footprint estimation, and smart energy-saving recommendations.',
    metrics: [
      { label: 'Backend', value: 'Python · Flask' },
      { label: 'ML Core', value: 'Scikit-learn' },
      { label: 'Outputs', value: 'Cost & CO₂' },
    ],
    tags: ['Python', 'Flask', 'Scikit-learn', 'Pandas', 'NumPy'],
    architecture: [
      'Supervised machine learning pipeline trained with Scikit-learn, Pandas & NumPy with serialized model.pkl and scaler.pkl artifacts for fast inference',
      'Anomaly detection layer flagging unusual consumption spikes and computing estimated electricity cost alongside carbon impact metrics',
      'Clean Flask web server rendering live prediction views and actionable energy-saving recommendations through lightweight HTML/CSS templates',
    ],
    tech: ['Python', 'Flask', 'Scikit-learn', 'Pandas', 'NumPy', 'Joblib', 'HTML', 'CSS'],
    github: 'https://github.com/suhas-hoskere/wisewatt.ai',
  },
];

export const SKILL_GROUPS = [
  {
    label: 'LANGUAGES',
    items: ['Python', 'C', 'TypeScript', 'JavaScript', 'SQL', 'HTML / CSS'],
  },
  {
    label: 'AI / ML & VOICE PIPELINES',
    items: [
      'Voice Pipelines',
      'Neural TTS',
      'Moonshine Voices',
      'Whisper Engines',
      'Scikit-learn',
      'Pandas',
      'NumPy',
      'Joblib',
      'AI-Assisted Engineering',
    ],
  },
  {
    label: 'WEB, DESKTOP & MOBILE',
    items: [
      'React 19',
      'Vite',
      'Tailwind CSS',
      'Flask',
      'PyQt6',
      'Capacitor Android',
      'Three.js',
      'Vitest',
      'Git & Open Source',
    ],
  },
] as const;
