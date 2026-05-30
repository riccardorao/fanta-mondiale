import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        night: {
          DEFAULT: '#030C1A',
          1: '#071422',
          2: '#0D1E30',
          3: '#15263C',
          4: '#1C3050',
        },
        blue: {
          primary: '#2563EB',
          hover: '#1D4ED8',
          light: '#60A5FA',
          dim: 'rgba(37,99,235,0.15)',
          glow: 'rgba(96,165,250,0.3)',
        },
        amber: {
          accent: '#F59E0B',
          dim: 'rgba(245,158,11,0.15)',
        },
      },
      fontFamily: {
        syne: ['var(--font-syne)', 'sans-serif'],
        space: ['var(--font-space)', 'sans-serif'],
        inter: ['var(--font-space)', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-ai': 'linear-gradient(135deg, #60A5FA 0%, #818CF8 50%, #A78BFA 100%)',
      },
      boxShadow: {
        'blue-sm': '0 0 12px rgba(37,99,235,0.25)',
        'blue-md': '0 0 24px rgba(37,99,235,0.35)',
        'blue-lg': '0 0 48px rgba(37,99,235,0.45)',
        'glow': '0 0 20px rgba(96,165,250,0.4)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
