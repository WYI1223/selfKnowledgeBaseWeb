import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, '../../../../..');

test.describe('C.4-3 toolbar', () => {
  test('toolbar bold/italic toggles Tiptap marks', async ({ page }) => {
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
    await page.keyboard.type('affordance');
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');

    const toolbar = page.getByRole('toolbar', { name: 'Text formatting' });
    await expect(toolbar).toBeVisible();
    await toolbar.getByRole('button', { name: 'Bold' }).click();
    await toolbar.getByRole('button', { name: 'Italic' }).click();

    await expect(editor.locator('strong').first()).toBeVisible();
    await expect(editor.locator('em').first()).toBeVisible();

    const archivePath = resolve(
      workspaceRoot,
      'docs/audits/screenshots/wave-5-c4-3-toolbar.png',
    );
    if (!existsSync(dirname(archivePath))) mkdirSync(dirname(archivePath), { recursive: true });
    await page.screenshot({ path: archivePath, fullPage: false });
    expect(statSync(archivePath).size).toBeGreaterThanOrEqual(5_000);
  });
});
