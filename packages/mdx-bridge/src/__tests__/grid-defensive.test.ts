import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BlockRegistry, type BlockCoreDefinition } from '@skb/block-foundation';
import { calloutCore, parseCallout, serializeCallout } from '@skb/block-callout/core';
import {
  getJsxDispatch,
  mdxToTiptap,
  registerJsxDispatch,
  tiptapToMdx,
  type JsxDispatchEntry,
  type MdxBridgeOptions,
  type TiptapDoc,
} from '../index';

const SRC_DIR = fileURLToPath(new URL('../', import.meta.url));
const MISSING_COL_SPAN_ERROR =
  /mdx-bridge: required grid attrs col(?: \+ colSpan)? missing on block "callout".*ADR-0016 D7.*Wave 5 plan v1\.1 row C\.2-3\.5/i;
const MISSING_ROWSPAN_ERROR =
  /mdx-bridge: required grid attr rowSpan missing on block "callout".*ADR-0016 D7.*Wave 5 plan v1\.1 row C\.2-3\.5/i;

const markdownCore: BlockCoreDefinition = {
  name: 'markdown',
  kind: 'component',
  propsSchema: {} as BlockCoreDefinition['propsSchema'],
  mdxComponent: 'Markdown',
};

const markdownDispatch: JsxDispatchEntry = {
  mdxComponent: 'Markdown',
  blockType: 'markdown',
  parse: (node) => ({
    type: 'markdown',
    attrs: {},
    content: node.children,
  }),
  serialize: (node) => ({
    type: 'mdxJsxFlowElement',
    name: 'Markdown',
    attributes: [],
    children: (node.content ?? []) as never[],
  }),
};

function ensureDispatches(): void {
  if (getJsxDispatch('Callout') === undefined) {
    registerJsxDispatch({
      mdxComponent: 'Callout',
      blockType: 'callout',
      parse: parseCallout as unknown as JsxDispatchEntry['parse'],
      serialize: serializeCallout as unknown as JsxDispatchEntry['serialize'],
    });
  }
  if (getJsxDispatch('Markdown') === undefined) {
    registerJsxDispatch(markdownDispatch);
  }
}

function buildOptions(includeMarkdown = false): MdxBridgeOptions {
  const blockRegistry = new BlockRegistry();
  blockRegistry.registerCore(calloutCore);
  if (includeMarkdown) blockRegistry.registerCore(markdownCore);
  return { blockRegistry };
}

function sourceFiles(dir = SRC_DIR): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.isFile() && entry.name.endsWith('.ts') ? [path] : [];
  });
}

describe('grid attr hard-throw end-state', () => {
  beforeAll(() => {
    ensureDispatches();
  });

  it.each([
    ['missing col', '<Callout colSpan={6} rowSpan={2} variant="note" />'],
    ['missing colSpan', '<Callout col={1} rowSpan={2} variant="note" />'],
    ['missing both col and colSpan', '<Callout rowSpan={1} variant="note" />'],
  ])('throws on %s for non-prose blocks', (_label, source) => {
    expect(() => mdxToTiptap(source, buildOptions())).toThrowError(MISSING_COL_SPAN_ERROR);
  });

  it('throws on missing rowSpan for non-prose blocks', () => {
    expect(() =>
      mdxToTiptap('<Callout col={1} colSpan={12} variant="note" />', buildOptions()),
    ).toThrowError(MISSING_ROWSPAN_ERROR);
  });

  it('treats missing Markdown grid attrs as prose defaults', () => {
    const doc = mdxToTiptap('<Markdown>\n  Some content here.\n</Markdown>', buildOptions(true));

    expect(doc.content[0]?.attrs).toMatchObject({
      col: 1,
      colSpan: 12,
      rowSpan: 'auto',
    });
  });

  it('round-trips explicit grid attrs without retaining the transitional marker', () => {
    const source =
      '<Callout col={1} colSpan={12} rowSpan={1} variant="note" title="Heads up" />';
    const doc = mdxToTiptap(source, buildOptions());
    const marker = ['_gridAttrs', 'Explicit'].join('');

    expect(JSON.stringify(doc)).not.toContain(marker);
    expect(tiptapToMdx(doc, buildOptions()).trim()).toBe(source);
  });

  it.each([
    [
      'col + colSpan overflow',
      '<Callout col={9} colSpan={6} rowSpan={1} variant="note" />',
      /col \+ colSpan - 1.*≤ 12/,
    ],
    [
      'non-snap colSpan',
      '<Callout col={1} colSpan={5} rowSpan={1} variant="note" />',
      /COL_SNAPS.*5/,
    ],
    [
      'col below range',
      '<Callout col={0} colSpan={12} rowSpan={1} variant="note" />',
      /1 ≤ col ≤ 12/,
    ],
    [
      'col above range',
      '<Callout col={13} colSpan={12} rowSpan={1} variant="note" />',
      /1 ≤ col ≤ 12/,
    ],
    [
      'row below range',
      '<Callout col={1} row={0} colSpan={12} rowSpan={1} variant="note" />',
      /row.*≥ 1/,
    ],
    [
      "rowSpan='auto' on non-prose",
      '<Callout col={1} colSpan={12} rowSpan="auto" variant="note" />',
      /rowSpan='auto'.*non-prose/,
    ],
    [
      'rowSpan below range',
      '<Callout col={1} colSpan={12} rowSpan={0} variant="note" />',
      /rowSpan.*≥ 1/,
    ],
  ])('throws on explicit invalid grid attr: %s', (_label, source, message) => {
    expect(() => mdxToTiptap(source, buildOptions())).toThrowError(message);
  });

  it("throws when serializing rowSpan='auto' on a non-prose component block", () => {
    const doc: TiptapDoc = {
      type: 'doc',
      content: [
        {
          type: 'callout',
          attrs: {
            col: 1,
            colSpan: 12,
            rowSpan: 'auto',
            variant: 'note',
          },
        },
      ],
    };

    expect(() => tiptapToMdx(doc, buildOptions())).toThrowError(/rowSpan='auto'.*non-prose/);
  });

  it('serializes default grid attrs for editor-built nodes with no grid attrs', () => {
    const doc: TiptapDoc = {
      type: 'doc',
      content: [{ type: 'callout', attrs: { variant: 'note' } }],
    };

    const source = tiptapToMdx(doc, buildOptions()).trim();

    expect(source).toBe('<Callout col={1} colSpan={12} rowSpan={1} variant="note" />');
  });

  it('serializes markerless non-default col/colSpan in canonical grid order', () => {
    const doc: TiptapDoc = {
      type: 'doc',
      content: [
        {
          type: 'callout',
          attrs: { col: 2, colSpan: 6, rowSpan: 2, variant: 'note' },
        },
      ],
    };

    const source = tiptapToMdx(doc, buildOptions()).trim();

    expect(source).toBe('<Callout col={2} colSpan={6} rowSpan={2} variant="note" />');
  });

  it('keeps the transitional marker out of mdx-bridge source', () => {
    const marker = ['_gridAttrs', 'Explicit'].join('');

    for (const file of sourceFiles()) {
      expect(readFileSync(file, 'utf8'), file).not.toContain(marker);
    }
  });

  it('keeps transitional console warnings out of parse and serialize source', () => {
    for (const file of ['parse.ts', 'serialize.ts']) {
      expect(readFileSync(join(SRC_DIR, file), 'utf8'), file).not.toMatch(/console\.warn/);
    }
  });
});
