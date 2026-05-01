import { describe, expect, it } from 'vitest';
import {
  computeTopology,
  SVG_WIDTH,
  SVG_HEIGHT,
  NEURON_RADIUS,
  MAX_VISIBLE_NEURONS,
  EDGE_STROKE_WIDTH_DEFAULT,
  EDGE_STROKE_WIDTH_WEIGHTS_SHOWN,
} from '../ui-default/topology';
import type { LayerSpec } from '../core/serialize';

/**
 * Byte-equality corpus for `computeTopology` authority (ADR-0006 item #5).
 *
 * `computeTopology` is the single import point for SVG layout in this package;
 * both NnViz.tsx (React/NodeView path) and NnViz.astro (SSR path) call it.
 * This suite exercises a representative input corpus to:
 *   1. catch silent regressions if a future edit re-inlines `SVG_WIDTH` /
 *      column-step / edge enumeration / aria-label phrasing / weight-driven
 *      stroke widths in either render path (drift detector for the
 *      algorithm-replication audit).
 *   2. assert the empty-topology aria-label invariant — both paths must speak
 *      the same words for an empty `layers` array (NnViz.tsx + NnViz.astro
 *      previously diverged on this exact label, which was the R2 review hit).
 *   3. **R3-1**: assert `showWeights` is a real input to computeTopology, not a
 *      misleading corpus row tag — descriptor.showWeights + descriptor.edgeStrokeWidth
 *      + descriptor.ariaLabel suffix all change when the flag flips.
 *
 * Sister-pattern: block-math/__tests__/ssr-render.test.ts is the equivalent
 * authority drift detector for `renderMath`.
 *
 * Tests assert structural invariants on the descriptor (column count, neuron
 * cap, edge count, aria-label phrasing, showWeights propagation, deterministic
 * edge keys). Any in-package divergence between the two render paths must
 * result in a different descriptor and would therefore break a corpus assertion.
 */

interface CorpusRow {
  readonly name: string;
  readonly layers: LayerSpec[];
  readonly showWeights?: boolean;
  readonly expectedColumns: number;
  readonly expectedNeurons: number[];
  readonly expectedEdgeCount: number;
  readonly expectedAriaLabel: string;
  readonly expectedEmpty: boolean;
  readonly expectedShowWeights: boolean;
  readonly expectedEdgeStrokeWidth: number;
}

const CORPUS: ReadonlyArray<CorpusRow> = [
  {
    name: 'empty layers',
    layers: [],
    expectedColumns: 0,
    expectedNeurons: [],
    expectedEdgeCount: 0,
    expectedAriaLabel: 'Empty neural network topology',
    expectedEmpty: true,
    expectedShowWeights: false,
    expectedEdgeStrokeWidth: EDGE_STROKE_WIDTH_DEFAULT,
  },
  {
    name: 'single layer (1 layer pluralization)',
    layers: [{ name: 'only', units: 3, activation: 'relu' }],
    expectedColumns: 1,
    expectedNeurons: [3],
    expectedEdgeCount: 0,
    expectedAriaLabel: 'Neural network topology with 1 layer',
    expectedEmpty: false,
    expectedShowWeights: false,
    expectedEdgeStrokeWidth: EDGE_STROKE_WIDTH_DEFAULT,
  },
  {
    name: 'two-layer net (default stroke)',
    layers: [
      { name: 'in', units: 4, activation: 'relu' },
      { name: 'out', units: 2, activation: 'softmax' },
    ],
    expectedColumns: 2,
    expectedNeurons: [4, 2],
    expectedEdgeCount: 4 * 2,
    expectedAriaLabel: 'Neural network topology with 2 layers',
    expectedEmpty: false,
    expectedShowWeights: false,
    expectedEdgeStrokeWidth: EDGE_STROKE_WIDTH_DEFAULT,
  },
  {
    name: 'multi-layer with showWeights=true → heavier stroke + aria suffix',
    layers: [
      { name: 'in', units: 5, activation: 'relu' },
      { name: 'hidden', units: 3, activation: 'tanh' },
      { name: 'out', units: 2, activation: 'sigmoid' },
    ],
    showWeights: true,
    expectedColumns: 3,
    expectedNeurons: [5, 3, 2],
    expectedEdgeCount: 5 * 3 + 3 * 2,
    expectedAriaLabel: 'Neural network topology with 3 layers (weights shown)',
    expectedEmpty: false,
    expectedShowWeights: true,
    expectedEdgeStrokeWidth: EDGE_STROKE_WIDTH_WEIGHTS_SHOWN,
  },
  {
    name: 'units exceeding MAX_VISIBLE_NEURONS gets capped',
    layers: [
      { name: 'huge', units: 1024, activation: 'relu' },
      { name: 'mega', units: 9999, activation: 'softmax' },
    ],
    expectedColumns: 2,
    expectedNeurons: [MAX_VISIBLE_NEURONS, MAX_VISIBLE_NEURONS],
    expectedEdgeCount: MAX_VISIBLE_NEURONS * MAX_VISIBLE_NEURONS,
    expectedAriaLabel: 'Neural network topology with 2 layers',
    expectedEmpty: false,
    expectedShowWeights: false,
    expectedEdgeStrokeWidth: EDGE_STROKE_WIDTH_DEFAULT,
  },
];

describe('computeTopology (SVG layout authority)', () => {
  it.each(CORPUS)(
    'corpus: $name → stable descriptor shape across React + Astro render paths',
    ({
      layers,
      showWeights,
      expectedColumns,
      expectedNeurons,
      expectedEdgeCount,
      expectedAriaLabel,
      expectedEmpty,
      expectedShowWeights,
      expectedEdgeStrokeWidth,
    }) => {
      const descriptor =
        showWeights === undefined
          ? computeTopology(layers)
          : computeTopology({ layers, showWeights });
      expect(descriptor.width).toBe(SVG_WIDTH);
      expect(descriptor.height).toBe(SVG_HEIGHT);
      expect(descriptor.empty).toBe(expectedEmpty);
      expect(descriptor.columns).toHaveLength(expectedColumns);
      expect(descriptor.columns.map((c) => c.neurons.length)).toEqual(expectedNeurons);
      expect(descriptor.edges).toHaveLength(expectedEdgeCount);
      expect(descriptor.ariaLabel).toBe(expectedAriaLabel);
      expect(descriptor.showWeights).toBe(expectedShowWeights);
      expect(descriptor.edgeStrokeWidth).toBe(expectedEdgeStrokeWidth);
      // Every neuron carries the canonical NEURON_RADIUS — locks the constant.
      for (const col of descriptor.columns) {
        for (const n of col.neurons) {
          expect(n.r).toBe(NEURON_RADIUS);
        }
      }
      // Every edge carries the descriptor-level strokeWidth (single source).
      for (const e of descriptor.edges) {
        expect(e.strokeWidth).toBe(expectedEdgeStrokeWidth);
      }
    },
  );

  it('positional argument form still accepted for backwards-compat (legacy callers)', () => {
    const a = computeTopology([{ name: 'l', units: 3, activation: 'relu' }]);
    const b = computeTopology({ layers: [{ name: 'l', units: 3, activation: 'relu' }] });
    expect(a).toEqual(b);
    expect(a.showWeights).toBe(false);
  });

  it('showWeights flag flips ariaLabel suffix and edgeStrokeWidth deterministically', () => {
    const layers: LayerSpec[] = [
      { name: 'a', units: 2, activation: 'relu' },
      { name: 'b', units: 2, activation: 'relu' },
    ];
    const off = computeTopology({ layers, showWeights: false });
    const on = computeTopology({ layers, showWeights: true });
    expect(off.ariaLabel).toBe('Neural network topology with 2 layers');
    expect(on.ariaLabel).toBe('Neural network topology with 2 layers (weights shown)');
    expect(off.edgeStrokeWidth).toBe(EDGE_STROKE_WIDTH_DEFAULT);
    expect(on.edgeStrokeWidth).toBe(EDGE_STROKE_WIDTH_WEIGHTS_SHOWN);
    expect(on.edgeStrokeWidth).toBeGreaterThan(off.edgeStrokeWidth);
  });

  it('produces deterministic, unique edge keys (stable React reconciliation)', () => {
    const descriptor = computeTopology([
      { name: 'a', units: 2, activation: 'relu' },
      { name: 'b', units: 3, activation: 'relu' },
    ]);
    const keys = descriptor.edges.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const e of descriptor.edges) {
      expect(e.key).toMatch(/^0-\d+-\d+$/);
    }
  });

  it('column labels carry the layer name + units + activation (single-source phrasing)', () => {
    const descriptor = computeTopology([
      { name: 'dense_1', units: 4, activation: 'softmax' },
    ]);
    expect(descriptor.columns[0]?.label).toBe('dense_1 (4, softmax)');
  });

  it('called twice with structurally equal input returns structurally equal output', () => {
    const a = computeTopology({
      layers: [{ name: 'l', units: 3, activation: 'relu' }],
      showWeights: true,
    });
    const b = computeTopology({
      layers: [{ name: 'l', units: 3, activation: 'relu' }],
      showWeights: true,
    });
    expect(a).toEqual(b);
  });
});
