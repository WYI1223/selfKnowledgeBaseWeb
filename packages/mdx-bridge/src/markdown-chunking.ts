import type { RootContent } from 'mdast';
import type { MdastJsxElement } from './dispatch-table';

/**
 * Wave 6 cf-25 — markdown wrapper-block chunking + unwrap helpers.
 *
 * Extracted from parse.ts + serialize.ts per the 500-LOC hard cap
 * (`scripts/check-size-limits.mjs`). The chunking pass + unwrap-on-default
 * pass are tight conceptual siblings (chunking is the inverse of unwrap),
 * so they share this module.
 *
 * See `packages/mdx-bridge/CONTRACT.md` for the round-trip invariant
 * + the cf-25 PR.md D5 specification this module implements.
 */

const GRID_ATTR_NAMES = new Set(['col', 'row', 'colSpan', 'rowSpan']);

type MdastJsxAttribute = Extract<
  MdastJsxElement['attributes'][number],
  { type: 'mdxJsxAttribute' }
>;

/**
 * Wave 6 cf-25 — chunking pass per cf-25 PR.md D5 + D6.
 *
 * Walks the doc's top-level mdast block children + groups consecutive
 * prose-eligible nodes (anything that is NOT `mdxJsxFlowElement`) into
 * a synthetic `mdxJsxFlowElement` with `name: 'Markdown'` carrying the
 * prose nodes as children. Empty chunks are dropped.
 *
 * The synthetic Markdown element has empty `attributes`; downstream
 * `parseGridAttrs` (called by `mdastJsxFlowElementToTiptap`) hits the
 * isProse default branch (`isMarkdown=true` → col=1, colSpan=12,
 * rowSpan='auto'). The serializer's unwrap-on-default pass (cf-25 D5;
 * see `unwrapDefaultMarkdownWrappers` below) recognizes those defaults
 * and unwraps back to bare prose mdast on save, preserving
 * byte-equivalent round-trip for legacy MDX with no Markdown wrapper.
 *
 * Performance: O(n) over `blocks`. Each output element is either a
 * passthrough mdxJsxFlowElement OR a fresh synthetic mdxJsxFlowElement.
 * No per-element heap churn beyond the chunk array.
 */
export function chunkProseBlocks(blocks: RootContent[]): RootContent[] {
  const out: RootContent[] = [];
  let proseChunk: RootContent[] = [];
  const flushChunk = (): void => {
    if (proseChunk.length === 0) return;
    out.push(makeMarkdownWrapper(proseChunk));
    proseChunk = [];
  };
  for (const node of blocks) {
    if (node.type === 'mdxJsxFlowElement') {
      flushChunk();
      out.push(node);
    } else {
      proseChunk.push(node);
    }
  }
  flushChunk();
  return out;
}

function makeMarkdownWrapper(proseChildren: RootContent[]): RootContent {
  // Constructed mdxJsxFlowElement with no attributes — downstream
  // `parseGridAttrs` hits the isProse default branch.
  return {
    type: 'mdxJsxFlowElement',
    name: 'Markdown',
    attributes: [],
    children: proseChildren as unknown as never[],
  } as unknown as RootContent;
}

/**
 * Wave 6 cf-25 — unwrap-on-default pass per cf-25 PR.md D5.
 *
 * Walks the serialized mdast block list. For each
 * `mdxJsxFlowElement{name:'Markdown'}`, examines the grid attrs:
 * if all four attrs match the default shape (col=1, no row,
 * colSpan=12, rowSpan='auto' or unset), the wrapper is REPLACED
 * by its prose mdast children (flattened into the parent block list).
 * Non-default attrs preserve the wrapper.
 *
 * Why this matters (round-trip invariant):
 * - Pre-cf-25 MDX file with bare prose → chunking pass folds into
 *   Markdown wrapper(default) → unwrap pass restores bare prose on
 *   serialize → byte-equivalent round-trip preserved
 * - User resizes a markdown block to colSpan=6 → grid attrs become
 *   non-default → unwrap pass keeps the wrapper →
 *   `<Markdown col={1} colSpan={6}>...</Markdown>` emitted
 *
 * Default detection: per ADR-0016 D2 + cf-25 D4 defaults. The pass
 * examines the SERIALIZED mdast attribute list (not the source Tiptap
 * attrs) — `serializeGridAttrs` already projected the canonical attr
 * list, so we can read it directly.
 *
 * Does NOT visit nested Markdown wrappers (cf-25 markdown is a
 * top-level block; nested markdown is out of scope per D6 — list
 * granularity is whole-list, not list-item).
 *
 * The generic type `T extends { type: string }` lets the caller pass
 * the project-specific block-mdast union (`TiptapMdastBlock` in
 * serialize.ts) without forcing a circular import.
 */
export function unwrapDefaultMarkdownWrappers<T extends { type: string }>(
  blocks: T[],
): T[] {
  const out: T[] = [];
  for (const block of blocks) {
    if (
      block.type === 'mdxJsxFlowElement' &&
      (block as unknown as MdastJsxElement).name === 'Markdown'
    ) {
      const jsxBlock = block as unknown as MdastJsxElement;
      if (markdownAttrsAreDefault(jsxBlock)) {
        out.push(...((jsxBlock.children as unknown) as T[]));
        continue;
      }
    }
    out.push(block);
  }
  return out;
}

function markdownAttrsAreDefault(node: MdastJsxElement): boolean {
  // Default grid attrs for markdown wrapper per cf-25 D4:
  // col=1, NO row, colSpan=12, rowSpan absent (omitted by isProse
  // serializer per ADR-0016 D3). Any non-grid attr (e.g. user-set
  // future attrs) also forces wrapper preservation.
  for (const attr of node.attributes) {
    if (attr.type !== 'mdxJsxAttribute') return false;
    if (!GRID_ATTR_NAMES.has(attr.name)) return false;
    const value = readGridAttrInteger(attr);
    if (attr.name === 'col' && value !== 1) return false;
    if (attr.name === 'colSpan' && value !== 12) return false;
    if (attr.name === 'row') return false;
    if (attr.name === 'rowSpan') return false; // isProse omits rowSpan; if present, non-default
  }
  return true;
}

function readGridAttrInteger(attr: MdastJsxAttribute): number | undefined {
  const value = attr.value;
  if (typeof value === 'object' && value !== null && 'value' in value) {
    const inner = (value as { value: unknown }).value;
    return typeof inner === 'number' ? inner : Number(inner);
  }
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  return undefined;
}
