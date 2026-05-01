import { describe, expect, it } from 'vitest';
import {
  computeFlowLayout,
  NODE_HEIGHT,
  NODE_WIDTH,
  SVG_PAD,
  SVG_ARIA_LABEL,
  type FlowLayoutDescriptor,
} from '../ui-default/flow-layout';
import { createFlowBridge } from '../ui-default/flow-bridge';
import type { AgentFlowEdge, AgentFlowNode } from '../core/serialize';

/**
 * Single-source authority test (ADR-0006 #5 algorithm replication boundary).
 * `flow-layout.ts` owns layout + topology validation + SVG geometry; both
 * `AgentFlow.tsx` (via `createFlowBridge` → `computeFlowLayout`) and
 * `AgentFlow.astro` (direct call) consume the same descriptor.
 *
 * This file pins a corpus of (nodes, edges) inputs and asserts the
 * descriptor's structure is byte-stable. If anyone reimplements layout
 * inside Astro or the React component, these comparisons would diverge:
 *   - the bridge.onLaidOut descriptor BYTE-EQUALS computeFlowLayout(nodes, edges)
 *   - errored cases propagate symmetric messages through both surfaces
 *
 * Sister-doc with @skb/block-nn-viz E2 R2 ssr-render byte-equal pattern.
 */

interface Corpus {
  readonly name: string;
  readonly nodes: readonly AgentFlowNode[];
  readonly edges: readonly AgentFlowEdge[];
}

const CORPUS: readonly Corpus[] = [
  {
    name: 'empty',
    nodes: [],
    edges: [],
  },
  {
    name: 'linear-chain-positionless',
    nodes: [
      { id: 'a', label: 'A', type: 'agent', position: { x: 0, y: 0 } },
      { id: 'b', label: 'B', type: 'tool', position: { x: 0, y: 0 } },
      { id: 'c', label: 'C', type: 'memory', position: { x: 0, y: 0 } },
    ],
    edges: [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'b', target: 'c' },
    ],
  },
  {
    name: 'explicit-positions',
    nodes: [
      { id: 'a', label: 'A', type: 'agent', position: { x: 50, y: 50 } },
      { id: 'b', label: 'B', type: 'router', position: { x: 300, y: 100 } },
    ],
    edges: [{ id: 'e1', source: 'a', target: 'b' }],
  },
];

const INVALID_CORPUS: readonly Corpus[] = [
  {
    name: 'unknown-target',
    nodes: [
      { id: 'a', label: 'A', type: 'agent', position: { x: 50, y: 50 } },
    ],
    edges: [{ id: 'e1', source: 'a', target: 'ghost' }],
  },
  {
    name: 'cycle-explicit-positions',
    nodes: [
      { id: 'a', label: 'A', type: 'agent', position: { x: 50, y: 50 } },
      { id: 'b', label: 'B', type: 'tool', position: { x: 200, y: 100 } },
    ],
    edges: [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'b', target: 'a' },
    ],
  },
];

function descriptorViaBridge(
  nodes: readonly AgentFlowNode[],
  edges: readonly AgentFlowEdge[],
): FlowLayoutDescriptor {
  let captured: FlowLayoutDescriptor = { kind: 'errored', message: 'no descriptor captured' };
  const controller = new AbortController();
  const bridge = createFlowBridge({
    nodes,
    edges,
    signal: controller.signal,
    onPhase: (p) => {
      if (p.type === 'errored') captured = { kind: 'errored', message: p.message };
    },
    onLaidOut: (d) => {
      captured = d;
    },
  });
  bridge.mount();
  return captured;
}

describe('SSR descriptor byte-equality (single-source authority)', () => {
  for (const c of CORPUS) {
    it(`byte-equals across direct call + bridge for "${c.name}"`, () => {
      const direct = computeFlowLayout(c.nodes, c.edges);
      const viaBridge = descriptorViaBridge(c.nodes, c.edges);
      // Stable JSON comparison — both paths MUST produce identical descriptors,
      // otherwise SSR HTML and React-rendered DOM would diverge under
      // hydration (FOUC / reconciliation mismatch).
      expect(JSON.stringify(viaBridge)).toBe(JSON.stringify(direct));
    });
  }

  for (const c of INVALID_CORPUS) {
    it(`error propagates symmetrically for "${c.name}"`, () => {
      const direct = computeFlowLayout(c.nodes, c.edges);
      const viaBridge = descriptorViaBridge(c.nodes, c.edges);
      expect(direct.kind).toBe('errored');
      expect(viaBridge.kind).toBe('errored');
      if (direct.kind !== 'errored' || viaBridge.kind !== 'errored') {
        throw new Error('expected errored on both paths');
      }
      expect(viaBridge.message).toBe(direct.message);
    });
  }
});

describe('SSR geometry constants are stable (Wave 3 swap signal)', () => {
  it('NODE_WIDTH / NODE_HEIGHT / SVG_PAD / aria-label match descriptor.svg fields', () => {
    const out = computeFlowLayout(
      [{ id: 'a', label: 'A', type: 'agent', position: { x: 100, y: 50 } }],
      [],
    );
    expect(out.kind).toBe('ok');
    if (out.kind !== 'ok') throw new Error('expected ok');
    expect(out.svg.nodeWidth).toBe(NODE_WIDTH);
    expect(out.svg.nodeHeight).toBe(NODE_HEIGHT);
    expect(out.svg.ariaLabel).toBe(SVG_ARIA_LABEL);
    // offsets and dimensions are SVG_PAD-anchored
    expect(out.svg.offsetX).toBe(SVG_PAD - 100);
    expect(out.svg.offsetY).toBe(SVG_PAD - 50);
    expect(out.svg.width).toBe(NODE_WIDTH + SVG_PAD * 2);
    expect(out.svg.height).toBe(NODE_HEIGHT + SVG_PAD * 2);
  });
});
