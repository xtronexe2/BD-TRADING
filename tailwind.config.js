/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
          950: '#4a044e',
        },
        neon: {
          purple: '#bf5af2',
          pink: '#ff2d78',
          blue: '#0a84ff',
          cyan: '#32d74b',
          gold: '#ffd60a',
          orange: '#ff9f0a',
        },
        dark: {
          50: '#1c1c1e',
          100: '#2c2c2e',
          200: '#3a3a3c',
          300: '#48484a',
          400: '#636366',
          500: '#8e8e93',
          bg: '#0a0a0f',
          card: '#12121a',
          border: '#2a2a3a',
        },
      },
      backgroundImage: {
        'purple-gradient': 'linear-gradient(135deg, #bf5af2 0%, #ff2d78 100%)',
        'dark-gradient': 'linear-gradient(180deg, #12121a 0%, #0a0a0f 100%)',
        'card-gradient': 'linear-gradient(135deg, #1a1a2e 0%, #12121a 100%)',
        'neon-glow': 'linear-gradient(135deg, #bf5af2 0%, #7c3aed 50%, #ff2d78 100%)',
        'gold-gradient': 'linear-gradient(135deg, #ffd60a 0%, #ff9f0a 100%)',
      },
      boxShadow: {
        'neon-purple': '0 0 20px rgba(191, 90, 242, 0.4)',
        'neon-pink': '0 0 20px rgba(255, 45, 120, 0.4)',
        'neon-gold': '0 0 20px rgba(255, 214, 10, 0.4)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 32px rgba(191, 90, 242, 0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'count-down': 'countDown 1s linear',
        'number-flip': 'numberFlip 0.4s ease-in-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(191, 90, 242, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(191, 90, 242, 0.8), 0 0 40px rgba(191, 90, 242, 0.4)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        countDown: {
          '0%': { transform: 'scale(1.2)', opacity: '0.7' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        numberFlip: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '50%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
