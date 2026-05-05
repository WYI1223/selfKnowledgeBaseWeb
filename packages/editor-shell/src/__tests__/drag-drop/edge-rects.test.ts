import { describe, expect, it } from 'vitest';
import { computeEdgeRects, EDGE_W, GAP } from '../../drag-drop/edge-rects';

function rect(x: number, y: number, width: number, height: number): DOMRectReadOnly {
  return new DOMRectReadOnly(x, y, width, height);
}

describe('EDGE_W constant', () => {
  it('equals 28', () => {
    expect(EDGE_W).toBe(28);
  });
});

describe('GAP constant', () => {
  it('equals 14', () => {
    expect(GAP).toBe(14);
  });
});

describe('coupling invariant', () => {
  it('EDGE_W = 2 * GAP', () => {
    expect(EDGE_W).toBe(2 * GAP);
  });
});

describe('computeEdgeRects', () => {
  it('single block emits 4 rects', () => {
    const edgeRects = computeEdgeRects([{ blockId: 'b1', rect: rect(100, 200, 300, 100) }]);

    expect(edgeRects).toEqual([
      { blockId: 'b1', mode: 'split-left', x: 86, y: 200, width: 28, height: 100 },
      { blockId: 'b1', mode: 'split-right', x: 386, y: 200, width: 28, height: 100 },
      { blockId: 'b1', mode: 'split-top', x: 100, y: 186, width: 300, height: 28 },
      { blockId: 'b1', mode: 'split-bottom', x: 100, y: 286, width: 300, height: 28 },
    ]);
  });

  it('4 blocks emit 16 rects', () => {
    const blocks = [
      { blockId: 'b1', rect: rect(0, 0, 100, 50) },
      { blockId: 'b2', rect: rect(114, 0, 100, 50) },
      { blockId: 'b3', rect: rect(0, 64, 100, 50) },
      { blockId: 'b4', rect: rect(114, 64, 100, 50) },
    ];

    const edgeRects = computeEdgeRects(blocks);

    expect(edgeRects).toHaveLength(16);
    for (const block of blocks) {
      expect(edgeRects.filter((edgeRect) => edgeRect.blockId === block.blockId)).toHaveLength(4);
    }
  });

  it('adjacent blocks fully overlap in gap', () => {
    const edgeRects = computeEdgeRects([
      { blockId: 'left', rect: rect(0, 0, 100, 50) },
      { blockId: 'right', rect: rect(114, 0, 100, 50) },
    ]);

    const leftRightEdge = edgeRects.find(
      (edgeRect) => edgeRect.blockId === 'left' && edgeRect.mode === 'split-right',
    );
    const rightLeftEdge = edgeRects.find(
      (edgeRect) => edgeRect.blockId === 'right' && edgeRect.mode === 'split-left',
    );

    expect(leftRightEdge).toMatchObject({ x: 86, width: 28 });
    expect(rightLeftEdge).toMatchObject({ x: 100, width: 28 });

    const overlapStart = Math.max(leftRightEdge!.x, rightLeftEdge!.x);
    const overlapEnd = Math.min(
      leftRightEdge!.x + leftRightEdge!.width,
      rightLeftEdge!.x + rightLeftEdge!.width,
    );
    expect(overlapEnd - overlapStart).toBe(14);
  });

  it('empty input returns empty', () => {
    expect(computeEdgeRects([])).toEqual([]);
  });

  it('per-mode w/h invariants', () => {
    const edgeRects = computeEdgeRects([{ blockId: 'b1', rect: rect(50, 50, 200, 100) }]);
    const byMode = Object.fromEntries(edgeRects.map((edgeRect) => [edgeRect.mode, edgeRect]));

    expect(byMode['split-top']).toMatchObject({ width: 200, height: EDGE_W });
    expect(byMode['split-bottom']).toMatchObject({ width: 200, height: EDGE_W });
    expect(byMode['split-left']).toMatchObject({ width: EDGE_W, height: 100 });
    expect(byMode['split-right']).toMatchObject({ width: EDGE_W, height: 100 });
  });
});
