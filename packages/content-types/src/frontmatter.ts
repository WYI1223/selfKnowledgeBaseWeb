import { z } from 'zod';

export const frontmatterSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  tags: z.array(z.string()).default([]),
  date: z.coerce.date(),
  draft: z.boolean().default(false),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;
