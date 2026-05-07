import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, '../../../../..');

test.describe('C.4-3 drag handle', () => {
  test('drag-handle visible per block + drag triggers grid drop preview', async ({ page }) => {
    await page.addInitScript(() => {
      document.documentElement?.removeAttribute('data-theme');
      try {
        window.localStorage.removeItem('skb-theme');
      } catch {
        // Storage can be unavailable in hardened browser contexts.
      }
    });

    await page.goto('/notes/sample-mdx-note/edit');
    const grid = page.locator('.skb-grid').first();
    await expect(grid).toBeVisible({ timeout: 10_000 });

    const handle = page.locator('[data-skb-drag-handle]').first();
    await expect(handle).toBeVisible();

    const box = await handle.boundingBox();
    const gridBox = await grid.boundingBox();
    expect(box).not.toBeNull();
    expect(gridBox).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(gridBox!.x + gridBox!.width / 2, gridBox!.y + 24);
    await page.mouse.up();

    await expect(page.locator('[data-skb-drop-preview="true"]').first()).toBeVisible();

    const archivePath = resolve(
      workspaceRoot,
      'docs/audits/screenshots/wave-5-c4-3-drag-handle.png',
    );
    if (!existsSync(dirname(archivePath))) mkdirSync(dirname(archivePath), { recursive: true });
    await page.screenshot({ path: archivePath, fullPage: false });
    expect(statSync(archivePath).size).toBeGreaterThanOrEqual(5_000);
  });
});
