import type { BlockCoreDefinition } from '@skb/block-foundation';
import { z } from 'zod';

const propsSchema = z
  .object({
    language: z.string().min(1),
    code: z.string(),
    showLineNumbers: z.boolean().default(true),
  })
  .strict();

export const codeCore: BlockCoreDefinition<typeof propsSchema> = {
  name: 'code',
  kind: 'component',
  propsSchema,
  mdxComponent: 'Code',
};
