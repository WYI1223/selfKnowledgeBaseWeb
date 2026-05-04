import { defineUI, type BlockUIDefinition } from '@skb/block-foundation';
import { imageCore } from '../core/core-definition';
import { ImageEditorView } from './EditorView';
import { ImageRenderView } from './RenderView';

export const imageUiDefault: BlockUIDefinition<typeof imageCore.propsSchema> =
  defineUI({
    coreName: imageCore.name,
    uiId: 'default',
    EditorView: ImageEditorView,
    RenderView: ImageRenderView,
  });

export { ImageEditorView } from './EditorView';
export { ImageRenderView } from './RenderView';
export { ImageBody } from './ImageBody';
export { IMAGE_THEME_TOKENS } from './theme-tokens';
