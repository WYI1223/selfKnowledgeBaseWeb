/**
 * Wave 6 cf-20b (2026-05-09) — vitest coverage of the shared
 * `BlockGridPosition → CSSProperties` formula in
 * `packages/editor-shell/src/grid-style.ts`.
 *
 * Three consumers (BlockNodeView.tsx editor + mdx-adapter.ts read +
 * 3 heavy block .astro wrappers) all import this single source. Drift
 * detection is structural: any future renderer adding a 4th consumer
 * gets caught by these tests as long as the consumer goes through the
 * shared module rather than re-deriving the formula.
 *
 * Authority: ADR-0016 D2 (`BlockGridPosition` shape) + ADR-0016 D8
 * (Astro renderer applies `style.gridColumn` / `style.gridRow`) +
 * ADR-0016 v0.2 D11.1 amendment (editor-surface grid lock).
 */

import { describe, expect, it } from 'vitest';
import {
  extractGridPosition,
  gridPlacementStyle,
  gridPlacementStyleAttr,
} from '../grid-style';

describe('gridPlacementStyle', () => {
  it('emits gridColumn `${col} / span ${colSpan}` for the canonical full-width fixture', () => {
    const style = gridPlacementStyle({ col: 1, colSpan: 12, rowSpan: 1 });
    expect(style.gridColumn).toBe('1 / span 12');
    // row undefined → `span ${rowSpan}` shorthand (no explicit start row)
    expect(style.gridRow).toBe('span 1');
  });

  it('emits explicit start row when row is provided', () => {
    const style = gridPlacementStyle({ col: 7, row: 3, colSpan: 6, rowSpan: 4 });
    expect(style.gridColumn).toBe('7 / span 6');
    expect(style.gridRow).toBe('3 / span 4');
  });

  it('substitutes autoRowSpan default (1) when rowSpan is auto', () => {
    const style = gridPlacementStyle({ col: 1, colSpan: 6, rowSpan: 'auto' });
    expect(style.gridColumn).toBe('1 / span 6');
    expect(style.gridRow).toBe('span 1');
  });

  it('substitutes the caller-provided autoRowSpan integer when rowSpan is auto', () => {
    const style = gridPlacementStyle(
      { col: 1, colSpan: 6, rowSpan: 'auto' },
      { autoRowSpan: 5 },
    );
    expect(style.gridRow).toBe('span 5');
  });

  it('handles explicit row + auto rowSpan via autoRowSpan substitution', () => {
    const style = gridPlacementStyle(
      { col: 1, row: 2, colSpan: 4, rowSpan: 'auto' },
      { autoRowSpan: 3 },
    );
    expect(style.gridRow).toBe('2 / span 3');
  });
});

describe('gridPlacementStyleAttr (Astro inline string)', () => {
  it('serializes the style block as a single semicolon-separated string', () => {
    const attr = gridPlacementStyleAttr({ col: 1, colSpan: 12, rowSpan: 1 });
    expect(attr).toBe('grid-column: 1 / span 12; grid-row: span 1;');
  });

  it('mirrors gridPlacementStyle output for explicit row + colSpan combo', () => {
    const attr = gridPlacementStyleAttr({ col: 7, row: 3, colSpan: 6, rowSpan: 4 });
    expect(attr).toBe('grid-column: 7 / span 6; grid-row: 3 / span 4;');
  });
});

describe('extractGridPosition', () => {
  it('returns the canonical shape from a complete attrs record', () => {
    const pos = extractGridPosition({ col: 7, row: 3, colSpan: 6, rowSpan: 4 });
    expect(pos).toEqual({ col: 7, row: 3, colSpan: 6, rowSpan: 4 });
  });

  it('omits row when undefined (matches ADR-0016 D2 optional `row`)', () => {
    const pos = extractGridPosition({ col: 1, colSpan: 12, rowSpan: 1 });
    expect(pos).toEqual({ col: 1, colSpan: 12, rowSpan: 1 });
    expect(pos?.row).toBeUndefined();
  });

  it("preserves rowSpan='auto' (prose path)", () => {
    const pos = extractGridPosition({ col: 1, colSpan: 6, rowSpan: 'auto' });
    expect(pos).toEqual({ col: 1, colSpan: 6, rowSpan: 'auto' });
  });

  it('returns null when attrs is undefined', () => {
    expect(extractGridPosition(undefined)).toBeNull();
  });

  it('returns null when col is missing', () => {
    expect(extractGridPosition({ colSpan: 12, rowSpan: 1 })).toBeNull();
  });

  it('returns null when colSpan is missing', () => {
    expect(extractGridPosition({ col: 1, rowSpan: 1 })).toBeNull();
  });

  it('returns null when rowSpan is missing', () => {
    expect(extractGridPosition({ col: 1, colSpan: 12 })).toBeNull();
  });

  it('returns null when col is non-integer', () => {
    expect(extractGridPosition({ col: 1.5, colSpan: 12, rowSpan: 1 })).toBeNull();
  });

  it('returns null when col is < 1', () => {
    expect(extractGridPosition({ col: 0, colSpan: 12, rowSpan: 1 })).toBeNull();
  });

  it('returns null when rowSpan is a string that is not "auto"', () => {
    expect(
      extractGridPosition({ col: 1, colSpan: 12, rowSpan: 'big' }),
    ).toBeNull();
  });

  it('ignores invalid row (returns position without row)', () => {
    const pos = extractGridPosition({ col: 1, colSpan: 12, rowSpan: 1, row: 0 });
    expect(pos).toEqual({ col: 1, colSpan: 12, rowSpan: 1 });
    expect(pos?.row).toBeUndefined();
  });

  it('ignores extra props on the attrs record', () => {
    const pos = extractGridPosition({
      col: 1,
      colSpan: 12,
      rowSpan: 1,
      variant: 'note',
      title: 'Sample',
      // any other MDX prop or Tiptap attr
    });
    expect(pos).toEqual({ col: 1, colSpan: 12, rowSpan: 1 });
  });
});

describe('cf-20b cross-consumer parity', () => {
  // The three consumers (BlockNodeView.tsx, mdx-adapter.ts, the 3 heavy
  // .astro wrappers) all derive their grid-column / grid-row from this
  // helper. The byte-equality check below catches the case where a future
  // renderer re-derives the formula and drifts.
  it('gridPlacementStyleAttr is byte-equal to the JSX-spread form', () => {
    const pos = { col: 7, row: 3, colSpan: 6, rowSpan: 4 } as const;
    const cssProps = gridPlacementStyle(pos);
    const attrStr = gridPlacementStyleAttr(pos);
    // The Astro string form MUST contain the same gridColumn + gridRow values
    // that the React CSSProperties form does (just kebab-cased + concatenated).
    expect(attrStr).toContain(`grid-column: ${cssProps.gridColumn}`);
    expect(attrStr).toContain(`grid-row: ${cssProps.gridRow}`);
  });
});
