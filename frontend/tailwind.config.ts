import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Neutral black-white utility set
        brand: {
          50: '#f5f5f5',
          100: '#ebebeb',
          200: '#d9d9d9',
          300: '#bfbfbf',
          400: '#a6a6a6',
          500: '#808080',
          600: '#666666',
          700: '#4d4d4d',
          800: '#2b2b2b',
          900: '#121212',
        },

        // Keep accent neutral to maintain black-white direction
        accent: {
          50: '#ffffff',
          100: '#f7f7f7',
          200: '#ededed',
          300: '#d9d9d9',
          400: '#bdbdbd',
          500: '#8c8c8c',
          600: '#666666',
          700: '#4d4d4d',
          800: '#2e2e2e',
          900: '#121212',
        },

        // Main grayscale system
        surface: {
          50: '#ffffff',
          100: '#f5f5f5',
          200: '#ededed',
          300: '#e0e0e0',
          400: '#cfcfcf',
          500: '#8f8f8f',
          600: '#666666',
          700: '#444444',
          800: '#222222',
          900: '#121212',
          950: '#0f172a',
        },

        // Bright red only for sale states
        sale: {
          50: '#ffe5e5',
          500: '#ff1f1f',
          700: '#e00000',
        },

        // Retained for compatibility in existing classes
        navy: {
          50:  '#f4f6f9',
          100: '#e5e9f0',
          200: '#c8cfe0',
          300: '#9aa8c4',
          400: '#6b7ea5',
          500: '#4a5f8a',
          600: '#394b72',
          700: '#2e3d5c',
          800: '#24304a',
          900: '#1a2236',
        },

        // Retained for compatibility in existing classes
        cream: {
          50:  '#fdfcfa',
          100: '#f9f6f0',
          200: '#f0ebe0',
          300: '#e4dbc8',
          400: '#d5c8ad',
          500: '#c4b291',
          600: '#a89574',
          700: '#8a785d',
          800: '#6e604b',
          900: '#574d3d',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 4px 18px rgba(26, 26, 26, 0.05)',
        'soft-md': '0 8px 28px rgba(26, 26, 26, 0.07)',
        'soft-lg': '0 14px 42px rgba(26, 26, 26, 0.09)',
        'soft-xl': '0 20px 56px rgba(26, 26, 26, 0.11)',
        'warm': '0 8px 24px rgba(200, 169, 106, 0.20)',
        'warm-lg': '0 14px 36px rgba(200, 169, 106, 0.24)',
        'gold': '0 0 20px rgba(200, 169, 106, 0.20)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.5s ease-out',
        'pulse-soft': 'pulse-soft 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
