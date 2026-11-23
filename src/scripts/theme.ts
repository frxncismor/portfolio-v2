/**
 * Theme toggle. The <head> script in Layout.astro applies the saved theme before first paint;
 * this module only handles clicks. Preference is stored under `fm-theme`.
 */

type Theme = 'light' | 'dark'

function effectiveTheme(): Theme {
  const set = document.documentElement.getAttribute('data-theme')
  if (set === 'light' || set === 'dark') return set
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function syncThemeColor(): void {
  const paper = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim()
  if (!paper) return
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.removeAttribute('media')
    meta.content = paper
  })
}

function syncFavicon(theme: Theme): void {
  document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]').forEach((link) => {
    const isLight = link.href.includes('avatar-light')
    const isDark = link.href.includes('avatar-dark')
    if (!isLight && !isDark) return
    // Keep only the icon matching the chosen theme: drop the media query on it, disable the other.
    link.media = (theme === 'light') === isLight ? 'all' : 'not all'
  })
}

function applyTheme(next: Theme): void {
  document.documentElement.setAttribute('data-theme', next)
  syncThemeColor()
  syncFavicon(next)
}

/** Theme being applied (may be ahead of the DOM while a view transition is pending), so rapid clicks alternate. */
let pending: Theme | null = null

function toggleTheme(): void {
  const next: Theme = (pending ?? effectiveTheme()) === 'dark' ? 'light' : 'dark'
  pending = next
  try {
    localStorage.setItem('fm-theme', next)
  } catch {
    // storage unavailable: the choice just won't persist
  }

  const root = document.documentElement
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!reduced && typeof document.startViewTransition === 'function') {
    // Compositor cross-fade of the whole page (see ::view-transition rules in global.css).
    const transition = document.startViewTransition(() => applyTheme(next))
    void transition.finished.finally(() => {
      if (pending === next) pending = null
    })
    return
  }

  // Instant, clean swap: suspend every transition for one frame so none is caught half-way.
  root.classList.add('theme-instant')
  applyTheme(next)
  void root.offsetWidth
  requestAnimationFrame(() => {
    root.classList.remove('theme-instant')
    if (pending === next) pending = null
  })
}

document.querySelectorAll<HTMLElement>('[data-theme-toggle]').forEach((btn) => {
  btn.addEventListener('click', toggleTheme)
})
