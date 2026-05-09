import type { ComponentType } from 'react';
import { NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react';
import type { BlockRegistry, BlockViewProps } from '@skb/block-foundation';
import type { ZodTypeAny } from 'zod';

/**
 * Wave 6 carry-forward #18 (2026-05-08) — bridge from a Tiptap NodeView to
 * a block's registered `EditorView` React component.
 *
 * Lookup chain (identity mapping):
 *   1. `node.type.name` is the Tiptap node name registered by
 *      `createBlockExtension` (one per `BlockAffordanceKind`).
 *   2. The Tiptap node name === the block's `coreName` for all 8 blocks
 *      (the cf-15b `'code'` → `'componentCode'` rename was symmetric
 *      across BlockKind AND `codeCore.name`, so the camelCase
 *      `componentCode` is no exception — it identity-maps just like the
 *      other 7 kebab-case kinds).
 *   3. `registry.getUI(node.type.name)` returns the first registered UI
 *      (uiId defaulting to `'default'`), whose `EditorView` we then
 *      mount with `props = node.attrs`.
 *
 * The fallback `<NodeViewWrapper>` placeholder ('Unregistered block …')
 * fires only when:
 *   - no `BlockRegistry` was injected at `wireRegistry` time, or
 *   - the block's core/ui never got registered (consumer wired the
 *     extension but skipped `registerBlocks`).
 *
 * Consumers must guarantee that `registerBlocks(registry)` ran before
 * the Tiptap editor mount; mismatch degrades to the in-editor
 * placeholder rather than crashing.
 */
export interface BlockNodeViewFactoryProps {
  readonly registry?: BlockRegistry;
}

export function makeBlockNodeView({
  registry,
}: BlockNodeViewFactoryProps): ComponentType<ReactNodeViewProps> {
  return function BlockNodeView(props: ReactNodeViewProps) {
    const nodeName = props.node.type.name;
    const ui = registry ? registry.getUI(nodeName) : undefined;
    if (!ui) {
      return (
        <NodeViewWrapper
          className="skb-block-nodeview skb-block-nodeview--unregistered"
          data-skb-block-kind={nodeName}
        >
          <div className="skb-block-nodeview__fallback" contentEditable={false}>
            Unregistered block <code>{nodeName}</code>
          </div>
        </NodeViewWrapper>
      );
    }
    const EditorView: ComponentType<BlockViewProps<ZodTypeAny>> = ui.EditorView;
    const editorProps = (props.node.attrs ?? {}) as Record<string, unknown>;
    return (
      <NodeViewWrapper
        className="skb-block-nodeview"
        data-skb-block-kind={nodeName}
      >
        <div contentEditable={false} data-skb-block-host={nodeName}>
          <EditorView props={editorProps} />
        </div>
      </NodeViewWrapper>
    );
  };
}
