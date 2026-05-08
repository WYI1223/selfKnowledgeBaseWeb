import { codeCore } from './core-definition';
import type { CodeMdastJsxElement, CodeTiptapNode } from './serialize';

/**
 * MDX 解析 stub。Wave 3 mdx-bridge 在 mdastBlockToTiptap 看到
 * mdxJsxFlowElement{name:'Code'} 时按 mdxComponent 路由到本函数（RFC §5）。
 *
 * 当前 stub: 把 attributes 数组取回成 props 对象，propsSchema.parse 校验后构造
 * Tiptap node。children 透传，留 mdx-bridge 后续递归解析为 inline TiptapNode[].
 */
export function parseCode(node: CodeMdastJsxElement): CodeTiptapNode {
  if (node.name !== codeCore.mdxComponent) {
    throw new Error(
      `parseCode: expected mdxComponent="${codeCore.mdxComponent}", got "${node.name}"`,
    );
  }
  const rawProps: Record<string, string> = {};
  for (const attr of node.attributes) {
    rawProps[attr.name] = attr.value;
  }
  const normalized: Record<string, unknown> = { ...rawProps };
  if (rawProps.showLineNumbers !== undefined) {
    if (rawProps.showLineNumbers === 'true') {
      normalized.showLineNumbers = true;
    } else if (rawProps.showLineNumbers === 'false') {
      normalized.showLineNumbers = false;
    } else {
      normalized.showLineNumbers = rawProps.showLineNumbers;
    }
  }
  const validated = codeCore.propsSchema.parse(normalized);
  const attrs: CodeTiptapNode['attrs'] = {
    language: validated.language,
    code: validated.code,
    showLineNumbers: validated.showLineNumbers,
  };
  return {
    type: 'componentCode',
    attrs,
    content: node.children,
  };
}
