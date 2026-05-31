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
        // ── Light surfaces ──────────────────────────────────────────────
        canvas: '#FFFFFF',
        surface: '#FFFFFF',
        // Legacy "night" scale remapped to light neutrals so every existing
        // `bg-night*` / `night-*` usage flips to the light theme automatically.
        night: {
          DEFAULT: '#FFFFFF',
          1: '#F5F6FB',
          2: '#EEF1F8',
          3: '#E4E8F2',
          4: '#D7DCEA',
        },
        // ── Text / ink ──────────────────────────────────────────────────
        ink: {
          DEFAULT: '#0F172A', // headings — near-black navy
          soft: '#37415A',    // body text
          muted: '#5B6678',   // secondary text (still clearly readable)
        },
        // ── Brand: blue ─────────────────────────────────────────────────
        blue: {
          DEFAULT: '#2563EB',
          primary: '#2563EB',
          hover: '#1D4ED8',
          light: '#3B82F6',   // readable accent on white
          dim: 'rgba(37,99,235,0.10)',
          glow: 'rgba(37,99,235,0.25)',
        },
        // ── Brand: red ──────────────────────────────────────────────────
        red: {
          DEFAULT: '#E11D48',
          primary: '#E11D48',
          hover: '#BE123C',
          light: '#F43F5E',
          dim: 'rgba(225,29,72,0.10)',
        },
        // ── Brand: purple (the "AI" in FANTAID) ─────────────────────────
        purple: {
          DEFAULT: '#8B5CF6',
          primary: '#8B5CF6',
          hover: '#7C3AED',
          light: '#A78BFA',
          dim: 'rgba(139,92,246,0.10)',
        },
        // Status accent (warnings / locked). Darkened for contrast on white.
        amber: {
          accent: '#B45309',
          dim: 'rgba(180,83,9,0.12)',
        },
      },
      // Type scale bumped one step up across the board — nothing tiny, very
      // legible on phones.
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.2rem' }],   // 13px
        sm: ['0.9375rem', { lineHeight: '1.45rem' }],  // 15px
        base: ['1.0625rem', { lineHeight: '1.65rem' }],// 17px
        lg: ['1.1875rem', { lineHeight: '1.8rem' }],   // 19px
        xl: ['1.375rem', { lineHeight: '1.9rem' }],    // 22px
        '2xl': ['1.625rem', { lineHeight: '2.05rem' }],// 26px
        '3xl': ['2rem', { lineHeight: '2.3rem' }],     // 32px
        '4xl': ['2.5rem', { lineHeight: '2.7rem' }],   // 40px
        '5xl': ['3.25rem', { lineHeight: '1.05' }],    // 52px
        '6xl': ['4rem', { lineHeight: '1.02' }],       // 64px
        '7xl': ['4.75rem', { lineHeight: '1' }],
      },
      fontFamily: {
        syne: ['var(--font-syne)', 'sans-serif'],
        space: ['var(--font-space)', 'sans-serif'],
        inter: ['var(--font-space)', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-ai': 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        'gradient-brand': 'linear-gradient(135deg, #2563EB 0%, #8B5CF6 50%, #E11D48 100%)',
      },
      boxShadow: {
        'blue-sm': '0 6px 18px rgba(37,99,235,0.18)',
        'blue-md': '0 10px 28px rgba(37,99,235,0.22)',
        'blue-lg': '0 16px 40px rgba(37,99,235,0.25)',
        'glow': '0 8px 24px rgba(139,92,246,0.22)',
        'card': '0 6px 24px rgba(15,23,42,0.07), 0 1px 3px rgba(15,23,42,0.05)',
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
