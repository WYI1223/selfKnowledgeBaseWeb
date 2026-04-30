import { describe, expect, it } from 'vitest';
import { renderMath } from '../ui-default/render-math';

/**
 * Byte-equality corpus for renderMath authority (ADR-0006 item #5).
 *
 * `renderMath` is the single import point for KaTeX in this package; both
 * Math.tsx (React/NodeView path) and Math.astro (SSR path) call it. This
 * suite exercises a representative input corpus to:
 *   1. catch silent regressions if a future edit re-inlines `katex.renderToString`
 *      with diverging options (drift detector for the algorithm-replication audit);
 *   2. assert error-explicit behavior — invalid LaTeX must surface as
 *      `.katex-error` in the output (spec D1 "red error box with the source
 *      visible"; not silent fallback).
 *
 * KaTeX is the runtime authority — these tests do NOT pin the exact HTML byte
 * shape (KaTeX patch versions can shift markup); they assert structural
 * invariants (root class, displayMode discriminator, error-class presence)
 * that any in-package option-divergence would break.
 */
describe('renderMath (KaTeX SSR authority)', () => {
  it('renders inline expression with displayMode=false (no display block)', () => {
    const html = renderMath('a^2 + b^2', false);
    expect(html).toMatch(/class="katex"/);
    expect(html).not.toMatch(/class="katex-display"/);
  });

  it('renders display expression with displayMode=true (wraps in katex-display)', () => {
    const html = renderMath('\\sum_{i=0}^n x_i', true);
    expect(html).toMatch(/class="katex-display"/);
    expect(html).toMatch(/class="katex"/);
  });

  it('renders multiline displayed expression (multi-row aligned env)', () => {
    const html = renderMath(
      '\\begin{aligned} a &= 1 \\\\ b &= 2 \\end{aligned}',
      true,
    );
    expect(html).toMatch(/class="katex-display"/);
    // multi-line rendering produces multiple mord/mrel spans
    expect(html).toMatch(/class="katex"/);
    expect(html.length).toBeGreaterThan(100);
  });

  it('renders malformed LaTeX with errorColor inline + source visible (throwOnError=false invariant)', () => {
    const html = renderMath('\\notARealCommand{x}', false);
    // KaTeX with throwOnError=false renders unknown commands inline with
    // errorColor (default #cc0000); source string is preserved verbatim so the
    // user can see the offending expression (spec D1 "red error box with the
    // source visible"). math.css uses [data-block='math'] [style*="cc0000"]
    // upgrade selector to bind --color-error token + bordered box.
    expect(html).toMatch(/class="katex"/);
    expect(html).toMatch(/notARealCommand/);
    expect(html).toMatch(/#cc0000/);
  });

  it('inline + display same expression produce different output (displayMode discriminator)', () => {
    const expr = '\\frac{1}{2}';
    const inlineHtml = renderMath(expr, false);
    const displayHtml = renderMath(expr, true);
    expect(inlineHtml).not.toBe(displayHtml);
    expect(displayHtml).toMatch(/class="katex-display"/);
    expect(inlineHtml).not.toMatch(/class="katex-display"/);
  });
});
