/**
 * @skb/editor-shell useDragDropPipeline — drag/drop lifecycle owner.
 *
 * cf-20c-2 + cf-22 + cf-22 R1. Composes drag primitives + commit
 * logic + keyboard mode (extracted hook). Pointer + keyboard modes
 * are separate (cf-22 D3); both share `commitDropAtMatch`. R1 F2:
 * keyboard mode tracks GRID coords {col, row} (NOT pixel cursor).
 * R1 F1: announce callbacks fire WCAG 4.1.3 messages on every
 * arrow / commit / cancel. R1 F3: Tab commits + Shift+Tab cancels
 * (handled inside useKeyboardDragMode). Full contract in ADR-0017
 * D13 + CONTRACT.md.
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
// cf-22: extracted commit logic (shared by pointer + keyboard).
import { commitDropAtMatch } from './commit-drop';
// cf-22 R1 F2: extracted keyboard-mode hook with GRID-coord
// tracking (per ADR-0017 D13 keyboard-parity contract).
import {
  useKeyboardDragMode,
  type KeyboardDragSnapshot,
} from './keyboard-drag-mode';

const VELOCITY_WINDOW_MS = 16;

export interface PipelineDragState {
  /** True from drag-start until drag-end (success / cancel / mode-none). */
  readonly active: boolean;
  /**
   * cf-22 — true while keyboard-mode drag active. Mutually exclusive
   * with `active` (pointer mode) per cf-22 D3. Consumers treat
   * `active || keyboardActive` as the drag-active predicate.
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
  /** cf-22 R1 F2 — keyboard-mode current grid `col`. */
  readonly keyboardCol: number | null;
  /** cf-22 R1 F2 — keyboard-mode current grid `row`. */
  readonly keyboardRow: number | null;
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
  /** cf-22 R1 F1 — totalCols for keyboard grid clamping. Default 12. */
  readonly totalCols?: number;
  /** cf-22 R1 F1 — WCAG 4.1.3 arrow-key move announcement. */
  readonly onAnnounceMove?: (
    blockKind: string,
    col: number,
    totalCols: number,
  ) => void;
  /** cf-22 R1 F1 — WCAG 4.1.3 commit announcement (pointer + keyboard). */
  readonly onAnnounceCommit?: (blockKind: string, col: number) => void;
  /** cf-22 R1 F1 — WCAG 4.1.3 cancel announcement (Esc / Shift+Tab). */
  readonly onAnnounceCancel?: () => void;
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
  const {
    editor,
    gridSelector = '.skb-grid',
    totalCols = 12,
    onAnnounceMove,
    onAnnounceCommit,
    onAnnounceCancel,
  } = options;

  const [layoutState, dispatchLayout] = useReducer(layoutReducer, INITIAL_LAYOUT_STATE);
  const [active, setActive] = useState(false);
  // Wave 6 cf-22 — separate keyboard-mode flag per cf-22 D3.
  const [keyboardActive, setKeyboardActive] = useState(false);
  // Wave 6 cf-22 R1 F2 — grid-coord state for keyboard drag.
  const [keyboardCol, setKeyboardCol] = useState<number | null>(null);
  const [keyboardRow, setKeyboardRow] = useState<number | null>(null);
  const [keyboardSnapshot, setKeyboardSnapshot] =
    useState<KeyboardDragSnapshot | null>(null);
  const [activeMatch, setActiveMatch] = useState<EdgeMatch | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [sourceBlockId, setSourceBlockId] = useState<string | null>(null);
  const [lastDroppedBlockId, setLastDroppedBlockId] = useState<string | null>(null);
  // cf-20c-2 R2 F2 + R3 F2 — pulse anchor rect + monotonic dropEpoch.
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
    // Fallback cleanup. Esc cancel via useEscCancel + dragend-
    // without-drop both route here. R1 F1: announce cancel for
    // BOTH pointer + keyboard modes (the keyboard hook only owns
    // Tab/Shift+Tab + Enter commit; Esc goes through this path).
    if (active || keyboardActive) {
      onAnnounceCancel?.();
      dispatchLayout({ type: 'drag-end-cancel' });
      setActive(false);
      setKeyboardActive(false);
      setKeyboardCol(null);
      setKeyboardRow(null);
      setKeyboardSnapshot(null);
      setActiveMatch(null);
      setCursor(null);
      setSourceBlockId(null);
    }
  }, [active, keyboardActive, onAnnounceCancel]);

  // cf-22 R1 F2 — keyboard-mode entry per ADR-0017 D13. Snapshots
  // grid coords {col, row, colSpan, rowSpan} (NOT pixel cursor;
  // pre-R1 pixel-synth was viewport-dependent). useKeyboardDragMode
  // window listener mutates {keyboardCol, keyboardRow} via
  // keyboardGridStep + keyboardGridRowStep; Enter commits via
  // setNodeMarkup writing {col, row} directly. cf-22 D3 separate-modes.
  const onDragStartKeyboard = useCallback(
    (blockId: string) => {
      if (!editor) return;
      if (active || keyboardActive) return;
      const blocks = snapshotBlocks(editor);
      const rects = measureBlockRects(editor, blocks);
      const sourceBlock = blocks.find((b) => b.id === blockId);
      if (!sourceBlock) return;

      // Build grid-coord snapshot (R1 F2 — replaces pre-R1 pixel
      // cursor model). hasRowAttr captures whether the source had
      // an explicit `row` (so commit knows whether to write `row`
      // back; blocks defaulted to no `row` should stay that way).
      const startRow = typeof sourceBlock.row === 'number' ? sourceBlock.row : 1;
      const hasRowAttr = sourceBlock.row !== undefined;
      const rowSpan =
        typeof sourceBlock.rowSpan === 'number' ? sourceBlock.rowSpan : 1;
      const newSnapshot: KeyboardDragSnapshot = {
        blockId,
        startCol: sourceBlock.col,
        startRow,
        colSpan: sourceBlock.colSpan,
        rowSpan,
        hasRowAttr,
      };

      // Edge rects + block rects retained for OutlineOverlay
      // rendering (the visual highlight reuses the same overlay
      // primitives as pointer mode; outline at source's current
      // position gets re-rendered on each grid-coord update).
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

      dispatchLayout({ type: 'drag-start', sourceBlockId: blockId });
      setSourceBlockId(blockId);
      setKeyboardSnapshot(newSnapshot);
      setKeyboardCol(sourceBlock.col);
      setKeyboardRow(startRow);
      setKeyboardActive(true);
      setActiveMatch(null);
      setCursor(null);
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
      // cf-20c-2 R1 F3: velocity in px/frame at 60fps per ADR-0017 D3
      // tiebreak contract. Multiply raw delta-px/delta-ms by
      // VELOCITY_WINDOW_MS so units align with the 0.5 px/frame
      // threshold. Full rationale in CONTRACT.md.
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
      // R1 F1 — WCAG 4.1.3 commit announcement (pointer-drop path).
      if (didMutate) {
        const sourceMutation = result.mutation.blocks.find(
          (b) => b.id === sourceBlockId,
        );
        const sourceSnapBlock = snapshotRef.current.find(
          (b) => b.id === sourceBlockId,
        );
        if (sourceMutation && sourceSnapBlock) {
          onAnnounceCommit?.(sourceSnapBlock.nodeName, sourceMutation.col);
        }
      }
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
  }, [active, editor, gridSelector, activeMatch, sourceBlockId, onAnnounceCommit]);

  // Wave 6 cf-22 R1 F2 — keyboard-mode lifecycle extracted to its
  // own hook. R1 rewrite uses GRID-COORDINATE state (snapshot +
  // currentCol + currentRow) per ADR-0017 D13 keyboard-parity
  // contract; pre-R1 used pixel-cursor synth which violated parity
  // on small viewports. R1 F1: announce callbacks wire WCAG 4.1.3.
  // R1 F3: Tab commit + Shift+Tab cancel handled inside the hook.
  useKeyboardDragMode({
    keyboardActive,
    editor,
    snapshot: keyboardSnapshot,
    currentCol: keyboardCol,
    currentRow: keyboardRow,
    totalCols,
    snapshotRef,
    setKeyboardActive,
    setSourceBlockId,
    setKeyboardCol,
    setKeyboardRow,
    setKeyboardSnapshot,
    dispatchLayout,
    setLastDroppedBlockId,
    setLastDroppedRect,
    setDropEpoch,
    onAnnounceMove,
    onAnnounceCommit,
    onAnnounceCancel,
  });

  // cf-20c-2 R1 F2 + R2 F2 — DropPulse cleanup; consumer's
  // onAnimationEnd callback unmounts the pulse so the next drag
  // cycle isn't suppressed by stale state. Also clears
  // lastDroppedRect to avoid stale-rect leak across cycles.
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
      keyboardCol,
      keyboardRow,
    },
    layoutState,
    onDragStart,
    onDragEnd,
    onDragStartKeyboard,
    clearLastDropped,
    setLastDroppedFromExternal,
  };
}
