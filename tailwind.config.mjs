/**
 * Colors come from CSS variables (src/styles/tokens.css) so a theme change is one attribute.
 * `tok()` keeps Tailwind opacity modifiers working (e.g. `text-ink/60`) via color-mix.
 */
const tok = (name) => `color-mix(in srgb, var(--${name}) calc(<alpha-value> * 100%), transparent)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper:         tok('paper'),
        surface:       tok('surface'),
        sunken:        tok('sunken'),
        ink:           tok('ink'),
        muted:         tok('muted'),
        hairline:      tok('hairline'),
        accent:        tok('accent'),
        'accent-soft': tok('accent-soft'),
        'on-accent':   tok('on-accent'),
        clay:          tok('clay'),
        deep:          tok('deep'),
        art: {
          ember:      tok('art-ember'),
          'ink-warm': tok('art-ink-warm'),
          night:      tok('art-night'),
          cream:      tok('art-cream'),
          pine:       tok('art-pine'),
          'pine-dark': tok('art-pine-dark'),
          'pine-deep': tok('art-pine-deep'),
          road:       tok('art-road'),
          mist:       tok('art-mist'),
          'wall-l':   tok('art-wall-l'),
          'wall-r':   tok('art-wall-r'),
          ceiling:    tok('art-ceiling'),
          paper:      tok('art-paper'),
          ink:        tok('art-ink'),
          coal:       tok('art-coal'),
        },
        // TEMPORAL (paradas 1–4): alias de la paleta antigua → tokens nuevos, para que las
        // secciones aún no migradas compilen y se lean. Se eliminan al migrar cada sección.
        brand:        tok('accent'),
        'brand-h':    tok('ink'),
        green:        tok('accent'),
        cream:        tok('ink'),
        base:         tok('paper'),
        card:         tok('surface'),
        elevated:     tok('surface'),
        border:       tok('hairline'),
        outline:      tok('muted'),
        'outline-v':  tok('hairline'),
        'on-sv':      tok('muted'),
        glass:        'color-mix(in srgb, var(--ink) 5%, transparent)',
        'glass-line': 'color-mix(in srgb, var(--ink) 10%, transparent)',
      },
      fontFamily: {
        display:  'var(--display)',
        sans:     'var(--sans)',
        mono:     'var(--mono)',
        headline: 'var(--display)', // TEMPORAL: alias antiguo
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
      },
      maxWidth: {
        wrap: '1120px',
      },
      boxShadow: {
        sm:    'var(--shadow-sm)',
        focus: 'var(--focus)',
      },
    },
  },
  plugins: [],
}
