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

function toggleTheme(): void {
  const next: Theme = effectiveTheme() === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  try {
    localStorage.setItem('fm-theme', next)
  } catch {
    // storage unavailable: the choice just won't persist
  }
  syncThemeColor()
}

document.querySelectorAll<HTMLElement>('[data-theme-toggle]').forEach((btn) => {
  btn.addEventListener('click', toggleTheme)
})
