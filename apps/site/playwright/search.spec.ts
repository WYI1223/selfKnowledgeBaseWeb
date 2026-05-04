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

async function visibleResultTexts(page: Page): Promise<string[]> {
  return page
    .locator('#search li.pagefind-ui__result:not([data-skb-word-level-mismatch="true"])')
    .allTextContents();
}

test('a11y smoke', async ({ page }) => {
  await page.goto('/search');
  const searchInput = await focusSearchInputWithTab(page);

  await searchInput.pressSequentially('callout');

  await expect(page.locator('.pagefind-ui__result').first()).toBeVisible({ timeout: 10_000 });
});

test('CJK indexing — paired discriminator (ADR-0012 v0.1.1; word-level filter restored via isWordLevelMatch)', async ({
  page,
}) => {
  // ADR-0012 v0.1.1 keeps PageFind's CJK index-time artifact contract
  // and restores the runtime paired discriminator app-side. B1a shipped
  // `isWordLevelMatch`; B1b wires it into SearchBox.astro with the
  // PagefindUI processResult callback plus a DOM visibility filter.
  // The positive query (`笔记` -> `中文笔记测试`) and inverse query
  // (`记本` must not show `笔记本电脑`) are enforced together here.
  await page.goto('/search');
  const searchInput = await focusSearchInputWithTab(page);

  await searchInput.pressSequentially('笔记');
  await expect
    .poll(async () => (await visibleResultTexts(page)).join('\n'), { timeout: 10_000 })
    .toContain('中文笔记测试');

  await searchInput.fill('');
  await searchInput.pressSequentially('记本');
  await expect
    .poll(async () => page.locator('#search li.pagefind-ui__result').count(), { timeout: 10_000 })
    .toBeGreaterThan(0);
  await expect
    .poll(async () => (await visibleResultTexts(page)).join('\n'), { timeout: 10_000 })
    .not.toContain('笔记本电脑');

  await expect
    .poll(
      async () => {
        const visibleCount = await page
          .locator('#search li.pagefind-ui__result:not([data-skb-word-level-mismatch="true"])')
          .count();
        const totalCount = await page.locator('#search li.pagefind-ui__result').count();
        const messageText = await page.locator('#search .pagefind-ui__message').textContent();
        return messageText?.includes(`${visibleCount}/${totalCount}`) ?? false;
      },
      { timeout: 10_000 },
    )
    .toBe(true);
});
