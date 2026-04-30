import { defineUI, type BlockUIDefinition } from '@skb/block-foundation';
import { calloutCore } from '../core/core-definition';
import { CalloutEditorView } from './EditorView';
import { CalloutRenderView } from './RenderView';

export const calloutUIDefault: BlockUIDefinition<typeof calloutCore.propsSchema> =
  defineUI({
    coreName: calloutCore.name,
    uiId: 'default',
    EditorView: CalloutEditorView,
    RenderView: CalloutRenderView,
  });

export { CalloutEditorView } from './EditorView';
export { CalloutRenderView } from './RenderView';
export { CalloutBody } from './CalloutBody';
export { VARIANT_TOKENS } from './variant-tokens';
export { VARIANT_ICONS } from './icons';
export type { Variant } from './variant-tokens';
