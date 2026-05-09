/**
 * @skb/editor-shell useKeyboardDragMode — keyboard-mode lifecycle
 * for the drag pipeline (cf-22).
 *
 * Wave 6 cf-22 (2026-05-09) — extracted from
 * `use-drag-drop-pipeline.ts` to keep that file under the 500-LOC
 * size-check hard limit. The keyboard-mode useEffect listens for
 * Arrow keys (synthesizes cursor moves through the existing
 * edge-rect/tiebreak machinery) + Enter (commits via the SAME
 * commitDropAtMatch path as pointer drop). Esc is handled by the
 * parent's `useEscCancel` wiring on `state.keyboardActive`.
 *
 * Per cf-22 D3 separate-modes decision: this hook ONLY runs while
 * `keyboardActive === true`; pointer-mode `active` and keyboard-
 * mode `keyboardActive` are mutually exclusive.
 *
 * Per cf-22 D7: success-pulse on commit reuses the same dropEpoch
 * infrastructure as pointer-drop + cf-20d resize-commit + cf-20e
 * duplicate (the canonical "rapid-action animation isolation"
 * pattern; cf-22 keyboard commit is the 4th action).
 */
import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { Editor } from '@tiptap/core';
import { commitDropAtMatch } from './commit-drop';
import type { EdgeRect } from './edge-rects';
import {
  liveBlockPositions,
  type SerializedBlock,
} from './pipeline-snapshot';
import { findMatches, tiebreak, type EdgeMatch } from './tiebreak';
import type { LayoutAction } from './layout-reducer';

const KEYBOARD_STEP_PX = 60; // ~1 grid cell (12-col @ 1200px container ≈ 87px/col; 60 is conservative).

export interface UseKeyboardDragModeOptions {
  readonly keyboardActive: boolean;
  readonly editor: Editor | null;
  readonly activeMatch: EdgeMatch | null;
  readonly sourceBlockId: string | null;
  readonly snapshotRef: MutableRefObject<readonly SerializedBlock[]>;
  readonly blockRectsRef: MutableRefObject<Map<string, DOMRectReadOnly>>;
  readonly edgeRectsRef: MutableRefObject<readonly EdgeRect[]>;
  readonly lastCursorRef: MutableRefObject<{
    x: number;
    y: number;
    t: number;
  } | null>;
  readonly dispatchLayout: Dispatch<LayoutAction>;
  readonly setKeyboardActive: Dispatch<SetStateAction<boolean>>;
  readonly setActiveMatch: Dispatch<SetStateAction<EdgeMatch | null>>;
  readonly setCursor: Dispatch<
    SetStateAction<{ x: number; y: number } | null>
  >;
  readonly setSourceBlockId: Dispatch<SetStateAction<string | null>>;
  readonly setLastDroppedBlockId: Dispatch<SetStateAction<string | null>>;
  readonly setLastDroppedRect: Dispatch<
    SetStateAction<DOMRectReadOnly | null>
  >;
  readonly setDropEpoch: Dispatch<SetStateAction<number>>;
}

export function useKeyboardDragMode(options: UseKeyboardDragModeOptions): void {
  const {
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
  } = options;

  useEffect(() => {
    if (!keyboardActive) return;
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      const last = lastCursorRef.current;
      if (!last) return;
      let dx = 0;
      let dy = 0;
      if (event.key === 'ArrowLeft') dx = -KEYBOARD_STEP_PX;
      else if (event.key === 'ArrowRight') dx = KEYBOARD_STEP_PX;
      else if (event.key === 'ArrowUp') dy = -KEYBOARD_STEP_PX;
      else if (event.key === 'ArrowDown') dy = KEYBOARD_STEP_PX;
      else if (event.key === 'Enter') {
        // Commit via the same path as pointer drop.
        event.preventDefault();
        event.stopPropagation();
        const winner = activeMatch;
        if (!winner || !sourceBlockId) {
          dispatchLayout({ type: 'drag-end-mode-none' });
          setKeyboardActive(false);
          setActiveMatch(null);
          setCursor(null);
          setSourceBlockId(null);
          return;
        }
        const result = commitDropAtMatch(
          editor,
          winner,
          sourceBlockId,
          snapshotRef.current,
        );
        if (result.mutation === null) {
          dispatchLayout({ type: 'drag-end-mode-none' });
        } else {
          const reducerSnapshot = {
            blocks: result.mutation.blocks.map((b) => ({
              col: b.col,
              ...(b.row !== undefined && { row: b.row }),
              colSpan: b.colSpan,
              rowSpan: b.rowSpan,
            })),
          };
          dispatchLayout({
            type: 'drag-end-success',
            mutation: reducerSnapshot,
          });
          // Fire success-pulse via the existing dropEpoch
          // infrastructure (cf-22 D7 reuse — 4th action).
          if (result.didMutate) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                const newLivePositions = liveBlockPositions(
                  editor,
                  snapshotRef.current,
                );
                const newSourceLive = newLivePositions.get(sourceBlockId);
                if (!newSourceLive) return;
                const dom = editor.view.nodeDOM(newSourceLive.pos);
                if (dom instanceof HTMLElement) {
                  setLastDroppedBlockId(null);
                  setLastDroppedRect(null);
                  setLastDroppedBlockId(sourceBlockId);
                  setLastDroppedRect(dom.getBoundingClientRect());
                  setDropEpoch((prev) => prev + 1);
                }
              });
            });
          }
        }
        setKeyboardActive(false);
        setActiveMatch(null);
        setCursor(null);
        setSourceBlockId(null);
        return;
      } else {
        return; // Ignore other keys (Esc handled by useEscCancel).
      }
      // Arrow key path: synthesize cursor move + recompute tiebreak.
      event.preventDefault();
      event.stopPropagation();
      const newX = last.x + dx;
      const newY = last.y + dy;
      const now = performance.now();
      lastCursorRef.current = { x: newX, y: newY, t: now };
      setCursor({ x: newX, y: newY });
      const matches = findMatches(
        newX,
        newY,
        [...edgeRectsRef.current],
        blockRectsRef.current,
      );
      // Zero velocity (keyboard moves are discrete; tiebreak falls
      // back to spatial order).
      const winner = tiebreak(matches, { vx: 0, vy: 0 });
      setActiveMatch(winner);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [keyboardActive, editor, activeMatch, sourceBlockId]);
}
