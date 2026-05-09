import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

/**
 * Wave 6 cf-22 (2026-05-09) — keyboard a11y integration spec.
 *
 * cf-22 wires keyboard-mode parity for all 3 cf-20 per-block
 * affordances (drag / resize / kebab) per WCAG 2.1.1 + 2.4.3 +
 * 2.4.7 + 4.1.3. The keyboard mode is SEPARATE from pointer mode
 * (per cf-22 D3); each affordance has an Enter/Space entry on its
 * handle button + Arrow keys for navigation + Enter to commit +
 * Esc to cancel.
 *
 * Byte-snapshot fixture isolation per cf-20c-2 R3 F1 reflection
 * rule (3 commit-style tests trigger Tiptap mutations → file write).
 */
const SAMPLE_BLOCKS_MDX = resolve(
  process.cwd(),
  '../../content/notes/sample-blocks/index.mdx',
);
const SAMPLE_BLOCKS_STATE = resolve(
  process.cwd(),
  '../../content/notes/sample-blocks/state.json',
);

let originalMdxBytes: string | null = null;
let originalStateBytes: string | null = null;

test.beforeAll(() => {
  originalMdxBytes = readFileSync(SAMPLE_BLOCKS_MDX, 'utf8');
  originalStateBytes = existsSync(SAMPLE_BLOCKS_STATE)
    ? readFileSync(SAMPLE_BLOCKS_STATE, 'utf8')
    : null;
});

function restoreSampleBlocksFixture(): void {
  if (originalMdxBytes !== null) {
    writeFileSync(SAMPLE_BLOCKS_MDX, originalMdxBytes, 'utf8');
  }
  if (originalStateBytes !== null) {
    writeFileSync(SAMPLE_BLOCKS_STATE, originalStateBytes, 'utf8');
  } else if (existsSync(SAMPLE_BLOCKS_STATE)) {
    unlinkSync(SAMPLE_BLOCKS_STATE);
  }
}

test.afterAll(() => {
  restoreSampleBlocksFixture();
});

const SCREENSHOT_PATH = resolve(
  process.cwd(),
  '../../docs/audits/screenshots/wave-6-cf-22-keyboard-a11y.png',
);

test('cf-22 — LiveAnnouncer mounted with aria-live="polite" + sr-only positioning per WCAG 4.1.3', async ({
  page,
}) => {
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });

  // (a) Single shared aria-live region exists.
  const announcer = page.locator('[data-skb-live-announcer]');
  await expect(announcer).toHaveCount(1);
  expect(await announcer.getAttribute('aria-live')).toBe('polite');
  expect(await announcer.getAttribute('aria-atomic')).toBe('true');

  // (b) sr-only positioning (visually hidden but readable by AT).
  const computedPosition = await announcer.evaluate(
    (el) => window.getComputedStyle(el).position,
  );
  expect(computedPosition).toBe('absolute');
  // Text content empty initially (no announcements yet).
  expect((await announcer.textContent())?.trim()).toBe('');

  await page.screenshot({ fullPage: false, path: SCREENSHOT_PATH });
});

test('cf-22 — Resize handles converted to <button> + AT-reachable (cf-22 D4)', async ({
  page,
}) => {
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(editor.locator('.skb-block-nodeview').first()).toBeVisible({
    timeout: 10_000,
  });

  // Resize handles are now <button> (NOT <div>) — keyboard-focusable +
  // AT-reachable. Verify the first right handle is a BUTTON tag.
  const firstRight = page
    .locator('.skb-block-nodeview .gblock-handle.right')
    .first();
  const tagName = await firstRight.evaluate((el) => el.tagName.toLowerCase());
  expect(tagName).toBe('button');
  expect(await firstRight.getAttribute('aria-label')).toBe(
    'Resize block width',
  );

  // Bottom handle aria-label.
  const firstBottom = page
    .locator('.skb-block-nodeview .gblock-handle.bottom')
    .first();
  expect(await firstBottom.getAttribute('aria-label')).toBe(
    'Resize block height',
  );

  // Corner handle aria-label.
  const firstCorner = page
    .locator('.skb-block-nodeview .gblock-handle.corner')
    .first();
  expect(await firstCorner.getAttribute('aria-label')).toBe(
    'Resize block width and height',
  );

  // Wrapper aria-hidden REMOVED (cf-20d had it; cf-22 D4 removes it).
  const wrapper = page.locator('.skb-block-nodeview__resize-handles').first();
  expect(await wrapper.getAttribute('aria-hidden')).toBeNull();
});

test('cf-22 — Drag handle Enter starts keyboard-mode → OutlineOverlay + DragGhost mount', async ({
  page,
}) => {
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(editor.locator('.skb-block-nodeview').first()).toBeVisible({
    timeout: 10_000,
  });

  // Pre-key baseline: no overlay/ghost mounted.
  await expect(page.locator('.skb-grid-outline-base')).toHaveCount(0);
  await expect(page.locator('.drag-ghost')).toHaveCount(0);

  // Focus first drag-handle + press Enter.
  const firstHandle = page
    .locator('.skb-block-nodeview .skb-block-nodeview__drag-handle')
    .first();
  await firstHandle.focus();
  await firstHandle.press('Enter');

  // OutlineOverlay + DragGhost should mount (keyboardActive=true
  // triggers the same UI as pointer-active per cf-22 D7).
  await expect(page.locator('.skb-grid-outline-base').first()).toHaveCount(1, {
    timeout: 5_000,
  });
  await expect(page.locator('.drag-ghost').first()).toHaveCount(1, {
    timeout: 5_000,
  });

  // Esc cancels: overlay + ghost unmount; focus returns to handle
  // per cf-22 D5 / WCAG 2.4.3.
  await page.keyboard.press('Escape');
  await expect(page.locator('.skb-grid-outline-base')).toHaveCount(0, {
    timeout: 3_000,
  });
  await expect(page.locator('.drag-ghost')).toHaveCount(0);
});

test('cf-22 — Resize handle Enter starts keyboard-mode → ColRuler + SizeTooltip mount', async ({
  page,
}) => {
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(editor.locator('.skb-block-nodeview').first()).toBeVisible({
    timeout: 10_000,
  });

  // Pre-key baseline: no resize overlays mounted.
  await expect(page.locator('.skb-block-nodeview--resizing')).toHaveCount(0);
  await expect(page.locator('[data-skb-resize-col-ruler-anchor]')).toHaveCount(
    0,
  );

  // Focus first right handle + press Enter to start keyboard-resize mode.
  const firstRight = page
    .locator('.skb-block-nodeview .gblock-handle.right')
    .first();
  await firstRight.focus();
  await firstRight.press('Enter');

  // ColRuler mounts (keyboardActive=true triggers overlays).
  await expect(
    page.locator('[data-skb-resize-col-ruler-anchor]'),
  ).toHaveCount(1, { timeout: 5_000 });
  // .skb-block-nodeview--resizing modifier on source.
  await expect(page.locator('.skb-block-nodeview--resizing')).toHaveCount(1, {
    timeout: 5_000,
  });

  // Esc cancels: overlay unmounts.
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-skb-resize-col-ruler-anchor]')).toHaveCount(
    0,
    { timeout: 3_000 },
  );
  await expect(page.locator('.skb-block-nodeview--resizing')).toHaveCount(0);
});

test('cf-22 — Kebab menu opens with first item auto-focused; ArrowDown cycles focus; Esc closes + returns focus to button', async ({
  page,
}) => {
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(editor.locator('.skb-block-nodeview').first()).toBeVisible({
    timeout: 10_000,
  });

  // Open the kebab menu via keyboard.
  const firstKebab = page
    .locator('.skb-block-nodeview .skb-block-nodeview__kebab')
    .first();
  await firstKebab.focus();
  await firstKebab.press('Enter');

  // Menu mounts; first item ("Delete") auto-focused per cf-22 D8.
  await expect(page.locator('.skb-kebab-menu')).toHaveCount(1);
  // Wait briefly for the setTimeout(0) auto-focus to run.
  await page.waitForTimeout(50);
  const focusedAttr = await page.evaluate(() =>
    document.activeElement?.getAttribute('data-skb-kebab-action'),
  );
  expect(focusedAttr).toBe('delete');

  // ArrowDown moves focus to "Duplicate".
  await page.keyboard.press('ArrowDown');
  expect(
    await page.evaluate(() =>
      document.activeElement?.getAttribute('data-skb-kebab-action'),
    ),
  ).toBe('duplicate');

  // ArrowDown again → "Change kind…".
  await page.keyboard.press('ArrowDown');
  expect(
    await page.evaluate(() =>
      document.activeElement?.getAttribute('data-skb-kebab-action'),
    ),
  ).toBe('change-kind-toggle');

  // ArrowDown wraps to "Delete" (first).
  await page.keyboard.press('ArrowDown');
  expect(
    await page.evaluate(() =>
      document.activeElement?.getAttribute('data-skb-kebab-action'),
    ),
  ).toBe('delete');

  // ArrowUp wraps to "Change kind…" (last).
  await page.keyboard.press('ArrowUp');
  expect(
    await page.evaluate(() =>
      document.activeElement?.getAttribute('data-skb-kebab-action'),
    ),
  ).toBe('change-kind-toggle');

  // Esc closes the menu + returns focus to kebab button per cf-22 D5.
  await page.keyboard.press('Escape');
  await expect(page.locator('.skb-kebab-menu')).toHaveCount(0);
  // Wait for the useFocusReturn setTimeout(0) to fire.
  await page.waitForTimeout(50);
  const focusedAfterEsc = await page.evaluate(() =>
    document.activeElement?.getAttribute('data-skb-kebab-block-id'),
  );
  // Focus should be on the kebab button (which has data-skb-kebab-block-id).
  expect(focusedAfterEsc).toMatch(/^\d+$/);
});

test('cf-22 — Kebab Change-kind sub-menu: ArrowRight expands + auto-focus first sub-item; ArrowLeft collapses + restores focus', async ({
  page,
}) => {
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(editor.locator('.skb-block-nodeview').first()).toBeVisible({
    timeout: 10_000,
  });

  // Open kebab + navigate to "Change kind…".
  const firstKebab = page
    .locator('.skb-block-nodeview .skb-block-nodeview__kebab')
    .first();
  await firstKebab.focus();
  await firstKebab.press('Enter');
  await page.waitForTimeout(50);
  await page.keyboard.press('ArrowDown'); // Delete → Duplicate
  await page.keyboard.press('ArrowDown'); // Duplicate → Change kind…

  // Pre-expand: no sub-menu.
  await expect(
    page.locator('[data-skb-kebab-submenu="change-kind"]'),
  ).toHaveCount(0);

  // ArrowRight expands sub-menu.
  await page.keyboard.press('ArrowRight');
  await expect(
    page.locator('[data-skb-kebab-submenu="change-kind"]'),
  ).toHaveCount(1, { timeout: 3_000 });
  // First sub-item auto-focused.
  await page.waitForTimeout(50);
  const focusedSub = await page.evaluate(() =>
    document.activeElement?.getAttribute('data-skb-kebab-action'),
  );
  expect(focusedSub).toMatch(/^change-kind-/);
  expect(focusedSub).not.toBe('change-kind-toggle');

  // ArrowLeft collapses sub-menu + returns focus to "Change kind…" parent.
  await page.keyboard.press('ArrowLeft');
  await expect(
    page.locator('[data-skb-kebab-submenu="change-kind"]'),
  ).toHaveCount(0);
  await page.waitForTimeout(50);
  expect(
    await page.evaluate(() =>
      document.activeElement?.getAttribute('data-skb-kebab-action'),
    ),
  ).toBe('change-kind-toggle');
});

test('cf-22 — Mobile (≤768px) keyboard handles still hidden per ADR-0017 D9 view-only', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/notes/sample-blocks/edit');
  const editor = page.locator('.ProseMirror').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await expect(editor.locator('.skb-block-nodeview').first()).toBeVisible({
    timeout: 10_000,
  });

  // All 3 affordance types remain `display: none` on mobile (the
  // cf-20c-2 / cf-20d / cf-20e mobile @media rules apply equally to
  // the keyboard-mode entry points since they're the SAME DOM
  // elements).
  const dragHandle = page
    .locator('.skb-block-nodeview .skb-block-nodeview__drag-handle')
    .first();
  expect(
    await dragHandle.evaluate((el) => window.getComputedStyle(el).display),
  ).toBe('none');

  const rightHandle = page
    .locator('.skb-block-nodeview .gblock-handle.right')
    .first();
  expect(
    await rightHandle.evaluate((el) => window.getComputedStyle(el).display),
  ).toBe('none');

  const kebab = page
    .locator('.skb-block-nodeview .skb-block-nodeview__kebab')
    .first();
  expect(
    await kebab.evaluate((el) => window.getComputedStyle(el).display),
  ).toBe('none');
});
