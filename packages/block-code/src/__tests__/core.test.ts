import { describe, it, expect } from 'vitest';
import { codeCore } from '../core/core-definition';

describe('codeCore.propsSchema', () => {
  it('accepts required language + code and defaults showLineNumbers=true', () => {
    expect(
      codeCore.propsSchema.parse({ language: 'python', code: 'print("hello")' }),
    ).toEqual({ language: 'python', code: 'print("hello")', showLineNumbers: true });
  });

  it('rejects empty language', () => {
    expect(() => codeCore.propsSchema.parse({ language: '', code: 'x' })).toThrow(
      /too_small|invalid_type|invalid_type_error/,
    );
  });

  it('rejects unknown keys (.strict)', () => {
    expect(() =>
      codeCore.propsSchema.parse({ language: 'python', code: 'x', extra: 'x' }),
    ).toThrow(/unrecognized_keys/);
  });

  it('exports correct shape (BlockCoreDefinition contract)', () => {
    expect(codeCore.name).toBe('code');
    expect(codeCore.kind).toBe('component');
    expect(codeCore.mdxComponent).toBe('Code');
  });
});
