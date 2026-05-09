import { describe, expect, it } from 'vitest';
import type { EdgeMatch } from '../../drag-drop/tiebreak';
import { findMatches, tiebreak } from '../../drag-drop/tiebreak';
import type { EdgeRect } from '../../drag-drop/edge-rects';

function match(
  blockId: string,
  mode: EdgeMatch['mode'],
  distance: number,
  left: number,
  top: number,
): EdgeMatch {
  return { blockId, mode, distance, blockBounds: { left, top } };
}

function rect(x: number, y: number, width: number, height: number): DOMRectReadOnly {
  return new DOMRectReadOnly(x, y, width, height);
}

describe('tiebreak', () => {
  it('empty matches returns null', () => {
    expect(tiebreak([], { vx: 0, vy: 0 })).toBeNull();
  });

  it('single match returned as-is', () => {
    const onlyMatch = match('b1', 'split-left', 4, 0, 0);

    expect(tiebreak([onlyMatch], { vx: 0, vy: 0 })).toBe(onlyMatch);
  });

  it('step 1 closest wins', () => {
    const closest = match('b1', 'split-right', 4, 0, 0);
    const farther = match('b2', 'split-left', 10, 114, 0);

    expect(tiebreak([farther, closest], { vx: 0, vy: 0 })).toBe(closest);
  });

  it('step 1 uses abs not signed', () => {
    const signedFarther = match('b1', 'split-right', -8, 0, 0);
    const closest = match('b2', 'split-left', 4, 114, 0);

    expect(tiebreak([signedFarther, closest], { vx: 0, vy: 0 })).toBe(closest);
  });

  it('step 2 vx>0 prefers split-left', () => {
    const leftBlock = match('left', 'split-right', 7, 0, 0);
    const rightBlock = match('right', 'split-left', 7, 114, 0);

    expect(tiebreak([leftBlock, rightBlock], { vx: 5, vy: 0 })).toBe(rightBlock);
  });

  it('step 2 vx<0 prefers split-right', () => {
    const leftBlock = match('left', 'split-right', 7, 0, 0);
    const rightBlock = match('right', 'split-left', 7, 114, 0);

    expect(tiebreak([rightBlock, leftBlock], { vx: -5, vy: 0 })).toBe(leftBlock);
  });

  it('step 2 vertical velocity prefers split-top or split-bottom', () => {
    const upperBlock = match('upper', 'split-bottom', 7, 0, 0);
    const lowerBlock = match('lower', 'split-top', 7, 0, 64);

    expect(tiebreak([upperBlock, lowerBlock], { vx: 0, vy: 5 })).toBe(lowerBlock);
    expect(tiebreak([lowerBlock, upperBlock], { vx: 0, vy: -5 })).toBe(upperBlock);
  });

  it('step 3 epsilon 0.5 falls to spatial', () => {
    const spatialWinner = match('left', 'split-left', 7, 0, 0);
    const velocityWinner = match('right', 'split-left', 7, 100, 0);

    expect(tiebreak([velocityWinner, spatialWinner], { vx: 0.4, vy: 0.3 })).toBe(spatialWinner);
  });

  it('step 2 px/frame contract: slow rightward drag at 1 px/frame still triggers direction filter (cf-20c-2 R1 F3)', () => {
    // Wave 6 cf-20c-2 R1 F3 lock — the velocity unit contract is
    // **px/frame at 60fps**, not px/ms or px/sec. A real cursor
    // moving at 60 px/sec (a slow but intentional drag) computes
    // to ~1 px/frame at 60fps, which IS above the 0.5 threshold;
    // the direction filter MUST fire.
    //
    // Pre-R1 the pipeline (`use-drag-drop-pipeline.ts`) passed raw
    // `delta px / delta ms` (~0.06 for 60 px/sec), well below
    // threshold; tiebreak fell back to spatial order, ignoring the
    // user's directional intent. R1 fix: pipeline multiplies by 16
    // (≈ 1 frame at 60fps). This test documents the contract by
    // asserting tiebreak honors direction at vx=1 (the corrected unit
    // for a slow real drag).
    const leftBlock = match('left', 'split-right', 7, 0, 0);
    const rightBlock = match('right', 'split-left', 7, 114, 0);

    expect(tiebreak([leftBlock, rightBlock], { vx: 1, vy: 0 })).toBe(rightBlock);
  });

  it('step 3 spatial x-axis smaller left wins', () => {
    const leftmost = match('left', 'split-left', 4, 0, 0);
    const rightmost = match('right', 'split-left', 4, 100, 0);

    expect(tiebreak([rightmost, leftmost], { vx: 0, vy: 0 })).toBe(leftmost);
  });

  it('step 3 spatial y-axis smaller top wins', () => {
    const topmost = match('top', 'split-top', 4, 0, 0);
    const lower = match('lower', 'split-top', 4, 0, 100);

    expect(tiebreak([lower, topmost], { vx: 0, vy: 0 })).toBe(topmost);
  });

  it('step 3 blockId localeCompare stable', () => {
    const b2 = match('b2', 'split-left', 4, 0, 0);
    const b1 = match('b1', 'split-left', 4, 0, 0);

    expect(tiebreak([b2, b1], { vx: 0, vy: 0 })).toBe(b1);
  });
});

describe('findMatches', () => {
  it('closed interval abs<=14', () => {
    const edgeRects: EdgeRect[] = [
      { blockId: 'boundary', mode: 'split-left', x: -14, y: 0, width: 28, height: 50 },
      { blockId: 'interior', mode: 'split-right', x: 13, y: 0, width: 28, height: 50 },
      { blockId: 'miss', mode: 'split-left', x: 15, y: 0, width: 28, height: 50 },
    ];
    const blockRects = new Map<string, DOMRectReadOnly>([
      ['boundary', rect(0, 0, 100, 50)],
      ['interior', rect(-73, 0, 100, 50)],
      ['miss', rect(29, 0, 100, 50)],
    ]);

    const matches = findMatches(14, 13, edgeRects, blockRects);

    expect(matches.map((found) => found.blockId).sort()).toEqual(['boundary', 'interior']);
    expect(matches.find((found) => found.blockId === 'boundary')?.distance).toBe(14);
    expect(matches.find((found) => found.blockId === 'interior')?.distance).toBe(13);
  });
});
