import { defineUI } from '@skb/block-foundation';
import { mathCore } from '../core/core-definition';
import { MathEditorView, MathRenderView } from './Math';

/**
 * 不显式 `BlockUIDefinition<typeof mathCore.propsSchema>` 标注 —— 让 defineUI
 * 从 EditorView/RenderView 的实参推 generic，落到 ZodTypeAny 等价的 inference
 * 默认。理由：BlockRegistry.registerUI 接 BlockUIDefinition (默认 ZodTypeAny)，
 * generic 显式 narrow 后在 registerUI 处会因 ComponentType 的 contravariance +
 * exactOptionalPropertyTypes 报 TS2345。foundation 自身的 registry.test.ts 也
 * 走 inference 模式（见 packages/block-foundation/src/__tests__/registry.test.ts:19）。
 */
export const mathUiDefault = defineUI({
  coreName: mathCore.name,
  uiId: 'default',
  EditorView: MathEditorView,
  RenderView: MathRenderView,
});
