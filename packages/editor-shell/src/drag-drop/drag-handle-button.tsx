/**
 * @skb/editor-shell drag-handle button — per-block drag handle rendered
 * inside `.skb-block-nodeview__gutter` (gutter shell shipped in cf-19).
 *
 * Wave 6 cf-20c-2 (2026-05-09) — fills the cf-19 gutter shell with a
 * functional drag-handle button per the v2 contract at
 * `/mnt/d/download/web/v2-styles.css:241-249` (`.gblock-gutter button`
 * 22×22 with `border + cursor: grab`). The button uses HTML5 native DnD
 * (Q7 spike result: native DnD survives ProseMirror inside
 * `contenteditable=false` gutter; verified at PLAN time). The drag
 * handlers are sourced from `useDragDropPipeline()` via React context
 * (`DragDropContext`) so the button stays presentational and the
 * lifecycle owner is the editor mount.
 *
 * The button:
 *   - emits `data-skb-drag-handle` (preserved from C.4-3 spec contract;
 *     the per-block handle now owns this attribute, replacing the
 *     standalone floating `<DragHandle />` component).
 *   - sets `aria-label="Drag block"` + `cursor: grab` for accessibility
 *     baseline (cf-22 keyboard a11y will add arrow-key + Enter/Esc
 *     keymap; cf-20c-2 ships pointer-only per Q7).
 *   - dispatches `dragstart` -> `pipeline.onDragStart(blockId)` so the
 *     pipeline can snapshot the grid + mount ghost + outline overlay.
 *   - calls `event.dataTransfer.setData('application/x-skb-block-id', blockId)`
 *     and `event.dataTransfer.effectAllowed = 'move'` so the browser
 *     accepts our DnD lifecycle. The mime is private to skb editor
 *     (avoids "text/plain" pollution that other handlers might pick up).
 *   - calls `event.stopPropagation()` so Tiptap's own NodeSelection
 *     dragstart logic doesn't compete (Q7 spike confirmed PM doesn't
 *     intercept by default, but an explicit stop is defense-in-depth).
 */
import {
  createElement,
  useContext,
  type DragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
} from 'react';
import { DragDropContext } from './drag-context';

export const DRAG_HANDLE_MIME = 'application/x-skb-block-id';

export interface DragHandleButtonProps {
  /** Stable block identifier sourced from ProseMirror node `pos` (per cf-20c-2 D2). */
  readonly blockId: string;
  /** Optional label override; defaults to "Drag block" for screen readers. */
  readonly label?: string;
}

export function DragHandleButton(props: DragHandleButtonProps): ReactElement {
  const { blockId, label = 'Drag block' } = props;
  const ctx = useContext(DragDropContext);

  const handleDragStart = (event: DragEvent<HTMLButtonElement>): void => {
    // Stop ProseMirror from interpreting this as a NodeSelection drag.
    event.stopPropagation();
    if (event.dataTransfer) {
      try {
        event.dataTransfer.setData(DRAG_HANDLE_MIME, blockId);
        event.dataTransfer.effectAllowed = 'move';
      } catch {
        // dataTransfer.setData throws in some test environments; fall
        // through — the pipeline still gets the dragstart callback.
      }
    }
    ctx?.onDragStart(blockId, { x: event.clientX, y: event.clientY });
  };

  const handleDragEnd = (event: DragEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    // dragEnd fires AFTER the drop event. The pipeline listens for drop
    // on the grid container and dispatches `drag-end-success` from
    // there; this handler exists to clean up the ghost / outline if
    // drop fired on a non-grid target (browser delivered dragEnd
    // without a corresponding drop, e.g. user released over the
    // browser chrome).
    ctx?.onDragEnd({ x: event.clientX, y: event.clientY });
  };

  // Wave 6 cf-22 (2026-05-09) — keyboard-mode drag entry per WCAG
  // 2.1.1. Enter/Space invokes ctx.onDragStartKeyboard(blockId) (NEW
  // context method); the pipeline snapshots the block + sets a
  // virtual cursor + flips state.keyboardActive = true. Window-level
  // Arrow listeners take over from there. Per cf-22 D3, the pointer
  // path (HTML5 native DnD) is SEPARATE — keyboard mode doesn't
  // interfere with the existing dragstart/dragend handlers above.
  // preventDefault stops the button's default click-on-Space behavior
  // (which would re-dispatch click → fire dragstart in some browsers).
  const handleKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (!ctx?.onDragStartKeyboard) return;
    event.preventDefault();
    event.stopPropagation();
    ctx.onDragStartKeyboard(blockId);
  };

  return createElement(
    'button',
    {
      type: 'button',
      className: 'skb-block-nodeview__drag-handle',
      'aria-label': label,
      'data-skb-drag-handle': blockId,
      draggable: true,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      onKeyDown: handleKeyDown,
    },
    // v2 contract glyph: '⋮⋮' (vertical-ellipsis pair) as a textual
    // grab affordance. SVG upgrade is cf-23+ (visual unification).
    '⋮⋮',
  );
}
