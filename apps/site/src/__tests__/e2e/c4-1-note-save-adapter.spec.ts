import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, '../../../../..');
const saveAdapterSource = readFileSync(
  resolve(workspaceRoot, 'packages/editor-shell/src/save-adapter.ts'),
  'utf8',
);

test.describe('C.4-1 NoteSaveAdapter contract (Wave 6 B.3 update)', () => {
  test('/notes/[slug]/edit mounts; save-adapter exposes both LocalStorageAdapter and ApiAdapter', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (error) => consoleErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.addInitScript(() => {
      document.documentElement?.removeAttribute('data-theme');
      try {
        window.localStorage.removeItem('skb-theme');
      } catch {
        // Storage can be unavailable in hardened browser contexts.
      }
    });

    const response = await page.goto('/notes/sample-blocks/edit');
    if (response?.status() === 404) {
      await page.goto('/notes/sample-mdx-note/edit');
    }
    await page.waitForLoadState('domcontentloaded');

    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );
    expect(theme).not.toBe('dark');

    const grid = page.locator('.skb-grid').first();
    await expect(grid).toBeVisible({ timeout: 10_000 });

    const editor = page.locator('.ProseMirror').first();
    await expect(editor).toBeVisible({ timeout: 10_000 });
    await expect(editor).toHaveAttribute('contenteditable', 'true');
    expect(consoleErrors).toEqual([]);

    // Wave 6 B.3 promotes ApiAdapter from forward-stub to first-class
    // public surface per ADR-0018 v0.6 D11. Both adapters must be
    // executable; the C.4-1 era "comment-only" assertion is intentionally
    // inverted here.
    expect(saveAdapterSource).toMatch(/export class LocalStorageAdapter/);
    expect(saveAdapterSource).toMatch(/export class ApiAdapter/);
    expect(saveAdapterSource).not.toContain(
      '// TODO Phase 2+ ApiAdapter implementing NoteSaveAdapter for /api/notes endpoint',
    );

    const archivePath = resolve(
      workspaceRoot,
      'docs/audits/screenshots/wave-5-c4-1-note-save-adapter.png',
    );
    if (!existsSync(dirname(archivePath))) {
      mkdirSync(dirname(archivePath), { recursive: true });
    }
    await page.screenshot({ path: archivePath, fullPage: false });
    expect(statSync(archivePath).size).toBeGreaterThanOrEqual(5_000);
  });
});
