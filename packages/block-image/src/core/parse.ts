import { imageCore } from './core-definition';
import type { ImageMdastJsxElement, ImageTiptapNode } from './serialize';

/**
 * MDX 解析 stub。Wave 3 mdx-bridge 在 mdastBlockToTiptap 看到
 * mdxJsxFlowElement{name:'Image'} 时按 mdxComponent 路由到本函数（RFC §5）。
 *
 * 当前 stub: 把 attributes 数组取回成 props 对象，propsSchema.parse 校验后构造
 * Tiptap node。children 透传，留 mdx-bridge 后续递归解析为 inline TiptapNode[].
 */
export function parseImage(node: ImageMdastJsxElement): ImageTiptapNode {
  if (node.name !== imageCore.mdxComponent) {
    throw new Error(
      `parseImage: expected mdxComponent="${imageCore.mdxComponent}", got "${node.name}"`,
    );
  }
  const rawProps: Record<string, string | number> = {};
  for (const attr of node.attributes) {
    if (attr.name === 'width' || attr.name === 'height') {
      rawProps[attr.name] = Number(attr.value);
    } else {
      rawProps[attr.name] = attr.value;
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
