import { describe, expect, it } from 'vitest';

import { HeavyBlockBoundary } from '../index';

describe('HeavyBlockBoundary package skeleton', () => {
  it('exports the boundary component from the package barrel', () => {
    expect(HeavyBlockBoundary).toBeDefined();
    expect(typeof HeavyBlockBoundary).toBe('function');
  });
});
