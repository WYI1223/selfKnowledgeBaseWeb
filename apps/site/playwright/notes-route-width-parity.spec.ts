import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

/**
 * Wave 6 cf-23 (2026-05-10) — D10 4-viewport width-parity lock.
 *
 * # Why this spec exists
 *
 * cf-23 introduces a `wide?: boolean` opt-in on `BaseLayout.astro`; both
 * `/notes/<slug>` (read) and `/notes/<slug>/edit` pass `wide`, swapping
 * `<main>` from `prose mx-auto max-w-3xl py-12 px-4` (~768px cap) to
 * `mx-auto py-10 px-4 lg:px-12 notes-doc-wrap` + inline
 * `style="max-width: 1180px"` (the v2 `.doc-wrap` analog per
 * `/mnt/d/download/web/v2-styles.css:122-127`).
 *
 * The contract: BOTH notes routes resolve IDENTICAL `<main>` width at
 * EVERY viewport. If a future PR drops `wide` from one route, copy-pastes
 * a different className on one route, or adds a route-specific media
 * query that diverges the two, this spec catches it.
 *
 * Plan-challenger refinement (per orchestrator at cf-23 PLAN lock):
 * width parity must hold at all 4 responsive breakpoints (1280 / 1024 /
 * 768 / 375), NOT just 1280. The cf-20b grid breakpoints (≤1024 → 6col,
 * ≤768 → 1col) trigger off viewport not container, so a future change
 * to one route's wrapper without the other could silently diverge widths
 * at any breakpoint.
 *
 * # What this spec asserts
 *
 * For each of 4 viewports (1280, 1024, 768, 375):
 *
 *   (a) `Math.abs(read.mainWidth - edit.mainWidth) <= 2px` — the two
 *       routes' `<main>` widths are equal within sub-pixel tolerance.
 *
 *   (b) Each absolute width in its locked target band — the cf-23
 *       AFTER-state widths measured during EXECUTE TDD-write phase.
 *       Locked numbers prevent silent breakpoint regressions (e.g.
 *       a future PR changing `lg:px-12` to `lg:px-10` would shift
 *       1024px width by ~4px without violating parity).
 *
 *   (c) `document.documentElement.scrollWidth === window.innerWidth` —
 *       no horizontal-overflow regression. Defends against the cf-20b
 *       R1 mobile-grid horizontal-scroll repro (where heavy-block
 *       skeletons + min-content sizing pushed scrollWidth to 6450px on
 *       a 343px viewport).
 *
 * # Locked target widths
 *
 * Measured at cf-23 EXECUTE TDD-write phase from the running preview
 * server AFTER applying the BaseLayout `wide` patch + dropping the
 * Tailwind `prose` class on the wide path. Tailwind config: `lg:`
 * breakpoint is 1024px+ (default); `px-4 = 16px each side`, `px-12
 * = 48px each side`. `<main>` `getBoundingClientRect().width` measures
 * the OUTER box (padding lives INSIDE the box), so:
 *
 *   - At 1280px viewport, the inline `style="max-width: 1180px"` caps
 *     the box at 1180; `mx-auto` distributes the extra (1280 - 1180 =
 *     100px) as 50px each side margin.
 *   - At viewports ≤ 1180px, the box fills the full viewport and the
 *     `px-4` / `lg:px-12` padding pushes inner content inward; the
 *     `<main>` outer width therefore EQUALS the viewport at 1024 /
 *     768 / 375.
 *
 *   1280 → mainWidth = 1180px (max-width cap active)
 *   1024 → mainWidth = 1024px (no cap; padding inside)
 *   768  → mainWidth = 768px  (no cap; padding inside)
 *   375  → mainWidth = 375px  (no cap; padding inside)
 *
 * Padding-INNER-CONTENT widths (cf-23 R0 F2 tightening: ALSO asserted,
 * not informational — a regression that changes `lg:px-12` to `lg:px-8`
 * would silently shrink the inner content area while keeping outer
 * mainWidth identical, defeating D10's "lock the doc-wrap padding
 * spec" intent. Inner = `<main>` clientWidth - paddingLeft - paddingRight,
 * which equals `<main>`'s content-box width regardless of box-sizing.):
 *   1280 → 1180 - 96 (lg:px-12 *2) = 1084
 *   1024 → 1024 - 96 (lg:px-12 *2) = 928
 *   768  → 768 - 32 (px-4 *2)      = 736
 *   375  → 375 - 32 (px-4 *2)      = 343
 *
 * Each target (outer + inner) carries a ±4px tolerance band to absorb
 * scrollbar width variability across headless / windowed Chrome.
 */

const SCREENSHOT_DIR = resolve(
  process.cwd(),
  '../../docs/audits/screenshots',
);

type ViewportTarget = {
  width: number;
  height: number;
  mainWidthTarget: number;
  innerWidthTarget: number;
  tolerance: number;
};

const VIEWPORT_TARGETS: ViewportTarget[] = [
  // 1280: max-width cap forces box to 1180; mx-auto centers (50px each side margin).
  // Inner = 1180 - lg:px-12 (48*2) = 1084.
  { width: 1280, height: 900, mainWidthTarget: 1180, innerWidthTarget: 1084, tolerance: 4 },
  // 1024: below the 1180 cap; box fills viewport (lg:px-12 padding inside box).
  // Inner = 1024 - lg:px-12 (48*2) = 928.
  { width: 1024, height: 900, mainWidthTarget: 1024, innerWidthTarget: 928, tolerance: 4 },
  // 768: below lg breakpoint; box fills viewport (px-4 padding inside box).
  // Inner = 768 - px-4 (16*2) = 736.
  { width: 768, height: 1024, mainWidthTarget: 768, innerWidthTarget: 736, tolerance: 4 },
  // 375 mobile: box fills viewport (px-4 padding inside box).
  // Inner = 375 - px-4 (16*2) = 343.
  { width: 375, height: 812, mainWidthTarget: 375, innerWidthTarget: 343, tolerance: 4 },
];

const PARITY_TOLERANCE_PX = 2;

async function measure(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) {
      return {
        mainWidth: -1,
        innerWidth: -1,
        scrollWidth: -1,
        viewportWidth: window.innerWidth,
      };
    }
    const rect = main.getBoundingClientRect();
    const cs = getComputedStyle(main);
    // Inner content width = clientWidth (box without scrollbar) minus
    // the resolved padding-left + padding-right values. Works regardless
    // of box-sizing because clientWidth excludes border + scrollbar but
    // INCLUDES padding; we subtract padding to get the content area.
    // This is the user-visible "where does prose actually flow" width
    // and is the contract the lg:px-12 / px-4 padding spec defines.
    const paddingLeft = parseFloat(cs.paddingLeft) || 0;
    const paddingRight = parseFloat(cs.paddingRight) || 0;
    const innerWidth = main.clientWidth - paddingLeft - paddingRight;
    return {
      mainWidth: rect.width,
      innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });
}

test.describe('cf-23 D10 — read + edit routes share main outer + inner widths at 4 viewports', () => {
  for (const vt of VIEWPORT_TARGETS) {
    test(`viewport ${vt.width}x${vt.height} → both routes resolve mainWidth ~${vt.mainWidthTarget}px AND innerWidth ~${vt.innerWidthTarget}px (±${vt.tolerance}px) AND parity (±${PARITY_TOLERANCE_PX}px) AND no overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vt.width, height: vt.height });

      // Read route first.
      await page.goto('/notes/sample-blocks');
      await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 });
      const readMeasure = await measure(page);
      await page.screenshot({
        fullPage: true,
        path: `${SCREENSHOT_DIR}/wave-6-cf-23-after-read-${vt.width}.png`,
      });

      // Edit route — let EditorShellMount hydrate before measuring main.
      // The <main> width itself is set by Astro SSR, but we wait for the
      // hydration target to ensure the EditorShellMount React island
      // doesn't introduce post-mount layout shifts via late CSS imports.
      await page.goto('/notes/sample-blocks/edit');
      await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 });
      // Wait for editor to mount so any late-hydration CSS that might
      // shift container width (none expected, but defense in depth)
      // has settled.
      await page.waitForFunction(
        () => document.querySelectorAll('.skb-block-nodeview').length > 0,
        undefined,
        { timeout: 15_000 },
      );
      const editMeasure = await measure(page);
      await page.screenshot({
        fullPage: true,
        path: `${SCREENSHOT_DIR}/wave-6-cf-23-after-edit-${vt.width}.png`,
      });

      // (a) Parity: read.mainWidth ~ edit.mainWidth (outer box).
      expect(
        Math.abs(readMeasure.mainWidth - editMeasure.mainWidth),
        `outer width parity at viewport ${vt.width}: read=${readMeasure.mainWidth}px, edit=${editMeasure.mainWidth}px (delta must be <= ${PARITY_TOLERANCE_PX}px)`,
      ).toBeLessThanOrEqual(PARITY_TOLERANCE_PX);

      // (a') Parity: read.innerWidth ~ edit.innerWidth (content area).
      // cf-23 R0 F2 — also lock inner-content parity so a regression
      // that diverges padding between routes (e.g. someone adds an
      // override on /notes/<slug>/edit only) gets caught.
      expect(
        Math.abs(readMeasure.innerWidth - editMeasure.innerWidth),
        `inner width parity at viewport ${vt.width}: read=${readMeasure.innerWidth}px, edit=${editMeasure.innerWidth}px (delta must be <= ${PARITY_TOLERANCE_PX}px)`,
      ).toBeLessThanOrEqual(PARITY_TOLERANCE_PX);

      // (b) Locked target — read mainWidth in OUTER target band.
      const outerLower = vt.mainWidthTarget - vt.tolerance;
      const outerUpper = vt.mainWidthTarget + vt.tolerance;
      expect(
        readMeasure.mainWidth,
        `read mainWidth at ${vt.width}: expected in [${outerLower}, ${outerUpper}], got ${readMeasure.mainWidth}`,
      ).toBeGreaterThanOrEqual(outerLower);
      expect(
        readMeasure.mainWidth,
        `read mainWidth at ${vt.width}: expected in [${outerLower}, ${outerUpper}], got ${readMeasure.mainWidth}`,
      ).toBeLessThanOrEqual(outerUpper);

      expect(
        editMeasure.mainWidth,
        `edit mainWidth at ${vt.width}: expected in [${outerLower}, ${outerUpper}], got ${editMeasure.mainWidth}`,
      ).toBeGreaterThanOrEqual(outerLower);
      expect(
        editMeasure.mainWidth,
        `edit mainWidth at ${vt.width}: expected in [${outerLower}, ${outerUpper}], got ${editMeasure.mainWidth}`,
      ).toBeLessThanOrEqual(outerUpper);

      // (b') Locked target — read innerWidth in INNER target band.
      // cf-23 R0 F2 — locks the lg:px-12 / px-4 padding spec. A
      // regression like `lg:px-12` → `lg:px-8` would shrink inner
      // by 16px while outer stays unchanged; pre-R0 this would have
      // passed silently.
      const innerLower = vt.innerWidthTarget - vt.tolerance;
      const innerUpper = vt.innerWidthTarget + vt.tolerance;
      expect(
        readMeasure.innerWidth,
        `read innerWidth at ${vt.width}: expected in [${innerLower}, ${innerUpper}], got ${readMeasure.innerWidth}`,
      ).toBeGreaterThanOrEqual(innerLower);
      expect(
        readMeasure.innerWidth,
        `read innerWidth at ${vt.width}: expected in [${innerLower}, ${innerUpper}], got ${readMeasure.innerWidth}`,
      ).toBeLessThanOrEqual(innerUpper);

      expect(
        editMeasure.innerWidth,
        `edit innerWidth at ${vt.width}: expected in [${innerLower}, ${innerUpper}], got ${editMeasure.innerWidth}`,
      ).toBeGreaterThanOrEqual(innerLower);
      expect(
        editMeasure.innerWidth,
        `edit innerWidth at ${vt.width}: expected in [${innerLower}, ${innerUpper}], got ${editMeasure.innerWidth}`,
      ).toBeLessThanOrEqual(innerUpper);

      // (c) No horizontal overflow at any viewport — exact equality
      // against the viewport's `window.innerWidth` per the D10 contract
      // claim (cf-20b R1 lesson: any scrollWidth EXCEEDING viewportWidth
      // indicates content escaping the viewport bounds; any scrollWidth
      // BELOW viewportWidth would indicate the <html> root itself is
      // narrower than the viewport, a layout-shift bug we equally want
      // to catch). Pre-R0 this used `<= viewportWidth` which would have
      // masked a shrinking-document regression. Tightened per cf-23
      // stage 3 R0 F1 (codex-pr-reviewer-55) to match D10 wording verbatim.
      // (Variable renamed `innerWidth` → `viewportWidth` in the measure
      // helper post-F2 to disambiguate from `<main>`'s inner content
      // width, which is a separate field.)
      expect(
        readMeasure.scrollWidth,
        `read scrollWidth at ${vt.width} must equal viewport width (got scroll=${readMeasure.scrollWidth}, viewport=${readMeasure.viewportWidth})`,
      ).toBe(readMeasure.viewportWidth);

      expect(
        editMeasure.scrollWidth,
        `edit scrollWidth at ${vt.width} must equal viewport width (got scroll=${editMeasure.scrollWidth}, viewport=${editMeasure.viewportWidth})`,
      ).toBe(editMeasure.viewportWidth);
    });
  }
});
