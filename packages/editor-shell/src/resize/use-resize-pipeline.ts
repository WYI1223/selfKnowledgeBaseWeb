/**
 * @skb/editor-shell useResizePipeline — resize lifecycle owner.
 *
 * cf-20d + R1/R2 fixes + cf-22 keyboard mode. Composes resize visual
 * primitives (<ColRuler>, <SizeTooltip>, <RowLadder>) + resize-snap
 * math + Tiptap setNodeMarkup. Lifecycle: pointerdown (snapshot) →
 * pointermove (snap state, no mutation) → pointerup (commit-on-
 * release + 2-rAF re-measure + dropEpoch pulse). cf-22: parallel
 * keyboard-mode entry (Enter/Space on resize handle) → window Arrow
 * keys via useKeyboardResizeMode hook → Enter commits via SAME
 * setNodeMarkup path. esc-cancel + pointercancel rollback without
 * mutation per ADR-0017 D8 + D13. Decisions in CONTRACT.md.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { liveBlockPositions, snapshotBlocks } from '../drag-drop/pipeline-snapshot';
import {
  buildResizeNextAttrs,
  normalizeOverflowPosition,
  snapToColSpan,
  snapToRowSpan,
} from './resize-snap';
import type { ResizeAxis } from './resize-context';
// Wave 6 cf-22 — keyboard-mode lifecycle extracted to its own hook
// to keep this file under the 500-LOC size-check limit. The keyboard
// mode is logically separate from pointer mode per cf-22 D3.
import {
  startKeyboardResize,
  useKeyboardResizeMode,
  type KeyboardResizeSnapshot,
} from './keyboard-resize-mode';

export interface PipelineResizeState {
  /** True from pointerdown until commit/cancel/pointercancel. */
  readonly active: boolean;
  /**
   * Wave 6 cf-22 — true while a KEYBOARD-mode resize is active.
   * Per cf-22 D3, separate from `active` (pointer-mode); at most
   * ONE is true at a time. ColRuler/SizeTooltip/RowLadder mounts
   * should treat `active || keyboardActive` as the active predicate.
   */
  readonly keyboardActive: boolean;
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
   * Success-commit callback fired post-2-rAF re-measure. Consumer
   * wires to cf-20c-2 `setLastDroppedFromExternal(blockId, rect)`
   * for dropEpoch reuse pattern (cf-20c-2 R3 + cf-20d D3).
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
  /**
   * Wave 6 cf-22 — keyboard-mode resize entry. Called from
   * resize-handle's onKeyDown (Enter/Space). Snapshots block + sets
   * snap state to current col/row + flips `keyboardActive = true`.
   * Per cf-22 D3.
   */
  readonly onResizeStartKeyboard: (
    blockId: string,
    axis: ResizeAxis,
  ) => void;
}

interface ResizeSnapshot {
  readonly blockId: string;
  readonly axis: ResizeAxis;
  /** Pre-snap col (R1 F2 — for snapToColSpan overflow-filter). */
  readonly startCol: number;
  readonly startColSpan: number;
  /**
   * Original rowSpan attr (number | 'auto'). R1 F3: preserved so
   * right-only commit omits rowSpan from setNodeMarkup (prose
   * 'auto' preservation). bottom/corner commits write the integer.
   */
  readonly startRowSpanAttr: number | 'auto';
  /** Integer rowSpan for snap math (for 'auto', derived from rendered height). */
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
  const [keyboardActive, setKeyboardActive] = useState(false); // cf-22 D3
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
    setKeyboardActive(false);
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

      // R1 F3: preserve original rowSpan attr (number | 'auto'); for
      // 'auto' derive integer hint from rendered height.
      const startRowSpanAttr: number | 'auto' = target.rowSpan;
      let startRowSpanInt: number;
      if (typeof startRowSpanAttr === 'number' && startRowSpanAttr >= 1) {
        startRowSpanInt = startRowSpanAttr;
      } else if (rowH > 0 && startRect.height > 0) {
        startRowSpanInt = Math.max(
          1,
          Math.round((startRect.height + gap) / (rowH + gap)),
        );
      } else {
        startRowSpanInt = 1;
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
    // Pointercancel (rare browser-emitted) + keyboard-mode Esc cancel
    // via useEscCancel both route here. Pointer pointerup + keyboard
    // Enter are handled by their own listeners (commit path).
    if (active || keyboardActive) {
      resetState();
    }
  }, [active, keyboardActive, resetState]);

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

      // R1 F2: pass startCol so snapToColSpan filters overflowing
      // snaps. R1 F3: bottom-only commit MUST NOT touch rowSpan
      // (preserve 'auto' on prose). Full rationale in CONTRACT.md.
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
        nextRowSpan = snapToRowSpan(dy, snapshot.startRowSpanInt, rowH, gap);
      }

      const colChanged = nextColSpan !== snapshot.startColSpan;
      const rowChanged = nextRowSpan !== snapshot.startRowSpanInt;
      const writeRowSpan =
        rowChanged && (snapshot.axis === 'bottom' || snapshot.axis === 'corner');

      // R2 F2 + R3 F1: UNCONDITIONAL persisted-overflow defense
      // normalizes {col, colSpan} pair atomically. See
      // normalizeOverflowPosition JSDoc + CONTRACT.md.
      const normalizedPosition = normalizeOverflowPosition(
        snapshot.startCol,
        snapshot.startColSpan,
        totalCols,
        activeColSnaps,
      );
      const persistedOverflow = normalizedPosition !== null;

      if (!colChanged && !writeRowSpan && !persistedOverflow) {
        resetState();
        return;
      }

      // R1 F2 defense-in-depth: re-validate post-snap position.
      if (colChanged && snapshot.startCol + nextColSpan - 1 > totalCols) {
        resetState();
        return;
      }

      const blocks = snapshotBlocks(editor);
      const livePositions = liveBlockPositions(editor, blocks);
      const live = livePositions.get(snapshot.blockId);
      if (!live) {
        resetState();
        return;
      }

      const nextAttrDiff: Record<string, number> = buildResizeNextAttrs(
        snapshot.axis,
        nextColSpan,
        nextRowSpan,
        colChanged,
        rowChanged,
      );
      // R2 F2 + R3 F1: persistedOverflow forces normalized {col,
      // colSpan} pair into the diff (single atomic recovery commit).
      // console.warn for operator visibility. Full rationale in
      // CONTRACT.md.
      if (normalizedPosition !== null) {
        // eslint-disable-next-line no-console
        console.warn(
          `[useResizePipeline R3 F1] persisted grid overflow detected at block ${snapshot.blockId} ` +
            `(col=${snapshot.startCol}, colSpan=${snapshot.startColSpan}, totalCols=${totalCols}); ` +
            `normalizing to {col=${normalizedPosition.col}, colSpan=${normalizedPosition.colSpan}} ` +
            `as part of ${snapshot.axis}-axis commit.`,
        );
        nextAttrDiff['col'] = normalizedPosition.col;
        nextAttrDiff['colSpan'] = normalizedPosition.colSpan;
      }
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

      // 2-rAF re-measure for landed-position pulse anchor (mirrors
      // cf-20c-2 R2 F2 + R3 F2). cf-20d D3 dropEpoch reuse via
      // onCommitSuccess callback.
      const blockId = snapshot.blockId;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const newBlocks = snapshotBlocks(editor);
          const newLive = liveBlockPositions(editor, newBlocks).get(blockId);
          if (!newLive) return;
          const newDom = editor.view.nodeDOM(newLive.pos);
          if (newDom instanceof HTMLElement) {
            onCommitSuccess?.(blockId, newDom.getBoundingClientRect());
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

  // Wave 6 cf-22 — keyboard-mode entry. Delegates to the helper in
  // keyboard-resize-mode.ts which builds the snapshot + flips state.
  const onResizeStartKeyboard = useCallback(
    (blockId: string, nextAxis: ResizeAxis) => {
      const startResult = startKeyboardResize({
        editor,
        blockId,
        axis: nextAxis,
        gridSelector,
        rowH,
        gap,
        active,
        keyboardActive,
      });
      if (!startResult) return;
      snapshotRef.current = startResult.snapshot;
      setKeyboardActive(true);
      setSourceBlockId(blockId);
      setAxis(nextAxis);
      setCursor(null);
      setSnapColSpan(startResult.snapshot.startColSpan);
      setSnapRowSpan(startResult.snapshot.startRowSpanInt);
      setSourceRect(startResult.snapshot.sourceRect);
    },
    [editor, active, keyboardActive, gridSelector, gap, rowH],
  );

  // cf-22 keyboard-mode lifecycle (Arrow + Enter); shares commit path.
  const keyboardSnapshot: KeyboardResizeSnapshot | null = snapshotRef.current
    ? {
        blockId: snapshotRef.current.blockId,
        axis: snapshotRef.current.axis,
        startCol: snapshotRef.current.startCol,
        startColSpan: snapshotRef.current.startColSpan,
        startRowSpanInt: snapshotRef.current.startRowSpanInt,
      }
    : null;
  useKeyboardResizeMode({
    keyboardActive,
    editor,
    snapshot: keyboardSnapshot,
    snapColSpan,
    snapRowSpan,
    totalCols,
    activeColSnaps,
    setSnapColSpan,
    setSnapRowSpan,
    resetState,
    onCommitSuccess,
    snapshotRef,
  });

  return {
    state: {
      active,
      keyboardActive,
      sourceBlockId,
      axis,
      cursor,
      snapColSpan,
      snapRowSpan,
      sourceRect,
    },
    onResizeStart,
    onResizeEnd,
    onResizeStartKeyboard,
  };
}
