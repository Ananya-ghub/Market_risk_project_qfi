/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070b14',
          900: '#0a0f1d',
          850: '#0e1629',
          800: '#131d33',
          750: '#17233d',
          700: '#1e2c4c',
          600: '#2a3b63',
          500: '#3d5284',
        },
        slate: {
          850: '#141d2e',
          900: '#0f172a',
          950: '#090e17',
        },
        risk: {
          emerald: '#10b981',
          teal: '#14b8a6',
          cyan: '#06b6d4',
          amber: '#f59e0b',
          rose: '#f43f5e',
          red: '#ef4444',
          blue: '#3b82f6',
          purple: '#8b5cf6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'glow-teal': '0 0 20px -5px rgba(20, 184, 166, 0.25)',
        'glow-rose': '0 0 20px -5px rgba(244, 63, 94, 0.25)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
      }
    },
  },
  plugins: [],
}
