import { pdfCore } from './core-definition';

/**
 * MDX 序列化 stub。完整实现等 Wave 3 mdx-bridge routing table 落地（RFC §5）：
 * mdx-bridge 拿到 TiptapNode{type:'pdf'} 时按 mdxComponent 字符串路由到本函数。
 *
 * Wave 2 阶段仅暴露稳定签名；mdx-bridge 还未引用此 export，所以 stub 抛错足够。
 */
export interface PdfTiptapNode {
  readonly type: 'pdf';
  readonly attrs: {
    readonly src: string;
    readonly page: number;
    readonly searchable: boolean;
  };
}

/**
 * `value` is `string | null` per mdast-util-mdx-jsx convention:
 *   - `<Pdf searchable>` (boolean shorthand) → attribute with `value: null`
 *   - `<Pdf searchable="true">` / `<Pdf searchable="false">` → string
 *   - `<Pdf src="...">` → string (always)
 *   - `<Pdf page="2">` → string (numeric coerced on parse)
 * `parsePdf` handles boolean shorthand for `searchable`; `serializePdf` always
 * emits string form (`String(boolean)` / `String(number)`) for round-trip
 * stability.
 */
export interface PdfMdastJsxElement {
  readonly type: 'mdxJsxFlowElement';
  readonly name: string;
  readonly attributes: ReadonlyArray<{
    readonly type: 'mdxJsxAttribute';
    readonly name: string;
    readonly value: string | null;
  }>;
  readonly children: readonly unknown[];
}

export function serializePdf(node: PdfTiptapNode): PdfMdastJsxElement {
  const validated = pdfCore.propsSchema.parse(node.attrs);
  return {
    type: 'mdxJsxFlowElement',
    name: pdfCore.mdxComponent,
    attributes: [
      { type: 'mdxJsxAttribute', name: 'src', value: validated.src },
      { type: 'mdxJsxAttribute', name: 'page', value: String(validated.page) },
      {
        type: 'mdxJsxAttribute',
        name: 'searchable',
        value: String(validated.searchable),
      },
    ],
    children: [],
  };
}
