import { getCollection, type CollectionEntry } from 'astro:content'

export interface Post {
  slug: string
  en: CollectionEntry<'blog-en'>
  es: CollectionEntry<'blog-es'>
  titleEn: string
  titleEs: string
  descEn: string
  descEs: string
  category: string
  date: Date
}

const SCHEDULE_TIME_ZONE = 'America/Chicago'

/** Calendar day (`YYYY-MM-DD`) in Chicago; `BUILD_NOW=YYYY-MM-DD` overrides it to simulate another date. */
function todayInChicago(): string {
  const override = process.env.BUILD_NOW
  if (override) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(override)) {
      throw new Error(`BUILD_NOW must be YYYY-MM-DD, got "${override}".`)
    }
    return override
  }
  return new Intl.DateTimeFormat('en-CA', { timeZone: SCHEDULE_TIME_ZONE }).format(new Date())
}

/**
 * Whether future-dated posts are included: always in dev and on Vercel previews,
 * or anywhere with `SHOW_SCHEDULED=1`. Production (`VERCEL_ENV=production`, or a
 * local build with no `VERCEL_ENV`) only shows posts dated today (Chicago) or earlier.
 */
function showScheduled(): boolean {
  return import.meta.env.DEV || process.env.VERCEL_ENV === 'preview' || process.env.SHOW_SCHEDULED === '1'
}

/** Single visibility filter: not a draft and, unless scheduled posts are shown, dated on or before today. */
function isVisible({ data }: { data: { draft: boolean; date: Date } }): boolean {
  if (data.draft) return false
  return showScheduled() || data.date.toISOString().slice(0, 10) <= todayInChicago()
}

/**
 * Visible posts (newest first), each paired with its Spanish translation.
 * The build fails if a visible English post has no Spanish counterpart,
 * so `/es/blog/<slug>` always exists for every `/blog/<slug>`.
 */
export async function getPosts(): Promise<Post[]> {
  const enPosts = await getCollection('blog-en', isVisible)
  const esPosts = await getCollection('blog-es', isVisible)
  const esBySlug = new Map(esPosts.map((p) => [p.slug, p]))

  const missing = enPosts.filter((p) => !esBySlug.has(p.slug)).map((p) => p.slug)
  if (missing.length > 0) {
    throw new Error(
      `Missing Spanish translation in src/content/blog-es/ for: ${missing.join(', ')}. ` +
        'Every post in blog-en/ needs a file with the same name in blog-es/.',
    )
  }

  return enPosts
    .map((en) => {
      const es = esBySlug.get(en.slug)!
      return {
        slug: en.slug,
        en,
        es,
        titleEn: en.data.title,
        titleEs: es.data.title,
        descEn: en.data.description,
        descEs: es.data.description,
        category: en.data.category,
        date: en.data.date,
      }
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}

/** Static paths for `/blog/[slug]` and `/es/blog/[slug]`: each post with its newer ("next") and older ("prev") neighbor. */
export async function getPostPaths() {
  const posts = await getPosts()
  return posts.map((post, i) => ({
    params: { slug: post.slug },
    props: {
      post,
      next: i > 0 ? posts[i - 1] : undefined,
      prev: i < posts.length - 1 ? posts[i + 1] : undefined,
    },
  }))
}

/** Posts per blog listing page. On page 1 the featured post counts as one of them. */
export const BLOG_PAGE_SIZE = 9

export function blogPageCount(total: number): number {
  return Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE))
}

/** Static paths for `/blog/page/N` and `/es/blog/page/N`: page 1 is `/blog`, so N starts at 2. */
export async function getBlogPagePaths() {
  const pages = blogPageCount((await getPosts()).length)
  return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ params: { page: String(i + 2) } }))
}
