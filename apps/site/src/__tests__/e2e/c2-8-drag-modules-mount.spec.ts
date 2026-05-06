import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, '../../../../..');
const moduleErrorPattern = /drop-pulse|drag-ghost|esc-cancel|layout-reducer/i;

test.describe('drag modules mount + Esc native passthrough', () => {
  test("drag modules mount + Esc native passthrough", async ({ page }) => {
    const moduleErrors: string[] = [];
    page.on('pageerror', (error) => {
      if (moduleErrorPattern.test(error.message)) moduleErrors.push(error.message);
    });
    page.on('console', (message) => {
      if (message.type() === 'error' && moduleErrorPattern.test(message.text())) {
        moduleErrors.push(message.text());
      }
    });

    await page.goto('/notes/sample-blocks/edit');

    const grid = page.locator('.skb-grid').first();
    await expect(grid).toBeVisible({ timeout: 10_000 });

    const editor = page.locator('.ProseMirror').first();
    await expect(editor).toBeVisible({ timeout: 10_000 });
    await expect(editor).toHaveAttribute('contenteditable', 'true');

    await page.keyboard.press('Escape');

    await expect(grid).toBeVisible();
    await expect(editor).toBeVisible();
    expect(moduleErrors).toEqual([]);

    await editor.evaluate((element) => {
      const targetWindow = window as Window & { __skbFocusEvents?: string[] };
      targetWindow.__skbFocusEvents = [];
      element.addEventListener('focus', () => targetWindow.__skbFocusEvents?.push('focus'));
      element.addEventListener('blur', () => targetWindow.__skbFocusEvents?.push('blur'));
    });

    await editor.click();
    await expect(editor).toBeFocused();
    await page.locator('h1').first().click();
    await expect(editor).not.toBeFocused();

    const focusEvents = await page.evaluate(() => {
      return (window as Window & { __skbFocusEvents?: string[] }).__skbFocusEvents ?? [];
    });
    expect(focusEvents).toEqual(expect.arrayContaining(['focus', 'blur']));

    const archivePath = resolve(
      workspaceRoot,
      'docs/audits/screenshots/wave-5-c2-8-drag-modules-mount.png',
    );
    if (!existsSync(dirname(archivePath))) {
      mkdirSync(dirname(archivePath), { recursive: true });
    }
    await page.screenshot({ path: archivePath, fullPage: false });
  });
});
