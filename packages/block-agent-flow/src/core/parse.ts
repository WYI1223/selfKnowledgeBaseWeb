import { agentFlowCore } from './core-definition';
import type { AgentFlowMdastJsxElement, AgentFlowTiptapNode } from './serialize';

/**
 * MDX 解析 stub. Wave 3 mdx-bridge 在 mdastBlockToTiptap 看到
 * mdxJsxFlowElement{name:'AgentFlow'} 时按 mdxComponent 路由到本函数（RFC §5）。
 *
 * Boolean attr (`interactive`) 三种 MDX 形式 (mdast-util-mdx-jsx convention)：
 *   - `<AgentFlow interactive>` (boolean shorthand)   → attr.value === null  → true
 *   - `<AgentFlow interactive="true">`                → "true"  → true
 *   - `<AgentFlow interactive="false">`               → "false" → false
 * 任何其他形式 throw — 不静默 false。
 *
 * `nodes` / `edges` 在 Wave 2 stub 中按 string-encoded JSON 解析（serialize emits
 * JSON.stringify）。Wave 3 mdx-bridge 接 expression-attr 后改为直接接受 array
 * literal 表达式；这层 stub 仅保证 round-trip 形状对齐。
 */
export function parseAgentFlow(node: AgentFlowMdastJsxElement): AgentFlowTiptapNode {
  if (node.name !== agentFlowCore.mdxComponent) {
    throw new Error(
      `parseAgentFlow: expected mdxComponent="${agentFlowCore.mdxComponent}", got "${node.name}"`,
    );
  }
  const rawProps: Record<string, unknown> = {};
  for (const attr of node.attributes) {
    if (attr.name === 'interactive') {
      if (attr.value === null) {
        rawProps[attr.name] = true;
      } else if (attr.value === 'true' || attr.value === 'false') {
        rawProps[attr.name] = attr.value === 'true';
      } else {
        throw new Error(
          `parseAgentFlow: invalid ${attr.name} attribute value: ${JSON.stringify(attr.value)}`,
        );
      }
    } else if (attr.name === 'nodes' || attr.name === 'edges') {
      if (attr.value === null) {
        throw new Error(
          `parseAgentFlow: attribute "${attr.name}" must have a string value (got null shorthand; only boolean attrs support shorthand)`,
        );
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(attr.value);
      } catch {
        throw new Error(
          `parseAgentFlow: ${attr.name} attribute is not valid JSON: ${JSON.stringify(attr.value)}`,
        );
      }
      if (!Array.isArray(parsed)) {
        throw new Error(
          `parseAgentFlow: ${attr.name} must decode to array; got ${JSON.stringify(parsed)}`,
        );
      }
      rawProps[attr.name] = parsed;
    } else {
      if (attr.value === null) {
        throw new Error(
          `parseAgentFlow: attribute "${attr.name}" must have a string value (got null shorthand; only boolean attrs support shorthand)`,
        );
      }
      rawProps[attr.name] = attr.value;
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
