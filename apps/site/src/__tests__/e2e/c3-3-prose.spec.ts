import { expect, test, type Locator } from '@playwright/test';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, '../../../../..');

async function readStyles(locator: Locator, properties: string[]) {
  return locator.evaluate((element, names) => {
    const style = getComputedStyle(element);
    return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name)]));
  }, properties);
}

test.describe('C.3-3 prose typography', () => {
  test('.skb-prose affordances and body Inter typography render', async ({ page }) => {
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
    await page.evaluate(() => document.fonts.ready);

    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );
    expect(theme).not.toBe('dark');

    const bodyTypography = await page.evaluate(() => {
      const style = getComputedStyle(document.body);
      return {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        interLoaded: document.fonts.check('400 15px Inter'),
      };
    });
    expect(bodyTypography.fontFamily).toContain('Inter');
    expect(bodyTypography.fontSize).toBe('15px');
    expect(bodyTypography.interLoaded).toBe(true);

    await page.evaluate(() => {
      const prose = document.querySelector('.skb-prose');
      if (!prose) throw new Error('.skb-prose wrapper missing');
      prose.insertAdjacentHTML(
        'afterbegin',
        `<blockquote data-prose-target="native-quote">Native quote</blockquote>
         <p data-prose-target="native-p">
           Paragraph <code data-prose-target="inline-code">inline()</code>
           <mark data-prose-target="mark">marked</mark>
           <a class="aref" href="#anchor" data-prose-target="aref">anchor</a>
         </p>
         <div class="b-quote" data-prose-target="b-quote">Class quote</div>
         <aside class="b-callout" data-prose-target="b-callout">Class callout</aside>
         <pre class="b-code" data-prose-target="b-code"><code><span class="kw">function</span> <span class="fn">run</span>() <span class="cm">// note</span></code></pre>`,
      );
    });

    const nativeQuote = page.locator('[data-prose-target="native-quote"]');
    await expect(nativeQuote).toBeVisible();
    const quoteStyles = await readStyles(nativeQuote, [
      'border-left-width',
      'border-left-style',
      'padding-left',
    ]);
    expect(quoteStyles['border-left-width']).toBe('3px');
    expect(quoteStyles['border-left-style']).toBe('solid');
    expect(quoteStyles['padding-left']).toBe('12px');

    const inlineCode = page.locator('[data-prose-target="inline-code"]');
    const inlineCodeStyles = await readStyles(inlineCode, ['font-family']);
    expect(inlineCodeStyles['font-family']).toContain('JetBrains Mono');

    const classTargets = {
      quote: page.locator('[data-prose-target="b-quote"]'),
      callout: page.locator('[data-prose-target="b-callout"]'),
      code: page.locator('[data-prose-target="b-code"]'),
      aref: page.locator('[data-prose-target="aref"]'),
    };
    await expect(classTargets.quote).toBeVisible();
    await expect(classTargets.callout).toBeVisible();
    await expect(classTargets.code).toBeVisible();
    await expect(classTargets.aref).toBeVisible();

    const calloutStyles = await readStyles(classTargets.callout, [
      'background-color',
      'border-top-style',
    ]);
    expect(calloutStyles['background-color']).not.toBe('rgba(0, 0, 0, 0)');
    expect(calloutStyles['border-top-style']).toBe('solid');

    const codeStyles = await readStyles(classTargets.code, ['font-family', 'font-size']);
    expect(codeStyles['font-family']).toContain('JetBrains Mono');
    expect(codeStyles['font-size']).toBe('12.5px');

    const arefBefore = await classTargets.aref.evaluate((element) =>
      getComputedStyle(element, '::before').content,
    );
    expect(arefBefore).toContain('↗');

    const archivePath = resolve(
      workspaceRoot,
      'docs/audits/screenshots/wave-5-c3-3-prose.png',
    );
    if (!existsSync(dirname(archivePath))) {
      mkdirSync(dirname(archivePath), { recursive: true });
    }
    await page.screenshot({ path: archivePath, fullPage: false });
    expect(statSync(archivePath).size).toBeGreaterThanOrEqual(5_000);
  });
});
