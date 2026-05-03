import { defineUI } from '@skb/block-foundation';
import type { HeavyBlockDimensions } from '@skb/heavy-block-boundary';
import { nnVizCore } from '../core/core-definition';
import { heavyBoundaryDimensions as heavyBoundaryDimensionsValue } from './heavy-boundary-dimensions';
import { NnVizEditorView, NnVizRenderView } from './NnViz';

/**
 * 不显式 `BlockUIDefinition<typeof nnVizCore.propsSchema>` 标注 —— 让 defineUI
 * 从 EditorView/RenderView 实参推 generic，落到 ZodTypeAny 等价的 inference
 * 默认。理由同 block-jupyter/ui-default/jupyter.ui.ts：narrow generic +
 * ComponentType contravariance + exactOptionalPropertyTypes 在
 * BlockRegistry.registerUI 处报 TS2345。
 *
 * NnVizEditorView 上有可选 `loadLayersModel` 参数（test 注入），BlockViewProps
 * 定义只含 `props` + `content`，因此 ComponentType 宽到能容纳此 widening；
 * production NodeView 永远不传 loadLayersModel（默认走 tf.loadLayersModel）。
 */
export const nnVizUiDefault = defineUI({
  coreName: nnVizCore.name,
  uiId: 'default',
  EditorView: NnVizEditorView,
  RenderView: NnVizRenderView,
});

/**
 * ADR-0014 D5 per-block dimensions ownership. Consumed by apps/site
 * componentsMap to size the SSR skeleton matching the hydrated component
 * (zero layout shift). Width/height are CSS px (min-width / min-height).
 */
export const heavyBoundaryDimensions: HeavyBlockDimensions = heavyBoundaryDimensionsValue;
