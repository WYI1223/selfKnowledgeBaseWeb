import { useContext, useLayoutEffect, useRef, type ComponentType, type CSSProperties } from 'react';
import { NodeViewContent, NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react';
import type { BlockRegistry, BlockViewProps } from '@skb/block-foundation';
import type { ZodTypeAny } from 'zod';
import { extractGridPosition, gridPlacementStyle } from './grid-style';
import { DragHandleButton } from './drag-drop/drag-handle-button';
import { DragDropContext } from './drag-drop/drag-context';
import { ResizeHandles } from './resize/resize-handles';
import { ResizeContext } from './resize/resize-context';
import { KebabButton } from './kebab/kebab-button';

/**
 * Wave 6 carry-forward #18 (2026-05-08) — bridge from a Tiptap NodeView to
 * a block's registered `EditorView` React component.
 *
 * Wave 6 carry-forward #19 v0.2 (2026-05-09) — wraps the inner block in
 * the v2 `.gblock` card chrome (per /mnt/d/download/web/v2-styles.css:157
 * `.gblock` + `.gblock-body` + `.gblock-gutter` model). The wrapper now
 * emits three structural elements:
 *   1. outer `<NodeViewWrapper class="skb-block-nodeview">` carries
 *      `data-skb-block-kind` (cf-18 contract; downstream Tiptap inspectors
 *      and the cf-19 stripe selector both rely on it).
 *   2. NEW gutter shell `<div class="skb-block-nodeview__gutter">` —
 *      placeholder that cf-20c-2 fills with a per-block drag-handle
 *      button alongside the cf-19 kind chip.
 *   3. inner non-editable host `<div class="skb-block-nodeview__body"
 *      data-skb-block-host>` carries the registered EditorView. The
 *      body class is the analog of v2's `.gblock-body` padding shell.
 *
 * Wave 6 cf-20b (2026-05-09) — grid placement. The NodeView wrapper now
 * applies `style.gridColumn` / `style.gridRow` derived from
 * `node.attrs.{col, row?, colSpan, rowSpan}` per ADR-0016 D2 + v0.2
 * D11.1 amendment (editor-surface grid lock). The shared
 * `block-chrome.css` rule treats both `.skb-block-nodeview` (editor) and
 * `.skb-block-static` (read route) as grid items; the outer
 * `.skb-grid .ProseMirror { display: grid }` rule turns the editor
 * element itself into a 12-col grid so NodeView wrappers land at the
 * correct DOM depth. When `node.attrs` is missing required grid fields
 * (test mounts without the cf-19 grid-attr defaults), the wrapper falls
 * back to no inline style and the parent CSS
 * `.skb-grid .ProseMirror > *:not([style*="grid-column"])` rule paints
 * full-width (`grid-column: 1 / -1`).
 *
 * Wave 6 cf-20c-2 (2026-05-09) — per-block drag-handle button. Renders
 * a `<DragHandleButton blockId={String(getPos())}>` inside the gutter
 * shell. The blockId is sourced from ProseMirror node `pos` per
 * cf-20c-2 D2 (path A: pos as stable ID within a single drag
 * transaction; path B with stable UUID attrs deferred to a future
 * schema-mod PR per cf-20c-2 D2 rationale). The button uses HTML5
 * native DnD (Q7 spike result: native DnD survives ProseMirror inside
 * `contenteditable=false` gutter; verified pre-implementation).
 * Drag-start callbacks flow via `DragDropContext` to
 * `useDragDropPipeline()` mounted at the editor mount level.
 *
 * Lookup chain (identity mapping unchanged from cf-18):
 *   1. `node.type.name` is the Tiptap node name registered by
 *      `createBlockExtension` (one per `BlockAffordanceKind`).
 *   2. The Tiptap node name === the block's `coreName` for all 8 blocks.
 *   3. `registry.getUI(node.type.name)` returns the first registered UI
 *      whose `EditorView` we then mount with `props = node.attrs`.
 */
export interface BlockNodeViewFactoryProps {
  readonly registry?: BlockRegistry;
}

/**
 * Friendly chip label for the gutter chip. Kebab kinds (`nn-viz`,
 * `agent-flow`) keep their hyphen; camelCase `componentCode` collapses
 * to `code` because the user-facing slash-menu / palette label is
 * `Code` (cf-15b rename was internal-only for ProseMirror namespace
 * isolation; visual identity stays "code").
 */
function chipLabel(kind: string): string {
  if (kind === 'componentCode') return 'code';
  return kind;
}

/**
 * Source the block ID for cf-20c-2 drag-handle wiring. Per cf-20c-2 D2
 * (Path A): use ProseMirror node `pos` as a stable string identifier
 * within a single drag transaction. The pipeline snapshots positions
 * at drag-start; pos values are stable until a doc transaction
 * mutates structure (none happen during a drag because Tiptap suspends
 * input handling on focused dragstart).
 *
 * `getPos` is a function provided by Tiptap; null/undefined means the
 * NodeView is not yet mounted (pre-render). Returning empty string in
 * that case means the DragHandleButton renders but its onClick is
 * inert until the next render — degraded but not broken.
 */
function blockIdFromProps(props: ReactNodeViewProps): string {
  const getPos = props.getPos;
  if (typeof getPos !== 'function') return '';
  const pos = getPos();
  return typeof pos === 'number' ? String(pos) : '';
}

/**
 * Wave 6 cf-20c-2 R2 F1 — compose className from base + draggingSelf
 * + unregistered modifiers. Per ADR-0017 D6 line 247 source-lift, the
 * source NodeView gets `.skb-block-nodeview--dragging-self` during
 * active drag (CSS rule in BlockNodeView.css applies
 * `visibility: hidden + pointer-events: none + transition: none`,
 * which preserves grid layout space while hiding the visual; the
 * earlier R1 v2-demo opacity/grayscale model was rejected by
 * codex-pr-reviewer-55 R2 F1 per ADR-0017 D6 line 255 explicit
 * rejection — see BlockNodeView.css source-lift rule comment for
 * the visibility-vs-display-none rationale).
 */
function nodeViewClassName(
  isDraggingSelf: boolean,
  isUnregistered: boolean,
  isResizing: boolean,
): string {
  const parts = ['skb-block-nodeview'];
  if (isUnregistered) parts.push('skb-block-nodeview--unregistered');
  if (isDraggingSelf) parts.push('skb-block-nodeview--dragging-self');
  // Wave 6 cf-20d (2026-05-09) — `.skb-block-nodeview--resizing`
  // applies the v2 `.gblock.resizing` outline + body-hidden contract
  // (per /mnt/d/download/web/v2-styles.css:172-176). Set when the
  // ResizeContext's resizingBlockId matches this NodeView's blockId.
  // CSS rule lives in resize-handles.css.
  if (isResizing) parts.push('skb-block-nodeview--resizing');
  return parts.join(' ');
}

/**
 * Wave 6 cf-25 R1 F2 — project the grid placement style onto the
 * parent `.react-renderer` element (Tiptap's outer NodeView wrapper)
 * via a useLayoutEffect that walks up from our `NodeViewWrapper`'s
 * ref. The OUTER wrapper IS the actual grid item under
 * `.ProseMirror`'s display:grid; placing the style on the inner
 * `.skb-block-nodeview` (which sits one level INSIDE) is invisible
 * to the parent grid layout because the outer takes a default cell.
 *
 * Why useLayoutEffect (not useEffect): grid layout must apply BEFORE
 * the browser paints to avoid a single-frame flash where the block
 * jumps from `1 / -1` (CSS fallback) to its real placement. Layout
 * effects run synchronously after DOM mutations + before paint, so
 * the user never sees the fallback position.
 *
 * Idempotent: rewrites the same style on every render. Tiptap calls
 * the React update path on every node-attrs mutation, so the style
 * stays in sync with `node.attrs.{col,colSpan,row,rowSpan}` updates
 * from cf-20c-2 drag, cf-20d resize, cf-20e change-kind, etc.
 *
 * Cleanup: on unmount the parent `.react-renderer` is also removed
 * by Tiptap (NodeView lifecycle owns the dom), so no manual cleanup
 * needed; we keep the cleanup function null-returning to make this
 * explicit.
 */
function useProjectGridStyleToOuter(
  innerRef: React.RefObject<HTMLDivElement>,
  style: CSSProperties | undefined,
): void {
  useLayoutEffect(() => {
    const innerEl = innerRef.current;
    if (!innerEl) return;
    const outerEl = innerEl.parentElement;
    // The expected parent is Tiptap's `.react-renderer.node-{kind}` div.
    // Defensive: only mutate when the parent actually carries that
    // class so we don't accidentally style some unrelated ancestor.
    if (!outerEl || !outerEl.classList.contains('react-renderer')) return;
    if (style?.gridColumn) {
      outerEl.style.gridColumn = String(style.gridColumn);
    } else {
      outerEl.style.removeProperty('grid-column');
    }
    if (style?.gridRow) {
      outerEl.style.gridRow = String(style.gridRow);
    } else {
      outerEl.style.removeProperty('grid-row');
    }
  });
}

export function makeBlockNodeView({
  registry,
}: BlockNodeViewFactoryProps): ComponentType<ReactNodeViewProps> {
  return function BlockNodeView(props: ReactNodeViewProps) {
    const nodeName = props.node.type.name;
    const ui = registry ? registry.getUI(nodeName) : undefined;
    const editorProps = (props.node.attrs ?? {}) as Record<string, unknown>;
    const gridPos = extractGridPosition(editorProps);
    const wrapperStyle = gridPos ? gridPlacementStyle(gridPos) : undefined;
    const blockId = blockIdFromProps(props);
    // Wave 6 cf-25 R1 F2 — project grid style onto outer .react-renderer.
    const innerRef = useRef<HTMLDivElement>(null);
    useProjectGridStyleToOuter(innerRef, wrapperStyle);
    // Wave 6 cf-20c-2 R1 F1 — read sourceBlockId from DragDropContext
    // (null when no drag pipeline is mounted OR when no drag is
    // active). When this NodeView's blockId matches, apply the
    // dragging-self modifier class so CSS lifts the source visually.
    const ctx = useContext(DragDropContext);
    const isDraggingSelf = blockId !== '' && ctx?.sourceBlockId === blockId;

    // Wave 6 cf-20d (2026-05-09) — read resizingBlockId from
    // ResizeContext (null when no resize pipeline is mounted OR when
    // no resize is active). When this NodeView's blockId matches,
    // apply the .skb-block-nodeview--resizing modifier so CSS shows
    // the v2 dashed outline + body-hidden treatment per
    // /mnt/d/download/web/v2-styles.css:172-176.
    const resizeCtx = useContext(ResizeContext);
    const isResizing =
      blockId !== '' && resizeCtx?.resizingBlockId === blockId;

    // gridKind is registered on BlockUIDefinition per ADR-0016 D10.
    // The 8 sample-blocks BlockUIDefinition entries don't currently
    // set it (data gap noted at cf-20d planning); defensive default
    // = undefined → <ResizeHandles> renders all 3 handles.
    const gridKind = ui?.gridKind;

    if (!ui) {
      return (
        <NodeViewWrapper
          ref={innerRef}
          className={nodeViewClassName(isDraggingSelf, true, isResizing)}
          data-skb-block-kind={nodeName}
          style={wrapperStyle}
        >
          <div className="skb-block-nodeview__gutter" contentEditable={false}>
            {blockId && <DragHandleButton blockId={blockId} />}
            {blockId && <KebabButton blockId={blockId} sourceKind={nodeName} />}
            <span className="skb-block-nodeview__kind-chip" data-skb-block-kind={nodeName}>
              {chipLabel(nodeName)}
            </span>
          </div>
          <div className="skb-block-nodeview__fallback" contentEditable={false}>
            Unregistered block <code>{nodeName}</code>
          </div>
          {blockId && <ResizeHandles blockId={blockId} gridKind={gridKind} />}
        </NodeViewWrapper>
      );
    }
    // Wave 6 cf-25 D7 — markdown short-circuit: render
    // <NodeViewContent> in the body so ProseMirror manages the inner
    // prose (paragraph / heading / list / blockquote / etc.) as
    // editable children. This is the only kind that uses content:
    // 'block+' schema; the 8 component blocks are atom-blocks and
    // mount their registered EditorView with `props={editorProps}`.
    //
    // The body container drops `contentEditable={false}` (only on
    // the 8 atom-block path) so ProseMirror's children inside
    // <NodeViewContent> can be edited. Gutter, drag-handle, kebab,
    // resize wiring all stay identical.
    if (nodeName === 'markdown') {
      return (
        <NodeViewWrapper
          ref={innerRef}
          className={nodeViewClassName(isDraggingSelf, false, isResizing)}
          data-skb-block-kind={nodeName}
          style={wrapperStyle}
        >
          <div className="skb-block-nodeview__gutter" contentEditable={false}>
            {blockId && <DragHandleButton blockId={blockId} />}
            {blockId && <KebabButton blockId={blockId} sourceKind={nodeName} />}
            <span className="skb-block-nodeview__kind-chip" data-skb-block-kind={nodeName}>
              {chipLabel(nodeName)}
            </span>
          </div>
          <NodeViewContent
            as="div"
            className="skb-block-nodeview__body skb-prose"
            data-skb-block-host={nodeName}
          />
          {blockId && <ResizeHandles blockId={blockId} gridKind={gridKind} />}
        </NodeViewWrapper>
      );
    }

    const EditorView: ComponentType<BlockViewProps<ZodTypeAny>> = ui.EditorView;
    return (
      <NodeViewWrapper
        ref={innerRef}
        className={nodeViewClassName(isDraggingSelf, false, isResizing)}
        data-skb-block-kind={nodeName}
        style={wrapperStyle}
      >
        <div className="skb-block-nodeview__gutter" contentEditable={false}>
          {blockId && <DragHandleButton blockId={blockId} />}
          {blockId && <KebabButton blockId={blockId} sourceKind={nodeName} />}
          <span className="skb-block-nodeview__kind-chip" data-skb-block-kind={nodeName}>
            {chipLabel(nodeName)}
          </span>
        </div>
        <div
          className="skb-block-nodeview__body"
          contentEditable={false}
          data-skb-block-host={nodeName}
        >
          <EditorView props={editorProps} />
        </div>
        {blockId && <ResizeHandles blockId={blockId} gridKind={gridKind} />}
      </NodeViewWrapper>
    );
  };
}
