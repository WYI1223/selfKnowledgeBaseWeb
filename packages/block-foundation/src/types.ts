/**
 * Grid position persisted for block layout contexts.
 *
 * Authority: ADR-0016 D2 defines the `{col, row?, colSpan, rowSpan}`
 * data model; D10 makes these primitives the block-foundation surface.
 * ADR-0020 D1 (Wave 7 Phase 2A): rowSpan is a discrete integer. The
 * legacy `'auto'` literal (cf-25 prose auto-height sentinel) has been
 * removed; markdown blocks now default to integer rowSpan = 1 and
 * overflow scrolls inside the block per design-doc §5.
 */
export interface BlockGridPosition {
  /** 1-based starting column. */
  readonly col: number;
  /** Optional 1-based starting row; undefined lets grid-auto-flow place it. */
  readonly row?: number;
  /** Column span; must be one of COL_SNAPS per ADR-0016 D6. */
  readonly colSpan: number;
  /** Integer row span per ADR-0020 D1. */
  readonly rowSpan: number;
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
 * ADR-0016 D10 prose grid defaults, parallel to proseExtensions.
 *
 * Wave 7 Phase 2A: `rowSpanSemantic` removed (ADR-0020 D1 — rowSpan is
 * always a discrete integer). Markdown default is 12 × 1 per
 * design-doc §6; content overflow scrolls inside the block.
 */
export const proseGridDefaults = {
  gridKind: 'prose',
  defaultColSpan: 12,
  defaultRowSpan: 1,
} as const;
