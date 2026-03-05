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
      }
    },
  },
  plugins: [],
}
