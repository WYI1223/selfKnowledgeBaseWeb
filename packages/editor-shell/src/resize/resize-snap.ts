/**
 * @skb/editor-shell resize-snap — pure cursor-delta → snap-target math.
 *
 * Wave 6 cf-20d (2026-05-09) — pure helpers consumed by
 * `use-resize-pipeline.ts` to convert raw pointer deltas into the
 * snap targets defined by ADR-0016 D6 (`COL_SNAPS = [2, 3, 4, 6, 8,
 * 12]` + `effectiveColSnaps(viewportCols)` mapping). No React, no
 * DOM lookups — fully unit-testable from vitest.
 *
 * Snap policy decision (per cf-20d D6): **round-to-nearest-snap**
 * (NOT round-up). The ADR-0016 D6 Q4 default tiebreak was round-up
 * for keyboard step-up; for cursor-driven resize the v2 demo uses
 * round-to-nearest (cursor falling between 1/3 and 1/2 stops takes
 * whichever snap is closer in absolute distance). Ties (cursor
 * exactly midway) round UP to honor the ADR-0016 D6 Q4 default
 * tiebreak when explicit symmetry breaks.
 *
 * Width formula (mirrors `block-foundation/src/grid-math.ts`
 * `effectiveColWidth`):
 *   one-frac = (containerWidth - (totalCols - 1) * gap) / totalCols
 *   colSpanCSSWidth = colSpan * one-frac + (colSpan - 1) * gap
 * Pre-snap rawColSpan inverse (each additional col adds one frac +
 * one gap to the visible width — the row's interior gaps multiply
 * one-for-one with colSpan growth past the starting span):
 *   For a delta `dx` (positive = grow rightward):
 *     extraColSpan = dx / (one-frac + gap)
 *     rawColSpan   = startColSpan + extraColSpan
 *   At dx = 0, extraColSpan = 0 → rawColSpan = startColSpan ✓.
 *   At dx = oneFrac + gap, rawColSpan = startColSpan + 1 ✓.
 *
 * Height formula (mirrors `effectiveCellHeight`):
 *   height = rowSpan * row-h + (rowSpan - 1) * gap
 * Pre-snap rawRowSpan inverse:
 *   extraRowSpan = dy / (row-h + gap)
 *   rawRowSpan   = startRowSpan + extraRowSpan
 *
 * NOTE on units: the right-edge handle is at `right: -7px` from the
 * gblock body per v2-styles.css:268. The cursor-delta `dx` is taken
 * RELATIVE to the pointerdown clientX — the v2 negative offset is
 * absorbed because both pointerdown and pointermove come from the
 * same coordinate space (window clientX/clientY).
 */

/**
 * Compute the snapped colSpan for a right-edge resize at the given
 * cursor delta.
 *
 * @param cursorDeltaX  Pointer X displacement from the pointerdown
 *                      origin (positive = rightward = grow). In CSS
 *                      pixels (clientX delta).
 * @param startColSpan  The block's colSpan at pointerdown.
 * @param containerWidth The grid container's content width in CSS
 *                      pixels (one row of the 12-col grid).
 * @param gap           The grid gap in CSS pixels (matches CSS
 *                      `gap` property). Per
 *                      `DEFAULT_GRID_GEOMETRY.gap = 14` at cf-20d.
 * @param totalCols     The grid total columns (typically 12; mobile
 *                      collapses to 1 — caller handles mobile by
 *                      not invoking resize at all).
 * @param activeSnaps   The set of valid snap targets (per
 *                      `effectiveColSnaps(viewportCols)` from
 *                      block-foundation).
 * @returns             The snapped colSpan + the cursor's "raw"
 *                      (pre-snap) colSpan as a fraction (used by
 *                      <SizeTooltip> for live cursor feedback).
 */
export function snapToColSpan(
  cursorDeltaX: number,
  startColSpan: number,
  containerWidth: number,
  gap: number,
  totalCols: number,
  activeSnaps: readonly number[],
): { readonly colSpan: number; readonly rawColSpan: number } {
  if (activeSnaps.length === 0) {
    return { colSpan: startColSpan, rawColSpan: startColSpan };
  }

  // Width per 1-col slot at the current container width.
  const oneFrac = (containerWidth - (totalCols - 1) * gap) / totalCols;

  // Avoid division by zero when the container hasn't measured (test
  // mounts before layout).
  if (oneFrac <= 0) {
    return { colSpan: startColSpan, rawColSpan: startColSpan };
  }

  // Pre-snap raw colSpan = startColSpan + dx / (oneFrac + gap).
  // At dx=0 → rawColSpan = startColSpan (zero-delta no-op). At
  // dx=(oneFrac + gap) → rawColSpan = startColSpan + 1 (one extra
  // col mapped to one frac + one interior gap).
  const rawColSpan = startColSpan + cursorDeltaX / (oneFrac + gap);

  // Round-to-nearest-snap with round-up tiebreak (D6 Q4 default).
  let bestSnap = activeSnaps[0]!;
  let bestDistance = Math.abs(rawColSpan - bestSnap);
  for (let i = 1; i < activeSnaps.length; i += 1) {
    const snap = activeSnaps[i]!;
    const distance = Math.abs(rawColSpan - snap);
    if (
      distance < bestDistance ||
      // Round-up tie-break: when `distance === bestDistance` AND the
      // new snap is larger, prefer the larger snap.
      (distance === bestDistance && snap > bestSnap)
    ) {
      bestDistance = distance;
      bestSnap = snap;
    }
  }

  // Clamp to [1, totalCols] defensive guard (shouldn't trigger when
  // activeSnaps is well-formed per `effectiveColSnaps`).
  const clamped = Math.max(1, Math.min(totalCols, bestSnap));

  return { colSpan: clamped, rawColSpan };
}

/**
 * Compute the snapped rowSpan for a bottom-edge resize at the given
 * cursor delta.
 *
 * @param cursorDeltaY  Pointer Y displacement from the pointerdown
 *                      origin (positive = downward = grow).
 * @param startRowSpan  The block's rowSpan at pointerdown. Caller
 *                      MUST resolve `'auto'` to its current integer
 *                      via `useAutoRowSpan` before invoking this
 *                      helper (resize commits an integer rowSpan
 *                      regardless of starting `'auto'` semantic per
 *                      ADR-0017 D9).
 * @param rowH          Grid `--row-h` in CSS pixels. Per
 *                      `DEFAULT_GRID_GEOMETRY.rowH = 48`.
 * @param gap           Grid gap in CSS pixels.
 * @returns             The snapped integer rowSpan (≥ 1).
 */
export function snapToRowSpan(
  cursorDeltaY: number,
  startRowSpan: number,
  rowH: number,
  gap: number,
): number {
  if (rowH <= 0) {
    return Math.max(1, startRowSpan);
  }

  // Each additional row adds one gap + one row-h to the visible
  // height (mirrors `effectiveCellHeight = rowSpan*rowH + (rowSpan-1)*gap`).
  // At dy=0 → rawRowSpan = startRowSpan (no-op).
  const rawRowSpan = startRowSpan + cursorDeltaY / (rowH + gap);

  // Round-to-nearest with round-up tiebreak (the .5 case takes the
  // ceiling per ADR-0016 D6 Q4 default).
  const fractional = rawRowSpan - Math.floor(rawRowSpan);
  const rounded =
    fractional < 0.5 ? Math.floor(rawRowSpan) : Math.ceil(rawRowSpan);

  return Math.max(1, rounded);
}
