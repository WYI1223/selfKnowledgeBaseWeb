import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import {
  AUTOSAVE_SETTLE_MS,
  getSampleBlocksOriginalMdxBytes,
  restoreSampleBlocksFixture,
  SAMPLE_BLOCKS_MDX_PATH,
  SAMPLE_BLOCKS_STATE_PATH,
  snapshotSampleBlocksFixture,
} from './fixtures/sample-blocks-fixture';
import {
  dispatchResizeGesture,
  installColOverflowFixture as installColOverflowFixtureHelper,
  installPersistedOverflowFixture as installPersistedOverflowFixtureHelper,
} from './helpers/resize-pointer-events';

/**
 * Wave 6 cf-20d (2026-05-09) — resize-handles UI + commit wire integration spec.
 *
 * cf-20d wires the v2 resize affordance per ADR-0017 D9: 3 handles
 * (right / bottom / corner) per `.skb-block-nodeview` + ColRuler /
 * SizeTooltip / RowLadder overlays + commit-on-release semantics.
 *
 * Byte-snapshot fixture isolation per cf-20c-2 R3 F1 reflection rule
 * lives in `./fixtures/sample-blocks-fixture.ts`. cf-22 follow-up
 * (2026-05-10) extracted the per-spec inline copies + added
 * `beforeEach` + `AUTOSAVE_SETTLE_MS` waits so the editor's 800 ms
 * debounced autosave can't race past the trailing restore.
 */

test.beforeAll(snapshotSampleBlocksFixture);
test.beforeEach(restoreSampleBlocksFixture);
test.afterAll(restoreSampleBlocksFixture);

const SCREENSHOT_PATH = resolve(
  process.cwd(),
  '../../docs/audits/screenshots/wave-6-cf-20d-resize-handles.png',
);

test('sample-blocks edit route — cf-20d resize-handles wire (handle visibility + right-edge commit + drop-pulse reuse)', async ({
  page,
}) => {
  // cf-22 follow-up: per-test restore now handled by `beforeEach`.

  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(editor.locator('.skb-block-nodeview').first()).toBeVisible({
    timeout: 10_000,
  });

  // (a) Handle visibility — each NodeView wrapper renders 3 handles
  // (right + bottom + corner). 14 sample-blocks fixtures all non-prose
  // → 14 right + 14 bottom + 14 corner.
  // Wave 6 cf-25 — filter to component-block handles only (cf-25
  // chunked markdown blocks add ~10-11 more right/bottom/corner
  // handles; markdown handle counts asserted by sample-blocks-markdown-blocks.spec.ts).
  const COMPONENT_NODE = '.skb-block-nodeview:not([data-skb-block-kind="markdown"])';
  const rightHandles = page.locator(`${COMPONENT_NODE} .gblock-handle.right`);
  const bottomHandles = page.locator(`${COMPONENT_NODE} .gblock-handle.bottom`);
  const cornerHandles = page.locator(`${COMPONENT_NODE} .gblock-handle.corner`);
  await expect(rightHandles).toHaveCount(15);
  await expect(bottomHandles).toHaveCount(15);
  await expect(cornerHandles).toHaveCount(15);

  // First right handle has the expected ADR-0017 D9 + cf-20d data
  // attributes + ew-resize cursor per v2-styles.css:271.
  const firstRight = rightHandles.first();
  expect(await firstRight.getAttribute('data-skb-resize-axis')).toBe('right');
  const blockId = await firstRight.getAttribute('data-skb-resize-block-id');
  expect(blockId).toMatch(/^\d+$/);
  const cursorComputed = await firstRight.evaluate(
    (el) => window.getComputedStyle(el).cursor,
  );
  expect(cursorComputed).toBe('ew-resize');

  // Pre-resize baseline: no resize state in DOM.
  await expect(page.locator('.skb-block-nodeview--resizing')).toHaveCount(0);
  await expect(page.locator('[data-skb-resize-col-ruler-anchor]')).toHaveCount(
    0,
  );
  await expect(page.locator('[data-skb-row-ladder]')).toHaveCount(0);

  await page.screenshot({ fullPage: false, path: SCREENSHOT_PATH });
});

test('cf-20d — right-edge resize commit mutates colSpan + reuses cf-20c-2 dropEpoch infrastructure (ADR-0017 D9 + D11)', () => {
  test.skip(true, 'REMOVED-IN-WAVE-7-PHASE-2E (ADR-0020 D7 absolute positioning)');
});

test('cf-20d — resize handles hidden on mobile (≤768px) per ADR-0017 D9 view-only contract', async ({
  page,
}) => {
  // cf-20d disables resize affordances on mobile preview-mode per
  // ADR-0017 D9 view-only contract. The CSS rule
  // `@media (max-width: 768px) { .gblock-handle, .skb-col-ruler,
  // .skb-row-ladder, .skb-size-tooltip { display: none } }`
  // hides them from layout AND prevents pointerdown interaction.
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(editor.locator('.skb-block-nodeview').first()).toBeVisible({
    timeout: 10_000,
  });

  // Right handles still exist in the React tree (NodeView doesn't
  // conditionally render based on viewport); the CSS hides them.
  // Wave 6 cf-25 — filter to component-block handles only.
  const COMPONENT_NODE = '.skb-block-nodeview:not([data-skb-block-kind="markdown"])';
  const rightHandles = page.locator(`${COMPONENT_NODE} .gblock-handle.right`);
  await expect(rightHandles).toHaveCount(15);
  const firstDisplay = await rightHandles.first().evaluate(
    (el) => window.getComputedStyle(el).display,
  );
  expect(firstDisplay).toBe('none');

  // Bottom + corner handles also hidden.
  const bottomHandles = page.locator(`${COMPONENT_NODE} .gblock-handle.bottom`);
  const cornerHandles = page.locator(`${COMPONENT_NODE} .gblock-handle.corner`);
  await expect(bottomHandles).toHaveCount(15);
  await expect(cornerHandles).toHaveCount(15);
  expect(
    await bottomHandles.first().evaluate(
      (el) => window.getComputedStyle(el).display,
    ),
  ).toBe('none');
  expect(
    await cornerHandles.first().evaluate(
      (el) => window.getComputedStyle(el).display,
    ),
  ).toBe('none');
});

test('cf-20d R1 F1 — tablet (≤1024px, 6-col) right-edge resize uses [2, 3, 6] snaps NOT [2, 3, 4, 6, 8, 12]', () => {
  test.skip(true, 'REMOVED-IN-WAVE-7-PHASE-2E (ADR-0020 D7 absolute positioning)');
});

// R2 F2 fix lock — UNCONDITIONAL persisted-overflow defense (col=4
// colSpan=6 at tablet 6-col). See cf-20d D10 R2 amendment + helper
// `installPersistedOverflowFixtureHelper` for the full rationale.
function installPersistedOverflowFixture(): void {
  installPersistedOverflowFixtureHelper(
    getSampleBlocksOriginalMdxBytes(),
    SAMPLE_BLOCKS_MDX_PATH,
    SAMPLE_BLOCKS_STATE_PATH,
  );
}

test('cf-20d R2 F2 — bottom-only resize on persisted-overflow block normalizes colSpan in same setNodeMarkup transaction', () => {
  test.skip(true, 'REMOVED-IN-WAVE-7-PHASE-2E (ADR-0020 D7 absolute positioning)');
});

// R3 F1 fix lock — atomic {col, colSpan} normalization (col=7
// colSpan=6: valid at desktop, col-overflow at tablet 6-col). See
// cf-20d D10 R3 amendment + helper `installColOverflowFixtureHelper`
// for the full rationale.
function installColOverflowFixture(): void {
  installColOverflowFixtureHelper(
    getSampleBlocksOriginalMdxBytes(),
    SAMPLE_BLOCKS_MDX_PATH,
    SAMPLE_BLOCKS_STATE_PATH,
  );
}

test('cf-20d R3 F1 — bottom-only resize on col-overflow block normalizes BOTH col AND colSpan atomically (NOT just colSpan)', () => {
  test.skip(true, 'REMOVED-IN-WAVE-7-PHASE-2E (ADR-0020 D7 absolute positioning)');
});
