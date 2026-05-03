import { defineUI } from '@skb/block-foundation';
import type { HeavyBlockDimensions } from '@skb/heavy-block-boundary';
import { agentFlowCore } from '../core/core-definition';
import { AgentFlowEditorView, AgentFlowRenderView } from './AgentFlow';
import { heavyBoundaryDimensions as heavyBoundaryDimensionsValue } from './heavy-boundary-dimensions';

/**
 * 不显式 `BlockUIDefinition<typeof agentFlowCore.propsSchema>` 标注 —— 让
 * defineUI 从 EditorView/RenderView 实参推 generic，落到 ZodTypeAny 等价的
 * inference 默认。理由同 block-jupyter/ui-default/jupyter.ui.ts +
 * block-math/ui-default/math.ui.ts：narrow generic + ComponentType
 * contravariance + exactOptionalPropertyTypes 在 BlockRegistry.registerUI 处
 * 报 TS2345。
 */
export const agentFlowUiDefault = defineUI({
  coreName: agentFlowCore.name,
  uiId: 'default',
  EditorView: AgentFlowEditorView,
  RenderView: AgentFlowRenderView,
});

/**
 * ADR-0014 D5 per-block dimensions ownership. Consumed by apps/site
 * componentsMap to size the SSR skeleton matching the hydrated component
 * (zero layout shift). Width/height are CSS px (min-width / min-height).
 */
export const heavyBoundaryDimensions: HeavyBlockDimensions = heavyBoundaryDimensionsValue;
