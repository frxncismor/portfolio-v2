import type { APIRoute, GetStaticPaths } from 'astro'
import { getPosts } from '../../../lib/posts'
import { renderOgImage, type OgLang } from '../../../lib/og'

export const getStaticPaths = (async () => {
  const posts = await getPosts()
  return posts.flatMap((post) =>
    (['en', 'es'] as const).map((lang) => ({
      params: { lang, slug: post.slug },
      props: {
        title: lang === 'es' ? post.titleEs : post.titleEn,
        category: post.category,
      },
    })),
  )
}) satisfies GetStaticPaths

export const GET: APIRoute = async ({ params, props }) => {
  const lang = params.lang as OgLang
  const png = await renderOgImage({
    title: props.title as string,
    category: props.category as string,
    lang,
  })
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } })
}
