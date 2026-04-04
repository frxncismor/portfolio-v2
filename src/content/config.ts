import { defineCollection, z } from 'astro:content'

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    description: z.string(),
    date:        z.coerce.date(),
    category:    z.string(),
    draft:       z.boolean().optional().default(false),
  }),
})

export const collections = {
  'blog-en': blogCollection,
  'blog-es': blogCollection,
}
