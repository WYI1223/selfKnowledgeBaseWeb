import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  type Edge as RfEdge,
  type Node as RfNode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { BlockViewProps } from '@skb/block-foundation';
import { agentFlowCore } from '../core/core-definition';
import type { AgentFlowEdge, AgentFlowNode } from '../core/serialize';
import { createFlowBridge, type FlowBridge, type FlowPhase } from './flow-bridge';
import type { FlowLayoutDescriptor, LayoutFn } from './flow-layout';

/**
 * AgentFlowView — Tiptap NodeView for `kind='viz'` agent-flow block. Renders
 *   - per-block isolated React Flow canvas
 *   - status indicator driven by FlowPhase
 *   - errored panel for cyclic / unknown-id edges
 *
 * Layout + validation come from `flow-layout.ts` via the bridge (ADR-0006 #5
 * single source of truth — `AgentFlow.astro` consumes the same authority).
 *
 * Mirrors JupyterView's "no explicit BlockUIDefinition<typeof ...> annotation"
 * pattern (ADR-0003 inference rule; see jupyter.ui.ts comment) — the optional
 * `layout` prop widens the signature so `defineUI` infers a generic
 * compatible with `BlockUIDefinition<ZodTypeAny>`. The prop is also a real
 * runtime injection point: tests substitute deterministic stubs, and Wave 3
 * dagre/elkjs swaps land here without changing the bridge interface.
 */

export interface AgentFlowViewProps
  extends BlockViewProps<typeof agentFlowCore.propsSchema> {
  /**
   * Override the auto-layout function. Production code defaults to BFS;
   * tests inject deterministic stubs; Wave 3 dagre/elkjs lands here.
   */
  readonly layout?: LayoutFn;
}

const NODE_TYPE_LABELS: Record<AgentFlowNode['type'], string> = {
  agent: 'Agent',
  tool: 'Tool',
  memory: 'Memory',
  router: 'Router',
};

function toReactFlowNodes(nodes: readonly AgentFlowNode[]): RfNode[] {
  return nodes.map((n) => ({
    id: n.id,
    type: 'default',
    data: { label: `${NODE_TYPE_LABELS[n.type]}: ${n.label}` },
    position: { x: n.position.x, y: n.position.y },
    className: `skb-agent-flow-node skb-agent-flow-node-${n.type}`,
  }));
}

function toReactFlowEdges(edges: readonly AgentFlowEdge[]): RfEdge[] {
  return edges.map((e) => {
    const base: RfEdge = {
      id: e.id,
      source: e.source,
      target: e.target,
      className: 'skb-agent-flow-edge',
    };
    return e.label !== undefined ? { ...base, label: e.label } : base;
  });
}

type OkDescriptor = Extract<FlowLayoutDescriptor, { kind: 'ok' }>;

export function AgentFlowView({ props, layout }: AgentFlowViewProps): JSX.Element {
  const [phase, setPhase] = useReducer(
    (_prev: FlowPhase, next: FlowPhase) => next,
    { type: 'idle' } as FlowPhase,
  );
  const [descriptor, setDescriptor] = useState<OkDescriptor | null>(null);
  const bridgeRef = useRef<FlowBridge | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const bridge = createFlowBridge({
      nodes: props.nodes,
      edges: props.edges,
      signal: controller.signal,
      onPhase: setPhase,
      onLaidOut: (d) => setDescriptor(d),
      ...(layout !== undefined ? { layout } : {}),
    });
    bridgeRef.current = bridge;
    bridge.mount();
    return () => {
      controller.abort();
      bridgeRef.current = null;
    };
  }, [props.nodes, props.edges, layout]);

  const rfNodes = useMemo(
    () => (descriptor === null ? [] : toReactFlowNodes(descriptor.nodes)),
    [descriptor],
  );
  const rfEdges = useMemo(() => toReactFlowEdges(props.edges), [props.edges]);

  const statusLabel = describePhase(phase);

  return (
    <div data-block="agent-flow" data-phase={phase.type}>
      <div className="skb-agent-flow-toolbar">
        <span className="skb-agent-flow-status" role="status">
          {statusLabel}
        </span>
      </div>
      {phase.type === 'errored' ? (
        <div className="skb-agent-flow-error" role="alert">
          {phase.message}
        </div>
      ) : (
        <div
          className="skb-agent-flow-canvas"
          style={{ width: '100%', height: 360 }}
          data-interactive={props.interactive ? 'true' : 'false'}
        >
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            nodesDraggable={props.interactive}
            nodesConnectable={false}
            edgesUpdatable={false}
            elementsSelectable={props.interactive}
            panOnDrag={props.interactive}
            zoomOnScroll={props.interactive}
            zoomOnPinch={props.interactive}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      )}
    </div>
  );
}

function describePhase(phase: FlowPhase): string {
  switch (phase.type) {
    case 'idle':
      return 'Idle';
    case 'mounted':
      return 'Laying out…';
    case 'laidout':
      return 'Ready';
    case 'errored':
      return `Error: ${phase.message}`;
  }
}

export const AgentFlowEditorView = AgentFlowView;
export const AgentFlowRenderView = AgentFlowView;
