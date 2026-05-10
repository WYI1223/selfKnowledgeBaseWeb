/**
 * @skb/editor-shell useKeyboardResizeMode — keyboard-mode lifecycle
 * for the resize pipeline (cf-22).
 *
 * Wave 6 cf-22 (2026-05-09) — extracted from `use-resize-pipeline.ts`
 * to keep that file under the 500-LOC size-check hard limit. The
 * keyboard-mode useEffect listens for Arrow keys (snap-step via
 * `keyboardSnapStep` for right/corner colSpan; integer ±1 via
 * `keyboardRowStep` for bottom/corner rowSpan) + Enter (commits via
 * `tr.setNodeMarkup` + `buildResizeNextAttrs` axis-aware attr write).
 * Esc is handled by the parent's `useEscCancel({ dragActive:
 * keyboardActive })` wiring.
 *
 * Per cf-22 D3 separate-modes decision: this hook ONLY runs while
 * `keyboardActive === true`; pointer-mode `active` and keyboard-mode
 * `keyboardActive` are mutually exclusive.
 *
 * Per cf-22 D7: success-pulse on commit reuses the cf-20c-2 dropEpoch
 * infrastructure via the consumer-supplied `onCommitSuccess` callback
 * (the same callback the pointerup commit uses; per cf-20d D3 reuse
 * pattern).
 */
import {
  useEffect,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import type { Editor } from '@tiptap/core';
import {
  liveBlockPositions,
  snapshotBlocks,
} from '../drag-drop/pipeline-snapshot';
import {
  buildResizeNextAttrs,
  normalizeOverflowPosition,
} from './resize-snap';
import {
  keyboardRowStep,
  keyboardSnapStep,
} from '../a11y/keyboard-step';
import { colSpanToFraction } from './size-tooltip';
import type { ResizeAxis } from './resize-context';

function safeFraction(colSpan: number, totalCols: number): string {
  try {
    return colSpanToFraction(colSpan, totalCols);
  } catch {
    return `${colSpan}/${totalCols}`;
  }
}

export interface KeyboardResizeSnapshot {
  readonly blockId: string;
  readonly axis: ResizeAxis;
  readonly startCol: number;
  readonly startColSpan: number;
  readonly startRowSpanInt: number;
}

/**
 * Full ResizeSnapshot shape (mirrors the pointer-mode interface in
 * use-resize-pipeline.ts; kept structural-typed here so we don't
 * cross-import). Used by `startKeyboardResize` to populate
 * snapshotRef.current with the same shape pointermode uses.
 */
export interface FullResizeSnapshot extends KeyboardResizeSnapshot {
  readonly startRowSpanAttr: number | 'auto';
  readonly origin: { readonly x: number; readonly y: number };
  readonly containerWidth: number;
  readonly sourceRect: DOMRectReadOnly;
}

export interface StartKeyboardResizeOptions {
  readonly editor: Editor | null;
  readonly blockId: string;
  readonly axis: ResizeAxis;
  readonly gridSelector: string;
  readonly rowH: number;
  readonly gap: number;
  readonly active: boolean;
  readonly keyboardActive: boolean;
}

/**
 * Build the resize snapshot for keyboard-mode entry. Returns null
 * if the entry should be rejected (no editor / pointer mode active /
 * block not found / no live position / no DOM).
 *
 * Per cf-22 D3, rejects if EITHER pointer-mode `active` OR
 * keyboard-mode `keyboardActive` is already true (no mid-drag mode
 * bridge).
 */
export function startKeyboardResize(
  options: StartKeyboardResizeOptions,
): { snapshot: FullResizeSnapshot } | null {
  const { editor, blockId, axis, gridSelector, rowH, gap, active, keyboardActive } =
    options;
  if (!editor) return null;
  if (active || keyboardActive) return null;

  const blocks = snapshotBlocks(editor);
  const target = blocks.find((b) => b.id === blockId);
  if (!target) return null;
  const livePositions = liveBlockPositions(editor, blocks);
  const live = livePositions.get(blockId);
  if (!live) return null;
  const dom = editor.view.nodeDOM(live.pos);
  if (!(dom instanceof HTMLElement)) return null;
  const startRect = dom.getBoundingClientRect();
  const grid = document.querySelector(gridSelector);
  const containerWidth =
    grid instanceof HTMLElement
      ? grid.getBoundingClientRect().width
      : startRect.width;

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

  return {
    snapshot: {
      blockId,
      axis,
      startCol: target.col,
      startColSpan: target.colSpan,
      startRowSpanAttr,
      startRowSpanInt,
      origin: { x: 0, y: 0 },
      containerWidth,
      sourceRect: startRect,
    },
  };
}

export interface UseKeyboardResizeModeOptions {
  readonly keyboardActive: boolean;
  readonly editor: Editor | null;
  readonly snapshot: KeyboardResizeSnapshot | null;
  readonly snapColSpan: number | null;
  readonly snapRowSpan: number | null;
  readonly totalCols: number;
  readonly activeColSnaps: readonly number[];
  readonly setSnapColSpan: Dispatch<SetStateAction<number | null>>;
  readonly setSnapRowSpan: Dispatch<SetStateAction<number | null>>;
  readonly resetState: () => void;
  readonly onCommitSuccess:
    | ((blockId: string, liveRect: DOMRectReadOnly) => void)
    | undefined;
  // Mutated only as a side-channel when keyboard mode commits — kept
  // here so the parent doesn't need to expose its setSnapshot.
  readonly snapshotRef: MutableRefObject<unknown>;
  // R1 F1 — WCAG 4.1.3 announce callbacks.
  readonly onAnnounceChange:
    | ((axis: 'right' | 'bottom' | 'corner', colSpan: number, rowSpan: number, fraction: string) => void)
    | undefined;
  readonly onAnnounceCancel: (() => void) | undefined;
}

export function useKeyboardResizeMode(
  options: UseKeyboardResizeModeOptions,
): void {
  const {
    keyboardActive,
    editor,
    snapshot,
    snapColSpan,
    snapRowSpan,
    totalCols,
    activeColSnaps,
    setSnapColSpan,
    setSnapRowSpan,
    resetState,
    onCommitSuccess,
    onAnnounceChange,
    onAnnounceCancel,
  } = options;

  useEffect(() => {
    if (!keyboardActive) return;
    if (!editor || !snapshot) return;

    // R1 F1 — announce a step change for the current snap state.
    const announceStep = (
      colSpanForFraction: number,
      colSpanForState: number,
      rowSpanForState: number,
    ): void => {
      onAnnounceChange?.(
        snapshot.axis,
        colSpanForState,
        rowSpanForState,
        safeFraction(colSpanForFraction, totalCols),
      );
    };

    // R1 F3 — Tab commit / Shift+Tab cancel. Synchronous; no
    // preventDefault so browser advances focus naturally after our
    // commit/cancel runs.
    const runCancel = (): void => {
      onAnnounceCancel?.();
      resetState();
    };

    const runCommit = (): void => {
      const nextColSpan = snapColSpan ?? snapshot.startColSpan;
      const nextRowSpan = snapRowSpan ?? snapshot.startRowSpanInt;
      const colChanged = nextColSpan !== snapshot.startColSpan;
      const rowChanged = nextRowSpan !== snapshot.startRowSpanInt;
      const writeRowSpan =
        rowChanged && (snapshot.axis === 'bottom' || snapshot.axis === 'corner');
      const normalizedPosition = normalizeOverflowPosition(
        snapshot.startCol,
        snapshot.startColSpan,
        totalCols,
        activeColSnaps,
      );
      if (!colChanged && !writeRowSpan && normalizedPosition === null) {
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
      if (normalizedPosition !== null) {
        nextAttrDiff['col'] = normalizedPosition.col;
        nextAttrDiff['colSpan'] = normalizedPosition.colSpan;
      }
      editor
        .chain()
        .command(({ tr }) => {
          const node = tr.doc.nodeAt(live.pos);
          if (!node) return false;
          tr.setNodeMarkup(live.pos, undefined, {
            ...node.attrs,
            ...nextAttrDiff,
          });
          return true;
        })
        .run();
      announceStep(nextColSpan, nextColSpan, nextRowSpan);
      const blockId = snapshot.blockId;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const newBlocks = snapshotBlocks(editor);
          const newLive = liveBlockPositions(editor, newBlocks).get(blockId);
          if (!newLive) return;
          const dom = editor.view.nodeDOM(newLive.pos);
          if (dom instanceof HTMLElement) {
            onCommitSuccess?.(blockId, dom.getBoundingClientRect());
          }
        });
      });
      resetState();
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      const axis = snapshot.axis;
      const allowsCol = axis === 'right' || axis === 'corner';
      const allowsRow = axis === 'bottom' || axis === 'corner';

      // R1 F3 — Tab handling (NOT preventDefault; commit-or-cancel
      // synchronously; browser advances focus after).
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          runCancel();
        } else {
          runCommit();
        }
        return;
      }

      if (event.key === 'ArrowLeft' && allowsCol) {
        event.preventDefault();
        event.stopPropagation();
        const current = snapColSpan ?? snapshot.startColSpan;
        const next = keyboardSnapStep(current, 'left', activeColSnaps);
        setSnapColSpan(next);
        announceStep(next, next, snapRowSpan ?? snapshot.startRowSpanInt);
        return;
      }
      if (event.key === 'ArrowRight' && allowsCol) {
        event.preventDefault();
        event.stopPropagation();
        const current = snapColSpan ?? snapshot.startColSpan;
        const next = keyboardSnapStep(current, 'right', activeColSnaps);
        setSnapColSpan(next);
        announceStep(next, next, snapRowSpan ?? snapshot.startRowSpanInt);
        return;
      }
      if (event.key === 'ArrowUp' && allowsRow) {
        event.preventDefault();
        event.stopPropagation();
        const current = snapRowSpan ?? snapshot.startRowSpanInt;
        const next = keyboardRowStep(current, 'up');
        setSnapRowSpan(next);
        announceStep(snapColSpan ?? snapshot.startColSpan, snapColSpan ?? snapshot.startColSpan, next);
        return;
      }
      if (event.key === 'ArrowDown' && allowsRow) {
        event.preventDefault();
        event.stopPropagation();
        const current = snapRowSpan ?? snapshot.startRowSpanInt;
        const next = keyboardRowStep(current, 'down');
        setSnapRowSpan(next);
        announceStep(snapColSpan ?? snapshot.startColSpan, snapColSpan ?? snapshot.startColSpan, next);
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        runCommit();
        return;
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
    snapColSpan,
    snapRowSpan,
    totalCols,
    activeColSnaps,
    onCommitSuccess,
    onAnnounceChange,
    onAnnounceCancel,
    resetState,
    setSnapColSpan,
    setSnapRowSpan,
  ]);
}
