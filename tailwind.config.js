/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#e8f0fe',
          100: '#c5d9fc',
          200: '#91b8fb',
          300: '#5c92f8',
          400: '#3572f5',
          500: '#1a55f2',
          600: '#1445e5',
          700: '#0f38ce',
          800: '#0b30a8',
          900: '#0a298a',
          950: '#060d4d',
        },
        dark: {
          50: '#f7f7f8',
          100: '#ececed',
          200: '#d5d5d7',
          300: '#b0b0b3',
          400: '#86868b',
          500: '#6f6f73',
          600: '#5c5c60',
          700: '#4c4c50',
          800: '#414145',
          900: '#1c1c1e',
          950: '#0a0a0c',
        },
      },
      animation: {
        'bounce-in': 'bounceIn 0.6s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
