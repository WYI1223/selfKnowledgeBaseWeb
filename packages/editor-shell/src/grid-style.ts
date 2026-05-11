/**
 * @skb/editor-shell — grid placement style derivation.
 *
 * Wave 6 cf-20b (2026-05-09) — single source of the
 * `BlockGridPosition → CSSProperties` mapping consumed by:
 *   - BlockNodeView.tsx (editor-mount path; `.skb-block-nodeview` wrapper)
 *   - apps/site/src/lib/mdx-adapter.ts (read-route 5 light blocks; `.skb-block-static`)
 *   - apps/site/src/components/{Jupyter,NnViz,AgentFlow}.astro
 *     (read-route 3 heavy blocks; `.skb-block-static` shell)
 *
 * Authority: ADR-0016 D2 (`BlockGridPosition` shape) + ADR-0016 D8
 * (Astro renderer applies `style.gridColumn` / `style.gridRow`) +
 * ADR-0016 v0.2 D11.1 amendment (editor-surface grid lock; cf-20b).
 *
 * Formula (per ADR-0016 D2 CSS application block):
 *   gridColumn = `${col} / span ${colSpan}`
 *   gridRow    = row !== undefined
 *                  ? `${row} / span ${rowSpan}`
 *                  : `span ${rowSpan}`
 *
 * The `row` field is OPTIONAL per ADR-0016 D2: when omitted, callers let
 * `grid-auto-flow: row` decide the row index at layout time. The output
 * `gridRow` value reflects this (`span N` shorthand, no explicit row).
 *
 * Wave 7 Phase 2A (ADR-0020 D1): rowSpan is a discrete integer; the
 * legacy `'auto'` literal has been removed. Markdown content that
 * exceeds the integer rowSpan scrolls inside the block via grid.css
 * `overflow-y: auto`.
 */

import type { CSSProperties } from 'react';

export interface GridPlacementInput {
  /** 1-based starting column. Required. */
  readonly col: number;
  /** Optional 1-based starting row. */
  readonly row?: number;
  /** Column span. Required. */
  readonly colSpan: number;
  /** Integer row span per ADR-0020 D1. Required. */
  readonly rowSpan: number;
}

/**
 * Derive the `gridColumn` + `gridRow` inline style for a block at the
 * given `BlockGridPosition`. Returns a partial CSSProperties spread-able
 * onto the wrapper React element OR concatenable into an Astro inline
 * `style="..."` string via `gridStyleAttr` below.
 */
export function gridPlacementStyle(pos: GridPlacementInput): CSSProperties {
  const gridColumn = `${pos.col} / span ${pos.colSpan}`;
  const gridRow =
    pos.row !== undefined
      ? `${pos.row} / span ${pos.rowSpan}`
      : `span ${pos.rowSpan}`;
  return { gridColumn, gridRow };
}

/**
 * Astro-friendly serialization: returns the `style="..."` attribute body
 * (NOT including the `style="..."` wrapper). Designed for the 3 heavy
 * block Astro wrappers which hand-roll inline style strings rather than
 * spread CSSProperties.
 *
 * Output shape: `grid-column: ${col} / span ${colSpan}; grid-row: ...`
 */
export function gridPlacementStyleAttr(pos: GridPlacementInput): string {
  const css = gridPlacementStyle(pos);
  return `grid-column: ${css.gridColumn}; grid-row: ${css.gridRow};`;
}

/**
 * Defensive coercion: extracts {col, row, colSpan, rowSpan} from an
 * arbitrary attrs / props record. Returns null if any required field
 * (col, colSpan, rowSpan) is missing or invalid. The read route's
 * `.skb-grid > *:not([style*="grid-column"])` fallback then takes over
 * for null-result blocks (full-width default).
 *
 * Wave 7 Phase 2A (ADR-0020 D1): rowSpan is a discrete integer. Legacy
 * `rowSpan='auto'` props from un-migrated read-route adapters are
 * normalized to 1 (the new prose default).
 */
export function extractGridPosition(
  attrs: Record<string, unknown> | undefined,
): GridPlacementInput | null {
  if (!attrs) return null;
  const col = attrs['col'];
  const colSpan = attrs['colSpan'];
  const rowSpanRaw = attrs['rowSpan'];
  const row = attrs['row'];

  if (typeof col !== 'number' || !Number.isInteger(col) || col < 1) return null;
  if (typeof colSpan !== 'number' || !Number.isInteger(colSpan) || colSpan < 1) return null;
  let rowSpan: number;
  if (rowSpanRaw === 'auto') {
    rowSpan = 1; // Legacy 'auto' literal — normalize to prose default.
  } else if (
    typeof rowSpanRaw === 'number' &&
    Number.isInteger(rowSpanRaw) &&
    rowSpanRaw >= 1
  ) {
    rowSpan = rowSpanRaw;
  } else {
    return null;
  }

  const result: GridPlacementInput = { col, colSpan, rowSpan };
  if (typeof row === 'number' && Number.isInteger(row) && row >= 1) {
    return { ...result, row };
  }
  return result;
}
