/**
 * Rehype plugin: drops the leading `# Title` of a blog post.
 * The article page already renders the title as its own <h1> (from front matter),
 * so keeping the markdown one would leave 3 <h1> in the HTML (page + EN body + ES body).
 */

/** @param {{ children?: any[]; type: string }} tree @param {{ path?: string; history?: string[] }} file */
export function rehypeDropTitleH1() {
  return (tree, file) => {
    const path = String(file.path ?? file.history?.[0] ?? '').replaceAll('\\', '/')
    if (!path.includes('/content/blog-')) return

    const first = (tree.children ?? []).find((n) => n.type === 'element')
    if (first?.tagName === 'h1') tree.children = tree.children.filter((n) => n !== first)
  }
}
