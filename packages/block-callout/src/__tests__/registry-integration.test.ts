import { describe, expect, it } from 'vitest';
import { BlockRegistry } from '@skb/block-foundation';
import { calloutCore } from '../core/core-definition';

describe('block-callout registry integration', () => {
  it('registerCore + getCore round-trip preserves identity', () => {
    const reg = new BlockRegistry();
    reg.registerCore(calloutCore);
    expect(reg.getCore('callout')).toBe(calloutCore);
  });

  it('getCore returns undefined for unknown name', () => {
    const reg = new BlockRegistry();
    expect(reg.getCore('unknown-block')).toBeUndefined();
  });
});
