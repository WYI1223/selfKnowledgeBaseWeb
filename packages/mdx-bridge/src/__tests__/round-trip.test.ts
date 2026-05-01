import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BlockRegistry } from '@skb/block-foundation';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = join(__dirname, 'fixtures');

const FIXTURES = readdirSync(FIXTURES_DIR)
  .filter((f) => f.endsWith('.mdx'))
  .sort();

function ensureCalloutDispatch(): void {
  if (getJsxDispatch('Callout') === undefined) {
    registerJsxDispatch({
      mdxComponent: 'Callout',
      blockType: 'callout',
      parse: parseCallout as unknown as JsxDispatchEntry['parse'],
      serialize: serializeCallout as unknown as JsxDispatchEntry['serialize'],
    });
  }
}

function ensureCodeDispatch(): void {
  if (getJsxDispatch('Code') === undefined) {
    registerJsxDispatch({
      mdxComponent: 'Code',
      blockType: 'code',
      parse: parseCode as unknown as JsxDispatchEntry['parse'],
      serialize: serializeCode as unknown as JsxDispatchEntry['serialize'],
    });
  }
}

function ensureImageDispatch(): void {
  if (getJsxDispatch('Image') === undefined) {
    registerJsxDispatch({
      mdxComponent: 'Image',
      blockType: 'image',
      parse: parseImage as unknown as JsxDispatchEntry['parse'],
      serialize: serializeImage as unknown as JsxDispatchEntry['serialize'],
    });
  }
}

function ensureMathDispatch(): void {
  if (getJsxDispatch('Math') === undefined) {
    registerJsxDispatch({
      mdxComponent: 'Math',
      blockType: 'math',
      parse: parseMath as unknown as JsxDispatchEntry['parse'],
      serialize: serializeMath as unknown as JsxDispatchEntry['serialize'],
    });
  }
}

function ensurePdfDispatch(): void {
  if (getJsxDispatch('Pdf') === undefined) {
    registerJsxDispatch({
      mdxComponent: 'Pdf',
      blockType: 'pdf',
      parse: parsePdf as unknown as JsxDispatchEntry['parse'],
      serialize: serializePdf as unknown as JsxDispatchEntry['serialize'],
    });
  }
}

function ensureJupyterDispatch(): void {
  if (getJsxDispatch('Jupyter') === undefined) {
    registerJsxDispatch({
      mdxComponent: 'Jupyter',
      blockType: 'jupyter',
      parse: parseJupyter as unknown as JsxDispatchEntry['parse'],
      serialize: serializeJupyter as unknown as JsxDispatchEntry['serialize'],
    });
  }
}

function ensureNnVizDispatch(): void {
  if (getJsxDispatch('NnViz') === undefined) {
    registerJsxDispatch({
      mdxComponent: 'NnViz',
      blockType: 'nn-viz',
      parse: parseNnViz as unknown as JsxDispatchEntry['parse'],
      serialize: serializeNnViz as unknown as JsxDispatchEntry['serialize'],
    });
  }
}

function ensureAgentFlowDispatch(): void {
  if (getJsxDispatch('AgentFlow') === undefined) {
    registerJsxDispatch({
      mdxComponent: 'AgentFlow',
      blockType: 'agent-flow',
      parse: parseAgentFlow as unknown as JsxDispatchEntry['parse'],
      serialize: serializeAgentFlow as unknown as JsxDispatchEntry['serialize'],
    });
  }
}

function buildComponentBlockOptions(): MdxBridgeOptions {
  const blockRegistry = new BlockRegistry();
  blockRegistry.registerCore(calloutCore);
  blockRegistry.registerCore(codeCore);
  blockRegistry.registerCore(imageCore);
  blockRegistry.registerCore(mathCore);
  blockRegistry.registerCore(pdfCore);
  blockRegistry.registerCore(jupyterCore);
  blockRegistry.registerCore(nnVizCore);
  blockRegistry.registerCore(agentFlowCore);
  return { blockRegistry };
}

function optionsForFixture(file: string, source: string): MdxBridgeOptions | undefined {
  return /^(2[2-9])-/.test(file) ||
    source.includes('<Callout') ||
    source.includes('<Code') ||
    source.includes('<Image') ||
    source.includes('<Math') ||
    source.includes('<Pdf') ||
    source.includes('<Jupyter') ||
    source.includes('<NnViz') ||
    source.includes('<AgentFlow')
    ? buildComponentBlockOptions()
    : undefined;
}

/**
 * Recursively drop every `_mdast` field; simulates an editor-built doc that
 * never went through parse(). This is the path `mdx-doctor` exercises in
 * Wave 2+ for programmatically constructed blocks (e.g. via Track F's
 * agent-tools `insert_block` / `edit_block`).
 */
function stripMdast(doc: TiptapDoc): TiptapDoc {
  return JSON.parse(
    JSON.stringify(doc, (key, value: unknown) => (key === '_mdast' ? undefined : value)),
  ) as TiptapDoc;
}

describe('MDX <-> Tiptap round-trip', () => {
  beforeAll(() => {
    ensureCalloutDispatch();
    ensureCodeDispatch();
    ensureImageDispatch();
    ensureMathDispatch();
    ensurePdfDispatch();
    ensureJupyterDispatch();
    ensureNnVizDispatch();
    ensureAgentFlowDispatch();
  });

  for (const file of FIXTURES) {
    it(`round-trips ${file} byte-equivalently`, () => {
      const original = readFileSync(join(FIXTURES_DIR, file), 'utf8');
      const options = optionsForFixture(file, original);
      const doc = mdxToTiptap(original, options);
      const restored = tiptapToMdx(doc, options);
      expect(restored.trim()).toBe(original.trim());
    });
  }

  for (const file of FIXTURES) {
    it(`round-trips ${file} byte-equivalently with _mdast stripped`, () => {
      const original = readFileSync(join(FIXTURES_DIR, file), 'utf8');
      const options = optionsForFixture(file, original);
      const doc = stripMdast(mdxToTiptap(original, options));
      const restored = tiptapToMdx(doc, options);
      expect(restored.trim()).toBe(original.trim());
    });
  }

  it('finds at least 17 fixtures', () => {
    expect(FIXTURES.length).toBeGreaterThanOrEqual(17);
  });
});

/**
 * Regression tests for the link-title comparator (pr-gate R2 BLOCKER).
 *
 * Before the fix, `marksEqual` compared link marks by `href` only — so two
 * adjacent links sharing an href but carrying different titles were grouped
 * into a single run, the second title was silently dropped, and the leaves
 * merged (`[ab](url "A")` instead of `[a](url "A")[b](url "B")`).
 *
 * Each test exercises the canonical reconstruction path (no `_mdast`) so the
 * grouper logic is forced to run.
 */
describe('marksEqual link comparator', () => {
  function canonicalRTT(body: string): string {
    const source = `---\nt: x\n---\n\n${body}\n`;
    const doc = JSON.parse(
      JSON.stringify(mdxToTiptap(source), (k, v: unknown) => (k === '_mdast' ? undefined : v)),
    ) as TiptapDoc;
    return tiptapToMdx(doc);
  }

  it('adjacent same-href different-title links round-trip distinctly', () => {
    const out = canonicalRTT('[a](https://e.test "A")[b](https://e.test "B")');
    expect(out).toContain('[a](https://e.test "A")');
    expect(out).toContain('[b](https://e.test "B")');
  });

  it('adjacent same-href same-title links merge under the shared mark (documented over-bridge)', () => {
    // Both leaves carry an identical link mark; the grouper correctly merges
    // them under one wrapper. The reconstructed canonical form is therefore
    // `[ab](url "Same")`, not `[a](url "Same")[b](url "Same")` — the same
    // adjacent-same-mark canonicalization documented in CONTRACT.md for
    // `**a****b**` → `**ab**`. This is desired behavior, not a regression.
    const out = canonicalRTT('[a](https://e.test "Same")[b](https://e.test "Same")');
    expect(out).toContain('[ab](https://e.test "Same")');
  });

  it('adjacent same-href title-vs-no-title preserves both shapes', () => {
    const out = canonicalRTT('[a](https://e.test "A")[b](https://e.test)');
    expect(out).toContain('[a](https://e.test "A")');
    expect(out).toContain('[b](https://e.test)');
  });
});

/**
 * Regression tests for the fail-loud contract: every default branch in
 * parse.ts and serialize.ts MUST throw when it encounters an unknown type.
 * Silent fallbacks (returning empty text or dropping siblings) caused two
 * production-class bugs in earlier review rounds.
 */
describe('fail-loud contract', () => {
  it('throws on unknown mark type during serialization', () => {
    const doc: TiptapDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'first', marks: [{ type: 'strikethrough' }] },
            { type: 'text', text: ' second', marks: [{ type: 'strikethrough' }] },
          ],
        },
      ],
    };
    expect(() => tiptapToMdx(doc)).toThrowError(/unsupported mark type "strikethrough"/);
  });

  it('throws on unknown block type during serialization', () => {
    const doc: TiptapDoc = {
      type: 'doc',
      content: [{ type: 'unknownBlockType', content: [] }],
    };
    expect(() => tiptapToMdx(doc)).toThrowError(/unsupported block type "unknownBlockType"/);
  });

  it('throws on unknown block type during parsing', () => {
    // mdast `definition` is a block-level reference target (e.g. `[foo]: /url`).
    // Wave 1 declines to support it. Parse must throw so callers can't
    // accidentally introduce silently-dropped content. (Wave 2 will add
    // definition / linkReference support as a fixture pair if ever needed.)
    const source = '---\nt: x\n---\n\n[foo]: /url\n';
    expect(() => mdxToTiptap(source)).toThrowError(/unsupported block type "definition"/);
  });

  it('throws on unknown inline type during parsing', () => {
    // mdast `image` is a phrasing node; Wave 1 declines to support it. Parse
    // must throw so callers can't accidentally introduce silently-dropped
    // content. (Wave 2 will add image support as a fixture + parse/serialize
    // case.)
    const source = '---\nt: x\n---\n\n![alt](img.png)\n';
    expect(() => mdxToTiptap(source)).toThrowError(/unsupported inline type "image"/);
  });

  it('throws on unknown inline type during serialization (no _mdast)', () => {
    const doc: TiptapDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'mysteryInline' }],
        },
      ],
    };
    expect(() => tiptapToMdx(doc)).toThrowError(/unsupported inline type "mysteryInline"/);
  });
});
