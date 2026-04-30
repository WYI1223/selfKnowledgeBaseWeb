import { describe, it, expect } from 'vitest';
import { calloutCore } from '../core/core-definition';

describe('calloutCore.propsSchema', () => {
  it('accepts valid variant + optional title', () => {
    expect(calloutCore.propsSchema.parse({ variant: 'note' })).toEqual({
      variant: 'note',
    });
    expect(
      calloutCore.propsSchema.parse({ variant: 'tip', title: 'Pro tip' }),
    ).toEqual({ variant: 'tip', title: 'Pro tip' });
  });

  it('rejects unknown variant (z.enum)', () => {
    expect(() =>
      calloutCore.propsSchema.parse({ variant: 'foo' }),
    ).toThrow(/invalid_enum_value|invalid_value/);
  });

  it('rejects unknown keys (.strict)', () => {
    expect(() =>
      calloutCore.propsSchema.parse({ variant: 'note', extra: 'x' }),
    ).toThrow(/unrecognized_keys/);
  });

  it('exports correct shape (BlockCoreDefinition contract)', () => {
    expect(calloutCore.name).toBe('callout');
    expect(calloutCore.kind).toBe('component');
    expect(calloutCore.mdxComponent).toBe('Callout');
  });
});
