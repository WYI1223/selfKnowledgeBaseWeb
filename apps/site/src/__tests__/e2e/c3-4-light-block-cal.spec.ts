import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, '../../../../..');

test.describe('C.3-4 shadow warm-tone refresh', () => {
  test('shadow tokens carry warm-tone rgba(20,15,10) values', async ({ page }) => {
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

    // Read --shadow-sm/md/lg CSS variables and verify warm-tone rgba(20, 15, 10) values
    // per ADR-0018 D6 (in-place value update from neutral rgba(0,0,0) to warm-tone).
    const shadows = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        sm: style.getPropertyValue('--shadow-sm').trim(),
        md: style.getPropertyValue('--shadow-md').trim(),
        lg: style.getPropertyValue('--shadow-lg').trim(),
      };
    });

    expect(shadows.sm).toContain('rgba(20, 15, 10');
    expect(shadows.md).toContain('rgba(20, 15, 10');
    expect(shadows.lg).toContain('rgba(20, 15, 10');

    // Scope-fence: ensure no neutral rgba(0,0,0) remains in light-theme shadow values
    expect(shadows.sm).not.toContain('rgba(0, 0, 0');
    expect(shadows.md).not.toContain('rgba(0, 0, 0');
    expect(shadows.lg).not.toContain('rgba(0, 0, 0');

    const archivePath = resolve(
      workspaceRoot,
      'docs/audits/screenshots/wave-5-c3-4-light-block-cal.png',
    );
    if (!existsSync(dirname(archivePath))) {
      mkdirSync(dirname(archivePath), { recursive: true });
    }
    await page.screenshot({ path: archivePath, fullPage: false });
  });
});
