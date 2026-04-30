import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { frontmatterSchema } from '@skb/content-types';

const notes = defineCollection({
  loader: glob({ pattern: '**/index.mdx', base: '../../content/notes' }),
  schema: frontmatterSchema,
});

export const collections = { notes };
