/**
 * @skb/editor-shell change-kind-attrs unit tests (Wave 6 cf-20e).
 *
 * Covers the pure attr-translation logic in
 * `kebab/change-kind-attrs.ts`. No React, no DOM — pure helper
 * consumable from any caller. The full Tiptap integration is
 * covered by the apps/site Playwright spec
 * (sample-blocks-kebab-menu.spec.ts).
 *
 * cf-20e D3 contract under test (drop-and-default + preserve grid
 * attrs only):
 *   - Universal grid attrs (col, row?, colSpan, rowSpan) preserved
 *     from source, override target defaults.
 *   - All other source attrs dropped silently.
 *   - Target defaults supply all kind-specific fields.
 *   - Identity case (source kind === target kind) = "reset to
 *     defaults + preserved grid" intended affordance.
 */
import { describe, expect, it } from 'vitest';
import { buildChangeKindAttrs } from '../../kebab/change-kind-attrs';

describe('buildChangeKindAttrs — cf-20e D3 drop-and-default + preserve grid', () => {
  // Realistic per-kind defaults (mirror registry-wire's
  // defaultBlockAttrs entries; tests don't import registry-wire to
  // keep this file pure-helper-only).
  const calloutDefaults = {
    col: 1,
    colSpan: 12,
    rowSpan: 1,
    variant: 'note',
    title: 'New callout',
  };
  const codeDefaults = {
    col: 1,
    colSpan: 12,
    rowSpan: 1,
    language: 'ts',
    code: '// New code block',
    showLineNumbers: true,
  };
  const imageDefaults = {
    col: 1,
    colSpan: 12,
    rowSpan: 1,
    src: '/sample-assets/diagram-small.png',
    alt: 'Inserted image',
  };

  it('preserves universal grid attrs (col, colSpan, rowSpan) from source', () => {
    const sourceAttrs = {
      col: 7,
      colSpan: 6,
      rowSpan: 3,
      variant: 'warning',
      title: 'My callout',
    };
    const result = buildChangeKindAttrs(
      sourceAttrs,
      'componentCode',
      codeDefaults,
    );
    expect(result['col']).toBe(7);
    expect(result['colSpan']).toBe(6);
    expect(result['rowSpan']).toBe(3);
  });

  it('drops source-kind-specific attrs (variant, title for callout → code)', () => {
    const sourceAttrs = {
      col: 1,
      colSpan: 12,
      rowSpan: 1,
      variant: 'danger',
      title: 'Stale callout title',
    };
    const result = buildChangeKindAttrs(
      sourceAttrs,
      'componentCode',
      codeDefaults,
    );
    expect(result).not.toHaveProperty('variant');
    expect(result).not.toHaveProperty('title');
  });

  it('applies target-kind defaults for kind-specific fields', () => {
    const sourceAttrs = {
      col: 1,
      colSpan: 12,
      rowSpan: 1,
      variant: 'note',
      title: 'Old',
    };
    const result = buildChangeKindAttrs(
      sourceAttrs,
      'componentCode',
      codeDefaults,
    );
    expect(result['language']).toBe('ts');
    expect(result['code']).toBe('// New code block');
    expect(result['showLineNumbers']).toBe(true);
  });

  it('preserves optional row attr when present on source', () => {
    const sourceAttrs = {
      col: 3,
      row: 2,
      colSpan: 4,
      rowSpan: 2,
      variant: 'note',
    };
    const result = buildChangeKindAttrs(
      sourceAttrs,
      'image',
      imageDefaults,
    );
    expect(result['row']).toBe(2);
    expect(result['col']).toBe(3);
    expect(result['colSpan']).toBe(4);
    expect(result['rowSpan']).toBe(2);
  });

  it('omits row attr when not present on source', () => {
    const sourceAttrs = {
      col: 1,
      colSpan: 12,
      rowSpan: 1,
      // no `row`
      variant: 'note',
    };
    const result = buildChangeKindAttrs(
      sourceAttrs,
      'image',
      imageDefaults,
    );
    expect(result).not.toHaveProperty('row');
  });

  it('identity case: source kind === target kind → defaults + preserved grid (reset-to-defaults affordance)', () => {
    // User clicks "Change kind… → callout" while already on callout.
    // Per cf-20e D3 side effect: result is target defaults + preserved
    // grid — a "reset to defaults" path. Documented as intended.
    const sourceAttrs = {
      col: 5,
      colSpan: 6,
      rowSpan: 2,
      variant: 'danger',
      title: 'Will be reset',
    };
    const result = buildChangeKindAttrs(
      sourceAttrs,
      'callout',
      calloutDefaults,
    );
    // Grid attrs preserved (NOT reset to default 1/12/1):
    expect(result['col']).toBe(5);
    expect(result['colSpan']).toBe(6);
    expect(result['rowSpan']).toBe(2);
    // Kind-specific attrs reset to defaults (NOT preserved as 'danger' / 'Will be reset'):
    expect(result['variant']).toBe('note');
    expect(result['title']).toBe('New callout');
  });

  it('handles empty source attrs (defensive: no col/row/etc) → all from target defaults', () => {
    const result = buildChangeKindAttrs({}, 'callout', calloutDefaults);
    // No source grid attrs → take defaults.
    expect(result).toEqual(calloutDefaults);
  });

  it('returns a fresh object (caller-mutation safe)', () => {
    const sourceAttrs = { col: 7, colSpan: 6, rowSpan: 1 };
    const result = buildChangeKindAttrs(
      sourceAttrs,
      'componentCode',
      codeDefaults,
    );
    // Mutating result MUST NOT affect target defaults.
    result['language'] = 'rust';
    expect(codeDefaults.language).toBe('ts');
  });
});
