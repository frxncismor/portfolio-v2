/**
 * Animation system — Intersection Observer + stagger.
 *
 * Hero elements: revealed immediately via double requestAnimationFrame
 * (guarantees first paint is done before adding .visible).
 *
 * Scroll elements: observed via IntersectionObserver.
 * Init on `window.load` so layout is fully settled before the observer
 * records initial intersections.
 */

function applyStagger(group: Element) {
  group.querySelectorAll<HTMLElement>('.fade-in').forEach((el, i) => {
    el.style.transitionDelay = `${i * 100}ms`
  })
}

function initScrollAnimations() {
  // Stagger delays for card grids
  document.querySelectorAll('.stagger-group').forEach(applyStagger)

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px',
    }
  )

  document.querySelectorAll<HTMLElement>('.fade-in').forEach((el) => {
    if (!el.closest('#hero')) {
      observer.observe(el)
    }
  })
}

function initHeroAnimations() {
  const heroEls = document.querySelectorAll<HTMLElement>('#hero .fade-in')
  // Double rAF: first frame schedules the work, second frame runs after
  // the browser has committed the first paint — avoids invisible flash.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      heroEls.forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), i * 120)
      })
    })
  })
}

// Hero: start as soon as possible (doesn't need layout info)
initHeroAnimations()

// Scroll: wait for full page load so layout is stable
if (document.readyState === 'complete') {
  initScrollAnimations()
} else {
  window.addEventListener('load', initScrollAnimations, { once: true })
}
