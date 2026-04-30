import { describe, it, expect } from 'vitest';
import { mathCore } from '../core/core-definition';

describe('mathCore.propsSchema', () => {
  it('accepts valid expression with display=true', () => {
    expect(mathCore.propsSchema.parse({ expression: 'a^2 + b^2', display: true })).toEqual({
      expression: 'a^2 + b^2',
      display: true,
    });
  });

  it('accepts valid expression with display=false (and default)', () => {
    expect(mathCore.propsSchema.parse({ expression: 'x', display: false })).toEqual({
      expression: 'x',
      display: false,
    });
    expect(mathCore.propsSchema.parse({ expression: 'x' })).toEqual({
      expression: 'x',
      display: false,
    });
  });

  it('rejects empty expression (z.string().min(1))', () => {
    expect(() => mathCore.propsSchema.parse({ expression: '', display: false })).toThrow(
      /too_small|String must contain at least|Invalid input/,
    );
  });

  it('rejects non-string expression', () => {
    expect(() =>
      mathCore.propsSchema.parse({ expression: 42, display: false }),
    ).toThrow(/invalid_type|Expected string/);
  });

  it('rejects unknown keys (.strict)', () => {
    expect(() =>
      mathCore.propsSchema.parse({ expression: 'x', display: false, extra: 'nope' }),
    ).toThrow(/unrecognized_keys/);
  });

  it('exports correct shape (BlockCoreDefinition contract)', () => {
    expect(mathCore.name).toBe('math');
    expect(mathCore.kind).toBe('render');
    expect(mathCore.mdxComponent).toBe('Math');
  });
});
