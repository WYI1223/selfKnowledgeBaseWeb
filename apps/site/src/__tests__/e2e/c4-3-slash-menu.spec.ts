import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, '../../../../..');

test.describe('C.4-3 slash menu', () => {
  test('slash menu (/) opens + insert block on kind select', async ({ page }) => {
    await page.addInitScript(() => {
      document.documentElement?.removeAttribute('data-theme');
      try {
        window.localStorage.removeItem('skb-theme');
        window.localStorage.removeItem('skb-note:sample-mdx-note');
      } catch {
        // Storage can be unavailable in hardened browser contexts.
      }
    });

    await page.goto('/notes/sample-mdx-note/edit');
    const editor = page.locator('.ProseMirror').first();
    await expect(editor).toBeVisible({ timeout: 10_000 });

    await editor.click();
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('/');

    const menu = page.getByRole('menu', { name: 'Slash block menu' });
    await expect(menu).toBeVisible();
    await menu.getByRole('menuitem', { name: 'Callout' }).click();

    await expect(page.locator('[data-skb-block-kind="callout"]').first()).toBeVisible();
    await expect(editor).toContainText('Callout');

    const archivePath = resolve(
      workspaceRoot,
      'docs/audits/screenshots/wave-5-c4-3-slash-menu.png',
    );
    if (!existsSync(dirname(archivePath))) mkdirSync(dirname(archivePath), { recursive: true });
    await page.screenshot({ path: archivePath, fullPage: false });
    expect(statSync(archivePath).size).toBeGreaterThanOrEqual(5_000);
  });
});
