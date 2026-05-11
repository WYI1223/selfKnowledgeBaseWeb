import { describe, expect, it } from 'vitest';
import {
  applyDropMode,
  type GridSnapshotIdentified,
  type IdentifiedBlock,
} from '../apply-drop-mode';

function block(
  id: string,
  col: number,
  row: number,
  colSpan: number,
  rowSpan: number = 1,
): IdentifiedBlock {
  return { id, col, row, colSpan, rowSpan };
}

function snapshot(...blocks: IdentifiedBlock[]): GridSnapshotIdentified {
  return { blocks };
}

describe('applyDropMode — none', () => {
  it('returns baseline-equivalent snapshot (no mutation)', () => {
    const baseline = snapshot(block('a', 1, 1, 12));
    const result = applyDropMode({
      baseline,
      mode: 'none',
      sourceBlockId: 'src',
      hostBlockId: 'a',
    });
    expect(result.blocks).toEqual(baseline.blocks);
  });
});

describe('applyDropMode — empty', () => {
  it('inserts new block from palette at target', () => {
    const baseline = snapshot(block('a', 1, 1, 12));
    const newBlk = block('new1', 0, 0, 12);
    const result = applyDropMode({
      baseline,
      mode: 'empty',
      sourceBlockId: null,
      hostBlockId: null,
      newBlock: newBlk,
      emptyTarget: { col: 1, row: 2 },
    });
    expect(result.blocks).toHaveLength(2);
    const inserted = result.blocks.find((b) => b.id === 'new1');
    expect(inserted).toMatchObject({ id: 'new1', col: 1, row: 2, colSpan: 12 });
  });

  it('moves source block to empty target (preserves colSpan)', () => {
    const baseline = snapshot(block('a', 1, 1, 12), block('b', 1, 2, 6));
    const result = applyDropMode({
      baseline,
      mode: 'empty',
      sourceBlockId: 'b',
      hostBlockId: null,
      emptyTarget: { col: 7, row: 3 },
    });
    expect(result.blocks).toHaveLength(2);
    const moved = result.blocks.find((b) => b.id === 'b');
    expect(moved).toMatchObject({ id: 'b', col: 7, row: 3, colSpan: 6 });
  });

  it('throws when emptyTarget missing', () => {
    expect(() =>
      applyDropMode({
        baseline: snapshot(block('a', 1, 1, 12)),
        mode: 'empty',
        sourceBlockId: null,
        hostBlockId: null,
        newBlock: block('new1', 0, 0, 12),
      }),
    ).toThrow(/emptyTarget/);
  });

  it('throws when col + colSpan - 1 > 12', () => {
    expect(() =>
      applyDropMode({
        baseline: snapshot(),
        mode: 'empty',
        sourceBlockId: null,
        hostBlockId: null,
        newBlock: block('x', 0, 0, 8),
        emptyTarget: { col: 7, row: 1 },
      }),
    ).toThrow(/out of \[1,12\] range/);
  });
});

describe('applyDropMode — split-left', () => {
  it('halves colSpan=12 host into two colSpan=6 blocks (host shifts right)', () => {
    const baseline = snapshot(block('host', 1, 1, 12));
    const newBlk = block('new', 0, 0, 0);
    const result = applyDropMode({
      baseline,
      mode: 'split-left',
      sourceBlockId: null,
      hostBlockId: 'host',
      newBlock: newBlk,
    });
    expect(result.blocks).toHaveLength(2);
    const host = result.blocks.find((b) => b.id === 'host');
    const inserted = result.blocks.find((b) => b.id === 'new');
    expect(host).toMatchObject({ col: 7, colSpan: 6, row: 1 });
    expect(inserted).toMatchObject({ col: 1, colSpan: 6, row: 1 });
  });

  it('halves colSpan=8 → 4', () => {
    const baseline = snapshot(block('host', 1, 1, 8));
    const result = applyDropMode({
      baseline,
      mode: 'split-left',
      sourceBlockId: null,
      hostBlockId: 'host',
      newBlock: block('new', 0, 0, 0),
    });
    const host = result.blocks.find((b) => b.id === 'host');
    expect(host).toMatchObject({ col: 5, colSpan: 4 });
  });

  it('halves colSpan=6 → 3', () => {
    const baseline = snapshot(block('host', 1, 1, 6));
    const result = applyDropMode({
      baseline,
      mode: 'split-left',
      sourceBlockId: null,
      hostBlockId: 'host',
      newBlock: block('new', 0, 0, 0),
    });
    const host = result.blocks.find((b) => b.id === 'host');
    expect(host).toMatchObject({ col: 4, colSpan: 3 });
  });

  it('halves colSpan=4 → 2', () => {
    const baseline = snapshot(block('host', 1, 1, 4));
    const result = applyDropMode({
      baseline,
      mode: 'split-left',
      sourceBlockId: null,
      hostBlockId: 'host',
      newBlock: block('new', 0, 0, 0),
    });
    const host = result.blocks.find((b) => b.id === 'host');
    expect(host).toMatchObject({ col: 3, colSpan: 2 });
  });

  it('rejects odd host.colSpan (3, 5, 7, 9, 11)', () => {
    for (const odd of [3, 5, 7, 9, 11]) {
      expect(() =>
        applyDropMode({
          baseline: snapshot(block('host', 1, 1, odd)),
          mode: 'split-left',
          sourceBlockId: null,
          hostBlockId: 'host',
          newBlock: block('new', 0, 0, 0),
        }),
      ).toThrow(/evenly halvable/);
    }
  });

  it('rejects host.colSpan=2 (half=1 not in COL_SNAPS)', () => {
    expect(() =>
      applyDropMode({
        baseline: snapshot(block('host', 1, 1, 2)),
        mode: 'split-left',
        sourceBlockId: null,
        hostBlockId: 'host',
        newBlock: block('new', 0, 0, 0),
      }),
    ).toThrow(/COL_SNAPS/);
  });

  it('rejects host.colSpan=10 (half=5 not in COL_SNAPS)', () => {
    expect(() =>
      applyDropMode({
        baseline: snapshot(block('host', 1, 1, 10)),
        mode: 'split-left',
        sourceBlockId: null,
        hostBlockId: 'host',
        newBlock: block('new', 0, 0, 0),
      }),
    ).toThrow(/COL_SNAPS/);
  });

  it('moves source block from old position', () => {
    const baseline = snapshot(block('host', 1, 1, 12), block('source', 1, 5, 12));
    const result = applyDropMode({
      baseline,
      mode: 'split-left',
      sourceBlockId: 'source',
      hostBlockId: 'host',
    });
    expect(result.blocks).toHaveLength(2);
    const moved = result.blocks.find((b) => b.id === 'source');
    expect(moved).toMatchObject({ col: 1, colSpan: 6, row: 1 });
  });
});

describe('applyDropMode — split-right', () => {
  it('halves colSpan=12 host into two colSpan=6 blocks (host stays left)', () => {
    const baseline = snapshot(block('host', 1, 1, 12));
    const result = applyDropMode({
      baseline,
      mode: 'split-right',
      sourceBlockId: null,
      hostBlockId: 'host',
      newBlock: block('new', 0, 0, 0),
    });
    const host = result.blocks.find((b) => b.id === 'host');
    const inserted = result.blocks.find((b) => b.id === 'new');
    expect(host).toMatchObject({ col: 1, colSpan: 6, row: 1 });
    expect(inserted).toMatchObject({ col: 7, colSpan: 6, row: 1 });
  });

  it('rejects same odd colSpans as split-left', () => {
    for (const odd of [3, 5, 7]) {
      expect(() =>
        applyDropMode({
          baseline: snapshot(block('host', 1, 1, odd)),
          mode: 'split-right',
          sourceBlockId: null,
          hostBlockId: 'host',
          newBlock: block('new', 0, 0, 0),
        }),
      ).toThrow();
    }
  });
});

describe('applyDropMode — split-top', () => {
  it('cascades all blocks at row >= host.row down by 1', () => {
    const baseline = snapshot(
      block('a', 1, 1, 12),
      block('host', 1, 2, 12),
      block('b', 1, 3, 12),
      block('c', 1, 4, 12),
    );
    const result = applyDropMode({
      baseline,
      mode: 'split-top',
      sourceBlockId: null,
      hostBlockId: 'host',
      newBlock: block('new', 0, 0, 0),
    });
    expect(result.blocks).toHaveLength(5);
    expect(result.blocks.find((b) => b.id === 'a')?.row).toBe(1); // unchanged
    expect(result.blocks.find((b) => b.id === 'host')?.row).toBe(3); // shifted
    expect(result.blocks.find((b) => b.id === 'b')?.row).toBe(4); // cascaded
    expect(result.blocks.find((b) => b.id === 'c')?.row).toBe(5); // cascaded
    expect(result.blocks.find((b) => b.id === 'new')).toMatchObject({
      col: 1,
      row: 2,
      colSpan: 12,
    });
  });

  it('inserts at row 1 with no cascade when host is the first row', () => {
    const baseline = snapshot(block('host', 1, 1, 12));
    const result = applyDropMode({
      baseline,
      mode: 'split-top',
      sourceBlockId: null,
      hostBlockId: 'host',
      newBlock: block('new', 0, 0, 0),
    });
    const host = result.blocks.find((b) => b.id === 'host');
    const inserted = result.blocks.find((b) => b.id === 'new');
    expect(host?.row).toBe(2);
    expect(inserted).toMatchObject({ col: 1, row: 1, colSpan: 12 });
  });

  it('does not require split-* colSpan validation (any colSpan host accepted)', () => {
    for (const cs of [3, 5, 7, 11]) {
      const baseline = snapshot(block('host', 1, 1, cs));
      expect(() =>
        applyDropMode({
          baseline,
          mode: 'split-top',
          sourceBlockId: null,
          hostBlockId: 'host',
          newBlock: block('new', 0, 0, 0),
        }),
      ).not.toThrow();
    }
  });
});

describe('applyDropMode — split-bottom', () => {
  it('places new block immediately below host, cascades subsequent rows', () => {
    const baseline = snapshot(
      block('host', 1, 1, 12, 1),
      block('b', 1, 2, 12),
      block('c', 1, 3, 12),
    );
    const result = applyDropMode({
      baseline,
      mode: 'split-bottom',
      sourceBlockId: null,
      hostBlockId: 'host',
      newBlock: block('new', 0, 0, 0),
    });
    expect(result.blocks.find((b) => b.id === 'host')?.row).toBe(1); // unchanged
    expect(result.blocks.find((b) => b.id === 'new')).toMatchObject({
      col: 1,
      row: 2,
      colSpan: 12,
    });
    expect(result.blocks.find((b) => b.id === 'b')?.row).toBe(3);
    expect(result.blocks.find((b) => b.id === 'c')?.row).toBe(4);
  });

  it('respects host rowSpan when placing new block', () => {
    const baseline = snapshot(block('host', 1, 1, 12, 3));
    const result = applyDropMode({
      baseline,
      mode: 'split-bottom',
      sourceBlockId: null,
      hostBlockId: 'host',
      newBlock: block('new', 0, 0, 0),
    });
    const inserted = result.blocks.find((b) => b.id === 'new');
    expect(inserted?.row).toBe(4); // host.row=1 + host.rowSpan=3
  });

  it('Wave 7 Phase 2A: rowSpan is integer (legacy auto path removed); single-row host places at row 2', () => {
    const baseline = snapshot(block('host', 1, 1, 12, 1));
    const result = applyDropMode({
      baseline,
      mode: 'split-bottom',
      sourceBlockId: null,
      hostBlockId: 'host',
      newBlock: block('new', 0, 0, 0),
    });
    expect(result.blocks.find((b) => b.id === 'new')?.row).toBe(2);
  });

  it('does not require split-* colSpan validation', () => {
    for (const cs of [3, 5, 7, 11]) {
      expect(() =>
        applyDropMode({
          baseline: snapshot(block('host', 1, 1, cs)),
          mode: 'split-bottom',
          sourceBlockId: null,
          hostBlockId: 'host',
          newBlock: block('new', 0, 0, 0),
        }),
      ).not.toThrow();
    }
  });
});

describe('applyDropMode — invariants & validation', () => {
  it('throws when sourceBlockId is null AND newBlock is missing', () => {
    expect(() =>
      applyDropMode({
        baseline: snapshot(block('a', 1, 1, 12)),
        mode: 'split-left',
        sourceBlockId: null,
        hostBlockId: 'a',
      }),
    ).toThrow(/newBlock is required/);
  });

  it('throws when split-* with hostBlockId null', () => {
    expect(() =>
      applyDropMode({
        baseline: snapshot(),
        mode: 'split-right',
        sourceBlockId: 'src',
        hostBlockId: null,
      }),
    ).toThrow(/hostBlockId is required/);
  });

  it('throws when hostBlockId not in baseline', () => {
    expect(() =>
      applyDropMode({
        baseline: snapshot(block('a', 1, 1, 12)),
        mode: 'split-left',
        sourceBlockId: null,
        hostBlockId: 'nonexistent',
        newBlock: block('new', 0, 0, 0),
      }),
    ).toThrow(/not found in baseline/);
  });

  it('throws when sourceBlockId not in baseline (move case)', () => {
    expect(() =>
      applyDropMode({
        baseline: snapshot(block('host', 1, 1, 12)),
        mode: 'split-left',
        sourceBlockId: 'missing',
        hostBlockId: 'host',
      }),
    ).toThrow(/sourceBlockId .* not found/);
  });

  it('returns a NEW snapshot object (not shared reference)', () => {
    const baseline = snapshot(block('a', 1, 1, 12));
    const result = applyDropMode({
      baseline,
      mode: 'none',
      sourceBlockId: null,
      hostBlockId: null,
    });
    expect(result).not.toBe(baseline);
    expect(result.blocks).not.toBe(baseline.blocks);
  });
});
