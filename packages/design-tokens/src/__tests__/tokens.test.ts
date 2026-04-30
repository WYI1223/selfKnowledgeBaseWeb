import { describe, it, expect } from 'vitest';
import { tokens, themeNames, STORAGE_KEY } from '../index';

describe('design-tokens public API', () => {
  it('exposes both light and dark theme names', () => {
    expect(themeNames).toEqual(['light', 'dark']);
  });

  it('STORAGE_KEY is the shared storage key', () => {
    expect(STORAGE_KEY).toBe('skb-theme');
  });

  it('color tokens use CSS var notation', () => {
    expect(tokens.color.bg).toMatch(/^var\(--color-bg\)$/);
    expect(tokens.color.accent).toMatch(/^var\(--color-accent\)$/);
  });

  it('space tokens use CSS var notation', () => {
    expect(tokens.space['4']).toMatch(/^var\(--space-4\)$/);
  });

  it('exposes 13 color tokens (6 surface + 2 accent + 5 semantic)', () => {
    expect(Object.keys(tokens.color)).toHaveLength(13);
  });
});
