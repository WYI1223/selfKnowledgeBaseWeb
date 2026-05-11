import { beforeAll, describe, expect, it } from 'vitest';
import { BlockRegistry, type BlockCoreDefinition } from '@skb/block-foundation';
import { calloutCore, parseCallout, serializeCallout } from '@skb/block-callout/core';
import { codeCore, parseCode, serializeCode } from '@skb/block-code/core';
import { imageCore, parseImage, serializeImage } from '@skb/block-image/core';
import { mathCore, parseMath, serializeMath } from '@skb/block-math/core';
import { pdfCore, parsePdf, serializePdf } from '@skb/block-pdf/core';
import { jupyterCore, parseJupyter, serializeJupyter } from '@skb/block-jupyter/core';
import { nnVizCore, parseNnViz, serializeNnViz } from '@skb/block-nn-viz/core';
import { agentFlowCore, parseAgentFlow, serializeAgentFlow } from '@skb/block-agent-flow/core';
import {
  getJsxDispatch,
  mdxToTiptap,
  registerJsxDispatch,
  tiptapToMdx,
  type JsxDispatchEntry,
  type MdxBridgeOptions,
  type TiptapDoc,
} from '../index';

type ComponentFixture = {
  readonly label: string;
  readonly core: BlockCoreDefinition;
  readonly parse: JsxDispatchEntry['parse'];
  readonly serialize: JsxDispatchEntry['serialize'];
  readonly attrs: Record<string, unknown>;
  readonly firstBlockAttr: string;
};

const COMPONENTS: readonly ComponentFixture[] = [
  {
    label: 'Callout',
    core: calloutCore,
    parse: parseCallout as unknown as JsxDispatchEntry['parse'],
    serialize: serializeCallout as unknown as JsxDispatchEntry['serialize'],
    attrs: { variant: 'note', title: 'Heads up' },
    firstBlockAttr: 'variant=',
  },
  {
    label: 'Code',
    core: codeCore,
    parse: parseCode as unknown as JsxDispatchEntry['parse'],
    serialize: serializeCode as unknown as JsxDispatchEntry['serialize'],
    attrs: { language: 'python', code: 'print(1)', showLineNumbers: false },
    firstBlockAttr: 'language=',
  },
  {
    label: 'Image',
    core: imageCore,
    parse: parseImage as unknown as JsxDispatchEntry['parse'],
    serialize: serializeImage as unknown as JsxDispatchEntry['serialize'],
    attrs: {
      src: 'https://example.test/cat.png',
      alt: 'A cat',
      width: 800,
      height: 600,
    },
    firstBlockAttr: 'src=',
  },
  {
    label: 'Math',
    core: mathCore,
    parse: parseMath as unknown as JsxDispatchEntry['parse'],
    serialize: serializeMath as unknown as JsxDispatchEntry['serialize'],
    attrs: { expression: 'E = mc^2', display: true },
    firstBlockAttr: 'expression=',
  },
  {
    label: 'Pdf',
    core: pdfCore,
    parse: parsePdf as unknown as JsxDispatchEntry['parse'],
    serialize: serializePdf as unknown as JsxDispatchEntry['serialize'],
    attrs: { src: 'https://example.test/doc.pdf', page: 1, searchable: false },
    firstBlockAttr: 'src=',
  },
  {
    label: 'Jupyter',
    core: jupyterCore,
    parse: parseJupyter as unknown as JsxDispatchEntry['parse'],
    serialize: serializeJupyter as unknown as JsxDispatchEntry['serialize'],
    attrs: { code: 'x = 42', runOnLoad: false, showLineNumbers: true, libraries: [] },
    firstBlockAttr: 'code=',
  },
  {
    label: 'NnViz',
    core: nnVizCore,
    parse: parseNnViz as unknown as JsxDispatchEntry['parse'],
    serialize: serializeNnViz as unknown as JsxDispatchEntry['serialize'],
    attrs: { modelUrl: 'https://example.test/model.json', layers: [], showWeights: false },
    firstBlockAttr: 'modelUrl=',
  },
  {
    label: 'AgentFlow',
    core: agentFlowCore,
    parse: parseAgentFlow as unknown as JsxDispatchEntry['parse'],
    serialize: serializeAgentFlow as unknown as JsxDispatchEntry['serialize'],
    attrs: { nodes: [], edges: [], interactive: false },
    firstBlockAttr: 'nodes=',
  },
];

const GRID_SHAPES = [
  { label: 'col + colSpan', attrs: { col: 1, colSpan: 12, rowSpan: 1 } },
  { label: 'col + row + colSpan', attrs: { col: 7, row: 3, colSpan: 6, rowSpan: 4 } },
  { label: 'col + colSpan + rowSpan', attrs: { col: 5, colSpan: 4, rowSpan: 3 } },
] as const;

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
  for (const fixture of COMPONENTS) {
    if (getJsxDispatch(fixture.core.mdxComponent) === undefined) {
      registerJsxDispatch({
        mdxComponent: fixture.core.mdxComponent,
        blockType: fixture.core.name,
        parse: fixture.parse,
        serialize: fixture.serialize,
      });
    }
  }
  if (getJsxDispatch('Markdown') === undefined) {
    registerJsxDispatch(markdownDispatch);
  }
}

function buildOptions(includeMarkdown = false): MdxBridgeOptions {
  const blockRegistry = new BlockRegistry();
  for (const fixture of COMPONENTS) blockRegistry.registerCore(fixture.core);
  if (includeMarkdown) blockRegistry.registerCore(markdownCore);
  return { blockRegistry };
}

function stripMdast(doc: TiptapDoc): TiptapDoc {
  return JSON.parse(
    JSON.stringify(doc, (key, value: unknown) => (key === '_mdast' ? undefined : value)),
  ) as TiptapDoc;
}

function gridDoc(fixture: ComponentFixture, gridAttrs: Record<string, unknown>): TiptapDoc {
  return {
    type: 'doc',
    content: [
      {
        type: fixture.core.name,
        attrs: { ...gridAttrs, ...fixture.attrs },
      },
    ],
  };
}

function assertGridOrder(source: string, gridAttrs: Record<string, unknown>, firstBlockAttr: string) {
  const colIndex = source.indexOf(` col={${gridAttrValue(gridAttrs, 'col')}}`);
  const colSpanIndex = source.indexOf(` colSpan={${gridAttrValue(gridAttrs, 'colSpan')}}`);
  const rowSpanIndex = source.indexOf(` rowSpan={${gridAttrValue(gridAttrs, 'rowSpan')}}`);
  const firstBlockAttrIndex = source.indexOf(` ${firstBlockAttr}`);

  expect(colIndex).toBeGreaterThan(-1);
  expect(colSpanIndex).toBeGreaterThan(colIndex);
  if (gridAttrs['row'] !== undefined) {
    const rowIndex = source.indexOf(` row={${gridAttrValue(gridAttrs, 'row')}}`);
    expect(rowIndex).toBeGreaterThan(colIndex);
    expect(rowIndex).toBeLessThan(colSpanIndex);
  } else {
    expect(source).not.toContain(' row={');
  }
  expect(rowSpanIndex).toBeGreaterThan(colSpanIndex);
  expect(firstBlockAttrIndex).toBeGreaterThan(rowSpanIndex);
}

function gridAttrValue(gridAttrs: Record<string, unknown>, name: string): string {
  const value = gridAttrs[name];
  if (typeof value !== 'number') {
    throw new Error(`test fixture expected numeric grid attr ${name}`);
  }
  return String(value);
}

describe('grid attr round-trip', () => {
  beforeAll(() => {
    ensureDispatches();
  });

  for (const fixture of COMPONENTS) {
    for (const shape of GRID_SHAPES) {
      it(`${fixture.label} round-trips ${shape.label} grid attrs`, () => {
        const options = buildOptions();
        const doc = gridDoc(fixture, shape.attrs);
        const source = tiptapToMdx(doc, options).trim();

        assertGridOrder(source, shape.attrs, fixture.firstBlockAttr);

        const parsed = mdxToTiptap(source, options);
        expect(parsed.content[0]?.attrs).toMatchObject({
          ...shape.attrs,
        });

        expect(tiptapToMdx(parsed, options).trim()).toBe(source);
        expect(tiptapToMdx(stripMdast(parsed), options).trim()).toBe(source);
        expect(tiptapToMdx(mdxToTiptap(tiptapToMdx(doc, options), options), options).trim()).toBe(
          source,
        );
      });
    }
  }

  it("omits rowSpan='auto' for Markdown while preserving parsed prose semantics", () => {
    // Wave 6 cf-25 — the markdown wrapper-block now has cf-25-aware
    // inner content recursion at both parse + serialize boundaries.
    // Pre-cf-25 this test used mdast-shape inner children inside a
    // hand-built doc to exercise the old stub-passthrough contract;
    // the cf-25 contract requires the inner content to be Tiptap-shape
    // (so the new isMarkdown branch in tiptapComponentToMdast can
    // round-trip it through tiptapToMdastBlock). Updated to use a
    // proper Tiptap paragraph + text leaf shape — same round-trip
    // intent (rowSpan='auto' omitted on serialize, restored on parse).
    const options = buildOptions(true);
    const doc: TiptapDoc = {
      type: 'doc',
      content: [
        {
          type: 'markdown',
          attrs: { col: 1, colSpan: 6, rowSpan: 'auto' },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Some content here.' }],
            },
          ],
        },
      ],
    };

    const source = tiptapToMdx(doc, options).trim();

    expect(source).toContain('<Markdown col={1} colSpan={6}>');
    expect(source).not.toContain('rowSpan=');
    const parsed = mdxToTiptap(source, options);
    expect(parsed.content[0]?.attrs).toMatchObject({
      col: 1,
      colSpan: 6,
      rowSpan: 'auto',
    });
    expect(tiptapToMdx(stripMdast(parsed), options).trim()).toBe(source);
  });
});
