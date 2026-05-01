import { nnVizCore } from './core-definition';

/**
 * MDX 序列化 stub。完整实现等 Wave 3 mdx-bridge routing table 落地（RFC §5）：
 * mdx-bridge 拿到 TiptapNode{type:'nn-viz'} 时按 mdxComponent 字符串路由到本函数。
 *
 * Sister-pattern E1 (block-jupyter): boolean attrs string-form, structured
 * data (libraries / layers) JSON-encoded for Wave 2; Wave 3 expression-attr
 * upgrade emits raw arrays via mdx-bridge consumer.
 */
export interface LayerSpec {
  readonly name: string;
  readonly units: number;
  readonly activation: 'relu' | 'softmax' | 'sigmoid' | 'tanh' | 'linear';
}

export interface NnVizTiptapNode {
  readonly type: 'nn-viz';
  readonly attrs: {
    readonly modelUrl: string;
    readonly layers: readonly LayerSpec[];
    readonly showWeights: boolean;
  };
}

/**
 * `value` is `string | null` per mdast-util-mdx-jsx convention:
 *   - `<NnViz showWeights>` (boolean shorthand)        → attribute with `value: null`
 *   - `<NnViz showWeights="true">` / `"false"`         → string
 *   - `<NnViz modelUrl="https://...">`                 → string (always)
 *   - `<NnViz layers={[{...}]}>` (expression)          → handled in Wave 3 mdx-bridge
 *     when expression-attr support lands; Wave 2 stub only emits string-form for
 *     the array via JSON.stringify (mdx-bridge consumer will translate to expression).
 *
 * `parseNnViz` handles null shorthand for `showWeights`;
 * `serializeNnViz` always emits string form for round-trip stability — null
 * shorthand only on the parse side (mirror of block-math + block-jupyter pattern).
 */
export interface NnVizMdastJsxElement {
  readonly type: 'mdxJsxFlowElement';
  readonly name: string;
  readonly attributes: ReadonlyArray<{
    readonly type: 'mdxJsxAttribute';
    readonly name: string;
    readonly value: string | null;
  }>;
  readonly children: readonly unknown[];
}

export function serializeNnViz(node: NnVizTiptapNode): NnVizMdastJsxElement {
  const validated = nnVizCore.propsSchema.parse(node.attrs);
  return {
    type: 'mdxJsxFlowElement',
    name: nnVizCore.mdxComponent,
    attributes: [
      { type: 'mdxJsxAttribute', name: 'modelUrl', value: validated.modelUrl },
      { type: 'mdxJsxAttribute', name: 'layers', value: JSON.stringify(validated.layers) },
      { type: 'mdxJsxAttribute', name: 'showWeights', value: String(validated.showWeights) },
    ],
    children: [],
  };
}
