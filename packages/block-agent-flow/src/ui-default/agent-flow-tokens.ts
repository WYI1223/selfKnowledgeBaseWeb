import type { ColorTokenName } from '@skb/design-tokens';

/**
 * Design-token names referenced by `./agent-flow.css`. Bound to
 * `@skb/design-tokens`'s public `ColorTokenName` surface so renaming or
 * removing a token over there raises a static type error here. The CSS itself
 * uses `rgb(var(--color-X))` directly; this file is the authoritative
 * compile-time witness for the `@skb/design-tokens` source import (ADR-0008
 * D1 dead-dep policy: every `@skb/*` dep must have ≥1 TS-source consumer).
 *
 * Mirrors block-jupyter/ui-default/jupyter-tokens.ts pattern (sister-doc
 * invariant per ADR-0006 item #6).
 */
export interface AgentFlowTokens {
  readonly fgToken: ColorTokenName;
  readonly mutedToken: ColorTokenName;
  readonly accentToken: ColorTokenName;
  readonly errorToken: ColorTokenName;
}

export const AGENT_FLOW_TOKENS: AgentFlowTokens = {
  fgToken: 'fg',
  mutedToken: 'muted',
  accentToken: 'accent',
  errorToken: 'error',
};
