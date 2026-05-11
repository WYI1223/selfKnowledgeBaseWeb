import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import {
  AUTOSAVE_SETTLE_MS,
  restoreSampleBlocksFixture,
  snapshotSampleBlocksFixture,
} from './fixtures/sample-blocks-fixture';

/**
 * Wave 6 cf-20e (2026-05-09) — kebab menu (per-block actions) integration spec.
 *
 * cf-20e wires the kebab affordance per the cf-20e brief: per-block
 * `<button class="skb-block-nodeview__kebab">⋮</button>` inside the
 * cf-19 gutter shell + a floating menu with 3 actions:
 *   - Delete (silent; Tiptap history Cmd+Z to undo)
 *   - Duplicate (tr.insert primitive + cf-20c-2 R3 dropEpoch reuse for
 *     success-pulse; NOT insertContentAt which silently no-ops on
 *     schema-mismatch per cf-20e D7)
 *   - Change kind… (sub-menu with 8 BlockKind options;
 *     drop-and-default attr translation per cf-20e D3)
 *
 * Byte-snapshot fixture isolation per cf-20c-2 R3 F1 reflection rule
 * lives in `./fixtures/sample-blocks-fixture.ts`. cf-22 follow-up
 * (2026-05-10) extracted the per-spec inline copies to a single helper
 * + added `beforeEach` + `AUTOSAVE_SETTLE_MS` waits before trailing
 * restores so the editor's 800 ms debounced autosave can't race past
 * cleanup. See PR #116 retrospective for the full root-cause writeup.
 */

test.beforeAll(snapshotSampleBlocksFixture);
test.beforeEach(restoreSampleBlocksFixture);
test.afterAll(restoreSampleBlocksFixture);

const SCREENSHOT_PATH = resolve(
  process.cwd(),
  '../../docs/audits/screenshots/wave-6-cf-20e-kebab-menu.png',
);

test('sample-blocks edit route — cf-20e kebab-menu wire (button visibility + open + close)', async ({
  page,
}) => {
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(editor.locator('.skb-block-nodeview').first()).toBeVisible({
    timeout: 10_000,
  });

  // (a) Each NodeView wrapper renders 1 kebab button (14 sample-blocks
  // fixtures all non-prose component blocks → 14 kebabs).
  // Wave 6 cf-25 — filter to component-block kebabs only (cf-25
  // chunking adds ~10-11 markdown-block kebabs that aren't part of
  // the pre-cf-25 14-block expectation; the cf-25 markdown kebab count
  // is asserted by sample-blocks-markdown-blocks.spec.ts).
  const kebabs = page.locator(
    '.skb-block-nodeview:not([data-skb-block-kind="markdown"]) .skb-block-nodeview__kebab',
  );
  await expect(kebabs).toHaveCount(14);

  const firstKebab = kebabs.first();
  expect(await firstKebab.getAttribute('aria-label')).toBe('Block actions');
  expect(await firstKebab.getAttribute('aria-haspopup')).toBe('menu');
  expect(await firstKebab.getAttribute('aria-expanded')).toBe('false');
  const blockId = await firstKebab.getAttribute('data-skb-kebab-block-id');
  expect(blockId).toMatch(/^\d+$/);
  const cursorComputed = await firstKebab.evaluate(
    (el) => window.getComputedStyle(el).cursor,
  );
  expect(cursorComputed).toBe('pointer');

  // Pre-click baseline: no menu mounted.
  await expect(page.locator('.skb-kebab-menu')).toHaveCount(0);

  // (b) Click first kebab: menu opens with 3 items.
  await firstKebab.click();
  await expect(page.locator('.skb-kebab-menu')).toHaveCount(1);
  await expect(firstKebab).toHaveAttribute('aria-expanded', 'true');
  const items = page.locator('.skb-kebab-menu .skb-kebab-menu__item');
  // 3 top-level items (Delete / Duplicate / Change kind…).
  await expect(items).toHaveCount(3);
  expect(await items.nth(0).textContent()).toBe('Delete');
  expect(await items.nth(1).textContent()).toBe('Duplicate');
  expect(await items.nth(2).textContent()).toBe('Change kind…');

  // (c) Esc closes the menu.
  await page.keyboard.press('Escape');
  await expect(page.locator('.skb-kebab-menu')).toHaveCount(0);
  await expect(firstKebab).toHaveAttribute('aria-expanded', 'false');

  // (d) Click outside (on second kebab) closes the first menu + opens
  // the new one.
  await firstKebab.click();
  await expect(page.locator('.skb-kebab-menu')).toHaveCount(1);
  await kebabs.nth(1).click();
  // After clicking the second kebab: first menu closed, second open.
  // Net: still 1 menu (the second one).
  await expect(page.locator('.skb-kebab-menu')).toHaveCount(1);
  // Close with Esc for clean state.
  await page.keyboard.press('Escape');

  await page.screenshot({ fullPage: false, path: SCREENSHOT_PATH });
});

test('cf-20e — Delete action removes block from doc + decreases NodeView count by 1', async ({
  page,
}) => {
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(editor.locator('.skb-block-nodeview').first()).toBeVisible({
    timeout: 10_000,
  });
  await page.waitForTimeout(500);

  // Wave 6 cf-25 — count + select component-block wrappers only;
  // cf-25 chunking adds markdown wrappers ahead of the first callout,
  // and Delete operates on whichever wrapper is "first" (markdown vs
  // component). For this test we want to delete the FIRST COMPONENT
  // (callout) per the pre-cf-25 behavior intent.
  const wrappers = page.locator(
    '.skb-block-nodeview:not([data-skb-block-kind="markdown"])',
  );
  const beforeCount = await wrappers.count();
  expect(beforeCount).toBe(14);

  // Capture the SECOND wrapper's block-kind so we can verify it
  // becomes the new first block after delete.
  const secondKindBefore = await wrappers
    .nth(1)
    .getAttribute('data-skb-block-kind');

  // Click first kebab → click "Delete". Filter to component-block kebabs.
  await page
    .locator(
      '.skb-block-nodeview:not([data-skb-block-kind="markdown"]) .skb-block-nodeview__kebab',
    )
    .first()
    .click();
  await expect(page.locator('.skb-kebab-menu')).toHaveCount(1);
  await page
    .locator('.skb-kebab-menu .skb-kebab-menu__item[data-skb-kebab-action="delete"]')
    .click();

  // Wait for React commit + Tiptap delete + DOM update.
  await page.waitForTimeout(300);

  const afterCount = await wrappers.count();
  expect(
    afterCount,
    'cf-20e Delete: block count MUST decrease by 1 after the Delete action',
  ).toBe(beforeCount - 1);

  // The previously-second block is now the first.
  const firstKindAfter = await wrappers.nth(0).getAttribute('data-skb-block-kind');
  expect(
    firstKindAfter,
    'cf-20e Delete: the previously-second block MUST become the new first block (delete removes top of doc)',
  ).toBe(secondKindBefore);

  // Menu auto-closed post-action.
  await expect(page.locator('.skb-kebab-menu')).toHaveCount(0);

  // cf-22 follow-up — let the editor's 800 ms debounced autosave fire +
  // settle to disk BEFORE the trailing restore so the in-flight POST
  // can't race past cleanup. AUTOSAVE_SETTLE_MS budgets debounce + fetch
  // + saveSettleTimer + headroom (1500 ms total).
  await page.waitForTimeout(AUTOSAVE_SETTLE_MS);
  restoreSampleBlocksFixture();
});

test('cf-20e — Duplicate action inserts a copy + fires success-pulse via cf-20c-2 dropEpoch reuse', async ({
  page,
}) => {
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(editor.locator('.skb-block-nodeview').first()).toBeVisible({
    timeout: 10_000,
  });
  await page.waitForTimeout(500);

  // Wave 6 cf-25 — count + select component-block wrappers only.
  const wrappers = page.locator(
    '.skb-block-nodeview:not([data-skb-block-kind="markdown"])',
  );
  const beforeCount = await wrappers.count();
  expect(beforeCount).toBe(14);

  // Source kind = first component block's kind (callout per sample-blocks fixture).
  const sourceKind = await wrappers.nth(0).getAttribute('data-skb-block-kind');

  // Click first kebab → click "Duplicate". Filter to component-block kebabs.
  await page
    .locator(
      '.skb-block-nodeview:not([data-skb-block-kind="markdown"]) .skb-block-nodeview__kebab',
    )
    .first()
    .click();
  await expect(page.locator('.skb-kebab-menu')).toHaveCount(1);
  await page
    .locator('.skb-kebab-menu .skb-kebab-menu__item[data-skb-kebab-action="duplicate"]')
    .click();

  // cf-22 follow-up 2026-05-10 — assert pulse-anchor mount FIRST,
  // BEFORE the post-insert settle wait, so we catch the anchor inside
  // its 720 ms animation window. The previous test ordering waited
  // 400 ms after click + then asserted, which races the unmount when
  // mount fires fast (e.g., 100 ms post-click → unmount at 820 ms,
  // measurement at 450 ms passed; on slow runs mount slips later +
  // unmount happens BEFORE the 400 ms wait elapses → count = 0).
  // Asserting attachment with a poll-window catches the live anchor
  // regardless of mount/unmount jitter.
  await expect(
    page.locator('[data-skb-drop-pulse-anchor]').first(),
    'cf-20e D6: Duplicate MUST mount [data-skb-drop-pulse-anchor] via the SAME cf-20c-2 dropEpoch infrastructure (consumer-side onDuplicate → pipeline.setLastDroppedFromExternal)',
  ).toBeAttached({ timeout: 1_500 });

  // Now wait for ProseMirror tr.insert + 2-rAF re-measure to settle so
  // the wrapper-count + kind assertions read the post-insert DOM.
  await page.waitForTimeout(400);

  const afterCount = await wrappers.count();
  expect(
    afterCount,
    'cf-20e Duplicate: block count MUST increase by 1 after the Duplicate action',
  ).toBe(beforeCount + 1);

  // The new SECOND block (just inserted after the first) has the same
  // kind as the source.
  const secondKindAfter = await wrappers.nth(1).getAttribute('data-skb-block-kind');
  expect(
    secondKindAfter,
    'cf-20e Duplicate: duplicated block MUST share `data-skb-block-kind` with the source (cf-20e D7 tr.insert + node.copy primitive)',
  ).toBe(sourceKind);

  // cf-22 follow-up — settle autosave before restore (see helper).
  await page.waitForTimeout(AUTOSAVE_SETTLE_MS);
  restoreSampleBlocksFixture();
});

test('cf-20e — Change-kind action mutates first block from callout → componentCode while preserving grid attrs', async ({
  page,
}) => {
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(editor.locator('.skb-block-nodeview').first()).toBeVisible({
    timeout: 10_000,
  });
  await page.waitForTimeout(500);

  // Wave 6 cf-25 — skip markdown wrapper-blocks (chunking pass adds them).
  const firstWrapper = page.locator('.skb-block-nodeview:not([data-skb-block-kind="markdown"])').first();

  // Pre-change: first block is a callout per sample-blocks fixture
  // with `col=1, colSpan=12, rowSpan=1`.
  expect(await firstWrapper.getAttribute('data-skb-block-kind')).toBe('callout');
  const colBefore = await firstWrapper.evaluate(
    (el) => (el as HTMLElement).style.gridColumn,
  );
  expect(colBefore.replace(/\s+/g, ' ').trim()).toBe('1 / span 12');

  // Click first component-kebab → click "Change kind…" → click "Code" sub-item.
  await page
    .locator(
      '.skb-block-nodeview:not([data-skb-block-kind="markdown"]) .skb-block-nodeview__kebab',
    )
    .first()
    .click();
  await expect(page.locator('.skb-kebab-menu')).toHaveCount(1);
  await page
    .locator(
      '.skb-kebab-menu .skb-kebab-menu__item[data-skb-kebab-action="change-kind-toggle"]',
    )
    .click();
  // Sub-menu now visible.
  await expect(page.locator('.skb-kebab-menu__submenu')).toHaveCount(1);
  await page
    .locator(
      '.skb-kebab-menu__submenu .skb-kebab-menu__item[data-skb-kebab-action="change-kind-componentCode"]',
    )
    .click();

  await page.waitForTimeout(300);

  // Post-change: first block kind mutated to componentCode (per the
  // cf-15b internal-name rename); grid attrs preserved.
  expect(
    await firstWrapper.getAttribute('data-skb-block-kind'),
    'cf-20e Change-kind: data-skb-block-kind MUST mutate to the picked kind (componentCode for the cf-15b internal-name rename of "code")',
  ).toBe('componentCode');
  const colAfter = await firstWrapper.evaluate(
    (el) => (el as HTMLElement).style.gridColumn,
  );
  expect(
    colAfter.replace(/\s+/g, ' ').trim(),
    'cf-20e D3 drop-and-default: grid attrs (col/colSpan/rowSpan) MUST be preserved across change-kind; only kind-specific attrs are reset to target defaults',
  ).toBe('1 / span 12');

  // Menu auto-closed post-action.
  await expect(page.locator('.skb-kebab-menu')).toHaveCount(0);

  // cf-22 follow-up — settle autosave before restore (see helper).
  await page.waitForTimeout(AUTOSAVE_SETTLE_MS);
  restoreSampleBlocksFixture();
});

test('cf-20e — kebab hidden on mobile (≤768px) per ADR-0017 D9 view-only contract', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(editor.locator('.skb-block-nodeview').first()).toBeVisible({
    timeout: 10_000,
  });

  // Kebab buttons still exist in the React tree but each has computed
  // display === 'none' per the cf-20e mobile @media rule.
  // Wave 6 cf-25 — filter to component-block kebabs only.
  const kebabs = page.locator(
    '.skb-block-nodeview:not([data-skb-block-kind="markdown"]) .skb-block-nodeview__kebab',
  );
  await expect(kebabs).toHaveCount(14);
  const firstDisplay = await kebabs.first().evaluate(
    (el) => window.getComputedStyle(el).display,
  );
  expect(firstDisplay).toBe('none');
});
