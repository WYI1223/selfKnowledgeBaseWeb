import { mathCore } from './core-definition';
import type { MathMdastJsxElement, MathTiptapNode } from './serialize';

/**
 * MDX 解析 stub。Wave 3 mdx-bridge 在 mdastBlockToTiptap 看到
 * mdxJsxFlowElement{name:'Math'} 时按 mdxComponent 路由到本函数（RFC §5）。
 *
 * `display` 三种 MDX 形式 (mdast-util-mdx-jsx convention):
 *   - `<Math display>` (boolean shorthand)        → attr.value === null  → true
 *   - `<Math display="true">`                     → attr.value === "true" → true
 *   - `<Math display="false">`                    → attr.value === "false"→ false
 * 任何其他形式（数字 / 非 true/false 字符串）throw — 不静默 false。
 *
 * 其他 attr (如 expression) 一律期望 string；null shorthand 仅 display 适用。
 */
export function parseMath(node: MathMdastJsxElement): MathTiptapNode {
  if (node.name !== mathCore.mdxComponent) {
    throw new Error(
      `parseMath: expected mdxComponent="${mathCore.mdxComponent}", got "${node.name}"`,
    );
  }
  const rawProps: Record<string, string | boolean> = {};
  for (const attr of node.attributes) {
    if (attr.name === 'display') {
      if (attr.value === null) {
        rawProps[attr.name] = true;
      } else if (attr.value === 'true' || attr.value === 'false') {
        rawProps[attr.name] = attr.value === 'true';
      } else {
        throw new Error(
          `parseMath: invalid display attribute value: ${JSON.stringify(attr.value)}`,
        );
      }
    } else {
      if (attr.value === null) {
        throw new Error(
          `parseMath: attribute "${attr.name}" must have a string value (got null shorthand; only "display" supports boolean shorthand)`,
        );
      }
      rawProps[attr.name] = attr.value;
    }
  }
  const validated = mathCore.propsSchema.parse(rawProps);
  return {
    type: 'math',
    attrs: { expression: validated.expression, display: validated.display },
  };
}
