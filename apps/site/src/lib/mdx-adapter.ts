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

export type FlatProps = Record<string, unknown> & { children?: ReactNode };

export function makeMdxAdapter(
  RenderView: ComponentType<{ readonly props: Record<string, unknown>; readonly content?: string }>,
): ComponentType<FlatProps> {
  return function MdxAdapter({ children, ...rest }: FlatProps) {
    const content = typeof children === 'string' ? children : undefined;
    return createElement(RenderView, { props: rest, content });
  };
}
