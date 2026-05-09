/**
 * @skb/editor-shell normalizeOverflowPosition unit tests (Wave 6 cf-20d R3 F1).
 *
 * Extracted from resize-snap.test.ts at R3 to keep both files under
 * the 500-line size-check hard limit.
 *
 * R3 F1 fix (2026-05-09) — `normalizeOverflowPosition` atomic
 * {col, colSpan} normalization for persisted-overflow recovery.
 *
 * R2 F2 only normalized colSpan (assumed col itself was always
 * valid). R3 F1 caught the broader case: persisted state can ALSO
 * have `col > totalCols` (block saved at desktop with col=7
 * reloaded at tablet totalCols=6). R2's `normalizedColSpan = max(1,
 * 6-7+1) = 1` left col=7 untouched AND violated COL_SNAPS.
 *
 * R3 contract:
 *   1. Detect overflow: `col > totalCols` OR `col + colSpan - 1 > totalCols`.
 *   2. Left-clamp col into [1, totalCols] (per D10 R3 amendment —
 *      preserves the largest fitting colSpan on the new viewport).
 *   3. Pick largest activeColSnap ≤ (totalCols - clampedCol + 1);
 *      fall back to 1 if no snap fits (mobile [1] case).
 *   4. Return `{col, colSpan}` pair if normalization happened, else
 *      null (caller skips overflow-recovery branch).
 *
 * Coverage matrix per F1 dispatch operational rule "test fixtures
 * must include cases where each field independently triggers the
 * violation":
 *   - colSpan-only overflow (R2's covered case; verify still works)
 *   - col-only overflow (R3's NEW case)
 *   - both col + colSpan overflow
 *   - mobile (totalCols=1, activeSnaps=[1])
 *   - exact-edge non-overflow (returns null)
 *   - clearly-valid non-overflow (returns null)
 */
import { describe, expect, it } from 'vitest';
import { normalizeOverflowPosition } from '../../resize/resize-snap';

describe('normalizeOverflowPosition — R3 F1 atomic {col, colSpan} normalization', () => {
  const COL_SNAPS_12 = [2, 3, 4, 6, 8, 12] as const;
  const COL_SNAPS_6 = [2, 3, 6] as const;
  const COL_SNAPS_1 = [1] as const;

  it('returns null for valid persisted state (no overflow at desktop)', () => {
    expect(
      normalizeOverflowPosition(1, 12, 12, COL_SNAPS_12),
    ).toBeNull();
    expect(
      normalizeOverflowPosition(7, 6, 12, COL_SNAPS_12),
    ).toBeNull();
    // Exact-edge: col + colSpan - 1 === totalCols (boundary valid).
    expect(
      normalizeOverflowPosition(7, 6, 12, COL_SNAPS_12),
    ).toBeNull();
  });

  it('R2 case: colSpan-only overflow (col valid, colSpan too big) → normalize colSpan, keep col', () => {
    // col=4 + colSpan=6 at totalCols=6 → 4+6-1=9>6 overflow.
    // Left-clamp col=4 (already valid); maxFit = 6-4+1 = 3;
    // largest snap in [2,3,6] ≤ 3 is 3. Result: {col=4, colSpan=3}.
    expect(
      normalizeOverflowPosition(4, 6, 6, COL_SNAPS_6),
    ).toEqual({ col: 4, colSpan: 3 });
  });

  it('R3 NEW case: col-only overflow (col > totalCols, colSpan would be valid) → left-clamp col + pick largest fitting snap', () => {
    // col=7 + colSpan=6 at desktop (12) is valid (7+6-1=12);
    // reload at tablet (6): col=7 > 6 OVERFLOWS.
    // Left-clamp col=6 (was 7); maxFit = 6-6+1 = 1; no snap ≤ 1
    // in [2,3,6] → fallback to 1. Result: {col=6, colSpan=1}.
    expect(
      normalizeOverflowPosition(7, 6, 6, COL_SNAPS_6),
    ).toEqual({ col: 6, colSpan: 1 });
  });

  it('R3 NEW case: col-overflow with room — clamps col to totalCols, picks largest snap ≤ maxFit', () => {
    // col=10 + colSpan=2 at totalCols=6 → col=10 OVERFLOWS.
    // Left-clamp col=6; maxFit = 6-6+1 = 1; fallback colSpan=1.
    expect(
      normalizeOverflowPosition(10, 2, 6, COL_SNAPS_6),
    ).toEqual({ col: 6, colSpan: 1 });
  });

  it('R3 NEW case: col=2 stays at 2 (not clamped), large colSpan triggers shrink', () => {
    // col=2 + colSpan=8 at totalCols=6 → 2+8-1=9>6 overflow.
    // col=2 valid (≤ 6); maxFit = 6-2+1 = 5; largest snap in
    // [2,3,6] ≤ 5 is 3. Result: {col=2, colSpan=3}.
    expect(
      normalizeOverflowPosition(2, 8, 6, COL_SNAPS_6),
    ).toEqual({ col: 2, colSpan: 3 });
  });

  it('R3 NEW case: col below 1 (e.g. 0 or negative) clamps UP to 1', () => {
    // Defensive: col=0 should never persist but test the clamp.
    // Left-clamp col=max(1, 0) = 1; maxFit = 6-1+1 = 6; largest
    // snap ≤ 6 in [2,3,6] = 6.
    expect(
      normalizeOverflowPosition(0, 12, 6, COL_SNAPS_6),
    ).toEqual({ col: 1, colSpan: 6 });
  });

  it('mobile viewport (totalCols=1, activeSnaps=[1]): any overflow → {col=1, colSpan=1}', () => {
    // Block saved at desktop col=4 colSpan=6 → reload at mobile
    // totalCols=1. col=4>1 overflow; left-clamp col=1; maxFit=1;
    // activeSnaps=[1] picks 1. Result: {col=1, colSpan=1}.
    expect(
      normalizeOverflowPosition(4, 6, 1, COL_SNAPS_1),
    ).toEqual({ col: 1, colSpan: 1 });
    // col=1 colSpan=12 → reload at mobile: 1+12-1=12>1 overflow.
    // col=1 valid; maxFit=1; activeSnaps=[1] picks 1.
    expect(
      normalizeOverflowPosition(1, 12, 1, COL_SNAPS_1),
    ).toEqual({ col: 1, colSpan: 1 });
  });

  it('R3 NEW case: 12-col viewport with col=10 colSpan=4 → 10+4-1=13>12 → normalize', () => {
    // col=10 valid (≤12); maxFit = 12-10+1 = 3; largest snap in
    // [2,3,4,6,8,12] ≤ 3 is 3. Result: {col=10, colSpan=3}.
    expect(
      normalizeOverflowPosition(10, 4, 12, COL_SNAPS_12),
    ).toEqual({ col: 10, colSpan: 3 });
  });

  it('R3 NEW case: very-far-right col=100 at tablet → clamps to maxFit=1', () => {
    // col=100 way over; clamps to col=6 (totalCols=6); maxFit=1;
    // fallback colSpan=1.
    expect(
      normalizeOverflowPosition(100, 12, 6, COL_SNAPS_6),
    ).toEqual({ col: 6, colSpan: 1 });
  });

  it('R3 NEW case: col=12 (right edge of desktop) at tablet → left-clamp col=6 + colSpan=1', () => {
    // col=12 colSpan=2 valid at desktop (12+2-1=13>12... actually
    // INVALID at desktop too — but test the tablet recovery path).
    // At tablet (6): col=12>6 → left-clamp col=6; maxFit=1; colSpan=1.
    expect(
      normalizeOverflowPosition(12, 2, 6, COL_SNAPS_6),
    ).toEqual({ col: 6, colSpan: 1 });
  });

  it('R3 NEW case: empty activeColSnaps falls back to colSpan=1 (defensive)', () => {
    // Should never happen for valid effectiveColSnaps output but
    // defensive guard. col=4 colSpan=6 at totalCols=6 overflow;
    // empty snap set → fallback colSpan=1.
    expect(
      normalizeOverflowPosition(4, 6, 6, []),
    ).toEqual({ col: 4, colSpan: 1 });
  });
});
