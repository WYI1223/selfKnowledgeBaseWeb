/**
 * @skb/editor-shell useEscCancel — global Esc keydown subscription with drag-active priority.
 *
 * Per ADR-0017 D8 + Q8 absorbtion priority:
 *  - dragActive === true: preventDefault + stopPropagation + dispatch drag-end-cancel; native Esc behavior suppressed (textarea blur / Tiptap deselect blocked during drag)
 *  - dragActive === false: NO-OP (native Esc passthrough to Tiptap keymap / browser ESC)
 *  - drag-end (cancel OR success): restore prior focus snapshot taken at drag-start
 *
 * Hook owns the subscription (per ADR-0017 D8 line 296: editor-shell 全局 keydown listener with key === 'Escape').
 */
import { useEffect, useRef } from 'react';

export interface DragEndCancelAction {
  type: 'drag-end-cancel';
}

export type EscCancelDispatch = (action: DragEndCancelAction) => void;

export interface EscCancelOptions {
  dragActive: boolean;
  onCancel: () => void;
  restoreFocusEl?: HTMLElement | null;
}

type EscCancelInput = EscCancelDispatch | EscCancelOptions;

function activeElement(): HTMLElement | null {
  return document.activeElement instanceof HTMLElement ? document.activeElement : null;
}

function resolveDragActive(input: EscCancelInput, dragActive: boolean | undefined): boolean {
  return typeof input === 'function' ? dragActive === true : input.dragActive;
}

function resolveRestoreFocusEl(
  input: EscCancelInput,
  restoreFocusEl: HTMLElement | null | undefined,
): HTMLElement | null | undefined {
  return typeof input === 'function' ? restoreFocusEl : input.restoreFocusEl;
}

function resolveCancel(input: EscCancelInput): () => void {
  return typeof input === 'function'
    ? () => input({ type: 'drag-end-cancel' })
    : input.onCancel;
}

export function useEscCancel(
  dispatch: EscCancelDispatch,
  dragActive: boolean,
  restoreFocusEl?: HTMLElement | null,
): void;
export function useEscCancel(options: EscCancelOptions): void;
export function useEscCancel(
  input: EscCancelInput,
  dragActiveArg?: boolean,
  restoreFocusElArg?: HTMLElement | null,
): void {
  const dragActive = resolveDragActive(input, dragActiveArg);
  const explicitRestoreFocusEl = resolveRestoreFocusEl(input, restoreFocusElArg);
  const cancelRef = useRef<() => void>(() => undefined);
  const focusAtDragStartRef = useRef<HTMLElement | null>(null);
  const wasDragActiveRef = useRef(false);

  cancelRef.current = resolveCancel(input);

  useEffect(() => {
    if (dragActive && !wasDragActiveRef.current) {
      focusAtDragStartRef.current = explicitRestoreFocusEl ?? activeElement();
    }

    if (!dragActive && wasDragActiveRef.current) {
      const focusTarget = explicitRestoreFocusEl ?? focusAtDragStartRef.current;
      focusTarget?.focus();
      focusAtDragStartRef.current = null;
    }

    wasDragActiveRef.current = dragActive;
  }, [dragActive, explicitRestoreFocusEl]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Escape') return;
      if (!dragActive) return;

      event.preventDefault();
      event.stopPropagation();
      cancelRef.current();
    }

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [dragActive]);
}
