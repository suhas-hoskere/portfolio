/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#04050d',
          900: '#070815',
          850: '#0d1024',
          800: '#141733',
        },
        cream: {
          50: '#faf9f5',
          100: '#f4f2ed',
          200: '#e5e1d7',
          300: '#c5c0b4',
          400: '#9b9689',
        },
        cosmos: {
          void: '#030712',
          surface: '#0e131f',
          container: '#1a202c',
          high: '#242a36',
          cyan: '#06b6d4',
          electric: '#4cd7f6',
          amber: '#f97316',
          violet: '#4338ca',
        },
        nebula: {
          violet: '#8b5cf6',
          magenta: '#ec4899',
          orange: '#f97316',
          amber: '#fbbf24',
          cyan: '#38bdf8',
        }
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        display: ['"Space Grotesk"', '"Syne"', 'sans-serif'],
        space: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Inter"', '"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        kannada: ['"Noto Sans Kannada"', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 40s linear infinite',
        'orbit-slow': 'orbit 25s linear infinite',
        'pulse-warm': 'pulseWarm 4s ease-in-out infinite',
      },
      keyframes: {
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        pulseWarm: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        }
      }
    },
  },
  plugins: [],
}
