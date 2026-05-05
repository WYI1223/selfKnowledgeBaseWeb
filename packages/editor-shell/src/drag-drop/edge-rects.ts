/**
 * ADR-0017 D2 + D5 option 1 editor-side drag/drop hit geometry.
 *
 * `EDGE_W = 2 * GAP` is the mathematical-coupling invariant: the
 * half-in / half-out 28px edge width fully covers the 14px grid gap between
 * adjacent blocks. Keep `GAP = 14` byte-equal to
 * `apps/site/src/styles/grid.css` `.skb-grid { --gap: 14px }` until Stage
 * C.3 gives the grid constants a shared token authority.
 */
export const EDGE_W = 28;
export const GAP = 14;

export type EdgeMode = 'split-left' | 'split-right' | 'split-top' | 'split-bottom';

export interface BlockLayout {
  blockId: string;
  rect: DOMRectReadOnly;
}

export interface EdgeRect {
  blockId: string;
  mode: EdgeMode;
  x: number;
  y: number;
  width: number;
  height: number;
}

function edgeRectsForBlock(block: BlockLayout): EdgeRect[] {
  const { blockId, rect } = block;

  return [
    {
      blockId,
      mode: 'split-left',
      x: rect.left - EDGE_W / 2,
      y: rect.top,
      width: EDGE_W,
      height: rect.height,
    },
    {
      blockId,
      mode: 'split-right',
      x: rect.right - EDGE_W / 2,
      y: rect.top,
      width: EDGE_W,
      height: rect.height,
    },
    {
      blockId,
      mode: 'split-top',
      x: rect.left,
      y: rect.top - EDGE_W / 2,
      width: rect.width,
      height: EDGE_W,
    },
    {
      blockId,
      mode: 'split-bottom',
      x: rect.left,
      y: rect.bottom - EDGE_W / 2,
      width: rect.width,
      height: EDGE_W,
    },
  ];
}

export function computeEdgeRects(blocks: BlockLayout[]): EdgeRect[] {
  return blocks.flatMap(edgeRectsForBlock);
}
