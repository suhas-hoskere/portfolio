/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        space: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        sans: ['system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        kannada: ['"Noto Sans Kannada"', 'sans-serif'],
        hubballi: ['"Hubballi"', '"Noto Sans Kannada"', 'cursive', 'sans-serif'],
        signature: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
