import type { ColorTokenName, SpaceTokenName } from '@skb/design-tokens';

/**
 * Design-token names referenced by `./pdf.css`. Bound to `@skb/design-tokens`'s
 * public `ColorTokenName` / `SpaceTokenName` surface so renaming or removing a
 * token over there raises a static type error here. The CSS itself uses
 * `rgb(var(--color-X))` / `var(--space-X)` directly; this file is the
 * authoritative compile-time witness for the `@skb/design-tokens` source
 * import (ADR-0008 D1 dead-dep policy: every `@skb/*` dep must have ≥1
 * TS-source consumer).
 *
 * Mirrors block-math/ui-default/math-tokens.ts pattern (sister-doc invariant
 * per ADR-0006 item #6).
 */
export interface PdfTokens {
  readonly borderToken: ColorTokenName;
  readonly bgToken: ColorTokenName;
  readonly errorToken: ColorTokenName;
  readonly gutterToken: SpaceTokenName;
}

export const PDF_TOKENS: PdfTokens = {
  borderToken: 'border',
  bgToken: 'surface1',
  errorToken: 'error',
  gutterToken: '4',
};
