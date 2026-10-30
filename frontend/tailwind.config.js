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
        terminal: {
          bg: '#080D16',
          surface: '#0E1726',
          card: '#121E30',
          hover: '#18273E',
          border: '#1B2B42',
          borderSubtle: '#152236',
          borderFocus: '#2DD4BF',
        },
        navy: {
          950: '#080D16',
          900: '#0E1726',
          850: '#121E30',
          800: '#16243A',
          750: '#1B2C46',
          700: '#233754',
          600: '#324C72',
          500: '#4A6A9B',
        },
        accent: {
          teal: '#2DD4BF',
          blue: '#60A5FA',
          emerald: '#10B981',
          rose: '#EF4444',
          amber: '#F59E0B',
          purple: '#A78BFA',
        },
        risk: {
          emerald: '#10B981',
          teal: '#2DD4BF',
          cyan: '#38BDF8',
          amber: '#F59E0B',
          rose: '#EF4444',
          red: '#DC2626',
          blue: '#60A5FA',
          purple: '#A78BFA',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'glow-teal': '0 0 20px -5px rgba(45, 212, 191, 0.25)',
        'glow-blue': '0 0 20px -5px rgba(96, 165, 250, 0.25)',
        'glow-rose': '0 0 20px -5px rgba(239, 68, 68, 0.25)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.45)',
      }
    },
  },
  plugins: [],
}
