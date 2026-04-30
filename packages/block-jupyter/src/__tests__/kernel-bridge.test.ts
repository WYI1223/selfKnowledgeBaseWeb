import { describe, expect, it, vi } from 'vitest';
import type {
  KernelAdapter,
  KernelCapabilities,
  KernelEvent,
  KernelSession,
} from '@skb/kernel-adapter';
import { KernelStartupError } from '@skb/kernel-adapter';
import { createKernelBridge, type KernelPhase } from '../ui-default/kernel-bridge';

/**
 * Build an AsyncIterable<KernelEvent> from a fixed array. Returning a
 * concrete iterator (not an `async function*`) keeps eslint
 * `require-await` happy without sprinkling `await Promise.resolve()`.
 */
function makeAsyncIterable<T>(items: readonly T[]): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator](): AsyncIterator<T> {
      let i = 0;
      return {
        next(): Promise<IteratorResult<T>> {
          if (i < items.length) {
            const value = items[i++] as T;
            return Promise.resolve({ value, done: false });
          }
          return Promise.resolve({ value: undefined as unknown as T, done: true });
        },
      };
    },
  };
}

/**
 * Mock KernelAdapter + KernelSession exercise the bridge state-machine
 * without booting Pyodide. Verifies the consumer pattern E2/E3 will inherit:
 *   - per-block sessionId scoping
 *   - phase transitions: idle → starting → ready → running → finished/execError
 *   - kernelError surface for KernelError throws
 *   - AbortSignal cleanup on unmount (mid-start + mid-run)
 *   - onEvent receives non-status events in arrival order
 */

interface MockSessionPlan {
  events: KernelEvent[];
  /** thrown by execute() before AsyncIterable starts */
  throwOnExecute?: Error;
  /** thrown by interrupt() */
  throwOnInterrupt?: Error;
  /** thrown by shutdown() */
  throwOnShutdown?: Error;
}

function makeAdapter(
  startBehavior: 'ok' | 'throw-startup' | 'pending',
  plan: MockSessionPlan = { events: [] },
): {
  adapter: KernelAdapter;
  resolveStart?: () => void;
  rejectStart?: (err: unknown) => void;
  shutdownCalls: { count: number };
  interruptCalls: { count: number };
} {
  const shutdownCalls = { count: 0 };
  const interruptCalls = { count: 0 };

  const session: KernelSession = {
    execute(code: string): AsyncIterable<KernelEvent> {
      void code;
      if (plan.throwOnExecute !== undefined) {
        throw plan.throwOnExecute;
      }
      const events = plan.events;
      return makeAsyncIterable(events);
    },
    interrupt(): Promise<void> {
      interruptCalls.count++;
      if (plan.throwOnInterrupt !== undefined) {
        return Promise.reject(plan.throwOnInterrupt);
      }
      return Promise.resolve();
    },
    shutdown(): Promise<void> {
      shutdownCalls.count++;
      if (plan.throwOnShutdown !== undefined) {
        return Promise.reject(plan.throwOnShutdown);
      }
      return Promise.resolve();
    },
  };

  const capabilities: KernelCapabilities = {
    libraries: ['numpy'],
    gpu: false,
    persistentState: true,
  };

  let resolveStart: (() => void) | undefined;
  let rejectStart: ((err: unknown) => void) | undefined;
  const startResult: Promise<KernelSession> =
    startBehavior === 'ok'
      ? Promise.resolve(session)
      : startBehavior === 'throw-startup'
        ? Promise.reject(new KernelStartupError('mock startup boom'))
        : new Promise((res, rej) => {
            resolveStart = () => res(session);
            rejectStart = rej;
          });

  const adapter: KernelAdapter = {
    id: 'mock-pyodide',
    capabilities,
    startSession: (sessionId): Promise<KernelSession> => {
      void sessionId;
      return startResult;
    },
  };

  const result: {
    adapter: KernelAdapter;
    resolveStart?: () => void;
    rejectStart?: (err: unknown) => void;
    shutdownCalls: { count: number };
    interruptCalls: { count: number };
  } = { adapter, shutdownCalls, interruptCalls };
  if (resolveStart !== undefined) result.resolveStart = resolveStart;
  if (rejectStart !== undefined) result.rejectStart = rejectStart;
  return result;
}

function makePhaseRecorder(): {
  phases: KernelPhase[];
  onPhase: (phase: KernelPhase) => void;
} {
  const phases: KernelPhase[] = [];
  return {
    phases,
    onPhase: (phase) => phases.push(phase),
  };
}

describe('createKernelBridge — startSession lifecycle', () => {
  it('transitions idle → starting → ready on successful start', async () => {
    const { adapter } = makeAdapter('ok', { events: [] });
    const { phases, onPhase } = makePhaseRecorder();
    const controller = new AbortController();
    const bridge = createKernelBridge({
      adapter,
      sessionId: 'test-1',
      signal: controller.signal,
      onPhase,
      onEvent: () => {},
    });
    await bridge.start();
    expect(phases).toEqual([{ type: 'starting' }, { type: 'ready' }]);
  });

  it('start() is idempotent — second call resolves to the same session without re-emitting starting', async () => {
    const { adapter } = makeAdapter('ok', { events: [] });
    const { phases, onPhase } = makePhaseRecorder();
    const controller = new AbortController();
    const bridge = createKernelBridge({
      adapter,
      sessionId: 'test-2',
      signal: controller.signal,
      onPhase,
      onEvent: () => {},
    });
    await bridge.start();
    await bridge.start();
    expect(phases.filter((p) => p.type === 'starting')).toHaveLength(1);
    expect(phases.filter((p) => p.type === 'ready')).toHaveLength(1);
  });

  it('emits kernelError phase with the KernelError.kind discriminant on startup failure', async () => {
    const { adapter } = makeAdapter('throw-startup');
    const { phases, onPhase } = makePhaseRecorder();
    const controller = new AbortController();
    const bridge = createKernelBridge({
      adapter,
      sessionId: 'test-3',
      signal: controller.signal,
      onPhase,
      onEvent: () => {},
    });
    await bridge.start();
    expect(phases.at(0)).toEqual({ type: 'starting' });
    const last = phases.at(-1);
    expect(last?.type).toBe('kernelError');
    if (last?.type !== 'kernelError') throw new Error('expected kernelError');
    expect(last.kind).toBe('startup');
    expect(last.message).toMatch(/mock startup boom/);
  });

  it('aborting before start completes discards the session and shuts it down', async () => {
    const { adapter, resolveStart, shutdownCalls } = makeAdapter('pending');
    const { phases, onPhase } = makePhaseRecorder();
    const controller = new AbortController();
    const bridge = createKernelBridge({
      adapter,
      sessionId: 'test-4',
      signal: controller.signal,
      onPhase,
      onEvent: () => {},
    });
    const startPromise = bridge.start();
    expect(phases).toEqual([{ type: 'starting' }]);
    controller.abort();
    resolveStart?.();
    await startPromise;
    // Aborted before "ready" was emitted; freshly-built session got shutdown.
    expect(phases.find((p) => p.type === 'ready')).toBeUndefined();
    expect(shutdownCalls.count).toBe(1);
  });
});

describe('createKernelBridge — run() event stream', () => {
  it('maps stdout/stderr/execute_result to onEvent in arrival order; finishes on idle status', async () => {
    const events: KernelEvent[] = [
      { type: 'status', state: 'busy' },
      { type: 'stdout', text: 'hello\n' },
      { type: 'stderr', text: 'warn\n' },
      { type: 'execute_result', data: { 'text/plain': '42' } },
      { type: 'status', state: 'idle' },
    ];
    const { adapter } = makeAdapter('ok', { events });
    const phases: KernelPhase[] = [];
    const seen: KernelEvent[] = [];
    const controller = new AbortController();
    const bridge = createKernelBridge({
      adapter,
      sessionId: 'run-1',
      signal: controller.signal,
      onPhase: (p) => phases.push(p),
      onEvent: (e) => seen.push(e),
    });
    await bridge.run('print("hi")');
    expect(seen.map((e) => e.type)).toEqual(['stdout', 'stderr', 'execute_result']);
    expect(phases.at(-1)).toEqual({ type: 'finished' });
  });

  it('emits execError phase when error event seen, with ename + evalue captured', async () => {
    const events: KernelEvent[] = [
      { type: 'status', state: 'busy' },
      { type: 'error', ename: 'NameError', evalue: 'x not defined', traceback: ['line 1'] },
      { type: 'status', state: 'idle' },
    ];
    const { adapter } = makeAdapter('ok', { events });
    const phases: KernelPhase[] = [];
    const controller = new AbortController();
    const bridge = createKernelBridge({
      adapter,
      sessionId: 'run-2',
      signal: controller.signal,
      onPhase: (p) => phases.push(p),
      onEvent: () => {},
    });
    await bridge.run('x');
    const last = phases.at(-1);
    expect(last).toEqual({
      type: 'execError',
      ename: 'NameError',
      evalue: 'x not defined',
    });
  });

  it('starts the kernel implicitly when run() is called before start()', async () => {
    const { adapter } = makeAdapter('ok', {
      events: [
        { type: 'status', state: 'busy' },
        { type: 'status', state: 'idle' },
      ],
    });
    const phases: KernelPhase[] = [];
    const controller = new AbortController();
    const bridge = createKernelBridge({
      adapter,
      sessionId: 'run-3',
      signal: controller.signal,
      onPhase: (p) => phases.push(p),
      onEvent: () => {},
    });
    await bridge.run('x = 1');
    const types = phases.map((p) => p.type);
    expect(types).toContain('starting');
    expect(types).toContain('ready');
    expect(types).toContain('running');
    expect(types.at(-1)).toBe('finished');
  });

  it('aborting mid-stream stops dispatching events without crashing', async () => {
    const controller = new AbortController();
    let nextCalls = 0;
    const session: KernelSession = {
      execute(code: string): AsyncIterable<KernelEvent> {
        void code;
        const queue: KernelEvent[] = [
          { type: 'status', state: 'busy' },
          { type: 'stdout', text: '1\n' },
          { type: 'stdout', text: '2\n' },
          { type: 'status', state: 'idle' },
        ];
        let i = 0;
        return {
          [Symbol.asyncIterator](): AsyncIterator<KernelEvent> {
            return {
              next(): Promise<IteratorResult<KernelEvent>> {
                nextCalls++;
                if (i >= queue.length) {
                  return Promise.resolve({ value: undefined as unknown as KernelEvent, done: true });
                }
                const value = queue[i++] as KernelEvent;
                return Promise.resolve({ value, done: false });
              },
            };
          },
        };
      },
      interrupt: () => Promise.resolve(),
      shutdown: () => Promise.resolve(),
    };
    const adapter: KernelAdapter = {
      id: 'mock',
      capabilities: { libraries: [], gpu: false, persistentState: true },
      startSession: () => Promise.resolve(session),
    };
    const seen: KernelEvent[] = [];
    const phases: KernelPhase[] = [];
    const bridge = createKernelBridge({
      adapter,
      sessionId: 'run-4',
      signal: controller.signal,
      onPhase: (p) => phases.push(p),
      onEvent: (e) => {
        seen.push(e);
        // Abort once we've seen the first stdout — verifies the bridge stops
        // calling onEvent on subsequent yielded events even though the iterator
        // could still produce them.
        if (seen.length === 1) controller.abort();
      },
    });
    await bridge.run('loop');
    expect(seen.map((e) => e.type)).toEqual(['stdout']);
    expect(nextCalls).toBeGreaterThanOrEqual(2);
    // No 'finished' phase emitted — bridge bailed out via disposed check.
    expect(phases.find((p) => p.type === 'finished')).toBeUndefined();
  });
});

describe('createKernelBridge — interrupt + shutdown', () => {
  it('interrupt() delegates to session.interrupt()', async () => {
    const { adapter, interruptCalls } = makeAdapter('ok', { events: [] });
    const { onPhase } = makePhaseRecorder();
    const controller = new AbortController();
    const bridge = createKernelBridge({
      adapter,
      sessionId: 'int-1',
      signal: controller.signal,
      onPhase,
      onEvent: () => {},
    });
    await bridge.start();
    await bridge.interrupt();
    expect(interruptCalls.count).toBe(1);
  });

  it('signal.abort() invokes session.shutdown() exactly once', async () => {
    const { adapter, shutdownCalls } = makeAdapter('ok', { events: [] });
    const { onPhase } = makePhaseRecorder();
    const controller = new AbortController();
    const bridge = createKernelBridge({
      adapter,
      sessionId: 'shut-1',
      signal: controller.signal,
      onPhase,
      onEvent: () => {},
    });
    await bridge.start();
    controller.abort();
    // microtask flush — shutdown is fire-and-forget
    await Promise.resolve();
    expect(shutdownCalls.count).toBe(1);
  });

  it('interrupt() before start is a no-op (does not throw)', async () => {
    const { adapter, interruptCalls } = makeAdapter('ok', { events: [] });
    const { onPhase } = makePhaseRecorder();
    const controller = new AbortController();
    const bridge = createKernelBridge({
      adapter,
      sessionId: 'int-2',
      signal: controller.signal,
      onPhase,
      onEvent: () => {},
    });
    await bridge.interrupt();
    expect(interruptCalls.count).toBe(0);
  });

  it('passes the supplied sessionId straight to adapter.startSession (per-block scoping witness)', async () => {
    const { adapter } = makeAdapter('ok', { events: [] });
    const spy = vi.spyOn(adapter, 'startSession');
    const { onPhase } = makePhaseRecorder();
    const controller = new AbortController();
    const bridge = createKernelBridge({
      adapter,
      sessionId: 'jupyter-block-A-uuid-1',
      signal: controller.signal,
      onPhase,
      onEvent: () => {},
    });
    await bridge.start();
    expect(spy).toHaveBeenCalledWith('jupyter-block-A-uuid-1');
  });
});
