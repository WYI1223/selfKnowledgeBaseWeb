/**
 * Smoke + invariant tests for `IMAGE_THEME_TOKENS`.
 *
 * Closes ADR-0010 D3 #7a F3 finding (block-image declared `@skb/design-tokens`
 * workspace dep without source `from '@skb/design-tokens'` import). The new
 * `theme-tokens.ts` adds a type-only import + typed const so the
 * ADR-0008 D1 mechanical scan registers a real consumption.
 *
 * Mirrors `block-code/src/__tests__/theme-tokens.test.ts` (sister-file
 * symmetry per ADR-0006 #6); change in lockstep.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { IMAGE_THEME_TOKENS } from '../ui-default';

describe('IMAGE_THEME_TOKENS', () => {
  it('is a non-empty manifest re-exported from ui-default barrel', () => {
    expect(IMAGE_THEME_TOKENS).toBeDefined();
    expect(Object.keys(IMAGE_THEME_TOKENS).length).toBeGreaterThan(0);
  });

  it('every value is a string ColorTokenName literal (runtime smoke; types enforce at compile time)', () => {
    for (const value of Object.values(IMAGE_THEME_TOKENS)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('manifest key-set is byte-equal to var(--color-*) refs from image.css (no drift either direction)', () => {
    const cssPath = resolve(__dirname, '../ui-default/image.css');
    const css = readFileSync(cssPath, 'utf8');
    const cssRefs = new Set<string>();
    const re = /var\(--color-([a-z0-9-]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(css)) !== null) {
      const cssName = match[1];
      if (cssName) cssRefs.add(cssName);
    }
    const cssToTokenKey: Record<string, string> = {
      bg: 'bg',
      fg: 'fg',
      'surface-1': 'surface1',
      'surface-2': 'surface2',
      border: 'border',
      muted: 'muted',
      accent: 'accent',
      'accent-fg': 'accentFg',
      info: 'info',
      warn: 'warn',
      note: 'note',
      success: 'success',
      error: 'error',
    };
    const expectedKeys = Array.from(cssRefs)
      .map((cssName) => {
        const mapped = cssToTokenKey[cssName];
        if (!mapped) {
          throw new Error(
            `image.css references var(--color-${cssName}) but no ColorTokenName mapping exists. ` +
              `Update cssToTokenKey in this test or @skb/design-tokens.`,
          );
        }
        return mapped;
      })
      .sort();
    const manifestKeys = Object.keys(IMAGE_THEME_TOKENS).sort();
    // Set equality: any drift in either direction (CSS adds without manifest update,
    // OR manifest carries stale key after CSS removed it) fails this test.
    // Per CONTRACT.md "Design-token 消费" invariant.
    expect(
      manifestKeys,
      `IMAGE_THEME_TOKENS keys must equal the set of var(--color-*) refs in image.css. ` +
        `Manifest keys: [${manifestKeys.join(', ')}]; CSS refs: [${expectedKeys.join(', ')}].`,
    ).toEqual(expectedKeys);
  });

  it('every key matches its ColorTokenName value (canonical self-mapping convention)', () => {
    for (const [key, value] of Object.entries(IMAGE_THEME_TOKENS)) {
      expect(value).toBe(key);
    }
  });
});
