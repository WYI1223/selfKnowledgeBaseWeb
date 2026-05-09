import { evalAttrExpression } from '@skb/block-foundation';
import { pdfCore } from './core-definition';
import type { PdfMdastJsxElement, PdfTiptapNode } from './serialize';

/**
 * MDX 解析。mdx-bridge 在 mdastBlockToTiptap 看到
 * mdxJsxFlowElement{name:'Pdf'} 时按 mdxComponent 路由到本函数（RFC §5）。
 *
 * Attribute value extraction goes through `evalAttrExpression` (post Wave 6
 * carry-forward #16 2026-05-08), so each attr resolves to one of:
 *   - string | null  — for quoted/shorthand forms
 *   - the static JS literal — for `<Pdf page={1} />` JSX expression form
 *     (Literal / TemplateLiteral / ArrayExpression / ObjectExpression /
 *     unary ± numeric).
 *
 * `searchable` accepts: null shorthand → true; "true" / "false" string →
 * boolean; or expression form `{true}` / `{false}`.
 *
 * `page` accepts: numeric string → Number(); or expression form `{1}` →
 * direct number; final value validated by zod's `.int().min(1)`.
 *
 * Other attrs (e.g. `src`) require a string value; null shorthand throws.
 */
export function parsePdf(node: PdfMdastJsxElement): PdfTiptapNode {
  if (node.name !== pdfCore.mdxComponent) {
    throw new Error(
      `parsePdf: expected mdxComponent="${pdfCore.mdxComponent}", got "${node.name}"`,
    );
  }
  const rawProps: Record<string, string | number | boolean> = {};
  for (const attr of node.attributes) {
    const v = evalAttrExpression(attr.value);
    if (attr.name === 'searchable') {
      if (v === null) {
        rawProps[attr.name] = true;
      } else if (typeof v === 'boolean') {
        rawProps[attr.name] = v;
      } else if (v === 'true' || v === 'false') {
        rawProps[attr.name] = v === 'true';
      } else {
        throw new Error(
          `parsePdf: invalid searchable attribute value: ${JSON.stringify(v)}`,
        );
      }
    } else if (attr.name === 'page') {
      if (v === null) {
        throw new Error(
          `parsePdf: attribute "page" must have a value (got null shorthand; only "searchable" supports boolean shorthand)`,
        );
      }
      const numeric = typeof v === 'number' ? v : Number(v);
      if (!Number.isFinite(numeric)) {
        throw new Error(
          `parsePdf: page attribute must be a finite number, got ${JSON.stringify(v)}`,
        );
      }
      rawProps[attr.name] = numeric;
    } else {
      if (v === null) {
        throw new Error(
          `parsePdf: attribute "${attr.name}" must have a string value (got null shorthand; only "searchable" supports boolean shorthand)`,
        );
      }
      if (typeof v !== 'string') {
        throw new Error(
          `parsePdf: attribute "${attr.name}" must be a string, got ${typeof v}`,
        );
      }
      rawProps[attr.name] = v;
    }
  }
  const validated = pdfCore.propsSchema.parse(rawProps);
  return {
    type: 'pdf',
    attrs: {
      src: validated.src,
      page: validated.page,
      searchable: validated.searchable,
    },
  };
}
