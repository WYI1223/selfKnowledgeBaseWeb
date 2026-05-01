import { useEffect, useMemo, useReducer, useRef, useState, useCallback } from 'react';
import type { BlockViewProps } from '@skb/block-foundation';
import * as tf from '@tensorflow/tfjs';
import { nnVizCore } from '../core/core-definition';
import type { LayerSpec } from '../core/serialize';
import {
  createTfjsBridge,
  type LoadLayersModelFn,
  type NnVizPhase,
} from './tfjs-bridge';
import { computeTopology, type TopologyDescriptor } from './topology';

/**
 * NnVizView — Tiptap NodeView for `kind='viz'` neural-network topology block.
 *
 * Layout authority is `./topology.ts` (ADR-0006 #5 — single source for SVG
 * sizing / positions / labels / aria-label). NnViz.astro consumes the same
 * `computeTopology` so SSR and CSR render byte-equivalent SVG geometry.
 *
 * `optionalLoadFn` lets tests inject a fake `loadLayersModel`; production code
 * leaves it undefined and `tf.loadLayersModel` is used. Tests therefore avoid
 * booting a real WebGL backend.
 *
 * Mirrors JupyterView's "no explicit BlockUIDefinition<typeof ...> annotation"
 * pattern (ADR-0003 inference rule); the optional `loadLayersModel` extension
 * widens the ComponentType signature so registry inference is registry-friendly.
 */

export interface NnVizViewProps extends BlockViewProps<typeof nnVizCore.propsSchema> {
  /** Override the loadLayersModel implementation (test injection). */
  readonly loadLayersModel?: LoadLayersModelFn;
}

export function NnVizView({ props, loadLayersModel }: NnVizViewProps): JSX.Element {
  const [phase, setPhase] = useReducer(
    (_prev: NnVizPhase, next: NnVizPhase) => next,
    { type: 'idle' } as NnVizPhase,
  );
  const [weightScale, setWeightScale] = useState(1);

  const loadFnRef = useRef<LoadLayersModelFn | null>(null);
  if (loadFnRef.current === null) {
    loadFnRef.current = loadLayersModel ?? ((url) => tf.loadLayersModel(url));
  }
  const loadFn = loadFnRef.current;

  useEffect(() => {
    const controller = new AbortController();
    const bridge = createTfjsBridge({
      modelUrl: props.modelUrl,
      signal: controller.signal,
      onPhase: setPhase,
      loadLayersModel: loadFn,
    });
    void bridge.load();
    return () => {
      controller.abort();
    };
  }, [props.modelUrl, loadFn]);

  const topology = useMemo(
    () =>
      computeTopology({
        layers: deriveLayerSpecs(phase, props.layers),
        showWeights: props.showWeights,
      }),
    [phase, props.layers, props.showWeights],
  );
  const statusLabel = describePhase(phase);
  const onScaleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setWeightScale(Number(e.target.value));
  }, []);

  return (
    <div data-block="nn-viz" data-phase={phase.type}>
      <div className="skb-nn-viz-status" role="status">
        {statusLabel}
      </div>
      <NnVizCanvas descriptor={topology} />
      {props.showWeights && phase.type === 'ready' && (
        <div className="skb-nn-viz-controls">
          <label>
            Weight scale
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={weightScale}
              onChange={onScaleChange}
              aria-label="Weight visualization scale"
            />
            <span>{weightScale.toFixed(1)}x</span>
          </label>
        </div>
      )}
    </div>
  );
}

function describePhase(phase: NnVizPhase): string {
  switch (phase.type) {
    case 'idle':
      return 'Idle';
    case 'loading':
      return 'Loading model…';
    case 'ready':
      return 'Ready';
    case 'httpError':
      return `Network error: ${phase.message}`;
    case 'loadError':
      return `Model load error: ${phase.message}`;
    case 'unknownError':
      return `Error: ${phase.message}`;
  }
}

function deriveLayerSpecs(
  phase: NnVizPhase,
  declarative: readonly LayerSpec[],
): readonly LayerSpec[] {
  if (phase.type === 'ready') {
    const fromModel = layersFromModel(phase.model);
    if (fromModel.length > 0) return fromModel;
  }
  return declarative;
}

function layersFromModel(model: tf.LayersModel): LayerSpec[] {
  const out: LayerSpec[] = [];
  for (const layer of model.layers) {
    const cfg = (layer.getConfig?.() ?? {}) as { units?: number; activation?: string };
    const units = typeof cfg.units === 'number' ? cfg.units : 0;
    if (units <= 0) continue;
    out.push({ name: layer.name, units, activation: normalizeActivation(cfg.activation) });
  }
  return out;
}

const ACTIVATIONS: ReadonlySet<LayerSpec['activation']> = new Set([
  'relu',
  'softmax',
  'sigmoid',
  'tanh',
  'linear',
]);

function normalizeActivation(raw: unknown): LayerSpec['activation'] {
  if (typeof raw === 'string' && (ACTIVATIONS as Set<string>).has(raw)) {
    return raw as LayerSpec['activation'];
  }
  return 'linear';
}

interface NnVizCanvasProps {
  readonly descriptor: TopologyDescriptor;
}

function NnVizCanvas({ descriptor }: NnVizCanvasProps): JSX.Element {
  return (
    <svg
      className="skb-nn-viz-canvas"
      viewBox={`0 0 ${String(descriptor.width)} ${String(descriptor.height)}`}
      role="img"
      aria-label={descriptor.ariaLabel}
    >
      {descriptor.edges.map((e) => (
        <line
          key={e.key}
          className="skb-nn-viz-edge"
          x1={e.x1}
          y1={e.y1}
          x2={e.x2}
          y2={e.y2}
          strokeWidth={e.strokeWidth}
        />
      ))}
      {descriptor.columns.map((col) => (
        <g key={`layer-${String(col.index)}`}>
          {col.neurons.map((n, j) => (
            <circle
              key={`n-${String(col.index)}-${String(j)}`}
              className="skb-nn-viz-layer"
              cx={n.x}
              cy={n.y}
              r={n.r}
            />
          ))}
          <text className="skb-nn-viz-label" x={col.labelX} y={col.labelY}>
            {col.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export const NnVizEditorView = NnVizView;
export const NnVizRenderView = NnVizView;
