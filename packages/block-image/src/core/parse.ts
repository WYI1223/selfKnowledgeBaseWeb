import { evalAttrExpression } from '@skb/block-foundation';
import { imageCore } from './core-definition';
import type { ImageMdastJsxElement, ImageTiptapNode } from './serialize';

/**
 * MDX 解析。mdx-bridge 在 mdastBlockToTiptap 看到
 * mdxJsxFlowElement{name:'Image'} 时按 mdxComponent 路由到本函数（RFC §5）。
 *
 * Attribute value extraction goes through `evalAttrExpression` (post Wave 6
 * carry-forward #16 2026-05-08): `width={320}` / `height={180}` resolve to
 * numbers via the Literal walk path; string-form `width="320"` continues to
 * Number-coerce.
 */
export function parseImage(node: ImageMdastJsxElement): ImageTiptapNode {
  if (node.name !== imageCore.mdxComponent) {
    throw new Error(
      `parseImage: expected mdxComponent="${imageCore.mdxComponent}", got "${node.name}"`,
    );
  }
  const rawProps: Record<string, string | number> = {};
  for (const attr of node.attributes) {
    const v = evalAttrExpression(attr.value);
    if (attr.name === 'width' || attr.name === 'height') {
      if (v === null) {
        throw new Error(
          `parseImage: attribute "${attr.name}" must have a value (got null shorthand)`,
        );
      }
      const numeric = typeof v === 'number' ? v : Number(v);
      if (!Number.isFinite(numeric)) {
        throw new Error(
          `parseImage: attribute "${attr.name}" must be a finite number, got ${JSON.stringify(v)}`,
        );
      }
      rawProps[attr.name] = numeric;
    } else {
      if (v === null) {
        throw new Error(
          `parseImage: attribute "${attr.name}" must have a value (got null shorthand)`,
        );
      }
      if (typeof v !== 'string') {
        throw new Error(
          `parseImage: attribute "${attr.name}" must be a string, got ${typeof v}`,
        );
      }
      rawProps[attr.name] = v;
    }
  }
  const validated = imageCore.propsSchema.parse(rawProps);
  const attrs: ImageTiptapNode['attrs'] = {
    src: validated.src,
    alt: validated.alt,
    ...(validated.width !== undefined ? { width: validated.width } : {}),
    ...(validated.height !== undefined ? { height: validated.height } : {}),
  };
  return {
    type: 'image',
    attrs,
    content: node.children,
  };
}
