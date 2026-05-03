import { execFileSync } from 'node:child_process';
import os from 'node:os';
import { expect, test } from '@playwright/test';

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

test('A7 sample-blocks-astro page renders all 5 .astro variants', async ({ page }) => {
  await page.goto('/sample-blocks-astro');

  await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 });

  for (const kind of ['math', 'pdf', 'jupyter', 'nn-viz', 'agent-flow'] as const) {
    await expect(page.locator(`[data-block="${kind}"]`).first()).toBeVisible({
      timeout: 10_000,
    });
  }
});
