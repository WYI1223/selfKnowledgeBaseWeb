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
import type { TiptapDoc, TiptapMark, TiptapNode } from './parse';

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

function isPhrasing(node: RootContent): node is PhrasingContent {
  return PHRASING_TYPES.has(node.type);
}

function isBlock(node: RootContent): node is BlockContent | DefinitionContent {
  return !isPhrasing(node);
}

/**
 * Wave 1 minimal Tiptap doc → MDX.
 *
 * Strategy: rebuild mdast — prefer the node's preserved `_mdast` for byte-exact
 * round-trip, fall back to reconstruction for nodes that originated in the
 * editor without a parsed source. Stringify with remark-stringify configured
 * to match canonical markdown output.
 */
export function tiptapToMdx(doc: TiptapDoc): string {
  const blocks: RootContent[] = doc.content.map(tiptapToMdastBlock);
  const children: RootContent[] = [];
  if (doc.frontmatter !== undefined) {
    children.push({ type: 'yaml', value: doc.frontmatter });
  }
  children.push(...blocks);
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

function tiptapToMdastBlock(node: TiptapNode): BlockContent | DefinitionContent {
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
        children: (li.content ?? []).map(tiptapToMdastBlock),
      }));
      return { type: 'list', ordered, start, spread: listSpread, children: items };
    }
    case 'blockquote':
      return {
        type: 'blockquote',
        children: (node.content ?? []).map(tiptapToMdastBlock),
      };
    case 'codeBlock': {
      const lang = (node.attrs?.['language'] as string | null | undefined) ?? null;
      const value = (node.content ?? []).map((c) => c.text ?? '').join('');
      return { type: 'code', lang, meta: null, value };
    }
    case 'horizontalRule':
      return { type: 'thematicBreak' };
    default:
      throw new Error(
        `mdx-bridge: unsupported block type "${node.type}". ` +
          `Add a fixture and a tiptapToMdastBlock case before introducing this block type.`,
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
