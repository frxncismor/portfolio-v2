/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand:        '#7F77DD',
        'brand-h':    '#8c84eb',
        green:        '#1D9E75',
        cream:        '#e8e4dc',
        base:         '#0c0c0f',
        surface:      '#131316',
        card:         '#111114',
        elevated:     '#1b1b1e',
        border:       '#2C2C2A',
        muted:        '#7a7975',
        outline:      '#928f9d',
        'outline-v':  '#474552',
        'on-sv':      '#c8c4d4',
      },
      fontFamily: {
        headline: ['Epilogue', 'Arial Black', 'sans-serif'],
        mono:     ['"DM Mono"', '"Courier New"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        sm:      '0.25rem',
        md:      '0.5rem',
        full:    '0.75rem',
      },
    },
  },
  plugins: [],
}
