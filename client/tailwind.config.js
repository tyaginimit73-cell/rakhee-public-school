/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff', 100: '#dce7fd', 200: '#c0d4fc', 300: '#94b8fa',
          400: '#6193f6', 500: '#3d70ef', 600: '#2754e3', 700: '#1f42c4',
          800: '#1f389e', 900: '#1e357d', 950: '#16234f',
        },
        navy: { 800: '#12264d', 900: '#0c1b3a', 950: '#081430' },
        accent: {
          50: '#fbf7ea', 100: '#f5ebc8', 200: '#edd693', 300: '#e3be5c',
          400: '#dbac33', 500: '#c99a22', 600: '#a97b1a', 700: '#875d18',
        },
        base: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 2px 10px -2px rgb(12 27 58 / 0.08), 0 8px 30px -12px rgb(12 27 58 / 0.15)',
        lift: '0 12px 40px -12px rgb(12 27 58 / 0.25)',
        glow: '0 0 0 4px rgb(39 84 227 / 0.12)',
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        marquee: 'marquee 30s linear infinite',
        'spin-slower': 'spin 14s linear infinite',
        'bounce-soft': 'bounceSoft 1.8s ease-in-out infinite',
      },
      keyframes: {
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        bounceSoft: { '0%,100%': { transform: 'translateY(0)', opacity: 1 }, '50%': { transform: 'translateY(6px)', opacity: 0.5 } },
      },
    },
  },
  plugins: [],
};
