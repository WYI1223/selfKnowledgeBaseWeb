/**
 * Smoke + invariant tests for `CODE_THEME_TOKENS`.
 *
 * Closes ADR-0010 D3 #7a F3 finding (block-code declared `@skb/design-tokens`
 * workspace dep without source `from '@skb/design-tokens'` import). The new
 * `theme-tokens.ts` adds a type-only import + typed const so the
 * ADR-0008 D1 mechanical scan registers a real consumption.
 *
 * The actual visual consumption stays in CSS (`code.css` reads
 * `var(--color-*)`); this test asserts only that the manifest exists, every
 * key→value pair is well-formed, and the manifest stays in sync with the
 * tokens referenced from CSS.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CODE_THEME_TOKENS } from '../ui-default';

describe('CODE_THEME_TOKENS', () => {
  it('is a non-empty manifest re-exported from ui-default barrel', () => {
    expect(CODE_THEME_TOKENS).toBeDefined();
    expect(Object.keys(CODE_THEME_TOKENS).length).toBeGreaterThan(0);
  });

  it('every value is a string ColorTokenName literal (runtime smoke; types enforce at compile time)', () => {
    for (const value of Object.values(CODE_THEME_TOKENS)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('manifest key-set is byte-equal to var(--color-*) refs from code.css (no drift either direction)', () => {
    const cssPath = resolve(__dirname, '../ui-default/code.css');
    const css = readFileSync(cssPath, 'utf8');
    const cssRefs = new Set<string>();
    const re = /var\(--color-([a-z0-9-]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(css)) !== null) {
      const cssName = match[1];
      if (cssName) cssRefs.add(cssName);
    }
    // Map CSS kebab-case suffix → ColorTokenName camel-case key.
    // (`--color-surface-1` → `surface1`; `--color-fg` → `fg`.)
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
            `code.css references var(--color-${cssName}) but no ColorTokenName mapping exists. ` +
              `Update cssToTokenKey in this test or @skb/design-tokens.`,
          );
        }
        return mapped;
      })
      .sort();
    const manifestKeys = Object.keys(CODE_THEME_TOKENS).sort();
    // Set equality: any drift in either direction (CSS adds without manifest update,
    // OR manifest carries stale key after CSS removed it) fails this test.
    // Per CONTRACT.md "Design-token 消费" invariant.
    expect(
      manifestKeys,
      `CODE_THEME_TOKENS keys must equal the set of var(--color-*) refs in code.css. ` +
        `Manifest keys: [${manifestKeys.join(', ')}]; CSS refs: [${expectedKeys.join(', ')}].`,
    ).toEqual(expectedKeys);
  });

  it('every key matches its ColorTokenName value (canonical self-mapping convention)', () => {
    for (const [key, value] of Object.entries(CODE_THEME_TOKENS)) {
      expect(value).toBe(key);
    }
  });
});
