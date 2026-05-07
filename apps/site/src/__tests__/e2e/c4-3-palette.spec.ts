import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, '../../../../..');

test.describe('C.4-3 palette', () => {
  test('palette opens via shortcut + lists block kinds', async ({ page }) => {
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
    await expect(page.locator('.ProseMirror').first()).toBeVisible({ timeout: 10_000 });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
    const palette = page.getByRole('dialog', { name: 'Block palette' });
    await expect(palette).toBeVisible();

    for (const label of [
      'Callout',
      'Code',
      'Image',
      'Math',
      'Pdf',
      'Jupyter',
      'NN Viz',
      'Agent Flow',
    ]) {
      await expect(palette.getByRole('button', { name: label })).toBeVisible();
    }

    const archivePath = resolve(
      workspaceRoot,
      'docs/audits/screenshots/wave-5-c4-3-palette.png',
    );
    if (!existsSync(dirname(archivePath))) mkdirSync(dirname(archivePath), { recursive: true });
    await page.screenshot({ path: archivePath, fullPage: false });
    expect(statSync(archivePath).size).toBeGreaterThanOrEqual(5_000);
  });
});
