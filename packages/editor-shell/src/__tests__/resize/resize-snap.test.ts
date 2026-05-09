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
 *
 * R1 F2 lock (2026-05-09): all `snapToColSpan` calls take a
 * `startCol` arg so the function can filter overflowing snaps per
 * ADR-0016 D2 invariant `col + colSpan - 1 <= totalCols`. Default
 * `startCol = 1` for happy-path cases (block at left edge); F2-
 * specific cases below cover non-col=1 blocks.
 */
import { describe, expect, it } from 'vitest';
import {
  buildResizeNextAttrs,
  snapToColSpan,
  snapToRowSpan,
} from '../../resize/resize-snap';

const COL_SNAPS_12 = [2, 3, 4, 6, 8, 12] as const;
const COL_SNAPS_6 = [2, 3, 6] as const;

// Realistic 12-col grid geometry (mirrors DEFAULT_GRID_GEOMETRY at
// container width = 1200px → oneFrac ≈ (1200 - 11*14)/12 ≈ 87.2 px).
const CONTAINER_WIDTH = 1200;
const GAP = 14;
const ROW_H = 48;

describe('snapToColSpan', () => {
  it('zero delta returns the start colSpan as the snap', () => {
    const result = snapToColSpan(
      0,
      6,
      1,
      CONTAINER_WIDTH,
      GAP,
      12,
      COL_SNAPS_12,
    );
    expect(result.colSpan).toBe(6);
  });

  it('large negative delta clamps to the smallest valid snap (2)', () => {
    // -1000 px from start=12 → raw colSpan way below 2 → clamps to 2.
    const result = snapToColSpan(
      -1000,
      12,
      1,
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
      1,
      CONTAINER_WIDTH,
      GAP,
      12,
      COL_SNAPS_12,
    );
    expect(result.colSpan).toBe(12);
  });

  it('shrinks 12 → 6 when cursor moves left by half the container width', () => {
    const result = snapToColSpan(
      -600,
      12,
      1,
      CONTAINER_WIDTH,
      GAP,
      12,
      COL_SNAPS_12,
    );
    expect(result.colSpan).toBe(6);
  });

  it('shrinks 12 → 4 when cursor moves left by ~2/3 container width', () => {
    const result = snapToColSpan(
      -800,
      12,
      1,
      CONTAINER_WIDTH,
      GAP,
      12,
      COL_SNAPS_12,
    );
    expect(result.colSpan).toBe(4);
  });

  it('rounds 5.5 raw colSpan UP to 6 per the D6 Q4 tiebreak default', () => {
    const oneFrac = (CONTAINER_WIDTH - 11 * GAP) / 12;
    const dx = 0.5 * (oneFrac + GAP);
    const result = snapToColSpan(
      dx,
      5,
      1,
      CONTAINER_WIDTH,
      GAP,
      12,
      [4, 5, 6, 7],
    );
    expect(result.colSpan).toBe(6);
  });

  it('respects the 6-col viewport snap set ([2, 3, 6])', () => {
    const containerWidth = 600;
    const oneFrac = (containerWidth - 5 * GAP) / 6;
    const dx = 0.5 * (oneFrac + GAP);
    const result = snapToColSpan(
      dx,
      3,
      1,
      containerWidth,
      GAP,
      6,
      COL_SNAPS_6,
    );
    expect(result.colSpan).toBe(3);
  });

  it('returns startColSpan when activeSnaps is empty', () => {
    const result = snapToColSpan(100, 6, 1, CONTAINER_WIDTH, GAP, 12, []);
    expect(result.colSpan).toBe(6);
  });

  it('returns startColSpan when containerWidth is 0 (test mounts before layout)', () => {
    const result = snapToColSpan(100, 6, 1, 0, GAP, 12, COL_SNAPS_12);
    expect(result.colSpan).toBe(6);
  });

  it('exposes rawColSpan for debug/SizeTooltip use', () => {
    const result = snapToColSpan(
      -300,
      12,
      1,
      CONTAINER_WIDTH,
      GAP,
      12,
      COL_SNAPS_12,
    );
    expect(result.colSpan).toBe(8);
    expect(result.rawColSpan).toBeGreaterThan(8);
    expect(result.rawColSpan).toBeLessThan(12);
  });
});

/**
 * R1 F2 fix (2026-05-09) — overflow-filter tests for non-col=1
 * blocks. Pre-R1 the function clamped only to `[1, totalCols]`;
 * blocks with `col > 1` could snap to colSpan values that overflow
 * the grid (e.g. col=7 + colSpan=8 → 7+8-1=14 > 12). R1 fix:
 * filter activeSnaps to `snap <= totalCols - col + 1` BEFORE
 * picking nearest.
 */
describe('snapToColSpan — R1 F2 overflow-filter for non-col=1 blocks', () => {
  it('col=3 + start=6 + large positive delta → max snap = 6 (NOT 8 or 12)', () => {
    // 3 + 6 - 1 = 8 ≤ 12 ✓; 3 + 8 - 1 = 10 ≤ 12 ✓; 3 + 12 - 1 = 14 > 12 ✗.
    // So fitting snaps from [2,3,4,6,8,12] are [2,3,4,6,8].
    // Large positive delta drives raw far above 8 → snap = 8 (largest
    // fitting). Wait: 3 + 8 - 1 = 10 ≤ 12, so 8 IS valid here.
    const result = snapToColSpan(
      1000,
      6,
      3,
      CONTAINER_WIDTH,
      GAP,
      12,
      COL_SNAPS_12,
    );
    expect(result.colSpan).toBe(8);
  });

  it('col=5 + start=6 + large positive delta → max snap = 8 (NOT 12)', () => {
    // 5 + 8 - 1 = 12 ≤ 12 ✓; 5 + 12 - 1 = 16 > 12 ✗.
    // Fitting snaps = [2,3,4,6,8].
    const result = snapToColSpan(
      1000,
      6,
      5,
      CONTAINER_WIDTH,
      GAP,
      12,
      COL_SNAPS_12,
    );
    expect(result.colSpan).toBe(8);
  });

  it('col=7 + start=6 + large positive delta → max snap = 6 (NOT 8 or 12)', () => {
    // 7 + 6 - 1 = 12 ≤ 12 ✓; 7 + 8 - 1 = 14 > 12 ✗.
    // Fitting snaps from [2,3,4,6,8,12] = [2,3,4,6].
    const result = snapToColSpan(
      1000,
      6,
      7,
      CONTAINER_WIDTH,
      GAP,
      12,
      COL_SNAPS_12,
    );
    expect(result.colSpan).toBe(6);
  });

  it('col=11 + start=2 + large positive delta → max snap = 2 (only 2 fits)', () => {
    // 11 + 2 - 1 = 12 ≤ 12 ✓; 11 + 3 - 1 = 13 > 12 ✗.
    // Fitting snaps from [2,3,4,6,8,12] = [2].
    const result = snapToColSpan(
      1000,
      2,
      11,
      CONTAINER_WIDTH,
      GAP,
      12,
      COL_SNAPS_12,
    );
    expect(result.colSpan).toBe(2);
  });

  it('col=12 + start=2 → no snap fits → returns startColSpan as no-op', () => {
    // 12 + 2 - 1 = 13 > 12 — even smallest snap=2 overflows.
    // Per R1 F2: fall back to startColSpan as a no-op (user must
    // drag-move leftward first).
    const result = snapToColSpan(
      0,
      2,
      12,
      CONTAINER_WIDTH,
      GAP,
      12,
      COL_SNAPS_12,
    );
    expect(result.colSpan).toBe(2);
  });

  it('col=12 + start=2 + positive delta → still returns startColSpan (no overflow possible)', () => {
    const result = snapToColSpan(
      1000,
      2,
      12,
      CONTAINER_WIDTH,
      GAP,
      12,
      COL_SNAPS_12,
    );
    expect(result.colSpan).toBe(2);
  });

  it('col=4 + start=8 + zero delta → keeps start=8 (8 fits at col=4: 4+8-1=11)', () => {
    const result = snapToColSpan(
      0,
      8,
      4,
      CONTAINER_WIDTH,
      GAP,
      12,
      COL_SNAPS_12,
    );
    expect(result.colSpan).toBe(8);
  });

  it('6-col viewport: col=4 + start=3 + positive delta → max snap = 3 (NOT 6)', () => {
    // 6-col viewport, snaps = [2,3,6]; 4+6-1=9>6 ✗; 4+3-1=6 ≤ 6 ✓.
    const containerWidth = 600;
    const result = snapToColSpan(
      1000,
      3,
      4,
      containerWidth,
      GAP,
      6,
      COL_SNAPS_6,
    );
    expect(result.colSpan).toBe(3);
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

/**
 * R1 F3 fix (2026-05-09) — `buildResizeNextAttrs` axis-aware attr
 * diff contract. The right-only axis MUST NEVER touch rowSpan
 * (would destroy `'auto'` on prose blocks); bottom-only MUST NEVER
 * touch colSpan; corner writes both. Per ADR-0017 D9 + cf-20d D1
 * commit-on-release.
 */
describe('buildResizeNextAttrs — R1 F3 axis-aware attr diff', () => {
  it("right + colChanged → writes colSpan only (preserves rowSpan='auto' on prose)", () => {
    const diff = buildResizeNextAttrs('right', 6, 99, true, false);
    expect(diff).toEqual({ colSpan: 6 });
    expect(diff).not.toHaveProperty('rowSpan');
  });

  it('right + rowChanged + colChanged → STILL writes colSpan only (axis filter)', () => {
    // Defense-in-depth: even if the snap math somehow detected a
    // rowSpan change (it shouldn't, since right-only doesn't
    // compute rowSpan), the helper must still NOT write rowSpan.
    const diff = buildResizeNextAttrs('right', 6, 5, true, true);
    expect(diff).toEqual({ colSpan: 6 });
    expect(diff).not.toHaveProperty('rowSpan');
  });

  it('right + nothing changed → empty diff', () => {
    const diff = buildResizeNextAttrs('right', 12, 1, false, false);
    expect(diff).toEqual({});
  });

  it('bottom + rowChanged → writes rowSpan only (NEVER colSpan)', () => {
    const diff = buildResizeNextAttrs('bottom', 99, 4, false, true);
    expect(diff).toEqual({ rowSpan: 4 });
    expect(diff).not.toHaveProperty('colSpan');
  });

  it('bottom + colChanged + rowChanged → STILL writes rowSpan only', () => {
    const diff = buildResizeNextAttrs('bottom', 6, 4, true, true);
    expect(diff).toEqual({ rowSpan: 4 });
    expect(diff).not.toHaveProperty('colSpan');
  });

  it('corner + both changed → writes BOTH colSpan AND rowSpan', () => {
    const diff = buildResizeNextAttrs('corner', 6, 4, true, true);
    expect(diff).toEqual({ colSpan: 6, rowSpan: 4 });
  });

  it('corner + colChanged only → writes colSpan only', () => {
    const diff = buildResizeNextAttrs('corner', 6, 1, true, false);
    expect(diff).toEqual({ colSpan: 6 });
  });

  it('corner + rowChanged only → writes rowSpan only', () => {
    const diff = buildResizeNextAttrs('corner', 12, 4, false, true);
    expect(diff).toEqual({ rowSpan: 4 });
  });

  it('corner + nothing changed → empty diff', () => {
    const diff = buildResizeNextAttrs('corner', 12, 1, false, false);
    expect(diff).toEqual({});
  });

  it('right-only commit on prose: snapshot rowSpan=auto preservation flow', () => {
    // Simulates the F3 prose preservation contract: prose block
    // started with rowSpan='auto', user dragged right handle. The
    // snapshot's startRowSpanInt was derived from rendered height
    // (e.g. 3); the snap computed nextRowSpan=3 (no row change);
    // the colChanged=true triggers commit with axis='right'. The
    // helper output must NOT contain rowSpan so spread into
    // node.attrs leaves the original 'auto' intact.
    const originalAttrs = {
      col: 1,
      colSpan: 12,
      rowSpan: 'auto' as const,
      variant: 'note',
    };
    const diff = buildResizeNextAttrs('right', 6, 3, true, false);
    const merged = { ...originalAttrs, ...diff };
    expect(merged.rowSpan).toBe('auto'); // PRESERVED, not overwritten with 3
    expect(merged.colSpan).toBe(6); // updated
  });
});

