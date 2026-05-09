/**
 * @skb/editor-shell DragDropContext — React context bridging the
 * presentational drag-handle button (per-block, inside NodeView gutter)
 * to the lifecycle owner (`useDragDropPipeline()` mounted at the editor
 * mount level).
 *
 * Wave 6 cf-20c-2 (2026-05-09) — context plumbs the drag-start /
 * drag-end callbacks across the React tree without prop-drilling. The
 * NodeView wrapper renders inside Tiptap's `ReactNodeViewRenderer`
 * which mounts in a separate React subtree (Tiptap creates new React
 * roots for each NodeView), so prop drilling through `BlockNodeView`
 * factory args isn't an option — context is the canonical bridge.
 *
 * Why context (vs imperative `editor.commands.dragStart()`):
 *   - Per ADR-0016 D11 mutation discipline: grid attrs are passive
 *     data on NodeView; mutations flow through the layoutReducer
 *     (per ADR-0016 D12). The context interface mirrors this — only
 *     drag-start / drag-end notifications, no direct attr writes.
 *   - The pipeline owner (`EditorShellMount.tsx`) holds the
 *     `layoutReducer` state + the OutlineOverlay/DragGhost mounts;
 *     callbacks dispatch to the reducer.
 */
import { createContext, type ReactNode } from 'react';

export interface DragHandleStartOrigin {
  readonly x: number;
  readonly y: number;
}

export interface DragHandleEndOrigin {
  readonly x: number;
  readonly y: number;
}

export interface DragDropContextValue {
  /** Called from the per-block drag-handle button's dragstart handler. */
  readonly onDragStart: (blockId: string, origin: DragHandleStartOrigin) => void;
  /** Called from the per-block drag-handle button's dragend handler. */
  readonly onDragEnd: (origin: DragHandleEndOrigin) => void;
  /**
   * Wave 6 cf-20c-2 R2 F1 — currently-lifted source block ID.
   *
   * Per ADR-0017 D6 line 247 verbatim source-lift: during an active
   * drag, the source NodeView visually "lifts" via
   * `visibility: hidden + pointer-events: none` (preserves grid layout
   * space, hides the visual). cf-20c-2 R1 originally implemented the
   * v2-demo opacity/grayscale model; codex-pr-reviewer-55 R2 F1 caught
   * that as a real D6 violation per D6 line 255 explicit rejection of
   * the gray-half-transparent placeholder behavior. R2 fix in
   * `BlockNodeView.css .skb-block-nodeview--dragging-self`.
   * `BlockNodeView.tsx` reads this field via `useContext(DragDropContext)`
   * and applies the `.skb-block-nodeview--dragging-self` modifier class
   * when its own block id matches. Null = no active drag (steady state).
   */
  readonly sourceBlockId: string | null;
}

/**
 * Default `null` value (Provider absence). Consumers should treat null
 * as "no pipeline mounted" — drag handles render but clicks are no-ops
 * (degraded mode for tests / stand-alone NodeView mounts).
 */
export const DragDropContext = createContext<DragDropContextValue | null>(null);

export interface DragDropProviderProps {
  readonly value: DragDropContextValue;
  readonly children?: ReactNode;
}

export function DragDropProvider(props: DragDropProviderProps) {
  const { value, children } = props;
  return <DragDropContext.Provider value={value}>{children}</DragDropContext.Provider>;
}
