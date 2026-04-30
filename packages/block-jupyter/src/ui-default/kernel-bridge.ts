import type { KernelAdapter, KernelEvent, KernelSession } from '@skb/kernel-adapter';
import { KernelError } from '@skb/kernel-adapter';

/**
 * Per-block kernel session lifecycle bridge — the FIRST consumer of
 * `@skb/kernel-pyodide` (E1). Establishes the consumer pattern E2/E3
 * inherit when their viz blocks need a kernel session of their own.
 *
 * Lessons codified here (intentional public surface, do not inline-replicate):
 *
 * 1. **Per-block isolation**: every NodeView mount creates its OWN session via
 *    `adapter.startSession(sessionId)`. Two cells on the same page do NOT
 *    share kernel state — the spec models cells as independent sandboxes.
 *    sessionId scoping (UUID per mount) prevents cross-cell variable leakage.
 * 2. **Loading state is mandatory UI**: `startSession` is async (Wave 2 = main
 *    thread loadPyodide; Wave 3 = worker boot — both expensive). The bridge
 *    surfaces a `phase` state-machine value the React layer maps to a
 *    spinner / progress indicator.
 * 3. **AbortSignal-driven cleanup**: every long-lived async path (startSession
 *    pending; AsyncIterable consumption) is cancellable via the supplied signal.
 *    NodeView unmount aborts; in-flight starts get discarded; in-flight execute
 *    streams stop being read. The bridge does NOT cancel the underlying
 *    Pyodide computation — only the consumer side. (Wave 3 worker host will
 *    add real interrupt() via SharedArrayBuffer; for Wave 2 we simply stop
 *    listening and call shutdown() on unmount.)
 * 4. **Error-class triage at consumer boundary**: every throw the bridge
 *    surfaces is `instanceof KernelError`; downstream UI does not need to
 *    `import { KernelStartupError, KernelImportError, KernelInterruptError }`
 *    individually unless it wants tailored copy. The bridge tags each throw
 *    with a discriminant so the React layer can branch on `kind` without
 *    importing every concrete subclass.
 *
 * The bridge is intentionally framework-agnostic (no React imports) so E2/E3
 * may reuse it from non-React surfaces (e.g. block-agent-flow's React Flow
 * sidebar) and so unit tests do not need happy-dom for the bridge core.
 */

export type KernelPhase =
  /** before startSession is called */
  | { type: 'idle' }
  /** startSession in flight (waiting for Pyodide to load) */
  | { type: 'starting' }
  /** session live, no execution running */
  | { type: 'ready' }
  /** code is executing; events streaming in */
  | { type: 'running' }
  /** execution finished without error */
  | { type: 'finished' }
  /** execution finished with a Python `error` KernelEvent */
  | { type: 'execError'; ename: string; evalue: string }
  /** non-event throw — e.g. KernelStartupError, KernelImportError */
  | { type: 'kernelError'; kind: string; message: string };

export interface KernelBridgeOptions {
  readonly adapter: KernelAdapter;
  readonly sessionId: string;
  /**
   * Aborts pending startSession + ongoing event stream. NodeView passes its
   * unmount signal here; the bridge stops awaiting + invokes shutdown().
   */
  readonly signal: AbortSignal;
  /**
   * Notified when phase changes. The React adapter wraps this with `useState`
   * (see `Jupyter.tsx`); non-React consumers can patch their own store.
   */
  readonly onPhase: (phase: KernelPhase) => void;
  /**
   * Notified for every KernelEvent that is NOT `status` (status drives
   * `phase`). Stdout / stderr / display_data / execute_result / error all
   * pass through here in arrival order.
   */
  readonly onEvent: (event: KernelEvent) => void;
}

export interface KernelBridge {
  /**
   * Boot the kernel session. Idempotent: a second call after `phase==='ready'`
   * resolves to the same session reference. Errors land via `onPhase` with
   * `kernelError`; the returned promise resolves once start has completed
   * OR rejected — callers that want to gate "Run" on readiness await this.
   */
  start(): Promise<void>;
  /**
   * Run the supplied code. Caller must have awaited `start()` (or the bridge
   * will internally start before executing). Iterates the session's event
   * stream, dispatches to `onEvent`, and updates `phase` on status events.
   */
  run(code: string): Promise<void>;
  /**
   * Best-effort interrupt. Wave 2 main-thread Pyodide is no-op (per its
   * adapter contract); Wave 3 worker host will actually cancel.
   */
  interrupt(): Promise<void>;
}

export function createKernelBridge(options: KernelBridgeOptions): KernelBridge {
  const { adapter, sessionId, signal, onPhase, onEvent } = options;
  let session: KernelSession | null = null;
  let startPromise: Promise<void> | null = null;
  let disposed = false;

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    if (session !== null) {
      const s = session;
      session = null;
      // Fire-and-forget shutdown; ignore double-shutdown errors that can
      // race with explicit user shutdown in tests.
      void s.shutdown().catch(() => {});
    }
  };

  signal.addEventListener('abort', dispose, { once: true });

  const reportKernelError = (err: unknown): void => {
    const kind = err instanceof KernelError ? err.kind : 'unknown';
    const message = err instanceof Error ? err.message : String(err);
    onPhase({ type: 'kernelError', kind, message });
  };

  const start = async (): Promise<void> => {
    if (disposed) return;
    if (session !== null) return;
    if (startPromise !== null) return startPromise;
    onPhase({ type: 'starting' });
    startPromise = (async () => {
      try {
        const s = await adapter.startSession(sessionId);
        if (disposed) {
          // unmounted while loading — discard the freshly-built session
          void s.shutdown().catch(() => {});
          return;
        }
        session = s;
        onPhase({ type: 'ready' });
      } catch (cause) {
        reportKernelError(cause);
      }
    })();
    return startPromise;
  };

  const run = async (code: string): Promise<void> => {
    if (disposed) return;
    if (session === null) {
      await start();
      if (disposed || session === null) return;
    }
    onPhase({ type: 'running' });
    let stream: AsyncIterable<KernelEvent>;
    try {
      stream = session.execute(code);
    } catch (cause) {
      reportKernelError(cause);
      return;
    }
    let sawExecError: { ename: string; evalue: string } | null = null;
    try {
      for await (const event of stream) {
        if (disposed) break;
        if (event.type === 'status') {
          // status:busy is implicit (we just transitioned to 'running');
          // status:idle is the terminal — handled below the loop.
          continue;
        }
        if (event.type === 'error') {
          sawExecError = { ename: event.ename, evalue: event.evalue };
        }
        onEvent(event);
      }
    } catch (cause) {
      reportKernelError(cause);
      return;
    }
    if (disposed) return;
    if (sawExecError !== null) {
      onPhase({ type: 'execError', ename: sawExecError.ename, evalue: sawExecError.evalue });
    } else {
      onPhase({ type: 'finished' });
    }
  };

  const interrupt = async (): Promise<void> => {
    if (disposed || session === null) return;
    try {
      await session.interrupt();
    } catch (cause) {
      reportKernelError(cause);
    }
  };

  return { start, run, interrupt };
}
