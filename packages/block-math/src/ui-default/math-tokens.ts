import type { ColorTokenName } from '@skb/design-tokens';

/**
 * Design-token names referenced by `./math.css`. Bound to `@skb/design-tokens`'s
 * public `ColorTokenName` surface so renaming or removing a token over there
 * raises a static type error here. The CSS itself uses `rgb(var(--color-X))`
 * directly; this file is the authoritative compile-time witness for the
 * `@skb/design-tokens` source import (ADR-0008 D1 dead-dep policy: every
 * `@skb/*` dep must have ≥1 TS-source consumer).
 *
 * Mirrors block-callout/ui-default/variant-tokens.ts pattern (sister-doc
 * invariant per ADR-0006 item #6).
 */
export interface MathTokens {
  readonly errorToken: ColorTokenName;
  readonly fgToken: ColorTokenName;
}

export const MATH_TOKENS: MathTokens = {
  errorToken: 'error',
  fgToken: 'fg',
};
