/**
 * @skb/editor-shell — ThemeBaseplate React mount.
 *
 * Wave 7 Phase 2D — wires `theme.renderBaseplate(...)` into the
 * editor mount per ADR-0020 D7. The baseplate is a positioned-absolute
 * child of `.skb-grid` (z-index 0, behind block content). The theme
 * owns its rendering; this helper just passes the props in.
 *
 * `totalRows` defaults to a sensible viewport-fill (20 rows × slot
 * size ≈ 1240px for lego-studs at 80px slot, 1240px for graph-paper
 * at 60px, 2000px for bento-canvas at 100px). When the editor's doc
 * actually has more rows than this default, the baseplate's
 * background pattern tiles via `background-size` so the visible
 * pattern still extends past the explicit rect — no extra wiring
 * needed for the v1 ship.
 */
import type { GridTheme } from '@skb/grid-themes';

const DEFAULT_TOTAL_ROWS = 20;

export interface ThemeBaseplateProps {
  theme: GridTheme;
  /** True when a pointer or keyboard drag is active — bento-canvas uses
   *  this to show its grid lines only during drag (idle state hidden). */
  dragInProgress: boolean;
  /** Optional override; default is `DEFAULT_TOTAL_ROWS`. */
  totalRows?: number;
}

export function ThemeBaseplate({
  theme,
  dragInProgress,
  totalRows = DEFAULT_TOTAL_ROWS,
}: ThemeBaseplateProps) {
  return (
    <>
      {theme.renderBaseplate({
        totalCols: 12,
        totalRows,
        dragInProgress,
        slotSize: theme.slotSize,
      })}
    </>
  );
}
