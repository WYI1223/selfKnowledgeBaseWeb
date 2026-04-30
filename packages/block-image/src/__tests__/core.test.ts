import { describe, it, expect } from 'vitest';
import { imageCore } from '../core/core-definition';

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
