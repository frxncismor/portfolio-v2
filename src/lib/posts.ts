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

/**
 * Published posts (newest first), each paired with its Spanish translation.
 * The build fails if a published English post has no Spanish counterpart,
 * so `/es/blog/<slug>` always exists for every `/blog/<slug>`.
 */
export async function getPosts(): Promise<Post[]> {
  const enPosts = await getCollection('blog-en', ({ data }) => !data.draft)
  const esPosts = await getCollection('blog-es', ({ data }) => !data.draft)
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
