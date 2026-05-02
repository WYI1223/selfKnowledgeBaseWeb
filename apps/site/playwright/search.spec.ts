import { execFileSync } from 'node:child_process';
import os from 'node:os';
import { expect, test, type Page } from '@playwright/test';

function isWsl2(): boolean {
  if (/microsoft|wsl/i.test(os.release())) {
    return true;
  }

  try {
    return /microsoft|wsl/i.test(execFileSync('uname', ['-r'], { encoding: 'utf8' }));
  } catch {
    return false;
  }
}

test.skip(isWsl2(), 'Chromium launch is unreliable under WSL2 in this repo');

async function focusSearchInputWithTab(page: Page) {
  const searchInput = page.locator('#search input[type="text"], #search input[type="search"]');
  await expect(searchInput).toBeVisible({ timeout: 10_000 });

  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press('Tab');
    const focusedSearch = await searchInput.evaluate((input) => document.activeElement === input);
    if (focusedSearch) {
      return searchInput;
    }
  }

  throw new Error('Search input was not reachable via Tab');
}

async function resultTexts(page: Page): Promise<string[]> {
  await expect(page.locator('.pagefind-ui__result').first()).toBeVisible({ timeout: 10_000 });
  return page.locator('.pagefind-ui__result').allTextContents();
}

async function stableResultTexts(page: Page): Promise<string[]> {
  const results = page.locator('.pagefind-ui__result');
  let previousCount = -1;
  let stableReads = 0;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    await page.waitForTimeout(250);
    const count = await results.count();
    stableReads = count === previousCount ? stableReads + 1 : 0;
    previousCount = count;
    if (stableReads >= 2) {
      return results.allTextContents();
    }
  }

  return results.allTextContents();
}

test('a11y smoke', async ({ page }) => {
  await page.goto('/search');
  const searchInput = await focusSearchInputWithTab(page);

  await searchInput.pressSequentially('callout');

  await expect(page.locator('.pagefind-ui__result').first()).toBeVisible({ timeout: 10_000 });
});

test('CJK paired discriminator (ADR-0012 criterion 4)', async ({ page }) => {
  await page.goto('/search');
  const searchInput = await focusSearchInputWithTab(page);

  await searchInput.pressSequentially('笔记');
  await expect
    .poll(async () => (await resultTexts(page)).join('\n'), { timeout: 10_000 })
    .toContain('中文笔记测试');

  await searchInput.fill('');
  await searchInput.pressSequentially('记本');

  await expect
    .poll(async () => (await stableResultTexts(page)).join('\n'), { timeout: 10_000 })
    .not.toContain('笔记本电脑');
});
