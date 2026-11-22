/**
 * Scroll reveal. `.reveal` elements that start below the fold fade/slide in once
 * (CSS: 500ms, 10px). Siblings stagger by 60ms, capped at 4 steps.
 * No-op with reduced motion or without IntersectionObserver: everything stays visible.
 */

function initReveal(): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce || !('IntersectionObserver' in window)) return

  const viewportHeight = window.innerHeight
  const targets = Array.from(document.querySelectorAll<HTMLElement>('.reveal')).filter(
    (el) => el.getBoundingClientRect().top > viewportHeight,
  )

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const el = entry.target as HTMLElement
        const pending = Array.from(el.parentElement?.children ?? []).filter((c) => c.classList.contains('pending'))
        el.style.transitionDelay = `${Math.min(pending.indexOf(el), 4) * 60}ms`
        el.classList.remove('pending')
        observer.unobserve(el)
      })
    },
    { rootMargin: '0px 0px -8% 0px' },
  )

  targets.forEach((el) => {
    el.classList.add('pending')
    observer.observe(el)
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReveal, { once: true })
} else {
  initReveal()
}
