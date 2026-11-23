/**
 * Article page behavior:
 * - Reading progress bar (2px under the navbar).
 * - Table-of-contents scroll-spy (last h2 whose top is above 140px) and click-to-scroll.
 * - Code blocks: wraps each `pre` in `figure.code` with the language and a Copy button.
 *
 * The page renders one `.prose`, in the language of the route (`<html data-lang>`).
 */

import { translations, type Lang } from '../i18n/translations'

const SPY_OFFSET = 140
const FEEDBACK_MS = 1500

function getLang(): Lang {
  return document.documentElement.getAttribute('data-lang') === 'es' ? 'es' : 'en'
}

function t(key: string): string {
  return translations[getLang()][key] ?? translations.en[key] ?? key
}

function prose(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.prose')
}

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function enhanceCode(): void {
  document.querySelectorAll<HTMLPreElement>('.prose pre').forEach((pre) => {
    if (pre.parentElement?.classList.contains('code')) return

    const figure = document.createElement('figure')
    figure.className = 'code'

    const caption = document.createElement('figcaption')
    const lang = document.createElement('span')
    lang.textContent = pre.dataset.language && pre.dataset.language !== 'plaintext' ? pre.dataset.language : 'text'

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'copy-code'
    button.textContent = t('blog.copy')

    let timer: number | undefined
    button.addEventListener('click', () => {
      const text = pre.querySelector('code')?.textContent ?? pre.textContent ?? ''
      const done = (key: string): void => {
        button.textContent = t(key)
        window.clearTimeout(timer)
        timer = window.setTimeout(() => {
          button.textContent = t('blog.copy')
        }, FEEDBACK_MS)
      }
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(() => done('blog.copied'), () => done('blog.copy-fail'))
      } else {
        done('blog.copy-fail')
      }
    })

    caption.append(lang, button)
    pre.replaceWith(figure)
    figure.append(caption, pre)
  })
}

function initProgressAndSpy(): void {
  const bar = document.getElementById('progress-bar')
  let ticking = false

  const update = (): void => {
    ticking = false
    const body = prose()
    if (!body) return

    if (bar) {
      const rect = body.getBoundingClientRect()
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - window.innerHeight)))
      bar.style.width = `${progress * 100}%`
    }

    const current = Array.from(body.querySelectorAll<HTMLElement>('h2[id]'))
      .filter((h) => h.getBoundingClientRect().top < SPY_OFFSET)
      .pop()
    document.querySelectorAll<HTMLAnchorElement>('.toc a').forEach((a) => {
      const on = !!current && a.dataset.target === current.id
      a.classList.toggle('on', on)
      if (on) a.setAttribute('aria-current', 'location')
      else a.removeAttribute('aria-current')
    })
  }

  const schedule = (): void => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(update)
  }

  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  update()
}

function initTocClicks(): void {
  document.querySelectorAll<HTMLAnchorElement>('.toc a').forEach((a) => {
    a.addEventListener('click', (event) => {
      event.preventDefault()
      const id = a.dataset.target
      const target = id ? prose()?.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`) : null
      if (!id || !target) return
      target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' })
      // Keep the URL shareable and move focus to the section for keyboard and screen-reader users.
      history.replaceState(null, '', `#${id}`)
      target.tabIndex = -1
      target.focus({ preventScroll: true })
    })
  })
}

function init(): void {
  enhanceCode()
  initTocClicks()
  initProgressAndSpy()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true })
} else {
  init()
}
