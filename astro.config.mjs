import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import { rehypeEsHeadingIds } from './src/lib/rehype-es-heading-ids.mjs'

export default defineConfig({
  site: 'https://frxncismor.dev',
  output: 'static',
  markdown: {
    // Colors come from --astro-code-* variables mapped to the --syn-* tokens (global.css).
    shikiConfig: { theme: 'css-variables' },
    // Spanish posts get `es-` heading ids so EN and ES (both in the DOM) never share an id.
    rehypePlugins: [rehypeEsHeadingIds],
  },
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
})
