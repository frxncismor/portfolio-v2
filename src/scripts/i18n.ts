/**
 * Client-side EN/ES toggle.
 *
 * Flow:
 * 1. Inline <head> script sets data-lang from localStorage before the body renders.
 *    Markup in `.lang-en` / `.lang-es` blocks switches by CSS alone.
 * 2. This module applies `data-i18n*` translations and wires the toggle button.
 *    Until it runs, CSS hides only the translatable fragments (never the page) when lang=es.
 */

import { translations, type Lang } from '../i18n/translations'

function getLang(): Lang {
  return document.documentElement.getAttribute('data-lang') === 'es' ? 'es' : 'en'
}

function applyTranslations(lang: Lang): void {
  const t = translations[lang]
  const fallback = translations.en
  const lookup = (key: string | null): string | undefined => (key ? (t[key] ?? fallback[key]) : undefined)

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const value = lookup(el.getAttribute('data-i18n'))
    if (value !== undefined) el.textContent = value
  })

  document.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]').forEach((el) => {
    const value = lookup(el.getAttribute('data-i18n-placeholder'))
    if (value !== undefined) el.placeholder = value
  })

  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => {
    const value = lookup(el.getAttribute('data-i18n-aria'))
    if (value !== undefined) el.setAttribute('aria-label', value)
  })

  document.documentElement.setAttribute('data-i18n-ready', '')
}

function toggleLang(): void {
  const next: Lang = getLang() === 'en' ? 'es' : 'en'
  try {
    localStorage.setItem('lang', next)
  } catch {
    // storage unavailable: the choice just won't persist
  }
  document.documentElement.setAttribute('data-lang', next)
  document.documentElement.setAttribute('lang', next)
  applyTranslations(next)
}

function init(): void {
  applyTranslations(getLang())
  document.getElementById('lang-toggle')?.addEventListener('click', toggleLang)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true })
} else {
  init()
}
