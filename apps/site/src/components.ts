import type { ComponentType } from 'react';
import { AgentFlowRenderView } from '@skb/block-agent-flow/ui-default';
import { CalloutRenderView } from '@skb/block-callout/ui-default';
import { CodeRenderView } from '@skb/block-code/ui-default';
import { ImageRenderView } from '@skb/block-image/ui-default';
import { JupyterRenderView } from '@skb/block-jupyter/ui-default';
import { MathRenderView } from '@skb/block-math/ui-default';
import { NnVizRenderView } from '@skb/block-nn-viz/ui-default';
import { PdfRenderView } from '@skb/block-pdf/ui-default';

const asMdxComponent = (component: unknown): ComponentType<unknown> =>
  component as ComponentType<unknown>;

export const componentsMap = {
  Callout: asMdxComponent(CalloutRenderView),
  Code: asMdxComponent(CodeRenderView),
  Image: asMdxComponent(ImageRenderView),
  Math: asMdxComponent(MathRenderView),
  Pdf: asMdxComponent(PdfRenderView),
  Jupyter: asMdxComponent(JupyterRenderView),
  NnViz: asMdxComponent(NnVizRenderView),
  AgentFlow: asMdxComponent(AgentFlowRenderView),
} satisfies Readonly<Record<string, ComponentType<unknown>>>;
