import { pdfCore } from './core-definition';
import type { PdfMdastJsxElement, PdfTiptapNode } from './serialize';

/**
 * MDX 解析 stub。Wave 3 mdx-bridge 在 mdastBlockToTiptap 看到
 * mdxJsxFlowElement{name:'Pdf'} 时按 mdxComponent 路由到本函数（RFC §5）。
 *
 * `searchable` 三种 MDX 形式 (mdast-util-mdx-jsx convention):
 *   - `<Pdf searchable>` (boolean shorthand)        → attr.value === null  → true
 *   - `<Pdf searchable="true">`                     → attr.value === "true" → true
 *   - `<Pdf searchable="false">`                    → attr.value === "false"→ false
 * 任何其他形式（数字 / 非 true/false 字符串）throw — 不静默 false。
 *
 * `page` 字符串走 Number coerce → propsSchema.parse 校验 int.min(1)。非整数 / NaN
 * 由 zod 抛错，保持 explicit-error invariant。
 *
 * 其他 attr (如 src) 一律期望 string；null shorthand 仅 searchable 适用。
 */
export function parsePdf(node: PdfMdastJsxElement): PdfTiptapNode {
  if (node.name !== pdfCore.mdxComponent) {
    throw new Error(
      `parsePdf: expected mdxComponent="${pdfCore.mdxComponent}", got "${node.name}"`,
    );
  }
  const rawProps: Record<string, string | number | boolean> = {};
  for (const attr of node.attributes) {
    if (attr.name === 'searchable') {
      if (attr.value === null) {
        rawProps[attr.name] = true;
      } else if (attr.value === 'true' || attr.value === 'false') {
        rawProps[attr.name] = attr.value === 'true';
      } else {
        throw new Error(
          `parsePdf: invalid searchable attribute value: ${JSON.stringify(attr.value)}`,
        );
      }
    } else if (attr.name === 'page') {
      if (attr.value === null) {
        throw new Error(
          `parsePdf: attribute "page" must have a string value (got null shorthand; only "searchable" supports boolean shorthand)`,
        );
      }
      const numeric = Number(attr.value);
      if (!Number.isFinite(numeric)) {
        throw new Error(
          `parsePdf: page attribute must be a finite number, got ${JSON.stringify(attr.value)}`,
        );
      }
      rawProps[attr.name] = numeric;
    } else {
      if (attr.value === null) {
        throw new Error(
          `parsePdf: attribute "${attr.name}" must have a string value (got null shorthand; only "searchable" supports boolean shorthand)`,
        );
      }
      rawProps[attr.name] = attr.value;
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
