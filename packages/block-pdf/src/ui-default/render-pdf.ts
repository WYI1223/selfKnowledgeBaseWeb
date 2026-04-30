/**
 * Single authority for PDF rendering across this package (ADR-0006 item #5).
 * Pdf.tsx (React/NodeView path) and Pdf.astro (SSR path) MUST both import
 * `renderPdf` from here — never inline iframe `src` construction or container
 * markup with their own logic. ssr-render.test.ts exercises a corpus to detect
 * drift if a future edit accidentally re-inlines the URL builder.
 *
 * Why iframe (not react-pdf) for both paths:
 * - Browser-native PDF viewer is the runtime authority (no in-package canvas
 *   rasterizer). All major browsers handle `application/pdf` via embedded
 *   viewer; the `#page=N` fragment is part of the
 *   [PDF Open Parameters](https://opensource.adobe.com/dc-acrobat-sdk-docs/library/pdfsdk/pdfopenparams.html)
 *   convention recognized by Chrome/Edge/Firefox/Safari.
 * - Astro SSR cannot run react-pdf (it requires a browser worker thread +
 *   canvas APIs). Iframe yields byte-equivalent SSR + client output, satisfying
 *   the D1 single-source invariant pattern.
 * - Failure mode is graceful: missing/inaccessible `src` shows the browser's
 *   own empty-doc UI; the wrapper container retains a stable shell + bordered
 *   viewport via design-token CSS for the empty-state error path.
 *
 * Output shape contract:
 * - `src`: original `propsSchema.src` (URL or path) verbatim
 * - `page`: validated 1-based int (propsSchema floor = 1)
 * - `searchable`: build-time hint (Wave 3 search-index integration); runtime
 *   no-op in Wave 2
 * - `iframeSrc`: `${baseSrc}#page=${page}` — PDF Open Parameters fragment.
 *   Any pre-existing `#fragment` on `src` is dropped before appending, so
 *   `<Pdf src="doc.pdf#section=intro" page={3} />` yields `doc.pdf#page=3`
 *   (PDF Open Parameters fragments are not mergeable — only one `#…` per URL,
 *   and `page=` must be authoritative for the chosen page).
 * - `dataAttrs`: stable `data-*` attribute map for Tag wrapper, used by
 *   pdf.css selectors. Keys are kebab-case strings ready for set:html /
 *   spread.
 */
export interface PdfRenderDescriptor {
  readonly src: string;
  readonly page: number;
  readonly searchable: boolean;
  readonly iframeSrc: string;
  readonly dataAttrs: {
    readonly 'data-block': 'pdf';
    readonly 'data-page': string;
    readonly 'data-searchable': string;
  };
}

function buildIframeSrc(src: string, page: number): string {
  // String.split('#')[0] returns src verbatim when no '#' is present; strips
  // any pre-existing fragment otherwise. Authoritative per the Output shape
  // contract above.
  const [base = ''] = src.split('#');
  return `${base}#page=${page}`;
}

export const renderPdf = (
  src: string,
  page: number,
  searchable: boolean,
): PdfRenderDescriptor => ({
  src,
  page,
  searchable,
  iframeSrc: buildIframeSrc(src, page),
  dataAttrs: {
    'data-block': 'pdf',
    'data-page': String(page),
    'data-searchable': String(searchable),
  },
});
