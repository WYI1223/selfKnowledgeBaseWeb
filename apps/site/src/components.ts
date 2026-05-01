import { type ComponentType, type ReactNode, createElement } from 'react';
import { CalloutRenderView } from '@skb/block-callout/ui-default';
import { CodeRenderView } from '@skb/block-code/ui-default';
import { ImageRenderView } from '@skb/block-image/ui-default';
import { MathRenderView } from '@skb/block-math/ui-default';
import { PdfRenderView } from '@skb/block-pdf/ui-default';

// Type-only imports preserve ADR-0008 D1 three-way symmetry for the 3
// heavy blocks while runtime integration is deferred to Wave 4 / ADR-0014
// (see HeavyBlockPlaceholder below for rationale).
import type {} from '@skb/block-jupyter/ui-default';
import type {} from '@skb/block-nn-viz/ui-default';
import type {} from '@skb/block-agent-flow/ui-default';

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

// 3 heavy blocks (Jupyter / NnViz / AgentFlow) cannot SSR in Astro's
// ESM-only static build because their runtime deps (Pyodide / TF.js /
// React Flow) use CommonJS `require()`. Phase 1 (C3): SSR a placeholder
// element so the page builds + tests can grep block markers. Phase 2
// (Wave 4 / ADR-0014): proper client:only wrapper components for live
// heavy-block rendering. The placeholder includes a `data-block` marker
// for SSR-marker tests + a `data-deferred="wave-4"` attribute for
// runtime detection by future client wrappers.
function makeHeavyBlockPlaceholder(blockName: string): ComponentType<FlatProps> {
  return function HeavyBlockPlaceholder() {
    return createElement(
      'div',
      {
        'data-block': blockName,
        'data-deferred': 'wave-4',
        className: 'block-deferred',
      },
      `${blockName} block: client-side rendering deferred to Wave 4 (ADR-0014 candidate; SSR-safe heavy-block integration).`,
    );
  };
}

const asMdxComponent = (component: ComponentType<FlatProps>): ComponentType<unknown> =>
  component as unknown as ComponentType<unknown>;

export const componentsMap = {
  // 5 light blocks: server-rendered via prop-shape adapter
  Callout: asMdxComponent(makeMdxAdapter(CalloutRenderView as never)),
  Code: asMdxComponent(makeMdxAdapter(CodeRenderView as never)),
  Image: asMdxComponent(makeMdxAdapter(ImageRenderView as never)),
  Math: asMdxComponent(makeMdxAdapter(MathRenderView as never)),
  Pdf: asMdxComponent(makeMdxAdapter(PdfRenderView as never)),
  // 3 heavy blocks: SSR placeholder; live rendering deferred to Wave 4
  Jupyter: asMdxComponent(makeHeavyBlockPlaceholder('jupyter')),
  NnViz: asMdxComponent(makeHeavyBlockPlaceholder('nn-viz')),
  AgentFlow: asMdxComponent(makeHeavyBlockPlaceholder('agent-flow')),
} satisfies Readonly<Record<string, ComponentType<unknown>>>;
