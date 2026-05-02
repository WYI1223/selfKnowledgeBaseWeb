import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const appRoot = resolve(import.meta.dirname, '../..');
const searchHtmlPath = resolve(appRoot, 'dist/search/index.html');

describe('/search PageFind UI shell', () => {
  it('emits the PageFind mount point and canonical runtime references', () => {
    expect(existsSync(searchHtmlPath)).toBe(true);
    const html = readFileSync(searchHtmlPath, 'utf8');

    expect(html).toContain('<div id="search"');
    expect(html).toMatch(/\/pagefind\/(?:pagefind-ui|pagefind\.js)/);
    expect(html).not.toContain('/_pagefind/');
  }, 120_000);
});
