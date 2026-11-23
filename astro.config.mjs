import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://frxncismor.dev',
  output: 'static',
  markdown: {
    // Colors come from --astro-code-* variables mapped to the --syn-* tokens (global.css).
    shikiConfig: { theme: 'css-variables' },
  },
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
})
