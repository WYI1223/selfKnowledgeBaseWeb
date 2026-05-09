import { evalAttrExpression } from '@skb/block-foundation';
import { codeCore } from './core-definition';
import type { CodeMdastJsxElement, CodeTiptapNode } from './serialize';

/**
 * MDX 解析。mdx-bridge 在 mdastBlockToTiptap 看到
 * mdxJsxFlowElement{name:'Code'} 时按 mdxComponent 路由到本函数（RFC §5）。
 *
 * Attribute value extraction goes through `evalAttrExpression` (post Wave 6
 * carry-forward #16 2026-05-08): each attr resolves to string | null | static
 * JS literal — `code={` template literal `}` is the production sample-blocks
 * shape and resolves to a plain string via the TemplateLiteral walk path.
 *
 * `showLineNumbers` accepts: null shorthand → true; "true"/"false" string →
 * boolean; or expression `{true}` / `{false}`.
 */
export function parseCode(node: CodeMdastJsxElement): CodeTiptapNode {
  if (node.name !== codeCore.mdxComponent) {
    throw new Error(
      `parseCode: expected mdxComponent="${codeCore.mdxComponent}", got "${node.name}"`,
    );
  }
  const normalized: Record<string, unknown> = {};
  for (const attr of node.attributes) {
    const v = evalAttrExpression(attr.value);
    if (attr.name === 'showLineNumbers') {
      if (v === null) {
        normalized[attr.name] = true;
      } else if (typeof v === 'boolean') {
        normalized[attr.name] = v;
      } else if (v === 'true' || v === 'false') {
        normalized[attr.name] = v === 'true';
      } else {
        normalized[attr.name] = v;
      }
    } else {
      if (v === null) {
        throw new Error(
          `parseCode: attribute "${attr.name}" must have a value (got null shorthand)`,
        );
      }
      if (typeof v !== 'string') {
        throw new Error(
          `parseCode: attribute "${attr.name}" must be a string, got ${typeof v}`,
        );
      }
      normalized[attr.name] = v;
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
