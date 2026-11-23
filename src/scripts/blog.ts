/**
 * Blog list interactivity: topic filter + text search over the whole language manifest.
 *
 * - The manifest embedded in the page lists every post (not just the current page).
 * - While a search or topic filter is active, matches render in `#blog-results` and the
 *   paginated list (featured post, rows, pager) is hidden; clearing both brings it back.
 * - Both filters compose; the empty state offers a reset.
 */

interface PostManifest {
  slug: string
  title: string
  desc: string
  category: string
  date: string
  href: string
}

const ALL = 'all'

function readManifest(): PostManifest[] {
  const el = document.getElementById('blog-search-index')
  if (!el) return []
  try {
    return JSON.parse(el.textContent || '[]') as PostManifest[]
  } catch {
    return []
  }
}

function buildRow(template: HTMLTemplateElement, post: PostManifest): HTMLElement | null {
  const row = (template.content.firstElementChild?.cloneNode(true) as HTMLAnchorElement | null) ?? null
  if (!row) return null
  row.href = post.href
  row.dataset.postSlug = post.slug
  row.dataset.topic = post.category
  row.classList.remove('reveal')
  const set = (selector: string, text: string): void => {
    const node = row.querySelector(selector)
    if (node) node.textContent = text
  }
  set('.label', post.date)
  set('h3', post.title)
  set('p', post.desc)
  set('.topic', post.category)
  return row
}

function initBlogFilters(): void {
  const search = document.getElementById('blog-search') as HTMLInputElement | null
  const page = document.getElementById('blog-page')
  const results = document.getElementById('blog-results')
  const template = document.getElementById('blog-row-template') as HTMLTemplateElement | null
  const empty = document.getElementById('blog-empty')
  const reset = document.getElementById('blog-reset')
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button[data-filter]'))
  if (!search || !page || !results || !template) return

  const manifest = readManifest()
  let topic = ALL

  const apply = (): void => {
    const query = search.value.trim().toLowerCase()
    const active = query !== '' || topic !== ALL
    page.hidden = active
    results.hidden = !active
    results.replaceChildren()
    if (!active) {
      if (empty) empty.hidden = true
      return
    }

    const matches = manifest.filter(
      (p) =>
        (topic === ALL || p.category === topic) &&
        (!query || `${p.title} ${p.desc} ${p.category}`.toLowerCase().includes(query)),
    )
    matches.forEach((p) => {
      const row = buildRow(template, p)
      if (row) results.appendChild(row)
    })
    if (empty) empty.hidden = matches.length > 0
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
