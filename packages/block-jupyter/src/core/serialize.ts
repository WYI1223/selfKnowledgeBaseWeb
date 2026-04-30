import { jupyterCore } from './core-definition';

/**
 * MDX 序列化 stub。完整实现等 Wave 3 mdx-bridge routing table 落地（RFC §5）：
 * mdx-bridge 拿到 TiptapNode{type:'jupyter'} 时按 mdxComponent 字符串路由到本函数。
 *
 * Wave 2 阶段仅暴露稳定签名；mdx-bridge 还未引用此 export，但 jupyterCore.propsSchema
 * 提供的字段验证已足够保证 round-trip stability。
 */
export interface JupyterTiptapNode {
  readonly type: 'jupyter';
  readonly attrs: {
    readonly code: string;
    readonly runOnLoad: boolean;
    readonly showLineNumbers: boolean;
    readonly libraries: readonly string[];
  };
}

/**
 * `value` is `string | null` per mdast-util-mdx-jsx convention:
 *   - `<Jupyter runOnLoad>` (boolean shorthand)        → attribute with `value: null`
 *   - `<Jupyter runOnLoad="true">` / `"false"`         → string
 *   - `<Jupyter code="print(1)">`                      → string (always)
 *   - `<Jupyter libraries={["sympy"]}>` (expression)   → handled in Wave 3 mdx-bridge
 *     when expression-attr support lands; Wave 2 stub only emits string-form for
 *     the array via JSON.stringify (mdx-bridge consumer will translate to expression).
 *
 * `parseJupyter` handles null shorthand for both boolean attrs (`runOnLoad` /
 * `showLineNumbers`); `serializeJupyter` always emits string form for round-trip
 * stability — null shorthand only on the parse side (mirror of block-math pattern).
 */
export interface JupyterMdastJsxElement {
  readonly type: 'mdxJsxFlowElement';
  readonly name: string;
  readonly attributes: ReadonlyArray<{
    readonly type: 'mdxJsxAttribute';
    readonly name: string;
    readonly value: string | null;
  }>;
  readonly children: readonly unknown[];
}

export function serializeJupyter(node: JupyterTiptapNode): JupyterMdastJsxElement {
  const validated = jupyterCore.propsSchema.parse(node.attrs);
  return {
    type: 'mdxJsxFlowElement',
    name: jupyterCore.mdxComponent,
    attributes: [
      { type: 'mdxJsxAttribute', name: 'code', value: validated.code },
      { type: 'mdxJsxAttribute', name: 'runOnLoad', value: String(validated.runOnLoad) },
      {
        type: 'mdxJsxAttribute',
        name: 'showLineNumbers',
        value: String(validated.showLineNumbers),
      },
      {
        type: 'mdxJsxAttribute',
        name: 'libraries',
        value: JSON.stringify(validated.libraries),
      },
    ],
    children: [],
  };
}
