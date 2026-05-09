import { type ComponentType, type ReactNode, createElement } from 'react';

// MDX compiles `<Callout variant="note">body</Callout>` to flat React
// props (`<CalloutRenderView variant="note">{body}</CalloutRenderView>`),
// but block-* RenderView components destructure `{ props, content }:
// BlockViewProps`. Without an adapter `props` would be undefined and
// rendering breaks. The adapter wraps flat MDX props into BlockViewProps
// shape: { props: {...}, content: children-as-string }.
//
// Extracted to its own module (Wave 4 B7) so apps-local heavy block
// islands at apps/site/src/islands/ can consume the adapter without
// pulling components.ts (which would drag the 5 light block ui-defaults
// + the 3 Astro wrappers into the island bundle's static-import graph).
//
// Wave 6 cf-20a (2026-05-09) — single source of chrome (per user
// directive 2026-05-09 "全部对齐 v2"). Each adapter call now wraps its
// inner block component in a `<div class="skb-block-static"
// data-skb-block-kind="<kind>">` container so the static read-route
// (/notes/<slug>) gets the same v2 `.gblock` chrome (border / radius /
// hover / per-kind 2px stripe) as the editor-mount path
// (/notes/<slug>/edit) gets via `.skb-block-nodeview`. Both wrappers
// resolve their visual rules through the shared
// `@skb/editor-shell/src/block-chrome.css` module imported once at the
// apps/site bundler entry (`apps/site/src/styles/global.css`).
//
// `kind` is the BlockKind literal (matches the Tiptap node name +
// `data-skb-block-kind` set by BlockNodeView.tsx on the editor path).
// 8 kinds: callout / componentCode / image / math / pdf / jupyter /
// nn-viz / agent-flow. The 3 heavy block Astro wrappers (Jupyter.astro
// / NnViz.astro / AgentFlow.astro) emit their own `.skb-block-static`
// wrap directly since they don't go through this adapter.

export type FlatProps = Record<string, unknown> & { children?: ReactNode };

export type BlockKindForChrome =
  | 'callout'
  | 'componentCode'
  | 'image'
  | 'math'
  | 'pdf';

export function makeMdxAdapter(
  RenderView: ComponentType<{ readonly props: Record<string, unknown>; readonly content?: string }>,
  kind: BlockKindForChrome,
): ComponentType<FlatProps> {
  return function MdxAdapter({ children, ...rest }: FlatProps) {
    const content = typeof children === 'string' ? children : undefined;
    return createElement(
      'div',
      { className: 'skb-block-static', 'data-skb-block-kind': kind },
      createElement(RenderView, { props: rest, content }),
    );
  };
}
