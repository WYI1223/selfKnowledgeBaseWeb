import type { AgentFlowEdge, AgentFlowNode } from '../core/serialize';

/**
 * Single source of truth for layout + topology validation + SVG geometry.
 * Both `AgentFlow.tsx` (React Flow rendering on the client) and
 * `AgentFlow.astro` (static SSR snapshot) import `computeFlowLayout` and
 * render the resulting descriptor — no path is allowed to inline-replicate
 * validation rules or geometry constants (ADR-0006 #5 algorithm replication
 * boundary; sister-doc with @skb/block-nn-viz E2 R2 fix).
 *
 * Validation runs UNCONDITIONALLY (regardless of whether positions are
 * already explicit), guaranteeing the contract invariant
 * `[data-block='agent-flow'][data-phase='errored']` ever appears for any
 * topology violation — even when the author supplied `(x, y)` for every
 * node and BFS layout would otherwise be skipped.
 */

export const NODE_WIDTH = 140;
export const NODE_HEIGHT = 40;
export const SVG_PAD = 20;
export const COLUMN_GAP = 200;
export const ROW_GAP = 100;
export const SVG_ARIA_LABEL = 'Agent flow diagram';

export type FlowLayoutDescriptor =
  | {
      readonly kind: 'ok';
      readonly nodes: readonly AgentFlowNode[];
      readonly edges: readonly AgentFlowEdge[];
      readonly svg: {
        readonly width: number;
        readonly height: number;
        readonly offsetX: number;
        readonly offsetY: number;
        readonly nodeWidth: number;
        readonly nodeHeight: number;
        readonly ariaLabel: string;
      };
    }
  | { readonly kind: 'errored'; readonly message: string };

export type LayoutFn = (
  nodes: readonly AgentFlowNode[],
  edges: readonly AgentFlowEdge[],
) => readonly AgentFlowNode[];

export function validateTopology(
  nodes: readonly AgentFlowNode[],
  edges: readonly AgentFlowEdge[],
): { kind: 'ok' } | { kind: 'errored'; message: string } {
  const idSet = new Set(nodes.map((n) => n.id));
  for (const edge of edges) {
    if (!idSet.has(edge.source)) {
      return {
        kind: 'errored',
        message: `validateTopology: edge "${edge.id}" source "${edge.source}" not in nodes`,
      };
    }
    if (!idSet.has(edge.target)) {
      return {
        kind: 'errored',
        message: `validateTopology: edge "${edge.id}" target "${edge.target}" not in nodes`,
      };
    }
  }
  if (nodes.length === 0) return { kind: 'ok' };
  const incoming = new Map<string, number>();
  for (const n of nodes) incoming.set(n.id, 0);
  for (const e of edges) {
    incoming.set(e.target, (incoming.get(e.target) ?? 0) + 1);
  }
  const reachable = new Set<string>();
  const queue: string[] = [];
  for (const n of nodes) {
    if ((incoming.get(n.id) ?? 0) === 0) {
      reachable.add(n.id);
      queue.push(n.id);
    }
  }
  const outgoing = new Map<string, string[]>();
  for (const n of nodes) outgoing.set(n.id, []);
  for (const e of edges) outgoing.get(e.source)?.push(e.target);
  while (queue.length > 0) {
    const id = queue.shift() as string;
    for (const child of outgoing.get(id) ?? []) {
      if (!reachable.has(child)) {
        reachable.add(child);
        queue.push(child);
      }
    }
  }
  if (reachable.size !== nodes.length) {
    return {
      kind: 'errored',
      message: 'validateTopology: graph contains a cycle (unreachable nodes from any root)',
    };
  }
  return { kind: 'ok' };
}

/**
 * BFS column layout: place root nodes (no incoming edges) in column 0,
 * their children in column 1, and so on. Pure function — kept exported for
 * test inspection and Wave 3 substitution by dagre/elkjs. Assumes topology
 * has been validated via `validateTopology` (will not throw on invalid
 * input but may produce gaps).
 */
export function computeBfsLayout(
  nodes: readonly AgentFlowNode[],
  edges: readonly AgentFlowEdge[],
): readonly AgentFlowNode[] {
  if (nodes.length === 0) return [];
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  for (const n of nodes) {
    incoming.set(n.id, 0);
    outgoing.set(n.id, []);
  }
  for (const e of edges) {
    incoming.set(e.target, (incoming.get(e.target) ?? 0) + 1);
    outgoing.get(e.source)?.push(e.target);
  }
  const column = new Map<string, number>();
  const queue: string[] = [];
  for (const n of nodes) {
    if ((incoming.get(n.id) ?? 0) === 0) {
      column.set(n.id, 0);
      queue.push(n.id);
    }
  }
  while (queue.length > 0) {
    const id = queue.shift() as string;
    const col = column.get(id) ?? 0;
    for (const child of outgoing.get(id) ?? []) {
      const existing = column.get(child);
      const next = col + 1;
      if (existing === undefined || next > existing) {
        column.set(child, next);
        queue.push(child);
      }
    }
  }
  const rowCounter = new Map<number, number>();
  return nodes.map((n) => {
    const col = column.get(n.id) ?? 0;
    const row = rowCounter.get(col) ?? 0;
    rowCounter.set(col, row + 1);
    return {
      id: n.id,
      label: n.label,
      type: n.type,
      position: { x: col * COLUMN_GAP, y: row * ROW_GAP },
    };
  });
}

function hasExplicitPositions(nodes: readonly AgentFlowNode[]): boolean {
  if (nodes.length === 0) return true;
  return nodes.every((n) => n.position.x !== 0 || n.position.y !== 0);
}

/**
 * Authoritative layout entry. Steps:
 *   1. Validate topology (always — both explicit-position and BFS paths).
 *   2. Pick positions: use explicit (x,y) when every node has non-default
 *      position; otherwise call `layout` (defaults to `computeBfsLayout`).
 *   3. Compute SVG geometry envelope from the positioned nodes.
 *
 * Both Astro SSR + React (NodeView) consume this descriptor; neither path
 * is allowed to recompute geometry inline.
 */
export function computeFlowLayout(
  nodes: readonly AgentFlowNode[],
  edges: readonly AgentFlowEdge[],
  layout: LayoutFn = computeBfsLayout,
): FlowLayoutDescriptor {
  const validation = validateTopology(nodes, edges);
  if (validation.kind === 'errored') return validation;
  const positioned = hasExplicitPositions(nodes) ? nodes : layout(nodes, edges);
  if (positioned.length === 0) {
    return {
      kind: 'ok',
      nodes: positioned,
      edges,
      svg: {
        width: NODE_WIDTH + SVG_PAD * 2,
        height: NODE_HEIGHT + SVG_PAD * 2,
        offsetX: SVG_PAD,
        offsetY: SVG_PAD,
        nodeWidth: NODE_WIDTH,
        nodeHeight: NODE_HEIGHT,
        ariaLabel: SVG_ARIA_LABEL,
      },
    };
  }
  let minX = positioned[0]?.position.x ?? 0;
  let minY = positioned[0]?.position.y ?? 0;
  let maxX = minX;
  let maxY = minY;
  for (const n of positioned) {
    if (n.position.x < minX) minX = n.position.x;
    if (n.position.y < minY) minY = n.position.y;
    if (n.position.x > maxX) maxX = n.position.x;
    if (n.position.y > maxY) maxY = n.position.y;
  }
  return {
    kind: 'ok',
    nodes: positioned,
    edges,
    svg: {
      width: Math.max(maxX - minX + NODE_WIDTH + SVG_PAD * 2, NODE_WIDTH + SVG_PAD * 2),
      height: Math.max(maxY - minY + NODE_HEIGHT + SVG_PAD * 2, NODE_HEIGHT + SVG_PAD * 2),
      offsetX: SVG_PAD - minX,
      offsetY: SVG_PAD - minY,
      nodeWidth: NODE_WIDTH,
      nodeHeight: NODE_HEIGHT,
      ariaLabel: SVG_ARIA_LABEL,
    },
  };
}
