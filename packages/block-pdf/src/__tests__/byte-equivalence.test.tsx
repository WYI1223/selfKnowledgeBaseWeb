import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PdfRenderView } from '../ui-default/Pdf';
import { renderPdf } from '../ui-default/render-pdf';

/**
 * Byte-equivalence regression for ADR-0006 #5 (algorithm replication single
 * source). Pdf.tsx (React/NodeView path) and Pdf.astro (SSR path) MUST both
 * call `renderPdf(...)` and emit identical container + iframe markup.
 *
 * Two-tier verification strategy (Astro `.astro` files cannot be invoked
 * inside vitest without running the Astro compiler, so we mix runtime + AST
 * checks):
 *
 * 1. **Runtime SSR** of `PdfRenderView` via `react-dom/server.renderToStaticMarkup`.
 *    Asserts the React path renders exactly the descriptor produced by
 *    `renderPdf` — `data-block` / `data-page` / `data-searchable` attributes
 *    on the wrapper div + `<iframe src=… loading="lazy" title>`.
 * 2. **Static analysis** of `Pdf.astro` source: must `import { renderPdf } from
 *    './render-pdf'`, must invoke `renderPdf(`, must emit a `<div>` wrapper
 *    with the same three `desc.dataAttrs[…]` bindings, must emit an iframe
 *    using `desc.iframeSrc` + `loading="lazy"`. This is the structural
 *    equivalence guarantee the codex 5.5 R2-3 review asked for: even though we
 *    cannot literally byte-compare two HTML strings, drift in either file is
 *    detectable — runtime regression catches Pdf.tsx changes, AST regex
 *    catches Pdf.astro changes, and the shared `renderPdf` authority + its
 *    own ssr-render.test.ts corpus guarantees the underlying values match.
 *
 * What this does NOT verify (Wave 2 documented gap):
 *   - The compiled Astro output is byte-equal to the React SSR output. Astro
 *     adds its own scoped-style attributes, hydration directives, etc.; that
 *     comparison would require a full Astro toolchain in vitest. Wave 3
 *     mdx-doctor PR will run a `mdx-bridge` round-trip fixture for `<Pdf>` that
 *     exercises this end-to-end via the apps/site build, closing the gap from
 *     the consumer side.
 */

// __dirname-style path resolution. Vitest runs with cwd=packages/block-pdf/,
// so we anchor source paths relative to that. Avoids `import.meta.url` quirks
// under happy-dom (fileURLToPath rejects non-file: URLs in some test runners).
const PDF_ASTRO_PATH = resolve('src/ui-default/Pdf.astro');
const PDF_TSX_PATH = resolve('src/ui-default/Pdf.tsx');

describe('Pdf.tsx + Pdf.astro byte-equivalence (ADR-0006 #5)', () => {
  it('PdfRenderView SSR markup matches renderPdf descriptor verbatim', () => {
    const props = { src: '/files/paper.pdf', page: 7, searchable: true };
    const desc = renderPdf(props.src, props.page, props.searchable);
    const html = renderToStaticMarkup(<PdfRenderView props={props} />);

    expect(html).toContain(`data-block="${desc.dataAttrs['data-block']}"`);
    expect(html).toContain(`data-page="${desc.dataAttrs['data-page']}"`);
    expect(html).toContain(
      `data-searchable="${desc.dataAttrs['data-searchable']}"`,
    );
    expect(html).toContain(`src="${desc.iframeSrc}"`);
    expect(html).toContain('loading="lazy"');
    expect(html).toContain(`title="PDF: ${desc.src}"`);
  });

  it('PdfRenderView strips fragment from src in iframeSrc (R2-1 regression)', () => {
    const props = { src: 'doc.pdf#section=intro', page: 4, searchable: false };
    const html = renderToStaticMarkup(<PdfRenderView props={props} />);
    expect(html).toContain('src="doc.pdf#page=4"');
    expect(html).not.toContain('section=intro#page=');
  });

  it('Pdf.astro source imports renderPdf authority + uses descriptor bindings', () => {
    const astroSource = readFileSync(PDF_ASTRO_PATH, 'utf8');

    // Authority import is mandatory — no inline iframe URL construction.
    expect(astroSource).toMatch(/import\s+\{\s*renderPdf\s*\}\s+from\s+['"]\.\/render-pdf['"]/);
    expect(astroSource).toMatch(/renderPdf\s*\(/);

    // Wrapper container + three data-attr bindings (sister-doc to Pdf.tsx).
    expect(astroSource).toMatch(/data-block=\{?desc\.dataAttrs\['data-block'\]/);
    expect(astroSource).toMatch(/data-page=\{?desc\.dataAttrs\['data-page'\]/);
    expect(astroSource).toMatch(
      /data-searchable=\{?desc\.dataAttrs\['data-searchable'\]/,
    );

    // iframe uses the descriptor's iframeSrc (not raw src) + lazy loading.
    expect(astroSource).toMatch(/src=\{?desc\.iframeSrc\}?/);
    expect(astroSource).toMatch(/loading=['"]lazy['"]/);

    // Drift sentinel — the file must NOT have an inline `${src}#page=` template
    // literal that would bypass renderPdf authority.
    expect(astroSource).not.toMatch(/\$\{src\}#page=/);
    expect(astroSource).not.toMatch(/`\$\{[^}]+\}#page=/);
  });

  it('Pdf.tsx source imports renderPdf authority + uses descriptor bindings (sister sentinel)', () => {
    // Symmetric drift sentinel for the React side. ssr-render.test.ts already
    // exercises renderPdf directly; this one specifically locks down the
    // Pdf.tsx call site.
    const tsxSource = readFileSync(PDF_TSX_PATH, 'utf8');

    expect(tsxSource).toMatch(/import\s+\{\s*renderPdf\s*\}\s+from\s+['"]\.\/render-pdf['"]/);
    expect(tsxSource).toMatch(/renderPdf\s*\(/);
    expect(tsxSource).not.toMatch(/\$\{[^}]+\}#page=/);
  });
});
