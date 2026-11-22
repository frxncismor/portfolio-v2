/**
 * Mobile menu (≤900px): a button toggles a panel with the same links as the navbar.
 * Closes on Esc (focus returns to the button), on link choice, on outside click and
 * when the viewport grows past 900px.
 */

const button = document.getElementById('menu-toggle') as HTMLButtonElement | null
const panel = document.getElementById('nav-menu')
const wide = window.matchMedia('(min-width: 901px)')

function setOpen(open: boolean): void {
  if (!button || !panel) return
  button.setAttribute('aria-expanded', String(open))
  panel.hidden = !open
}

if (button && panel) {
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'))

  panel.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('a')) setOpen(false)
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      setOpen(false)
      button.focus()
    }
  })

  document.addEventListener('click', (event) => {
    if (button.getAttribute('aria-expanded') !== 'true') return
    const target = event.target as Node
    if (!panel.contains(target) && !button.contains(target)) setOpen(false)
  })

  wide.addEventListener('change', (event) => {
    if (event.matches) setOpen(false)
  })
}
