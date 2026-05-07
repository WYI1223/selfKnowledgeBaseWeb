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
    // full grid width so unstyled prose stays readable until C.2-4 lands
    // per-block grid attrs. Per-block `style.gridColumn` overrides via
    // specificity. Also: grid-auto-rows must use `minmax(var(--row-h), auto)`
    // so content height drives row height (NOT clamped to 48px).
    expect(gridCss).toContain('.skb-grid > *:not([style*="grid-column"])');
    expect(gridCss).toMatch(/grid-column:\s*1\s*\/\s*-1/);
    expect(gridCss).toMatch(/grid-auto-rows:\s*minmax\(var\(--row-h\),\s*auto\)/);
  });
});

describe('Astro grid integration', () => {
  it('imports grid.css without removing global.css', () => {
    expect(baseLayout).toContain("import '../styles/global.css'");
    expect(baseLayout).toContain("import '../styles/grid.css'");
  });

  it('wraps MDX content while keeping the title outside the grid', () => {
    const wrapperIndex = notesRoute.indexOf('<div class="skb-grid">');
    const proseIndex = notesRoute.indexOf('<div class="skb-prose">');
    const contentIndex = notesRoute.indexOf('<Content components={componentsMap} />');
    expect(wrapperIndex).toBeGreaterThanOrEqual(0);
    expect(proseIndex).toBeGreaterThan(wrapperIndex);
    expect(contentIndex).toBeGreaterThan(proseIndex);
    expect(notesRoute.indexOf('{note.data.title}')).toBeLessThan(wrapperIndex);
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
