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

// Wave 6 cf-20a (2026-05-09) — pass the BlockKind literal to
// makeMdxAdapter so each block gets wrapped in
// `<div class="skb-block-static" data-skb-block-kind="<kind>">` for
// the v2 chrome single-source rule (block-chrome.css). The kind
// literals match BlockNodeView.tsx's data-skb-block-kind on the editor
// path, so the same per-kind stripe color resolves on both routes.
//
// Note: block-Code's BlockKind is `componentCode` (cf-15b rename to
// escape ProseMirror's namespace collision with StarterKit's inline
// `code` mark); the user-facing chip label collapses back to `code` in
// BlockNodeView.tsx but the data attribute uses the internal name so
// the CSS selector matches the editor-side rule exactly.
export const componentsMap = {
  // 5 light blocks: server-rendered via prop-shape adapter + chrome wrap
  Callout: asMdxComponent(makeMdxAdapter(CalloutRenderView as never, 'callout')),
  Code: asMdxComponent(makeMdxAdapter(CodeRenderView as never, 'componentCode')),
  Image: asMdxComponent(makeMdxAdapter(ImageRenderView as never, 'image')),
  Math: asMdxComponent(makeMdxAdapter(MathRenderView as never, 'math')),
  Pdf: asMdxComponent(makeMdxAdapter(PdfRenderView as never, 'pdf')),
  // 3 heavy blocks: Astro wrappers attach client:load hydration around React islands.
  // The Astro wrappers emit their own `.skb-block-static` chrome wrap; see
  // apps/site/src/components/{Jupyter,NnViz,AgentFlow}.astro.
  Jupyter,
  NnViz,
  AgentFlow,
} satisfies Readonly<Record<string, unknown>>;
