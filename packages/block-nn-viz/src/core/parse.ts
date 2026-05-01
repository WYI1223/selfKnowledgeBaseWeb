import { nnVizCore } from './core-definition';
import type { LayerSpec, NnVizMdastJsxElement, NnVizTiptapNode } from './serialize';

/**
 * MDX 解析 stub。Wave 3 mdx-bridge 在 mdastBlockToTiptap 看到
 * mdxJsxFlowElement{name:'NnViz'} 时按 mdxComponent 路由到本函数（RFC §5）。
 *
 * Boolean attrs (`showWeights`) 三种 MDX 形式
 * (mdast-util-mdx-jsx convention)：
 *   - `<NnViz showWeights>` (boolean shorthand)   → attr.value === null  → true
 *   - `<NnViz showWeights="true">`                → "true"  → true
 *   - `<NnViz showWeights="false">`               → "false" → false
 * 任何其他形式 throw — 不静默 false。
 *
 * `layers` 在 Wave 2 stub 中按 string-encoded JSON array 解析（serialize
 * emits JSON.stringify）。Wave 3 mdx-bridge 接 expression-attr 后改为直接
 * 接受 array literal 表达式；这层 stub 仅保证 round-trip 形状对齐。
 *
 * `modelUrl` 一律期望 string；null shorthand 仅 boolean attrs 适用。
 */
export function parseNnViz(node: NnVizMdastJsxElement): NnVizTiptapNode {
  if (node.name !== nnVizCore.mdxComponent) {
    throw new Error(
      `parseNnViz: expected mdxComponent="${nnVizCore.mdxComponent}", got "${node.name}"`,
    );
  }
  const rawProps: Record<string, string | boolean | LayerSpec[]> = {};
  for (const attr of node.attributes) {
    if (attr.name === 'showWeights') {
      if (attr.value === null) {
        rawProps[attr.name] = true;
      } else if (attr.value === 'true' || attr.value === 'false') {
        rawProps[attr.name] = attr.value === 'true';
      } else {
        throw new Error(
          `parseNnViz: invalid showWeights attribute value: ${JSON.stringify(attr.value)}`,
        );
      }
    } else if (attr.name === 'layers') {
      if (attr.value === null) {
        throw new Error(
          'parseNnViz: attribute "layers" must have a string value (got null shorthand; only boolean attrs support shorthand)',
        );
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(attr.value);
      } catch {
        throw new Error(
          `parseNnViz: layers attribute is not valid JSON: ${JSON.stringify(attr.value)}`,
        );
      }
      if (!Array.isArray(parsed)) {
        throw new Error(
          `parseNnViz: layers must decode to an array; got ${JSON.stringify(parsed)}`,
        );
      }
      rawProps[attr.name] = parsed as LayerSpec[];
    } else {
      if (attr.value === null) {
        throw new Error(
          `parseNnViz: attribute "${attr.name}" must have a string value (got null shorthand; only boolean attrs support shorthand)`,
        );
      }
      rawProps[attr.name] = attr.value;
    }
  }
  const validated = nnVizCore.propsSchema.parse(rawProps);
  return {
    type: 'nn-viz',
    attrs: {
      modelUrl: validated.modelUrl,
      layers: validated.layers,
      showWeights: validated.showWeights,
    },
  };
}
