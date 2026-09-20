/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        night: {
          950: '#050810',
          900: '#0a0f1e',
          850: '#0d1526',
          800: '#111b30',
          700: '#1a2743',
        },
        neon: {
          green: '#22d3a7',
          teal: '#2dd4bf',
          blue: '#38bdf8',
          violet: '#a78bfa',
          amber: '#fbbf24',
          red: '#fb7185',
        },
      },
      screens: {
        xs: '420px',
        '3xl': '1920px',
        '4xl': '2560px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(2, 8, 23, 0.55)',
        'glow-green': '0 0 24px rgba(34, 211, 167, 0.35)',
        'glow-blue': '0 0 24px rgba(56, 189, 248, 0.35)',
        'glow-red': '0 0 24px rgba(251, 113, 133, 0.4)',
      },
      animation: {
        'pulse-slow': 'dataPulse 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
