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
        // Primary brand red for CTAs, sale badges, active states
        primary: {
          DEFAULT: '#B91C2B',
          hover: '#8F1620',
          50: '#FDF2F3',
          100: '#FCE7E8',
          200: '#F7C4C7',
          500: '#B91C2B',
          600: '#8F1620',
          700: '#6B1018',
        },

        // Structural Navy Blue for headers, footers, trust & admin
        navy: {
          DEFAULT: '#0F1F3D',
          hover: '#1A2F5A',
          50: '#F0F3F9',
          100: '#E2E8F4',
          200: '#C5D2E9',
          300: '#94ACD6',
          400: '#5F83BC',
          500: '#3D62A2',
          600: '#2A477D',
          700: '#1F345D',
          800: '#16284D',
          900: '#0F1F3D',
          950: '#091326',
        },

        // Clean neutral surface & background tokens
        brand: {
          bg: '#FAFAF8',
          text: '#1A1A1A',
          muted: '#6B7280',
          border: '#E5E7EB',
          success: '#16A34A',
        },

        // Main grayscale system
        surface: {
          50: '#FAFAF8',
          100: '#F9FAFB',
          200: '#F3F4F6',
          300: '#E5E7EB',
          400: '#D1D5DB',
          500: '#9CA3AF',
          600: '#6B7280',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
          950: '#0F1F3D',
        },

        // Bright red for sale states
        sale: {
          50: '#FDF2F3',
          500: '#B91C2B',
          700: '#8F1620',
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
