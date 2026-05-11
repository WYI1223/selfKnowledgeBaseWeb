import type { ComponentType, ReactNode } from 'react';
import type { BlockViewProps } from '@skb/block-foundation';
import { markdownCore } from '../core/core-definition';

/**
 * Wave 6 cf-25 — Markdown block render view (read route).
 *
 * Used by `apps/site` mdx-adapter when MDX `<Markdown ...>...</Markdown>`
 * elements are rendered server-side. The wrapper passes inner JSX
 * children (rendered prose nodes) via the React `content` slot —
 * for the read route, mdx-adapter will pass the children directly
 * because `<Markdown>` always wraps prose children, not a string.
 *
 * Renders the inner prose under a `.skb-prose` namespace so the
 * shared design-tokens prose typography applies. The cf-19 chrome
 * (`.skb-block-static[data-skb-block-kind='markdown']`) is added by
 * the apps/site `makeMdxAdapter` wrap per cf-20a single-source
 * chrome rule.
 */
export const MarkdownRenderView: ComponentType<
  BlockViewProps<typeof markdownCore.propsSchema>
> = ({ content }) => {
  const body: ReactNode = content ?? '';
  return <div className="skb-prose">{body}</div>;
};
