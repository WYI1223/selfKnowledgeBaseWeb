import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GRID_GEOMETRY,
  effectiveCellHeight,
  effectiveColSnaps,
  effectiveColWidth,
  effectiveRowSpan,
  isAutoRowSpan,
  validateGridPosition,
} from '../grid-math';
import { COL_SNAPS, proseGridDefaults } from '../types';

describe('grid geometry helpers', () => {
  it('computes W5-1 cell heights from rowSpan, row height, and gap', () => {
    expect(effectiveCellHeight(1)).toBe(48);
    expect(effectiveCellHeight(2)).toBe(110);
    expect(effectiveCellHeight(3)).toBe(172);
    expect(effectiveCellHeight(6)).toBe(358);
    expect(effectiveCellHeight(2, { rowH: 64, gap: 10 })).toBe(138);
  });

  it('computes W5-1 column widths from container width and grid gap', () => {
    const oneFr = (1200 - 11 * 14) / 12;

    expect(effectiveColWidth(12, 1200)).toBe(1200);
    expect(effectiveColWidth(6, 1200)).toBe(6 * oneFr + 5 * 14);
    expect(effectiveColWidth(6, 1200)).toBe(593);
    expect(effectiveColWidth(2, 1200)).toBeCloseTo(2 * oneFr + 14);
  });

  it('uses the auto rowSpan hint only for auto row spans', () => {
    expect(effectiveRowSpan('auto', 4)).toBe(4);
    expect(effectiveRowSpan(3, 99)).toBe(3);
    expect(effectiveRowSpan(1, 0)).toBe(1);
  });
});

describe('validateGridPosition', () => {
  it('accepts valid grid positions', () => {
    expect(() =>
      validateGridPosition({ col: 1, colSpan: 12, rowSpan: 1 }),
    ).not.toThrow();
    expect(() =>
      validateGridPosition({ col: 5, colSpan: 8, rowSpan: 'auto' }),
    ).not.toThrow();
  });

  it('throws for invalid grid positions', () => {
    expect(() =>
      validateGridPosition({ col: 0, colSpan: 12, rowSpan: 1 }),
    ).toThrow(/col.*1.*based|col < 1/i);
    expect(() =>
      validateGridPosition({ col: 13, colSpan: 2, rowSpan: 1 }),
    ).toThrow(/col.*12|exceeds.*12/i);
    expect(() =>
      validateGridPosition({ col: 1, colSpan: 5, rowSpan: 1 }),
    ).toThrow(/COL_SNAPS|colSpan/i);
    expect(() =>
      validateGridPosition({ col: 6, colSpan: 8, rowSpan: 1 }),
    ).toThrow(/overflow|exceeds.*12/i);
    expect(() =>
      validateGridPosition({ col: 1, colSpan: 12, rowSpan: 0 }),
    ).toThrow(/rowSpan.*1|rowSpan < 1/i);
    expect(() =>
      validateGridPosition({
        col: 1,
        colSpan: 12,
        rowSpan: 'auto',
        gridKind: 'render',
      }),
    ).toThrow(/rowSpan.*auto.*prose|gridKind/i);
  });
});

describe('isAutoRowSpan', () => {
  it('treats prose semantics and prose grid kind as auto rowSpan', () => {
    expect(isAutoRowSpan({ rowSpanSemantic: 'auto' })).toBe(true);
    expect(isAutoRowSpan({ gridKind: 'prose' })).toBe(true);
    expect(
      isAutoRowSpan({ rowSpanSemantic: 'integer', gridKind: 'component' }),
    ).toBe(false);
    expect(isAutoRowSpan({})).toBe(false);
  });
});

describe('grid exported constants', () => {
  it('keeps the W5-1 default geometry literal stable', () => {
    expect(DEFAULT_GRID_GEOMETRY).toEqual({ rowH: 48, gap: 14, totalCols: 12 });
  });

  it('keeps the grid type primitive literals stable', () => {
    expect(Array.from(COL_SNAPS)).toEqual([2, 3, 4, 6, 8, 12]);
    expect(proseGridDefaults).toEqual({
      rowSpanSemantic: 'auto',
      gridKind: 'prose',
      defaultColSpan: 12,
    });
  });
});

describe('effectiveColSnaps', () => {
  it('12-col returns 6 stops', () => {
    expect(effectiveColSnaps(12)).toEqual([2, 3, 4, 6, 8, 12]);
  });

  it('6-col returns 3 stops', () => {
    expect(effectiveColSnaps(6)).toEqual([2, 3, 6]);
  });

  it('1-col returns forced full', () => {
    expect(effectiveColSnaps(1)).toEqual([1]);
  });

  it('result is readonly', () => {
    const result = effectiveColSnaps(12);

    expect(Object.isFrozen(result)).toBe(true);
    expect(() => {
      (result as unknown as number[]).push(1);
    }).toThrow(TypeError);
  });
});
