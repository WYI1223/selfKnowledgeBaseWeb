/**
 * @skb/editor-shell useDragDropPipeline — drag/drop lifecycle owner.
 *
 * Wave 6 cf-20c-2 (2026-05-09) — composes the existing primitives
 * (snapshot, edge-rects, tiebreak, applyDropMode, layoutReducer,
 * outline-overlay, drag-ghost, drop-pulse, esc-cancel) into the actual
 * interactive drag-handle wire. The hook is the single mutation
 * pipeline per ADR-0016 D12 + ADR-0017 D12 (epoch single-source).
 *
 * Lifecycle (per ADR-0017 D-list):
 *   drag-start (per-block handle dragstart)
 *     ↓
 *     snapshotBlocks(editor) → IdentifiedBlock[] (block.id = ProseMirror node `pos` as string per cf-20c-2 D2)
 *     measureBlockRects() → Map<id, DOMRectReadOnly>
 *     computeEdgeRects(blocks) → EdgeRect[]
 *     dispatch({type: 'drag-start', sourceBlockId})
 *     mount DragGhost following cursor; mount OutlineOverlay
 *
 *   drag-over (window-level)
 *     ↓
 *     findMatches(cursor.x, cursor.y, edgeRects, blockRects) → EdgeMatch[]
 *     tiebreak(matches, velocity) → activeMatch | null
 *     setActiveMatch (drives OutlineOverlay accent rendering)
 *
 *   drop (window-level)
 *     ↓
 *     if activeMatch == null: dispatch({type: 'drag-end-mode-none'}) (rollback)
 *     else: applyDropMode({baseline, mode, sourceBlockId, hostBlockId, ...}) → snapshot
 *     for each block in snapshot whose attrs differ from current PM node attrs:
 *       editor.chain().focus().setNodeSelection(pos).updateAttributes(name, {col,row,colSpan,rowSpan}).run()
 *     dispatch({type: 'drag-end-success', mutation: snapshot})
 *     mount DropPulse on the landed block (720ms; per ADR-0017 D11)
 *
 *   esc-cancel (window keydown)
 *     ↓
 *     dispatch({type: 'drag-end-cancel'}) (rollback to S0; per ADR-0017 D8)
 *
 *   dragend with no drop (e.g. user released over browser chrome)
 *     ↓
 *     same as esc-cancel: rollback
 *
 * Block-id sourcing (cf-20c-2 D2 decision): we use ProseMirror node `pos`
 * (stable within a single doc transaction) as the block ID. Snapshot
 * captures (pos, kind, col, row, colSpan, rowSpan) at drag-start; the
 * pipeline never re-reads the doc during drag-over (would invalidate
 * pos under a transaction). At drop, we walk the doc again to map
 * snapshot positions → live positions before dispatching attr updates.
 *
 * NOT shipped at cf-20c-2 (scheduled work; explicit per
 * 2026-05-09 retrospective Rule 3):
 *   - cf-20c-2 implements `empty` mode shape but the empty grid hit-
 *     test is deferred to cf-20c-3 (no current empty-grid surface to
 *     drop into; sample-blocks fixtures all use full-width blocks).
 *     Pipeline emits `drag-end-mode-none` when `tiebreak` returns null.
 *   - Touch device support (cf-22 a11y or separate cf-25)
 *   - Resize handles (cf-20d) — separate gutter affordance
 *   - Kebab menu (cf-20e) — separate gutter affordance
 */
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { applyDropMode, type GridSnapshotIdentified } from './apply-drop-mode';
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

const VELOCITY_WINDOW_MS = 16;

export interface PipelineDragState {
  /** True from drag-start until drag-end (success / cancel / mode-none). */
  readonly active: boolean;
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
   * Wave 6 cf-20c-2 R2 F2 fix (2026-05-09) — bounding rect of the
   * source NodeView at its POST-DROP landed grid position. ADR-0017
   * D11 line 344: "drop 落定瞬间 (源块进入新 grid 位置 + outline
   * fade-out 完成)" — the pulse fires AT the new position. Pre-R2
   * the consumer (EditorShellMount.tsx) anchored the pulse at the
   * SNAPSHOT rect (source's pre-drag position) which is wrong per
   * D11. R2 pipeline re-measures the source NodeView via
   * `editor.view.nodeDOM(livePos).getBoundingClientRect()` AFTER
   * the Tiptap setNodeMarkup batch commits + 2 rAFs for React
   * commit + browser layout settle. null when no recent drop.
   */
  readonly lastDroppedRect: DOMRectReadOnly | null;
  /**
   * Wave 6 cf-20c-2 R3 F2 — monotonic counter incremented each time
   * `lastDroppedBlockId` is set on drag-end-success. Consumers use
   * as a React `key` on <DropPulseAtRect> so the 720ms animation
   * remounts cleanly across rapid drops within a single window
   * (without the key, React reuses the instance + the keyframe
   * doesn't restart → half-faded pulse on the new position).
   * cf-20c-2 R3 reflection: this is the canonical "rapid-action
   * animation isolation" pattern. cf-20d resize reuses this field
   * via `setLastDroppedFromExternal` per cf-20d D3.
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
   * Wave 6 cf-20c-2 R1 F2 — DropPulse cleanup callback.
   * Consumer (EditorShellMount) wires `<DropPulse onAnimationEnd={clearLastDropped} />`
   * so the pulse unmounts after its 720ms keyframe completes; the
   * pipeline's `lastDroppedBlockId` resets to `null`, preparing the
   * state for the next drag cycle.
   */
  readonly clearLastDropped: () => void;
  /**
   * Wave 6 cf-20d (2026-05-09) — external setter for the success-pulse
   * fields. cf-20d's resize pipeline calls this via the
   * `onCommitSuccess` callback so resize commits route through the
   * SAME dropEpoch infrastructure as drag commits (cf-20c-2 R3
   * "rapid-action animation isolation" pattern is generic). Per
   * cf-20d D3 reuse decision.
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
  const [activeMatch, setActiveMatch] = useState<EdgeMatch | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [sourceBlockId, setSourceBlockId] = useState<string | null>(null);
  const [lastDroppedBlockId, setLastDroppedBlockId] = useState<string | null>(null);
  // Wave 6 cf-20c-2 R2 F2 — landed-position rect for DropPulse
  // anchoring per ADR-0017 D11 line 344. Set post-drop by re-
  // measuring the source NodeView at its NEW grid position; null
  // until a successful drop AND the 2 rAFs after Tiptap setNodeMarkup
  // commits.
  const [lastDroppedRect, setLastDroppedRect] = useState<DOMRectReadOnly | null>(null);
  // Wave 6 cf-20c-2 R3 F2 — monotonic drop epoch for React key-based
  // animation remount across rapid drops. Increments each time
  // lastDroppedBlockId transitions from null → blockId. See PipelineDragState
  // JSDoc above for the full rationale.
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
      // Wave 6 cf-20c-2 R1 F1 fix (2026-05-09) — ADR-0017 D6 source-
      // lift compliance. Edge-rects MUST be computed from the
      // baseline-WITHOUT-source so the drop hit-test never matches
      // the source block's own edges (which would let the user drop
      // onto themselves at the lifted position — meaningless mode).
      // Pre-R1 edges included the source; tiebreak still produced a
      // hit when the cursor returned to the source position. The
      // source-lift visual on the source NodeView
      // (`visibility: hidden + pointer-events: none` per ADR-0017 D6
      // line 247 verbatim, applied via the
      // `.skb-block-nodeview--dragging-self` CSS class — see
      // `BlockNodeView.css` for the rule + cf-20c-2 R2 F1 fix
      // rationale that replaced R1's v2-demo opacity/grayscale model
      // which D6 line 255 explicitly rejects) is applied separately
      // via DragDropContext.sourceBlockId → BlockNodeView CSS class
      // binding.
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
    if (active) {
      dispatchLayout({ type: 'drag-end-cancel' });
      setActive(false);
      setActiveMatch(null);
      setCursor(null);
      setSourceBlockId(null);
    }
  }, [active]);

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

      // Apply algebra
      const baselineSnap: GridSnapshotIdentified = {
        blocks: snapshotRef.current.map((b) => ({
          id: b.id,
          col: b.col,
          ...(b.row !== undefined && { row: b.row }),
          colSpan: b.colSpan,
          rowSpan: b.rowSpan,
        })),
      };
      let mutation: GridSnapshotIdentified;
      try {
        mutation = applyDropMode({
          baseline: baselineSnap,
          mode: winner.mode,
          sourceBlockId,
          hostBlockId: winner.blockId,
        });
      } catch {
        // Algebra precondition failed (e.g. invalid colSpan halve).
        // Roll back via mode-none semantics.
        dispatchLayout({ type: 'drag-end-mode-none' });
        setActive(false);
        setActiveMatch(null);
        setCursor(null);
        setSourceBlockId(null);
        return;
      }

      // Translate snapshot mutation → Tiptap attr updates
      const livePositions = liveBlockPositions(editor, snapshotRef.current);
      const chain = editor.chain();
      let didMutate = false;
      for (const mutated of mutation.blocks) {
        const original = baselineSnap.blocks.find((b) => b.id === mutated.id);
        if (!original) continue;
        const sameCol = original.col === mutated.col;
        const sameRow = (original.row ?? null) === (mutated.row ?? null);
        const sameColSpan = original.colSpan === mutated.colSpan;
        const sameRowSpan = original.rowSpan === mutated.rowSpan;
        if (sameCol && sameRow && sameColSpan && sameRowSpan) continue;
        const live = livePositions.get(mutated.id);
        if (!live) continue;
        chain.command(({ tr }) => {
          const node = tr.doc.nodeAt(live.pos);
          if (!node) return false;
          const nextAttrs = {
            ...node.attrs,
            col: mutated.col,
            colSpan: mutated.colSpan,
            rowSpan: mutated.rowSpan,
            ...(mutated.row !== undefined && { row: mutated.row }),
          };
          tr.setNodeMarkup(live.pos, undefined, nextAttrs);
          return true;
        });
        didMutate = true;
      }
      if (didMutate) chain.run();

      // Adapter from IdentifiedBlock back to BlockGridPosition (drop the id).
      const reducerSnapshot = {
        blocks: mutation.blocks.map((b) => ({
          col: b.col,
          ...(b.row !== undefined && { row: b.row }),
          colSpan: b.colSpan,
          rowSpan: b.rowSpan,
        })),
      };
      dispatchLayout({ type: 'drag-end-success', mutation: reducerSnapshot });
      // Wave 6 cf-20c-2 R3 F2 fix (2026-05-09) — atomic clear of
      // prior drop state BEFORE the new measurement starts. Pre-R3
      // the pipeline set the new lastDroppedBlockId immediately while
      // the prior lastDroppedRect was still live (the new measurement
      // happens 2 rAFs later). For rapid drops within 720ms (faster
      // than DropPulse animation completes), there was a brief frame
      // where the new pulse rendered at the OLD rect — visual
      // misalignment.
      //
      // R3 fix sequence:
      //   1. Clear both fields atomically (setLastDroppedBlockId(null)
      //      + setLastDroppedRect(null)) so any pulse rendered between
      //      now and the 2-rAF measure doesn't have stale state to
      //      anchor at. Plus increment dropEpoch so the consumer's
      //      <DropPulseAtRect key={dropEpoch}> remounts cleanly.
      //   2. Wait 2 rAFs (React commit + browser layout per R2 F2).
      //   3. Set both fields atomically with the new blockId AND the
      //      freshly-measured rect — single state update batches the
      //      re-render so consumer never sees blockId-without-rect.
      setLastDroppedBlockId(null);
      setLastDroppedRect(null);
      // Wave 6 cf-20c-2 R2 F2 fix — re-measure the source NodeView at
      // its NEW grid position and store the rect so the consumer's
      // <DropPulseAtRect> mounts at the LANDED position per ADR-0017
      // D11 line 344. Pre-R2 the consumer used the snapshotted rect
      // (source's pre-drag position) — wrong per D11.
      //
      // Timing: setNodeMarkup synchronously advances the Tiptap
      // transaction; React schedules a re-render with the new
      // gridColumn inline style; the browser then runs layout to
      // resolve the new grid placement; only THEN does
      // getBoundingClientRect() return the landed rect. We need
      // TWO rAFs:
      //   - rAF 1: React commit cycle (NodeView re-renders with new attrs)
      //   - rAF 2: browser layout pass post-DOM-mutation
      // Single rAF is insufficient (verified empirically at cf-20c-2 R2:
      // probe with one rAF measured the pre-drop full-width rect, not
      // the post-drop half-width landed rect). Two rAFs is the
      // standard "wait for next paint" idiom in browser DnD code.
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
    clearLastDropped,
    setLastDroppedFromExternal,
  };
}
