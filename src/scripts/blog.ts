/**
 * Blog client-side interactivity.
 *
 * Handles:
 * - Inline search against a JSON manifest embedded in the page
 * - Category pill filtering
 * - Both filters compose (search within active category)
 */

interface PostManifest {
  slug:     string
  titleEn:  string
  titleEs:  string
  descEn:   string
  descEs:   string
  category: string
}

function getLang(): string {
  return document.documentElement.getAttribute('data-lang') || 'en'
}

function getManifest(): PostManifest[] {
  const el = document.getElementById('blog-search-index')
  if (!el) return []
  try { return JSON.parse(el.textContent || '[]') } catch { return [] }
}

function filterPosts(): void {
  const searchEl = document.getElementById('blog-search') as HTMLInputElement | null
  const query    = searchEl?.value.toLowerCase().trim() ?? ''
  const activeBtn = document.querySelector<HTMLElement>('[data-filter].filter-active')
  const activeCategory = activeBtn?.dataset.filter ?? 'all'
  const lang = getLang()
  const manifest = getManifest()

  let visibleCount = 0

  document.querySelectorAll<HTMLElement>('[data-post-slug]').forEach((card) => {
    const slug  = card.dataset.postSlug!
    const entry = manifest.find((p) => p.slug === slug)
    if (!entry) return

    const title = lang === 'es' ? entry.titleEs : entry.titleEn
    const desc  = lang === 'es' ? entry.descEs  : entry.descEn

    const matchesSearch   = !query || title.toLowerCase().includes(query) || desc.toLowerCase().includes(query)
    const matchesCategory = activeCategory === 'all' || entry.category.toLowerCase() === activeCategory.toLowerCase()

    const show = matchesSearch && matchesCategory
    card.style.display = show ? '' : 'none'
    if (show) visibleCount++
  })

  const noResults = document.getElementById('blog-no-results')
  if (noResults) noResults.style.display = visibleCount === 0 ? '' : 'none'
}

function initBlogFilters(): void {
  document.getElementById('blog-search')?.addEventListener('input', filterPosts)

  document.querySelectorAll<HTMLElement>('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach((b) => {
        b.classList.remove('filter-active')
        b.setAttribute('aria-pressed', 'false')
      })
      btn.classList.add('filter-active')
      btn.setAttribute('aria-pressed', 'true')
      filterPosts()
    })
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBlogFilters, { once: true })
} else {
  initBlogFilters()
}
