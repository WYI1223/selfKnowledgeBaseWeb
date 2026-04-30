import type { BlockViewProps } from '@skb/block-foundation';
import { pdfCore } from '../core/core-definition';
import { renderPdf } from './render-pdf';

/**
 * PdfView 接受 inferred props ({ src, page, searchable }) — 与
 * `pdfCore.propsSchema` 的 ZodInfer 等价。函数式组件而非
 * `ComponentType<BlockViewProps<typeof ...>>` 显式标注，避免 generic 变 invariant
 * 在 BlockRegistry.registerUI 处与 ZodTypeAny widening 冲突（exactOptionalPropertyTypes 触发）。
 *
 * iframe 渲染走 `./render-pdf.ts` 单一权威，与 Pdf.astro SSR path 同源
 * （ADR-0006 item #5 algorithm replication）。浏览器原生 PDF viewer 是 runtime
 * authority；空 src 由 Pdf.astro 的 fallback box 处理（在 Astro layer，因
 * propsSchema.src.min(1) 已先 throw 在 build 前）。
 *
 * `searchable: true` 是 Wave 3 build-time search-index 提示
 * （consumer = scripts/extract-pdf-text.ts），runtime no-op。
 */
export function PdfView({
  props,
}: BlockViewProps<typeof pdfCore.propsSchema>): JSX.Element {
  const desc = renderPdf(props.src, props.page, props.searchable);
  return (
    <div
      data-block={desc.dataAttrs['data-block']}
      data-page={desc.dataAttrs['data-page']}
      data-searchable={desc.dataAttrs['data-searchable']}
    >
      <iframe
        src={desc.iframeSrc}
        title={`PDF: ${desc.src}`}
        loading="lazy"
      />
    </div>
  );
}

export const PdfEditorView = PdfView;
export const PdfRenderView = PdfView;
