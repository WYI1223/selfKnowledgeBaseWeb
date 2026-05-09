/**
 * @skb/editor-shell <RowLadder> — right-margin row-snap visual.
 *
 * Wave 6 cf-20d (2026-05-09) — implements the `.row-ladder` v2
 * contract per /mnt/d/download/web/v2-styles.css:359-385. Renders
 * during a bottom-edge or corner resize gesture as a vertical strip
 * to the RIGHT of the resizing block, with one rung per integer
 * row spanning from the block's top down to its current snapped
 * height. The active rung (the row count that the cursor is
 * currently snapped to) is highlighted with the accent color.
 *
 * Position is `position: fixed` anchored to the resizing block's
 * bounding rect (passed in as `blockRect`). The 26px width + 8px
 * right offset comes from v2-styles.css:359-365.
 *
 * Props:
 *   - `rowCount`     total rungs to render (typically the max row
 *                    snap target the user could reasonably reach;
 *                    cf-20d caps at `Math.max(8, snappedRowSpan)`
 *                    in the consumer to give the user some room
 *                    above the current snap)
 *   - `activeRow`    the row count the cursor is currently snapped
 *                    to (1-based; matches `snappedRowSpan` from
 *                    `useResizePipeline`)
 *   - `blockRect`    the resizing block's bounding rect (used for
 *                    fixed-positioning anchor)
 *   - `rowH`         CSS pixels per row (matches grid `--row-h`;
 *                    typically 48 per `DEFAULT_GRID_GEOMETRY`)
 *   - `gap`          CSS pixels gap between rows (typically 14)
 */
import type { CSSProperties, ReactElement } from 'react';

export interface RowLadderProps {
  readonly rowCount: number;
  readonly activeRow: number | null;
  readonly blockRect: DOMRectReadOnly;
  readonly rowH: number;
  readonly gap: number;
  readonly className?: string;
}

const RIGHT_OFFSET = 8;
const LADDER_WIDTH = 26;

function rootClassName(className: string | undefined): string {
  return className ? `skb-row-ladder ${className}` : 'skb-row-ladder';
}

function rungClassName(active: boolean): string {
  return active
    ? 'skb-row-ladder-rung skb-row-ladder-rung--active'
    : 'skb-row-ladder-rung';
}

function rootStyle(blockRect: DOMRectReadOnly): CSSProperties {
  return {
    position: 'fixed',
    left: blockRect.right + RIGHT_OFFSET,
    top: blockRect.top,
    width: LADDER_WIDTH,
    pointerEvents: 'none',
    zIndex: 50,
  };
}

function rungStyle(rowH: number, gap: number): CSSProperties {
  return {
    height: rowH,
    marginBottom: gap,
  };
}

export function RowLadder(props: RowLadderProps): ReactElement {
  const { rowCount, activeRow, blockRect, rowH, gap, className } = props;

  // Render `rowCount` rungs (1-indexed for the active comparison).
  const rungs: ReactElement[] = [];
  for (let i = 1; i <= rowCount; i += 1) {
    const isActive = i === activeRow;
    rungs.push(
      <div
        key={i}
        aria-hidden="true"
        className={rungClassName(isActive)}
        data-skb-row-ladder-rung={i}
        style={rungStyle(rowH, gap)}
      />,
    );
  }

  return (
    <div
      aria-hidden="true"
      className={rootClassName(className)}
      data-skb-row-ladder=""
      style={rootStyle(blockRect)}
    >
      {rungs}
    </div>
  );
}
