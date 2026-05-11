import { describe, expect, it } from 'vitest';
import { layoutReducer, type GridSnapshot, type LayoutState } from '../../drag-drop/layout-reducer';

const snapshotA: GridSnapshot = {
  blocks: [{ col: 1, colSpan: 6, rowSpan: 1 }],
};

const snapshotB: GridSnapshot = {
  blocks: [{ col: 7, colSpan: 6, rowSpan: 2 }],
};

function state(overrides: Partial<LayoutState> = {}): LayoutState {
  return {
    epoch: 5,
    snapshot: null,
    baseline: snapshotA,
    ...overrides,
  };
}

describe('layoutReducer', () => {
  it('drag-start keeps epoch unchanged and saves S0', () => {
    const initial = state();

    const result = layoutReducer(initial, { type: 'drag-start', sourceBlockId: 'b1' });

    expect(result).toEqual({ epoch: 5, snapshot: snapshotA, baseline: snapshotA });
  });

  it('drag-over keeps epoch unchanged and returns the same state reference', () => {
    const initial = state({ snapshot: snapshotA });

    const result = layoutReducer(initial, { type: 'drag-over' });

    expect(result).toBe(initial);
    expect(result.epoch).toBe(5);
  });

  it('drag-end-success increments epoch once and commits S1 baseline', () => {
    const initial = state({ snapshot: snapshotA });

    const result = layoutReducer(initial, {
      type: 'drag-end-success',
      mutation: snapshotB,
    });

    expect(result).toEqual({ epoch: 6, snapshot: null, baseline: snapshotB });
  });

  it('drag-end-cancel keeps epoch unchanged and rolls back to S0', () => {
    const initial = state({ snapshot: snapshotA, baseline: snapshotB });

    const result = layoutReducer(initial, { type: 'drag-end-cancel' });

    expect(result).toEqual({ epoch: 5, snapshot: null, baseline: snapshotA });
  });

  it('drag-end-mode-none uses the same rollback behavior as drag-end-cancel', () => {
    const initial = state({ snapshot: snapshotA, baseline: snapshotB });

    const result = layoutReducer(initial, { type: 'drag-end-mode-none' });

    expect(result).toEqual({ epoch: 5, snapshot: null, baseline: snapshotA });
  });

  it('rejects drag-start during responsive transition without changing state', () => {
    const initial = state({ responsiveTransition: 'in-progress' });

    const result = layoutReducer(initial, { type: 'drag-start', sourceBlockId: 'b1' });

    expect(result).toBe(initial);
  });

  it('responsive-transition-start flips to in-progress with epoch unchanged', () => {
    const initial = state();

    const result = layoutReducer(initial, { type: 'responsive-transition-start' });
    const secondResult = layoutReducer(result, { type: 'responsive-transition-start' });

    expect(result).toEqual({
      epoch: 5,
      snapshot: null,
      baseline: snapshotA,
      responsiveTransition: 'in-progress',
    });
    expect(secondResult).toEqual(result);
  });

  it('responsive-transition-end flips back to idle with epoch unchanged', () => {
    const initial = state({ responsiveTransition: 'in-progress' });

    const result = layoutReducer(initial, { type: 'responsive-transition-end' });

    expect(result).toEqual({
      epoch: 5,
      snapshot: null,
      baseline: snapshotA,
      responsiveTransition: 'idle',
    });
  });
});
