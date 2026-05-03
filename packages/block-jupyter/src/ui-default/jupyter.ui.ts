import { defineUI } from '@skb/block-foundation';
import type { HeavyBlockDimensions } from '@skb/heavy-block-boundary';
import { jupyterCore } from '../core/core-definition';
import { heavyBoundaryDimensions as heavyBoundaryDimensionsValue } from './heavy-boundary-dimensions';
import { JupyterEditorView, JupyterRenderView } from './Jupyter';

/**
 * 不显式 `BlockUIDefinition<typeof jupyterCore.propsSchema>` 标注 —— 让 defineUI
 * 从 EditorView/RenderView 实参推 generic，落到 ZodTypeAny 等价的 inference
 * 默认。理由同 block-math/ui-default/math.ui.ts：narrow generic + ComponentType
 * contravariance + exactOptionalPropertyTypes 在 BlockRegistry.registerUI 处
 * 报 TS2345。
 *
 * BUT: JupyterEditorView 上有可选 `adapter` 参数（test 注入），BlockViewProps
 * 定义只含 `props` + `content`，因此把 React 组件签名 narrow 到
 * `ComponentType<BlockViewProps<...>>` 时需要桥接 — adapter 仅 dev/test inject，
 * production NodeView 永远不传它。这里 cast 仅 widening generic param 一处。
 */
export const jupyterUiDefault = defineUI({
  coreName: jupyterCore.name,
  uiId: 'default',
  EditorView: JupyterEditorView,
  RenderView: JupyterRenderView,
});

/**
 * ADR-0014 D5 per-block dimensions ownership. Consumed by apps/site
 * componentsMap to size the SSR skeleton matching the hydrated component
 * (zero layout shift). Width/height are CSS px (min-width / min-height).
 */
export const heavyBoundaryDimensions: HeavyBlockDimensions = heavyBoundaryDimensionsValue;
