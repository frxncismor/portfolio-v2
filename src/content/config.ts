import { defineCollection, z } from 'astro:content'
import { COVERS } from '../lib/covers'

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    description: z.string(),
    date:        z.coerce.date(),
    category:    z.string(),
    cover:       z.enum(COVERS).optional(),
    draft:       z.boolean().optional().default(false),
  }),
})

export const collections = {
  'blog-en': blogCollection,
  'blog-es': blogCollection,
}
