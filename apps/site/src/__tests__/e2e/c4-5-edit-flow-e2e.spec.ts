import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { attachApiStub } from './api-stub';

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, '../../../../..');
const noteKey = 'skb-note:sample-mdx-note';
const slug = 'sample-mdx-note';

interface SerializedNoteState {
  mdxSource?: unknown;
  version?: unknown;
}

test.describe('C.4-5 Stage C.4 close ceremony (Wave 6 B.4 update — API primary)', () => {
  test('Stage C.4 close — load → edit → save → reload sequence + 10-item MVP coverage manifest', async ({
    page,
  }) => {
    const apiStub = await attachApiStub(page);

    await page.addInitScript((storageKey) => {
      document.documentElement?.removeAttribute('data-theme');
      try {
        window.localStorage.removeItem('skb-theme');
        if (window.sessionStorage.getItem('skb-c4-5-cleared') !== 'true') {
          window.localStorage.removeItem(storageKey);
          window.sessionStorage.setItem('skb-c4-5-cleared', 'true');
        }
      } catch {
        // Storage can be unavailable in hardened browser contexts.
      }
    }, noteKey);

    // Stage C.4 close ceremony: verify load → edit → save → reload sequence
    // ties together the editor wire-to-apps/site infrastructure shipped
    // across C.4-prelude (#72) + C.4-1 (#92) + C.4-2 (#93) + C.4-3 (#94) +
    // C.4-4 (#95). 10-item MVP coverage manifest documented at
    // docs/plans/wave-5-main/C.4-handoff-pack.md.

    await page.goto('/notes/sample-mdx-note/edit');
    const editor = page.locator('.ProseMirror').first();
    await expect(editor).toBeVisible({ timeout: 10_000 });
    const grid = page.locator('.skb-grid').first();
    await expect(grid).toBeVisible({ timeout: 10_000 });

    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).not.toBe('dark');

    // Edit Mode banner visible (mvp-1)
    await expect(page.getByText(/Edit Mode/)).toBeVisible({ timeout: 10_000 });

    // Type known content + wait debounce + save
    await editor.click();
    await page.keyboard.type(' Stage C.4 close');
    await expect(editor).toContainText('Stage C.4 close', { timeout: 5_000 });
    await page.waitForTimeout(1_000);

    // Save indicator shows /Saved/ (mvp-6)
    const indicator = page.locator('[data-skb-save-indicator]').first();
    await expect(indicator).toContainText(/Saved/, { timeout: 5_000 });

    // Wave 6 B.4: assert API persistence (mvp-7) via the stub's in-memory
    // store. localStorage is reserved as a fallback ONLY on API failure.
    expect(apiStub.hasObservedPost()).toBe(true);
    const savedState = apiStub.read(slug) as SerializedNoteState | null;
    expect(savedState).not.toBeNull();
    expect(savedState?.version as number).toBeGreaterThanOrEqual(2);
    expect(savedState?.mdxSource).toEqual(expect.stringContaining('Stage C.4 close'));

    // Reload preserves content
    await page.reload();
    await expect(editor).toBeVisible({ timeout: 10_000 });
    await expect(editor).toContainText('Stage C.4 close', { timeout: 10_000 });

    const archivePath = resolve(
      workspaceRoot,
      'docs/audits/screenshots/wave-5-c4-5-edit-flow-e2e.png',
    );
    if (!existsSync(dirname(archivePath))) mkdirSync(dirname(archivePath), { recursive: true });
    await page.screenshot({ path: archivePath, fullPage: false });
    expect(statSync(archivePath).size).toBeGreaterThanOrEqual(5_000);
  });
});
