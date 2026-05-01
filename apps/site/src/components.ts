import type { ComponentType } from 'react';
import { CalloutRenderView } from '@skb/block-callout/ui-default';
import { CodeRenderView } from '@skb/block-code/ui-default';
import { ImageRenderView } from '@skb/block-image/ui-default';
import { MathRenderView } from '@skb/block-math/ui-default';
import { PdfRenderView } from '@skb/block-pdf/ui-default';

const Jupyter = (await import('@skb/block-jupyter/ui-default')).JupyterRenderView;
const NnViz = (await import('@skb/block-nn-viz/ui-default')).NnVizRenderView;
const AgentFlow = (await import('@skb/block-agent-flow/ui-default')).AgentFlowRenderView;

const asMdxComponent = (component: unknown): ComponentType<unknown> =>
  component as ComponentType<unknown>;

export const componentsMap = {
  Callout: asMdxComponent(CalloutRenderView),
  Code: asMdxComponent(CodeRenderView),
  Image: asMdxComponent(ImageRenderView),
  Math: asMdxComponent(MathRenderView),
  Pdf: asMdxComponent(PdfRenderView),
  Jupyter: asMdxComponent(Jupyter),
  NnViz: asMdxComponent(NnViz),
  AgentFlow: asMdxComponent(AgentFlow),
} satisfies Readonly<Record<string, ComponentType<unknown>>>;
