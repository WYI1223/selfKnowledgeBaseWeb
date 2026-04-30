import { defineUI } from '@skb/block-foundation';
import { pdfCore } from '../core/core-definition';
import { PdfEditorView, PdfRenderView } from './Pdf';

/**
 * 不显式 `BlockUIDefinition<typeof pdfCore.propsSchema>` 标注 —— 让 defineUI
 * 从 EditorView/RenderView 的实参推 generic，落到 ZodTypeAny 等价的 inference
 * 默认。理由：BlockRegistry.registerUI 接 BlockUIDefinition (默认 ZodTypeAny)，
 * generic 显式 narrow 后在 registerUI 处会因 ComponentType 的 contravariance +
 * exactOptionalPropertyTypes 报 TS2345。foundation 自身的 registry.test.ts 也
 * 走 inference 模式。Mirrors block-math/ui-default/math.ui.ts pattern.
 */
export const pdfUiDefault = defineUI({
  coreName: pdfCore.name,
  uiId: 'default',
  EditorView: PdfEditorView,
  RenderView: PdfRenderView,
});
