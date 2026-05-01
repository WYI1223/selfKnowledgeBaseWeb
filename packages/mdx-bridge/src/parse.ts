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

  return { ...dispatch.parse(node), _mdast: node };
}

function unsupportedBlock(type: string): never {
  throw new Error(
    `mdx-bridge: unsupported block type "${type}". ` +
      `Add a fixture and a parse + serialize case before introducing this block type.`,
  );
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
