/**
 * @skb/editor-shell useKeyboardDragMode — keyboard-mode lifecycle
 * for the drag pipeline (cf-22 + R1 fixes).
 *
 * Wave 6 cf-22 (2026-05-09) — extracted from
 * `use-drag-drop-pipeline.ts` to keep that file under the 500-LOC
 * size-check hard limit. The keyboard-mode useEffect listens for
 * Arrow keys (R1 F2: GRID-COORDINATE movement via `keyboardGridStep`
 * + `keyboardGridRowStep`; pre-R1 used a synthetic pixel cursor +
 * pointer-mode tiebreak which was viewport-dependent) + Enter
 * (commits via `tr.setNodeMarkup` writing `{col, row}` directly,
 * NOT via tiebreak/applyDropMode which is pointer-edge-zone
 * semantics) + Tab/Shift+Tab (R1 F3: commit-or-cancel before browser
 * advances focus) + Esc (handled by parent's `useEscCancel`).
 *
 * Per cf-22 D3: keyboard mode is logically separate from pointer
 * mode; pointer-mode `active` and keyboard-mode `keyboardActive`
 * are mutually exclusive.
 *
 * Per cf-22 R1 F1: announce callbacks (`onAnnounceMove`,
 * `onAnnounceCommit`, `onAnnounceCancel`) are wired so the WCAG
 * 4.1.3 aria-live announcements actually fire on keyboard events.
 *
 * Per cf-22 D7: success-pulse on commit reuses the cf-20c-2
 * dropEpoch infrastructure via the parent's lastDropped setters.
 */
import {
  useEffect,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import type { Editor } from '@tiptap/core';
import {
  keyboardGridRowStep,
  keyboardGridStep,
} from '../a11y/keyboard-step';
import {
  liveBlockPositions,
  type SerializedBlock,
} from './pipeline-snapshot';
import type { LayoutAction } from './layout-reducer';

/**
 * R1 F2 — keyboard drag tracks grid coordinates `{col, row}` per
 * the source block, NOT a synthetic pixel cursor. The snapshot is
 * captured at start; arrow keys mutate `currentCol` / `currentRow`
 * via the pure step helpers.
 */
export interface KeyboardDragSnapshot {
  readonly blockId: string;
  readonly startCol: number;
  readonly startRow: number;
  readonly colSpan: number;
  readonly rowSpan: number;
  readonly hasRowAttr: boolean; // true if source block had explicit `row` attr
}

export interface UseKeyboardDragModeOptions {
  readonly keyboardActive: boolean;
  readonly editor: Editor | null;
  readonly snapshot: KeyboardDragSnapshot | null;
  readonly currentCol: number | null;
  readonly currentRow: number | null;
  readonly totalCols: number;
  readonly snapshotRef: MutableRefObject<readonly SerializedBlock[]>;
  readonly setKeyboardActive: Dispatch<SetStateAction<boolean>>;
  readonly setSourceBlockId: Dispatch<SetStateAction<string | null>>;
  readonly setKeyboardCol: Dispatch<SetStateAction<number | null>>;
  readonly setKeyboardRow: Dispatch<SetStateAction<number | null>>;
  readonly setKeyboardSnapshot: Dispatch<
    SetStateAction<KeyboardDragSnapshot | null>
  >;
  readonly dispatchLayout: Dispatch<LayoutAction>;
  readonly setLastDroppedBlockId: Dispatch<SetStateAction<string | null>>;
  readonly setLastDroppedRect: Dispatch<
    SetStateAction<DOMRectReadOnly | null>
  >;
  readonly setDropEpoch: Dispatch<SetStateAction<number>>;
  // R1 F1 — announce callbacks (WCAG 4.1.3).
  readonly onAnnounceMove:
    | ((blockKind: string, col: number, totalCols: number) => void)
    | undefined;
  readonly onAnnounceCommit:
    | ((blockKind: string, col: number) => void)
    | undefined;
  readonly onAnnounceCancel: (() => void) | undefined;
  // R2 F3 — Tab-originated commit/cancel signals useEscCancel to skip
  // focus restoration so browser's natural Tab focus advance wins.
  readonly markEscDeactivationReason:
    | ((reason: 'tab-commit' | 'tab-cancel') => void)
    | undefined;
}

export function useKeyboardDragMode(options: UseKeyboardDragModeOptions): void {
  const {
    keyboardActive,
    editor,
    snapshot,
    currentCol,
    currentRow,
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
  } = options;

  useEffect(() => {
    if (!keyboardActive) return;
    if (!editor || !snapshot) return;

    const cleanup = (): void => {
      setKeyboardActive(false);
      setSourceBlockId(null);
      setKeyboardCol(null);
      setKeyboardRow(null);
      setKeyboardSnapshot(null);
    };

    const findSourceBlockKind = (): string => {
      const block = snapshotRef.current.find((b) => b.id === snapshot.blockId);
      return block?.nodeName ?? 'block';
    };

    const commit = (): void => {
      const col = currentCol ?? snapshot.startCol;
      const row = currentRow ?? snapshot.startRow;
      const blockId = snapshot.blockId;
      // Resolve live PM position.
      const livePositions = liveBlockPositions(editor, snapshotRef.current);
      const live = livePositions.get(blockId);
      if (!live) {
        cleanup();
        return;
      }
      // Write {col, row?} directly; preserve colSpan/rowSpan.
      // R1 F2: grid-coord commit (NOT pointer-edge applyDropMode).
      const willChangeCol = col !== snapshot.startCol;
      const willChangeRow =
        snapshot.hasRowAttr && row !== snapshot.startRow;
      if (!willChangeCol && !willChangeRow) {
        // No-op commit — treat as cancel without firing pulse.
        dispatchLayout({ type: 'drag-end-cancel' });
        cleanup();
        return;
      }
      let didMutate = false;
      editor
        .chain()
        .command(({ tr }) => {
          const node = tr.doc.nodeAt(live.pos);
          if (!node) return false;
          const nextAttrs: Record<string, unknown> = {
            ...node.attrs,
            col,
          };
          // Only write `row` if the source had an explicit row attr;
          // for blocks that defaulted (no explicit row), leave it
          // undefined to preserve doc-order auto-row.
          if (snapshot.hasRowAttr) {
            nextAttrs['row'] = row;
          }
          tr.setNodeMarkup(live.pos, undefined, nextAttrs);
          didMutate = true;
          return true;
        })
        .run();
      if (!didMutate) {
        dispatchLayout({ type: 'drag-end-cancel' });
        cleanup();
        return;
      }
      // Build the mutation snapshot for layoutReducer.
      const reducerSnapshot = {
        blocks: snapshotRef.current.map((b) => {
          if (b.id === blockId) {
            return {
              col,
              ...(snapshot.hasRowAttr && { row }),
              colSpan: b.colSpan,
              rowSpan: b.rowSpan,
            };
          }
          return {
            col: b.col,
            ...(b.row !== undefined && { row: b.row }),
            colSpan: b.colSpan,
            rowSpan: b.rowSpan,
          };
        }),
      };
      dispatchLayout({
        type: 'drag-end-success',
        mutation: reducerSnapshot,
      });
      // Announce per WCAG 4.1.3.
      onAnnounceCommit?.(findSourceBlockKind(), col);
      // Success-pulse via cf-20c-2 R3 dropEpoch infrastructure.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const newLivePositions = liveBlockPositions(
            editor,
            snapshotRef.current,
          );
          const newSourceLive = newLivePositions.get(blockId);
          if (!newSourceLive) return;
          const dom = editor.view.nodeDOM(newSourceLive.pos);
          if (dom instanceof HTMLElement) {
            setLastDroppedBlockId(null);
            setLastDroppedRect(null);
            setLastDroppedBlockId(blockId);
            setLastDroppedRect(dom.getBoundingClientRect());
            setDropEpoch((prev) => prev + 1);
          }
        });
      });
      cleanup();
    };

    const cancel = (): void => {
      onAnnounceCancel?.();
      dispatchLayout({ type: 'drag-end-cancel' });
      cleanup();
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      // R1 F3 + R2 F3 — Tab/Shift+Tab: commit-or-cancel before browser
      // advances focus. We do NOT preventDefault so focus advances
      // naturally to the next/prev tabstop AFTER our synchronous
      // commit/cancel runs. R2 F3: signal useEscCancel to SKIP focus
      // restoration so the browser's natural Tab focus advance wins
      // (else the sibling useEscCancel hook restores focus to the
      // originating handle, undoing the Tab advance).
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          markEscDeactivationReason?.('tab-cancel');
          cancel();
        } else {
          markEscDeactivationReason?.('tab-commit');
          commit();
        }
        return;
      }
      // R1 F2 — arrow keys move grid coordinates directly.
      let nextCol = currentCol ?? snapshot.startCol;
      let nextRow = currentRow ?? snapshot.startRow;
      let moved = false;
      if (event.key === 'ArrowLeft') {
        nextCol = keyboardGridStep(nextCol, 'left', totalCols, snapshot.colSpan);
        moved = true;
      } else if (event.key === 'ArrowRight') {
        nextCol = keyboardGridStep(nextCol, 'right', totalCols, snapshot.colSpan);
        moved = true;
      } else if (event.key === 'ArrowUp') {
        nextRow = keyboardGridRowStep(nextRow, 'up');
        moved = true;
      } else if (event.key === 'ArrowDown') {
        nextRow = keyboardGridRowStep(nextRow, 'down');
        moved = true;
      } else if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        commit();
        return;
      } else {
        return; // Ignore other keys (Esc handled by useEscCancel).
      }
      if (moved) {
        event.preventDefault();
        event.stopPropagation();
        setKeyboardCol(nextCol);
        setKeyboardRow(nextRow);
        // Announce the new col (totalCols context tells AT users
        // where in the grid they are).
        onAnnounceMove?.(findSourceBlockKind(), nextCol, totalCols);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    keyboardActive,
    editor,
    snapshot,
    currentCol,
    currentRow,
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
  ]);
}
