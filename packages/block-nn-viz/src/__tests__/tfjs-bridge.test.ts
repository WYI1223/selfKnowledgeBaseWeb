import { describe, expect, it } from 'vitest';
import type { LayersModel } from '@tensorflow/tfjs';
import {
  createTfjsBridge,
  type LoadLayersModelFn,
  type NnVizPhase,
} from '../ui-default/tfjs-bridge';

/**
 * Mock LoadLayersModelFn + a minimal disposable LayersModel surrogate let
 * us exercise the bridge state-machine without booting tfjs / WebGL.
 *
 * Verifies the consumer pattern E3 will inherit:
 *   - phase transitions: idle → loading → ready
 *   - error-class triage (httpError / loadError / unknownError) at boundary
 *   - AbortSignal cleanup on unmount (mid-load + after-ready)
 *   - per-block isolation (modelUrl scoping)
 */

interface FakeModel {
  readonly disposed: { count: number };
  dispose(): void;
}

function makeFakeModel(): FakeModel {
  const disposed = { count: 0 };
  return {
    disposed,
    dispose() {
      disposed.count++;
    },
  };
}

function pendingLoad(): {
  fn: LoadLayersModelFn;
  resolve: (model: LayersModel) => void;
  reject: (err: unknown) => void;
} {
  let resolve: ((model: LayersModel) => void) | undefined;
  let reject: ((err: unknown) => void) | undefined;
  const promise = new Promise<LayersModel>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const fn: LoadLayersModelFn = () => promise;
  return {
    fn,
    resolve: (m) => resolve?.(m),
    reject: (e) => reject?.(e),
  };
}

function recordPhases(): {
  phases: NnVizPhase[];
  onPhase: (phase: NnVizPhase) => void;
} {
  const phases: NnVizPhase[] = [];
  return {
    phases,
    onPhase: (phase) => phases.push(phase),
  };
}

describe('createTfjsBridge — load lifecycle', () => {
  it('transitions idle → loading → ready on successful load', async () => {
    const fake = makeFakeModel();
    const loadLayersModel: LoadLayersModelFn = () =>
      Promise.resolve(fake as unknown as LayersModel);
    const { phases, onPhase } = recordPhases();
    const controller = new AbortController();
    const bridge = createTfjsBridge({
      modelUrl: 'm',
      signal: controller.signal,
      onPhase,
      loadLayersModel,
    });
    await bridge.load();
    expect(phases.map((p) => p.type)).toEqual(['loading', 'ready']);
    const last = phases.at(-1);
    if (last?.type !== 'ready') throw new Error('expected ready');
    expect(last.model).toBe(fake);
  });

  it('load() is idempotent — second call after ready does NOT re-emit loading', async () => {
    const fake = makeFakeModel();
    const loadLayersModel: LoadLayersModelFn = () =>
      Promise.resolve(fake as unknown as LayersModel);
    const { phases, onPhase } = recordPhases();
    const controller = new AbortController();
    const bridge = createTfjsBridge({
      modelUrl: 'm',
      signal: controller.signal,
      onPhase,
      loadLayersModel,
    });
    await bridge.load();
    await bridge.load();
    expect(phases.filter((p) => p.type === 'loading')).toHaveLength(1);
    expect(phases.filter((p) => p.type === 'ready')).toHaveLength(1);
  });

  it('load() in flight is shared by overlapping callers', async () => {
    const { fn, resolve } = pendingLoad();
    const fake = makeFakeModel();
    const { phases, onPhase } = recordPhases();
    const controller = new AbortController();
    const bridge = createTfjsBridge({
      modelUrl: 'm',
      signal: controller.signal,
      onPhase,
      loadLayersModel: fn,
    });
    const a = bridge.load();
    const b = bridge.load();
    resolve(fake as unknown as LayersModel);
    await Promise.all([a, b]);
    expect(phases.filter((p) => p.type === 'loading')).toHaveLength(1);
  });
});

describe('createTfjsBridge — error classification', () => {
  it('classifies HTTP-style failures as httpError', async () => {
    const loadLayersModel: LoadLayersModelFn = () =>
      Promise.reject(new Error('Failed to fetch model.json: 404 Not Found'));
    const { phases, onPhase } = recordPhases();
    const controller = new AbortController();
    const bridge = createTfjsBridge({
      modelUrl: 'm',
      signal: controller.signal,
      onPhase,
      loadLayersModel,
    });
    await bridge.load();
    const last = phases.at(-1);
    expect(last?.type).toBe('httpError');
    if (last?.type !== 'httpError') throw new Error('expected httpError');
    expect(last.message).toMatch(/404/);
  });

  it('classifies tfjs internal load failures as loadError', async () => {
    const loadLayersModel: LoadLayersModelFn = () =>
      Promise.reject(new Error('Unsupported tfjs layer topology in model.json'));
    const { phases, onPhase } = recordPhases();
    const controller = new AbortController();
    const bridge = createTfjsBridge({
      modelUrl: 'm',
      signal: controller.signal,
      onPhase,
      loadLayersModel,
    });
    await bridge.load();
    const last = phases.at(-1);
    expect(last?.type).toBe('loadError');
    if (last?.type !== 'loadError') throw new Error('expected loadError');
    expect(last.message).toMatch(/topology/);
  });

  it('classifies unrelated throws as unknownError', async () => {
    const loadLayersModel: LoadLayersModelFn = () =>
      Promise.reject(new Error('something completely unrelated'));
    const { phases, onPhase } = recordPhases();
    const controller = new AbortController();
    const bridge = createTfjsBridge({
      modelUrl: 'm',
      signal: controller.signal,
      onPhase,
      loadLayersModel,
    });
    await bridge.load();
    const last = phases.at(-1);
    expect(last?.type).toBe('unknownError');
  });

  it('handles non-Error throws (string, etc.)', async () => {
    const loadLayersModel: LoadLayersModelFn = () =>
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- intentional non-Error throw to verify classifyLoadError fallback
      Promise.reject('plain string failure');
    const { phases, onPhase } = recordPhases();
    const controller = new AbortController();
    const bridge = createTfjsBridge({
      modelUrl: 'm',
      signal: controller.signal,
      onPhase,
      loadLayersModel,
    });
    await bridge.load();
    const last = phases.at(-1);
    expect(last?.type).toBe('unknownError');
  });
});

describe('createTfjsBridge — abort cleanup', () => {
  it('aborting before load resolves disposes the freshly-loaded model and skips ready', async () => {
    const { fn, resolve } = pendingLoad();
    const fake = makeFakeModel();
    const { phases, onPhase } = recordPhases();
    const controller = new AbortController();
    const bridge = createTfjsBridge({
      modelUrl: 'm',
      signal: controller.signal,
      onPhase,
      loadLayersModel: fn,
    });
    const loadPromise = bridge.load();
    expect(phases.map((p) => p.type)).toEqual(['loading']);
    controller.abort();
    resolve(fake as unknown as LayersModel);
    await loadPromise;
    expect(phases.find((p) => p.type === 'ready')).toBeUndefined();
    expect(fake.disposed.count).toBe(1);
  });

  it('aborting after ready disposes the model exactly once', async () => {
    const fake = makeFakeModel();
    const loadLayersModel: LoadLayersModelFn = () =>
      Promise.resolve(fake as unknown as LayersModel);
    const { onPhase } = recordPhases();
    const controller = new AbortController();
    const bridge = createTfjsBridge({
      modelUrl: 'm',
      signal: controller.signal,
      onPhase,
      loadLayersModel,
    });
    await bridge.load();
    controller.abort();
    expect(fake.disposed.count).toBe(1);
    // double-abort is a no-op
    controller.abort();
    expect(fake.disposed.count).toBe(1);
  });

  it('aborting before load() never starts the request', async () => {
    let calls = 0;
    const loadLayersModel: LoadLayersModelFn = () => {
      calls++;
      return Promise.resolve({} as LayersModel);
    };
    const { phases, onPhase } = recordPhases();
    const controller = new AbortController();
    const bridge = createTfjsBridge({
      modelUrl: 'm',
      signal: controller.signal,
      onPhase,
      loadLayersModel,
    });
    controller.abort();
    await bridge.load();
    expect(calls).toBe(0);
    expect(phases).toEqual([]);
  });

  it('error after abort does not surface a phase', async () => {
    const { fn, reject } = pendingLoad();
    const { phases, onPhase } = recordPhases();
    const controller = new AbortController();
    const bridge = createTfjsBridge({
      modelUrl: 'm',
      signal: controller.signal,
      onPhase,
      loadLayersModel: fn,
    });
    const loadPromise = bridge.load();
    controller.abort();
    reject(new Error('Failed to fetch model.json: 503'));
    await loadPromise;
    expect(phases.find((p) => p.type === 'httpError')).toBeUndefined();
    expect(phases.find((p) => p.type === 'loadError')).toBeUndefined();
  });
});

describe('createTfjsBridge — per-block isolation', () => {
  it('passes the supplied modelUrl to loadLayersModel', async () => {
    let seen: string | null = null;
    const loadLayersModel: LoadLayersModelFn = (url) => {
      seen = url;
      return Promise.resolve({} as LayersModel);
    };
    const { onPhase } = recordPhases();
    const controller = new AbortController();
    const bridge = createTfjsBridge({
      modelUrl: 'https://example.com/A/model.json',
      signal: controller.signal,
      onPhase,
      loadLayersModel,
    });
    await bridge.load();
    expect(seen).toBe('https://example.com/A/model.json');
  });

  it('two bridges with distinct urls do not share state', async () => {
    const fakeA = makeFakeModel();
    const fakeB = makeFakeModel();
    const loadLayersModel: LoadLayersModelFn = (url) =>
      Promise.resolve(
        (url.includes('A') ? fakeA : fakeB) as unknown as LayersModel,
      );
    const { phases: pa, onPhase: onPhaseA } = recordPhases();
    const { phases: pb, onPhase: onPhaseB } = recordPhases();
    const ca = new AbortController();
    const cb = new AbortController();
    const a = createTfjsBridge({
      modelUrl: 'A',
      signal: ca.signal,
      onPhase: onPhaseA,
      loadLayersModel,
    });
    const b = createTfjsBridge({
      modelUrl: 'B',
      signal: cb.signal,
      onPhase: onPhaseB,
      loadLayersModel,
    });
    await Promise.all([a.load(), b.load()]);
    const lastA = pa.at(-1);
    const lastB = pb.at(-1);
    if (lastA?.type !== 'ready' || lastB?.type !== 'ready') {
      throw new Error('expected ready on both');
    }
    expect(lastA.model).toBe(fakeA);
    expect(lastB.model).toBe(fakeB);
    ca.abort();
    expect(fakeA.disposed.count).toBe(1);
    expect(fakeB.disposed.count).toBe(0);
  });
});
