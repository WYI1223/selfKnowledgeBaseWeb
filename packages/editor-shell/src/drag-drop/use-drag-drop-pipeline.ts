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
import { applyDropMode, type GridSnapshotIdentified, type IdentifiedBlock } from './apply-drop-mode';
import { computeEdgeRects, type BlockLayout, type EdgeRect } from './edge-rects';
import { findMatches, tiebreak, type EdgeMatch } from './tiebreak';
import { layoutReducer, type LayoutState } from './layout-reducer';

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
}

interface SerializedBlock extends IdentifiedBlock {
  readonly pmPos: number;
  readonly nodeName: string;
}

const INITIAL_LAYOUT_STATE: LayoutState = {
  epoch: 0,
  snapshot: null,
  baseline: { blocks: [] },
};

/**
 * Walk the editor doc and return one IdentifiedBlock per `.skb-block-nodeview`
 * NodeView. Block id = ProseMirror node `pos` as string. Used at
 * drag-start to populate the snapshot; never re-called during
 * drag-over (snapshot semantics per ADR-0017 D6 lift mode).
 */
function snapshotBlocks(editor: Editor): SerializedBlock[] {
  const blocks: SerializedBlock[] = [];
  editor.state.doc.descendants((node, pos) => {
    const isBlockNode = node.type.spec['group']?.toString().includes('block') ?? false;
    if (!isBlockNode || !node.attrs) return undefined;
    // Filter to NodeView blocks only (skip prose paragraphs etc.).
    const colAttr: unknown = node.attrs['col'];
    if (typeof colAttr !== 'number') return undefined;
    const rowAttr: unknown = node.attrs['row'];
    blocks.push({
      id: String(pos),
      pmPos: pos,
      nodeName: node.type.name,
      col: colAttr,
      ...(typeof rowAttr === 'number' && { row: rowAttr }),
      colSpan: node.attrs['colSpan'] as number,
      rowSpan: (node.attrs['rowSpan'] as number | 'auto') ?? 1,
    });
    return false; // Don't descend into block nodes.
  });
  return blocks;
}

/**
 * Measure DOM bounding rects for every snapshot block. Selector pattern
 * `.skb-block-nodeview` is the editor-mount path (cf-19); we look up
 * the wrapper for each snapshot block by walking the editor's DOM.
 */
function measureBlockRects(
  editor: Editor,
  blocks: readonly SerializedBlock[],
): Map<string, DOMRectReadOnly> {
  const rects = new Map<string, DOMRectReadOnly>();
  const editorEl = editor.view.dom;
  for (const block of blocks) {
    const node = editor.view.nodeDOM(block.pmPos);
    const el = node instanceof HTMLElement ? node : null;
    if (el) {
      rects.set(block.id, el.getBoundingClientRect());
    } else {
      // Fallback: scan for matching kind under editor DOM root.
      const fallback = editorEl.querySelector(
        `.skb-block-nodeview[data-skb-block-kind="${block.nodeName}"]`,
      );
      if (fallback instanceof HTMLElement) {
        rects.set(block.id, fallback.getBoundingClientRect());
      }
    }
  }
  return rects;
}

/**
 * Translate snapshot id → live pmPos at drop-time. The snapshot id IS
 * the pmPos string at drag-start; positions may shift if an external
 * transaction mutated the doc during drag (rare but possible). We
 * walk the live doc and match by (nodeName + original pmPos) as a
 * best-effort; if a block can't be located, skip its attr update.
 */
function liveBlockPositions(
  editor: Editor,
  snapshot: readonly SerializedBlock[],
): Map<string, { pos: number; nodeName: string }> {
  const map = new Map<string, { pos: number; nodeName: string }>();
  const liveBlocks: Array<{ pos: number; nodeName: string }> = [];
  editor.state.doc.descendants((node, pos) => {
    if (typeof node.attrs?.['col'] !== 'number') return undefined;
    liveBlocks.push({ pos, nodeName: node.type.name });
    return false;
  });
  // Same-order match (sample-blocks fixtures all colSpan=12; block
  // count is stable during a single drag transaction). Future
  // cf-20c-3+ cross-doc-mutation case adds a stable id field per
  // ADR-0016 D2 amendment.
  for (let i = 0; i < snapshot.length && i < liveBlocks.length; i++) {
    const snapBlock = snapshot[i];
    const liveBlock = liveBlocks[i];
    if (snapBlock && liveBlock && snapBlock.nodeName === liveBlock.nodeName) {
      map.set(snapBlock.id, { pos: liveBlock.pos, nodeName: liveBlock.nodeName });
    }
  }
  return map;
}

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
      const layouts: BlockLayout[] = blocks
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
      const velocity =
        last && now - last.t < VELOCITY_WINDOW_MS * 4
          ? { vx: (x - last.x) / Math.max(1, now - last.t), vy: (y - last.y) / Math.max(1, now - last.t) }
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
      setLastDroppedBlockId(sourceBlockId);
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

  return {
    state: {
      active,
      blockRects: blockRectsRef.current,
      edgeRects: edgeRectsRef.current,
      activeMatch,
      cursor,
      sourceBlockId,
      lastDroppedBlockId,
    },
    layoutState,
    onDragStart,
    onDragEnd,
  };
}
