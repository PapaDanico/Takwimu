/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        takwimu: {
          950: '#0a0f1a', 900: '#0f172a', 800: '#1e293b', 700: '#334155',
          600: '#475569', 500: '#64748b', 400: '#94a3b8', 300: '#cbd5e1',
          200: '#e2e8f0', 100: '#f1f5f9', 50: '#f8fafc',
          gold: '#c9a227', 'gold-soft': '#e8d5a3', 'gold-dim': '#8a7020',
        },
        status: {
          verified: '#10b981', partial: '#3b82f6', unverified: '#f59e0b',
          disputed: '#ef4444', stalled: '#f59e0b', delivered: '#10b981',
          progress: '#3b82f6', notstarted: '#64748b',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      }
    },
  },
  plugins: [],
}