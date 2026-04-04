/**
 * Client-side EN/ES toggle.
 *
 * Flow:
 * 1. Inline <head> script sets data-lang from localStorage (before body renders).
 *    If lang=es, it also sets opacity:0 to prevent EN flash.
 * 2. This module (deferred) applies translations + wires the toggle button.
 * 3. After translations apply, opacity is restored.
 */

import { translations, type Lang } from '../i18n/translations'

function getLang(): Lang {
  return (document.documentElement.getAttribute('data-lang') as Lang) || 'en'
}

function applyTranslations(lang: Lang): void {
  const t = translations[lang]
  const fallback = translations.en

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n')
    if (!key) return
    const value = t[key] ?? fallback[key]
    if (value !== undefined) el.textContent = value
  })

  document.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder')
    if (!key) return
    const value = t[key] ?? fallback[key]
    if (value !== undefined) el.placeholder = value
  })

  // Reveal page hidden by lang-init script (only applies when stored lang is 'es')
  const html = document.documentElement
  if (html.style.opacity === '0') {
    html.style.transition = 'opacity 0.15s ease'
    html.style.opacity = '1'
  }
}

function toggleLang(): void {
  const next: Lang = getLang() === 'en' ? 'es' : 'en'
  localStorage.setItem('lang', next)
  document.documentElement.setAttribute('data-lang', next)
  document.documentElement.setAttribute('lang', next)
  applyTranslations(next)
}

function init(): void {
  // Apply translations for the current language
  applyTranslations(getLang())

  // Wire the toggle button
  document.getElementById('lang-toggle')?.addEventListener('click', toggleLang)
}

// Astro bundles this as a deferred module — DOM is always ready here.
// Wrap in DOMContentLoaded defensively in case the module somehow runs early.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true })
} else {
  init()
}
