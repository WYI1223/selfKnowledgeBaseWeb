/**
 * @skb/editor-shell resize-snap unit tests (Wave 6 cf-20d).
 *
 * Covers the pure cursor-delta → snap-target math in
 * `resize/resize-snap.ts`. No React, no DOM — pure helpers consumable
 * from any caller. The full Tiptap integration is covered by the
 * apps/site Playwright spec (sample-blocks-resize-handles.spec.ts).
 *
 * Snap policy under test (per cf-20d D6):
 *   - Round-to-nearest-snap (NOT round-up).
 *   - Tie-break: round UP (D6 Q4 default tiebreak).
 *   - Clamp to [1, totalCols].
 */
import { describe, expect, it } from 'vitest';
import { snapToColSpan, snapToRowSpan } from '../../resize/resize-snap';

const COL_SNAPS_12 = [2, 3, 4, 6, 8, 12] as const;
const COL_SNAPS_6 = [2, 3, 6] as const;

// Realistic 12-col grid geometry (mirrors DEFAULT_GRID_GEOMETRY at
// container width = 1200px → oneFrac ≈ (1200 - 11*14)/12 ≈ 87.2 px).
const CONTAINER_WIDTH = 1200;
const GAP = 14;
const ROW_H = 48;

describe('snapToColSpan', () => {
  it('zero delta returns the start colSpan as the snap', () => {
    const result = snapToColSpan(0, 6, CONTAINER_WIDTH, GAP, 12, COL_SNAPS_12);
    expect(result.colSpan).toBe(6);
  });

  it('large negative delta clamps to the smallest valid snap (2)', () => {
    // -1000 px from start=12 → raw colSpan way below 2 → clamps to 2.
    const result = snapToColSpan(
      -1000,
      12,
      CONTAINER_WIDTH,
      GAP,
      12,
      COL_SNAPS_12,
    );
    expect(result.colSpan).toBe(2);
  });

  it('large positive delta clamps to the largest valid snap (12)', () => {
    // +1000 px from start=2 → raw colSpan way above 12 → clamps to 12.
    const result = snapToColSpan(
      1000,
      2,
      CONTAINER_WIDTH,
      GAP,
      12,
      COL_SNAPS_12,
    );
    expect(result.colSpan).toBe(12);
  });

  it('shrinks 12 → 6 when cursor moves left by half the container width', () => {
    // Half the container ≈ 600 px. Starting at colSpan=12 (full width)
    // shrinking by ~600 px → raw colSpan ≈ 6 → snaps to 6.
    const result = snapToColSpan(
      -600,
      12,
      CONTAINER_WIDTH,
      GAP,
      12,
      COL_SNAPS_12,
    );
    expect(result.colSpan).toBe(6);
  });

  it('shrinks 12 → 4 when cursor moves left by ~2/3 container width', () => {
    // Move left by ~800 px from colSpan=12 → raw ≈ 4 → snaps to 4.
    const result = snapToColSpan(
      -800,
      12,
      CONTAINER_WIDTH,
      GAP,
      12,
      COL_SNAPS_12,
    );
    expect(result.colSpan).toBe(4);
  });

  it('rounds 5.5 raw colSpan UP to 6 per the D6 Q4 tiebreak default', () => {
    // Construct delta so raw colSpan = 5.5 exactly.
    // raw = startColSpan + dx / (oneFrac + gap)
    // For start=5, raw=5.5 → dx = 0.5 * (oneFrac + gap)
    const oneFrac = (CONTAINER_WIDTH - 11 * GAP) / 12;
    const dx = 0.5 * (oneFrac + GAP);
    const result = snapToColSpan(
      dx,
      5,
      CONTAINER_WIDTH,
      GAP,
      12,
      [4, 5, 6, 7],
    );
    // Raw exactly 5.5; equidistant from 5 and 6; round-up tiebreak
    // picks 6.
    expect(result.colSpan).toBe(6);
  });

  it('respects the 6-col viewport snap set ([2, 3, 6])', () => {
    // Resizing on a 6-col viewport from colSpan=3 by half a column
    // width → raw = 3.5; nearest in [2, 3, 6] is 3 (distance 0.5
    // vs distance 1 to 2 vs distance 2.5 to 6).
    const containerWidth = 600;
    const oneFrac = (containerWidth - 5 * GAP) / 6;
    const dx = 0.5 * (oneFrac + GAP);
    const result = snapToColSpan(dx, 3, containerWidth, GAP, 6, COL_SNAPS_6);
    // 3.5 is equidistant from 3 and 4 — but 4 isn't in [2,3,6]; the
    // candidates are 2 (d=1.5), 3 (d=0.5), 6 (d=2.5). Nearest = 3.
    expect(result.colSpan).toBe(3);
  });

  it('returns startColSpan when activeSnaps is empty', () => {
    const result = snapToColSpan(100, 6, CONTAINER_WIDTH, GAP, 12, []);
    expect(result.colSpan).toBe(6);
  });

  it('returns startColSpan when containerWidth is 0 (test mounts before layout)', () => {
    const result = snapToColSpan(100, 6, 0, GAP, 12, COL_SNAPS_12);
    expect(result.colSpan).toBe(6);
  });

  it('exposes rawColSpan for debug/SizeTooltip use', () => {
    const result = snapToColSpan(
      -300,
      12,
      CONTAINER_WIDTH,
      GAP,
      12,
      COL_SNAPS_12,
    );
    // raw = 12 + (-300) / (87.2 + 14) ≈ 12 - 2.965 ≈ 9.04; nearest
    // snap in [2,3,4,6,8,12] is 8 (distance 1.04 vs 2.96 to 12).
    expect(result.colSpan).toBe(8);
    expect(result.rawColSpan).toBeGreaterThan(8);
    expect(result.rawColSpan).toBeLessThan(12);
  });
});

describe('snapToRowSpan', () => {
  it('zero delta returns the start rowSpan', () => {
    expect(snapToRowSpan(0, 3, ROW_H, GAP)).toBe(3);
  });

  it('clamps below 1 (start=3, large negative delta) → 1', () => {
    expect(snapToRowSpan(-1000, 3, ROW_H, GAP)).toBe(1);
  });

  it('grows by 1 row at delta = rowH + gap', () => {
    // raw rowSpan = start + dy / (rowH + gap)
    // With dy = rowH + gap, raw = start + 1 → snaps to start + 1.
    expect(snapToRowSpan(ROW_H + GAP, 2, ROW_H, GAP)).toBe(3);
  });

  it('grows by 2 rows at delta = 2*(rowH + gap)', () => {
    expect(snapToRowSpan(2 * (ROW_H + GAP), 2, ROW_H, GAP)).toBe(4);
  });

  it('rounds 2.6 → 3 (above 0.5 fractional)', () => {
    // raw rowSpan = 2 + dy / (rowH + gap) = 2.6 → ceil → 3
    // dy = 0.6 * (rowH + gap)
    const dy = 0.6 * (ROW_H + GAP);
    expect(snapToRowSpan(dy, 2, ROW_H, GAP)).toBe(3);
  });

  it('rounds 2.4 → 2 (below 0.5 fractional)', () => {
    const dy = 0.4 * (ROW_H + GAP);
    expect(snapToRowSpan(dy, 2, ROW_H, GAP)).toBe(2);
  });

  it('rounds exactly 2.5 → 3 (round-up tiebreak per D6 Q4 default)', () => {
    const dy = 0.5 * (ROW_H + GAP);
    expect(snapToRowSpan(dy, 2, ROW_H, GAP)).toBe(3);
  });

  it('returns max(1, startRowSpan) when rowH is 0 (degraded geometry)', () => {
    expect(snapToRowSpan(100, 3, 0, GAP)).toBe(3);
    expect(snapToRowSpan(100, 0, 0, GAP)).toBe(1);
  });

  it('grows from rowSpan=1 → rowSpan=4 at large positive delta', () => {
    // raw = 1 + dy / (rowH + gap) = 4 → dy = 3 * (rowH + gap)
    const dy = 3 * (ROW_H + GAP);
    expect(snapToRowSpan(dy, 1, ROW_H, GAP)).toBe(4);
  });
});
