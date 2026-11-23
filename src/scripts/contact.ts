/**
 * "Copy email" button: copies the address with the Clipboard API and confirms for 1.6 s.
 * Without clipboard access (or on failure) it selects the address so the visitor can copy it
 * manually, and says "Selected". Text follows the active language; a polite live region
 * announces the result to screen readers.
 */

import { translations, type Lang } from '../i18n/translations'

const FEEDBACK_MS = 1600

function currentLang(): Lang {
  return document.documentElement.getAttribute('data-lang') === 'es' ? 'es' : 'en'
}

function text(key: string): string {
  return translations[currentLang()][key] ?? translations.en[key] ?? ''
}

function selectNode(node: HTMLElement): void {
  const selection = window.getSelection()
  if (!selection) return
  const range = document.createRange()
  range.selectNodeContents(node)
  selection.removeAllRanges()
  selection.addRange(range)
}

function init(): void {
  const button = document.getElementById('copy-btn') as HTMLButtonElement | null
  const email = document.getElementById('email')
  const status = document.getElementById('copy-status')
  if (!button || !email) return

  let timer: number | undefined

  const flash = (key: string): void => {
    button.textContent = text(key)
    if (status) status.textContent = text(key)
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      button.textContent = text('contact.copy')
      if (status) status.textContent = ''
    }, FEEDBACK_MS)
  }

  button.addEventListener('click', async () => {
    const address = email.textContent?.trim() ?? ''
    try {
      await navigator.clipboard.writeText(address)
      flash('contact.copied')
    } catch {
      selectNode(email)
      flash('contact.selected')
    }
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true })
} else {
  init()
}
