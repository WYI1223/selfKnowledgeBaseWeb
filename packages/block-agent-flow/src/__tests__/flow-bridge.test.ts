import { describe, expect, it } from 'vitest';
import { createFlowBridge, type FlowPhase } from '../ui-default/flow-bridge';
import { computeBfsLayout, validateTopology } from '../ui-default/flow-layout';
import type { AgentFlowEdge, AgentFlowNode } from '../core/serialize';

/**
 * Mirror of block-jupyter/__tests__/kernel-bridge.test.ts:
 * the agent-flow bridge state-machine (idle → mounted → laidout / errored)
 * is exercised without React Flow itself — the bridge is intentionally
 * framework-agnostic so tests do not need happy-dom for the core logic.
 */

const node = (id: string, type: AgentFlowNode['type'] = 'agent', x = 0, y = 0): AgentFlowNode => ({
  id,
  label: id.toUpperCase(),
  type,
  position: { x, y },
});

interface CapturedDescriptor {
  readonly nodes: readonly AgentFlowNode[];
}

describe('createFlowBridge — lifecycle', () => {
  it('transitions idle → mounted → laidout on success with positionless nodes', () => {
    const phases: FlowPhase[] = [];
    const captured: CapturedDescriptor[] = [];
    const controller = new AbortController();
    const bridge = createFlowBridge({
      nodes: [node('a'), node('b')],
      edges: [{ id: 'e', source: 'a', target: 'b' }],
      signal: controller.signal,
      onPhase: (p) => phases.push(p),
      onLaidOut: (d) => captured.push({ nodes: [...d.nodes] }),
    });
    expect(bridge.current()).toEqual({ type: 'idle' });
    bridge.mount();
    expect(phases.map((p) => p.type)).toEqual(['mounted', 'laidout']);
    expect(captured).toHaveLength(1);
    expect(captured[0]?.nodes).toHaveLength(2);
    // BFS: a in column 0, b in column 1
    expect(captured[0]?.nodes[0]?.position.x).toBe(0);
    expect(captured[0]?.nodes[1]?.position.x).toBe(200);
  });

  it('skips layout when every node has explicit non-default position', () => {
    const phases: FlowPhase[] = [];
    const captured: CapturedDescriptor[] = [];
    const controller = new AbortController();
    const explicit = [
      { id: 'a', label: 'A', type: 'agent' as const, position: { x: 50, y: 50 } },
      { id: 'b', label: 'B', type: 'tool' as const, position: { x: 200, y: 100 } },
    ];
    const bridge = createFlowBridge({
      nodes: explicit,
      edges: [{ id: 'e', source: 'a', target: 'b' }],
      signal: controller.signal,
      onPhase: (p) => phases.push(p),
      onLaidOut: (d) => captured.push({ nodes: [...d.nodes] }),
    });
    bridge.mount();
    expect(phases.map((p) => p.type)).toEqual(['mounted', 'laidout']);
    // positions preserved verbatim (BFS not run)
    expect(captured[0]?.nodes[0]?.position).toEqual({ x: 50, y: 50 });
    expect(captured[0]?.nodes[1]?.position).toEqual({ x: 200, y: 100 });
  });

  it('R2-1: explicit positions + invalid edge target STILL emits errored phase', () => {
    // Regression for codex 5.5 R2-1: previously the bridge skipped
    // computeBfsLayout when positions were explicit, so unknown-id /
    // cycle errors silently passed. validateTopology now runs in BOTH paths.
    const phases: FlowPhase[] = [];
    const captured: CapturedDescriptor[] = [];
    const controller = new AbortController();
    const explicit = [
      { id: 'a', label: 'A', type: 'agent' as const, position: { x: 50, y: 50 } },
    ];
    const bridge = createFlowBridge({
      nodes: explicit,
      edges: [{ id: 'e', source: 'a', target: 'ghost' }],
      signal: controller.signal,
      onPhase: (p) => phases.push(p),
      onLaidOut: (d) => captured.push({ nodes: [...d.nodes] }),
    });
    bridge.mount();
    const last = phases.at(-1);
    expect(last?.type).toBe('errored');
    if (last?.type !== 'errored') throw new Error('expected errored');
    expect(last.message).toMatch(/target "ghost" not in nodes/);
    expect(captured).toHaveLength(0);
  });

  it('R2-1: explicit positions + cyclic edges STILL emits errored phase', () => {
    const phases: FlowPhase[] = [];
    const controller = new AbortController();
    const explicit = [
      { id: 'a', label: 'A', type: 'agent' as const, position: { x: 50, y: 50 } },
      { id: 'b', label: 'B', type: 'tool' as const, position: { x: 200, y: 100 } },
    ];
    const bridge = createFlowBridge({
      nodes: explicit,
      edges: [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e2', source: 'b', target: 'a' },
      ],
      signal: controller.signal,
      onPhase: (p) => phases.push(p),
      onLaidOut: () => {},
    });
    bridge.mount();
    const last = phases.at(-1);
    expect(last?.type).toBe('errored');
    if (last?.type !== 'errored') throw new Error('expected errored');
    expect(last.message).toMatch(/cycle/);
  });

  it('mount() is idempotent — second call does not re-emit phases or onLaidOut', () => {
    const phases: FlowPhase[] = [];
    const captured: CapturedDescriptor[] = [];
    const controller = new AbortController();
    const bridge = createFlowBridge({
      nodes: [node('a')],
      edges: [],
      signal: controller.signal,
      onPhase: (p) => phases.push(p),
      onLaidOut: (d) => captured.push({ nodes: [...d.nodes] }),
    });
    bridge.mount();
    bridge.mount();
    expect(phases.filter((p) => p.type === 'mounted')).toHaveLength(1);
    expect(phases.filter((p) => p.type === 'laidout')).toHaveLength(1);
    expect(captured).toHaveLength(1);
  });

  it('emits errored phase when an edge references unknown source/target', () => {
    const phases: FlowPhase[] = [];
    const captured: CapturedDescriptor[] = [];
    const controller = new AbortController();
    const bridge = createFlowBridge({
      nodes: [node('a')],
      edges: [{ id: 'e', source: 'a', target: 'ghost' }],
      signal: controller.signal,
      onPhase: (p) => phases.push(p),
      onLaidOut: (d) => captured.push({ nodes: [...d.nodes] }),
    });
    bridge.mount();
    const last = phases.at(-1);
    expect(last?.type).toBe('errored');
    if (last?.type !== 'errored') throw new Error('expected errored');
    expect(last.message).toMatch(/target "ghost" not in nodes/);
    expect(captured).toHaveLength(0);
  });

  it('emits errored phase on cyclic graph (no roots reachable)', () => {
    const phases: FlowPhase[] = [];
    const controller = new AbortController();
    const bridge = createFlowBridge({
      nodes: [node('a'), node('b')],
      edges: [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e2', source: 'b', target: 'a' },
      ],
      signal: controller.signal,
      onPhase: (p) => phases.push(p),
      onLaidOut: () => {},
    });
    bridge.mount();
    const last = phases.at(-1);
    expect(last?.type).toBe('errored');
    if (last?.type !== 'errored') throw new Error('expected errored');
    expect(last.message).toMatch(/cycle/);
  });

  it('aborting before mount() prevents any phase emission', () => {
    const phases: FlowPhase[] = [];
    const captured: CapturedDescriptor[] = [];
    const controller = new AbortController();
    controller.abort();
    const bridge = createFlowBridge({
      nodes: [node('a')],
      edges: [],
      signal: controller.signal,
      onPhase: (p) => phases.push(p),
      onLaidOut: (d) => captured.push({ nodes: [...d.nodes] }),
    });
    bridge.mount();
    expect(phases).toEqual([]);
    expect(captured).toEqual([]);
  });

  it('aborting after mount() but before consumers act does not crash and stops emission', () => {
    const phases: FlowPhase[] = [];
    const captured: CapturedDescriptor[] = [];
    const controller = new AbortController();
    const bridge = createFlowBridge({
      nodes: [node('a')],
      edges: [],
      signal: controller.signal,
      onPhase: (p) => phases.push(p),
      onLaidOut: (d) => captured.push({ nodes: [...d.nodes] }),
    });
    bridge.mount();
    controller.abort();
    // a second mount() after abort should be a no-op (disposed)
    bridge.mount();
    expect(phases.map((p) => p.type)).toEqual(['mounted', 'laidout']);
    expect(captured).toHaveLength(1);
  });

  it('handles empty nodes gracefully (no phase=errored, laid out as empty)', () => {
    const phases: FlowPhase[] = [];
    const captured: CapturedDescriptor[] = [];
    const controller = new AbortController();
    const bridge = createFlowBridge({
      nodes: [],
      edges: [],
      signal: controller.signal,
      onPhase: (p) => phases.push(p),
      onLaidOut: (d) => captured.push({ nodes: [...d.nodes] }),
    });
    bridge.mount();
    expect(phases.map((p) => p.type)).toEqual(['mounted', 'laidout']);
    expect(captured[0]?.nodes).toEqual([]);
  });

  it('uses injected layout function when supplied (R2-3 dead-API fix)', () => {
    const captured: CapturedDescriptor[] = [];
    const controller = new AbortController();
    const stubPositions = (nodes: readonly AgentFlowNode[]): readonly AgentFlowNode[] =>
      nodes.map((n, i) => ({
        ...n,
        position: { x: 999 + i * 10, y: 555 },
      }));
    const bridge = createFlowBridge({
      nodes: [node('a'), node('b')],
      edges: [{ id: 'e', source: 'a', target: 'b' }],
      signal: controller.signal,
      onPhase: () => {},
      onLaidOut: (d) => captured.push({ nodes: [...d.nodes] }),
      layout: stubPositions,
    });
    bridge.mount();
    // Stub positions, NOT BFS defaults.
    expect(captured[0]?.nodes[0]?.position).toEqual({ x: 999, y: 555 });
    expect(captured[0]?.nodes[1]?.position).toEqual({ x: 1009, y: 555 });
  });
});

describe('computeBfsLayout (pure)', () => {
  it('places isolated node at column 0 row 0', () => {
    const out = computeBfsLayout([node('a')], []);
    expect(out[0]?.position).toEqual({ x: 0, y: 0 });
  });

  it('places linear chain into successive columns', () => {
    const nodes = [node('a'), node('b'), node('c')];
    const edges: AgentFlowEdge[] = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'b', target: 'c' },
    ];
    const out = computeBfsLayout(nodes, edges);
    expect(out[0]?.position.x).toBe(0);
    expect(out[1]?.position.x).toBe(200);
    expect(out[2]?.position.x).toBe(400);
  });

  it('stacks siblings of the same parent into successive rows', () => {
    const nodes = [node('a'), node('b'), node('c')];
    const edges: AgentFlowEdge[] = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'a', target: 'c' },
    ];
    const out = computeBfsLayout(nodes, edges);
    const b = out.find((n) => n.id === 'b');
    const c = out.find((n) => n.id === 'c');
    expect(b?.position.x).toBe(200);
    expect(c?.position.x).toBe(200);
    // y differs (rows 0 and 1 within column 1)
    expect(b?.position.y).not.toBe(c?.position.y);
  });
});

describe('validateTopology (pure)', () => {
  it('returns ok for a valid DAG', () => {
    expect(
      validateTopology(
        [node('a'), node('b'), node('c')],
        [
          { id: 'e1', source: 'a', target: 'b' },
          { id: 'e2', source: 'b', target: 'c' },
        ],
      ),
    ).toEqual({ kind: 'ok' });
  });

  it('returns errored on unknown edge source', () => {
    const out = validateTopology([node('a')], [{ id: 'e', source: 'ghost', target: 'a' }]);
    expect(out.kind).toBe('errored');
    if (out.kind !== 'errored') throw new Error('expected errored');
    expect(out.message).toMatch(/source "ghost" not in nodes/);
  });

  it('returns errored on unknown edge target', () => {
    const out = validateTopology([node('a')], [{ id: 'e', source: 'a', target: 'ghost' }]);
    expect(out.kind).toBe('errored');
    if (out.kind !== 'errored') throw new Error('expected errored');
    expect(out.message).toMatch(/target "ghost" not in nodes/);
  });

  it('returns errored on a cyclic graph (no reachable root)', () => {
    const out = validateTopology(
      [node('a'), node('b')],
      [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e2', source: 'b', target: 'a' },
      ],
    );
    expect(out.kind).toBe('errored');
    if (out.kind !== 'errored') throw new Error('expected errored');
    expect(out.message).toMatch(/cycle/);
  });

  it('returns ok for an empty graph', () => {
    expect(validateTopology([], [])).toEqual({ kind: 'ok' });
  });
});
