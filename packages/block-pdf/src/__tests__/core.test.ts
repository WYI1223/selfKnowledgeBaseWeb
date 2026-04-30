import { describe, it, expect } from 'vitest';
import { pdfCore } from '../core/core-definition';
import { parsePdf, serializePdf } from '../core';

describe('pdfCore.propsSchema', () => {
  it('accepts valid src + page + searchable', () => {
    expect(
      pdfCore.propsSchema.parse({
        src: '/files/paper.pdf',
        page: 3,
        searchable: true,
      }),
    ).toEqual({ src: '/files/paper.pdf', page: 3, searchable: true });
  });

  it('applies defaults for page=1 and searchable=false', () => {
    expect(pdfCore.propsSchema.parse({ src: '/files/paper.pdf' })).toEqual({
      src: '/files/paper.pdf',
      page: 1,
      searchable: false,
    });
  });

  it('rejects empty src (z.string().min(1))', () => {
    expect(() => pdfCore.propsSchema.parse({ src: '' })).toThrow(
      /too_small|String must contain at least|Invalid input/,
    );
  });

  it('rejects non-integer / out-of-range page', () => {
    expect(() =>
      pdfCore.propsSchema.parse({ src: '/p.pdf', page: 0 }),
    ).toThrow(/too_small|greater than or equal/);
    expect(() =>
      pdfCore.propsSchema.parse({ src: '/p.pdf', page: 1.5 }),
    ).toThrow(/integer|invalid_type|Expected integer/);
  });

  it('rejects unknown keys (.strict)', () => {
    expect(() =>
      pdfCore.propsSchema.parse({ src: '/p.pdf', extra: 'nope' }),
    ).toThrow(/unrecognized_keys/);
  });

  it('exports correct shape (BlockCoreDefinition contract)', () => {
    expect(pdfCore.name).toBe('pdf');
    expect(pdfCore.kind).toBe('render');
    expect(pdfCore.mdxComponent).toBe('Pdf');
  });
});

describe('serializePdf', () => {
  it('emits mdxJsxFlowElement with String(boolean) + String(number) attrs', () => {
    const tiptapNode = {
      type: 'pdf' as const,
      attrs: { src: '/p.pdf', page: 2, searchable: true },
    };
    const mdast = serializePdf(tiptapNode);
    expect(mdast.type).toBe('mdxJsxFlowElement');
    expect(mdast.name).toBe('Pdf');
    expect(mdast.attributes).toEqual([
      { type: 'mdxJsxAttribute', name: 'src', value: '/p.pdf' },
      { type: 'mdxJsxAttribute', name: 'page', value: '2' },
      { type: 'mdxJsxAttribute', name: 'searchable', value: 'true' },
    ]);
    expect(mdast.children).toEqual([]);
  });

  it('throws on contract drift (propsSchema.parse rejects bad attrs)', () => {
    expect(() =>
      serializePdf({
        type: 'pdf',
        attrs: {
          src: '',
          page: 1,
          searchable: false,
        },
      } as never),
    ).toThrow();
  });
});

describe('parsePdf', () => {
  it('parses string-form attrs into validated TiptapNode', () => {
    const node = parsePdf({
      type: 'mdxJsxFlowElement',
      name: 'Pdf',
      attributes: [
        { type: 'mdxJsxAttribute', name: 'src', value: '/p.pdf' },
        { type: 'mdxJsxAttribute', name: 'page', value: '4' },
        { type: 'mdxJsxAttribute', name: 'searchable', value: 'true' },
      ],
      children: [],
    });
    expect(node).toEqual({
      type: 'pdf',
      attrs: { src: '/p.pdf', page: 4, searchable: true },
    });
  });

  it('handles boolean shorthand <Pdf searchable> (attr.value === null)', () => {
    const node = parsePdf({
      type: 'mdxJsxFlowElement',
      name: 'Pdf',
      attributes: [
        { type: 'mdxJsxAttribute', name: 'src', value: '/p.pdf' },
        { type: 'mdxJsxAttribute', name: 'searchable', value: null },
      ],
      children: [],
    });
    expect(node.attrs.searchable).toBe(true);
    expect(node.attrs.page).toBe(1);
  });

  it('rejects non-true/false searchable string', () => {
    expect(() =>
      parsePdf({
        type: 'mdxJsxFlowElement',
        name: 'Pdf',
        attributes: [
          { type: 'mdxJsxAttribute', name: 'src', value: '/p.pdf' },
          { type: 'mdxJsxAttribute', name: 'searchable', value: 'yes' },
        ],
        children: [],
      }),
    ).toThrow(/invalid searchable attribute value/);
  });

  it('rejects non-numeric page string', () => {
    expect(() =>
      parsePdf({
        type: 'mdxJsxFlowElement',
        name: 'Pdf',
        attributes: [
          { type: 'mdxJsxAttribute', name: 'src', value: '/p.pdf' },
          { type: 'mdxJsxAttribute', name: 'page', value: 'first' },
        ],
        children: [],
      }),
    ).toThrow(/page attribute must be a finite number/);
  });

  it('rejects mismatched mdxComponent name', () => {
    expect(() =>
      parsePdf({
        type: 'mdxJsxFlowElement',
        name: 'NotPdf',
        attributes: [],
        children: [],
      }),
    ).toThrow(/expected mdxComponent="Pdf"/);
  });
});
