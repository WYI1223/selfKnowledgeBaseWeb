import {
  ColRuler,
  DropPulse,
  RowLadder,
  SizeTooltip,
  colSpanToFraction,
} from '@skb/editor-shell';

/**
 * @apps/site EditorShellOverlays — overlay surface helpers extracted
 * from EditorShellMount.tsx.
 *
 * Wave 6 cf-20d (2026-05-09) — extraction motivated by the cf-20d
 * size-check landing EditorShellMount.tsx at 579 lines (over the
 * 500-line hard limit). The overlays are presentational helpers with
 * NO state of their own; pulling them into a sibling file keeps the
 * mount file focused on the lifecycle/state wiring (ApiAdapter chain,
 * pipeline mounts, save flow).
 *
 * Two helpers:
 *   - <DropPulseAtRect rect onAnimationEnd /> — fixed-position
 *     wrapper at a viewport rect, mounting the cf-20c-2 <DropPulse>.
 *     Reused by both drag-commit and cf-20d resize-commit success
 *     pulses (same dropEpoch infrastructure per cf-20c-2 R3
 *     reflection rule).
 *   - <ResizeOverlays axis cursor snapColSpan snapRowSpan sourceRect
 *     totalCols activeColSnaps /> — composes <ColRuler> +
 *     <SizeTooltip> + <RowLadder> per cf-20d ADR-0017 D9 axis-
 *     specific overlay visibility rules.
 *
 * Both consume `@skb/editor-shell`'s public surface only — no
 * internal-only imports — so this file is structurally a thin
 * presentational layer over the editor-shell package.
 */

/**
 * Wave 6 cf-20c-2 R1 F2 helper — render a <DropPulse> at a fixed
 * viewport rect (the landed block's bounding rect re-measured by
 * the pipeline post-mutation). Needed because DropPulse uses
 * `position: absolute; inset: 0` which expects a positioned parent;
 * the simplest way to give it one without mounting inside ProseMirror
 * is a `position: fixed` wrapper at the rect coordinates.
 *
 * Wave 6 cf-20c-2 R2 F2 (2026-05-09) — the rect now comes from
 * `pipeline.state.lastDroppedRect` (post-drop landed position),
 * NOT `pipeline.state.blockRects.get(lastDroppedBlockId)` (pre-drag
 * snapshot). See ADR-0017 D11 line 344.
 *
 * Wave 6 cf-20d (2026-05-09) — also consumed by resize-commit via
 * `pipeline.setLastDroppedFromExternal(blockId, rect)`. The wrapper
 * is the SAME element used by drag-commit; the cf-20c-2 R3 dropEpoch
 * key on the parent React tree ensures clean remounts across rapid
 * mixed drag+resize commit sequences.
 */
export function DropPulseAtRect({
  rect,
  onAnimationEnd,
}: {
  rect: DOMRectReadOnly;
  onAnimationEnd: () => void;
}) {
  return (
    <div
      data-skb-drop-pulse-anchor
      style={{
        position: 'fixed',
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <DropPulse onAnimationEnd={onAnimationEnd} />
    </div>
  );
}

/**
 * Wave 6 cf-20d (2026-05-09) — resize overlay surface composed from
 * the existing <ColRuler> + <SizeTooltip> + <RowLadder> primitives.
 *
 * Mounting rules (per ADR-0017 D9 + cf-20d D2 axis-specific overlay
 * visibility):
 *   - <ColRuler>    rendered for ALL active resize axes (right /
 *                   bottom / corner). For bottom-only axis the ruler
 *                   shows current colSpan as the active stop (no
 *                   hover state because the cursor isn't snapping to
 *                   col stops on bottom-axis resize).
 *   - <SizeTooltip> rendered for ALL axes; fraction text is the
 *                   active colSpan; rowSpan integer appended for
 *                   bottom + corner.
 *   - <RowLadder>   rendered ONLY for bottom + corner axes.
 *
 * The col-ruler is positioned absolutely above the .ProseMirror grid
 * via the ColRuler's own `position: absolute; top: 0` styles. It
 * needs a positioned parent — we use a `position: fixed` wrapper
 * anchored to the source block's top edge (matching the visual
 * intent of "ruler floats above the block being resized").
 */
export function ResizeOverlays({
  axis,
  cursor,
  snapColSpan,
  snapRowSpan,
  sourceRect,
  totalCols,
  activeColSnaps,
}: {
  axis: 'right' | 'bottom' | 'corner' | null;
  cursor: { x: number; y: number } | null;
  snapColSpan: number | null;
  snapRowSpan: number | null;
  sourceRect: DOMRectReadOnly | null;
  totalCols: number;
  activeColSnaps: readonly number[];
}) {
  if (!axis || !sourceRect) return null;

  const showRowLadder = axis === 'bottom' || axis === 'corner';
  const fraction =
    snapColSpan !== null ? safeFraction(snapColSpan, totalCols) : '';
  const tooltipRowSpan =
    showRowLadder && snapRowSpan !== null ? snapRowSpan : undefined;

  // Derive a reasonable ladder rowCount: max of 8 and the current
  // snap so the user always has rungs above the current snap to
  // visually grow into.
  const ladderRowCount = Math.max(8, snapRowSpan ?? 1);

  return (
    <>
      <div
        data-skb-resize-col-ruler-anchor
        style={{
          position: 'fixed',
          left: sourceRect.left,
          top: sourceRect.top - 22,
          width: sourceRect.width,
          height: 14,
          pointerEvents: 'none',
          zIndex: 50,
        }}
      >
        <ColRuler
          activeStops={activeColSnaps}
          hoveredStop={snapColSpan}
          totalCols={totalCols}
        />
      </div>
      {cursor && (
        <SizeTooltip
          cursorX={cursor.x}
          cursorY={cursor.y}
          fraction={fraction}
          rowSpan={tooltipRowSpan}
        />
      )}
      {showRowLadder && (
        <RowLadder
          rowCount={ladderRowCount}
          activeRow={snapRowSpan}
          blockRect={sourceRect}
          rowH={48}
          gap={14}
        />
      )}
    </>
  );
}

/**
 * Defensive wrapper around `colSpanToFraction`. The exact
 * (colSpan, totalCols) pair may be unsupported (e.g. an undefined
 * snap during the initial pointermove tick before snap math
 * converges); fall back to a numeric "N/12" string so the tooltip
 * still renders something legible.
 */
function safeFraction(colSpan: number, totalCols: number): string {
  try {
    return colSpanToFraction(colSpan, totalCols);
  } catch {
    return `${colSpan}/${totalCols}`;
  }
}
