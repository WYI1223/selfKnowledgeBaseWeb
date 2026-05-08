import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { attachApiStub } from './api-stub';

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, '../../../../..');
const noteKey = 'skb-note:sample-mdx-note';
const slug = 'sample-mdx-note';

interface SerializedNoteState {
  mdxSource?: unknown;
  lastModified?: unknown;
  version?: unknown;
}

test.describe('C.4-4 save/load roundtrip (Wave 6 B.4 update — API primary)', () => {
  test('edit → 800ms debounce save → ApiAdapter POST observed → reload preserves content + version', async ({
    page,
  }) => {
    // Wave 6 B.4 wires the mount to ApiAdapter primary. Stub the API
    // with an in-memory store so this spec asserts against the same
    // bytes the real endpoint would persist, without mutating the
    // real fixture under content/notes/<slug>/.
    const apiStub = await attachApiStub(page);

    await page.addInitScript((storageKey) => {
      document.documentElement?.removeAttribute('data-theme');
      try {
        window.localStorage.removeItem('skb-theme');
        if (window.sessionStorage.getItem('skb-c4-4-cleared') !== 'true') {
          window.localStorage.removeItem(storageKey);
          window.sessionStorage.setItem('skb-c4-4-cleared', 'true');
        }
      } catch {
        // Storage can be unavailable in hardened browser contexts.
      }
    }, noteKey);

    await page.goto('/notes/sample-mdx-note/edit');
    const editor = page.locator('.ProseMirror').first();
    await expect(editor).toBeVisible({ timeout: 10_000 });

    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).not.toBe('dark');

    await editor.click();
    await page.keyboard.type(' Hello world');
    await expect(editor).toContainText('Hello world', { timeout: 5_000 });
    await page.waitForTimeout(1_000);

    const indicator = page.locator('[data-skb-save-indicator]').first();
    await expect(indicator).toContainText(/Saved/, { timeout: 5_000 });

    // Wave 6 B.4: assertion now reads the stub's in-memory store
    // (which the ApiAdapter POST writes to) rather than localStorage.
    // localStorage is reserved as a fallback ONLY on API failure.
    expect(apiStub.hasObservedPost()).toBe(true);
    const savedState = apiStub.read(slug) as SerializedNoteState | null;
    expect(savedState).not.toBeNull();
    expect(savedState?.version).toEqual(expect.any(Number));
    expect(savedState?.version as number).toBeGreaterThanOrEqual(2);
    expect(savedState?.mdxSource).toEqual(expect.stringContaining('Hello world'));

    // C.4-4 scope: NoteState shape change (layoutEpoch field add) is
    // explicitly out-of-scope per ADR-0018 line 464 接口冻结 (any NoteState
    // shape change requires ADR-0018 amendment + D2 row 4). layoutEpoch
    // sync deferred to a separate ADR-0018 amendment PR. C.4-4 verifies
    // existing NoteState (mdxSource + version + lastModified) save+reload
    // roundtrip only.

    await page.reload();
    await expect(editor).toBeVisible({ timeout: 10_000 });
    await expect(editor).toContainText('Hello world', { timeout: 10_000 });

    // After reload the stub's in-memory store survives (Page-scoped
    // route handler stays attached across reloads); ApiAdapter GET
    // returns the same NoteState the first session POSTed.
    const reloadedState = apiStub.read(slug) as SerializedNoteState | null;
    expect(reloadedState?.version).toBe(savedState?.version);
    expect(reloadedState?.mdxSource).toBe(savedState?.mdxSource);

    const archivePath = resolve(
      workspaceRoot,
      'docs/audits/screenshots/wave-5-c4-4-save-roundtrip.png',
    );
    if (!existsSync(dirname(archivePath))) mkdirSync(dirname(archivePath), { recursive: true });
    await page.screenshot({ path: archivePath, fullPage: false });
    expect(statSync(archivePath).size).toBeGreaterThanOrEqual(5_000);
  });
});
