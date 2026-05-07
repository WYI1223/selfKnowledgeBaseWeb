import { expect, test, type Locator } from '@playwright/test';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, '../../../../..');

type BlockHueTarget = {
  name: string;
  selector: string;
  expectedToken: string;
};

const blockHueTargets: BlockHueTarget[] = [
  {
    name: 'callout',
    selector: '[data-callout-variant]',
    expectedToken: '--accent-runnable',
  },
  {
    name: 'code',
    selector: '[data-code-language]',
    expectedToken: '--accent-runnable',
  },
  {
    name: 'image',
    selector: '[data-image-loading]',
    expectedToken: '--accent-image',
  },
  {
    name: 'math',
    selector: '[data-block="math"][data-display="true"]',
    expectedToken: '--accent-math',
  },
  {
    name: 'pdf',
    selector: '[data-block="pdf"]',
    expectedToken: '--accent-pdf',
  },
] as const;

async function readTopBorder(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      color: style.borderTopColor,
      style: style.borderTopStyle,
      width: style.borderTopWidth,
    };
  });
}

test.describe('C.3-2 block kind hue accents', () => {
  test('5 light blocks render mapped top hue accents', async ({ page }) => {
    await page.addInitScript(() => {
      document.documentElement.removeAttribute('data-theme');
      try {
        window.localStorage.removeItem('skb-theme');
      } catch {
        // Storage can be unavailable in hardened browser contexts.
      }
    });

    const response = await page.goto('/sample-blocks');
    if (response?.status() === 404) {
      await page.goto('/notes/sample-blocks');
    }
    await page.waitForLoadState('domcontentloaded');

    const rootTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );
    expect(rootTheme).not.toBe('dark');

    const expectedColors = await page.evaluate((tokens) => {
      const probe = document.createElement('div');
      probe.style.position = 'absolute';
      probe.style.pointerEvents = 'none';
      probe.style.visibility = 'hidden';
      document.body.append(probe);
      const colors = Object.fromEntries(
        tokens.map((token) => {
          probe.style.borderTop = `2px solid var(${token})`;
          return [token, getComputedStyle(probe).borderTopColor];
        }),
      );
      probe.remove();
      return colors;
    }, Array.from(new Set(blockHueTargets.map((target) => target.expectedToken))));

    const actualColors: string[] = [];

    for (const target of blockHueTargets) {
      const locator = page.locator(target.selector).first();
      await expect(locator, `${target.name} block exists`).toBeVisible({
        timeout: 10_000,
      });

      const topBorder = await readTopBorder(locator);
      expect(topBorder.width, `${target.name} top border width`).toBe('2px');
      expect(topBorder.style, `${target.name} top border style`).toBe('solid');
      expect(topBorder.color, `${target.name} top border color`).toBe(
        expectedColors[target.expectedToken],
      );
      actualColors.push(topBorder.color);
    }

    // callout and code intentionally share --accent-runnable per C.3-2 Decision 1.
    expect(new Set(actualColors).size).toBe(4);

    const archivePath = resolve(
      workspaceRoot,
      'docs/audits/screenshots/wave-5-c3-2-block-hues.png',
    );
    if (!existsSync(dirname(archivePath))) {
      mkdirSync(dirname(archivePath), { recursive: true });
    }
    await page.screenshot({ path: archivePath, fullPage: false });
    expect(statSync(archivePath).size).toBeGreaterThanOrEqual(5_000);
  });
});
