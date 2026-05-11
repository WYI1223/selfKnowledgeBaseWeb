/**
 * @skb/grid-engine — drop intent inference + hole-fill smart placement.
 *
 * Per docs/design/grid-redesign-2026-05-11.md §3.1 + §3.2.
 *
 * v1 scope: handles "cursor in empty space" → propose place at cursor
 * with size = min(default, max-empty-rect at cursor). Does NOT handle
 * "cursor on edge of existing block" intent (split-* style); that's v2.
 */
import { findCollidingBlocks, isRegionEmpty } from './collision';
import { DEFAULT_SIZES } from './defaults';
import type { BlockKind, DropIntent, GridState } from './types';

/**
 * Greedy maximal-empty-rectangle starting at (col, row), growing right
 * then down, capped by (maxW × maxH).
 *
 * NOT optimal max-rect — proper algorithm is O(N²) and we don't need
 * pixel-perfect optimal for hole-fill UX. Greedy gives sensible results
 * for common cases. Property test validates no invariant breakage.
 */
export function maxEmptyRectAt(
  state: GridState,
  col: number,
  row: number,
  maxW: number,
  maxH: number,
): { w: number; h: number } {
  // First check (col, row) itself is empty
  if (!isRegionEmpty(state, { col, row, colSpan: 1, rowSpan: 1 })) {
    return { w: 0, h: 0 };
  }
  // Grow rightward at row=row, single-row check
  let w = 1;
  while (
    w < maxW &&
    col + w < state.totalCols &&
    isRegionEmpty(state, { col: col + w, row, colSpan: 1, rowSpan: 1 })
  ) {
    w++;
  }
  // Grow downward at width w
  let h = 1;
  while (
    h < maxH &&
    isRegionEmpty(state, { col, row: row + h, colSpan: w, rowSpan: 1 })
  ) {
    h++;
  }
  return { w, h };
}

export function inferDropIntent(
  state: GridState,
  cursorCol: number,
  cursorRow: number,
  blockKind: BlockKind,
): DropIntent {
  const def = DEFAULT_SIZES[blockKind];
  // Out of bounds → reject
  if (cursorCol < 0 || cursorCol >= state.totalCols || cursorRow < 0) {
    return {
      intent: 'reject',
      col: cursorCol,
      row: cursorRow,
      colSpan: 0,
      rowSpan: 0,
      reason: 'cursor out of bounds',
    };
  }
  // Cursor on existing block → reject. (Edge-of-block intent is v2.)
  const cursorOccupant = findCollidingBlocks(state, {
    col: cursorCol,
    row: cursorRow,
    colSpan: 1,
    rowSpan: 1,
  });
  if (cursorOccupant.length > 0) {
    return {
      intent: 'reject',
      col: cursorCol,
      row: cursorRow,
      colSpan: 0,
      rowSpan: 0,
      reason: `cell occupied by ${cursorOccupant[0]!.id}`,
    };
  }
  // Find max empty rect containing cursor, capped by default size
  const hole = maxEmptyRectAt(state, cursorCol, cursorRow, def.w, def.h);
  if (hole.w === 0 || hole.h === 0) {
    return {
      intent: 'reject',
      col: cursorCol,
      row: cursorRow,
      colSpan: 0,
      rowSpan: 0,
      reason: 'no empty rect at cursor',
    };
  }
  return {
    intent: 'place',
    col: cursorCol,
    row: cursorRow,
    colSpan: hole.w,
    rowSpan: hole.h,
  };
}
