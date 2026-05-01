import type { LayerSpec } from '../core/serialize';

/**
 * Single authority for SVG topology layout across this package
 * (ADR-0006 item #5 — algorithm + runtime constants replication).
 *
 * Both `NnViz.tsx` (React/NodeView path) and `NnViz.astro` (SSR path) MUST
 * import `computeTopology` from here — never re-derive `SVG_WIDTH` /
 * `SVG_HEIGHT` / `NEURON_RADIUS` / `MAX_VISIBLE_NEURONS` / column-step /
 * row-step / edge enumeration / aria-label phrasing / weight-driven stroke
 * widths. ssr-render.test.ts exercises a corpus to detect drift if a future
 * edit accidentally re-inlines the layout.
 *
 * Sister-pattern: `block-math/ui-default/render-math.ts` is the equivalent
 * single-source authority for KaTeX rendering across Math.tsx + Math.astro.
 *
 * The function is pure (no React / DOM / tfjs imports) so it is unit-testable
 * with vitest alone, and consumed identically from React renders + Astro SSR.
 */

export const SVG_WIDTH = 480;
export const SVG_HEIGHT = 200;
export const NEURON_RADIUS = 6;
export const MAX_VISIBLE_NEURONS = 8;
export const LABEL_BASELINE_OFFSET = 4;
export const EDGE_STROKE_WIDTH_DEFAULT = 0.5;
export const EDGE_STROKE_WIDTH_WEIGHTS_SHOWN = 1.5;

export interface TopologyNeuron {
  readonly x: number;
  readonly y: number;
  readonly r: number;
}

export interface TopologyColumn {
  readonly index: number;
  readonly neurons: readonly TopologyNeuron[];
  readonly label: string;
  readonly labelX: number;
  readonly labelY: number;
}

export interface TopologyEdge {
  readonly key: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly strokeWidth: number;
}

export interface TopologyDescriptor {
  readonly width: number;
  readonly height: number;
  readonly columns: readonly TopologyColumn[];
  readonly edges: readonly TopologyEdge[];
  readonly ariaLabel: string;
  readonly empty: boolean;
  readonly showWeights: boolean;
  /** edge-level stroke width — heavier when weights are shown */
  readonly edgeStrokeWidth: number;
}

export interface ComputeTopologyOptions {
  readonly layers: readonly LayerSpec[];
  /** When true, edges render with a heavier stroke as a placeholder for the
   *  Wave 3 gradient/weight heatmap. The boolean is part of the authoritative
   *  descriptor so NnViz.tsx and NnViz.astro both consume it identically. */
  readonly showWeights?: boolean;
}

/**
 * Empty / non-empty aria-label phrasing is part of the authoritative output —
 * NnViz.tsx + NnViz.astro both consume `descriptor.ariaLabel` so neither path
 * gets to inline its own copy. Pluralization rule: "1 layer" vs "N layers".
 * When weights are shown, the suffix " (weights shown)" is appended; this is
 * locked by ssr-render.test.ts so neither render path may diverge.
 */
function describeAriaLabel(layerCount: number, showWeights: boolean): string {
  const base =
    layerCount === 0
      ? 'Empty neural network topology'
      : `Neural network topology with ${String(layerCount)} layer${layerCount === 1 ? '' : 's'}`;
  return showWeights ? `${base} (weights shown)` : base;
}

export function computeTopology(
  optionsOrLayers: ComputeTopologyOptions | readonly LayerSpec[],
): TopologyDescriptor {
  const options: ComputeTopologyOptions = Array.isArray(optionsOrLayers)
    ? { layers: optionsOrLayers }
    : (optionsOrLayers as ComputeTopologyOptions);
  const layers = options.layers;
  const showWeights = options.showWeights === true;
  const edgeStrokeWidth = showWeights
    ? EDGE_STROKE_WIDTH_WEIGHTS_SHOWN
    : EDGE_STROKE_WIDTH_DEFAULT;
  const layerCount = layers.length;
  const ariaLabel = describeAriaLabel(layerCount, showWeights);
  if (layerCount === 0) {
    return {
      width: SVG_WIDTH,
      height: SVG_HEIGHT,
      columns: [],
      edges: [],
      ariaLabel,
      empty: true,
      showWeights,
      edgeStrokeWidth,
    };
  }
  const colStep = SVG_WIDTH / (layerCount + 1);
  const columns: TopologyColumn[] = layers.map((layer, i) => {
    const x = colStep * (i + 1);
    const visible = Math.min(layer.units, MAX_VISIBLE_NEURONS);
    const rowStep = SVG_HEIGHT / (visible + 1);
    const neurons: TopologyNeuron[] = Array.from({ length: visible }, (_, j) => ({
      x,
      y: rowStep * (j + 1),
      r: NEURON_RADIUS,
    }));
    return {
      index: i,
      neurons,
      label: `${layer.name} (${String(layer.units)}, ${layer.activation})`,
      labelX: x,
      labelY: SVG_HEIGHT - LABEL_BASELINE_OFFSET,
    };
  });
  const edges: TopologyEdge[] = [];
  for (let i = 0; i < columns.length - 1; i++) {
    const left = columns[i]?.neurons ?? [];
    const right = columns[i + 1]?.neurons ?? [];
    for (let li = 0; li < left.length; li++) {
      for (let ri = 0; ri < right.length; ri++) {
        const a = left[li];
        const b = right[ri];
        if (a === undefined || b === undefined) continue;
        edges.push({
          key: `${String(i)}-${String(li)}-${String(ri)}`,
          x1: a.x,
          y1: a.y,
          x2: b.x,
          y2: b.y,
          strokeWidth: edgeStrokeWidth,
        });
      }
    }
  }
  return {
    width: SVG_WIDTH,
    height: SVG_HEIGHT,
    columns,
    edges,
    ariaLabel,
    empty: false,
    showWeights,
    edgeStrokeWidth,
  };
}
