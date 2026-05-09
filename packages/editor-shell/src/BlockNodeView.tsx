import type { ComponentType } from 'react';
import { NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react';
import type { BlockRegistry, BlockViewProps } from '@skb/block-foundation';
import type { ZodTypeAny } from 'zod';
import { extractGridPosition, gridPlacementStyle } from './grid-style';

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
 *      empty placeholder with a kind chip so 4 sequential same-kind
 *      blocks remain visually distinct. cf-20 will drop drag-handle +
 *      kebab buttons in here without restructuring DOM.
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

export function makeBlockNodeView({
  registry,
}: BlockNodeViewFactoryProps): ComponentType<ReactNodeViewProps> {
  return function BlockNodeView(props: ReactNodeViewProps) {
    const nodeName = props.node.type.name;
    const ui = registry ? registry.getUI(nodeName) : undefined;
    const editorProps = (props.node.attrs ?? {}) as Record<string, unknown>;
    const gridPos = extractGridPosition(editorProps);
    const wrapperStyle = gridPos ? gridPlacementStyle(gridPos) : undefined;

    if (!ui) {
      return (
        <NodeViewWrapper
          className="skb-block-nodeview skb-block-nodeview--unregistered"
          data-skb-block-kind={nodeName}
          style={wrapperStyle}
        >
          <div className="skb-block-nodeview__gutter" contentEditable={false}>
            <span className="skb-block-nodeview__kind-chip" data-skb-block-kind={nodeName}>
              {chipLabel(nodeName)}
            </span>
          </div>
          <div className="skb-block-nodeview__fallback" contentEditable={false}>
            Unregistered block <code>{nodeName}</code>
          </div>
        </NodeViewWrapper>
      );
    }
    const EditorView: ComponentType<BlockViewProps<ZodTypeAny>> = ui.EditorView;
    return (
      <NodeViewWrapper
        className="skb-block-nodeview"
        data-skb-block-kind={nodeName}
        style={wrapperStyle}
      >
        <div className="skb-block-nodeview__gutter" contentEditable={false}>
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
      </NodeViewWrapper>
    );
  };
}
