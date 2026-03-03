/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: '#162221', light: '#1e2d2b', soft: '#2d3a35' },
        sage: { DEFAULT: '#7d9b8a', light: '#9ab5a5', dark: '#5a7266' },
        sand: '#c4b8a8',
        taupe: '#a89888',
        gold: { DEFAULT: '#d4af37', glow: 'rgba(212, 175, 55, 0.4)' },
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};
