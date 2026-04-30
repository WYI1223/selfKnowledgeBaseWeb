import { test, expect } from '@playwright/test';

test('home page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('detail page renders sample note with single H1', async ({ page }) => {
  await page.goto('/notes/sample-mdx-note');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
});

test('theme toggle switches data-theme to dark', async ({ page }) => {
  await page.goto('/');
  // ThemeToggle is an Astro `client:load` React island; the onClick listener
  // attaches only after hydration completes. Playwright's actionability check
  // (visible+enabled) does not wait for listener attach, so click() can be
  // dropped on slow CI runners. networkidle is the canonical proxy for
  // hydration-complete on a static Astro site (all initial fetches settled).
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Switch to (dark|light) mode/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', /^dark$/);
});
