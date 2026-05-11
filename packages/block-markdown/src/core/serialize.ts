import { markdownCore } from './core-definition';

/**
 * Wave 6 cf-25 — `@skb/block-markdown` serialize hook.
 *
 * Per cf-25 PR.md D5 and D7:
 * - The Tiptap node `type: 'markdown'` carries inner ProseMirror
 *   block children (paragraph / heading / list / blockquote / etc.)
 *   as `node.content`. mdx-bridge passes those children through
 *   the recursive `tiptapBlockToMdast` (or its inline/grid path)
 *   already — `serializeMarkdown` only emits the OUTER MDX JSX
 *   wrapper element + delegates children unchanged.
 * - mdx-bridge's `tiptapComponentToMdast` calls `serialize(...)`
 *   AFTER `serializeGridAttrs(...)` already prepended the canonical
 *   col/colSpan/rowSpan attrs. Per the existing isProse branch
 *   (serialize.ts:185, 206), `rowSpan='auto'` is OMITTED for
 *   Markdown — that branch already handles it. So
 *   `serializeMarkdown` itself must NOT add `rowSpan` to its
 *   `attributes` array.
 * - Children passthrough — mdx-bridge's caller hands us the
 *   stripped-of-grid-attrs `node.content`; we re-emit it as the
 *   JSX element children. mdx-bridge's recursive walker takes over
 *   from there.
 *
 * The default-attrs unwrap pass (cf-25 D5: bare prose mdast in →
 * markdown(default attrs) → bare prose mdast out, NO `<Markdown>`
 * wrapper) lives in mdx-bridge serialize.ts — NOT here. This
 * helper unconditionally emits the wrapper; the caller decides
 * whether to unwrap.
 */
export interface MarkdownTiptapNode {
  readonly type: 'markdown';
  readonly attrs?: Record<string, unknown>;
  readonly content?: readonly unknown[];
}

export interface MarkdownMdastJsxElement {
  readonly type: 'mdxJsxFlowElement';
  readonly name: string;
  readonly attributes: ReadonlyArray<{
    readonly type: 'mdxJsxAttribute';
    readonly name: string;
    readonly value: unknown;
  }>;
  readonly children: readonly unknown[];
}

export function serializeMarkdown(node: MarkdownTiptapNode): MarkdownMdastJsxElement {
  if (node.type !== 'markdown') {
    // `node.type` is narrowed to `never` here by the literal-type check;
    // explicit String coercion satisfies @typescript-eslint/restrict-template-expressions.
    throw new Error(
      `serializeMarkdown: expected type='markdown', got '${String(node.type)}'`,
    );
  }
  // cf-25 D5: this serialize hook ONLY emits the outer JSX wrapper.
  // Inner children are passed through to mdx-bridge's recursive
  // walker. Grid attrs are added by mdx-bridge's
  // `serializeGridAttrs` BEFORE this hook is called.
  return {
    type: 'mdxJsxFlowElement',
    name: markdownCore.mdxComponent,
    attributes: [],
    children: node.content ?? [],
  };
}
