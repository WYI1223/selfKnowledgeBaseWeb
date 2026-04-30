import { mathCore } from './core-definition';

/**
 * MDX 序列化 stub。完整实现等 Wave 3 mdx-bridge routing table 落地（RFC §5）：
 * mdx-bridge 拿到 TiptapNode{type:'math'} 时按 mdxComponent 字符串路由到本函数。
 *
 * Wave 2 阶段仅暴露稳定签名；mdx-bridge 还未引用此 export，所以 stub 抛错足够。
 */
export interface MathTiptapNode {
  readonly type: 'math';
  readonly attrs: { readonly expression: string; readonly display: boolean };
}

/**
 * `value` is `string | null` per mdast-util-mdx-jsx convention:
 *   - `<Math display>` (boolean shorthand) → attribute with `value: null`
 *   - `<Math display="true">` / `<Math display="false">` → string
 *   - `<Math expression="x^2">` → string (always)
 * `parseMath` handles both null and string forms for the `display` attribute.
 * `serializeMath` always emits string form (`String(boolean)`) for round-trip
 * stability — null shorthand only on the parse side.
 */
export interface MathMdastJsxElement {
  readonly type: 'mdxJsxFlowElement';
  readonly name: string;
  readonly attributes: ReadonlyArray<{
    readonly type: 'mdxJsxAttribute';
    readonly name: string;
    readonly value: string | null;
  }>;
  readonly children: readonly unknown[];
}

export function serializeMath(node: MathTiptapNode): MathMdastJsxElement {
  const validated = mathCore.propsSchema.parse(node.attrs);
  return {
    type: 'mdxJsxFlowElement',
    name: mathCore.mdxComponent,
    attributes: [
      { type: 'mdxJsxAttribute', name: 'expression', value: validated.expression },
      { type: 'mdxJsxAttribute', name: 'display', value: String(validated.display) },
    ],
    children: [],
  };
}
