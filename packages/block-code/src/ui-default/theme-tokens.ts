import type { ColorTokenName } from '@skb/design-tokens';

/**
 * Design tokens consumed by `code.css` via CSS variables (`var(--color-*)`).
 *
 * Runtime consumption flows entirely through the CSS layer — `code.css`
 * applies styles via selector matching and reads the `var(--color-X)` CSS
 * variables that `@skb/design-tokens` injects at the document root. This
 * typed manifest exists for two reasons:
 *
 * 1. **Static lock on the consumption surface**: any rename of a color
 *    token in `@skb/design-tokens` becomes a TypeScript error here, before
 *    it becomes a silent CSS lookup miss in the browser.
 * 2. **ADR-0008 D1 dead-dep mechanical-scan compliance**: every
 *    `package.json#dependencies/@skb/*` MUST have ≥ 1 source `from
 *    '@skb/<pkg>'` import. CSS-variable consumption is invisible to
 *    grep-based audit; this typed import + const closes the F3 violation
 *    surfaced in [ADR-0010 D3 #7a](../../../../docs/decisions/ADR-0010-wave-2-close.md).
 *
 * Mirrors `block-callout/src/ui-default/variant-tokens.ts:VARIANT_TOKENS`
 * (without the variant axis — block-code has a single visual presentation).
 *
 * Keep in sync with `code.css`: any new `var(--color-*)` usage in CSS MUST
 * add the corresponding `ColorTokenName` entry here. The
 * `theme-tokens.test.ts` covers-CSS invariant fails loudly on drift.
 */
export const CODE_THEME_TOKENS = {
  border: 'border',
  surface1: 'surface1',
  surface2: 'surface2',
  fg: 'fg',
  muted: 'muted',
  accent: 'accent',
} as const satisfies Readonly<Record<string, ColorTokenName>>;
