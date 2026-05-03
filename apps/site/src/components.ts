import { type ComponentType, type ReactNode, createElement } from 'react';
import { CalloutRenderView } from '@skb/block-callout/ui-default';
import { CodeRenderView } from '@skb/block-code/ui-default';
import { ImageRenderView } from '@skb/block-image/ui-default';
import { MathRenderView } from '@skb/block-math/ui-default';
import { PdfRenderView } from '@skb/block-pdf/ui-default';
import { heavyBoundaryDimensions as jupyterDims } from '@skb/block-jupyter/ui-default/heavy-boundary-dimensions';
import { heavyBoundaryDimensions as nnVizDims } from '@skb/block-nn-viz/ui-default/heavy-boundary-dimensions';
import { heavyBoundaryDimensions as agentFlowDims } from '@skb/block-agent-flow/ui-default/heavy-boundary-dimensions';
import { HeavyBlockBoundary } from '@skb/heavy-block-boundary';
import '@skb/heavy-block-boundary/heavy-block-skeleton.css';

// MDX compiles `<Callout variant="note">body</Callout>` to flat React
// props (`<CalloutRenderView variant="note">{body}</CalloutRenderView>`),
// but block-* RenderView components destructure `{ props, content }:
// BlockViewProps`. Without an adapter `props` would be undefined and
// rendering breaks. The adapter wraps flat MDX props into BlockViewProps
// shape: { props: {...}, content: children-as-string }.
type FlatProps = Record<string, unknown> & { children?: ReactNode };

function makeMdxAdapter(
  RenderView: ComponentType<{ readonly props: Record<string, unknown>; readonly content?: string }>,
): ComponentType<FlatProps> {
  return function MdxAdapter({ children, ...rest }: FlatProps) {
    const content = typeof children === 'string' ? children : undefined;
    return createElement(RenderView, { props: rest, content });
  };
}

const asMdxComponent = (component: ComponentType<FlatProps>): ComponentType<unknown> =>
  component as unknown as ComponentType<unknown>;

const Jupyter = (props: FlatProps): ReactNode =>
  createElement(HeavyBlockBoundary<FlatProps>, {
    kind: 'jupyter',
    dims: jupyterDims,
    load: () =>
      import('@skb/block-jupyter/ui-default').then((m) => ({
        default: makeMdxAdapter(m.JupyterRenderView as never),
      })),
    childProps: props,
  });

const NnViz = (props: FlatProps): ReactNode =>
  createElement(HeavyBlockBoundary<FlatProps>, {
    kind: 'nn-viz',
    dims: nnVizDims,
    load: () =>
      import('@skb/block-nn-viz/ui-default').then((m) => ({
        default: makeMdxAdapter(m.NnVizRenderView as never),
      })),
    childProps: props,
  });

const AgentFlow = (props: FlatProps): ReactNode =>
  createElement(HeavyBlockBoundary<FlatProps>, {
    kind: 'agent-flow',
    dims: agentFlowDims,
    load: () =>
      import('@skb/block-agent-flow/ui-default').then((m) => ({
        default: makeMdxAdapter(m.AgentFlowRenderView as never),
      })),
    childProps: props,
  });

export const componentsMap = {
  // 5 light blocks: server-rendered via prop-shape adapter
  Callout: asMdxComponent(makeMdxAdapter(CalloutRenderView as never)),
  Code: asMdxComponent(makeMdxAdapter(CodeRenderView as never)),
  Image: asMdxComponent(makeMdxAdapter(ImageRenderView as never)),
  Math: asMdxComponent(makeMdxAdapter(MathRenderView as never)),
  Pdf: asMdxComponent(makeMdxAdapter(PdfRenderView as never)),
  // 3 heavy blocks: HeavyBlockBoundary wraps lazy-loaded RenderView per ADR-0014 D8
  Jupyter: asMdxComponent(Jupyter),
  NnViz: asMdxComponent(NnViz),
  AgentFlow: asMdxComponent(AgentFlow),
} satisfies Readonly<Record<string, ComponentType<unknown>>>;
