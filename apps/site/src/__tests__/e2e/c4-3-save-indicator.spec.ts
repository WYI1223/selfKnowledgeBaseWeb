import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, '../../../../..');

test.describe('C.4-3 save state indicator', () => {
  test('save state indicator transitions saving -> saved on edit', async ({ page }) => {
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
    await page.keyboard.type(' saved-state');

    const indicator = page.locator('[data-skb-save-indicator]').first();
    await expect(indicator).toContainText('Unsaved changes');
    await expect(indicator).toContainText('Saving...', { timeout: 2_000 });
    await expect(indicator).toContainText(/Saved at/, { timeout: 5_000 });

    const archivePath = resolve(
      workspaceRoot,
      'docs/audits/screenshots/wave-5-c4-3-save-indicator.png',
    );
    if (!existsSync(dirname(archivePath))) mkdirSync(dirname(archivePath), { recursive: true });
    await page.screenshot({ path: archivePath, fullPage: false });
    expect(statSync(archivePath).size).toBeGreaterThanOrEqual(5_000);
  });
});
