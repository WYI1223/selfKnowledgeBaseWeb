import type { MdastJsxAttributeValue } from '@skb/block-foundation';
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
 * `value` is `MdastJsxAttributeValue` per mdast-util-mdx-jsx convention
 * (string | null | mdxJsxAttributeValueExpression):
 *   - `<Jupyter runOnLoad>` (boolean shorthand)        → attribute with `value: null`
 *   - `<Jupyter runOnLoad="true">` / `"false"`         → string
 *   - `<Jupyter code="print(1)">`                      → string
 *   - `<Jupyter code={`...template...`}>`              → mdxJsxAttributeValueExpression
 *     (Wave 6 carry-forward #16 2026-05-08 — sample-blocks uses template
 *     literals for multiline cell source).
 *   - `<Jupyter libraries={["sympy"]}>` (expression)   → mdxJsxAttributeValueExpression
 *     (post-#16; `parseJupyter` walks the estree via `evalAttrExpression`).
 *
 * `parseJupyter` handles null shorthand + expression-form attrs;
 * `serializeJupyter` always emits string form for round-trip stability
 * (null shorthand and JSX expression are parser-side only).
 */
export interface JupyterMdastJsxElement {
  readonly type: 'mdxJsxFlowElement';
  readonly name: string;
  readonly attributes: ReadonlyArray<{
    readonly type: 'mdxJsxAttribute';
    readonly name: string;
    readonly value: MdastJsxAttributeValue;
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
