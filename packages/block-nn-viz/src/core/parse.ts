import { evalAttrExpression } from '@skb/block-foundation';
import { nnVizCore } from './core-definition';
import type { LayerSpec, NnVizMdastJsxElement, NnVizTiptapNode } from './serialize';

/**
 * MDX 解析。mdx-bridge 在 mdastBlockToTiptap 看到
 * mdxJsxFlowElement{name:'NnViz'} 时按 mdxComponent 路由到本函数（RFC §5）。
 *
 * Attribute value extraction goes through `evalAttrExpression` (post Wave 6
 * carry-forward #16 2026-05-08): each attr resolves to string | null | static
 * JS literal (Literal / TemplateLiteral / ArrayExpression / ObjectExpression).
 *
 * `showWeights` accepts: null shorthand → true; "true"/"false" string →
 * boolean; or expression `{true}` / `{false}`.
 *
 * `layers` accepts: a LayerSpec[] (JS literal `[{...}, ...]` via expression)
 * OR a JSON-encoded string `'[{...}]'` (legacy round-trip path that
 * `serializeNnViz` still emits for byte-stability).
 *
 * `modelUrl` and other attrs require a string value.
 */
export function parseNnViz(node: NnVizMdastJsxElement): NnVizTiptapNode {
  if (node.name !== nnVizCore.mdxComponent) {
    throw new Error(
      `parseNnViz: expected mdxComponent="${nnVizCore.mdxComponent}", got "${node.name}"`,
    );
  }
  const rawProps: Record<string, string | boolean | LayerSpec[]> = {};
  for (const attr of node.attributes) {
    const v = evalAttrExpression(attr.value);
    if (attr.name === 'showWeights') {
      if (v === null) {
        rawProps[attr.name] = true;
      } else if (typeof v === 'boolean') {
        rawProps[attr.name] = v;
      } else if (v === 'true' || v === 'false') {
        rawProps[attr.name] = v === 'true';
      } else {
        throw new Error(
          `parseNnViz: invalid showWeights attribute value: ${JSON.stringify(v)}`,
        );
      }
    } else if (attr.name === 'layers') {
      if (v === null) {
        throw new Error(
          'parseNnViz: attribute "layers" must have a value (got null shorthand; only boolean attrs support shorthand)',
        );
      }
      let parsed: unknown;
      if (Array.isArray(v)) {
        parsed = v;
      } else if (typeof v === 'string') {
        try {
          parsed = JSON.parse(v);
        } catch {
          throw new Error(
            `parseNnViz: layers attribute is not valid JSON: ${JSON.stringify(v)}`,
          );
        }
      } else {
        throw new Error(
          `parseNnViz: layers must be an array or JSON string; got ${typeof v}`,
        );
      }
      if (!Array.isArray(parsed)) {
        throw new Error(
          `parseNnViz: layers must decode to an array; got ${JSON.stringify(parsed)}`,
        );
      }
      rawProps[attr.name] = parsed as LayerSpec[];
    } else {
      if (v === null) {
        throw new Error(
          `parseNnViz: attribute "${attr.name}" must have a string value (got null shorthand; only boolean attrs support shorthand)`,
        );
      }
      if (typeof v !== 'string') {
        throw new Error(
          `parseNnViz: attribute "${attr.name}" must be a string, got ${typeof v}`,
        );
      }
      rawProps[attr.name] = v;
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
