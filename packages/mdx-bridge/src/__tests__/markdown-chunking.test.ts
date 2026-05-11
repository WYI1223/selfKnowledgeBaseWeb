/**
 * Wave 6 cf-25 — markdown chunking-pass + unwrap-on-default-pass
 * round-trip tests.
 *
 * Pre-EXECUTE blocking discovery #3 (cf-25 PR.md "Honest scope
 * estimate"): chunking pass on parse + unwrap-on-default pass on
 * serialize MUST be perfectly inverse functions. Every existing
 * mdx-bridge fixture MUST continue to round-trip byte-equivalent
 * (round-trip.test.ts already enforces this); cf-25 ADDS this test
 * suite to lock the new chunking semantics + the unwrap-on-default
 * preservation of legacy MDX byte-equivalence.
 *
 * Test plan:
 * 1. Bare prose chunks parse to ONE markdown wrapper Tiptap block
 *    each, with default grid attrs.
 * 2. Multi-paragraph chunk → ONE markdown wrapper containing 2 inner paragraphs.
 * 3. JSX flow element BREAKS the chunk — adjacent prose forms separate chunks.
 * 4. Mixed prose types (heading + paragraph + list) fold into ONE chunk.
 * 5. Default-grid markdown wrapper UNWRAPS on serialize back to bare prose.
 * 6. Non-default-grid markdown wrapper PRESERVES the JSX wrapper on serialize.
 * 7. Round-trip: bare-prose-in → markdown(default) → bare-prose-out (byte-equivalent).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { BlockRegistry } from '@skb/block-foundation';
import { calloutCore, parseCallout, serializeCallout } from '@skb/block-callout/core';
import { markdownCore, parseMarkdown, serializeMarkdown } from '@skb/block-markdown/core';
import {
  getJsxDispatch,
  mdxToTiptap,
  registerJsxDispatch,
  tiptapToMdx,
  type JsxDispatchEntry,
  type MdxBridgeOptions,
} from '../index';

function ensureDispatches(): void {
  if (getJsxDispatch('Markdown') === undefined) {
    registerJsxDispatch({
      mdxComponent: 'Markdown',
      blockType: 'markdown',
      parse: parseMarkdown as unknown as JsxDispatchEntry['parse'],
      serialize: serializeMarkdown as unknown as JsxDispatchEntry['serialize'],
    });
  }
  if (getJsxDispatch('Callout') === undefined) {
    registerJsxDispatch({
      mdxComponent: 'Callout',
      blockType: 'callout',
      parse: parseCallout as unknown as JsxDispatchEntry['parse'],
      serialize: serializeCallout as unknown as JsxDispatchEntry['serialize'],
    });
  }
}

function buildOptions(): MdxBridgeOptions {
  const blockRegistry = new BlockRegistry();
  blockRegistry.registerCore(markdownCore);
  blockRegistry.registerCore(calloutCore);
  return { blockRegistry };
}

describe('cf-25 markdown chunking pass (parse)', () => {
  beforeAll(ensureDispatches);

  it('folds a single paragraph into ONE markdown block', () => {
    const source = '---\nt: x\n---\n\nHello world.\n';
    const doc = mdxToTiptap(source, buildOptions());
    expect(doc.content).toHaveLength(1);
    expect(doc.content[0]?.type).toBe('markdown');
    expect(doc.content[0]?.attrs).toMatchObject({
      col: 1,
      colSpan: 12,
      rowSpan: 'auto',
    });
  });

  it('folds two consecutive paragraphs into ONE markdown block with 2 inner paragraphs', () => {
    const source = '---\nt: x\n---\n\nFirst paragraph.\n\nSecond paragraph.\n';
    const doc = mdxToTiptap(source, buildOptions());
    expect(doc.content).toHaveLength(1);
    expect(doc.content[0]?.type).toBe('markdown');
    expect(doc.content[0]?.content).toHaveLength(2);
    expect(doc.content[0]?.content?.[0]?.type).toBe('paragraph');
    expect(doc.content[0]?.content?.[1]?.type).toBe('paragraph');
  });

  it('folds heading + paragraph + list into ONE markdown block', () => {
    const source = '---\nt: x\n---\n\n# Heading\n\nText.\n\n* item one\n* item two\n';
    const doc = mdxToTiptap(source, buildOptions());
    expect(doc.content).toHaveLength(1);
    expect(doc.content[0]?.type).toBe('markdown');
    expect(doc.content[0]?.content).toHaveLength(3);
    expect(doc.content[0]?.content?.[0]?.type).toBe('heading');
    expect(doc.content[0]?.content?.[1]?.type).toBe('paragraph');
    expect(doc.content[0]?.content?.[2]?.type).toBe('bulletList');
  });

  it('breaks chunk on JSX flow element', () => {
    const source = [
      '---\nt: x\n---\n',
      '',
      'Before callout.',
      '',
      '<Callout col={1} colSpan={12} rowSpan={1} variant="note" title="Mid" />',
      '',
      'After callout.',
      '',
    ].join('\n');
    const doc = mdxToTiptap(source, buildOptions());
    // Expected: [markdown(prose-before), callout, markdown(prose-after)]
    expect(doc.content).toHaveLength(3);
    expect(doc.content[0]?.type).toBe('markdown');
    expect(doc.content[1]?.type).toBe('callout');
    expect(doc.content[2]?.type).toBe('markdown');
  });

  it('emits NO markdown block on a doc with only a JSX flow element', () => {
    const source =
      '---\nt: x\n---\n\n<Callout col={1} colSpan={12} rowSpan={1} variant="note" title="Solo" />\n';
    const doc = mdxToTiptap(source, buildOptions());
    expect(doc.content).toHaveLength(1);
    expect(doc.content[0]?.type).toBe('callout');
  });

  it('emits NO markdown block on an empty doc', () => {
    const source = '---\nt: x\n---\n';
    const doc = mdxToTiptap(source, buildOptions());
    expect(doc.content).toHaveLength(0);
  });

  it('preserves explicit grid attrs on the Markdown JSX wrapper element', () => {
    const source =
      '---\nt: x\n---\n\n<Markdown col={1} colSpan={6}>\n  Sized markdown.\n</Markdown>\n';
    const doc = mdxToTiptap(source, buildOptions());
    expect(doc.content).toHaveLength(1);
    expect(doc.content[0]?.type).toBe('markdown');
    expect(doc.content[0]?.attrs).toMatchObject({
      col: 1,
      colSpan: 6,
      rowSpan: 'auto',
    });
  });
});

describe('cf-25 markdown unwrap-on-default pass (serialize)', () => {
  beforeAll(ensureDispatches);

  it('unwraps default-grid markdown to bare prose mdast (NO JSX wrapper in output)', () => {
    // Round-trip: bare prose source → tiptap → MDX out (bare prose, NO Markdown wrapper)
    const source = '---\nt: x\n---\n\nHello bare prose.\n';
    const doc = mdxToTiptap(source, buildOptions());
    const restored = tiptapToMdx(doc, buildOptions());
    expect(restored.trim()).toBe(source.trim());
    expect(restored).not.toContain('<Markdown');
  });

  it('preserves JSX wrapper on serialize when grid attrs are non-default', () => {
    const source =
      '---\nt: x\n---\n\n<Markdown col={1} colSpan={6}>\n  Sized markdown.\n</Markdown>\n';
    const doc = mdxToTiptap(source, buildOptions());
    const restored = tiptapToMdx(doc, buildOptions());
    expect(restored).toContain('<Markdown col={1} colSpan={6}>');
  });

  it('full round-trip preserves byte-equivalence for mixed prose + JSX flow', () => {
    const source = [
      '---',
      't: x',
      '---',
      '',
      'Before callout.',
      '',
      '<Callout col={1} colSpan={12} rowSpan={1} variant="note" title="Mid" />',
      '',
      'After callout.',
      '',
    ].join('\n');
    const doc = mdxToTiptap(source, buildOptions());
    const restored = tiptapToMdx(doc, buildOptions());
    expect(restored.trim()).toBe(source.trim());
  });
});
