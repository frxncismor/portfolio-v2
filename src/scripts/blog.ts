/**
 * Blog list interactivity: topic filter + text search over the featured post and the rows.
 *
 * - Items carry `data-post-slug` and `data-topic`; visibility uses the `hidden` attribute.
 * - Search runs against the manifest embedded in the page (titles and descriptions in the page language).
 * - Both filters compose; the empty state offers a reset.
 */

interface PostManifest {
  slug: string
  title: string
  desc: string
  category: string
}

const ALL = 'all'

function readManifest(): Map<string, PostManifest> {
  const el = document.getElementById('blog-search-index')
  if (!el) return new Map()
  try {
    const list = JSON.parse(el.textContent || '[]') as PostManifest[]
    return new Map(list.map((p) => [p.slug, p]))
  } catch {
    return new Map()
  }
}

function initBlogFilters(): void {
  const search = document.getElementById('blog-search') as HTMLInputElement | null
  const empty = document.getElementById('blog-empty')
  const reset = document.getElementById('blog-reset')
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button[data-filter]'))
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-post-slug]'))
  if (!search || items.length === 0) return

  const manifest = readManifest()
  let topic = ALL

  const apply = (): void => {
    const query = search.value.trim().toLowerCase()
    let shown = 0

    items.forEach((item) => {
      const entry = manifest.get(item.dataset.postSlug ?? '')
      const title = entry?.title ?? ''
      const desc = entry?.desc ?? ''
      const category = item.dataset.topic ?? ''

      const matchesTopic = topic === ALL || category === topic
      const matchesText = !query || `${title} ${desc} ${category}`.toLowerCase().includes(query)

      const visible = matchesTopic && matchesText
      item.hidden = !visible
      if (visible) shown++
    })

    if (empty) empty.hidden = shown > 0
  }

  const setTopic = (next: string): void => {
    topic = next
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === next)))
    apply()
  }

  search.addEventListener('input', apply)
  buttons.forEach((b) => b.addEventListener('click', () => setTopic(b.dataset.filter ?? ALL)))
  reset?.addEventListener('click', () => {
    search.value = ''
    setTopic(ALL)
    search.focus()
  })

  apply()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBlogFilters, { once: true })
} else {
  initBlogFilters()
}
