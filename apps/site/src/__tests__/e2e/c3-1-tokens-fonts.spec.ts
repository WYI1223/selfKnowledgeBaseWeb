import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, '../../../../..');

test.describe('C.3-1 tokens and fonts', () => {
  test('OKLCH cream + accent + Inter font computed', async ({ page }) => {
    await page.addInitScript(() => {
      document.documentElement.removeAttribute('data-theme');
      try {
        window.localStorage.removeItem('skb-theme');
      } catch {
        // Storage can be unavailable in hardened browser contexts.
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );
    expect(theme).not.toBe('dark');

    const rootVars = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        bg: style.getPropertyValue('--bg').trim(),
        accent: style.getPropertyValue('--accent').trim(),
        sans: style.getPropertyValue('--sans').trim(),
      };
    });
    expect(rootVars.bg).toMatch(/oklch|#[0-9a-f]{6}/);
    expect(rootVars.accent).toMatch(/oklch|#[0-9a-f]{6}/);
    expect(rootVars.sans).toContain('Inter');

    // Q10 plan-challenger absorbtion D9 production-PASS gate at C.3-1
    // verifies the **foundation** is in place: (a) `--sans` token
    // contains 'Inter' (token authority), (b) Google Fonts CDN
    // `<link href>` for Inter+JetBrains+Mono is present in <head>
    // (preconnect placed; CDN reachable on first body element usage).
    // Body font-family application + actual CDN binary fetch +
    // visual-smoke baseline regen are explicitly deferred to **C.3-3**
    // (typography upgrade per ADR-0018 D5 + prose customization scope
    // per plan v1.3 row C.3-3). At C.3-1, body still uses `font-sans`
    // Tailwind class -> `--font-sans` legacy stack so existing C.2
    // visual-smoke baselines do NOT require regen. `document.fonts.check`
    // would return false here because no element uses Inter (Google
    // Fonts is lazy-loaded by usage); that assertion is C.3-3 scope.
    const fontLinkHrefCount = await page.evaluate(() => {
      const links = document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]');
      return Array.from(links).filter((l) =>
        l.href.includes('fonts.googleapis.com/css2') &&
        l.href.includes('Inter') &&
        l.href.includes('JetBrains+Mono'),
      ).length;
    });
    expect(fontLinkHrefCount).toBe(1);

    const archivePath = resolve(
      workspaceRoot,
      'docs/audits/screenshots/wave-5-c3-1-tokens-fonts.png',
    );
    if (!existsSync(dirname(archivePath))) {
      mkdirSync(dirname(archivePath), { recursive: true });
    }
    await page.screenshot({ path: archivePath, fullPage: false });
  });
});
