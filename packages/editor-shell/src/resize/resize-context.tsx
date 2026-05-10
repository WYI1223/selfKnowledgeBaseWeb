/**
 * @skb/editor-shell ResizeContext — React context bridging the
 * presentational `<ResizeHandles>` (per-block, inside NodeView body)
 * to the lifecycle owner (`useResizePipeline()` mounted at the
 * editor mount level).
 *
 * Wave 6 cf-20d (2026-05-09) — context plumbs the resize-start /
 * resize-end callbacks across the React tree without prop-drilling.
 * Mirrors the cf-20c-2 `DragDropContext` pattern (see drag-context.tsx
 * for the full rationale) — Tiptap ReactNodeViewRenderer mounts each
 * NodeView in a separate React subtree so prop drilling through
 * `BlockNodeView` factory args isn't an option.
 *
 * Per-axis API (right / bottom / corner):
 *   - `right`  → mutates colSpan (snap to effectiveColSnaps)
 *   - `bottom` → mutates rowSpan (snap to nearest integer ≥ 1)
 *   - `corner` → mutates BOTH (independent snap for each axis)
 *
 * Per ADR-0017 D9, only the `right` axis is rendered for prose-kind
 * blocks; `bottom` and `corner` are rendered for non-prose
 * (component / render / viz) per the gridKind authority. The handle
 * components themselves perform the gridKind check at render time.
 */
import { createContext, type ReactNode } from 'react';

export type ResizeAxis = 'right' | 'bottom' | 'corner';

export interface ResizeStartOrigin {
  readonly x: number;
  readonly y: number;
}

export interface ResizeEndOrigin {
  readonly x: number;
  readonly y: number;
}

export interface ResizeContextValue {
  /** Called from the per-block resize-handle `pointerdown`. */
  readonly onResizeStart: (
    blockId: string,
    axis: ResizeAxis,
    origin: ResizeStartOrigin,
  ) => void;
  /** Called as a cleanup fallback from the handle's pointercancel. */
  readonly onResizeEnd: (origin: ResizeEndOrigin) => void;
  /**
   * Wave 6 cf-22 (2026-05-09) — keyboard-mode resize entry. Called
   * from the resize-handle's `onKeyDown` (Enter/Space). The pipeline
   * snapshots the block + sets a virtual snap state at the block's
   * CURRENT colSpan/rowSpan + flips `state.keyboardActive = true`.
   * Window-level Arrow listeners adjust colSpan via
   * `keyboardSnapStep` (right/corner) or rowSpan via
   * `keyboardRowStep` (bottom/corner). Per cf-22 D3.
   */
  readonly onResizeStartKeyboard?: (
    blockId: string,
    axis: ResizeAxis,
  ) => void;
  /**
   * Currently-resizing source block ID, or null when no resize is
   * active. The per-block `BlockNodeView` reads this to apply the
   * `.skb-block-nodeview--resizing` modifier class (the v2
   * `.gblock.resizing` outline + body-hidden contract per
   * /mnt/d/download/web/v2-styles.css:172-176).
   */
  readonly resizingBlockId: string | null;
  /** Active axis during resize (null when no resize is active). */
  readonly resizingAxis: ResizeAxis | null;
}

/**
 * Default `null` value (Provider absence). Consumers should treat
 * null as "no pipeline mounted" — handles render but `pointerdown`
 * is a no-op (degraded mode for tests / stand-alone NodeView mounts).
 */
export const ResizeContext = createContext<ResizeContextValue | null>(null);

export interface ResizeProviderProps {
  readonly value: ResizeContextValue;
  readonly children?: ReactNode;
}

export function ResizeProvider(props: ResizeProviderProps) {
  const { value, children } = props;
  return (
    <ResizeContext.Provider value={value}>{children}</ResizeContext.Provider>
  );
}
