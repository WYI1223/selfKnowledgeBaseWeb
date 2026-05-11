/**
 * @skb/editor-shell usePointerDragListeners — extracted dragover /
 * drop window-listener useEffect for the pipeline's pointer mode.
 *
 * Wave 7 Phase 2B.2 (ADR-0020 D2) — cuts over from tiebreak/edge-rects
 * 4-mode classification to cursor → grid-coord + grid-engine
 * `inferDropIntent` hole-fill placement. The host block is NEVER
 * shrunk; on-drop calls `commitMoveAtCursor` (per-block) or
 * `runExternalDropDispatch` (palette insert).
 */
import { useEffect } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Editor } from '@tiptap/core';
import type { DropIntent } from '@skb/grid-engine';
import {
  commitMoveAtCursor,
  cursorToEngineCoord,
  intentForInsert,
  intentForMove,
  toEngineState,
} from './grid-engine-adapter';
import {
  liveBlockPositions,
  type SerializedBlock,
} from './pipeline-snapshot';
import { runExternalDropDispatch } from './commit-external-drop';
import { isExternalDragSource } from './external-drop-source';
import type { LayoutAction } from './layout-reducer';
import type { BlockAffordanceKind } from '../registry-wire';

export interface UsePointerDragListenersOptions {
  readonly active: boolean;
  readonly editor: Editor | null;
  readonly gridSelector: string;
  readonly activeIntent: DropIntent | null;
  readonly sourceBlockId: string | null;
  readonly totalCols: number;
  readonly snapshotRef: MutableRefObject<readonly SerializedBlock[]>;
  readonly blockRectsRef: MutableRefObject<Map<string, DOMRectReadOnly>>;
  readonly externalDragKindRef: MutableRefObject<BlockAffordanceKind | null>;
  readonly setActive: Dispatch<SetStateAction<boolean>>;
  readonly setActiveIntent: Dispatch<SetStateAction<DropIntent | null>>;
  readonly setCursor: Dispatch<SetStateAction<{ x: number; y: number } | null>>;
  readonly setSourceBlockId: Dispatch<SetStateAction<string | null>>;
  readonly setLastDroppedBlockId: Dispatch<SetStateAction<string | null>>;
  readonly setLastDroppedRect: Dispatch<SetStateAction<DOMRectReadOnly | null>>;
  readonly setDropEpoch: Dispatch<SetStateAction<number>>;
  readonly dispatchLayout: (action: LayoutAction) => void;
  readonly onAnnounceCommit?: ((blockKind: string, col: number) => void) | undefined;
  readonly onAnnounceExternalMove?:
    | ((blockKind: string, col: number, totalCols: number) => void)
    | undefined;
  readonly onAnnounceExternalCommit?:
    | ((blockKind: string, col: number) => void)
    | undefined;
}

/**
 * Read grid container's pixel geometry from CSS custom props.
 * `.skb-grid` declares `--row-h` and `--gap` per ADR-0016 D5.
 * Returns the cursor → coord conversion params (`oneFrPx`, `rowPx`)
 * + the container's bounding rect, or null if grid not in DOM yet.
 */
function readGridGeometry(
  gridEl: Element,
  totalCols: number,
): { rect: DOMRect; oneFrPx: number; rowPx: number } | null {
  const rect = gridEl.getBoundingClientRect();
  const style = getComputedStyle(gridEl);
  const rowH = parseFloat(style.getPropertyValue('--row-h')) || 48;
  const gap = parseFloat(style.getPropertyValue('--gap')) || 14;
  const rowPx = rowH + gap;
  // 1 fr = (containerWidth - (totalCols - 1) * gap) / totalCols; one
  // column's pixel pitch = 1fr + gap (i.e., total / totalCols ≈ rect.width / totalCols).
  const oneFrPx = (rect.width + gap) / totalCols;
  return { rect, oneFrPx, rowPx };
}

export function usePointerDragListeners(
  options: UsePointerDragListenersOptions,
): void {
  const {
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
  } = options;

  // Reference blockRectsRef to keep the existing snapshot contract
  // (the pipeline measures + stores rects at drag-start; we don't
  // consume them in the new model since the cursor-coord path
  // doesn't need per-block rect data, but the snapshot ref is still
  // exposed for overlay rendering by consumers).
  void blockRectsRef;

  useEffect(() => {
    if (!active) return;

    const grid = document.querySelector(gridSelector);
    if (!grid) return;

    const handleDragOver = (event: DragEvent): void => {
      event.preventDefault();
      const x = event.clientX;
      const y = event.clientY;
      setCursor({ x, y });
      const geo = readGridGeometry(grid, totalCols);
      if (!geo) return;
      const { col, row } = cursorToEngineCoord(x, y, geo.rect, geo.oneFrPx, geo.rowPx);
      const { state } = toEngineState(snapshotRef.current);
      const extKind = externalDragKindRef.current;
      let intent: DropIntent;
      if (extKind) {
        intent = intentForInsert(state, nodeNameToKindLocal(extKind), col, row);
        if (intent.intent === 'place') {
          onAnnounceExternalMove?.(extKind, intent.col + 1, totalCols);
        }
      } else if (sourceBlockId) {
        const result = intentForMove(state, sourceBlockId, col, row);
        if (!result) {
          setActiveIntent(null);
          return;
        }
        intent = result;
      } else {
        return;
      }
      setActiveIntent(intent);
    };

    const resetState = (): void => {
      setActive(false);
      setActiveIntent(null);
      setCursor(null);
      setSourceBlockId(null);
      externalDragKindRef.current = null;
    };

    const handleDrop = (event: DragEvent): void => {
      event.preventDefault();
      if (!editor || !sourceBlockId) {
        dispatchLayout({ type: 'drag-end-mode-none' });
        resetState();
        return;
      }
      const geo = readGridGeometry(grid, totalCols);
      if (!geo) {
        dispatchLayout({ type: 'drag-end-mode-none' });
        resetState();
        return;
      }
      const { col, row } = cursorToEngineCoord(
        event.clientX,
        event.clientY,
        geo.rect,
        geo.oneFrPx,
        geo.rowPx,
      );

      // External-source (palette) drop branches into commitExternalDrop.
      if (isExternalDragSource(sourceBlockId)) {
        const kind = externalDragKindRef.current;
        if (kind) {
          runExternalDropDispatch({
            editor,
            kind,
            cursorCol: col,
            cursorRow: row,
            preInsertSnapshot: snapshotRef.current,
            dispatchLayout,
            setLastDroppedBlockId,
            setLastDroppedRect,
            setDropEpoch,
            onAnnounceExternalCommit,
          });
        } else {
          dispatchLayout({ type: 'drag-end-mode-none' });
        }
        resetState();
        return;
      }

      // Per-block move path.
      const result = commitMoveAtCursor(
        editor,
        snapshotRef.current,
        sourceBlockId,
        col,
        row,
      );
      if (!result.mutation) {
        dispatchLayout({ type: 'drag-end-mode-none' });
        resetState();
        return;
      }
      // Reducer-friendly snapshot (1-based editor coords).
      dispatchLayout({
        type: 'drag-end-success',
        mutation: {
          blocks: result.mutation.blocks.map((b) => ({
            col: b.col + 1,
            row: b.row + 1,
            colSpan: b.colSpan,
            rowSpan: b.rowSpan,
          })),
        },
      });
      if (result.didMutate) {
        const sourceMutation = result.mutation.blocks.find((b) => b.id === sourceBlockId);
        const sourceSnapBlock = snapshotRef.current.find((b) => b.id === sourceBlockId);
        if (sourceMutation && sourceSnapBlock) {
          onAnnounceCommit?.(sourceSnapBlock.nodeName, sourceMutation.col + 1);
        }
        // Pulse rect: 2 rAFs after setNodeMarkup commits.
        setLastDroppedBlockId(null);
        setLastDroppedRect(null);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const newLive = liveBlockPositions(editor, snapshotRef.current);
            const newSourceLive = newLive.get(sourceBlockId);
            if (!newSourceLive) return;
            const dom = editor.view.nodeDOM(newSourceLive.pos);
            if (dom instanceof HTMLElement) {
              setLastDroppedBlockId(sourceBlockId);
              setLastDroppedRect(dom.getBoundingClientRect());
              setDropEpoch((prev) => prev + 1);
            }
          });
        });
      }
      resetState();
    };

    grid.addEventListener('dragover', handleDragOver as EventListener);
    grid.addEventListener('drop', handleDrop as EventListener);
    return () => {
      grid.removeEventListener('dragover', handleDragOver as EventListener);
      grid.removeEventListener('drop', handleDrop as EventListener);
    };
  }, [
    active,
    editor,
    gridSelector,
    activeIntent,
    sourceBlockId,
    totalCols,
    snapshotRef,
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
  ]);
}

function nodeNameToKindLocal(nodeName: string): import('@skb/grid-engine').BlockKind {
  switch (nodeName) {
    case 'markdown':
    case 'image':
    case 'code':
    case 'callout':
    case 'math':
    case 'pdf':
    case 'jupyter':
    case 'nn-viz':
    case 'agent-flow':
      return nodeName;
    case 'componentCode':
      return 'code';
    default:
      return 'markdown';
  }
}
