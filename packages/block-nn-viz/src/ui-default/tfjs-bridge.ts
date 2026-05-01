import type { LayersModel } from '@tensorflow/tfjs';

/**
 * Per-block tf.LayersModel lifecycle bridge — sister-pattern to E1
 * (block-jupyter / kernel-bridge). Each NodeView mount loads its OWN model
 * via `loadLayersModel(modelUrl)`; aborts on unmount; surfaces a phase
 * state-machine value the React layer maps to a spinner / error UI.
 *
 * Design lessons codified here (same shape as E1):
 *
 * 1. **Per-block isolation**: every mount creates its own model — two
 *    nn-viz blocks on the same page do NOT share weights / layer state.
 *    `tf.LayersModel` instances are independent disposables.
 * 2. **Loading state mandatory**: `loadLayersModel` is async (model files
 *    are typically multi-MB downloads). Bridge surfaces `phase: 'loading'`
 *    so the React layer renders a placeholder rather than empty SVG.
 * 3. **AbortSignal-driven cleanup**: NodeView unmount aborts; the bridge
 *    discards the in-flight load, and any model that resolves AFTER abort
 *    gets `dispose()`'d immediately to free WebGL backends. No silent leak.
 * 4. **Error-class triage**: distinct phases for HTTP fetch failure (`httpError`),
 *    tfjs internal load failure (`loadError`), and other unexpected throws
 *    (`unknownError`). UI does NOT need to import tfjs-internal error classes;
 *    the discriminant kind is derived at the bridge boundary.
 *
 * Framework-agnostic — no React imports — so the bridge can be unit-tested
 * without happy-dom and reused from non-React surfaces (e.g. Wave 3 training
 * dashboards).
 */

export type NnVizPhase =
  /** before load() is called */
  | { type: 'idle' }
  /** loadLayersModel in flight */
  | { type: 'loading' }
  /** model live and ready to inspect */
  | { type: 'ready'; model: LayersModel }
  /** fetch failed (network / 404) */
  | { type: 'httpError'; message: string }
  /** tfjs load / parse failed (corrupt model.json, unsupported layer, etc.) */
  | { type: 'loadError'; message: string }
  /** anything else thrown during load */
  | { type: 'unknownError'; message: string };

export type LoadLayersModelFn = (modelUrl: string) => Promise<LayersModel>;

export interface TfjsBridgeOptions {
  readonly modelUrl: string;
  /**
   * Aborts pending load + disposes any model that resolves after abort.
   * NodeView passes its unmount signal here.
   */
  readonly signal: AbortSignal;
  /**
   * Notified when phase changes. The React adapter wraps this with `useState`
   * (see `NnViz.tsx`); non-React consumers can patch their own store.
   */
  readonly onPhase: (phase: NnVizPhase) => void;
  /**
   * tfjs `loadLayersModel` injection point. Production code passes
   * `tf.loadLayersModel`; tests pass mocks. Lets us cover load lifecycle
   * + error branches without booting a real WebGL backend.
   */
  readonly loadLayersModel: LoadLayersModelFn;
}

export interface TfjsBridge {
  /**
   * Boot model load. Idempotent: a second call after `phase==='ready'`
   * returns the same model; mid-load second calls await the first.
   * Errors land via `onPhase` with one of the *Error variants; the
   * returned promise resolves once load has completed OR errored.
   */
  load(): Promise<void>;
}

/**
 * HTTP-style errors thrown by tfjs IOHandlers carry status codes in the
 * message — match patterns rather than `instanceof` since tfjs does not
 * export a public error class hierarchy.
 */
function classifyLoadError(err: unknown): NnVizPhase {
  const message = err instanceof Error ? err.message : String(err);
  if (
    /\b(404|403|500|502|503|504)\b/.test(message) ||
    /HTTP|fetch|network|Failed to fetch/i.test(message)
  ) {
    return { type: 'httpError', message };
  }
  if (
    /JSON|parse|model\.json|unsupported|topology|invalid/i.test(message) ||
    /tensorflow|tfjs/i.test(message)
  ) {
    return { type: 'loadError', message };
  }
  return { type: 'unknownError', message };
}

export function createTfjsBridge(options: TfjsBridgeOptions): TfjsBridge {
  const { modelUrl, signal, onPhase, loadLayersModel } = options;
  let model: LayersModel | null = null;
  let loadPromise: Promise<void> | null = null;
  let disposed = false;

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    if (model !== null) {
      const m = model;
      model = null;
      try {
        m.dispose();
      } catch {
        // ignore double-dispose / backend errors
      }
    }
  };

  signal.addEventListener('abort', dispose, { once: true });

  const load = async (): Promise<void> => {
    if (disposed) return;
    if (model !== null) return;
    if (loadPromise !== null) return loadPromise;
    onPhase({ type: 'loading' });
    loadPromise = (async () => {
      try {
        const m = await loadLayersModel(modelUrl);
        if (disposed) {
          try {
            m.dispose();
          } catch {
            // ignore
          }
          return;
        }
        model = m;
        onPhase({ type: 'ready', model: m });
      } catch (cause) {
        if (disposed) return;
        onPhase(classifyLoadError(cause));
      }
    })();
    return loadPromise;
  };

  return { load };
}
