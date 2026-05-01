import { describe, expect, it } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import type { LayersModel } from '@tensorflow/tfjs';
import { nnVizCore } from '../core/core-definition';
import {
  nnVizUiDefault,
  NnVizEditorView,
  NnVizRenderView,
  NnVizView,
  NN_VIZ_TOKENS,
} from '../ui-default';
import type { LoadLayersModelFn } from '../ui-default/tfjs-bridge';

/**
 * UI surface contract tests + a smoke render for the React NodeView.
 * Mirrors block-jupyter/ui-default.test.tsx shape (sister-doc invariant
 * per ADR-0006 #6).
 *
 * tfjs is heavy (loads WebGL backend); these tests inject a mock
 * `loadLayersModel` via the NnVizView's `loadLayersModel` prop — the production
 * `NnVizEditorView` accepts the same prop optionally.
 */

function makeFakeModel(): LayersModel {
  return {
    layers: [],
    dispose() {},
  } as unknown as LayersModel;
}

function makeMockLoad(model: LayersModel): LoadLayersModelFn {
  return () => Promise.resolve(model);
}

describe('nnVizUiDefault registration shape', () => {
  it('exposes BlockUIDefinition shape with coreName + uiId="default"', () => {
    expect(nnVizUiDefault.coreName).toBe(nnVizCore.name);
    expect(nnVizUiDefault.coreName).toBe('nn-viz');
    expect(nnVizUiDefault.uiId).toBe('default');
  });

  it('EditorView and RenderView identity matches NnViz.tsx exports', () => {
    expect(nnVizUiDefault.EditorView).toBe(NnVizEditorView);
    expect(nnVizUiDefault.RenderView).toBe(NnVizRenderView);
  });

  it('NN_VIZ_TOKENS witnesses the @skb/design-tokens ColorTokenName surface', () => {
    expect(NN_VIZ_TOKENS.fgToken).toBe('fg');
    expect(NN_VIZ_TOKENS.errorToken).toBe('error');
    expect(NN_VIZ_TOKENS.mutedToken).toBe('muted');
    expect(NN_VIZ_TOKENS.accentToken).toBe('accent');
  });
});

describe('NnVizView render', () => {
  it('renders declarative topology SVG when layers prop is provided', () => {
    const load = makeMockLoad(makeFakeModel());
    const { container, unmount } = render(
      <NnVizView
        props={{
          modelUrl: 'm',
          layers: [
            { name: 'in', units: 4, activation: 'relu' },
            { name: 'out', units: 2, activation: 'softmax' },
          ],
          showWeights: false,
        }}
        loadLayersModel={load}
      />,
    );
    const circles = container.querySelectorAll('circle.skb-nn-viz-layer');
    // 4 + 2 = 6 neurons
    expect(circles).toHaveLength(6);
    unmount();
  });

  it('caps visible neurons per layer at 8 even when units is large', () => {
    const load = makeMockLoad(makeFakeModel());
    const { container, unmount } = render(
      <NnVizView
        props={{
          modelUrl: 'm',
          layers: [{ name: 'huge', units: 1024, activation: 'relu' }],
          showWeights: false,
        }}
        loadLayersModel={load}
      />,
    );
    const circles = container.querySelectorAll('circle.skb-nn-viz-layer');
    expect(circles).toHaveLength(8);
    unmount();
  });

  it('exposes data-block="nn-viz" + initial data-phase="loading" while load is in flight', () => {
    let resolveLoad: ((m: LayersModel) => void) | undefined;
    const load: LoadLayersModelFn = () =>
      new Promise<LayersModel>((res) => {
        resolveLoad = res;
      });
    const { container, unmount } = render(
      <NnVizView
        props={{
          modelUrl: 'm',
          layers: [],
          showWeights: false,
        }}
        loadLayersModel={load}
      />,
    );
    const root = container.querySelector('[data-block="nn-viz"]');
    expect(root).not.toBeNull();
    expect(root?.getAttribute('data-phase')).toBe('loading');
    resolveLoad?.(makeFakeModel());
    unmount();
  });

  it('transitions to data-phase="ready" after loadLayersModel resolves', async () => {
    const load = makeMockLoad(makeFakeModel());
    const { container, unmount } = render(
      <NnVizView
        props={{
          modelUrl: 'm',
          layers: [{ name: 'd', units: 4, activation: 'relu' }],
          showWeights: false,
        }}
        loadLayersModel={load}
      />,
    );
    await waitFor(() => {
      const root = container.querySelector('[data-block="nn-viz"]');
      expect(root?.getAttribute('data-phase')).toBe('ready');
    });
    unmount();
  });

  it('surfaces httpError phase for 404-style failures', async () => {
    const load: LoadLayersModelFn = () =>
      Promise.reject(new Error('Failed to fetch model.json: 404'));
    const { container, unmount } = render(
      <NnVizView
        props={{
          modelUrl: 'm',
          layers: [],
          showWeights: false,
        }}
        loadLayersModel={load}
      />,
    );
    await waitFor(() => {
      const root = container.querySelector('[data-block="nn-viz"]');
      expect(root?.getAttribute('data-phase')).toBe('httpError');
    });
    unmount();
  });

  it('renders weight scale slider only when showWeights=true and phase=ready', async () => {
    const load = makeMockLoad(makeFakeModel());
    const { container, queryByLabelText, unmount } = render(
      <NnVizView
        props={{
          modelUrl: 'm',
          layers: [{ name: 'd', units: 2, activation: 'relu' }],
          showWeights: true,
        }}
        loadLayersModel={load}
      />,
    );
    await waitFor(() => {
      const root = container.querySelector('[data-block="nn-viz"]');
      expect(root?.getAttribute('data-phase')).toBe('ready');
    });
    expect(queryByLabelText('Weight visualization scale')).not.toBeNull();
    unmount();
  });

  it('omits the slider when showWeights=false even after ready', async () => {
    const load = makeMockLoad(makeFakeModel());
    const { container, queryByLabelText, unmount } = render(
      <NnVizView
        props={{
          modelUrl: 'm',
          layers: [{ name: 'd', units: 2, activation: 'relu' }],
          showWeights: false,
        }}
        loadLayersModel={load}
      />,
    );
    await waitFor(() => {
      const root = container.querySelector('[data-block="nn-viz"]');
      expect(root?.getAttribute('data-phase')).toBe('ready');
    });
    expect(queryByLabelText('Weight visualization scale')).toBeNull();
    unmount();
  });

  it('renders an empty topology svg gracefully when layers=[] and no model layers', () => {
    const load = makeMockLoad(makeFakeModel());
    const { container, unmount } = render(
      <NnVizView
        props={{
          modelUrl: 'm',
          layers: [],
          showWeights: false,
        }}
        loadLayersModel={load}
      />,
    );
    const circles = container.querySelectorAll('circle.skb-nn-viz-layer');
    expect(circles).toHaveLength(0);
    const svg = container.querySelector('svg.skb-nn-viz-canvas');
    expect(svg).not.toBeNull();
    unmount();
  });
});
