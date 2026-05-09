/**
 * @skb/editor-shell useResizePipeline — resize lifecycle owner.
 *
 * Wave 6 cf-20d (2026-05-09) — composes the existing resize visual
 * primitives (<ColRuler>, <SizeTooltip>, <RowLadder>) + the new
 * pure `resize-snap.ts` math + Tiptap `setNodeMarkup` into the
 * actual interactive resize wire. Mirrors the cf-20c-2
 * `useDragDropPipeline` shape (snapshot at start, mutate at commit,
 * NEVER mid-pointermove per the cf-20c-2 R1 reflection rule).
 *
 * Lifecycle (per ADR-0017 D9 + v2-styles.css commit-on-release model):
 *
 *   resize-start (pointerdown on .gblock-handle.{right|bottom|corner})
 *     ↓
 *     1. Snapshot: { sourceBlockId, axis, startColSpan, startRowSpan,
 *        startRect, containerWidth }
 *     2. Set state.active = true; record cursor origin.
 *     3. Add window-level pointermove + pointerup + pointercancel
 *        listeners (auto-removed on cleanup).
 *
 *   pointermove (window-level)
 *     ↓
 *     1. Compute cursorDeltaX/Y from origin.
 *     2. Resolve snap: snapToColSpan / snapToRowSpan per axis.
 *     3. Update reactive state (cursorX, cursorY, snapColSpan,
 *        snapRowSpan) — drives <ColRuler> stop highlight + <SizeTooltip>
 *        text + <RowLadder> active-rung. NEVER dispatches Tiptap
 *        mutations during pointermove.
 *
 *   pointerup (window-level)
 *     ↓
 *     1. If snap === start values: cancel without mutation (no-op
 *        commit; unchanged-resize is treated as an early bailout).
 *     2. Resolve live PM position via the doc walk (stable ID = pos).
 *     3. Dispatch Tiptap setNodeMarkup with the new attrs (colSpan
 *        for right; rowSpan for bottom; both for corner).
 *     4. Wait 2 rAFs for React commit + browser layout.
 *     5. Re-measure source NodeView at landed position.
 *     6. Invoke `onCommitSuccess(blockId, liveRect)` so the consumer
 *        (EditorShellMount.tsx) can reuse the cf-20c-2 dropEpoch
 *        infrastructure to fire the success-pulse at the new size.
 *     7. Clear all reactive state.
 *
 *   esc-cancel (window keydown)
 *     ↓
 *     Rollback (no Tiptap mutation; per ADR-0017 D8). The pipeline
 *     emits no commit-success callback.
 *
 *   pointercancel (browser-emitted, e.g. user releases over chrome)
 *     ↓
 *     Same as esc-cancel: rollback without mutation.
 *
 * dropEpoch reuse rationale (cf-20d D3 decision; per cf-20c-2 R3
 * reflection "rapid-action animation isolation" canonical pattern):
 *   The cf-20c-2 pipeline owns the success-pulse fields
 *   (lastDroppedBlockId / lastDroppedRect / dropEpoch). cf-20d
 *   resize-commit needs to fire the SAME pulse at the new size.
 *   Two clean designs were considered:
 *     - Option A: extract pulse state into a third sibling hook
 *       `useActionPulse()` consumed by both pipelines + the consumer.
 *     - Option B: cf-20d pipeline accepts an `onCommitSuccess(blockId,
 *       liveRect)` callback as an option; consumer wires it to the
 *       drag pipeline's external setter.
 *   cf-20d ships Option B (simpler; no speculative extraction; the
 *   consumer is already the pulse-mount owner). The drag pipeline
 *   gains a new `setLastDroppedFromExternal(blockId, rect)` method
 *   that wraps the internal setter + dropEpoch increment so resize
 *   commits route through the same canonical "dropped" state.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { liveBlockPositions, snapshotBlocks } from '../drag-drop/pipeline-snapshot';
import {
  buildResizeNextAttrs,
  snapToColSpan,
  snapToRowSpan,
} from './resize-snap';
import type { ResizeAxis } from './resize-context';

export interface PipelineResizeState {
  /** True from pointerdown until commit/cancel/pointercancel. */
  readonly active: boolean;
  /** Source block being resized (set on pointerdown). */
  readonly sourceBlockId: string | null;
  /** Active resize axis (null when no resize is active). */
  readonly axis: ResizeAxis | null;
  /** Cursor position (for <SizeTooltip> following). */
  readonly cursor: { readonly x: number; readonly y: number } | null;
  /** Currently-resolved snap colSpan (right + corner axes; else null). */
  readonly snapColSpan: number | null;
  /** Currently-resolved snap rowSpan (bottom + corner axes; else null). */
  readonly snapRowSpan: number | null;
  /** Bounding rect of the source NodeView at pointerdown. */
  readonly sourceRect: DOMRectReadOnly | null;
}

export interface UseResizePipelineOptions {
  /** The Tiptap editor instance; null until onCreate fires. */
  readonly editor: Editor | null;
  /**
   * Selector for the grid container element. Defaults to '.skb-grid'.
   * Used to read containerWidth for the snap math.
   */
  readonly gridSelector?: string;
  /**
   * Effective columns at the current viewport (12 / 6 / 1). cf-20d
   * uses this to choose `effectiveColSnaps()` from block-foundation;
   * caller derives via `useResponsiveCols`.
   */
  readonly totalCols: number;
  /** Snap targets for the right-edge resize (per `effectiveColSnaps`). */
  readonly activeColSnaps: readonly number[];
  /**
   * Grid `--row-h` in CSS pixels. Defaults to 48 per
   * `DEFAULT_GRID_GEOMETRY.rowH`.
   */
  readonly rowH?: number;
  /** Grid gap in CSS pixels. Defaults to 14. */
  readonly gap?: number;
  /**
   * Invoked on a successful commit (after Tiptap mutation + 2-rAF
   * re-measure). Consumer wires this to the cf-20c-2 drag pipeline's
   * `setLastDroppedFromExternal(blockId, rect)` so the success-pulse
   * fires at the landed size. cf-20c-2 R3 dropEpoch reuse pattern.
   */
  readonly onCommitSuccess?: (
    blockId: string,
    liveRect: DOMRectReadOnly,
  ) => void;
}

export interface UseResizePipelineReturn {
  readonly state: PipelineResizeState;
  /** Bound to <ResizeHandles> via ResizeContext. */
  readonly onResizeStart: (
    blockId: string,
    axis: ResizeAxis,
    origin: { x: number; y: number },
  ) => void;
  /** Cleanup fallback (pointercancel route). */
  readonly onResizeEnd: (origin: { x: number; y: number }) => void;
}

interface ResizeSnapshot {
  readonly blockId: string;
  readonly axis: ResizeAxis;
  /**
   * Block's `col` (1-based) at pointerdown. R1 F2 fix (2026-05-09):
   * snapped at start so the snap function can filter candidates to
   * the non-overflowing subset (`snap <= totalCols - col + 1` per
   * ADR-0016 D2 invariant).
   */
  readonly startCol: number;
  readonly startColSpan: number;
  /**
   * Block's rowSpan attr at pointerdown — preserved as `number |
   * 'auto'`. R1 F3 fix (2026-05-09): pre-R1 the snapshot coerced
   * non-numeric rowSpan to `1`, then the right-only commit wrote
   * `rowSpan: 1` and DESTROYED the `'auto'` attribute (prose blocks
   * stuck at 1 row). R1 fix: preserve the original; right-only
   * commit omits rowSpan from setNodeMarkup; bottom + corner
   * commits write the snapped integer.
   */
  readonly startRowSpanAttr: number | 'auto';
  /**
   * Resolved integer rowSpan at pointerdown — the value used by the
   * snap math + as the baseline for the bottom/corner commit. For
   * `startRowSpanAttr === 'auto'` we derive an integer hint from the
   * source NodeView's measured height (so the snap math sees a
   * realistic starting value).
   */
  readonly startRowSpanInt: number;
  readonly origin: { readonly x: number; readonly y: number };
  readonly containerWidth: number;
  readonly sourceRect: DOMRectReadOnly;
}

const DEFAULT_ROW_H = 48;
const DEFAULT_GAP = 14;

export function useResizePipeline(
  options: UseResizePipelineOptions,
): UseResizePipelineReturn {
  const {
    editor,
    gridSelector = '.skb-grid',
    totalCols,
    activeColSnaps,
    rowH = DEFAULT_ROW_H,
    gap = DEFAULT_GAP,
    onCommitSuccess,
  } = options;

  const [active, setActive] = useState(false);
  const [sourceBlockId, setSourceBlockId] = useState<string | null>(null);
  const [axis, setAxis] = useState<ResizeAxis | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [snapColSpan, setSnapColSpan] = useState<number | null>(null);
  const [snapRowSpan, setSnapRowSpan] = useState<number | null>(null);
  const [sourceRect, setSourceRect] = useState<DOMRectReadOnly | null>(null);

  // Snapshot ref (preserved across renders; mutating doesn't trigger
  // re-render — same pattern as cf-20c-2 use-drag-drop-pipeline.ts).
  const snapshotRef = useRef<ResizeSnapshot | null>(null);

  const resetState = useCallback(() => {
    setActive(false);
    setSourceBlockId(null);
    setAxis(null);
    setCursor(null);
    setSnapColSpan(null);
    setSnapRowSpan(null);
    setSourceRect(null);
    snapshotRef.current = null;
  }, []);

  const onResizeStart = useCallback(
    (
      blockId: string,
      nextAxis: ResizeAxis,
      origin: { x: number; y: number },
    ) => {
      if (!editor) return;
      const blocks = snapshotBlocks(editor);
      const target = blocks.find((b) => b.id === blockId);
      if (!target) return;

      // Source NodeView bounding rect — used as the resize-start
      // anchor + later for the success-pulse landed-rect
      // re-measurement.
      const livePositions = liveBlockPositions(editor, blocks);
      const live = livePositions.get(blockId);
      if (!live) return;
      const dom = editor.view.nodeDOM(live.pos);
      if (!(dom instanceof HTMLElement)) return;
      const startRect = dom.getBoundingClientRect();

      // Container width for the colSpan snap math.
      const grid = document.querySelector(gridSelector);
      const containerWidth =
        grid instanceof HTMLElement
          ? grid.getBoundingClientRect().width
          : startRect.width;

      // R1 F3 fix: preserve the original rowSpan attr (could be
      // 'auto') for the commit-path axis-aware decision below. The
      // snap math operates on an integer; for 'auto' we derive a
      // hint from the measured DOM height (effectiveCellHeight
      // inverse: rowSpan ≈ (height + gap) / (rowH + gap)).
      const startRowSpanAttr: number | 'auto' = target.rowSpan;
      let startRowSpanInt: number;
      if (typeof startRowSpanAttr === 'number' && startRowSpanAttr >= 1) {
        startRowSpanInt = startRowSpanAttr;
      } else {
        // 'auto' (or invalid): derive integer hint from rendered height.
        const measuredHeight = startRect.height;
        if (rowH > 0 && measuredHeight > 0) {
          startRowSpanInt = Math.max(
            1,
            Math.round((measuredHeight + gap) / (rowH + gap)),
          );
        } else {
          startRowSpanInt = 1;
        }
      }

      const snapshot: ResizeSnapshot = {
        blockId,
        axis: nextAxis,
        startCol: target.col,
        startColSpan: target.colSpan,
        startRowSpanAttr,
        startRowSpanInt,
        origin,
        containerWidth,
        sourceRect: startRect,
      };
      snapshotRef.current = snapshot;

      setActive(true);
      setSourceBlockId(blockId);
      setAxis(nextAxis);
      setCursor({ x: origin.x, y: origin.y });
      setSnapColSpan(target.colSpan);
      setSnapRowSpan(startRowSpanInt);
      setSourceRect(startRect);
    },
    [editor, gridSelector, gap, rowH],
  );

  const onResizeEnd = useCallback(() => {
    // Cleanup-only fallback for pointercancel (rare browser-emitted
    // event). The window-level pointerup handler below is the primary
    // commit path. If active=true here, treat as cancel (no mutation).
    if (active) {
      resetState();
    }
  }, [active, resetState]);

  // Window-level pointermove / pointerup / pointercancel listeners.
  // Attached when active=true.
  useEffect(() => {
    if (!active) return;

    const handlePointerMove = (event: PointerEvent): void => {
      const snapshot = snapshotRef.current;
      if (!snapshot) return;

      const dx = event.clientX - snapshot.origin.x;
      const dy = event.clientY - snapshot.origin.y;

      setCursor({ x: event.clientX, y: event.clientY });

      // Snap math depends on axis. R1 F2 fix: pass startCol so
      // snapToColSpan can filter overflowing snaps.
      if (snapshot.axis === 'right' || snapshot.axis === 'corner') {
        const result = snapToColSpan(
          dx,
          snapshot.startColSpan,
          snapshot.startCol,
          snapshot.containerWidth,
          gap,
          totalCols,
          activeColSnaps,
        );
        setSnapColSpan(result.colSpan);
      }
      if (snapshot.axis === 'bottom' || snapshot.axis === 'corner') {
        const newRowSpan = snapToRowSpan(
          dy,
          snapshot.startRowSpanInt,
          rowH,
          gap,
        );
        setSnapRowSpan(newRowSpan);
      }
    };

    const handlePointerUp = (event: PointerEvent): void => {
      const snapshot = snapshotRef.current;
      if (!snapshot || !editor) {
        resetState();
        return;
      }

      const dx = event.clientX - snapshot.origin.x;
      const dy = event.clientY - snapshot.origin.y;

      // Resolve the final snap targets for this commit.
      // R1 F2 fix: pass startCol to snapToColSpan so the snap-set
      // filter rejects overflowing snaps before committing.
      let nextColSpan = snapshot.startColSpan;
      let nextRowSpan = snapshot.startRowSpanInt;
      if (snapshot.axis === 'right' || snapshot.axis === 'corner') {
        nextColSpan = snapToColSpan(
          dx,
          snapshot.startColSpan,
          snapshot.startCol,
          snapshot.containerWidth,
          gap,
          totalCols,
          activeColSnaps,
        ).colSpan;
      }
      if (snapshot.axis === 'bottom' || snapshot.axis === 'corner') {
        nextRowSpan = snapToRowSpan(
          dy,
          snapshot.startRowSpanInt,
          rowH,
          gap,
        );
      }

      const colChanged = nextColSpan !== snapshot.startColSpan;
      const rowChanged = nextRowSpan !== snapshot.startRowSpanInt;
      // R1 F3 fix: only the bottom + corner axes can change rowSpan;
      // a right-only resize must NEVER write rowSpan (would destroy
      // 'auto' on prose blocks).
      const writeRowSpan =
        rowChanged &&
        (snapshot.axis === 'bottom' || snapshot.axis === 'corner');

      if (!colChanged && !writeRowSpan) {
        // No-op commit (cursor returned to start position OR
        // right-only axis with rowSpan unchanged because we won't
        // write it anyway). Reset without mutation; no success-pulse.
        resetState();
        return;
      }

      // R1 F2 defense-in-depth: re-validate the post-snap position
      // against the grid invariant before dispatching mutation.
      // Should never fire (snapToColSpan already filtered), but if
      // it does, treat as cancel.
      if (
        colChanged &&
        snapshot.startCol + nextColSpan - 1 > totalCols
      ) {
        resetState();
        return;
      }

      // Resolve live PM position (snapshot.blockId === pos string).
      const blocks = snapshotBlocks(editor);
      const livePositions = liveBlockPositions(editor, blocks);
      const live = livePositions.get(snapshot.blockId);
      if (!live) {
        resetState();
        return;
      }

      // R1 F3 fix: axis-aware attr write delegated to the pure
      // `buildResizeNextAttrs` helper. Right-only axis omits rowSpan
      // entirely (preserves 'auto' on prose); bottom-only omits
      // colSpan; corner writes both (only reached for non-prose per
      // ADR-0017 D9).
      const nextAttrDiff = buildResizeNextAttrs(
        snapshot.axis,
        nextColSpan,
        nextRowSpan,
        colChanged,
        rowChanged,
      );
      editor
        .chain()
        .command(({ tr }) => {
          const node = tr.doc.nodeAt(live.pos);
          if (!node) return false;
          const nextAttrs = {
            ...node.attrs,
            ...nextAttrDiff,
          };
          tr.setNodeMarkup(live.pos, undefined, nextAttrs);
          return true;
        })
        .run();

      // Re-measure source NodeView at landed position post-mutation
      // (mirrors cf-20c-2 R2 F2 + R3 F2 sequence). 2 rAFs to allow
      // React commit + browser layout pass before the
      // getBoundingClientRect() returns the new size.
      const blockId = snapshot.blockId;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const newBlocks = snapshotBlocks(editor);
          const newLivePositions = liveBlockPositions(editor, newBlocks);
          const newLive = newLivePositions.get(blockId);
          if (!newLive) return;
          const newDom = editor.view.nodeDOM(newLive.pos);
          if (newDom instanceof HTMLElement) {
            const newRect = newDom.getBoundingClientRect();
            // Reuse cf-20c-2 dropEpoch infrastructure via the
            // consumer-supplied callback (D3 decision).
            onCommitSuccess?.(blockId, newRect);
          }
        });
      });

      resetState();
    };

    const handlePointerCancel = (): void => {
      resetState();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [
    active,
    editor,
    totalCols,
    activeColSnaps,
    gap,
    rowH,
    onCommitSuccess,
    resetState,
  ]);

  return {
    state: {
      active,
      sourceBlockId,
      axis,
      cursor,
      snapColSpan,
      snapRowSpan,
      sourceRect,
    },
    onResizeStart,
    onResizeEnd,
  };
}
