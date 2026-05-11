import type { ComponentType, ReactNode } from 'react';
import type { BlockViewProps } from '@skb/block-foundation';
import { markdownCore } from '../core/core-definition';

/**
 * Wave 6 cf-25 — Markdown block editor view.
 *
 * **Mount-path note**: under the editor mount, this component is
 * NOT directly mounted. The cf-25 D7 design routes the markdown
 * `nodeName === 'markdown'` case in `editor-shell/BlockNodeView.tsx`
 * to render Tiptap's `<NodeViewContent>` element directly — that is
 * the only way to reach ProseMirror's "render my children here"
 * contract for non-atom NodeViews. The block-foundation
 * `BlockViewProps<TSchema>` interface (`{ props, content?: string }`)
 * cannot describe a ProseMirror children slot, so this component
 * exists only to satisfy the `BlockUIDefinition.EditorView` contract
 * + serve as a fallback for tests / non-NodeView mounts.
 *
 * Rendering behavior:
 * - When `content` is a string (test path), wrap in `.skb-prose`
 * - When `content` is undefined (NodeView path — short-circuited
 *   before reaching here), render an empty fragment so the
 *   short-circuit branch in BlockNodeView is the canonical render
 */
export const MarkdownEditorView: ComponentType<
  BlockViewProps<typeof markdownCore.propsSchema>
> = ({ content }) => {
  const body: ReactNode = content === undefined || content === '' ? null : content;
  return <div className="skb-prose">{body}</div>;
};
