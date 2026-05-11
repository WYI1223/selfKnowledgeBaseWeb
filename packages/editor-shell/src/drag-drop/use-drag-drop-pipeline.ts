/**
 * @skb/editor-shell useDragDropPipeline — drag/drop lifecycle owner.
 *
 * Wave 7 Phase 2B.2 (ADR-0020 D2) — cuts over from cf-20c-1's
 * `applyDropMode` 4-mode algebra to `@skb/grid-engine` ops. Tracks an
 * `activeIntent: DropIntent` (cursor → grid-coord → hole-fill) instead
 * of an `activeMatch: EdgeMatch`. The host block is NEVER shrunk; the
 * dragged block goes to its inferred hole-fill anchor, gravity
 * collapses (ADR-0020 D3 Option A).
 *
 * Pointer + keyboard modes stay separate (cf-22 D3). Both share the
 * engine-backed commit path via the grid-engine adapter.
 */
import { useCallback, useReducer, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import type { DropIntent } from '@skb/grid-engine';
import { layoutReducer, type LayoutState } from './layout-reducer';
import {
  measureBlockRects,
  snapshotBlocks,
  type SerializedBlock,
} from './pipeline-snapshot';
import { useExternalDragStart } from './use-external-drag-start';
import { usePointerDragListeners } from './use-pointer-drag-listeners';
import type { BlockAffordanceKind } from '../registry-wire';
import {
  useKeyboardDragMode,
  type KeyboardDragSnapshot,
} from './keyboard-drag-mode';

export interface PipelineDragState {
  /** True from drag-start until drag-end (success / cancel / mode-none). */
  readonly active: boolean;
  /** True while keyboard-mode drag active (mutually exclusive with `active`). */
  readonly keyboardActive: boolean;
  /** Per-block id → bounding rect snapshot taken at drag-start. */
  readonly blockRects: Map<string, DOMRectReadOnly>;
  /**
   * Wave 7 Phase 2B.2 — current drop intent inferred from the cursor's
   * grid coord (replaces the pre-2B.2 EdgeMatch + 4-mode classification).
   * `null` until the first dragover fires.
   */
  readonly activeIntent: DropIntent | null;
  /** Cursor position (for DragGhost following). */
  readonly cursor: { readonly x: number; readonly y: number } | null;
  /** Source block being dragged. */
  readonly sourceBlockId: string | null;
  /** Block ID that received the most recent drop (for DropPulse). */
  readonly lastDroppedBlockId: string | null;
  /** Bounding rect of source NodeView at POST-DROP landed position. */
  readonly lastDroppedRect: DOMRectReadOnly | null;
  /** Monotonic dropEpoch for animation isolation across rapid drops. */
  readonly dropEpoch: number;
  /** Keyboard-mode current grid `col` (1-based editor coord). */
  readonly keyboardCol: number | null;
  /** Keyboard-mode current grid `row` (1-based editor coord). */
  readonly keyboardRow: number | null;
}

export interface UseDragDropPipelineOptions {
  readonly editor: Editor | null;
  readonly gridSelector?: string;
  readonly totalCols?: number;
  readonly onAnnounceMove?: (blockKind: string, col: number, totalCols: number) => void;
  readonly onAnnounceCommit?: (blockKind: string, col: number) => void;
  readonly onAnnounceCancel?: () => void;
  readonly markEscDeactivationReason?: (reason: 'tab-commit' | 'tab-cancel') => void;
  readonly onAnnounceExternalMove?: (
    blockKind: string,
    col: number,
    totalCols: number,
  ) => void;
  readonly onAnnounceExternalCommit?: (blockKind: string, col: number) => void;
}

export interface UseDragDropPipelineReturn {
  readonly state: PipelineDragState;
  readonly layoutState: LayoutState;
  readonly onDragStart: (blockId: string, origin: { x: number; y: number }) => void;
  readonly onDragEnd: (origin: { x: number; y: number }) => void;
  readonly onDragStartKeyboard: (blockId: string) => void;
  readonly onDragStartExternal: (
    kind: BlockAffordanceKind,
    origin: { x: number; y: number },
  ) => void;
  readonly clearLastDropped: () => void;
  readonly setLastDroppedFromExternal: (blockId: string, rect: DOMRectReadOnly) => void;
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
    markEscDeactivationReason,
    onAnnounceExternalMove,
    onAnnounceExternalCommit,
  } = options;

  const [layoutState, dispatchLayout] = useReducer(layoutReducer, INITIAL_LAYOUT_STATE);
  const [active, setActive] = useState(false);
  const [keyboardActive, setKeyboardActive] = useState(false);
  const [keyboardCol, setKeyboardCol] = useState<number | null>(null);
  const [keyboardRow, setKeyboardRow] = useState<number | null>(null);
  const [keyboardSnapshot, setKeyboardSnapshot] =
    useState<KeyboardDragSnapshot | null>(null);
  const [activeIntent, setActiveIntent] = useState<DropIntent | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [sourceBlockId, setSourceBlockId] = useState<string | null>(null);
  const [lastDroppedBlockId, setLastDroppedBlockId] = useState<string | null>(null);
  const [lastDroppedRect, setLastDroppedRect] = useState<DOMRectReadOnly | null>(null);
  const [dropEpoch, setDropEpoch] = useState(0);

  const snapshotRef = useRef<readonly SerializedBlock[]>([]);
  const blockRectsRef = useRef<Map<string, DOMRectReadOnly>>(new Map());
  const externalDragKindRef = useRef<BlockAffordanceKind | null>(null);

  const onDragStart = useCallback(
    (blockId: string, origin: { x: number; y: number }) => {
      if (!editor) return;
      const blocks = snapshotBlocks(editor);
      const rects = measureBlockRects(editor, blocks);

      snapshotRef.current = blocks;
      blockRectsRef.current = rects;

      dispatchLayout({ type: 'drag-start', sourceBlockId: blockId });
      setSourceBlockId(blockId);
      setCursor({ x: origin.x, y: origin.y });
      setActive(true);
      setActiveIntent(null);
    },
    [editor],
  );

  const onDragEnd = useCallback(() => {
    if (active || keyboardActive) {
      onAnnounceCancel?.();
      dispatchLayout({ type: 'drag-end-cancel' });
      setActive(false);
      setKeyboardActive(false);
      setKeyboardCol(null);
      setKeyboardRow(null);
      setKeyboardSnapshot(null);
      setActiveIntent(null);
      setCursor(null);
      setSourceBlockId(null);
      externalDragKindRef.current = null;
    }
  }, [active, keyboardActive, onAnnounceCancel]);

  const onDragStartExternal = useExternalDragStart({
    editor,
    snapshotRef,
    blockRectsRef,
    externalDragKindRef,
    dispatchLayout,
    setSourceBlockId,
    setCursor,
    setActive,
    setActiveIntent,
  });

  // Keyboard-mode entry (cf-22 R1 F2). Snapshots {col, row, colSpan,
  // rowSpan} per ADR-0017 D13 keyboard-parity contract. Wave 7
  // Phase 2B.2: edge-rects compute dropped (was only used by the
  // pre-cutover OutlineOverlay rendering; the new outline uses the
  // activeIntent directly).
  const onDragStartKeyboard = useCallback(
    (blockId: string) => {
      if (!editor) return;
      if (active || keyboardActive) return;
      const blocks = snapshotBlocks(editor);
      const rects = measureBlockRects(editor, blocks);
      const sourceBlock = blocks.find((b) => b.id === blockId);
      if (!sourceBlock) return;

      const startRow = typeof sourceBlock.row === 'number' ? sourceBlock.row : 1;
      const hasRowAttr = sourceBlock.row !== undefined;
      const newSnapshot: KeyboardDragSnapshot = {
        blockId,
        startCol: sourceBlock.col,
        startRow,
        colSpan: sourceBlock.colSpan,
        rowSpan: sourceBlock.rowSpan,
        hasRowAttr,
      };

      snapshotRef.current = blocks;
      blockRectsRef.current = rects;

      dispatchLayout({ type: 'drag-start', sourceBlockId: blockId });
      setSourceBlockId(blockId);
      setKeyboardSnapshot(newSnapshot);
      setKeyboardCol(sourceBlock.col);
      setKeyboardRow(startRow);
      setKeyboardActive(true);
      setActiveIntent(null);
      setCursor(null);
    },
    [editor, active, keyboardActive],
  );

  usePointerDragListeners({
    active,
    editor,
    gridSelector,
    activeIntent,
    sourceBlockId,
    totalCols,
    snapshotRef,
    blockRectsRef,
    externalDragKindRef,
    setActive,
    setActiveIntent,
    setCursor,
    setSourceBlockId,
    setLastDroppedBlockId,
    setLastDroppedRect,
    setDropEpoch,
    dispatchLayout,
    onAnnounceCommit,
    onAnnounceExternalMove,
    onAnnounceExternalCommit,
  });

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
    markEscDeactivationReason,
  });

  const clearLastDropped = useCallback(() => {
    setLastDroppedBlockId(null);
    setLastDroppedRect(null);
  }, []);

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
      activeIntent,
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
    onDragStartExternal,
    clearLastDropped,
    setLastDroppedFromExternal,
  };
}
