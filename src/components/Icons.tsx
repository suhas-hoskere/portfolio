import React from 'react';

/** Suhas Hoskere personal monogram: Quill Ascent (Launching Feather-Nib Rocket Crest) */
export const BrandLogo: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <circle cx="32" cy="32" r="29.5" fill="#050505" stroke="#ffffff" strokeOpacity="0.42" strokeWidth="2.2" />
    <circle cx="32" cy="32" r="25" stroke="#ffffff" strokeWidth="0.95" strokeOpacity="0.28" strokeDasharray="3 3" />
    <path d="M 19 15 L 20.1 17.9 L 23 19 L 20.1 20.1 L 19 23 L 17.9 20.1 L 15 19 L 17.9 17.9 Z" fill="#ffffff" />
    <g transform="translate(32 32) rotate(42) translate(-32 -32)">
      <path
        d="M 32 10.5 C 36.8 18 41.2 25.5 41.2 33.5 L 37.5 41.5 L 26.5 41.5 L 22.8 33.5 C 22.8 29.8 24.1 26.2 25.8 23.2 L 28.4 24.2 L 26.6 20.4 C 28.3 17.1 30.2 13.8 32 10.5 Z"
        fill="#ffffff"
      />
      <line x1="32" y1="10.2" x2="32" y2="28.5" stroke="#050505" strokeWidth="2.0" strokeLinecap="round" />
      <circle cx="32" cy="30.2" r="3.1" fill="#050505" />
      <rect x="26.5" y="43.8" width="11" height="3.2" rx="1.2" fill="#ffffff" />
      <line x1="32" y1="49.5" x2="32" y2="55.5" stroke="#ffffff" strokeWidth="2.1" strokeLinecap="round" />
      <line x1="27.5" y1="49.2" x2="26.2" y2="53.4" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.72" strokeLinecap="round" />
      <line x1="36.5" y1="49.2" x2="37.8" y2="53.4" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.72" strokeLinecap="round" />
    </g>
  </svg>
);

export const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

export const LinkedinIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

export const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.6" cy="6.4" r="1" fill="currentColor" stroke="none" />
  </svg>
);
