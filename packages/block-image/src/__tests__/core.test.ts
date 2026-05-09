import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import { imageCore } from '../core/core-definition';
import { parseImage } from '../core';
import type { ImageMdastJsxElement } from '../core/serialize';

function parseMdxFlow(source: string): ImageMdastJsxElement {
  const tree = unified().use(remarkParse).use(remarkMdx).parse(source) as {
    children: ReadonlyArray<{ type: string }>;
  };
  const flow = tree.children.find((n) => n.type === 'mdxJsxFlowElement');
  if (!flow) throw new Error('parseMdxFlow: fixture did not produce an mdxJsxFlowElement');
  return flow as unknown as ImageMdastJsxElement;
}

describe('imageCore.propsSchema', () => {
  it('accepts src + alt', () => {
    expect(imageCore.propsSchema.parse({ src: '/path/img.png', alt: 'logo' })).toEqual({
      src: '/path/img.png',
      alt: 'logo',
    });
  });

  it('accepts optional dimensions', () => {
    expect(
      imageCore.propsSchema.parse({
        src: '/path/img.png',
        alt: '',
        width: 320,
        height: 240,
      }),
    ).toEqual({
      src: '/path/img.png',
      alt: '',
      width: 320,
      height: 240,
    });
  });

  it('rejects negative dimensions and empty src', () => {
    expect(() => imageCore.propsSchema.parse({ src: '', alt: 'logo' })).toThrow(
      /too_small|min/,
    );
    expect(() =>
      imageCore.propsSchema.parse({ src: '/path/img.png', alt: 'logo', width: 0 }),
    ).toThrow(/too_small|not_positive/);
  });

  it('exports correct shape (BlockCoreDefinition contract)', () => {
    expect(imageCore.name).toBe('image');
    expect(imageCore.kind).toBe('component');
    expect(imageCore.mdxComponent).toBe('Image');
  });
});

describe('parseImage — JSX expression form (Wave 6 carry-forward #16)', () => {
  it('accepts the production sample-blocks fixture (numeric width/height expressions)', () => {
    const node = parseImage(
      parseMdxFlow(
        '<Image src="/sample-assets/diagram-small.png" alt="Small diagram" width={320} height={180} />',
      ),
    );
    expect(node.attrs.src).toBe('/sample-assets/diagram-small.png');
    expect(node.attrs.alt).toBe('Small diagram');
    expect(node.attrs.width).toBe(320);
    expect(node.attrs.height).toBe(180);
  });

  it('rejects width via a non-finite expression', () => {
    expect(() =>
      parseImage(parseMdxFlow('<Image src="/x.png" alt="x" width={NaN} />')),
    ).toThrow(/finite number/);
  });
});
