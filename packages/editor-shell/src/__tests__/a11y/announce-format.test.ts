/**
 * @skb/editor-shell announce-format unit tests (Wave 6 cf-22).
 *
 * Covers the pure WCAG 4.1.3 status message formatters in
 * `a11y/announce-format.ts`. No React, no DOM — pure helpers.
 */
import { describe, expect, it } from 'vitest';
import {
  formatDragCancel,
  formatDragCommit,
  formatDragMove,
  formatExternalDragCommit,
  formatExternalDragMove,
  formatKebabAction,
  formatPaletteInsert,
  formatResizeCancel,
  formatResizeChange,
} from '../../a11y/announce-format';

describe('formatDragMove', () => {
  it('formats with kind + col + totalCols', () => {
    expect(formatDragMove('callout', 3, 12)).toBe(
      'callout block at column 3 of 12',
    );
  });

  it("collapses 'componentCode' to friendly 'code'", () => {
    expect(formatDragMove('componentCode', 7, 12)).toBe(
      'code block at column 7 of 12',
    );
  });
});

describe('formatDragCommit + formatDragCancel', () => {
  it('formats commit with kind + col', () => {
    expect(formatDragCommit('image', 5)).toBe(
      'Moved image block to column 5',
    );
  });

  it('cancel is constant string', () => {
    expect(formatDragCancel()).toBe('Move cancelled, block restored');
  });
});

describe('formatResizeChange — axis variants', () => {
  it('right axis: only fraction (NO row count)', () => {
    expect(formatResizeChange('right', 6, 1, '1/2')).toBe(
      'Resized to 1/2 width',
    );
  });

  it('bottom axis: only row count (NO fraction); pluralization', () => {
    expect(formatResizeChange('bottom', 12, 1, 'full')).toBe(
      'Resized to 1 row tall',
    );
    expect(formatResizeChange('bottom', 12, 3, 'full')).toBe(
      'Resized to 3 rows tall',
    );
  });

  it('corner axis: BOTH width fraction AND row count', () => {
    expect(formatResizeChange('corner', 6, 2, '1/2')).toBe(
      'Resized to 1/2 width and 2 rows tall',
    );
  });

  it('cancel is constant string', () => {
    expect(formatResizeCancel()).toBe('Resize cancelled, block restored');
  });
});

describe('formatExternalDragMove + formatExternalDragCommit (cf-24 ADR-0017 v0.4 D14)', () => {
  it('move uses verb "Inserting" + col / totalCols', () => {
    expect(formatExternalDragMove('image', 4, 12)).toBe(
      'Inserting image block at column 4 of 12',
    );
  });

  it("collapses 'componentCode' to friendly 'code' on move", () => {
    expect(formatExternalDragMove('componentCode', 7, 12)).toBe(
      'Inserting code block at column 7 of 12',
    );
  });

  it('commit uses verb "Inserted" + col', () => {
    expect(formatExternalDragCommit('callout', 1)).toBe(
      'Inserted callout block at column 1',
    );
  });

  it("collapses 'componentCode' to friendly 'code' on commit", () => {
    expect(formatExternalDragCommit('componentCode', 5)).toBe(
      'Inserted code block at column 5',
    );
  });
});

describe('formatPaletteInsert (cf-24 R0 F2 fix — click/Enter announce)', () => {
  it('uses verb "Added" + "at end of document" (distinct from drag verbs)', () => {
    expect(formatPaletteInsert('callout')).toBe(
      'Added callout block at end of document',
    );
  });

  it("collapses 'componentCode' to friendly 'code'", () => {
    expect(formatPaletteInsert('componentCode')).toBe(
      'Added code block at end of document',
    );
  });

  it('verb DIFFERS from drag verbs (cf-22 + cf-24 user-model parity)', () => {
    // cf-22 drag = "Moved"; cf-24 external drag = "Inserted at column N";
    // cf-24 click/Enter = "Added at end of document". Different verbs +
    // different position semantics signal different user models per
    // WCAG 4.1.3 message clarity.
    const paletteInsert = formatPaletteInsert('image');
    expect(paletteInsert).not.toContain('Moved');
    expect(paletteInsert).not.toContain('Inserted');
    expect(paletteInsert).toContain('Added');
    expect(paletteInsert).toContain('end of document');
  });
});

describe('formatKebabAction — 3 actions', () => {
  it('delete', () => {
    expect(formatKebabAction('delete', 'callout')).toBe(
      'Deleted callout block',
    );
  });

  it('duplicate', () => {
    expect(formatKebabAction('duplicate', 'image')).toBe(
      'Duplicated image block',
    );
  });

  it('change kind WITH newKind', () => {
    expect(formatKebabAction('change kind', 'callout', 'componentCode')).toBe(
      'Changed callout block to code',
    );
  });

  it('change kind WITHOUT newKind (graceful degradation)', () => {
    expect(formatKebabAction('change kind', 'callout')).toBe(
      'Changed callout block kind',
    );
  });
});
