/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0C8E37',
          dark: '#0A6B29',
          light: '#10B953',
        },
        danger: '#e53e3e',
        warning: '#F39200',
        info: '#3182ce',
        success: '#38a169',
        'bg-light': '#f7fafc',
        'bg-dark': '#1a202c',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
