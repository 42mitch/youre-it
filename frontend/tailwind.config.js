/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
      extend: {
        fontFamily: {
          display: ['"Bebas Neue"', 'sans-serif'],
          mono: ['"JetBrains Mono"', 'monospace'],
        },
        colors: {
          it: '#ff3b3b',
        },
        boxShadow: {
          it: '0 0 40px rgba(255,59,59,0.4)',
        },
      },
    },
    plugins: [],
  };