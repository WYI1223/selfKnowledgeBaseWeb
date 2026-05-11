import { defineUI, type BlockUIDefinition } from '@skb/block-foundation';
import { markdownCore } from '../core/core-definition';
import { MarkdownEditorView } from './MarkdownEditorView';
import { MarkdownRenderView } from './MarkdownRenderView';

/**
 * Wave 6 cf-25 — Markdown block UI default.
 *
 * Registered as the 9th block kind alongside the 8 existing
 * BlockAffordanceKind kinds. `gridKind: 'prose'` + `rowSpanSemantic:
 * 'auto'` per ADR-0016 D10 prose grid defaults — markdown blocks
 * derive natural row span from rendered content height (per the
 * existing `useAutoRowSpan` hook).
 */
export const markdownUiDefault: BlockUIDefinition<typeof markdownCore.propsSchema> =
  defineUI({
    coreName: markdownCore.name,
    uiId: 'default',
    EditorView: MarkdownEditorView,
    RenderView: MarkdownRenderView,
    gridKind: 'prose',
    rowSpanSemantic: 'auto',
  });

export { MarkdownEditorView } from './MarkdownEditorView';
export { MarkdownRenderView } from './MarkdownRenderView';
