import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import { rehypeEsHeadingIds } from './src/lib/rehype-es-heading-ids.mjs'
import { rehypeDropTitleH1 } from './src/lib/rehype-drop-title-h1.mjs'

export default defineConfig({
  site: 'https://frxncismor.dev',
  output: 'static',
  markdown: {
    // Colors come from --astro-code-* variables mapped to the --syn-* tokens (global.css).
    shikiConfig: { theme: 'css-variables' },
    // Spanish posts get `es-` heading ids (stable anchors, distinct from the English ones).
    rehypePlugins: [rehypeDropTitleH1, rehypeEsHeadingIds],
  },
  integrations: [
    tailwind({ applyBaseStyles: false }),
    // English at the root, Spanish under /es/: each URL lists its other-language alternate.
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en-US', es: 'es-MX' } },
    }),
  ],
})
