import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkFrontmatter from 'remark-frontmatter';
import type { Root, RootContent } from 'mdast';
import type { BlockRegistry } from '@skb/block-foundation';
import { getJsxDispatch, type MdastJsxElement } from './dispatch-table';

export interface MdxBridgeOptions {
  blockRegistry?: BlockRegistry;
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
  readonly rowSpan: number | 'auto';
  readonly explicit: boolean;
}

// Grid attr shape `{col, row?, colSpan, rowSpan}` per ADR-0016 D2 (single
// schema authority). COL_SNAPS = [2,3,4,6,8,12] per ADR-0016 D2 + D6 (1/6,
// 1/4, 1/3, 1/2, 2/3, full). Path (a) transitional behavior: defensive
// defaults + console.warn on missing required attrs (col / colSpan); explicit
// invalid values still throw per D7. Hard-throw flip lands at C.2-3.
const COL_SNAPS = [2, 3, 4, 6, 8, 12] as const;
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
  const blocks: RootContent[] = [];
  for (const node of tree.children) {
    if (node.type === 'yaml') {
      frontmatter = node.value;
    } else {
      blocks.push(node);
    }
  }

  const content = blocks.map((node) => mdastBlockToTiptap(node, options));
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

  const gridAttrs = parseGridAttrs(node, core.name, componentName === 'Markdown');
  const nodeForDispatch = stripGridAttrsForDispatch(node);
  const parsed = dispatch.parse(nodeForDispatch);
  return {
    ...parsed,
    attrs: mergeGridAttrs(parsed.attrs, gridAttrs),
    _mdast: nodeForDispatch,
  };
}

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
    console.warn(
      `mdx-bridge: grid attrs missing on block ${blockType}; defaulted to col=1 colSpan=12. ` +
        `ADR-0016 D7 hard-throw lands at C.2-3.`,
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
    explicit: Boolean(colAttr && colSpanAttr),
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
    ...(gridAttrs.explicit ? { _gridAttrsExplicit: true } : {}),
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
): number | 'auto' {
  if (!attr) {
    if (isProse) return 'auto';
    console.warn(
      `mdx-bridge: grid attr default rowSpan=1 on non-prose block ${blockType}; ` +
        `explicit value recommended per ADR-0016 D3+D7.`,
    );
    return 1;
  }

  const value = attrValue(attr);
  if (value === 'auto') {
    if (isProse) return 'auto';
    throw new Error(
      `mdx-bridge: unsupported grid attr rowSpan='auto' on non-prose block ${blockType}; ` +
        `rowSpan must be an integer per ADR-0016 D3.`,
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
