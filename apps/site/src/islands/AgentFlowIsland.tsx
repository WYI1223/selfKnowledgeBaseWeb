import type { ReactElement } from 'react';
import { heavyBoundaryDimensions as agentFlowDims } from '@skb/block-agent-flow/ui-default/heavy-boundary-dimensions';
import type { FlatProps } from '../lib/mdx-adapter';

function AgentFlowPlaceholder({
  dims,
}: {
  readonly dims: typeof agentFlowDims;
}): ReactElement {
  return (
    <div
      role="status"
      data-block="agent-flow"
      aria-busy="false"
      data-loaded="true"
      className="heavy-block-skeleton heavy-block-skeleton--agent-flow heavy-block-skeleton--placeholder"
      style={{ width: dims.width, minHeight: dims.height }}
    >
      <span aria-hidden="true" className="heavy-block-placeholder__icon">
        🔌
      </span>
      <span className="heavy-block-placeholder__label">
        AgentFlow · plugin runtime (Phase 2+)
      </span>
    </div>
  );
}

export default function AgentFlowIsland(_props: FlatProps): ReactElement {
  return <AgentFlowPlaceholder dims={agentFlowDims} />;
}
