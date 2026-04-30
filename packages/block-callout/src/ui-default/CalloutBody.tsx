import type { ReactNode } from 'react';
import type { z } from 'zod';
import { calloutCore } from '../core/core-definition';
import { VARIANT_ICONS } from './icons';
import { VARIANT_TOKENS, type Variant } from './variant-tokens';

type CalloutProps = z.infer<typeof calloutCore.propsSchema>;

export interface CalloutBodyProps {
  readonly props: CalloutProps;
  readonly children: ReactNode;
}

/**
 * Visual primitive shared by `CalloutEditorView` and `CalloutRenderView`. The
 * two views differ only in how they hand `children` in (Tiptap-managed inner
 * node vs. static SSR content); the DOM/class shape MUST match byte-for-byte
 * so the editor preview and the published page render identically.
 *
 * Visual rules live in `./callout.css` (gated on `data-callout-variant`).
 */
export function CalloutBody({ props, children }: CalloutBodyProps): ReactNode {
  const variant: Variant = props.variant;
  const tokens = VARIANT_TOKENS[variant];
  const Icon = VARIANT_ICONS[variant];
  const heading = props.title ?? tokens.label;

  return (
    <aside
      role="note"
      aria-label={`${tokens.label} callout`}
      data-callout-variant={variant}
      tabIndex={0}
    >
      <span className="skb-callout-icon" aria-hidden="true">
        <Icon />
      </span>
      <div className="skb-callout-body">
        <strong className="skb-callout-title">{heading}</strong>
        <div className="skb-callout-content">{children}</div>
      </div>
    </aside>
  );
}
