import type { BlockCoreDefinition } from '@skb/block-foundation';
import { z } from 'zod';

/**
 * Wave 6 cf-25 — `@skb/block-markdown` core definition.
 *
 * Per ADR-0011 D1 + cf-25 PR.md D1 (Path B chosen): markdown chunks
 * become first-class grid blocks via ONE wrapper node type
 * (`name: 'markdown'`) that carries inner ProseMirror prose
 * (paragraph / heading / list / blockquote / etc.) as its content.
 *
 * The propsSchema captures ONLY the grid attrs — content lives as
 * ProseMirror children, NOT as a string prop. `rowSpan` accepts the
 * `'auto'` literal in addition to a positive integer because
 * markdown blocks derive their natural row span from rendered
 * content height (per ADR-0016 D3 + the existing mdx-bridge
 * `mdxComponent === 'Markdown'` isProse seam at parse.ts:217 +
 * serialize.ts:185).
 *
 * Naming: `name: 'markdown'` (kebab/lowercase, matches the existing
 * grid-rtt + grid-defensive test fixtures at
 * `packages/mdx-bridge/src/__tests__/grid-{rtt,defensive}.test.ts`
 * which already register a markdown core stub with the same name).
 * `mdxComponent: 'Markdown'` (PascalCase, matches the JSX wrapper
 * tag emitted on serialize when grid attrs are non-default).
 */
const propsSchema = z
  .object({
    col: z.number().int().min(1).max(12),
    row: z.number().int().min(1).optional(),
    colSpan: z.number().int().positive(),
    rowSpan: z.union([z.number().int().positive(), z.literal('auto')]),
  })
  .strict();

export const markdownCore: BlockCoreDefinition<typeof propsSchema> = {
  name: 'markdown',
  kind: 'prose',
  propsSchema,
  mdxComponent: 'Markdown',
};

export type MarkdownProps = z.infer<typeof propsSchema>;
