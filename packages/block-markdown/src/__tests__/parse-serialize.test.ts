/**
 * Wave 6 cf-25 — `@skb/block-markdown` headless layer tests.
 *
 * Tests the core/{parse,serialize,core-definition} hooks in
 * isolation (no mdx-bridge wiring). The cross-package integration
 * round-trip tests live in
 * `packages/mdx-bridge/src/__tests__/markdown-chunking.test.ts`.
 *
 * Test plan:
 * 1. Core definition shape (name + kind + mdxComponent).
 * 2. propsSchema rejects non-strict shape (extra fields).
 * 3. propsSchema accepts the {col, row?, colSpan, rowSpan} shape
 *    with rowSpan as a positive integer (Wave 7 Phase 2A / ADR-0020 D1
 *    — legacy `'auto'` literal no longer accepted by the schema;
 *    mdx-bridge normalizes legacy attrs at parse time).
 * 4. parseMarkdown returns the right Tiptap node type.
 * 5. parseMarkdown rejects wrong mdxComponent name.
 * 6. serializeMarkdown emits the right MDX wrapper element.
 * 7. serializeMarkdown rejects wrong Tiptap node type.
 */
import { describe, expect, it } from 'vitest';
import { markdownCore, parseMarkdown, serializeMarkdown } from '../core';

describe('cf-25 markdownCore definition', () => {
  it('has the locked-plan identity fields', () => {
    expect(markdownCore.name).toBe('markdown');
    expect(markdownCore.kind).toBe('prose');
    expect(markdownCore.mdxComponent).toBe('Markdown');
  });
});

describe('cf-25 markdownCore propsSchema', () => {
  it('accepts default grid attrs (col=1, colSpan=12, rowSpan=1)', () => {
    const result = markdownCore.propsSchema.safeParse({
      col: 1,
      colSpan: 12,
      rowSpan: 1,
    });
    expect(result.success).toBe(true);
  });

  it('accepts explicit grid attrs (col=1, colSpan=6, rowSpan=3)', () => {
    const result = markdownCore.propsSchema.safeParse({
      col: 1,
      colSpan: 6,
      rowSpan: 3,
    });
    expect(result.success).toBe(true);
  });

  it('accepts the optional row attr', () => {
    const result = markdownCore.propsSchema.safeParse({
      col: 1,
      row: 5,
      colSpan: 12,
      rowSpan: 2,
    });
    expect(result.success).toBe(true);
  });

  it('rejects rowSpan="auto" (Wave 7 Phase 2A: integer only)', () => {
    const result = markdownCore.propsSchema.safeParse({
      col: 1,
      colSpan: 12,
      rowSpan: 'auto',
    });
    expect(result.success).toBe(false);
  });

  it('rejects rowSpan="invalid" string', () => {
    const result = markdownCore.propsSchema.safeParse({
      col: 1,
      colSpan: 12,
      rowSpan: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects col=0 (must be >= 1)', () => {
    const result = markdownCore.propsSchema.safeParse({
      col: 0,
      colSpan: 12,
      rowSpan: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects col=13 (must be <= 12)', () => {
    const result = markdownCore.propsSchema.safeParse({
      col: 13,
      colSpan: 12,
      rowSpan: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects extra unknown attr (strict() schema)', () => {
    const result = markdownCore.propsSchema.safeParse({
      col: 1,
      colSpan: 12,
      rowSpan: 1,
      extraField: 'evil',
    });
    expect(result.success).toBe(false);
  });
});

describe('cf-25 parseMarkdown', () => {
  it('returns a markdown Tiptap node type with passthrough children', () => {
    const node = {
      type: 'mdxJsxFlowElement' as const,
      name: 'Markdown',
      attributes: [],
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'Hello prose.' }],
        },
      ],
    };
    const result = parseMarkdown(node);
    expect(result.type).toBe('markdown');
    expect(result.attrs).toEqual({});
    expect(result.content).toEqual(node.children);
  });

  it('throws on wrong mdxComponent name', () => {
    const node = {
      type: 'mdxJsxFlowElement' as const,
      name: 'Callout',
      attributes: [],
      children: [],
    };
    expect(() => parseMarkdown(node)).toThrow(/expected mdxComponent/);
  });
});

describe('cf-25 serializeMarkdown', () => {
  it('emits a Markdown JSX wrapper element with empty attributes (grid attrs added by mdx-bridge upstream)', () => {
    const node = {
      type: 'markdown' as const,
      attrs: { col: 1, colSpan: 6, rowSpan: 1 },
      content: [],
    };
    const result = serializeMarkdown(node);
    expect(result.type).toBe('mdxJsxFlowElement');
    expect(result.name).toBe('Markdown');
    expect(result.attributes).toEqual([]);
    expect(result.children).toEqual([]);
  });

  it('passes through inner children unchanged', () => {
    const innerChildren = [{ type: 'paragraph', children: [{ type: 'text', value: 'X' }] }];
    const node = {
      type: 'markdown' as const,
      attrs: {},
      content: innerChildren,
    };
    const result = serializeMarkdown(node);
    expect(result.children).toBe(innerChildren);
  });

  it('throws on wrong Tiptap node type', () => {
    const node = {
      type: 'callout' as unknown as 'markdown',
      attrs: {},
      content: [],
    };
    expect(() => serializeMarkdown(node)).toThrow(/expected type='markdown'/);
  });
});
