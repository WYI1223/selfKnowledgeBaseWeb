import type { ReactElement } from 'react';
import { heavyBoundaryDimensions as agentFlowDims } from '@skb/block-agent-flow/ui-default/heavy-boundary-dimensions';
import { HeavyBlockBoundary } from '@skb/heavy-block-boundary';
import { makeMdxAdapter, type FlatProps } from '../lib/mdx-adapter';

const loadAgentFlow = () =>
  import('@skb/block-agent-flow/ui-default').then((m) => ({
    default: makeMdxAdapter(m.AgentFlowRenderView as never),
  }));

export default function AgentFlowIsland(props: FlatProps): ReactElement {
  return (
    <HeavyBlockBoundary<FlatProps>
      kind="agent-flow"
      dims={agentFlowDims}
      load={loadAgentFlow}
      childProps={props}
    />
  );
}
