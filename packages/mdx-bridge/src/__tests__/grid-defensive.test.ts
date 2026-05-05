import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
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

const MISSING_GRID_WARN =
  'mdx-bridge: grid attrs missing on block callout; defaulted to col=1 colSpan=12. ADR-0016 D7 hard-throw lands at C.2-3.';
const ROWSPAN_WARN =
  'mdx-bridge: grid attr default rowSpan=1 on non-prose block callout; explicit value recommended per ADR-0016 D3+D7.';

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

describe('grid attr defensive defaults', () => {
  beforeAll(() => {
    ensureDispatches();
  });

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    [
      'missing col',
      '<Callout colSpan={6} rowSpan={2} variant="note" />',
      { col: 1, colSpan: 6, rowSpan: 2 },
    ],
    [
      'missing colSpan',
      '<Callout col={1} rowSpan={2} variant="note" />',
      { col: 1, colSpan: 12, rowSpan: 2 },
    ],
    [
      'missing both col and colSpan',
      '<Callout rowSpan={1} variant="note" />',
      { col: 1, colSpan: 12, rowSpan: 1 },
    ],
  ])('defaults %s with the pinned transitional warning', (_label, source, expectedAttrs) => {
    const doc = mdxToTiptap(source, buildOptions());

    expect(doc.content[0]?.attrs).toMatchObject(expectedAttrs);
    expect(console.warn).toHaveBeenCalledWith(MISSING_GRID_WARN);
  });

  it('defaults missing rowSpan on non-prose blocks with the pinned rowSpan warning', () => {
    const doc = mdxToTiptap('<Callout col={1} colSpan={12} variant="note" />', buildOptions());

    expect(doc.content[0]?.attrs).toMatchObject({ col: 1, colSpan: 12, rowSpan: 1 });
    expect(console.warn).toHaveBeenCalledWith(ROWSPAN_WARN);
  });

  it('treats missing Markdown grid attrs as transitional prose defaults without warnings', () => {
    const doc = mdxToTiptap('<Markdown>\n  Some content here.\n</Markdown>', buildOptions(true));

    expect(doc.content[0]?.attrs).toMatchObject({
      col: 1,
      colSpan: 12,
      rowSpan: 'auto',
    });
    expect(console.warn).not.toHaveBeenCalled();
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
            _gridAttrsExplicit: true,
            variant: 'note',
          },
        },
      ],
    };

    expect(() => tiptapToMdx(doc, buildOptions())).toThrowError(/rowSpan='auto'.*non-prose/);
  });

  it('preserves no-grid serialization for editor-built nodes with no grid attrs', () => {
    const doc: TiptapDoc = {
      type: 'doc',
      content: [{ type: 'callout', attrs: { variant: 'note' } }],
    };

    const source = tiptapToMdx(doc, buildOptions()).trim();

    expect(source).toBe('<Callout variant="note" />');
    expect(source).not.toContain('col=');
    expect(source).not.toContain('colSpan=');
    expect(source).not.toContain('rowSpan=');
  });

  it('does NOT serialize markerless non-default col/colSpan (path (a) strict gating)', () => {
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

    expect(source).toBe('<Callout variant="note" />');
    expect(source).not.toContain('col=');
    expect(source).not.toContain('colSpan=');
    expect(source).not.toContain('rowSpan=');
  });
});
