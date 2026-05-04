import { type BlockRegistry, type BlockUIDefinition } from '@skb/block-foundation';
import { calloutCore } from '@skb/block-callout/core';
import { calloutUiDefault } from '@skb/block-callout/ui-default';
import { codeCore } from '@skb/block-code/core';
import { codeUiDefault } from '@skb/block-code/ui-default';
import { imageCore } from '@skb/block-image/core';
import { imageUiDefault } from '@skb/block-image/ui-default';
import { mathCore } from '@skb/block-math/core';
import { mathUiDefault } from '@skb/block-math/ui-default';
import { pdfCore } from '@skb/block-pdf/core';
import { pdfUiDefault } from '@skb/block-pdf/ui-default';
import { jupyterCore } from '@skb/block-jupyter/core';
import { jupyterUiDefault } from '@skb/block-jupyter/ui-default';
import { nnVizCore } from '@skb/block-nn-viz/core';
import { nnVizUiDefault } from '@skb/block-nn-viz/ui-default';
import { agentFlowCore } from '@skb/block-agent-flow/core';
import { agentFlowUiDefault } from '@skb/block-agent-flow/ui-default';

export function registerBlocks(registry: BlockRegistry): void {
  // 5 of 8 ui-defaults need `as unknown as BlockUIDefinition` cast under
  // exactOptionalPropertyTypes:true (callout/code/image/math/pdf): their
  // EditorView/RenderView ComponentType<BlockViewProps<NarrowSchema>> is not
  // assignable to ComponentType<BlockViewProps<ZodTypeAny>> due to
  // ComponentType contravariance. The remaining 3 (jupyter/nn-viz/agent-flow)
  // use a wider component-type signature that satisfies the variance
  // directly — no cast required (ESLint's no-unnecessary-type-assertion
  // flags any cast added there as a no-op).
  registry.registerCore(calloutCore);
  registry.registerUI(calloutUiDefault as unknown as BlockUIDefinition);

  registry.registerCore(codeCore);
  registry.registerUI(codeUiDefault as unknown as BlockUIDefinition);

  registry.registerCore(imageCore);
  registry.registerUI(imageUiDefault as unknown as BlockUIDefinition);

  // 2 render blocks (math/pdf): inference-default UiDefault still narrows
  // to the core's propsSchema via defineUI's generic; same cast required.
  registry.registerCore(mathCore);
  registry.registerUI(mathUiDefault as unknown as BlockUIDefinition);

  registry.registerCore(pdfCore);
  registry.registerUI(pdfUiDefault as unknown as BlockUIDefinition);

  // 3 viz blocks (jupyter/nn-viz/agent-flow): no cast needed — these
  // ui-defaults' EditorView/RenderView use a wider type signature that
  // already accepts `BlockViewProps<ZodTypeAny>` without contravariance issue
  // (verified at A3 EXECUTE time; ESLint's no-unnecessary-type-assertion
  // confirms the `as unknown as BlockUIDefinition` here would be a no-op).
  registry.registerCore(jupyterCore);
  registry.registerUI(jupyterUiDefault);

  registry.registerCore(nnVizCore);
  registry.registerUI(nnVizUiDefault);

  registry.registerCore(agentFlowCore);
  registry.registerUI(agentFlowUiDefault);
}
