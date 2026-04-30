import { describe, expect, it } from 'vitest';
import { pdfCore } from '../core/core-definition';
import {
  pdfUiDefault,
  PdfEditorView,
  PdfRenderView,
  renderPdf,
  PDF_TOKENS,
} from '../ui-default';

/**
 * UI-default surface contract tests. Mirrors block-math/__tests__/ui-default.test.ts
 * shape contract (sister-doc invariant per ADR-0006 item #6). Stays in `.ts`
 * because PdfView is a thin iframe-wrapping component; full DOM-render
 * assertions live indirectly via ssr-render.test.ts (the underlying renderPdf
 * is the structural authority). When apps/site or editor-shell adds
 * DOM-assertion tests they will live alongside in their own happy-dom-enabled
 * vitest configs.
 */
describe('pdfUiDefault registration shape', () => {
  it('exposes the BlockUIDefinition shape with coreName + uiId="default"', () => {
    expect(pdfUiDefault.coreName).toBe(pdfCore.name);
    expect(pdfUiDefault.coreName).toBe('pdf');
    expect(pdfUiDefault.uiId).toBe('default');
  });

  it('EditorView and RenderView identity matches Pdf.tsx exports', () => {
    expect(pdfUiDefault.EditorView).toBe(PdfEditorView);
    expect(pdfUiDefault.RenderView).toBe(PdfRenderView);
  });

  it('re-exports renderPdf as the single authority callable from ./ui-default', () => {
    // structural identity check — barrel must re-export from render-pdf.ts so
    // consumers (Pdf.astro / future NodeView wrappers / sample-blocks) all
    // hit the same authority
    expect(typeof renderPdf).toBe('function');
    const desc = renderPdf('/p.pdf', 1, false);
    expect(desc.iframeSrc).toBe('/p.pdf#page=1');
  });

  it('exposes PDF_TOKENS witness for design-token surface bindings', () => {
    expect(PDF_TOKENS.borderToken).toBe('border');
    expect(PDF_TOKENS.bgToken).toBe('surface1');
    expect(PDF_TOKENS.errorToken).toBe('error');
    expect(PDF_TOKENS.gutterToken).toBe('4');
  });
});
