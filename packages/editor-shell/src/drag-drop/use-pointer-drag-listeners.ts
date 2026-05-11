/**
 * @skb/editor-shell usePointerDragListeners — extracted dragover /
 * drop window-listener useEffect for the pipeline's pointer mode.
 *
 * Wave 6 cf-24 (2026-05-10) — separated from `use-drag-drop-pipeline.ts`
 * to keep the pipeline file under the size-check 500 LOC hard cap.
 * Owns the full pointer-mode dragover + drop lifecycle: tiebreak →
 * activeMatch → commit (commitDropAtMatch for per-block, runExternalDropDispatch
 * for external) → state cleanup. cf-22 keyboard mode is in
 * `use-keyboard-drag-mode.ts`; this file handles ONLY pointer mode.
 */
import { useEffect } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Editor } from '@tiptap/core';
import { findMatches, tiebreak, type EdgeMatch } from './tiebreak';
import { computeEdgeRects, type EdgeRect } from './edge-rects';
import { commitDropAtMatch } from './commit-drop';
import {
  liveBlockPositions,
  type SerializedBlock,
} from './pipeline-snapshot';
import { runExternalDropDispatch } from './commit-external-drop';
import { isExternalDragSource } from './external-drop-source';
import type { LayoutAction } from './layout-reducer';
import type { BlockAffordanceKind } from '../registry-wire';

const VELOCITY_WINDOW_MS = 16;

export interface UsePointerDragListenersOptions {
  readonly active: boolean;
  readonly editor: Editor | null;
  readonly gridSelector: string;
  readonly activeMatch: EdgeMatch | null;
  readonly sourceBlockId: string | null;
  readonly totalCols: number;
  readonly snapshotRef: MutableRefObject<readonly SerializedBlock[]>;
  readonly blockRectsRef: MutableRefObject<Map<string, DOMRectReadOnly>>;
  readonly edgeRectsRef: MutableRefObject<readonly EdgeRect[]>;
  readonly lastCursorRef: MutableRefObject<{ x: number; y: number; t: number } | null>;
  readonly externalDragKindRef: MutableRefObject<BlockAffordanceKind | null>;
  readonly setActive: Dispatch<SetStateAction<boolean>>;
  readonly setActiveMatch: Dispatch<SetStateAction<EdgeMatch | null>>;
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

export function usePointerDragListeners(
  options: UsePointerDragListenersOptions,
): void {
  const {
    active,
    editor,
    gridSelector,
    activeMatch,
    sourceBlockId,
    totalCols,
    snapshotRef,
    blockRectsRef,
    edgeRectsRef,
    lastCursorRef,
    externalDragKindRef,
    setActive,
    setActiveMatch,
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

  // Reference computeEdgeRects so the import isn't dropped by tree-
  // shake; the actual edge-rect snapshot is owned by onDragStart in
  // the pipeline.
  void computeEdgeRects;

  useEffect(() => {
    if (!active) return;

    const handleDragOver = (event: DragEvent): void => {
      event.preventDefault();
      const x = event.clientX;
      const y = event.clientY;
      const last = lastCursorRef.current;
      const now = performance.now();
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
      const extKind = externalDragKindRef.current;
      if (extKind && winner) {
        // EdgeMatch.mode is always one of the 4 split-* values;
        // use the host's col as the move-announcement target.
        const host = snapshotRef.current.find((b) => b.id === winner.blockId);
        onAnnounceExternalMove?.(extKind, host?.col ?? 1, totalCols);
      }
    };

    const resetState = (): void => {
      setActive(false);
      setActiveMatch(null);
      setCursor(null);
      setSourceBlockId(null);
      externalDragKindRef.current = null;
    };

    const handleDrop = (event: DragEvent): void => {
      event.preventDefault();
      const winner = activeMatch;
      if (!editor || !winner || !sourceBlockId) {
        dispatchLayout({ type: 'drag-end-mode-none' });
        resetState();
        return;
      }
      // cf-24 — branch on external-source drag (PaletteSidebar).
      if (isExternalDragSource(sourceBlockId)) {
        const kind = externalDragKindRef.current;
        if (kind) {
          runExternalDropDispatch({
            editor,
            activeMatch: winner,
            kind,
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
      // Per-block path — UNCHANGED byte-for-byte from cf-22.
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
      setLastDroppedBlockId(null);
      setLastDroppedRect(null);
      if (didMutate) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const newLivePositions = liveBlockPositions(editor, snapshotRef.current);
            const newSourceLive = newLivePositions.get(sourceBlockId);
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
  }, [
    active,
    editor,
    gridSelector,
    activeMatch,
    sourceBlockId,
    totalCols,
    snapshotRef,
    blockRectsRef,
    edgeRectsRef,
    lastCursorRef,
    externalDragKindRef,
    setActive,
    setActiveMatch,
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
