import { agentFlowCore } from './core-definition';

/**
 * MDX 序列化 stub. 完整实现等 Wave 3 mdx-bridge routing table 落地（RFC §5）：
 * mdx-bridge 拿到 TiptapNode{type:'agent-flow'} 时按 mdxComponent 字符串路由
 * 到本函数。
 *
 * Wave 2 阶段仅暴露稳定签名；mdx-bridge 还未引用此 export，但
 * agentFlowCore.propsSchema 提供的字段验证已足够保证 round-trip stability。
 */

export interface AgentFlowNode {
  readonly id: string;
  readonly label: string;
  readonly type: 'agent' | 'tool' | 'memory' | 'router';
  readonly position: { readonly x: number; readonly y: number };
}

export interface AgentFlowEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly label?: string | undefined;
}

export interface AgentFlowTiptapNode {
  readonly type: 'agent-flow';
  readonly attrs: {
    readonly nodes: readonly AgentFlowNode[];
    readonly edges: readonly AgentFlowEdge[];
    readonly interactive: boolean;
  };
}

/**
 * `value` is `string | null` per mdast-util-mdx-jsx convention:
 *   - `<AgentFlow interactive>` (boolean shorthand)         → attribute with `value: null`
 *   - `<AgentFlow interactive="true">` / `"false"`          → string
 *   - `<AgentFlow nodes={[...]}>` (expression)              → handled in Wave 3
 *     when expression-attr support lands; Wave 2 stub only emits string-form
 *     for arrays via JSON.stringify (mdx-bridge consumer will translate to expression).
 *
 * `parseAgentFlow` handles null shorthand for the boolean attr (`interactive`);
 * `serializeAgentFlow` always emits string form for round-trip stability — null
 * shorthand only on the parse side (mirror of block-jupyter / block-math pattern).
 */
export interface AgentFlowMdastJsxElement {
  readonly type: 'mdxJsxFlowElement';
  readonly name: string;
  readonly attributes: ReadonlyArray<{
    readonly type: 'mdxJsxAttribute';
    readonly name: string;
    readonly value: string | null;
  }>;
  readonly children: readonly unknown[];
}

export function serializeAgentFlow(node: AgentFlowTiptapNode): AgentFlowMdastJsxElement {
  const validated = agentFlowCore.propsSchema.parse(node.attrs);
  return {
    type: 'mdxJsxFlowElement',
    name: agentFlowCore.mdxComponent,
    attributes: [
      {
        type: 'mdxJsxAttribute',
        name: 'nodes',
        value: JSON.stringify(validated.nodes),
      },
      {
        type: 'mdxJsxAttribute',
        name: 'edges',
        value: JSON.stringify(validated.edges),
      },
      {
        type: 'mdxJsxAttribute',
        name: 'interactive',
        value: String(validated.interactive),
      },
    ],
    children: [],
  };
}
