import katex from 'katex';

/**
 * Single authority for KaTeX rendering across this package (ADR-0006 item #5).
 * Math.tsx (React/NodeView path) and Math.astro (SSR path) MUST both import
 * `renderMath` from here — never inline `katex.renderToString` with their own
 * options literal. The byte-equivalence between editor / SSR / NodeView output
 * follows from this single import. ssr-render.test.ts exercises a corpus to
 * detect drift if a future edit accidentally re-inlines the call.
 *
 * Options policy:
 * - `displayMode`: caller-controlled (inline vs block).
 * - `throwOnError: false`: KaTeX renders invalid LaTeX as `.katex-error` red box;
 *   error-explicit (math.css binds `.katex-error` to `--color-error` token).
 * - `output: 'html'`: HTML-only (no MathML); SSR + React DOM both consume HTML
 *   string. Matches Math.astro's `set:html` path.
 * - `strict: 'ignore'`: KaTeX warnings (deprecated commands, unicode chars) do
 *   not throw; consistent with `throwOnError: false`.
 */
export const renderMath = (expression: string, display: boolean): string =>
  katex.renderToString(expression, {
    displayMode: display,
    throwOnError: false,
    output: 'html',
    strict: 'ignore',
  });
