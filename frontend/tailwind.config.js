/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dffd',
          300: '#7cc2fb',
          400: '#36a0f6',
          500: '#0c82ea',
          600: '#0267c7',
          700: '#0352a1',
          800: '#074684',
          900: '#0c3b6e',
          950: '#082549',
        },
        slate: {
          850: '#151e2e',
          950: '#0b0f17',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 25px -5px rgba(12, 130, 234, 0.3)',
      }
    },
  },
  plugins: [],
}
