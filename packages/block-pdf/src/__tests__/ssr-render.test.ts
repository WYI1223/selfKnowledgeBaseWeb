import { describe, expect, it } from 'vitest';
import { renderPdf } from '../ui-default/render-pdf';

/**
 * Byte-equivalence corpus for renderPdf authority (ADR-0006 item #5).
 *
 * `renderPdf` is the single import point for iframe URL + data-attr
 * construction in this package; both Pdf.tsx (React/NodeView path) and
 * Pdf.astro (SSR path) call it. This suite exercises a representative input
 * corpus to:
 *   1. catch silent regressions if a future edit re-inlines the URL builder
 *      (drift detector for the algorithm-replication audit);
 *   2. assert PDF Open Parameters fragment shape (`#page=N`) — required for
 *      browser-native PDF viewer to honor initial page;
 *   3. cover the missing-file fallback path: even with a bogus `src`, the
 *      descriptor is structurally valid so the wrapper container + iframe
 *      shell render and the browser's native viewer surfaces its own
 *      empty-state UI.
 *
 * Browser-native PDF viewer is the runtime authority — these tests do NOT
 * pin the exact rendered PDF visuals (browsers diverge); they assert
 * structural invariants (iframeSrc fragment, data-attr shape, identity of
 * src round-trip).
 */
describe('renderPdf (iframe SSR authority)', () => {
  it('produces iframeSrc with #page=N fragment for default page=1', () => {
    const desc = renderPdf('/files/paper.pdf', 1, false);
    expect(desc.iframeSrc).toBe('/files/paper.pdf#page=1');
    expect(desc.dataAttrs['data-block']).toBe('pdf');
    expect(desc.dataAttrs['data-page']).toBe('1');
    expect(desc.dataAttrs['data-searchable']).toBe('false');
  });

  it('produces iframeSrc with #page=N for arbitrary page', () => {
    const desc = renderPdf('https://example.com/doc.pdf', 42, true);
    expect(desc.iframeSrc).toBe('https://example.com/doc.pdf#page=42');
    expect(desc.dataAttrs['data-page']).toBe('42');
    expect(desc.dataAttrs['data-searchable']).toBe('true');
  });

  it('preserves src verbatim (no encoding / normalization in render layer)', () => {
    // src normalization is propsSchema's job; renderPdf is downstream and must
    // not double-normalize. Test pinning string identity.
    const desc = renderPdf('/files/My Doc.pdf', 1, false);
    expect(desc.src).toBe('/files/My Doc.pdf');
    expect(desc.iframeSrc).toBe('/files/My Doc.pdf#page=1');
  });

  it('handles missing-file-style src (browser viewer surfaces its own empty state)', () => {
    // Even with bogus src, the descriptor is structurally valid — Pdf.tsx /
    // Pdf.astro both render an iframe shell + container; the browser's native
    // PDF viewer renders its own empty-doc UI on the inside. Wave 2 invariant:
    // never silent-fallback to alt text; always show the iframe shell so users
    // see the failure.
    const desc = renderPdf('/does-not-exist.pdf', 1, false);
    expect(desc.iframeSrc).toBe('/does-not-exist.pdf#page=1');
    expect(desc.dataAttrs['data-block']).toBe('pdf');
  });

  it('different page on same src produces different iframeSrc (page is part of URL fragment)', () => {
    const a = renderPdf('/files/paper.pdf', 1, false);
    const b = renderPdf('/files/paper.pdf', 5, false);
    expect(a.iframeSrc).not.toBe(b.iframeSrc);
    expect(a.dataAttrs['data-page']).toBe('1');
    expect(b.dataAttrs['data-page']).toBe('5');
  });

  it('strips pre-existing fragment from src before appending #page= (R2-1 hazard)', () => {
    // `src` may carry an external fragment (e.g. anchor in a publishing CMS:
    // "doc.pdf#section=intro"). PDF Open Parameters URLs are not mergeable —
    // only one `#…` segment per URL, and `page=N` must be authoritative for
    // the chosen page. Anything else would yield `doc.pdf#section=intro#page=3`
    // which the browser parses as fragment="section=intro#page=3" and ignores
    // the page= directive entirely.
    const desc = renderPdf('doc.pdf#section=intro', 3, false);
    expect(desc.iframeSrc).toBe('doc.pdf#page=3');
    expect(desc.src).toBe('doc.pdf#section=intro'); // src verbatim per contract
  });

  it('handles src with empty fragment ("foo.pdf#") cleanly', () => {
    const desc = renderPdf('foo.pdf#', 1, false);
    expect(desc.iframeSrc).toBe('foo.pdf#page=1');
  });
});
