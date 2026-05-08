import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { attachApiStub } from './api-stub';

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, '../../../../..');

test.describe('C.4-3 save state indicator', () => {
  test('save state indicator transitions saving -> saved on edit', async ({ page }) => {
    // Wave 6 B.4: stub the API so the spec doesn't mutate the real
    // sample-mdx-note fixture and the Saving... transient state is
    // reliably observable (default 100ms POST delay). Capture the
    // handle so we can additionally prove the save reached the
    // ApiAdapter primary path (vs a regression to LocalStorageAdapter-only).
    const apiStub = await attachApiStub(page);

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

    // Wave 6 B.4: prove the save reached the ApiAdapter primary path.
    // Without this assertion the test would still pass against a
    // regression that flipped back to LocalStorageAdapter-only.
    expect(apiStub.hasObservedPost()).toBe(true);
    const persisted = apiStub.read('sample-mdx-note') as { mdxSource?: string } | null;
    expect(persisted?.mdxSource).toEqual(expect.stringContaining('saved-state'));

    const archivePath = resolve(
      workspaceRoot,
      'docs/audits/screenshots/wave-5-c4-3-save-indicator.png',
    );
    if (!existsSync(dirname(archivePath))) mkdirSync(dirname(archivePath), { recursive: true });
    await page.screenshot({ path: archivePath, fullPage: false });
    expect(statSync(archivePath).size).toBeGreaterThanOrEqual(5_000);
  });
});
