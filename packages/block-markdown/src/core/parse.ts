import { markdownCore } from './core-definition';
import type { MarkdownMdastJsxElement, MarkdownTiptapNode } from './serialize';

/**
 * Wave 6 cf-25 — `@skb/block-markdown` parse hook.
 *
 * Per cf-25 PR.md D5 + D7: the MDX `<Markdown ...>...</Markdown>`
 * JSX wrapper element arrives as a `mdxJsxFlowElement` with inner
 * mdast block children (paragraph / heading / list / etc.). We
 * convert it to a Tiptap node `type: 'markdown'` that mdx-bridge
 * will then walk recursively to convert the inner mdast children
 * into Tiptap prose nodes.
 *
 * Behavior:
 * - Reject when `node.name !== 'Markdown'` (defensive — only the
 *   dispatch table should call us with the right name).
 * - DO NOT touch attributes here — mdx-bridge's `parseGridAttrs`
 *   already extracted col/colSpan/row/rowSpan and merged them via
 *   `mergeGridAttrs` BEFORE this hook is invoked (per
 *   parse.ts:217-223 contract).
 * - Children passthrough — mdx-bridge's caller will recurse into
 *   `node.children` separately via `mdastBlockToTiptap`. We return
 *   `content: node.children` unchanged so the caller can perform
 *   that recursion at the parent level.
 *
 * Note on the children walk: the existing mdx-bridge dispatch path
 * (parse.ts:206-225) does NOT recurse into a JSX element's children
 * — it leaves children as the raw mdast in `_mdast` and trusts the
 * dispatch's `parse` to produce the final TiptapNode. cf-25 changes
 * that contract for `markdown` blocks: mdx-bridge's parse path is
 * extended in the same PR to recurse `<Markdown>` children into
 * Tiptap blocks via the existing `mdastBlockToTiptap` recursion.
 * This hook returns the raw children placeholder; mdx-bridge fills
 * it in with the recursed Tiptap blocks.
 */
export function parseMarkdown(node: MarkdownMdastJsxElement): MarkdownTiptapNode {
  if (node.name !== markdownCore.mdxComponent) {
    throw new Error(
      `parseMarkdown: expected mdxComponent='${markdownCore.mdxComponent}', got '${node.name}'`,
    );
  }
  return {
    type: 'markdown',
    attrs: {},
    content: node.children,
  };
}
