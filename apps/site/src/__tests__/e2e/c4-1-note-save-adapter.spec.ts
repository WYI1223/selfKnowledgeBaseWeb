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
const executableApiAdapterPattern =
  /class\s+ApiAdapter|interface\s+ApiAdapter|export\s+(const|function|class|interface)\s+ApiAdapter|import.*ApiAdapter\s+from/;

function countExecutableApiAdapterForms(source: string): number {
  return source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('//'))
    .filter((line) => executableApiAdapterPattern.test(line)).length;
}

test.describe('C.4-1 NoteSaveAdapter contract', () => {
  test('/notes/[slug]/edit mounts; ApiAdapter forward-stub COMMENT-only enforcement', async ({
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

    expect(saveAdapterSource).toContain(
      '// TODO Phase 2+ ApiAdapter implementing NoteSaveAdapter for /api/notes endpoint',
    );
    expect(countExecutableApiAdapterForms(saveAdapterSource)).toBe(0);

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
