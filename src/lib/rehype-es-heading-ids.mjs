/**
 * Rehype plugin: prefixes the heading ids of the Spanish posts (src/content/blog-es/) with `es-`.
 * Each language now has its own route (`/blog/<slug>` and `/es/blog/<slug>`); the prefix stays so
 * Spanish section anchors keep the ids they already had and never collide with the English ones.
 *
 * Astro keeps ids that already exist, so setting them here (before its own heading-id pass)
 * is enough; the table of contents reads the final ids back from `render().headings`.
 */

/** @param {{ children?: any[]; type: string; value?: string }} node */
function textOf(node) {
  if (node.type === 'text' || node.type === 'raw') return node.value ?? ''
  return (node.children ?? []).map(textOf).join('')
}

/** Same shape as github-slugger (what Astro uses): lowercase, drop punctuation, spaces to hyphens. */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
    .replace(/\s/g, '-')
}

export function rehypeEsHeadingIds() {
  return (tree, file) => {
    const path = String(file.path ?? file.history?.[0] ?? '').replaceAll('\\', '/')
    if (!path.includes('/content/blog-es/')) return

    const seen = new Map()
    const walk = (node) => {
      if (node.type === 'element' && /^h[1-6]$/.test(node.tagName)) {
        const base = slugify(textOf(node)).replace(/-$/, '')
        const count = seen.get(base) ?? 0
        seen.set(base, count + 1)
        node.properties = node.properties ?? {}
        node.properties.id = `es-${count === 0 ? base : `${base}-${count}`}`
      }
      node.children?.forEach(walk)
    }
    walk(tree)
  }
}
