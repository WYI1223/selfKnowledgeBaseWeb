/**
 * Grid position persisted for block layout contexts.
 *
 * Authority: ADR-0016 D2 defines the `{col, row?, colSpan, rowSpan}`
 * data model; D10 makes these primitives the block-foundation surface.
 */
export interface BlockGridPosition {
  /** 1-based starting column. */
  readonly col: number;
  /** Optional 1-based starting row; undefined lets grid-auto-flow place it. */
  readonly row?: number;
  /** Column span; must be one of COL_SNAPS per ADR-0016 D6. */
  readonly colSpan: number;
  /** Integer row span, or prose auto-height per ADR-0016 D2/D3. */
  readonly rowSpan: number | 'auto';
}

/**
 * ADR-0016 D2/D6 snap ladder: 1/6, 1/4, 1/3, 1/2, 2/3, full.
 *
 * Transitional dual source: keep byte-equal to mdx-bridge serialize.ts
 * and parse.ts until the C.2-3/C.2-4 unification PR imports this const.
 */
export const COL_SNAPS = [2, 3, 4, 6, 8, 12] as const;

/**
 * Grid serialize/parse discriminator per ADR-0016 D10.
 *
 * Must stay structurally identical to BlockKind in registry.ts; runtime
 * mirror logic is deferred to C.2-4.
 */
export type BlockGridKind = 'prose' | 'component' | 'render' | 'viz';

/**
 * ADR-0016 D10 row-span declaration.
 *
 * `auto` is rendering-derived prose height; `integer` is user-set and
 * persisted by non-prose blocks.
 */
export type RowSpanSemantic = 'auto' | 'integer';

/**
 * ADR-0016 D10 prose grid defaults, parallel to proseExtensions.
 *
 * Editor-shell and mdx-bridge consume this in C.2-3/C.2-4 so prose blocks
 * share grid semantics with component-backed blocks.
 */
export const proseGridDefaults = {
  rowSpanSemantic: 'auto',
  gridKind: 'prose',
  defaultColSpan: 12,
} as const;
