import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

/**
 * Wave 6 cf-20b (2026-05-09) — editor-surface grid lock per ADR-0016
 * v0.2 D11.1 amendment.
 *
 * Three layers of grid integration must be locked:
 *
 *  (a) Outer `.skb-grid` (the apps/site wrapper from
 *      `apps/site/src/pages/notes/[...slug].astro` for the read route
 *      AND the editor `<GridContainer>` from
 *      `@skb/editor-shell/src/grid-container.tsx` for the edit route)
 *      is `display: grid; grid-template-columns: repeat(12, ...);
 *      grid-auto-flow: row`.
 *
 *  (b) Inner `.ProseMirror` (Tiptap's editor element on the edit
 *      route only) is ALSO `display: grid; grid-template-columns:
 *      repeat(12, ...); grid-auto-flow: row` so per-block NodeView
 *      wrappers `.skb-block-nodeview` (which sit 2 levels deep under
 *      the outer `.skb-grid`) can apply `style.gridColumn` and visually
 *      land in the 12-col grid. The intermediate `.skb-editor-content`
 *      div spans `grid-column: 1 / -1` so the inner grid inherits full
 *      container width.
 *
 *  (c) Per-block placement: every `.skb-block-nodeview` (editor) AND
 *      `.skb-block-static` (read) carries inline `style.gridColumn` /
 *      `style.gridRow` derived from `node.attrs.{col, colSpan, rowSpan}`
 *      via the shared `gridPlacementStyle` helper from
 *      `@skb/editor-shell/src/grid-style.ts`. Sample-blocks fixtures
 *      are all `col=1, colSpan=12, rowSpan=1` so the expected style is
 *      `grid-column: 1 / span 12; grid-row: span 1`.
 *
 * Pairs with `sample-blocks-edit-loads.spec.ts` (cf-19 chrome lock) and
 * `sample-blocks-read.spec.ts` (cf-20a single-source chrome lock); cf-20b
 * is the layout substrate underneath both. Layers (a)+(b) verified per
 * route. Layer (c) is route-orthogonal: same gridPlacementStyle formula,
 * just different host classes.
 *
 * Out of scope (next PRs in cf-20 sequence): grid-attr mutation
 * (cf-20c-1 algebra + cf-20c-2 drag UI), resize (cf-20d), kebab
 * (cf-20e). cf-20b is the static substrate only.
 */

const SCREENSHOT_PATH = resolve(
  process.cwd(),
  '../../docs/audits/screenshots/wave-6-cf-20b-sample-blocks-grid-layout.png',
);

test('sample-blocks edit route — .ProseMirror is a 12-col grid + per-block grid-column applied (cf-20b D11.1 amendment)', () => {
  test.skip(true, 'REMOVED-IN-WAVE-7-PHASE-2E (ADR-0020 D7 absolute positioning)');
});

test('sample-blocks read route — .skb-block-static carries grid-column derived from MDX attrs', async ({
  page,
}) => {
  await page.goto('/notes/sample-blocks');
  await expect(page.locator('.skb-block-static').first()).toBeVisible({
    timeout: 15_000,
  });

  const probe = await page.evaluate(() => {
    const grid = document.querySelector('.skb-grid');
    if (!grid) return { error: 'no .skb-grid on read route' };
    const gridCs = window.getComputedStyle(grid);
    const gridRect = grid.getBoundingClientRect();

    const wrapperKinds = [
      'callout',
      'componentCode',
      'image',
      'math',
      'pdf',
      'jupyter',
      'nn-viz',
      'agent-flow',
    ] as const;
    const wrappers = wrapperKinds.map((kind) => {
      const el = document.querySelector(
        `.skb-block-static[data-skb-block-kind="${kind}"]`,
      );
      if (!el) return { kind, error: 'wrapper missing' };
      const cs = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      // Wave 6 cf-20b R2 (2026-05-09) — STRUCTURAL grid-item assertion.
      // Pre-R2 the read-route DOM was `<div class="skb-grid"><div
      // class="skb-prose"><.skb-block-static.../></div></div>` so
      // `.skb-block-static` was a GRANDCHILD of `.skb-grid`, not a
      // direct grid item. Computed `gridColumn` style returned the
      // inline `1 / span 12` value but it was INERT (no grid context).
      // codex-pr-reviewer-55 R2 caught this. R2 fix: combine
      // `.skb-grid skb-prose` onto a single wrapper so MDX children
      // become direct grid items. This probe verifies STRUCTURALLY:
      // (i) parent computed `display === 'grid'`; (ii) bounding-rect
      // width matches the 12-col-span claim (≥90% of grid width).
      const parent = el.parentElement;
      const parentDisplay = parent ? window.getComputedStyle(parent).display : null;
      return {
        kind,
        gridColumn: cs.gridColumn,
        gridRow: cs.gridRow,
        inlineStyle: el.getAttribute('style') ?? '',
        parentDisplay,
        width: rect.width,
      };
    });

    return {
      grid: {
        display: gridCs.display,
        gridAutoFlow: gridCs.gridAutoFlow,
        gridTemplateColumns: gridCs.gridTemplateColumns,
        width: gridRect.width,
      },
      wrappers,
    };
  });

  if ('error' in probe) throw new Error(`grid probe failed: ${probe.error}`);

  expect(probe.grid.display).toBe('grid');
  expect(probe.grid.gridAutoFlow).toBe('row');
  expect(probe.grid.gridTemplateColumns.split(' ')).toHaveLength(12);
  expect(probe.grid.width).toBeGreaterThan(100);

  for (const w of probe.wrappers) {
    if ('error' in w) throw new Error(`read wrapper ${w.kind}: ${w.error}`);
    // Each wrapper MUST carry an inline grid-column style (NOT the
    // .skb-grid > *:not([style*="grid-column"]) fallback, because
    // sample-blocks MDX writes col={1} colSpan={12} explicitly per
    // ADR-0016 D7).
    expect(
      w.inlineStyle,
      `read wrapper ${w.kind} must have inline style emitted by mdx-adapter or Astro wrapper`,
    ).toMatch(/grid-column:\s*1\s*\/\s*span\s+12/);
    expect(w.gridColumn).not.toBe('auto');
    expect(w.gridColumn).toMatch(/(span 12|\/\s*13)/);
    // Wave 6 cf-20b R2 — STRUCTURAL: parent must be a real grid
    // container so the inline `gridColumn` actually places the item.
    // Catches the cf-20b R0+R1 false-positive class where computed
    // `gridColumn` style was set but the parent was `display: block`
    // (.skb-prose), making the inline style inert.
    expect(
      w.parentDisplay,
      `read wrapper ${w.kind} must be a real grid item (parent display: grid)`,
    ).toBe('grid');
    // Wave 6 cf-20b R2 — STRUCTURAL: bounding-rect width must match
    // the colSpan=12 claim. Sample-blocks fixtures all use colSpan=12
    // so the wrapper should occupy ~100% of the grid container width
    // (≥ 90% with rounding/border slack).
    expect(
      w.width,
      `read wrapper ${w.kind} bounding-rect width ${w.width}px must be ≥ 90% of grid width ${probe.grid.width}px (catches inert grid-column style on non-grid-item)`,
    ).toBeGreaterThan(probe.grid.width * 0.9);
  }
});

test('cf-20b R1: mobile (≤768px) viewport — blocks force-fill 1-col regardless of inline grid-column', async ({
  page,
}) => {
  // Wave 6 cf-20b R1 hotfix regression lock — codex-pr-reviewer-55 R1
  // probe at 375×812 caught that cf-20b's inline `style="grid-column:
  // 1 / span 12"` on `.skb-block-static` (and `.skb-block-nodeview`)
  // beats the existing `@media (max-width: 768px) .skb-grid > *
  // { grid-column: 1 }` rule per CSS specificity (inline wins). Result:
  // mobile viewport overflows horizontally (scrollWidth=6450px when
  // viewport=343px) because every wrapper still claims 12 cells of
  // width even though the grid switched to 1fr.
  //
  // Fix: `.skb-grid > *, .skb-grid .ProseMirror > * { grid-column:
  // 1 / -1 !important }` inside the same media query. `!important` is
  // intentional + documented (apps/site/CONTRACT.md "≤768px → 1 col"
  // contract requires beating the desktop inline placement). This
  // spec locks the contract so a future renderer that introduces a
  // higher-specificity inline style or a new wrapper variant cannot
  // silently regress mobile layout.
  //
  // Read route is the canonical surface for this test (same fixture
  // sample-blocks; 14 .skb-block-static wrappers all carry inline
  // grid-column from mdx-adapter / Astro wrappers).

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/notes/sample-blocks');

  await expect(page.locator('.skb-block-static').first()).toBeVisible({
    timeout: 15_000,
  });

  // (a) Computed grid-column on every read-route wrapper must be the
  //     mobile override `1 / -1`, NOT the inline-emitted `1 / span 12`.
  //     Sample one wrapper per kind to cover the full BlockKind union.
  const computed = await page.evaluate(() => {
    const wrapperKinds = [
      'callout',
      'componentCode',
      'image',
      'math',
      'pdf',
      'jupyter',
      'nn-viz',
      'agent-flow',
    ] as const;
    return wrapperKinds.map((kind) => {
      const el = document.querySelector(
        `.skb-block-static[data-skb-block-kind="${kind}"]`,
      );
      if (!el) return { kind, error: 'wrapper missing' };
      return { kind, gridColumn: window.getComputedStyle(el).gridColumn };
    });
  });

  for (const entry of computed) {
    if ('error' in entry) {
      throw new Error(`mobile probe ${entry.kind}: ${entry.error}`);
    }
    // Computed `grid-column: 1 / -1` resolves to `1 / -1` in Chromium.
    // The pre-fix value was `1 / span 12` (inline-style override leak).
    expect(
      entry.gridColumn,
      `kind ${entry.kind} must collapse to 1-col on mobile (got ${entry.gridColumn}); cf-20b R1 inline-style override regression`,
    ).toBe('1 / -1');
  }

  // (b) Document scrollWidth must NOT exceed the viewport (with a
  //     small tolerance for browser scrollbar overhead). Pre-fix:
  //     scrollWidth ≈ 6450px (12× overflow). Post-fix: scrollWidth ≤
  //     ~393px (= 375 + scrollbar slack).
  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  expect(
    scrollWidth,
    `document scrollWidth ${scrollWidth}px must NOT exceed viewport+scrollbar (~393px); cf-20b R1 horizontal overflow regression`,
  ).toBeLessThanOrEqual(393);
});
