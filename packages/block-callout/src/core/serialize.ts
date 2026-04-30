import { calloutCore } from './core-definition';

/**
 * MDX 序列化 stub。完整实现等 Wave 3 mdx-bridge routing table 落地（RFC §5）：
 * mdx-bridge 拿到 TiptapNode{type:'callout'} 时按 mdxComponent 字符串路由到本函数。
 *
 * Wave 2 阶段仅暴露稳定签名；mdx-bridge 还未引用此 export，所以 stub 抛错足够。
 */
export interface CalloutTiptapNode {
  readonly type: 'callout';
  readonly attrs: { readonly variant: string; readonly title?: string };
  readonly content?: readonly unknown[];
}

export interface CalloutMdastJsxElement {
  readonly type: 'mdxJsxFlowElement';
  readonly name: string;
  readonly attributes: ReadonlyArray<{
    readonly type: 'mdxJsxAttribute';
    readonly name: string;
    readonly value: string;
  }>;
  readonly children: readonly unknown[];
}

export function serializeCallout(node: CalloutTiptapNode): CalloutMdastJsxElement {
  const validated = calloutCore.propsSchema.parse(node.attrs);
  const attributes: CalloutMdastJsxElement['attributes'] = [
    { type: 'mdxJsxAttribute', name: 'variant', value: validated.variant },
    ...(validated.title !== undefined
      ? [{ type: 'mdxJsxAttribute' as const, name: 'title', value: validated.title }]
      : []),
  ];
  return {
    type: 'mdxJsxFlowElement',
    name: calloutCore.mdxComponent,
    attributes,
    children: node.content ?? [],
  };
}
