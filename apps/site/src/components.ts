import { type ComponentType } from 'react';
import { CalloutRenderView } from '@skb/block-callout/ui-default';
import { CodeRenderView } from '@skb/block-code/ui-default';
import { ImageRenderView } from '@skb/block-image/ui-default';
import { MathRenderView } from '@skb/block-math/ui-default';
import { PdfRenderView } from '@skb/block-pdf/ui-default';
import Jupyter from './components/Jupyter.astro';
import NnViz from './components/NnViz.astro';
import AgentFlow from './components/AgentFlow.astro';
import '@skb/heavy-block-boundary/heavy-block-skeleton.css';
import { type FlatProps, makeMdxAdapter } from './lib/mdx-adapter';

export type { FlatProps } from './lib/mdx-adapter';
export { makeMdxAdapter } from './lib/mdx-adapter';

const asMdxComponent = (component: ComponentType<FlatProps>): ComponentType<unknown> =>
  component as unknown as ComponentType<unknown>;

export const componentsMap = {
  // 5 light blocks: server-rendered via prop-shape adapter
  Callout: asMdxComponent(makeMdxAdapter(CalloutRenderView as never)),
  Code: asMdxComponent(makeMdxAdapter(CodeRenderView as never)),
  Image: asMdxComponent(makeMdxAdapter(ImageRenderView as never)),
  Math: asMdxComponent(makeMdxAdapter(MathRenderView as never)),
  Pdf: asMdxComponent(makeMdxAdapter(PdfRenderView as never)),
  // 3 heavy blocks: Astro wrappers attach client:load hydration around React islands.
  Jupyter,
  NnViz,
  AgentFlow,
} satisfies Readonly<Record<string, unknown>>;
