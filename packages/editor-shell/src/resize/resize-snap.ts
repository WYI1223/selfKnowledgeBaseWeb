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
 * @param startCol      The block's `col` (1-based) at pointerdown.
 *                      Used to filter the snap set to non-overflowing
 *                      candidates per ADR-0016 D2 grid-position
 *                      invariant `col + colSpan - 1 <= totalCols`.
 *                      (R1 F2 fix — see function body.)
 * @param containerWidth The grid container's content width in CSS
 *                      pixels (one row of the totalCols grid).
 * @param gap           The grid gap in CSS pixels (matches CSS
 *                      `gap` property). Per
 *                      `DEFAULT_GRID_GEOMETRY.gap = 14` at cf-20d.
 * @param totalCols     The grid total columns at the current
 *                      viewport (12 desktop / 6 tablet / 1 mobile
 *                      per ADR-0016 D5). Caller derives via
 *                      `useResponsiveCols`. (R1 F1 fix — was
 *                      hardcoded to 12 pre-R1.)
 * @param activeSnaps   The set of valid snap targets (per
 *                      `effectiveColSnaps(viewportCols)` from
 *                      block-foundation).
 * @returns             The snapped colSpan + the cursor's "raw"
 *                      (pre-snap) colSpan (used by <SizeTooltip> for
 *                      live cursor feedback).
 *
 * Wave 6 cf-20d R1 F2 fix (2026-05-09) — added `startCol` param +
 * overflow-filter on candidate snaps. Pre-R1 the function only
 * clamped to `[1, totalCols]` which let a block at `col=7` snap to
 * `colSpan=8` or `12` — producing `col + colSpan - 1 = 14 > 12`
 * (overflow). The mdx-bridge schema would reject the resulting attr
 * write at save-time; the wire would land an invalid intermediate
 * state. R1 fix: filter `activeSnaps` to those satisfying the
 * grid-position invariant before nearest-snap selection. If the
 * filter empties the set (the start `col` is so far right that no
 * snap fits), fall back to `startColSpan` (no-op resize for that
 * block — user must drag-move first).
 */
export function snapToColSpan(
  cursorDeltaX: number,
  startColSpan: number,
  startCol: number,
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

  // R1 F2 fix: filter snaps to the non-overflowing subset per
  // ADR-0016 D2 grid-position invariant `col + colSpan - 1 <= totalCols`.
  // Equivalently: `snap <= totalCols - startCol + 1`.
  const maxFittingSnap = totalCols - startCol + 1;
  const fittingSnaps = activeSnaps.filter((snap) => snap <= maxFittingSnap);

  if (fittingSnaps.length === 0) {
    // Block is too far right for any valid snap (e.g. col=12 with
    // smallest snap=2 → 12+2-1=13>12 overflow). Fall back to
    // startColSpan as a no-op — the user must drag-move the block
    // leftward first to make room. Returning startColSpan also
    // ensures the no-op-commit guard in the pipeline triggers.
    return { colSpan: startColSpan, rawColSpan };
  }

  // Round-to-nearest-snap with round-up tiebreak (D6 Q4 default).
  let bestSnap = fittingSnaps[0]!;
  let bestDistance = Math.abs(rawColSpan - bestSnap);
  for (let i = 1; i < fittingSnaps.length; i += 1) {
    const snap = fittingSnaps[i]!;
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

/**
 * Wave 6 cf-20d R1 F3 fix (2026-05-09) — pure helper that builds
 * the `setNodeMarkup` next-attrs object given the resize axis +
 * snap deltas. Extracted from `use-resize-pipeline.ts`'s commit
 * branch so the F3 axis-aware contract can be unit-tested without
 * spinning up a Tiptap editor.
 *
 * F3 contract:
 *   - `axis === 'right'`  → write `colSpan` only (NEVER `rowSpan`,
 *     even if rowSpan changed; preserves prose `rowSpan='auto'`).
 *   - `axis === 'bottom'` → write `rowSpan` only (NEVER `colSpan`).
 *   - `axis === 'corner'` → write both `colSpan` AND `rowSpan` (only
 *     for non-prose blocks per ADR-0017 D9 — corner handle hidden
 *     for prose).
 *
 * The "no-op" guard (caller decides whether to dispatch at all) is
 * the responsibility of the consumer; this helper only computes the
 * attr-diff. Returns a plain object suitable for spreading into
 * `{ ...node.attrs, ...buildResizeNextAttrs(...) }`.
 */
export function buildResizeNextAttrs(
  axis: 'right' | 'bottom' | 'corner',
  nextColSpan: number,
  nextRowSpan: number,
  colChanged: boolean,
  rowChanged: boolean,
): Record<string, number> {
  const attrs: Record<string, number> = {};
  // colSpan: always write on right + corner if changed (NEVER on
  // bottom — bottom doesn't touch colSpan dimension).
  if ((axis === 'right' || axis === 'corner') && colChanged) {
    attrs['colSpan'] = nextColSpan;
  }
  // rowSpan: write on bottom + corner if changed (NEVER on right —
  // right doesn't touch rowSpan dimension; preserves 'auto' on prose).
  if ((axis === 'bottom' || axis === 'corner') && rowChanged) {
    attrs['rowSpan'] = nextRowSpan;
  }
  return attrs;
}
