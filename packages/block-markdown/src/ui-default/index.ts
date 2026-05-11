import { defineUI, type BlockUIDefinition } from '@skb/block-foundation';
import { markdownCore } from '../core/core-definition';
import { MarkdownEditorView } from './MarkdownEditorView';
import { MarkdownRenderView } from './MarkdownRenderView';

/**
 * Wave 6 cf-25 — Markdown block UI default.
 *
 * Wave 7 Phase 2A (ADR-0020 D1): `rowSpanSemantic` removed. Markdown
 * defaults to 12 × 1 (design-doc §6); content overflow scrolls inside
 * the block via grid.css `overflow-y: auto`.
 */
export const markdownUiDefault: BlockUIDefinition<typeof markdownCore.propsSchema> =
  defineUI({
    coreName: markdownCore.name,
    uiId: 'default',
    EditorView: MarkdownEditorView,
    RenderView: MarkdownRenderView,
    gridKind: 'prose',
  });

export { MarkdownEditorView } from './MarkdownEditorView';
export { MarkdownRenderView } from './MarkdownRenderView';
