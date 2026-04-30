import { calloutCore } from './core-definition';
import type { CalloutMdastJsxElement, CalloutTiptapNode } from './serialize';

/**
 * MDX 解析 stub。Wave 3 mdx-bridge 在 mdastBlockToTiptap 看到
 * mdxJsxFlowElement{name:'Callout'} 时按 mdxComponent 路由到本函数（RFC §5）。
 *
 * 当前 stub: 把 attributes 数组取回成 props 对象，propsSchema.parse 校验后构造
 * Tiptap node。children 透传，留 mdx-bridge 后续递归解析为 inline TiptapNode[].
 */
export function parseCallout(node: CalloutMdastJsxElement): CalloutTiptapNode {
  if (node.name !== calloutCore.mdxComponent) {
    throw new Error(
      `parseCallout: expected mdxComponent="${calloutCore.mdxComponent}", got "${node.name}"`,
    );
  }
  const rawProps: Record<string, string> = {};
  for (const attr of node.attributes) {
    rawProps[attr.name] = attr.value;
  }
  const validated = calloutCore.propsSchema.parse(rawProps);
  const attrs: CalloutTiptapNode['attrs'] =
    validated.title !== undefined
      ? { variant: validated.variant, title: validated.title }
      : { variant: validated.variant };
  return {
    type: 'callout',
    attrs,
    content: node.children,
  };
}
