import { describe, expect, it } from 'vitest';
import { BlockRegistry } from '@skb/block-foundation';
import { imageCore } from '../core/core-definition';

describe('block-image registry integration', () => {
  it('registerCore + getCore round-trip preserves identity', () => {
    const reg = new BlockRegistry();
    reg.registerCore(imageCore);
    expect(reg.getCore('image')).toBe(imageCore);
  });

  it('getCore returns undefined for unknown name', () => {
    const reg = new BlockRegistry();
    expect(reg.getCore('unknown-block')).toBeUndefined();
  });
});
