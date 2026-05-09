/**
 * @skb/editor-shell useDragDropPipeline — drag/drop lifecycle owner.
 *
 * Wave 6 cf-20c-2 (2026-05-09) — composes the cf-20c-2 primitives
 * (snapshot, edge-rects, tiebreak, applyDropMode, layoutReducer,
 * outline-overlay, drag-ghost, drop-pulse, esc-cancel) into the
 * interactive drag-handle wire. Single mutation pipeline per
 * ADR-0016 D12 + ADR-0017 D12.
 *
 * Wave 6 cf-22 (2026-05-09) — adds parallel keyboard-mode entry
 * point per ADR-0017 D13 + WCAG 2.1.1: Enter/Space on drag handle
 * starts keyboard-mode (separate `state.keyboardActive` flag per
 * cf-22 D3); Arrow keys navigate via `useKeyboardDragMode` hook
 * (extracted to keep this file under the 500-LOC size-check limit);
 * Enter commits via the SAME `commitDropAtMatch` path as pointer
 * drop (per cf-22 D7 dropEpoch reuse).
 *
 * Lifecycle (per ADR-0017 D-list + cf-22 D13 amendment):
 *   POINTER: dragstart → window dragover → window drop → commit
 *   KEYBOARD: handle Enter/Space → window Arrow → window Enter → commit
 *   Both paths share: snapshotBlocks → edgeRects → tiebreak →
 *   commitDropAtMatch → setNodeMarkup → dropEpoch pulse.
 *
 * Block-id sourcing (cf-20c-2 D2): ProseMirror node `pos` as stable
 * string within a single drag transaction. Snapshot at start; never
 * re-read during the active window; at drop, walk the doc again to
 * map snapshot pos → live pos.
 */
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { computeEdgeRects, type BlockLayout, type EdgeRect } from './edge-rects';
import { findMatches, tiebreak, type EdgeMatch } from './tiebreak';
import { layoutReducer, type LayoutState } from './layout-reducer';
// Wave 6 cf-20c-2 R2 — extracted snapshot helpers (kept the main hook
// file under the 500-line size-check hard limit).
import {
  liveBlockPositions,
  measureBlockRects,
  snapshotBlocks,
  type SerializedBlock,
} from './pipeline-snapshot';
// Wave 6 cf-22 (2026-05-09) — extracted commit logic (re-used by
// both pointer-drop and keyboard-Enter commit paths). Pre-cf-22 the
// commit ran inline in the dragover/drop useEffect; keyboard mode
// shares the SAME mutation path, so the extraction enables reuse +
// keeps this file under the 500-LOC size-check limit.
import { commitDropAtMatch } from './commit-drop';
// Wave 6 cf-22 — extracted keyboard-mode lifecycle (Arrow keys +
// Enter commit). The extraction keeps this file under the size-
// check limit; the keyboard mode is logically separate from
// pointer mode per cf-22 D3.
import { useKeyboardDragMode } from './keyboard-drag-mode';

const VELOCITY_WINDOW_MS = 16;

export interface PipelineDragState {
  /** True from drag-start until drag-end (success / cancel / mode-none). */
  readonly active: boolean;
  /**
   * Wave 6 cf-22 (2026-05-09) — true while a KEYBOARD-mode drag is
   * active (Enter/Space on drag handle → window Arrow keys move
   * cursor → Enter commits). Per cf-22 D3 separate-modes decision,
   * this is a SEPARATE flag from `active` (the pointer mode):
   *   - At most ONE of `active` and `keyboardActive` is true.
   *   - Mid-pointer-drag, Arrow keys are no-op.
   *   - Mid-keyboard-drag, mouse pointerdown elsewhere ends keyboard
   *     mode + restores focus per cf-22 D5.
   * Consumers (OutlineOverlay / DragGhost mounts) should treat
   * `active || keyboardActive` as the "drag-mode active" predicate.
   */
  readonly keyboardActive: boolean;
  /** Per-block id → bounding rect snapshot taken at drag-start. */
  readonly blockRects: Map<string, DOMRectReadOnly>;
  /** Pre-computed 4-edge rects per block (snapshotted at drag-start). */
  readonly edgeRects: readonly EdgeRect[];
  /** Currently-resolved drop target (from `tiebreak`). null = no match. */
  readonly activeMatch: EdgeMatch | null;
  /** Cursor position (for DragGhost following). */
  readonly cursor: { readonly x: number; readonly y: number } | null;
  /** Source block being dragged (set at drag-start). */
  readonly sourceBlockId: string | null;
  /** Block ID that received the most recent drop (for DropPulse). */
  readonly lastDroppedBlockId: string | null;
  /**
   * Bounding rect of source NodeView at POST-DROP landed grid
   * position (cf-20c-2 R2 F2 — pulse anchors at the new position
   * per ADR-0017 D11 line 344, not the snapshot rect). Set 2 rAFs
   * after Tiptap setNodeMarkup commits.
   */
  readonly lastDroppedRect: DOMRectReadOnly | null;
  /**
   * Monotonic dropEpoch (cf-20c-2 R3 F2) — used as React `key` on
   * <DropPulseAtRect> to remount the animation across rapid drops
   * within the 720ms animation window. cf-20c-2 R3 reflection:
   * canonical "rapid-action animation isolation" pattern; reused
   * by cf-20d resize-commit + cf-20e duplicate + cf-22 keyboard-
   * commit via `setLastDroppedFromExternal`.
   */
  readonly dropEpoch: number;
}

export interface UseDragDropPipelineOptions {
  /** The Tiptap editor instance; null until onCreate fires. */
  readonly editor: Editor | null;
  /**
   * Selector for the grid container element that holds the .ProseMirror.
   * Defaults to '.skb-grid'. The pipeline attaches dragover / drop
   * listeners here.
   */
  readonly gridSelector?: string;
}

export interface UseDragDropPipelineReturn {
  /** Reactive drag state for OutlineOverlay / DragGhost / DropPulse mounts. */
  readonly state: PipelineDragState;
  /** Layout state (epoch + baseline + snapshot). Externalised for tests. */
  readonly layoutState: LayoutState;
  /** Bound to the per-block drag-handle button via DragDropContext. */
  readonly onDragStart: (blockId: string, origin: { x: number; y: number }) => void;
  /** Bound to the per-block drag-handle button's dragend (cleanup fallback). */
  readonly onDragEnd: (origin: { x: number; y: number }) => void;
  /**
   * cf-22 keyboard-mode entry. Called from drag-handle's onKeyDown
   * (Enter/Space). Snapshots blocks + sets virtual cursor at source
   * center + flips `keyboardActive = true`. Per cf-22 D3.
   */
  readonly onDragStartKeyboard: (blockId: string) => void;
  /**
   * cf-20c-2 R1 F2 DropPulse cleanup; consumer wires
   * `<DropPulse onAnimationEnd={clearLastDropped} />` so the pulse
   * unmounts after its 720ms keyframe completes.
   */
  readonly clearLastDropped: () => void;
  /**
   * cf-20d external setter for the success-pulse fields; cf-20d
   * resize / cf-20e duplicate / cf-22 keyboard-commit all route
   * their pulse through this method per the dropEpoch reuse
   * pattern (cf-20c-2 R3 generalization).
   */
  readonly setLastDroppedFromExternal: (
    blockId: string,
    rect: DOMRectReadOnly,
  ) => void;
}

const INITIAL_LAYOUT_STATE: LayoutState = {
  epoch: 0,
  snapshot: null,
  baseline: { blocks: [] },
};

export function useDragDropPipeline(
  options: UseDragDropPipelineOptions,
): UseDragDropPipelineReturn {
  const { editor, gridSelector = '.skb-grid' } = options;

  const [layoutState, dispatchLayout] = useReducer(layoutReducer, INITIAL_LAYOUT_STATE);
  const [active, setActive] = useState(false);
  // Wave 6 cf-22 — separate keyboard-mode flag per cf-22 D3.
  const [keyboardActive, setKeyboardActive] = useState(false);
  const [activeMatch, setActiveMatch] = useState<EdgeMatch | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [sourceBlockId, setSourceBlockId] = useState<string | null>(null);
  const [lastDroppedBlockId, setLastDroppedBlockId] = useState<string | null>(null);
  // cf-20c-2 R2 F2 + R3 F2 — pulse anchor rect (post-drop landed
  // position per ADR-0017 D11) + monotonic dropEpoch (React key
  // for rapid-drop animation isolation). See PipelineDragState
  // JSDoc above for full rationale.
  const [lastDroppedRect, setLastDroppedRect] = useState<DOMRectReadOnly | null>(null);
  const [dropEpoch, setDropEpoch] = useState(0);

  // Snapshot refs (preserved across renders; not state because
  // changing them shouldn't trigger re-render).
  const snapshotRef = useRef<readonly SerializedBlock[]>([]);
  const blockRectsRef = useRef<Map<string, DOMRectReadOnly>>(new Map());
  const edgeRectsRef = useRef<readonly EdgeRect[]>([]);
  const lastCursorRef = useRef<{ x: number; y: number; t: number } | null>(null);

  const onDragStart = useCallback(
    (blockId: string, origin: { x: number; y: number }) => {
      if (!editor) return;
      const blocks = snapshotBlocks(editor);
      const rects = measureBlockRects(editor, blocks);
      // cf-20c-2 R1 F1: edge-rects from baseline-WITHOUT-source per
      // ADR-0017 D6 source-lift compliance (else the user could drop
      // onto themselves at the lifted position). Source-lift visual
      // applied via `.skb-block-nodeview--dragging-self` CSS class
      // bound to DragDropContext.sourceBlockId in BlockNodeView.tsx.
      const layouts: BlockLayout[] = blocks
        .filter((b) => b.id !== blockId)
        .map((b) => {
          const rect = rects.get(b.id);
          return rect ? { blockId: b.id, rect } : null;
        })
        .filter((x): x is BlockLayout => x !== null);
      const edges = computeEdgeRects(layouts);

      snapshotRef.current = blocks;
      blockRectsRef.current = rects;
      edgeRectsRef.current = edges;
      lastCursorRef.current = { x: origin.x, y: origin.y, t: performance.now() };

      dispatchLayout({ type: 'drag-start', sourceBlockId: blockId });
      setSourceBlockId(blockId);
      setCursor({ x: origin.x, y: origin.y });
      setActive(true);
      setActiveMatch(null);
    },
    [editor],
  );

  const onDragEnd = useCallback(() => {
    // Fallback cleanup if drop event didn't fire on the grid (e.g. user
    // released over browser chrome). Treat as cancel.
    // Wave 6 cf-22 — also clears keyboardActive (Esc cancel via
    // useEscCancel calls onDragEnd; keyboard-mode cleanup mirrors
    // pointer-mode cleanup).
    if (active || keyboardActive) {
      dispatchLayout({ type: 'drag-end-cancel' });
      setActive(false);
      setKeyboardActive(false);
      setActiveMatch(null);
      setCursor(null);
      setSourceBlockId(null);
    }
  }, [active, keyboardActive]);

  // Wave 6 cf-22 (2026-05-09) — keyboard-mode drag entry per WCAG
  // 2.1.1. Snapshots blocks (same as pointer path) + computes a
  // virtual cursor at the source block's center + flips
  // `keyboardActive = true`. Window-level Arrow listener (in the
  // useEffect below) takes over for navigation; Enter commits via
  // the SAME commitDropAtMatch path as pointer drop. Per cf-22 D3,
  // pointer-mode `active` is held false during keyboard mode.
  const onDragStartKeyboard = useCallback(
    (blockId: string) => {
      if (!editor) return;
      // Reject if already in any mode (per cf-22 D3 separate-modes
      // — no mid-drag bridge between mouse + keyboard).
      if (active || keyboardActive) return;
      const blocks = snapshotBlocks(editor);
      const rects = measureBlockRects(editor, blocks);
      const layouts: BlockLayout[] = blocks
        .filter((b) => b.id !== blockId)
        .map((b) => {
          const rect = rects.get(b.id);
          return rect ? { blockId: b.id, rect } : null;
        })
        .filter((x): x is BlockLayout => x !== null);
      const edges = computeEdgeRects(layouts);
      // Virtual cursor: center of the source block's bounding rect.
      // This is the keyboard-mode initial cursor position; Arrow
      // keys move it via lastCursorRef.
      const sourceRect = rects.get(blockId);
      const initialCursor = sourceRect
        ? {
            x: sourceRect.left + sourceRect.width / 2,
            y: sourceRect.top + sourceRect.height / 2,
          }
        : { x: 0, y: 0 };

      snapshotRef.current = blocks;
      blockRectsRef.current = rects;
      edgeRectsRef.current = edges;
      lastCursorRef.current = {
        x: initialCursor.x,
        y: initialCursor.y,
        t: performance.now(),
      };

      dispatchLayout({ type: 'drag-start', sourceBlockId: blockId });
      setSourceBlockId(blockId);
      setCursor(initialCursor);
      setKeyboardActive(true);
      setActiveMatch(null);
    },
    [editor, active, keyboardActive],
  );

  // Window-level dragover / drop listeners. Attached when active=true.
  useEffect(() => {
    if (!active) return;

    const handleDragOver = (event: DragEvent): void => {
      event.preventDefault(); // Required so drop fires on the same target.
      const x = event.clientX;
      const y = event.clientY;
      const last = lastCursorRef.current;
      const now = performance.now();
      // Wave 6 cf-20c-2 R1 F3 fix (2026-05-09) — velocity unit
      // alignment with `tiebreak()` contract. ADR-0017 D3 specifies
      // the velocity threshold + direction-aware tiebreak in
      // **px/frame** at 60fps (16.67ms/frame); `tiebreak()` reads
      // `velocity.vx` / `vy` in those units. Pre-R1 the pipeline
      // computed raw `delta px / delta ms` which under-triggered the
      // direction filter (e.g. a real cursor moving at 60 px/sec —
      // a slow drag — has `vxPxPerMs ≈ 0.06` which is FAR below the
      // 0.5 px/frame threshold; tiebreak fell back to spatial order
      // even when the user had clear directional intent). Multiply
      // by VELOCITY_WINDOW_MS (= 16) so the unit is px/frame
      // assuming 60fps. Real frame rate may differ but the threshold
      // is intentionally tolerant (0.5 px/frame ≈ 30 px/sec) and
      // the math holds for any framerate ≥ 30fps.
      const velocity =
        last && now - last.t < VELOCITY_WINDOW_MS * 4
          ? {
              vx: ((x - last.x) / Math.max(1, now - last.t)) * VELOCITY_WINDOW_MS,
              vy: ((y - last.y) / Math.max(1, now - last.t)) * VELOCITY_WINDOW_MS,
            }
          : { vx: 0, vy: 0 };
      lastCursorRef.current = { x, y, t: now };
      setCursor({ x, y });
      const matches = findMatches(x, y, [...edgeRectsRef.current], blockRectsRef.current);
      const winner = tiebreak(matches, velocity);
      setActiveMatch(winner);
    };

    const handleDrop = (event: DragEvent): void => {
      event.preventDefault();
      const winner = activeMatch;
      if (!editor || !winner || !sourceBlockId) {
        dispatchLayout({ type: 'drag-end-mode-none' });
        setActive(false);
        setActiveMatch(null);
        setCursor(null);
        setSourceBlockId(null);
        return;
      }

      // Wave 6 cf-22 — commit logic extracted to commitDropAtMatch
      // for reuse by the keyboard-Enter commit path. Returns null
      // mutation on algebra failure (caller dispatches mode-none).
      const result = commitDropAtMatch(
        editor,
        winner,
        sourceBlockId,
        snapshotRef.current,
      );
      if (result.mutation === null) {
        dispatchLayout({ type: 'drag-end-mode-none' });
        setActive(false);
        setActiveMatch(null);
        setCursor(null);
        setSourceBlockId(null);
        return;
      }

      const didMutate = result.didMutate;
      const reducerSnapshot = {
        blocks: result.mutation.blocks.map((b) => ({
          col: b.col,
          ...(b.row !== undefined && { row: b.row }),
          colSpan: b.colSpan,
          rowSpan: b.rowSpan,
        })),
      };
      dispatchLayout({ type: 'drag-end-success', mutation: reducerSnapshot });
      // cf-20c-2 R3 F2: atomic clear-then-set of pulse state across
      // the 2-rAF measurement window so rapid drops don't render
      // stale rects. cf-20c-2 R2 F2: re-measure source AT landed
      // position per ADR-0017 D11 line 344 (NOT snapshot rect).
      // 2 rAFs = React commit + browser layout (single rAF is
      // insufficient; verified empirically at cf-20c-2 R2).
      setLastDroppedBlockId(null);
      setLastDroppedRect(null);
      if (didMutate) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Tiptap's setNodeMarkup may have shifted live positions
            // (split-* modes can re-order siblings). Re-walk the doc
            // post-commit to find the source's current pos.
            const newLivePositions = liveBlockPositions(editor, snapshotRef.current);
            const newSourceLive = newLivePositions.get(sourceBlockId);
            if (!newSourceLive) return;
            const dom = editor.view.nodeDOM(newSourceLive.pos);
            if (dom instanceof HTMLElement) {
              // R3 F2: set blockId + rect together; React batches
              // these into a single render pass within the same
              // synchronous block (React 18+ automatic batching).
              setLastDroppedBlockId(sourceBlockId);
              setLastDroppedRect(dom.getBoundingClientRect());
              setDropEpoch((prev) => prev + 1);
            }
          });
        });
      }
      setActive(false);
      setActiveMatch(null);
      setCursor(null);
      setSourceBlockId(null);
    };

    const grid = document.querySelector(gridSelector);
    if (!grid) return;
    grid.addEventListener('dragover', handleDragOver as EventListener);
    grid.addEventListener('drop', handleDrop as EventListener);
    return () => {
      grid.removeEventListener('dragover', handleDragOver as EventListener);
      grid.removeEventListener('drop', handleDrop as EventListener);
    };
  }, [active, editor, gridSelector, activeMatch, sourceBlockId]);

  // Wave 6 cf-22 — keyboard-mode lifecycle extracted to its own
  // hook to keep this file under the 500-LOC size-check limit.
  // The extraction is mechanical (the keyboard mode is logically
  // separate from pointer mode per cf-22 D3); same Arrow + Enter
  // semantics, same commitDropAtMatch path.
  useKeyboardDragMode({
    keyboardActive,
    editor,
    activeMatch,
    sourceBlockId,
    snapshotRef,
    blockRectsRef,
    edgeRectsRef,
    lastCursorRef,
    dispatchLayout,
    setKeyboardActive,
    setActiveMatch,
    setCursor,
    setSourceBlockId,
    setLastDroppedBlockId,
    setLastDroppedRect,
    setDropEpoch,
  });

  // Wave 6 cf-20c-2 R1 F2 fix (2026-05-09) — DropPulse cleanup hook.
  // The consumer (EditorShellMount.tsx) renders <DropPulse> inside the
  // landed block when `lastDroppedBlockId !== null`; on the
  // `onAnimationEnd` callback it calls `clearLastDropped()` to unmount
  // the pulse so a follow-up drag's mount cycle isn't suppressed by a
  // stale "already pulsed" state.
  // Wave 6 cf-20c-2 R2 F2 — also clears `lastDroppedRect` so the
  // next drop's re-measure isn't mixed with the prior cycle's stale
  // rect (the rect would be visually stale after consumers unmount
  // the DropPulse anyway, but explicit reset keeps the state shape
  // consistent).
  const clearLastDropped = useCallback(() => {
    setLastDroppedBlockId(null);
    setLastDroppedRect(null);
  }, []);

  // Wave 6 cf-20d — external setter (resize pipeline routes the
  // success-pulse here per cf-20d D3 dropEpoch reuse). Atomic
  // clear-then-set + dropEpoch++ mirrors the internal R3 F2 pattern.
  const setLastDroppedFromExternal = useCallback(
    (blockId: string, rect: DOMRectReadOnly) => {
      setLastDroppedBlockId(null);
      setLastDroppedRect(null);
      setLastDroppedBlockId(blockId);
      setLastDroppedRect(rect);
      setDropEpoch((prev) => prev + 1);
    },
    [],
  );

  return {
    state: {
      active,
      keyboardActive,
      blockRects: blockRectsRef.current,
      edgeRects: edgeRectsRef.current,
      activeMatch,
      cursor,
      sourceBlockId,
      lastDroppedBlockId,
      lastDroppedRect,
      dropEpoch,
    },
    layoutState,
    onDragStart,
    onDragEnd,
    onDragStartKeyboard,
    clearLastDropped,
    setLastDroppedFromExternal,
  };
}
