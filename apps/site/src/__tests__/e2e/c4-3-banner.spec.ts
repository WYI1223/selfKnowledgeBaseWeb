import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, '../../../../..');

test.describe('C.4-3 edit mode banner', () => {
  test('Edit Mode banner visible on /notes/<slug>/edit not on /notes/<slug>', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      document.documentElement?.removeAttribute('data-theme');
      try {
        window.localStorage.removeItem('skb-theme');
      } catch {
        // Storage can be unavailable in hardened browser contexts.
      }
    });

    await page.goto('/notes/sample-mdx-note');
    await expect(page.getByText('Edit Mode')).toHaveCount(0);

    await page.goto('/notes/sample-mdx-note/edit');
    await expect(page.getByText(/Edit Mode/)).toBeVisible({ timeout: 10_000 });

    const archivePath = resolve(
      workspaceRoot,
      'docs/audits/screenshots/wave-5-c4-3-banner.png',
    );
    if (!existsSync(dirname(archivePath))) mkdirSync(dirname(archivePath), { recursive: true });
    await page.screenshot({ path: archivePath, fullPage: false });
    expect(statSync(archivePath).size).toBeGreaterThanOrEqual(5_000);
  });
});
