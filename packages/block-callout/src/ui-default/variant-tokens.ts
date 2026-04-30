import type { z } from 'zod';
import type { ColorTokenName } from '@skb/design-tokens';
import { calloutCore } from '../core/core-definition';

type Variant = z.infer<typeof calloutCore.propsSchema>['variant'];

interface VariantSpec {
  readonly label: string;
  /** Design-token color name driving the accent bar + icon glyph. */
  readonly accentToken: ColorTokenName;
}

/**
 * Variant → design-token mapping. The `ColorTokenName` constraint binds this
 * file to `@skb/design-tokens`'s public color token surface: renaming or
 * removing a color token here is a static type error.
 *
 * Visual styles for these variants live in `./callout.css` (selector
 * `[data-callout-variant="..."]`); this file is the single-source of variant
 * metadata consumed by both the React tree and any future style-introspection
 * tooling.
 */
export const VARIANT_TOKENS: Readonly<Record<Variant, VariantSpec>> = {
  note: { label: 'Note', accentToken: 'note' },
  tip: { label: 'Tip', accentToken: 'success' },
  warning: { label: 'Warning', accentToken: 'warn' },
  danger: { label: 'Danger', accentToken: 'error' },
};

export type { Variant };
