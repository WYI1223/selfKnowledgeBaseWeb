import { describe, expect, it } from 'vitest';
import { BlockRegistry } from '@skb/block-foundation';
import { codeCore } from '../core/core-definition';

describe('block-code registry integration', () => {
  it('registerCore + getCore round-trip preserves identity', () => {
    const reg = new BlockRegistry();
    reg.registerCore(codeCore);
    expect(reg.getCore('code')).toBe(codeCore);
  });

  it('getCore returns undefined for unknown name', () => {
    const reg = new BlockRegistry();
    expect(reg.getCore('unknown-block')).toBeUndefined();
  });
});
