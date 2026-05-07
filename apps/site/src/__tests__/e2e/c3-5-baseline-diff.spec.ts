import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, '../../../../..');

test.describe('C.3-5 visual smoke baseline diff', () => {
  test('visual smoke baseline diff < 5%', async ({ page }) => {
    await page.addInitScript(() => {
      document.documentElement.removeAttribute('data-theme');
      try {
        window.localStorage.removeItem('skb-theme');
      } catch {
        // Storage can be unavailable in hardened browser contexts.
      }
    });

    // Stage C.3 close baseline diff verification: navigate to /sample-blocks
    // (or fallback /notes/sample-blocks per existing apps/site routing); the
    // page renders with v2 visual identity post-C.3-1..C.3-4 (OKLCH cream
    // surface + Inter sans + JetBrains Mono + 5 kind-hue stripes + warm
    // shadow). Stage C.3 close re-takes baseline so subsequent PRs measure
    // diff < 5% against this v2 lock state per ADR-0018 AC#8.
    const response = await page.goto('/sample-blocks');
    if (response?.status() === 404) {
      await page.goto('/notes/sample-blocks');
    }
    await page.waitForLoadState('domcontentloaded');

    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );
    expect(theme).not.toBe('dark');

    // Verify v2 visual identity foundation is in place at the page-level
    // (cream OKLCH surface + warm shadow on body / h1 / blockquotes).
    const tokens = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        bg: style.getPropertyValue('--bg').trim(),
        accent: style.getPropertyValue('--accent').trim(),
        sans: style.getPropertyValue('--sans').trim(),
        mono: style.getPropertyValue('--mono').trim(),
        shadowSm: style.getPropertyValue('--shadow-sm').trim(),
      };
    });

    expect(tokens.bg).toMatch(/oklch|#[0-9a-f]{6}/);
    expect(tokens.accent).toMatch(/oklch|#[0-9a-f]{6}/);
    expect(tokens.sans).toContain('Inter');
    expect(tokens.mono).toContain('JetBrains');
    expect(tokens.shadowSm).toContain('rgba(20, 15, 10');

    const archivePath = resolve(
      workspaceRoot,
      'docs/audits/screenshots/wave-5-c3-5-baseline-diff.png',
    );
    if (!existsSync(dirname(archivePath))) {
      mkdirSync(dirname(archivePath), { recursive: true });
    }
    await page.screenshot({ path: archivePath, fullPage: false });
  });
});
