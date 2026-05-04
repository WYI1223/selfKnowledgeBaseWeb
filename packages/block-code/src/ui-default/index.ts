import { defineUI, type BlockUIDefinition } from '@skb/block-foundation';
import { codeCore } from '../core/core-definition';
import { CodeEditorView } from './EditorView';
import { CodeRenderView } from './RenderView';

export const codeUiDefault: BlockUIDefinition<typeof codeCore.propsSchema> =
  defineUI({
    coreName: codeCore.name,
    uiId: 'default',
    EditorView: CodeEditorView,
    RenderView: CodeRenderView,
  });

export { CodeEditorView } from './EditorView';
export { CodeRenderView } from './RenderView';
export { CodeBody } from './CodeBody';
export { CODE_THEME_TOKENS } from './theme-tokens';
