import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkFrontmatter from 'remark-frontmatter';
import type { Root, RootContent } from 'mdast';
import type { BlockRegistry } from '@skb/block-foundation';
import { COL_SNAPS } from '@skb/block-foundation';
import { getJsxDispatch, type MdastJsxElement } from './dispatch-table';
import { chunkProseBlocks } from './markdown-chunking';

export interface MdxBridgeOptions {
  blockRegistry?: BlockRegistry;
  /**
   * Wave 6 hotfix — when `true`, `mdxToTiptap` per-block exceptions
   * (unsupported tag, JSX-attr coercion failure, etc.) are caught and
   * replaced with a placeholder paragraph that carries the failure
   * reason in the `__skb_parse_error` attr. Block-level
   * `mdxFlowExpression` author comments are also dropped at the input
   * gate. Default `false` preserves the historical fail-loud behavior
   * that round-trip + grid-defensive tests rely on; `loadFromMdx`
   * (`@skb/editor-shell`) sets `true` so the live editor surface
   * stays usable when a single block has a malformed attr.
   */
  softParse?: boolean;
}

export interface TiptapDoc {
  type: 'doc';
  content: TiptapNode[];
  frontmatter?: string;
}

/**
 * `_mdast` carries the original mdast node so the serializer can produce a
 * byte-equivalent round-trip. Block-context Tiptap nodes hold a block-level
 * mdast node; inline-context nodes hold a phrasing node. Narrowing happens
 * at the use sites in serialize.ts via runtime checks.
 */
export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  marks?: TiptapMark[];
  content?: TiptapNode[];
  text?: string;
  _mdast?: RootContent | MdastJsxElement;
}

export interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

type MdastJsxAttribute = Extract<
  MdastJsxElement['attributes'][number],
  { type: 'mdxJsxAttribute' }
>;

interface GridAttrs {
  readonly col: number;
  readonly row?: number;
  readonly colSpan: number;
  readonly rowSpan: number;
}

// Grid attr shape `{col, row?, colSpan, rowSpan}` per ADR-0016 D2 (single
// schema authority). COL_SNAPS imported from `@skb/block-foundation` (ADR-0006
// class 4 single-authority schema). ADR-0016 D7 hard-throw end-state: missing
// required attrs throw loudly. Wave 7 Phase 2A (ADR-0020 D1): rowSpan is a
// discrete integer; prose Markdown defaults to rowSpan=1 (was 'auto'); legacy
// `rowSpan='auto'` attrs in existing .mdx are normalized to 1.
const GRID_ATTR_NAMES = new Set(['col', 'row', 'colSpan', 'rowSpan']);

/**
 * Wave 1 minimal MDX → Tiptap doc.
 *
 * Strategy: parse with unified+remark-mdx; preserve each block's mdast node on
 * the corresponding Tiptap node as `_mdast` so the serializer can round-trip
 * byte-equivalently via remark-stringify.
 *
 * Wave 1 covers prose (paragraph / heading / list / blockquote / code /
 * inline emphasis / link). Wave 3 adds component blocks (mdxJsxFlowElement).
 */
export function mdxToTiptap(source: string, options?: MdxBridgeOptions): TiptapDoc {
  const tree: Root = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkMdx)
    .parse(source);

  let frontmatter: string | undefined;
  const rawBlocks: RootContent[] = [];
  const softParse = options?.softParse === true;

  for (const node of tree.children) {
    if (node.type === 'yaml') {
      frontmatter = node.value;
    } else if (softParse && node.type === 'mdxFlowExpression') {
      // Block-level MDX `{...}` expression (canonical form
      // `{/* ... */}` author comment). Pre-Wave-6-hotfix this hit
      // `unsupportedBlock` and took the doc down. Under softParse we
      // drop it at the input gate so the editor surface stays usable.
      // Lossy round-trip — hand-authored block-level expressions are
      // not re-emitted on save (documented in the Stage B handoff
      // pack §"What is NOT closed").
      continue;
    } else {
      rawBlocks.push(node);
    }
  }

  // Wave 6 cf-25 — chunking pass. Per cf-25 PR.md D5 + D6:
  // consecutive top-level prose mdast nodes (paragraph / heading /
  // list / blockquote / code / thematicBreak) fold into ONE
  // synthetic `mdxJsxFlowElement{name:'Markdown'}` carrying those
  // prose nodes as children. JSX flow elements
  // (`mdxJsxFlowElement`) BREAK the chunk and pass through unchanged.
  //
  // The synthetic Markdown element has no grid attrs, so
  // `parseGridAttrs` (called from `mdastJsxFlowElementToTiptap`)
  // falls into the isProse default branch: col=1, colSpan=12,
  // rowSpan='auto'. The dispatch then routes to
  // `@skb/block-markdown`'s `parseMarkdown`, which returns
  // `{type:'markdown', content: node.children}`. mdx-bridge's
  // `mdastJsxFlowElementToTiptap` then recurses into those children
  // via `recurseProseChildrenToTiptap` (cf-25 special-case for the
  // Markdown wrapper) before returning the final Tiptap node.
  //
  // Chunk-eligible nodes: anything OTHER than `mdxJsxFlowElement`.
  // (Yaml is already extracted; mdxFlowExpression is dropped under
  // softParse.) The fold is conditional on `options.blockRegistry`
  // having a 'markdown' core registered — without it, dispatch
  // would throw on the synthetic Markdown element. When no
  // markdown core is registered, the chunking pass is a no-op
  // (legacy compat path for tests that don't register markdown).
  const blocks = options?.blockRegistry?.getCore('markdown') !== undefined
    ? chunkProseBlocks(rawBlocks)
    : rawBlocks;

  const content = softParse
    ? blocks.flatMap((node) => {
        try {
          return [mdastBlockToTiptap(node, options)];
        } catch (error) {
          // Wave 6 hotfix per-block fault tolerance — replace a failing
          // block with a placeholder paragraph carrying the reason text.
          // The editor stays mounted; the operator sees the throw via
          // the surrounding loadFromMdx consumer's diagnostics
          // (apps/site EditorShellMount logs via the top-level error
          // boundary). Direct console output is intentionally NOT used
          // here — the grid-defensive contract test in
          // __tests__/grid-defensive.test.ts pins this source file
          // free of transitional warning calls.
          const reason = error instanceof Error ? error.message : 'unknown';
          const componentLabel = (node as { name?: string }).name ?? node.type;
          return [
            {
              type: 'paragraph',
              attrs: { __skb_parse_error: `<${componentLabel}> failed to parse: ${reason}` },
              content: [
                {
                  type: 'text',
                  text: `[unsupported block <${componentLabel}>: ${reason.slice(0, 120)}]`,
                },
              ],
            } satisfies TiptapNode,
          ];
        }
      })
    : blocks.map((node) => mdastBlockToTiptap(node, options));
  const doc: TiptapDoc = { type: 'doc', content };
  if (frontmatter !== undefined) doc.frontmatter = frontmatter;
  return doc;
}

function mdastBlockToTiptap(
  node: RootContent | MdastJsxElement,
  options?: MdxBridgeOptions,
): TiptapNode {
  switch (node.type) {
    case 'paragraph':
      return {
        type: 'paragraph',
        content: node.children.flatMap((c) => mdastInlineToTiptap(c)),
        _mdast: node,
      };
    case 'heading':
      return {
        type: 'heading',
        attrs: { level: node.depth },
        content: node.children.flatMap((c) => mdastInlineToTiptap(c)),
        _mdast: node,
      };
    case 'list': {
      const attrs: Record<string, unknown> = { spread: node.spread ?? false };
      if (node.ordered && typeof node.start === 'number') attrs['start'] = node.start;
      return {
        type: node.ordered ? 'orderedList' : 'bulletList',
        attrs,
        content: node.children.map((item) => ({
          type: 'listItem',
          attrs: { spread: item.spread ?? false },
          content: item.children.map((child) => mdastBlockToTiptap(child, options)),
          _mdast: item,
        })),
        _mdast: node,
      };
    }
    case 'blockquote':
      return {
        type: 'blockquote',
        content: node.children.map((child) => mdastBlockToTiptap(child, options)),
        _mdast: node,
      };
    case 'code':
      return {
        type: 'codeBlock',
        attrs: { language: node.lang ?? null },
        content: node.value ? [{ type: 'text', text: node.value }] : [],
        _mdast: node,
      };
    case 'thematicBreak':
      return { type: 'horizontalRule', _mdast: node };
    case 'mdxJsxFlowElement':
      return mdastJsxFlowElementToTiptap(node, options);
    default:
      return unsupportedBlock(node.type);
  }
}

function mdastJsxFlowElementToTiptap(
  node: MdastJsxElement,
  options?: MdxBridgeOptions,
): TiptapNode {
  if (!options?.blockRegistry) return unsupportedBlock(node.type);

  const componentName = node.name ?? node.type;
  const core = options.blockRegistry
    .listCores()
    .find((candidate) => candidate.mdxComponent === componentName);
  if (!core) return unsupportedBlock(componentName);

  const dispatch = getJsxDispatch(componentName);
  if (!dispatch || dispatch.blockType !== core.name) return unsupportedBlock(componentName);

  const isMarkdown = componentName === 'Markdown';
  const gridAttrs = parseGridAttrs(node, core.name, isMarkdown);
  const nodeForDispatch = stripGridAttrsForDispatch(node);
  const parsed = dispatch.parse(nodeForDispatch);

  // Wave 6 cf-25 — Markdown wrapper-block requires recursing inner
  // mdast block children into Tiptap blocks. The dispatch's `parse`
  // hook returns `content: node.children` (raw mdast); we walk
  // those into Tiptap nodes via `mdastBlockToTiptap` so the
  // resulting Tiptap tree is flat (markdown wrapper holds Tiptap
  // paragraph / heading / list nodes, not raw mdast). This is the
  // ONLY JSX wrapper that recurses children at the dispatch
  // boundary — the other 8 component blocks are atom-blocks and
  // their `parse` returns `content` describing inline-only content
  // (callout body) or no content (math/image/etc.).
  if (isMarkdown && Array.isArray(parsed.content)) {
    const innerChildren = parsed.content as ReadonlyArray<RootContent | MdastJsxElement>;
    const recursed = innerChildren.map((child) => mdastBlockToTiptap(child, options));
    return {
      ...parsed,
      attrs: mergeGridAttrs(parsed.attrs, gridAttrs),
      content: recursed,
      _mdast: nodeForDispatch,
    };
  }

  return {
    ...parsed,
    attrs: mergeGridAttrs(parsed.attrs, gridAttrs),
    _mdast: nodeForDispatch,
  };
}

// Wave 6 cf-25 — chunking pass extracted to `./markdown-chunking.ts`
// per the 500-LOC hard cap (`scripts/check-size-limits.mjs`). See
// `chunkProseBlocks` + `unwrapDefaultMarkdownWrappers` in that module
// for the cf-25 PR.md D5 + D6 contract.

function unsupportedBlock(type: string): never {
  throw new Error(
    `mdx-bridge: unsupported block type "${type}". ` +
      `Add a fixture and a parse + serialize case before introducing this block type.`,
  );
}

function parseGridAttrs(node: MdastJsxElement, blockType: string, isProse: boolean): GridAttrs {
  const colAttr = getGridAttr(node, 'col');
  const rowAttr = getGridAttr(node, 'row');
  const colSpanAttr = getGridAttr(node, 'colSpan');
  const rowSpanAttr = getGridAttr(node, 'rowSpan');

  if (!isProse && (!colAttr || !colSpanAttr)) {
    throw new Error(
      `mdx-bridge: required grid attrs col + colSpan missing on block "${blockType}"; ` +
        `per ADR-0016 D7 end-state invariant (Wave 5 plan v1.1 row C.2-3.5; ` +
        `R14 amendment 2026-05-05).`,
    );
  }

  const col = colAttr ? parseGridInteger('col', attrValue(colAttr), blockType) : 1;
  const colSpan = colSpanAttr
    ? parseGridInteger('colSpan', attrValue(colSpanAttr), blockType)
    : 12;
  validateGridPosition(col, colSpan, blockType);

  const row = rowAttr ? parseGridInteger('row', attrValue(rowAttr), blockType) : undefined;
  const rowSpan = parseRowSpan(rowSpanAttr, blockType, isProse);

  return {
    col,
    ...(row !== undefined ? { row } : {}),
    colSpan,
    rowSpan,
  };
}

function mergeGridAttrs(
  blockAttrs: Record<string, unknown> | undefined,
  gridAttrs: GridAttrs,
): Record<string, unknown> {
  return {
    col: gridAttrs.col,
    ...(gridAttrs.row !== undefined ? { row: gridAttrs.row } : {}),
    colSpan: gridAttrs.colSpan,
    rowSpan: gridAttrs.rowSpan,
    ...(blockAttrs ?? {}),
  };
}

function stripGridAttrsForDispatch(node: MdastJsxElement): MdastJsxElement {
  return {
    ...node,
    attributes: node.attributes.filter((attr) => {
      return attr.type !== 'mdxJsxAttribute' || !GRID_ATTR_NAMES.has(attr.name);
    }),
  };
}

function getGridAttr(node: MdastJsxElement, name: string): MdastJsxAttribute | undefined {
  return node.attributes.find(
    (attr): attr is MdastJsxAttribute => attr.type === 'mdxJsxAttribute' && attr.name === name,
  );
}

function attrValue(attr: MdastJsxAttribute): unknown {
  if (typeof attr.value === 'object' && attr.value !== null && 'value' in attr.value) {
    return attr.value.value;
  }
  return attr.value;
}

function parseGridInteger(name: string, value: unknown, blockType: string): number {
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

function parseRowSpan(
  attr: MdastJsxAttribute | undefined,
  blockType: string,
  isProse: boolean,
): number {
  if (!attr) {
    if (isProse) return 1;
    throw new Error(
      `mdx-bridge: required grid attr rowSpan missing on block "${blockType}"; ` +
        `per ADR-0016 D7 end-state invariant.`,
    );
  }

  const value = attrValue(attr);
  // Wave 7 Phase 2A: legacy `rowSpan='auto'` literal is normalized to 1
  // (the new prose default per ADR-0020 D1). Non-prose blocks still
  // reject the literal.
  if (value === 'auto') {
    if (isProse) return 1;
    throw new Error(
      `mdx-bridge: unsupported grid attr rowSpan='auto' on non-prose block ${blockType}; ` +
        `rowSpan must be an integer per ADR-0020 D1.`,
    );
  }
  return parseGridInteger('rowSpan', value, blockType);
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
 * Each inline mdast node may produce multiple Tiptap text/leaf nodes once marks
 * are pushed down onto leaves (Tiptap's native model). Returning an array keeps
 * the caller honest — block-level wrappers `flatMap` over their children.
 */
function mdastInlineToTiptap(
  node: RootContent | { type: string; [k: string]: unknown },
): TiptapNode[] {
  switch (node.type) {
    case 'text':
      return [{ type: 'text', text: (node as { value: string }).value }];
    case 'strong':
      return wrapChildrenWithMark((node as { children: unknown[] }).children, { type: 'bold' });
    case 'emphasis':
      return wrapChildrenWithMark((node as { children: unknown[] }).children, { type: 'italic' });
    case 'inlineCode':
      return [{ type: 'text', text: (node as { value: string }).value, marks: [{ type: 'code' }] }];
    case 'link': {
      const linkNode = node as { url: string; title?: string | null; children: unknown[] };
      const attrs: Record<string, unknown> = { href: linkNode.url };
      if (linkNode.title != null) attrs['title'] = linkNode.title;
      return wrapChildrenWithMark(linkNode.children, { type: 'link', attrs });
    }
    case 'break':
      return [{ type: 'hardBreak' }];
    default:
      throw new Error(
        `mdx-bridge: unsupported inline type "${node.type}". ` +
          `Add a fixture and a parse + serialize case before introducing this inline type.`,
      );
  }
}

/**
 * Push `mark` onto every text leaf produced by parsing `children`.
 * Recursion handles nested marks (e.g. **bold *and* italic** — the inner
 * emphasis already contributed its `italic` mark; outer strong appends `bold`).
 */
function wrapChildrenWithMark(children: unknown[], mark: TiptapMark): TiptapNode[] {
  const leaves = children.flatMap((c) =>
    mdastInlineToTiptap(c as { type: string; [k: string]: unknown }),
  );
  return leaves.map((leaf) => addMark(leaf, mark));
}

function addMark(leaf: TiptapNode, mark: TiptapMark): TiptapNode {
  if (leaf.type === 'text') {
    const existing = leaf.marks ?? [];
    // Prepend so the array reads outermost-first: when an outer mdast wrapper
    // (e.g. link) calls addMark over leaves that already carry an inner mark
    // (e.g. bold), the resulting [link, bold] order matches the original
    // nesting and the serializer can emit `[**bold**](url)` correctly.
    return { ...leaf, marks: [mark, ...existing] };
  }
  return leaf;
}
