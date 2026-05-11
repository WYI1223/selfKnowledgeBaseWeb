import { unified } from 'unified';
import remarkStringify from 'remark-stringify';
import remarkMdx from 'remark-mdx';
import remarkFrontmatter from 'remark-frontmatter';
import type {
  Root,
  RootContent,
  BlockContent,
  DefinitionContent,
  ListItem,
  PhrasingContent,
} from 'mdast';
import { COL_SNAPS } from '@skb/block-foundation';
import type { MdastJsxElement } from './dispatch-table';
import { getJsxDispatch } from './dispatch-table';
import { unwrapDefaultMarkdownWrappers } from './markdown-chunking';
import type { MdxBridgeOptions, TiptapDoc, TiptapMark, TiptapNode } from './parse';

const PHRASING_TYPES = new Set([
  'text',
  'emphasis',
  'strong',
  'delete',
  'inlineCode',
  'break',
  'link',
  'linkReference',
  'image',
  'imageReference',
  'footnoteReference',
  'html',
  'mdxJsxTextElement',
  'mdxTextExpression',
]);

const TIPTAP_PROSE_BLOCK_TYPES = new Set([
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'blockquote',
  'codeBlock',
  'horizontalRule',
]);

type TiptapMdastBlock = BlockContent | DefinitionContent | MdastJsxElement;
type MdastJsxAttribute = Extract<
  MdastJsxElement['attributes'][number],
  { type: 'mdxJsxAttribute' }
>;

// COL_SNAPS imported from `@skb/block-foundation` (ADR-0006 class 4
// single-authority schema; per Wave 5 plan v1.1 row C.2-3.5 reviewer R1
// finding — was duplicated locally pre-amendment).
const GRID_ATTR_NAMES = new Set(['col', 'row', 'colSpan', 'rowSpan']);

function isPhrasing(node: RootContent | MdastJsxElement): node is PhrasingContent {
  return PHRASING_TYPES.has(node.type);
}

function isBlock(node: RootContent | MdastJsxElement): node is TiptapMdastBlock {
  if (node.type === 'mdxJsxFlowElement') return true;
  return !isPhrasing(node);
}

/**
 * Wave 1 minimal Tiptap doc → MDX.
 *
 * Strategy: rebuild mdast — prefer the node's preserved `_mdast` for byte-exact
 * round-trip, fall back to reconstruction for nodes that originated in the
 * editor without a parsed source. Stringify with remark-stringify configured
 * to match canonical markdown output.
 *
 * Wave 6 cf-25 — Markdown wrapper-block unwrap-on-default pass per
 * cf-25 PR.md D5. After per-block serialize, walk the synthetic
 * Markdown JSX wrappers and UNWRAP them back to bare prose mdast
 * when their grid attrs are at default values (col=1, no row,
 * colSpan=12, rowSpan=1 per Wave 7 Phase 2A / ADR-0020 D1). Non-default
 * grid attrs preserve the wrapper. This guarantees byte-equivalent
 * round-trip for pre-cf-25 legacy MDX (no `<Markdown>` wrapper
 * introduced) AND preserves the wrapper when the user resizes/places
 * a markdown block to non-default grid coordinates.
 */
export function tiptapToMdx(doc: TiptapDoc, options?: MdxBridgeOptions): string {
  const blocks = doc.content.map((node) => tiptapToMdastBlock(node, options));
  const unwrapped = unwrapDefaultMarkdownWrappers(blocks);
  const children: RootContent[] = [];
  if (doc.frontmatter !== undefined) {
    children.push({ type: 'yaml', value: doc.frontmatter });
  }
  children.push(...unwrapped);
  const tree: Root = { type: 'root', children };

  const out = unified()
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkMdx)
    .use(remarkStringify, {
      bullet: '*',
      emphasis: '*',
      strong: '*',
      fences: true,
      listItemIndent: 'one',
      rule: '-',
      ruleSpaces: false,
      tightDefinitions: true,
    })
    .stringify(tree);

  return typeof out === 'string' ? out : String(out);
}

function tiptapToMdastBlock(node: TiptapNode, options?: MdxBridgeOptions): TiptapMdastBlock {
  const dispatched = tiptapComponentToMdast(node, options);
  if (dispatched) return dispatched;
  if (node._mdast && isBlock(node._mdast)) return node._mdast;
  switch (node.type) {
    case 'paragraph':
      return {
        type: 'paragraph',
        children: tiptapInlineSequence(node.content ?? []),
      };
    case 'heading': {
      const level = (node.attrs?.['level'] as number | undefined) ?? 1;
      const depth = Math.min(6, Math.max(1, level)) as 1 | 2 | 3 | 4 | 5 | 6;
      return {
        type: 'heading',
        depth,
        children: tiptapInlineSequence(node.content ?? []),
      };
    }
    case 'bulletList':
    case 'orderedList': {
      const ordered = node.type === 'orderedList';
      const start = ordered ? ((node.attrs?.['start'] as number | undefined) ?? 1) : null;
      const listSpread = (node.attrs?.['spread'] as boolean | undefined) ?? false;
      const items: ListItem[] = (node.content ?? []).map((li) => ({
        type: 'listItem',
        spread: (li.attrs?.['spread'] as boolean | undefined) ?? false,
        checked: null,
        children: (li.content ?? []).map((child) => tiptapToMdastBlock(child, options)),
      }));
      return { type: 'list', ordered, start, spread: listSpread, children: items };
    }
    case 'blockquote':
      return {
        type: 'blockquote',
        children: (node.content ?? []).map((child) => tiptapToMdastBlock(child, options)),
      };
    case 'codeBlock': {
      const lang = (node.attrs?.['language'] as string | null | undefined) ?? null;
      const value = (node.content ?? []).map((c) => c.text ?? '').join('');
      return { type: 'code', lang, meta: null, value };
    }
    case 'horizontalRule':
      return { type: 'thematicBreak' };
    default:
      return unsupportedBlock(node.type);
  }
}

function tiptapComponentToMdast(
  node: TiptapNode,
  options?: MdxBridgeOptions,
): MdastJsxElement | undefined {
  if (!options?.blockRegistry) return undefined;
  if (TIPTAP_PROSE_BLOCK_TYPES.has(node.type)) return undefined;

  const core = options.blockRegistry.getCore(node.type);
  if (!core) return unsupportedBlock(node.type);

  const dispatch = getJsxDispatch(core.mdxComponent);
  if (!dispatch || dispatch.blockType !== node.type) return unsupportedBlock(node.type);

  const gridAttrs = serializeGridAttrs(node, core.mdxComponent);

  // Wave 6 cf-25 — Markdown wrapper-block: serialize inner Tiptap
  // content (paragraph / heading / list / etc.) back to mdast
  // BEFORE handing to dispatch.serialize. Without this step the
  // dispatch sees raw Tiptap nodes as `node.content` and emits them
  // verbatim into the JSX wrapper's children — invalid mdast that
  // breaks remark-stringify. Per cf-25 PR.md D7: markdown is the
  // ONLY block kind whose serialize boundary recurses inner content
  // (the 8 atom blocks have no inner Tiptap content to walk).
  const isMarkdown = core.mdxComponent === 'Markdown';
  const nodeForDispatch = stripGridAttrsForDispatch(node);
  if (isMarkdown && Array.isArray(nodeForDispatch.content)) {
    // `nodeForDispatch.content` is `TiptapNode[]` per the type contract;
    // map each child through the recursive serializer to produce mdast
    // children for the JSX wrapper. The result is then handed to the
    // dispatch's serialize hook (which only emits the outer wrapper).
    // The inner Tiptap children become mdast block nodes here. The
    // dispatch's serialize hook stuffs them into the JSX wrapper's
    // `children` slot — TypeScript's structural compatibility allows
    // both shapes through the `TiptapNode.content` property since
    // both are `unknown[]`-compatible at the dispatch boundary.
    const innerSerialized = nodeForDispatch.content.map((child) =>
      tiptapToMdastBlock(child, options),
    );
    const innerNode = {
      ...nodeForDispatch,
      content: innerSerialized,
    } as unknown as TiptapNode;
    const element = dispatch.serialize(innerNode);
    if (gridAttrs.length === 0) return element;
    return {
      ...element,
      attributes: [...gridAttrs, ...element.attributes],
    };
  }

  const element = dispatch.serialize(nodeForDispatch);
  if (gridAttrs.length === 0) return element;
  return {
    ...element,
    attributes: [...gridAttrs, ...element.attributes],
  };
}

// Wave 6 cf-25 — unwrap-on-default pass extracted to
// `./markdown-chunking.ts` per the 500-LOC hard cap. See
// `unwrapDefaultMarkdownWrappers` in that module for the cf-25
// PR.md D5 round-trip contract.

function unsupportedBlock(type: string): never {
  throw new Error(
    `mdx-bridge: unsupported block type "${type}". ` +
      `Add a fixture and a parse + serialize case before introducing this block type.`,
  );
}

// Grid attr shape `{col, row?, colSpan, rowSpan}` per ADR-0016 D2 (single
// schema authority). Wave 7 Phase 2A (ADR-0020 D1): rowSpan is a discrete
// integer; legacy `'auto'` literal in attrs is normalized to 1. Prose
// (Markdown) emits rowSpan ONLY when non-default (≠ 1); default rowSpan
// stays absent so unwrap-on-default can round-trip bare prose.
function serializeGridAttrs(node: TiptapNode, mdxComponent: string): MdastJsxAttribute[] {
  const attrs = node.attrs ?? {};
  const isProse = mdxComponent === 'Markdown';

  // Wave 7 Phase 2A (ADR-0020 D1): non-prose blocks still reject the
  // `'auto'` literal — in-memory state should never carry it on a
  // non-prose block; throwing protects against corrupt state. Prose
  // (Markdown) blocks normalize legacy `'auto'` to 1.
  if (attrs['rowSpan'] === 'auto' && !isProse) {
    throw new Error(
      `mdx-bridge: unsupported grid attr rowSpan='auto' on non-prose block ${node.type}; ` +
        `rowSpan must be an integer per ADR-0020 D1.`,
    );
  }

  const col = parseSerializableGridInteger('col', attrs['col'] ?? 1, node.type);
  const colSpan = parseSerializableGridInteger('colSpan', attrs['colSpan'] ?? 12, node.type);
  validateGridPosition(col, colSpan, node.type);

  const rowSpanRaw = attrs['rowSpan'];
  const rowSpan = parseSerializableGridInteger(
    'rowSpan',
    rowSpanRaw === 'auto' ? 1 : rowSpanRaw ?? 1,
    node.type,
  );

  const out: MdastJsxAttribute[] = [
    gridExpressionAttr('col', col),
    ...(attrs['row'] !== undefined
      ? [gridExpressionAttr('row', parseSerializableGridInteger('row', attrs['row'], node.type))]
      : []),
    gridExpressionAttr('colSpan', colSpan),
  ];

  if (!isProse) {
    out.push(gridExpressionAttr('rowSpan', rowSpan));
  } else if (rowSpan !== 1) {
    out.push(gridExpressionAttr('rowSpan', rowSpan));
  }
  return out;
}

function stripGridAttrsForDispatch(node: TiptapNode): TiptapNode {
  if (!node.attrs) return node;
  const attrs: Record<string, unknown> = {};
  let stripped = false;
  for (const [key, value] of Object.entries(node.attrs)) {
    if (GRID_ATTR_NAMES.has(key)) {
      stripped = true;
    } else {
      attrs[key] = value;
    }
  }
  return stripped ? { ...node, attrs } : node;
}

function gridExpressionAttr(name: string, value: number): MdastJsxAttribute {
  return {
    type: 'mdxJsxAttribute',
    name,
    value: {
      type: 'mdxJsxAttributeValueExpression',
      value: String(value),
    },
  };
}

function parseSerializableGridInteger(name: string, value: unknown, blockType: string): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(numeric)) {
    throw new Error(
      `mdx-bridge: unsupported grid attr ${name}=${JSON.stringify(value)} on block ${blockType}; ` +
        `expected an integer.`,
    );
  }
  if (name === 'col' && (numeric < 1 || numeric > 12)) {
    throw new Error(
      `mdx-bridge: unsupported grid attr col=${numeric} on block ${blockType}; ` +
        `expected 1 ≤ col ≤ 12.`,
    );
  }
  if (name === 'colSpan' && !COL_SNAPS.includes(numeric as (typeof COL_SNAPS)[number])) {
    throw new Error(
      `mdx-bridge: unsupported grid attr colSpan on block ${blockType}; ` +
        `expected COL_SNAPS [2,3,4,6,8,12], received ${numeric}.`,
    );
  }
  if ((name === 'row' || name === 'rowSpan') && numeric < 1) {
    throw new Error(
      `mdx-bridge: unsupported grid attr ${name}=${numeric} on block ${blockType}; ` +
        `expected ${name} ≥ 1.`,
    );
  }
  return numeric;
}

function validateGridPosition(col: number, colSpan: number, blockType: string): void {
  const end = col + colSpan - 1;
  if (end > 12) {
    throw new Error(
      `mdx-bridge: unsupported grid attrs on block ${blockType}; ` +
        `col + colSpan - 1 = ${end}, expected col + colSpan - 1 ≤ 12.`,
    );
  }
}

/**
 * Convert an inline-level Tiptap sequence to mdast phrasing content.
 *
 * Marks live on each text leaf in outermost-first order (e.g. `[link, bold]`
 * means the bold span sits inside the link). To produce valid mdast we group
 * adjacent leaves that share the same outermost mark, recurse on the group
 * with that mark stripped, then wrap the result. Non-text inline nodes
 * (hardBreak, leaf inlineCode) flush any open group and re-open after.
 *
 * Why this exists: parse pushes marks down onto leaves to make Tiptap's
 * native shape lossless under canonical reconstruction. Without this
 * grouper, every leaf would emit its own wrapper (e.g.
 * `**bold ****and****  italic**`) instead of the original
 * `**bold *and* italic**`.
 */
function tiptapInlineSequence(nodes: readonly TiptapNode[]): PhrasingContent[] {
  const out: PhrasingContent[] = [];
  let i = 0;
  while (i < nodes.length) {
    const node = nodes[i]!;
    if (node.type !== 'text') {
      out.push(leafInlineToMdast(node));
      i++;
      continue;
    }
    const firstMark = (node.marks ?? [])[0];
    if (!firstMark || firstMark.type === 'code') {
      out.push(textLeafToMdast(node));
      i++;
      continue;
    }
    // Find the run [i, j) where every text leaf shares this outermost mark.
    // hardBreak is "transparent": it does not terminate a run as long as the
    // text leaf after it carries the same outermost mark — this preserves
    // shapes like `**a  \nb**` (bold span containing a hard break).
    let j = i + 1;
    while (j < nodes.length) {
      const next = nodes[j]!;
      if (next.type === 'hardBreak') {
        const after = nodes[j + 1];
        if (!after || after.type !== 'text') break;
        const afterFirst = (after.marks ?? [])[0];
        if (!afterFirst || !marksEqual(afterFirst, firstMark)) break;
        j += 2;
        continue;
      }
      if (next.type !== 'text') break;
      const nextFirst = (next.marks ?? [])[0];
      if (!nextFirst || !marksEqual(nextFirst, firstMark)) break;
      j++;
    }
    const stripped = nodes.slice(i, j).map(stripFirstMark);
    out.push(wrapMark(firstMark, tiptapInlineSequence(stripped)));
    i = j;
  }
  return out;
}

function textLeafToMdast(node: TiptapNode): PhrasingContent {
  // Apply leaf-only marks (currently just `code`). Other marks are handled by
  // the sequence grouper above and have already been stripped.
  const marks = node.marks ?? [];
  if (marks.some((m) => m.type === 'code')) {
    return { type: 'inlineCode', value: node.text ?? '' };
  }
  return { type: 'text', value: node.text ?? '' };
}

function leafInlineToMdast(node: TiptapNode): PhrasingContent {
  if (node.type === 'hardBreak') return { type: 'break' };
  if (node._mdast && isPhrasing(node._mdast)) return node._mdast;
  throw new Error(
    `mdx-bridge: unsupported inline type "${node.type}" without _mdast passthrough. ` +
      `Add a fixture and a parse + serialize case before introducing this inline type.`,
  );
}

function stripFirstMark(node: TiptapNode): TiptapNode {
  if (node.type !== 'text') return node;
  const marks = node.marks ?? [];
  if (marks.length === 0) return node;
  const rest = marks.slice(1);
  if (rest.length === 0) {
    const { marks: _drop, ...without } = node;
    void _drop;
    return without;
  }
  return { ...node, marks: rest };
}

function marksEqual(a: TiptapMark, b: TiptapMark): boolean {
  if (a.type !== b.type) return false;
  if (a.type === 'link') {
    return (
      (a.attrs?.['href'] ?? '') === (b.attrs?.['href'] ?? '') &&
      (a.attrs?.['title'] ?? null) === (b.attrs?.['title'] ?? null)
    );
  }
  return true;
}

function wrapMark(mark: TiptapMark, children: PhrasingContent[]): PhrasingContent {
  switch (mark.type) {
    case 'bold':
      return { type: 'strong', children };
    case 'italic':
      return { type: 'emphasis', children };
    case 'link': {
      const href = (mark.attrs?.['href'] as string | undefined) ?? '';
      const title = (mark.attrs?.['title'] as string | undefined) ?? null;
      return { type: 'link', url: href, title, children };
    }
    default:
      throw new Error(
        `mdx-bridge: unsupported mark type "${mark.type}". ` +
          `Add a fixture and a wrapMark case before introducing this mark.`,
      );
  }
}
