/**
 * @skb/editor-shell useEscCancel — global Esc keydown subscription with drag-active priority.
 *
 * Per ADR-0017 D8 + Q8 absorbtion priority:
 *  - dragActive === true: preventDefault + stopPropagation + dispatch drag-end-cancel; native Esc behavior suppressed (textarea blur / Tiptap deselect blocked during drag)
 *  - dragActive === false: NO-OP (native Esc passthrough to Tiptap keymap / browser ESC)
 *  - drag-end (cancel OR success): restore prior focus snapshot taken at drag-start
 *    UNLESS the deactivation reason is `tab-commit` / `tab-cancel` —
 *    then SKIP focus restoration so the browser's natural Tab focus
 *    advance (which already happened) is preserved (cf-22 R2 F3 fix).
 *
 * Hook owns the subscription (per ADR-0017 D8 line 296: editor-shell 全局 keydown listener with key === 'Escape').
 *
 * Cf-22 R2 F3 reason flag:
 * - Default deactivation reason = `'esc-cancel' | 'commit' | 'pointer-up'`
 *   → restore focus to originating handle.
 * - Reason `'tab-commit' | 'tab-cancel'` → DO NOT restore focus; the
 *   browser's natural Tab focus advance is preserved.
 *
 * The consumer signals reason via a ref the hook owns (see
 * `EscCancelHandle.markDeactivationReason`). Default reason is
 * `'esc-cancel'` (the hook's primary purpose) so callers that don't
 * mark a reason behave exactly as pre-R2.
 */
import { useEffect, useMemo, useRef } from 'react';

export interface DragEndCancelAction {
  type: 'drag-end-cancel';
}

export type EscCancelDispatch = (action: DragEndCancelAction) => void;

/**
 * Reason for the `dragActive: true → false` flip. Default is
 * `'esc-cancel'`. `tab-commit` / `tab-cancel` SKIP focus restoration so
 * the browser's natural Tab focus advance is preserved (cf-22 R2 F3).
 */
export type EscDeactivationReason =
  | 'esc-cancel'
  | 'commit'
  | 'pointer-up'
  | 'tab-commit'
  | 'tab-cancel';

/**
 * Returned from useEscCancel; consumer calls `markDeactivationReason`
 * RIGHT BEFORE flipping dragActive to false in response to a Tab
 * keydown so the hook skips focus restoration on the next deactivation.
 * Reason is consumed (one-shot) and reset to `'esc-cancel'` after the
 * deactivation effect runs.
 */
export interface EscCancelHandle {
  readonly markDeactivationReason: (reason: EscDeactivationReason) => void;
}

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
): EscCancelHandle;
export function useEscCancel(options: EscCancelOptions): EscCancelHandle;
export function useEscCancel(
  input: EscCancelInput,
  dragActiveArg?: boolean,
  restoreFocusElArg?: HTMLElement | null,
): EscCancelHandle {
  const dragActive = resolveDragActive(input, dragActiveArg);
  const explicitRestoreFocusEl = resolveRestoreFocusEl(input, restoreFocusElArg);
  const cancelRef = useRef<() => void>(() => undefined);
  const focusAtDragStartRef = useRef<HTMLElement | null>(null);
  const wasDragActiveRef = useRef(false);
  const reasonRef = useRef<EscDeactivationReason>('esc-cancel');

  cancelRef.current = resolveCancel(input);

  useEffect(() => {
    if (dragActive && !wasDragActiveRef.current) {
      focusAtDragStartRef.current = explicitRestoreFocusEl ?? activeElement();
    }

    if (!dragActive && wasDragActiveRef.current) {
      const reason = reasonRef.current;
      // R2 F3 — Tab-originated deactivations preserve the browser's
      // natural focus advance (which already happened by the time we
      // see the dragActive flip). Esc / Enter / pointer-up restore
      // focus to the originating handle as before.
      if (reason !== 'tab-commit' && reason !== 'tab-cancel') {
        const focusTarget = explicitRestoreFocusEl ?? focusAtDragStartRef.current;
        focusTarget?.focus();
      }
      focusAtDragStartRef.current = null;
      // One-shot: reset reason to default for next cycle.
      reasonRef.current = 'esc-cancel';
    }

    wasDragActiveRef.current = dragActive;
  }, [dragActive, explicitRestoreFocusEl]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Escape') return;
      if (!dragActive) return;

      event.preventDefault();
      event.stopPropagation();
      // Esc-originated cancel → default reason already 'esc-cancel'.
      reasonRef.current = 'esc-cancel';
      cancelRef.current();
    }

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [dragActive]);

  return useMemo<EscCancelHandle>(
    () => ({
      markDeactivationReason(reason: EscDeactivationReason): void {
        reasonRef.current = reason;
      },
    }),
    [],
  );
}
