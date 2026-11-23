import type { Lang } from './translations'

/**
 * URL scheme: English lives at the root (`/`, `/blog/`, `/blog/<slug>/`), Spanish under `/es/`
 * with the same slugs. The route decides the language; there are no automatic redirects.
 */

/** Open Graph locales (og:locale). */
export const ogLocale: Record<Lang, string> = { en: 'en_US', es: 'es_MX' }

/** BCP 47 locales for dates. */
export const dateLocale: Record<Lang, string> = { en: 'en-US', es: 'es-MX' }

const ES_PREFIX = /^\/es(?=\/|#|$)/

/** Language of a pathname: `/es` and anything under `/es/` is Spanish. */
export function langFromPath(pathname: string): Lang {
  return ES_PREFIX.test(pathname) ? 'es' : 'en'
}

/** The English path of any path (drops the `/es` prefix). `/es` and `/es/` map to `/`. */
export function basePath(path: string): string {
  const rest = path.replace(ES_PREFIX, '')
  return rest === '' || rest.startsWith('#') ? `/${rest}` : rest
}

/**
 * Localizes an internal path or `/#anchor`: `/blog/` → `/es/blog/`, `/#work` → `/es/#work`, `/` → `/es/`.
 * English paths come back unchanged.
 */
export function localePath(lang: Lang, path: string): string {
  const base = basePath(path)
  return lang === 'en' ? base : `/es${base}`
}

/** Pathname with a trailing slash (the static build serves `/blog/` as the canonical form). */
export function withSlash(pathname: string): string {
  return pathname.endsWith('/') ? pathname : `${pathname}/`
}
