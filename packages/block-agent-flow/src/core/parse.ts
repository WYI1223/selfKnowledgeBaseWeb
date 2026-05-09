import { evalAttrExpression } from '@skb/block-foundation';
import { agentFlowCore } from './core-definition';
import type { AgentFlowMdastJsxElement, AgentFlowTiptapNode } from './serialize';

/**
 * MDX 解析。mdx-bridge 在 mdastBlockToTiptap 看到
 * mdxJsxFlowElement{name:'AgentFlow'} 时按 mdxComponent 路由到本函数（RFC §5）。
 *
 * Attribute value extraction goes through `evalAttrExpression` (post Wave 6
 * carry-forward #16 2026-05-08): each attr resolves to string | null | static
 * JS literal (Literal / TemplateLiteral / ArrayExpression / ObjectExpression).
 *
 * `interactive` accepts: null shorthand → true; "true"/"false" string →
 * boolean; or expression `{true}` / `{false}`.
 *
 * `nodes` / `edges` accept: an array of objects (JS literal `[{...}, ...]`
 * via expression form — the production sample-blocks shape) OR a JSON-encoded
 * string `'[{...}]'` (legacy round-trip path that `serializeAgentFlow` still
 * emits for byte-stability).
 */
export function parseAgentFlow(node: AgentFlowMdastJsxElement): AgentFlowTiptapNode {
  if (node.name !== agentFlowCore.mdxComponent) {
    throw new Error(
      `parseAgentFlow: expected mdxComponent="${agentFlowCore.mdxComponent}", got "${node.name}"`,
    );
  }
  const rawProps: Record<string, unknown> = {};
  for (const attr of node.attributes) {
    const v = evalAttrExpression(attr.value);
    if (attr.name === 'interactive') {
      if (v === null) {
        rawProps[attr.name] = true;
      } else if (typeof v === 'boolean') {
        rawProps[attr.name] = v;
      } else if (v === 'true' || v === 'false') {
        rawProps[attr.name] = v === 'true';
      } else {
        throw new Error(
          `parseAgentFlow: invalid ${attr.name} attribute value: ${JSON.stringify(v)}`,
        );
      }
    } else if (attr.name === 'nodes' || attr.name === 'edges') {
      if (v === null) {
        throw new Error(
          `parseAgentFlow: attribute "${attr.name}" must have a value (got null shorthand; only boolean attrs support shorthand)`,
        );
      }
      let parsed: unknown;
      if (Array.isArray(v)) {
        parsed = v;
      } else if (typeof v === 'string') {
        try {
          parsed = JSON.parse(v);
        } catch {
          throw new Error(
            `parseAgentFlow: ${attr.name} attribute is not valid JSON: ${JSON.stringify(v)}`,
          );
        }
      } else {
        throw new Error(
          `parseAgentFlow: ${attr.name} must be an array or JSON string; got ${typeof v}`,
        );
      }
      if (!Array.isArray(parsed)) {
        throw new Error(
          `parseAgentFlow: ${attr.name} must decode to array; got ${JSON.stringify(parsed)}`,
        );
      }
      rawProps[attr.name] = parsed;
    } else {
      if (v === null) {
        throw new Error(
          `parseAgentFlow: attribute "${attr.name}" must have a string value (got null shorthand; only boolean attrs support shorthand)`,
        );
      }
      if (typeof v !== 'string') {
        throw new Error(
          `parseAgentFlow: attribute "${attr.name}" must be a string, got ${typeof v}`,
        );
      }
      rawProps[attr.name] = v;
    }
  }
  const validated = agentFlowCore.propsSchema.parse(rawProps);
  return {
    type: 'agent-flow',
    attrs: {
      nodes: validated.nodes,
      edges: validated.edges,
      interactive: validated.interactive,
    },
  };
}
