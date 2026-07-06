/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#EEF2FC',
          100: '#DCE6F9',
          200: '#B0C4EF',
          300: '#86A3E0',
          400: '#5378CC',
          500: '#35599E',
          600: '#274787',
          700: '#1F3D8F',
          800: '#1B3A8C',
          900: '#122868',
          950: '#0A1740',
        },
        teal: {
          50: '#E6FBFB',
          100: '#CCF7F8',
          200: '#99EEF0',
          300: '#4DE0E3',
          400: '#33D6D9',
          500: '#00C4C8',
          600: '#00A8AC',
          700: '#007478',
          800: '#0A4145',
          900: '#082F33',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -1px rgb(0 0 0 / 0.04)',
        'modal': '0 20px 60px -10px rgb(0 0 0 / 0.15)',
      }
    },
  },
  plugins: [],
}
