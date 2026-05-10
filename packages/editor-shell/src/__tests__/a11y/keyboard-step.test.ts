/**
 * @skb/editor-shell keyboard-step unit tests (Wave 6 cf-22).
 *
 * Covers the pure arrow-key delta math in `a11y/keyboard-step.ts`.
 * No React, no DOM — pure helpers consumable from any caller. The
 * full Tiptap integration is covered by the apps/site Playwright
 * spec (sample-blocks-keyboard-a11y.spec.ts).
 *
 * Per cf-22 D2 (snap-step for resize, 1-cell for drag).
 */
import { describe, expect, it } from 'vitest';
import {
  keyboardGridRowStep,
  keyboardGridStep,
  keyboardRowStep,
  keyboardSnapStep,
} from '../../a11y/keyboard-step';

const COL_SNAPS_12 = [2, 3, 4, 6, 8, 12] as const;
const COL_SNAPS_6 = [2, 3, 6] as const;

describe('keyboardSnapStep — cf-22 D2 snap-step for resize', () => {
  it("'right' from interior snap → next-larger snap (6 → 8 in 12-col)", () => {
    expect(keyboardSnapStep(6, 'right', COL_SNAPS_12)).toBe(8);
  });

  it("'right' from second-largest → largest (8 → 12)", () => {
    expect(keyboardSnapStep(8, 'right', COL_SNAPS_12)).toBe(12);
  });

  it("'right' from largest snap → clamps at largest (12 → 12)", () => {
    expect(keyboardSnapStep(12, 'right', COL_SNAPS_12)).toBe(12);
  });

  it("'left' from interior snap → next-smaller snap (6 → 4 in 12-col)", () => {
    expect(keyboardSnapStep(6, 'left', COL_SNAPS_12)).toBe(4);
  });

  it("'left' from second-smallest → smallest (3 → 2)", () => {
    expect(keyboardSnapStep(3, 'left', COL_SNAPS_12)).toBe(2);
  });

  it("'left' from smallest snap → clamps at smallest (2 → 2)", () => {
    expect(keyboardSnapStep(2, 'left', COL_SNAPS_12)).toBe(2);
  });

  it('respects 6-col viewport snap set ([2, 3, 6])', () => {
    // From 3 in 6-col viewport: right → 6; left → 2.
    expect(keyboardSnapStep(3, 'right', COL_SNAPS_6)).toBe(6);
    expect(keyboardSnapStep(3, 'left', COL_SNAPS_6)).toBe(2);
  });

  it('non-snap currentColSpan: right finds next snap > current; left finds last snap < current', () => {
    // Defensive — currentColSpan of 5 (NOT a snap in [2,3,4,6,8,12]).
    // right: next strictly greater = 6.
    expect(keyboardSnapStep(5, 'right', COL_SNAPS_12)).toBe(6);
    // left: last strictly smaller = 4.
    expect(keyboardSnapStep(5, 'left', COL_SNAPS_12)).toBe(4);
  });

  it('empty activeColSnaps → returns currentColSpan unchanged', () => {
    expect(keyboardSnapStep(6, 'right', [])).toBe(6);
    expect(keyboardSnapStep(6, 'left', [])).toBe(6);
  });

  it('handles unsorted snap input defensively', () => {
    const unsorted = [12, 2, 6, 3, 8, 4];
    expect(keyboardSnapStep(6, 'right', unsorted)).toBe(8);
    expect(keyboardSnapStep(6, 'left', unsorted)).toBe(4);
  });
});

describe('keyboardGridStep — cf-22 D2 1-cell for drag', () => {
  it("'right' from col=1 → col=2 (12-col, colSpan=6)", () => {
    expect(keyboardGridStep(1, 'right', 12, 6)).toBe(2);
  });

  it("'right' clamps at totalCols - colSpan + 1 (col=7, colSpan=6, totalCols=12 → maxCol=7)", () => {
    expect(keyboardGridStep(7, 'right', 12, 6)).toBe(7);
  });

  it("'right' clamps at maxCol when already there (col=10, colSpan=4, totalCols=12 → maxCol=9 → returns 9)", () => {
    // Wait: maxCol = 12 - 4 + 1 = 9; col=10 already > maxCol; clamp returns min(9, 11) = 9.
    expect(keyboardGridStep(10, 'right', 12, 4)).toBe(9);
  });

  it("'left' from col=2 → col=1", () => {
    expect(keyboardGridStep(2, 'left', 12, 6)).toBe(1);
  });

  it("'left' clamps at col=1", () => {
    expect(keyboardGridStep(1, 'left', 12, 6)).toBe(1);
  });

  it('6-col viewport: maxCol = 6 - 3 + 1 = 4 (colSpan=3)', () => {
    expect(keyboardGridStep(4, 'right', 6, 3)).toBe(4); // already at max
    expect(keyboardGridStep(3, 'right', 6, 3)).toBe(4);
  });
});

describe('keyboardRowStep — cf-22 D2 integer ±1 for rowSpan', () => {
  it("'down' from rowSpan=1 → rowSpan=2", () => {
    expect(keyboardRowStep(1, 'down')).toBe(2);
  });

  it("'down' from large rowSpan → rowSpan + 1 (no upper clamp; user limit is content)", () => {
    expect(keyboardRowStep(100, 'down')).toBe(101);
  });

  it("'up' from rowSpan=2 → rowSpan=1", () => {
    expect(keyboardRowStep(2, 'up')).toBe(1);
  });

  it("'up' from rowSpan=1 → clamps at rowSpan=1 (NOT 0)", () => {
    expect(keyboardRowStep(1, 'up')).toBe(1);
  });
});

/**
 * R1 F2 fix (2026-05-09) — `keyboardGridRowStep` for the keyboard-
 * drag row dimension. Per ADR-0017 D13 + R1 F2 dispatch, the keyboard
 * drag tracks grid coordinates directly (NOT a synthetic pixel
 * cursor). The row step is integer ±1 with row >= 1 clamp; no
 * upper bound (rows are content-driven).
 */
describe('keyboardGridRowStep — R1 F2 grid-coord row movement for drag', () => {
  it("'down' from row=1 → row=2", () => {
    expect(keyboardGridRowStep(1, 'down')).toBe(2);
  });

  it("'down' from large row → row + 1 (no upper clamp)", () => {
    expect(keyboardGridRowStep(50, 'down')).toBe(51);
  });

  it("'up' from row=2 → row=1", () => {
    expect(keyboardGridRowStep(2, 'up')).toBe(1);
  });

  it("'up' from row=1 → clamps at row=1 (NOT 0)", () => {
    expect(keyboardGridRowStep(1, 'up')).toBe(1);
  });
});
