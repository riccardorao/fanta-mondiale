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
        pitch: {
          DEFAULT: '#0f2318',
          light: '#1a3d2b',
          dark: '#07140e',
        },
        gold: {
          DEFAULT: '#d4af37',
          light: '#f0d060',
          dark: '#a88a20',
        },
        navy: {
          DEFAULT: '#0d1b2a',
          light: '#1e3a5f',
        },
      },
    },
  },
  plugins: [],
}

export default config
