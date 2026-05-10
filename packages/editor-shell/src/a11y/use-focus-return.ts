/**
 * @skb/editor-shell useFocusReturn — WCAG 2.4.3 focus snap-and-restore hook.
 *
 * Wave 6 cf-22 (2026-05-09) — generalizes the focus-snap-and-restore
 * pattern from `useEscCancel` (which has it inlined for the Esc-
 * cancel path). cf-22 keyboard-drag + keyboard-resize lifecycles
 * use this hook to ensure focus returns to the originating handle
 * button after any commit OR cancel.
 *
 * Per WCAG 2.4.3 (Focus Order, Level A): "If a Web page can be
 * navigated sequentially and the navigation sequences affect
 * meaning or operation, focusable components receive focus in an
 * order that preserves meaning and operability." The keyboard-mode
 * lifecycle moves focus AWAY from the handle button (window-level
 * arrow listeners take over); on terminal action, focus must return
 * to the handle so the user can re-activate the same control or
 * Tab to the next without losing place.
 *
 * Lifecycle:
 *   active: false → true  → snapshot document.activeElement
 *   active: true → false  → restore the snapshot via .focus()
 *
 * Caller may pass an explicit `restoreEl` to override the snapshot
 * (e.g. when the originating handle re-renders during the active
 * window and the snapshot DOM ref becomes stale; passing the live
 * ref is the safe path).
 */
import { useEffect, useRef } from 'react';

export interface UseFocusReturnOptions {
  /** True while the keyboard mode is active. */
  readonly active: boolean;
  /**
   * Optional explicit element to restore focus to (overrides the
   * `document.activeElement` snapshot). Used when the originating
   * handle's React ref is more reliable than the snapshot (e.g.
   * the handle re-rendered during keyboard-active window).
   */
  readonly restoreEl?: HTMLElement | null;
}

export function useFocusReturn(options: UseFocusReturnOptions): void {
  const { active, restoreEl } = options;
  const snapshotRef = useRef<HTMLElement | null>(null);
  const wasActiveRef = useRef(false);

  useEffect(() => {
    // Transition: false → true. Snapshot.
    if (active && !wasActiveRef.current) {
      const current = document.activeElement;
      snapshotRef.current = current instanceof HTMLElement ? current : null;
    }

    // Transition: true → false. Restore.
    if (!active && wasActiveRef.current) {
      const target = restoreEl ?? snapshotRef.current;
      // setTimeout(0) defers the focus call until after React's
      // current commit cycle finishes; otherwise the focus may
      // race a stale render that hasn't yet remounted the handle
      // (the handle's wrapper may re-render when keyboardActive
      // toggles). Using `requestAnimationFrame` would also work
      // but setTimeout(0) is more idiomatic for "after current
      // microtask" focus-restore.
      setTimeout(() => target?.focus(), 0);
      snapshotRef.current = null;
    }

    wasActiveRef.current = active;
  }, [active, restoreEl]);
}
