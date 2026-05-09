/**
 * @skb/editor-shell keyboard-step — pure arrow-key delta math.
 *
 * Wave 6 cf-22 (2026-05-09) — pure helpers consumed by the cf-22
 * keyboard-mode lifecycle in `use-drag-drop-pipeline.ts` +
 * `use-resize-pipeline.ts`. No React, no DOM — fully unit-testable
 * from vitest.
 *
 * Per cf-22 D2 decision (snap-step for resize, 1-cell for drag):
 *   - Resize Arrow ±1 = next valid `effectiveColSnaps` member
 *     (NOT 1 col which would land on invalid spans like colSpan=5).
 *   - Drag Arrow ±1 = next grid cell (the smallest grid unit; col
 *     index is 1-based int).
 *   - Resize bottom/corner Arrow ±1 = next integer rowSpan (≥ 1).
 */

/**
 * Compute the next valid colSpan for a keyboard-resize arrow press.
 *
 * @param currentColSpan The block's current colSpan (must already be
 *                       a valid snap; callers source from
 *                       `node.attrs.colSpan` or the pipeline's
 *                       snapshot).
 * @param direction      'left' (shrink) or 'right' (grow).
 * @param activeColSnaps The valid snap set for the current viewport
 *                       (per `effectiveColSnaps(viewportCols)` from
 *                       block-foundation). Caller may pass a filtered
 *                       subset (e.g. cf-20d R1 F2 overflow-filtered)
 *                       — this helper just consumes the snap set
 *                       it's given.
 * @returns              The next snap immediately smaller (`left`)
 *                       or larger (`right`) than `currentColSpan`.
 *                       If the current colSpan is already at the
 *                       boundary (smallest snap for `left`, largest
 *                       for `right`), returns the unchanged value
 *                       (clamp-at-boundary semantics — keyboard
 *                       arrow doesn't wrap around).
 */
export function keyboardSnapStep(
  currentColSpan: number,
  direction: 'left' | 'right',
  activeColSnaps: readonly number[],
): number {
  if (activeColSnaps.length === 0) return currentColSpan;

  // Sort defensively in case caller's snap set isn't ordered.
  const sortedSnaps = [...activeColSnaps].sort((a, b) => a - b);

  if (direction === 'right') {
    // Find smallest snap STRICTLY greater than currentColSpan.
    for (const snap of sortedSnaps) {
      if (snap > currentColSpan) return snap;
    }
    // No larger snap exists → clamp at largest.
    return sortedSnaps[sortedSnaps.length - 1] ?? currentColSpan;
  }

  // direction === 'left': find largest snap STRICTLY smaller.
  let bestLeft = sortedSnaps[0];
  for (const snap of sortedSnaps) {
    if (snap >= currentColSpan) break;
    bestLeft = snap;
  }
  return bestLeft ?? currentColSpan;
}

/**
 * Compute the next valid col for a keyboard-drag arrow press.
 *
 * @param currentCol  Block's current col (1-based int).
 * @param direction   'left' or 'right' for ±1 col movement.
 * @param totalCols   Grid totalCols (12 desktop / 6 tablet / 1 mobile
 *                    per ADR-0016 D5).
 * @param colSpan     Block's colSpan (used for the right-clamp:
 *                    the new col + colSpan - 1 MUST NOT exceed
 *                    totalCols; equivalently new col ≤ totalCols -
 *                    colSpan + 1).
 * @returns           The next col (clamped at [1, totalCols -
 *                    colSpan + 1]). At the boundary, returns the
 *                    unchanged value.
 */
export function keyboardGridStep(
  currentCol: number,
  direction: 'left' | 'right',
  totalCols: number,
  colSpan: number,
): number {
  const maxCol = Math.max(1, totalCols - colSpan + 1);
  if (direction === 'right') {
    return Math.min(maxCol, currentCol + 1);
  }
  // direction === 'left'
  return Math.max(1, currentCol - 1);
}

/**
 * Compute the next valid rowSpan for a keyboard-resize bottom/corner
 * arrow press. RowSpan is an integer ≥ 1 (no snap set; ADR-0016 D6
 * Q4 only constrains colSpan to COL_SNAPS).
 *
 * @param currentRowSpan The block's current integer rowSpan.
 * @param direction      'up' (shrink) or 'down' (grow).
 * @returns              currentRowSpan ± 1, clamped at ≥ 1.
 */
export function keyboardRowStep(
  currentRowSpan: number,
  direction: 'up' | 'down',
): number {
  if (direction === 'down') {
    return currentRowSpan + 1;
  }
  // direction === 'up'
  return Math.max(1, currentRowSpan - 1);
}
