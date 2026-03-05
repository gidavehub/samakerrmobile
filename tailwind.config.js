/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-bg': '#ffffff',
        'secondary-bg': '#f4f5f7',
        'primary-text': '#121212',
        'secondary-text': '#4a4a4a',
        'accent-blue': '#0A58CA',
        'accent-hover': '#084298',
        'border-subtle': 'rgba(0, 0, 0, 0.1)',
      },
      fontFamily: {
        inter: ['var(--font-inter)', 'sans-serif'],
        outfit: ['var(--font-outfit)', 'sans-serif'],
      },
      screens: {
        'touch': { 'raw': '(hover: none)' },
        'notouch': { 'raw': '(hover: hover)' },
      },
      keyframes: {
        'scan-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 4000px rgba(0, 0, 0, 0.45)' },
          '50%': { boxShadow: '0 0 0 4000px rgba(0, 0, 0, 0.35)' },
        },
        'fade-slide-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'sheet-slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'scan-pulse': 'scan-pulse 2.5s ease-in-out infinite',
        'fade-slide-up': 'fade-slide-up 0.5s ease-out both',
        'fade-slide-up-delay': 'fade-slide-up 0.5s 0.3s ease-out both',
        'fade-in': 'fade-in 0.3s ease-out',
        'sheet-slide-up': 'sheet-slide-up 0.4s ease-out',
        'spinner': 'spin-slow 0.8s linear infinite',
      },
    },
  },
  plugins: [],
}
