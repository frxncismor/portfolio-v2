import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

export type OgLang = 'en' | 'es'

export const OG_WIDTH = 1200
export const OG_HEIGHT = 630

/** Public path of the generated Open Graph image for a post: `/og/<lang>/<slug>.png`. */
export function ogImagePath(slug: string, lang: OgLang): string {
  return `/og/${lang}/${slug}.png`
}

// Light-theme colors copied from src/styles/tokens.css (hex values, since satori has no CSS variables).
const COLOR = {
  paper: '#F7F5F0', // --paper
  ink: '#1A1C1A', // --ink
  muted: '#5E625D', // --muted
  hairline: '#DEDAD1', // --hairline
  accent: '#2F5D50', // --accent
  accentSoft: '#DCE7E2', // --accent-soft
} as const

interface FontDef {
  name: string
  data: Buffer
  weight: 400 | 500 | 600
  style: 'normal'
}

let fontsCache: FontDef[] | undefined

// TTF files (satori cannot read woff2) from Google Fonts, OFL-licensed; see src/assets/fonts/.
function loadFonts(): FontDef[] {
  if (!fontsCache) {
    const dir = join(process.cwd(), 'src', 'assets', 'fonts')
    const read = (file: string): Buffer => readFileSync(join(dir, file))
    fontsCache = [
      { name: 'Fraunces', data: read('Fraunces-SemiBold.ttf'), weight: 600, style: 'normal' }, // --display
      { name: 'Geist', data: read('Geist-Regular.ttf'), weight: 400, style: 'normal' }, // --sans
      { name: 'Geist', data: read('Geist-Medium.ttf'), weight: 500, style: 'normal' },
      { name: 'Geist Mono', data: read('GeistMono-Medium.ttf'), weight: 500, style: 'normal' }, // --mono
    ]
  }
  return fontsCache
}

/** Title font size stepped down by length so long titles fit in at most 3 lines. */
function titleFontSize(title: string): number {
  const n = title.length
  if (n <= 40) return 76
  if (n <= 70) return 62
  if (n <= 100) return 52
  return 44
}

export interface OgOptions {
  title: string
  category: string
  lang: OgLang
}

type Node = {
  type: string
  props: { style?: Record<string, string | number>; children?: Node | Node[] | string }
}

const el = (
  type: string,
  style: Record<string, string | number>,
  children?: Node | Node[] | string,
): Node => ({ type, props: { style, children } })

function buildTree({ title, category, lang }: OgOptions): Node {
  const byline = lang === 'es' ? 'Ingeniero de Software Full-Stack' : 'Full-Stack Software Engineer'

  const brand = el('div', { display: 'flex', alignItems: 'center' }, [
    el('div', { display: 'flex', alignItems: 'baseline', fontFamily: 'Fraunces', fontWeight: 600, fontSize: 44, letterSpacing: -2, color: COLOR.ink }, [
      el('span', {}, 'FM'),
      el('div', { width: 8, height: 8, marginLeft: 3, borderRadius: 4, backgroundColor: COLOR.accent }),
    ]),
    el('div', { width: 1, height: 34, margin: '0 18px', backgroundColor: COLOR.hairline }),
    el('div', { display: 'flex', fontFamily: 'Geist', fontWeight: 500, fontSize: 24, color: COLOR.ink }, 'Francisco Moreno'),
  ])

  const chip = el(
    'div',
    {
      display: 'flex',
      padding: '8px 18px',
      borderRadius: 999,
      backgroundColor: COLOR.accentSoft,
      color: COLOR.accent,
      fontFamily: 'Geist Mono',
      fontWeight: 500,
      fontSize: 22,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    category,
  )

  return el(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: OG_WIDTH,
      height: OG_HEIGHT,
      padding: '56px 72px 62px',
      backgroundColor: COLOR.paper,
      boxSizing: 'border-box',
      position: 'relative',
    },
    [
      el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, [brand, chip]),
      el(
        'div',
        {
          display: 'flex',
          fontFamily: 'Fraunces',
          fontWeight: 600,
          fontSize: titleFontSize(title),
          lineHeight: 1.12,
          letterSpacing: -0.5,
          color: COLOR.ink,
          maxHeight: 360,
          overflow: 'hidden',
        },
        title,
      ),
      el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, [
        el('div', { display: 'flex', fontFamily: 'Geist', fontWeight: 400, fontSize: 26, color: COLOR.muted }, byline),
        el('div', { display: 'flex', fontFamily: 'Geist Mono', fontWeight: 500, fontSize: 26, color: COLOR.accent }, 'frxncismor.dev'),
      ]),
      el('div', { position: 'absolute', left: 0, bottom: 0, width: OG_WIDTH, height: 8, backgroundColor: COLOR.accent }),
    ],
  )
}

/** Renders the 1200×630 Open Graph PNG for a post title. */
export async function renderOgImage(options: OgOptions): Promise<Buffer> {
  // satori's element type is React-shaped; our plain-object tree is structurally compatible.
  const svg = await satori(buildTree(options) as unknown as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: loadFonts(),
  })
  return new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng()
}
