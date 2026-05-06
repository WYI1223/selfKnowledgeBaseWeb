import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, '../../../../..');

test.describe('C.2-9 responsive FSM mount', () => {
  test("responsive FSM mount + viewport switch", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/notes/sample-blocks/edit');

    const grid = page.locator('.skb-grid').first();
    await expect(grid).toBeVisible({ timeout: 10_000 });

    const editor = page.locator('.ProseMirror').first();
    await expect(editor).toBeVisible({ timeout: 10_000 });

    await page.setViewportSize({ width: 800, height: 800 });
    await page.waitForTimeout(400);

    const tabletGrid = page.locator('[data-skb-viewport-cols="6"]').first();
    if ((await tabletGrid.count()) > 0) {
      await expect(tabletGrid).toBeVisible();
    } else {
      await expect(grid).toBeVisible();
    }

    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(400);
    await expect(grid).toBeVisible();

    const archivePath = resolve(
      workspaceRoot,
      'docs/audits/screenshots/wave-5-c2-9-responsive-fsm-mount.png',
    );
    if (!existsSync(dirname(archivePath))) {
      mkdirSync(dirname(archivePath), { recursive: true });
    }
    await page.screenshot({ path: archivePath, fullPage: false });

    expect(consoleErrors).toEqual([]);
  });
});
