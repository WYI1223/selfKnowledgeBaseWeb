import type { MdastJsxAttributeValue } from '@skb/block-foundation';
import { imageCore } from './core-definition';

/**
 * MDX 序列化 stub。完整实现等 Wave 3 mdx-bridge routing table 落地（RFC §5）：
 * mdx-bridge 拿到 TiptapNode{type:'image'} 时按 mdxComponent 字符串路由到本函数。
 *
 * Wave 2 阶段仅暴露稳定签名；mdx-bridge 还未引用此 export，所以 stub 抛错足够。
 */
export interface ImageTiptapNode {
  readonly type: 'image';
  readonly attrs: {
    readonly src: string;
    readonly alt: string;
    readonly width?: number;
    readonly height?: number;
  };
  readonly content?: readonly unknown[];
}

export interface ImageMdastJsxElement {
  readonly type: 'mdxJsxFlowElement';
  readonly name: string;
  readonly attributes: ReadonlyArray<{
    readonly type: 'mdxJsxAttribute';
    readonly name: string;
    readonly value: MdastJsxAttributeValue;
  }>;
  readonly children: readonly unknown[];
}

export function serializeImage(node: ImageTiptapNode): ImageMdastJsxElement {
  const validated = imageCore.propsSchema.parse(node.attrs);
  const attributes: ImageMdastJsxElement['attributes'] = [
    { type: 'mdxJsxAttribute', name: 'src', value: validated.src },
    { type: 'mdxJsxAttribute', name: 'alt', value: validated.alt },
    ...(validated.width !== undefined
      ? [
          {
            type: 'mdxJsxAttribute' as const,
            name: 'width',
            value: String(validated.width),
          },
        ]
      : []),
    ...(validated.height !== undefined
      ? [
          {
            type: 'mdxJsxAttribute' as const,
            name: 'height',
            value: String(validated.height),
          },
        ]
      : []),
  ];
  return {
    type: 'mdxJsxFlowElement',
    name: imageCore.mdxComponent,
    attributes,
    children: node.content ?? [],
  };
}
