import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));

function readOptionalSource(relativePath: string): string {
  try {
    return readFileSync(resolve(here, relativePath), 'utf8');
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') return '';
    throw error;
  }
}

function fromMarker(source: string, marker: string): string {
  const index = source.indexOf(marker);
  return index < 0 ? '' : source.slice(index);
}

const gridCss = readOptionalSource('../styles/grid.css');
const baseLayout = readOptionalSource('../layouts/BaseLayout.astro');
const notesRoute = readOptionalSource('../pages/notes/[...slug].astro');
const siteContract = readOptionalSource('../../CONTRACT.md');

describe('grid.css contract', () => {
  it('declares the desktop grid container with design-tokens-sourced row/gap + scoped --total-cols', () => {
    const gridStart = gridCss.indexOf('.skb-grid {');
    expect(gridCss).toContain('.skb-grid {');
    expect(gridCss).toContain('display: grid');
    expect(gridCss).toContain('grid-template-columns: repeat(12, minmax(0, 1fr))');
    expect(gridCss).toContain('grid-auto-rows: minmax(var(--row-h), auto)');
    expect(gridCss).toContain('gap: var(--gap)');
    // Stage C.3-1 token unification: --row-h / --gap are now sourced from
    // @skb/design-tokens :root cascade; grid.css MUST NOT redefine them locally.
    expect(gridCss).not.toMatch(/--row-h:\s*48px/);
    expect(gridCss).not.toMatch(/--gap:\s*14px/);
    // --total-cols is grid.css-local (different per breakpoint); MUST stay scoped.
    expect(gridCss.indexOf('--total-cols: 12')).toBeGreaterThan(gridStart);
  });

  it('declares tablet, mobile, and reduced-motion media rules', () => {
    const tablet = fromMarker(gridCss, '@media (max-width: 1024px)');
    const mobile = fromMarker(gridCss, '@media (max-width: 768px)');
    const motion = fromMarker(gridCss, '@media (prefers-reduced-motion: reduce)');
    expect(gridCss).toMatch(/^@media\s*\(\s*max-width:\s*1024px\s*\)/m);
    expect(tablet).toContain('grid-template-columns: repeat(6, minmax(0, 1fr))');
    expect(tablet).toContain('--total-cols: 6');
    expect(gridCss).toMatch(/^@media\s*\(\s*max-width:\s*768px\s*\)/m);
    expect(mobile).toContain('grid-template-columns: 1fr');
    expect(mobile).toContain('.skb-grid > *');
    expect(mobile).toContain('grid-column: 1');
    expect(gridCss).toContain('prefers-reduced-motion: reduce');
    expect(motion).toContain('transition: none');
  });

  it('uses row auto-flow without dense packing', () => {
    expect(gridCss).toContain('grid-auto-flow: row');
    expect(gridCss).not.toContain('grid-auto-flow: dense');
    expect(gridCss).not.toMatch(/\bdense\b/);
  });

  it('emits transitional full-width fallback for unpositioned children', () => {
    // C.2-3 transitional: MDX children without explicit gridColumn span the
    // full grid width so unstyled prose stays readable. Per-block
    // `style.gridColumn` overrides via specificity. cf-20b extends this
    // fallback to the inner `.ProseMirror` grid as well so prose nodes
    // (`<p>`, `<h2>`, `<ul>`) inside the editor get full-width by default.
    // Also: grid-auto-rows must use `minmax(var(--row-h), auto)` so content
    // height drives row height (NOT clamped to 48px).
    expect(gridCss).toContain('.skb-grid > *:not([style*="grid-column"])');
    expect(gridCss).toContain('.skb-grid .ProseMirror > *:not([style*="grid-column"])');
    expect(gridCss).toMatch(/grid-column:\s*1\s*\/\s*-1/);
    expect(gridCss).toMatch(/grid-auto-rows:\s*minmax\(var\(--row-h\),\s*auto\)/);
  });

  it('cf-20b: declares the editor-surface two-level grid (ADR-0016 v0.2 D11.1)', () => {
    // The intermediate `.skb-editor-content` div MUST span `grid-column: 1 / -1`
    // so the inner `.ProseMirror` element inherits the full outer grid width.
    expect(gridCss).toContain('.skb-grid > .skb-editor-content');
    // The inner `.ProseMirror` element MUST be itself a 12-col grid so
    // per-block NodeView wrappers `.skb-block-nodeview` (Tiptap's direct
    // children) become grid items at the correct DOM depth.
    expect(gridCss).toContain('.skb-grid .ProseMirror');
    // The inner grid uses the same template + flow rules as the outer
    // (single source of truth on grid model is at the v2 contract +
    // design-tokens; cf-20b mirrors the outer rule onto the editor).
    const proseMirrorBlock = gridCss.slice(
      gridCss.indexOf('.skb-grid .ProseMirror'),
    );
    expect(proseMirrorBlock).toContain('display: grid');
    expect(proseMirrorBlock).toContain('grid-template-columns: repeat(12, minmax(0, 1fr))');
    expect(proseMirrorBlock).toContain('grid-auto-flow: row');
    expect(proseMirrorBlock).not.toContain('grid-auto-flow: dense');
  });
});

describe('Astro grid integration', () => {
  it('imports grid.css without removing global.css', () => {
    expect(baseLayout).toContain("import '../styles/global.css'");
    expect(baseLayout).toContain("import '../styles/grid.css'");
  });

  it('wraps MDX content in a combined .skb-grid.skb-prose container so MDX children are direct grid items (cf-20b R2)', () => {
    // Wave 6 cf-20b R2 (2026-05-09) — pre-R2 the route used two
    // nested wrappers `<div class="skb-grid"><div class="skb-prose">
    // <Content/></div></div>` which made `.skb-block-static` a
    // GRANDCHILD of `.skb-grid` (not a real grid item; inline
    // `gridColumn` style was inert). codex-pr-reviewer-55 R2 caught
    // this. R2 fix combines the two wrappers onto a single element
    // so MDX-emitted children become direct grid items.
    const wrapperIndex = notesRoute.indexOf('<div class="skb-grid skb-prose">');
    const contentIndex = notesRoute.indexOf('<Content components={componentsMap} />');
    expect(
      wrapperIndex,
      'notes/[...slug].astro must combine .skb-grid + .skb-prose on a single element so MDX children are real grid items',
    ).toBeGreaterThanOrEqual(0);
    expect(contentIndex).toBeGreaterThan(wrapperIndex);
    expect(notesRoute.indexOf('{note.data.title}')).toBeLessThan(wrapperIndex);
    // Pre-R2 separate `<div class="skb-prose">` wrapper is gone.
    expect(
      notesRoute,
      'pre-R2 separate `<div class="skb-prose">` wrapper must be removed (combined into `.skb-grid skb-prose` per cf-20b R2)',
    ).not.toContain('<div class="skb-prose">');
  });
});

describe('CONTRACT.md grid section', () => {
  const gridSection = fromMarker(siteContract, '## Grid layout (Wave 5)');

  it('documents the Wave 5 selector and W5-1 forward-pointer', () => {
    expect(siteContract).toMatch(/^## Grid layout \(Wave 5\)/m);
    expect(gridSection).toContain('.skb-grid');
    expect(gridSection).toContain('W5-1');
    expect(gridSection).toContain('block-foundation/CONTRACT.md');
  });

  it('documents the 12/6/1 breakpoints and deferred style emission', () => {
    expect(gridSection).toContain('1024px');
    expect(gridSection).toContain('768px');
    expect(gridSection).toMatch(/\b12\b/);
    expect(gridSection).toMatch(/\b6\b/);
    expect(gridSection).toMatch(/\b1\b/);
    expect(gridSection).toContain('gridColumn');
    expect(gridSection).toContain('gridRow');
  });
});
