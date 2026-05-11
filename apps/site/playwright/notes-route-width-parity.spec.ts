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

/**
 * Wave 6 cf-24 (2026-05-10) — D9 3-band amendment.
 *
 * cf-24 adds a 230px-wide left-rail PaletteSidebar to the EDIT route
 * only (BaseLayout `palette` opt-in). The rail is a flex sibling of
 * `<main>`, so edit's main width shrinks below the cf-23 cap when the
 * rail is visible. The 3-band model:
 *
 *   Band 1 (viewport ≥ 1410): main saturates at 1180 cap; rail 230 fits
 *     beside; STRICT parity preserved at 1180 (informational extra row).
 *   Band 2 (1024 ≤ viewport < 1410): rail visible; edit main shrinks
 *     to ~viewport - 230 - margins (lg:px-12 = 96 each side total). The
 *     read route has NO rail so read.main saturates at min(1180, viewport).
 *   Band 3 (viewport < 1024): rail HIDDEN via @media (max-width: 768px);
 *     cf-23 strict parity restored (read.main === edit.main ±2px).
 *
 * 768px boundary: rail still visible at 769-1023 per the global.css
 * `max-width: 768px` breakpoint; hidden at 768. So 768 viewport is in
 * Band 3 (rail HIDDEN), but the band-2 numeric formula still applies
 * conceptually until viewport <= 768. We test 768 + 375 in Band 3 mode.
 */
type ParityMode = 'strict' | 'band2-rail-shrunk';
type ViewportTarget = {
  width: number;
  height: number;
  /** Read route main outer width (cf-23 unchanged). */
  readMainWidth: number;
  /** Read route main inner content width (cf-23 unchanged). */
  readInnerWidth: number;
  /** Edit route main outer width (cf-24 may shrink for band 2). */
  editMainWidth: number;
  /** Edit route main inner content width (cf-24 may shrink for band 2). */
  editInnerWidth: number;
  /** Width-target tolerance band (±px). */
  tolerance: number;
  /** Parity mode — strict (cf-23) vs band-2 (cf-24 rail-visible). */
  mode: ParityMode;
  /** Whether `aside.palette-rail` should be display:none at this viewport. */
  railHidden: boolean;
};

/**
 * Empirical EXECUTE-time measurements (cf-24 TDD-write phase).
 *
 * The cf-23 read measurements stay unchanged (no read-route layout
 * change). cf-24 edit measurements at 1280/1024 are smaller because the
 * 230px rail consumes flex-sibling width.
 *
 * Numeric basis (cf-24 D9 Option A flex-sibling layout):
 *   1280: read.main = 1180 (cap); edit.main = 1280 - 230 (rail) =
 *         1050; edit.inner = 1050 - 96 (lg:px-12) = 954
 *   1024: read.main = 1024 (no cap); edit.main = 1024 - 230 = 794;
 *         edit.inner = 794 - 96 = 698
 *   768: rail HIDDEN; strict parity: edit.main = read.main = 768;
 *        inner = 768 - 32 (px-4) = 736
 *   375: rail HIDDEN; strict parity: edit.main = read.main = 375;
 *        inner = 375 - 32 (px-4) = 343
 */
const VIEWPORT_TARGETS: ViewportTarget[] = [
  // Band 1 (cf-24 D9 optional row): viewport ≥ 1410. Rail (230) +
  // 1180-cap both fit; STRICT parity restored at 1180. Demonstrates
  // the cap-saturation case where rail + main = 1410, well within
  // 1440 viewport. Inner = 1180 - 96 (lg:px-12) = 1084.
  {
    width: 1440,
    height: 900,
    readMainWidth: 1180,
    readInnerWidth: 1084,
    editMainWidth: 1180,
    editInnerWidth: 1084,
    tolerance: 4,
    mode: 'strict',
    railHidden: false,
  },
  {
    width: 1280,
    height: 900,
    readMainWidth: 1180,
    readInnerWidth: 1084,
    editMainWidth: 1050,
    editInnerWidth: 954,
    tolerance: 8,
    mode: 'band2-rail-shrunk',
    railHidden: false,
  },
  {
    width: 1024,
    height: 900,
    readMainWidth: 1024,
    readInnerWidth: 928,
    editMainWidth: 794,
    editInnerWidth: 698,
    tolerance: 8,
    mode: 'band2-rail-shrunk',
    railHidden: false,
  },
  {
    width: 768,
    height: 1024,
    readMainWidth: 768,
    readInnerWidth: 736,
    editMainWidth: 768,
    editInnerWidth: 736,
    tolerance: 4,
    mode: 'strict',
    railHidden: true,
  },
  {
    width: 375,
    height: 812,
    readMainWidth: 375,
    readInnerWidth: 343,
    editMainWidth: 375,
    editInnerWidth: 343,
    tolerance: 4,
    mode: 'strict',
    railHidden: true,
  },
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

test.describe('cf-23 D10 + cf-24 D9 — width-parity 3-band model with palette-rail amendment', () => {
  for (const vt of VIEWPORT_TARGETS) {
    test(`viewport ${vt.width}x${vt.height} (${vt.mode}, rail ${vt.railHidden ? 'hidden' : 'visible'})`, async ({
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

      // Edit route — wait for editor hydration before measuring.
      await page.goto('/notes/sample-blocks/edit');
      await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 });
      await page.waitForFunction(
        () => document.querySelectorAll('.skb-block-nodeview').length > 0,
        undefined,
        { timeout: 15_000 },
      );
      const editMeasure = await measure(page);
      await page.screenshot({
        fullPage: true,
        path: `${SCREENSHOT_DIR}/wave-6-cf-24-after-edit-${vt.width}.png`,
      });

      // cf-24 — palette-rail visibility assertion.
      const railDisplay = await page
        .locator('aside.palette-rail')
        .evaluate((el) => window.getComputedStyle(el).display);
      if (vt.railHidden) {
        expect(
          railDisplay,
          `palette-rail at ${vt.width} must be display:none (Band 3, cf-24 D8)`,
        ).toBe('none');
      } else {
        expect(
          railDisplay,
          `palette-rail at ${vt.width} must be visible (cf-24 Band 1/2)`,
        ).not.toBe('none');
      }

      // Parity assertion depends on mode.
      if (vt.mode === 'strict') {
        // Band 3 — cf-23 strict parity preserved (rail hidden).
        expect(
          Math.abs(readMeasure.mainWidth - editMeasure.mainWidth),
          `Band 3 strict outer parity at ${vt.width}: read=${readMeasure.mainWidth}, edit=${editMeasure.mainWidth} (delta must <= ${PARITY_TOLERANCE_PX}px)`,
        ).toBeLessThanOrEqual(PARITY_TOLERANCE_PX);
        expect(
          Math.abs(readMeasure.innerWidth - editMeasure.innerWidth),
          `Band 3 strict inner parity at ${vt.width}: read=${readMeasure.innerWidth}, edit=${editMeasure.innerWidth} (delta must <= ${PARITY_TOLERANCE_PX}px)`,
        ).toBeLessThanOrEqual(PARITY_TOLERANCE_PX);
      } else {
        // Band 2 — edit.main shrinks because the 230px rail consumes
        // flex width. The exact delta depends on whether the 1180
        // read-main cap binds at this viewport:
        //   1280: read = 1180 (cap binds), edit = 1280 - 230 = 1050;
        //         delta = 130 (NOT 230 — cap reduces read first).
        //   1024: read = 1024 (cap doesn't bind), edit = 1024 - 230
        //         = 794; delta = 230 (full rail subtraction).
        // Verify: edit.main < read.main (qualitative shrink) AND the
        // delta matches the per-viewport expected target locked in
        // the VIEWPORT_TARGETS table. ±10px tolerance.
        const expectedDelta = vt.readMainWidth - vt.editMainWidth;
        const actualDelta = readMeasure.mainWidth - editMeasure.mainWidth;
        expect(
          Math.abs(actualDelta - expectedDelta),
          `Band 2 outer delta at ${vt.width}: read=${readMeasure.mainWidth}, edit=${editMeasure.mainWidth}, delta=${actualDelta} (expected ~${expectedDelta} ±10px per cf-24 D9)`,
        ).toBeLessThanOrEqual(10);
      }

      // Locked target — read main + inner widths (cf-23 unchanged).
      assertWithinBand(
        readMeasure.mainWidth,
        vt.readMainWidth,
        vt.tolerance,
        `read mainWidth at ${vt.width}`,
      );
      assertWithinBand(
        readMeasure.innerWidth,
        vt.readInnerWidth,
        vt.tolerance,
        `read innerWidth at ${vt.width}`,
      );

      // Locked target — edit main + inner widths (cf-24 may differ
      // from read at Band 2).
      assertWithinBand(
        editMeasure.mainWidth,
        vt.editMainWidth,
        vt.tolerance,
        `edit mainWidth at ${vt.width}`,
      );
      assertWithinBand(
        editMeasure.innerWidth,
        vt.editInnerWidth,
        vt.tolerance,
        `edit innerWidth at ${vt.width}`,
      );

      // No horizontal overflow at any viewport (cf-23 contract intact).
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

function assertWithinBand(
  actual: number,
  target: number,
  tolerance: number,
  label: string,
): void {
  const lower = target - tolerance;
  const upper = target + tolerance;
  expect(
    actual,
    `${label}: expected in [${lower}, ${upper}], got ${actual}`,
  ).toBeGreaterThanOrEqual(lower);
  expect(
    actual,
    `${label}: expected in [${lower}, ${upper}], got ${actual}`,
  ).toBeLessThanOrEqual(upper);
}
