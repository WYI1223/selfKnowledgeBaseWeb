import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Wave 7 Phase 2B.2 (ADR-0020 D2): the 4-mode hit-test perf budget
 * (TC1.1 / TC1.2 / TC1.3 — findMatches × computeEdgeRects per cursor
 * frame) is REMOVED. The new cursor → grid-coord pipeline is O(1)
 * per frame (a single floor() pair + a single inferDropIntent call
 * over an unrelated state.blocks scan), so the synthetic perf budget
 * no longer applies. Visual baseline emission (TC2.x) survives.
 */

const FRAME_BUDGET_MS = 20;
const BASELINE_MIN_BYTES = 5 * 1024;

const here = dirname(fileURLToPath(import.meta.url));
const baselineDir = resolve(here, 'visual-smoke-baseline');

void FRAME_BUDGET_MS; // retained for documentation symmetry with old harness

const baselineCases: Array<[string, string, string, string[]]> = [
  [
    'TC2.1 — visual baseline /sample-blocks-astro',
    '/sample-blocks-astro',
    'wave-5-c2-baseline-sample-blocks-astro.png',
    ['h1', '[data-block="jupyter"]'],
  ],
  [
    'TC2.2 — visual baseline /notes/sample-blocks',
    '/notes/sample-blocks',
    'wave-5-c2-baseline-sample-blocks-notes.png',
    ['.skb-grid', '[data-block="jupyter"]'],
  ],
  [
    'TC2.3 — visual baseline /notes/sample-blocks/edit',
    '/notes/sample-blocks/edit',
    'wave-5-c2-baseline-edit-route.png',
    ['.skb-grid', '.ProseMirror'],
  ],
];

async function emitBaseline(
  page: Page,
  route: string,
  outputName: string,
  visibleSelectors: string[],
): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(route);

  for (const selector of visibleSelectors) {
    await expect(page.locator(selector).first()).toBeVisible({ timeout: 10_000 });
  }

  mkdirSync(baselineDir, { recursive: true });
  const outputPath = resolve(baselineDir, outputName);
  await page.screenshot({ path: outputPath, fullPage: true });
  expect(statSync(outputPath).size).toBeGreaterThanOrEqual(BASELINE_MIN_BYTES);
}

test.describe('AC#6 perf budget synthetic harness (REMOVED in Wave 7 Phase 2B.2)', () => {
  test('TC1.1/1.2/1.3 — REMOVED: 4-mode hit-test perf budget no longer applies', () => {
    test.skip(
      true,
      'REMOVED-IN-WAVE-7-PHASE-2B: findMatches / computeEdgeRects deleted with the 4-mode pipeline. Cursor → grid-coord is O(1); no synthetic perf budget needed.',
    );
  });
});

test.describe('Stage C.2 visual smoke baseline emission', () => {
  for (const [title, route, outputName, visibleSelectors] of baselineCases) {
    test(title, async ({ page }) => {
      await emitBaseline(page, route, outputName, visibleSelectors);
    });
  }
});
