import type { AgentFlowEdge, AgentFlowNode } from '../core/serialize';
import { computeFlowLayout, type FlowLayoutDescriptor, type LayoutFn } from './flow-layout';

/**
 * Per-block React Flow lifecycle bridge — sister to
 * `@skb/block-jupyter/ui-default/kernel-bridge.ts`. Owns the lifecycle
 * phase state-machine; layout + topology validation are delegated to the
 * `flow-layout.ts` authority (ADR-0006 #5 — same module is consumed by
 * both `AgentFlow.tsx` React Flow path and `AgentFlow.astro` SSR path).
 *
 * Lessons codified here (intentional public surface, do not inline-replicate):
 *
 * 1. **Per-block isolation**: every NodeView mount creates its own bridge +
 *    its own React Flow instance. Two agent-flow blocks on the same page do
 *    NOT share node selection, viewport, or any other React Flow state —
 *    each block is an independent canvas. Mirrors block-jupyter's per-block
 *    sessionId scoping.
 * 2. **Layout phase is mandatory UI**: layout runs at most once per bridge
 *    lifetime (idempotent). Validation runs UNCONDITIONALLY (both explicit-
 *    position and BFS paths) so cyclic / unknown-id topologies surface as
 *    `errored` even when the author hand-supplied positions.
 * 3. **AbortSignal-driven cleanup**: every long-lived path is cancellable
 *    via the supplied signal. NodeView unmount aborts; in-flight layout is
 *    discarded (subsequent `onLaidOut` calls are dropped). The bridge does
 *    NOT touch React Flow's internal state — React Flow's own unmount
 *    handles its DOM teardown; the bridge merely stops dispatching.
 * 4. **Errored phase for layout failures**: cyclic edge sets, unknown source
 *    or target ids, or any other layout precondition violation surface as
 *    `phase: 'errored'` with a message. The UI maps `errored` to a
 *    `data-phase='errored'` attribute consumed by `agent-flow.css`.
 *
 * The bridge is intentionally framework-agnostic (no React imports) so unit
 * tests do not need happy-dom for the bridge core itself.
 */

export type FlowPhase =
  /** before layout has been requested */
  | { type: 'idle' }
  /** React Flow has mounted; bridge is preparing layout */
  | { type: 'mounted' }
  /** layout finished; positions are stable for the current nodes */
  | { type: 'laidout' }
  /** layout precondition violated (cyclic, unknown id, etc.) */
  | { type: 'errored'; message: string };

export interface FlowBridgeOptions {
  readonly nodes: readonly AgentFlowNode[];
  readonly edges: readonly AgentFlowEdge[];
  /**
   * Aborts in-flight layout dispatch. NodeView passes its unmount signal
   * here; the bridge stops calling onLaidOut after abort.
   */
  readonly signal: AbortSignal;
  /**
   * Notified when phase changes. The React adapter wraps this with a
   * `useReducer` (see `AgentFlow.tsx`).
   */
  readonly onPhase: (phase: FlowPhase) => void;
  /**
   * Notified once positions are computed. Subsequent `mount()` calls do
   * NOT re-emit; layout is one-shot for the bridge's lifetime.
   */
  readonly onLaidOut: (descriptor: Extract<FlowLayoutDescriptor, { kind: 'ok' }>) => void;
  /**
   * Override the auto-layout function. Production code defaults to BFS
   * column layout; tests inject a deterministic stub. Wave 3 will swap
   * in dagre/elkjs without bridge interface change.
   */
  readonly layout?: LayoutFn;
}

export interface FlowBridge {
  /**
   * Notify the bridge that React Flow has mounted. Triggers layout +
   * validation. Idempotent: a second call after `phase==='laidout'` is a
   * no-op (does not re-emit `onLaidOut`). Mirrors block-jupyter's
   * `bridge.start()` shape.
   */
  mount(): void;
  current(): FlowPhase;
}

export function createFlowBridge(options: FlowBridgeOptions): FlowBridge {
  const { nodes, edges, signal, onPhase, onLaidOut, layout } = options;
  let phase: FlowPhase = { type: 'idle' };
  let mounted = false;
  let disposed = signal.aborted;

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
  };
  signal.addEventListener('abort', dispose, { once: true });

  const setPhase = (next: FlowPhase): void => {
    if (disposed) return;
    phase = next;
    onPhase(next);
  };

  const mount = (): void => {
    if (disposed) return;
    if (mounted) return;
    mounted = true;
    setPhase({ type: 'mounted' });
    if (disposed) return;
    const descriptor = computeFlowLayout(nodes, edges, layout);
    if (disposed) return;
    if (descriptor.kind === 'errored') {
      setPhase({ type: 'errored', message: descriptor.message });
      return;
    }
    onLaidOut(descriptor);
    setPhase({ type: 'laidout' });
  };

  return {
    mount,
    current: () => phase,
  };
}
