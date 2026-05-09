import type { MdastJsxAttributeValue } from '@skb/block-foundation';
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
 * `value` is `MdastJsxAttributeValue` per mdast-util-mdx-jsx convention
 * (string | null | mdxJsxAttributeValueExpression):
 *   - `<AgentFlow interactive>` (boolean shorthand)         → attribute with `value: null`
 *   - `<AgentFlow interactive="true">` / `"false"`          → string
 *   - `<AgentFlow nodes={[...]}>` (expression)              → mdxJsxAttributeValueExpression
 *     (Wave 6 carry-forward #16 2026-05-08 — sample-blocks fixture form;
 *     `parseAgentFlow` walks the estree via `evalAttrExpression`).
 *
 * `parseAgentFlow` handles null shorthand and expression-form attrs;
 * `serializeAgentFlow` always emits string form for round-trip stability —
 * the expression-form path is parser-side only (mirror of block-jupyter +
 * block-nn-viz).
 */
export interface AgentFlowMdastJsxElement {
  readonly type: 'mdxJsxFlowElement';
  readonly name: string;
  readonly attributes: ReadonlyArray<{
    readonly type: 'mdxJsxAttribute';
    readonly name: string;
    readonly value: MdastJsxAttributeValue;
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
